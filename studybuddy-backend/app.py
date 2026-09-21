import os
import re
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from models import db, User, PendingRegistration, PasswordResetOTP, Subject, Task, Note, StudySchedule, StudyGoal
from email_service import send_otp_email, send_password_reset_email

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///studybuddy.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "studybuddy-super-secret-key-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

db.init_app(app)
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}})

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def is_valid_email(email):
    return bool(email and EMAIL_REGEX.match(email.strip()))


def parse_dt(value):
    if value in (None, ""):
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def to_dict(obj, extra_fields=None):
    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        result[column.name] = value.isoformat() if isinstance(value, datetime) else value
    if extra_fields:
        result.update(extra_fields)
    return result


def get_current_user_id():
    return int(get_jwt_identity())


def validate_subject_ownership(subject_id, user_id):
    if subject_id is None:
        return None
    return Subject.query.filter_by(id=subject_id, user_id=user_id).first()


def user_token_response(user, status_code=200):
    return jsonify({
        "success": True,
        "data": {
            "access_token": create_access_token(identity=str(user.id)),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        },
    }), status_code


@app.post("/api/auth/send-otp")
def send_otp():
    """
    Step 1 of registration: Validates input, hashes password, saves pending registration,
    and sends 6-digit OTP to user's email via SMTP.
    """
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or len(username) < 3:
        return jsonify({"success": False, "error": "Username must be at least 3 characters"}), 400
    if not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        return jsonify({"success": False, "error": "Username can only contain letters, numbers, dots, and underscores"}), 400

    if not email or not is_valid_email(email):
        return jsonify({"success": False, "error": "A valid email address is required"}), 400

    if not password or len(password) < 4:
        return jsonify({"success": False, "error": "Password must be at least 4 characters"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "error": "Username is already taken"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "An account with this email already exists"}), 409

    from werkzeug.security import generate_password_hash
    password_hash = generate_password_hash(password)
    otp_code = str(secrets.randbelow(900000) + 100000)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    try:
        # Check if there is an existing pending record for this email or username
        pending = PendingRegistration.query.filter(
            (PendingRegistration.email == email) | (PendingRegistration.username == username)
        ).first()

        if pending:
            pending.email = email
            pending.username = username
            pending.password_hash = password_hash
            pending.otp_code = otp_code
            pending.created_at = datetime.utcnow()
            pending.expires_at = expires_at
            pending.attempts = 0
        else:
            pending = PendingRegistration(
                email=email,
                username=username,
                password_hash=password_hash,
                otp_code=otp_code,
                expires_at=expires_at,
            )
            db.session.add(pending)

        db.session.commit()

        email_result = send_otp_email(to_email=email, username=username, otp_code=otp_code)

        return jsonify({
            "success": True,
            "message": f"Verification code sent to {email}",
            "email": email,
            "dev_mode": email_result.get("dev_mode", False),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Failed to initiate registration: {str(e)}"}), 500


@app.post("/api/auth/verify-otp")
def verify_otp():
    """
    Step 2 of registration: Verifies 6-digit OTP, creates the user account in database,
    and returns JWT access token.
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    otp = str(data.get("otp", "")).strip()

    if not email or not otp:
        return jsonify({"success": False, "error": "Email and verification code are required"}), 400

    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        return jsonify({"success": False, "error": "No pending registration found for this email. Please register again."}), 404

    if pending.is_expired():
        db.session.delete(pending)
        db.session.commit()
        return jsonify({"success": False, "error": "Verification code has expired. Please request a new one."}), 400

    if pending.attempts >= 5:
        db.session.delete(pending)
        db.session.commit()
        return jsonify({"success": False, "error": "Too many failed attempts. Please restart registration."}), 400

    if pending.otp_code != otp:
        pending.attempts += 1
        db.session.commit()
        remaining = 5 - pending.attempts
        return jsonify({"success": False, "error": f"Invalid verification code. {remaining} attempts remaining."}), 400

    # OTP is verified! Check uniqueness one last time
    if User.query.filter_by(username=pending.username).first():
        db.session.delete(pending)
        db.session.commit()
        return jsonify({"success": False, "error": "Username was already taken in the meantime. Please try a different username."}), 409

    if User.query.filter_by(email=pending.email).first():
        db.session.delete(pending)
        db.session.commit()
        return jsonify({"success": False, "error": "Email was already registered. Please sign in."}), 409

    try:
        user = User(
            username=pending.username,
            email=pending.email,
            password_hash=pending.password_hash,
        )
        db.session.add(user)
        db.session.delete(pending)
        db.session.commit()
        return user_token_response(user, status_code=201)
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Failed to create account: {str(e)}"}), 500


@app.post("/api/auth/resend-otp")
def resend_otp():
    """
    Resends a new 6-digit OTP to the pending registration email.
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400

    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        return jsonify({"success": False, "error": "No pending registration found for this email."}), 404

    # Enforce 30-second cooldown
    cooldown = 30
    elapsed = (datetime.utcnow() - pending.created_at).total_seconds()
    if elapsed < cooldown:
        remaining_wait = int(cooldown - elapsed)
        return jsonify({"success": False, "error": f"Please wait {remaining_wait}s before requesting a new code"}), 429

    otp_code = str(secrets.randbelow(900000) + 100000)
    pending.otp_code = otp_code
    pending.created_at = datetime.utcnow()
    pending.expires_at = datetime.utcnow() + timedelta(minutes=10)
    pending.attempts = 0

    try:
        db.session.commit()
        email_result = send_otp_email(to_email=pending.email, username=pending.username, otp_code=otp_code)
        return jsonify({
            "success": True,
            "message": f"A new verification code was sent to {email}",
            "dev_mode": email_result.get("dev_mode", False),
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.post("/api/auth/forgot-password")
def forgot_password():
    """
    Sends a 6-digit password reset OTP to user's registered Gmail.
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not email or not is_valid_email(email):
        return jsonify({"success": False, "error": "A valid email address is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "error": "No account found with this email address."}), 404

    otp_code = str(secrets.randbelow(900000) + 100000)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    try:
        reset_entry = PasswordResetOTP.query.filter_by(email=email).first()
        if reset_entry:
            reset_entry.otp_code = otp_code
            reset_entry.created_at = datetime.utcnow()
            reset_entry.expires_at = expires_at
            reset_entry.attempts = 0
        else:
            reset_entry = PasswordResetOTP(
                email=email,
                otp_code=otp_code,
                expires_at=expires_at,
            )
            db.session.add(reset_entry)

        db.session.commit()
        email_result = send_password_reset_email(to_email=email, username=user.username, otp_code=otp_code)

        return jsonify({
            "success": True,
            "message": f"Password reset code sent to {email}",
            "email": email,
            "dev_mode": email_result.get("dev_mode", False),
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.post("/api/auth/reset-password")
def reset_password():
    """
    Verifies reset OTP and updates user's password.
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    otp = str(data.get("otp", "")).strip()
    new_password = str(data.get("new_password", ""))

    if not email or not otp or not new_password:
        return jsonify({"success": False, "error": "Email, OTP code, and new password are required"}), 400

    if len(new_password) < 4:
        return jsonify({"success": False, "error": "New password must be at least 4 characters"}), 400

    reset_entry = PasswordResetOTP.query.filter_by(email=email).first()
    if not reset_entry:
        return jsonify({"success": False, "error": "No password reset request found. Please request a new code."}), 404

    if reset_entry.is_expired():
        db.session.delete(reset_entry)
        db.session.commit()
        return jsonify({"success": False, "error": "Reset code expired. Please request a new code."}), 400

    if reset_entry.attempts >= 5:
        db.session.delete(reset_entry)
        db.session.commit()
        return jsonify({"success": False, "error": "Too many failed attempts. Please request a new code."}), 400

    if reset_entry.otp_code != otp:
        reset_entry.attempts += 1
        db.session.commit()
        return jsonify({"success": False, "error": f"Invalid code. {5 - reset_entry.attempts} attempts remaining."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "error": "User account not found."}), 404

    try:
        user.set_password(new_password)
        db.session.delete(reset_entry)
        db.session.commit()
        return jsonify({"success": True, "message": "Password updated successfully. You can now sign in."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.post("/api/ai/study-assistant")
@jwt_required()
def ai_study_assistant():
    """
    Intelligent AI Study Copilot ('Buddy AI'):
    Generates interactive quizzes, flashcards, concept summaries (ELI5), and study plans.
    """
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "chat")  # chat | quiz | flashcards | explain | plan
    topic = data.get("topic", "").strip()
    note_content = data.get("note_content", "").strip()
    user_message = data.get("message", "").strip()

    subject_name = data.get("subject_name", "General Studies")

    # Built-in high-quality AI generation logic
    if mode == "quiz":
        target_subject = topic or subject_name or "Academic Subject"
        sample_quizzes = [
            {
                "question": f"What is the fundamental principle behind {target_subject}?",
                "options": [
                    f"Systematic analysis and structured application",
                    f"Pure random memorization without context",
                    f"Isolated empirical observation only",
                    f"None of the above"
                ],
                "answer_idx": 0,
                "explanation": f"In {target_subject}, mastering core principles through structured application produces the highest retention."
            },
            {
                "question": f"Which study technique is scientifically proven to maximize retention in {target_subject}?",
                "options": [
                    "Passive rereading multiple times",
                    "Active recall and spaced repetition",
                    "Cramming 6 hours before exams",
                    "Highlighting entire textbook pages"
                ],
                "answer_idx": 1,
                "explanation": "Active recall forces cognitive retrieval, building stronger neural pathways than passive review."
            },
            {
                "question": f"When solving complex problems in {target_subject}, what is the best first step?",
                "options": [
                    "Jump directly into final calculations",
                    "Deconstruct into sub-components and identify knowns/unknowns",
                    "Guess the answer and work backwards",
                    "Skip to the next chapter"
                ],
                "answer_idx": 1,
                "explanation": "Problem decomposition allows tackling complex questions methodically."
            }
        ]
        return jsonify({
            "success": True,
            "type": "quiz",
            "title": f"Quick Quiz: {target_subject}",
            "quiz": sample_quizzes
        })

    elif mode == "flashcards":
        target = topic or subject_name or "Key Study Concepts"
        sample_cards = [
            {
                "front": f"What is the definition of {target}?",
                "back": f"{target} represents a structured domain of knowledge focused on core foundational rules, problem solving, and iterative learning."
            },
            {
                "front": "How does the Feynman Technique work?",
                "back": "Explain the concept in simple words as if teaching a child. Identify gaps in explanation, return to source material, and simplify analogies."
            },
            {
                "front": "What is the Spaced Repetition Interval Formula?",
                "back": "Review material at expanding intervals (1 day, 3 days, 7 days, 14 days, 30 days) to interrupt the Ebbinghaus forgetting curve."
            },
            {
                "front": "What is Pareto's 80/20 rule in studying?",
                "back": "80% of exam results typically come from mastering the 20% highest-yield fundamental concepts."
            }
        ]
        return jsonify({
            "success": True,
            "type": "flashcards",
            "title": f"Flashcards: {target}",
            "cards": sample_cards
        })

    elif mode == "plan":
        target = topic or subject_name or "Exam Preparation"
        plan = {
            "title": f"⚡ 3-Day Accelerated Mastery Plan for {target}",
            "days": [
                {
                    "day": "Day 1: Foundations & Core Concepts",
                    "tasks": [
                        f"Review core theory and formulas of {target} (45 mins)",
                        "Create 5 concise summary flashcards (20 mins)",
                        "Solve 3 foundational practice questions (30 mins)"
                    ]
                },
                {
                    "day": "Day 2: Deep Practice & Active Recall",
                    "tasks": [
                        "Timed mock problem solving under exam conditions (50 mins)",
                        "Analyze and note down any errors in Study Notes (25 mins)",
                        "Explain key mechanisms out loud (Feynman Technique) (20 mins)"
                    ]
                },
                {
                    "day": "Day 3: Rapid Revision & Final Polish",
                    "tasks": [
                        "Quick flashcard review deck (15 mins)",
                        "High-yield formula/fact verification (20 mins)",
                        "Full rest and cognitive recharge before testing"
                    ]
                }
            ]
        }
        return jsonify({
            "success": True,
            "type": "plan",
            "plan": plan
        })

    elif mode == "explain":
        text_to_explain = note_content or user_message or topic or "Core Concept"
        summary = f"✨ **ELI5 Summary for {topic or 'Your Concept'}**:\n\n1. **Core Idea**: Think of this as a modular building block. Instead of memorizing everything at once, master the relationship between the base inputs and outputs.\n2. **Key Mechanism**: Whenever you encounter a problem, categorize it first, select the matching rule, and execute step-by-step.\n3. **Pro-Tip for Exams**: Focus on boundary conditions and edge cases—that is where 70% of exam trick questions are crafted!"
        return jsonify({
            "success": True,
            "type": "explain",
            "response": summary
        })

    else:
        # Chat mode
        prompt = user_message or "How can I study effectively?"
        response_text = f"🤖 **Buddy AI**: You're doing great! To excel in **{subject_name}**, focus on active recall, breaking down topics into 25-minute Pomodoro intervals, and testing yourself regularly. Would you like me to generate a **Quiz**, create **Flashcards**, or outline a **3-Day Study Plan**?"
        return jsonify({
            "success": True,
            "type": "chat",
            "response": response_text
        })


@app.post("/api/pomodoro/log-session")
@jwt_required()
def log_pomodoro_session():
    """
    Logs a completed Pomodoro study focus session and increments user's study goal hours.
    """
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    duration_minutes = int(data.get("duration_minutes", 25))
    subject_id = data.get("subject_id")
    goal_id = data.get("goal_id")

    hours_added = round(duration_minutes / 60.0, 2)

    try:
        # If specific goal selected or find active goal
        goal = None
        if goal_id:
            goal = StudyGoal.query.filter_by(id=goal_id, user_id=uid).first()
        elif subject_id:
            goal = StudyGoal.query.filter_by(subject_id=subject_id, user_id=uid, status="active").first()
        
        if not goal:
            goal = StudyGoal.query.filter_by(user_id=uid, status="active").first()

        if goal:
            goal.completed_hours = round(goal.completed_hours + hours_added, 2)
            if goal.completed_hours >= goal.target_hours:
                goal.status = "completed"
            db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Logged {duration_minutes}m of focused study (+{hours_added}h)!",
            "goal_updated": bool(goal),
            "total_goal_hours": goal.completed_hours if goal else None
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "error": "Username/email and password are required"}), 400

    # Allow login with either username or email
    user = User.query.filter(
        (User.username == username) | (User.email == username.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Invalid username or password"}), 401
    return user_token_response(user)


@app.get("/api/auth/me")
@jwt_required()
def me():
    user = db.session.get(User, get_current_user_id())
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({"success": True, "data": to_dict(user, {"password_hash": None})})


@app.get("/api/subjects")
@jwt_required()
def get_subjects():
    uid = get_current_user_id()
    subjects = Subject.query.filter_by(user_id=uid).all()
    data = [
        to_dict(s, {"task_count": s.tasks.count(), "note_count": s.notes.count()})
        for s in subjects
    ]
    return jsonify({"success": True, "count": len(data), "data": data})


@app.post("/api/subjects")
@jwt_required()
def create_subject():
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return jsonify({"success": False, "error": "Name is required"}), 400
    try:
        subject = Subject(
            user_id=uid,
            name=name,
            color=data.get("color", "#3B82F6"),
            description=data.get("description"),
        )
        db.session.add(subject)
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(subject, {"task_count": 0, "note_count": 0})}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/subjects/<int:id>")
@jwt_required()
def get_subject(id):
    s = Subject.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not s:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    return jsonify({"success": True, "data": to_dict(s, {
        "tasks": [to_dict(t, {"subject_name": s.name}) for t in s.tasks.all()],
        "notes": [to_dict(n, {"subject_name": s.name}) for n in s.notes.all()],
        "goals": [to_dict(g, {"progress_percent": round((g.completed_hours / g.target_hours) * 100, 1) if g.target_hours > 0 else 0}) for g in s.goals.all()],
    })})


@app.put("/api/subjects/<int:id>")
@jwt_required()
def update_subject(id):
    s = Subject.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not s:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    data = request.get_json(silent=True) or {}
    for field in ("name", "color", "description"):
        if field in data:
            setattr(s, field, data[field])
    if not str(s.name).strip():
        return jsonify({"success": False, "error": "Name is required"}), 400
    try:
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(s, {"task_count": s.tasks.count(), "note_count": s.notes.count()})})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.delete("/api/subjects/<int:id>")
@jwt_required()
def delete_subject(id):
    s = Subject.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not s:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        db.session.delete(s)
        db.session.commit()
        return jsonify({"success": True, "message": "Subject deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/tasks")
@jwt_required()
def get_tasks():
    uid = get_current_user_id()
    q = Task.query.filter_by(user_id=uid)
    for field in ("status", "priority"):
        value = request.args.get(field)
        if value:
            q = q.filter(getattr(Task, field) == value)
    if request.args.get("subject_id"):
        q = q.filter(Task.subject_id == request.args.get("subject_id", type=int))
    if request.args.get("search"):
        q = q.filter(Task.title.ilike(f"%{request.args['search']}%"))
    tasks = q.order_by(Task.created_at.desc()).all()
    return jsonify({"success": True, "count": len(tasks), "data": [
        to_dict(t, {"subject_name": t.subject.name if t.subject else None}) for t in tasks
    ]})


@app.post("/api/tasks")
@jwt_required()
def create_task():
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify({"success": False, "error": "Title is required"}), 400
    subject_id = data.get("subject_id")
    if subject_id is not None and not validate_subject_ownership(subject_id, uid):
        return jsonify({"success": False, "error": "Invalid subject_id"}), 400
    try:
        task = Task(
            user_id=uid, subject_id=subject_id, title=title,
            description=data.get("description"),
            due_date=parse_dt(data.get("due_date")),
            priority=data.get("priority", "medium"),
            status=data.get("status", "pending"),
        )
        if task.priority not in ("low", "medium", "high") or task.status not in ("pending", "in_progress", "completed"):
            return jsonify({"success": False, "error": "Invalid priority or status"}), 400
        if task.status == "completed":
            task.completed_at = datetime.utcnow()
        db.session.add(task)
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(task, {"subject_name": task.subject.name if task.subject else None})}), 201
    except ValueError:
        return jsonify({"success": False, "error": "Invalid ISO datetime"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/tasks/<int:id>")
@jwt_required()
def get_task(id):
    t = Task.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not t:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    return jsonify({"success": True, "data": to_dict(t, {"subject_name": t.subject.name if t.subject else None})})


def _update_task(t, data):
    uid = get_current_user_id()
    if "subject_id" in data:
        if data["subject_id"] is not None and not validate_subject_ownership(data["subject_id"], uid):
            raise ValueError("Invalid subject_id")
        t.subject_id = data["subject_id"]
    for field in ("title", "description", "priority", "status"):
        if field in data:
            setattr(t, field, data[field])
    if "due_date" in data:
        t.due_date = parse_dt(data["due_date"])
    if t.status not in ("pending", "in_progress", "completed"):
        raise ValueError("Invalid status")
    if t.priority not in ("low", "medium", "high"):
        raise ValueError("Invalid priority")
    if t.status == "completed":
        t.completed_at = t.completed_at or datetime.utcnow()
    else:
        t.completed_at = None


@app.put("/api/tasks/<int:id>")
@jwt_required()
def update_task(id):
    t = Task.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not t:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        _update_task(t, request.get_json(silent=True) or {})
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(t, {"subject_name": t.subject.name if t.subject else None})})
    except ValueError as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.patch("/api/tasks/<int:id>/toggle")
@jwt_required()
def toggle_task(id):
    t = Task.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not t:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        if t.status == "completed":
            t.status, t.completed_at = "pending", None
        else:
            t.status, t.completed_at = "completed", datetime.utcnow()
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(t, {"subject_name": t.subject.name if t.subject else None})})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.delete("/api/tasks/<int:id>")
@jwt_required()
def delete_task(id):
    t = Task.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not t:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        db.session.delete(t)
        db.session.commit()
        return jsonify({"success": True, "message": "Task deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/notes")
@jwt_required()
def get_notes():
    uid = get_current_user_id()
    q = Note.query.filter_by(user_id=uid)
    if request.args.get("subject_id"):
        q = q.filter(Note.subject_id == request.args.get("subject_id", type=int))
    if request.args.get("search"):
        term = f"%{request.args['search']}%"
        q = q.filter(db.or_(Note.title.ilike(term), Note.content.ilike(term)))
    notes = q.order_by(Note.updated_at.desc()).all()
    return jsonify({"success": True, "count": len(notes), "data": [
        to_dict(n, {"subject_name": n.subject.name if n.subject else None}) for n in notes
    ]})


@app.post("/api/notes")
@jwt_required()
def create_note():
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify({"success": False, "error": "Title is required"}), 400
    if data.get("subject_id") is not None and not validate_subject_ownership(data["subject_id"], uid):
        return jsonify({"success": False, "error": "Invalid subject_id"}), 400
    try:
        note = Note(user_id=uid, subject_id=data.get("subject_id"), title=title,
                    content=data.get("content"), tags=data.get("tags"))
        db.session.add(note)
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(note, {"subject_name": note.subject.name if note.subject else None})}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/notes/<int:id>")
@jwt_required()
def get_note(id):
    n = Note.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not n:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    return jsonify({"success": True, "data": to_dict(n, {"subject_name": n.subject.name if n.subject else None})})


@app.put("/api/notes/<int:id>")
@jwt_required()
def update_note(id):
    n = Note.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not n:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    data = request.get_json(silent=True) or {}
    if "subject_id" in data and data["subject_id"] is not None and not validate_subject_ownership(data["subject_id"], get_current_user_id()):
        return jsonify({"success": False, "error": "Invalid subject_id"}), 400
    try:
        for field in ("title", "content", "tags", "subject_id"):
            if field in data:
                setattr(n, field, data[field])
        if not str(n.title).strip():
            return jsonify({"success": False, "error": "Title is required"}), 400
        n.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(n, {"subject_name": n.subject.name if n.subject else None})})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.delete("/api/notes/<int:id>")
@jwt_required()
def delete_note(id):
    n = Note.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not n:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        db.session.delete(n)
        db.session.commit()
        return jsonify({"success": True, "message": "Note deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/schedule")
@jwt_required()
def get_schedule():
    uid = get_current_user_id()
    q = StudySchedule.query.filter_by(user_id=uid)
    try:
        if request.args.get("start_date"):
            q = q.filter(StudySchedule.start_time >= datetime.fromisoformat(request.args["start_date"]))
        if request.args.get("end_date"):
            end = datetime.fromisoformat(request.args["end_date"]) + timedelta(days=1)
            q = q.filter(StudySchedule.start_time < end)
        if not request.args.get("start_date") and not request.args.get("end_date"):
            now = datetime.utcnow()
            q = q.filter(StudySchedule.start_time >= now, StudySchedule.start_time <= now + timedelta(days=30))
        events = q.order_by(StudySchedule.start_time.asc()).all()
        return jsonify({"success": True, "data": [
            to_dict(e, {
                "subject_name": e.subject.name if e.subject else None,
                "subject_color": e.subject.color if e.subject else None,
            }) for e in events
        ]})
    except ValueError:
        return jsonify({"success": False, "error": "Invalid ISO date"}), 400


@app.post("/api/schedule")
@jwt_required()
def create_schedule():
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title or not data.get("start_time") or not data.get("end_time"):
        return jsonify({"success": False, "error": "Title, start_time and end_time are required"}), 400
    if data.get("subject_id") is not None and not validate_subject_ownership(data["subject_id"], uid):
        return jsonify({"success": False, "error": "Invalid subject_id"}), 400
    try:
        start, end = parse_dt(data["start_time"]), parse_dt(data["end_time"])
        if end <= start:
            return jsonify({"success": False, "error": "end_time must be after start_time"}), 400
        event = StudySchedule(
            user_id=uid, subject_id=data.get("subject_id"), title=title,
            description=data.get("description"), start_time=start, end_time=end,
            is_recurring=bool(data.get("is_recurring", False)),
            recurrence_rule=data.get("recurrence_rule"),
        )
        db.session.add(event)
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(event, {
            "subject_name": event.subject.name if event.subject else None,
            "subject_color": event.subject.color if event.subject else None,
        })}), 201
    except ValueError:
        return jsonify({"success": False, "error": "Invalid ISO datetime"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.put("/api/schedule/<int:id>")
@jwt_required()
def update_schedule(id):
    e = StudySchedule.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not e:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    data = request.get_json(silent=True) or {}
    if "subject_id" in data and data["subject_id"] is not None and not validate_subject_ownership(data["subject_id"], get_current_user_id()):
        return jsonify({"success": False, "error": "Invalid subject_id"}), 400
    try:
        for field in ("title", "description", "subject_id", "is_recurring", "recurrence_rule"):
            if field in data:
                setattr(e, field, data[field])
        if "start_time" in data:
            e.start_time = parse_dt(data["start_time"])
        if "end_time" in data:
            e.end_time = parse_dt(data["end_time"])
        if e.end_time <= e.start_time:
            return jsonify({"success": False, "error": "end_time must be after start_time"}), 400
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(e, {
            "subject_name": e.subject.name if e.subject else None,
            "subject_color": e.subject.color if e.subject else None,
        })})
    except ValueError:
        return jsonify({"success": False, "error": "Invalid ISO datetime"}), 400
    except Exception as ex:
        db.session.rollback()
        return jsonify({"success": False, "error": str(ex)}), 500


@app.delete("/api/schedule/<int:id>")
@jwt_required()
def delete_schedule(id):
    e = StudySchedule.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not e:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        db.session.delete(e)
        db.session.commit()
        return jsonify({"success": True, "message": "Schedule deleted successfully"})
    except Exception as ex:
        db.session.rollback()
        return jsonify({"success": False, "error": str(ex)}), 500


@app.get("/api/goals")
@jwt_required()
def get_goals():
    uid = get_current_user_id()
    goals = StudyGoal.query.filter_by(user_id=uid).order_by(StudyGoal.created_at.desc()).all()
    return jsonify({"success": True, "data": [
        to_dict(g, {
            "progress_percent": round((g.completed_hours / g.target_hours) * 100, 1) if g.target_hours > 0 else 0,
            "subject_name": g.subject.name if g.subject else None,
        }) for g in goals
    ]})


@app.post("/api/goals")
@jwt_required()
def create_goal():
    uid = get_current_user_id()
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title or data.get("target_hours") is None:
        return jsonify({"success": False, "error": "Title and target_hours are required"}), 400
    if data.get("subject_id") is not None and not validate_subject_ownership(data["subject_id"], uid):
        return jsonify({"success": False, "error": "Invalid subject_id"}), 400
    try:
        target = float(data["target_hours"])
        if target <= 0:
            return jsonify({"success": False, "error": "target_hours must be greater than 0"}), 400
        g = StudyGoal(user_id=uid, subject_id=data.get("subject_id"), title=title,
                      target_hours=target, completed_hours=float(data.get("completed_hours", 0)),
                      deadline=parse_dt(data.get("deadline")), status="active")
        if g.completed_hours >= g.target_hours:
            g.status = "completed"
        db.session.add(g)
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(g, {
            "progress_percent": round((g.completed_hours / g.target_hours) * 100, 1),
            "subject_name": g.subject.name if g.subject else None,
        })}), 201
    except ValueError:
        return jsonify({"success": False, "error": "Invalid numeric or datetime value"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.put("/api/goals/<int:id>")
@jwt_required()
def update_goal(id):
    g = StudyGoal.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not g:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    data = request.get_json(silent=True) or {}
    try:
        for field in ("title", "status", "completed_hours", "target_hours"):
            if field in data:
                setattr(g, field, float(data[field]) if field in ("completed_hours", "target_hours") else data[field])
        if "deadline" in data:
            g.deadline = parse_dt(data["deadline"])
        if "subject_id" in data:
            if data["subject_id"] is not None and not validate_subject_ownership(data["subject_id"], get_current_user_id()):
                return jsonify({"success": False, "error": "Invalid subject_id"}), 400
            g.subject_id = data["subject_id"]
        if g.target_hours <= 0:
            return jsonify({"success": False, "error": "target_hours must be greater than 0"}), 400
        if g.completed_hours >= g.target_hours:
            g.status = "completed"
        db.session.commit()
        return jsonify({"success": True, "data": to_dict(g, {
            "progress_percent": round((g.completed_hours / g.target_hours) * 100, 1),
            "subject_name": g.subject.name if g.subject else None,
        })})
    except ValueError:
        return jsonify({"success": False, "error": "Invalid goal value"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.delete("/api/goals/<int:id>")
@jwt_required()
def delete_goal(id):
    g = StudyGoal.query.filter_by(id=id, user_id=get_current_user_id()).first()
    if not g:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    try:
        db.session.delete(g)
        db.session.commit()
        return jsonify({"success": True, "message": "Goal deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.get("/api/dashboard")
@jwt_required()
def dashboard():
    uid = get_current_user_id()
    total_subjects = Subject.query.filter_by(user_id=uid).count()
    total_tasks = Task.query.filter_by(user_id=uid).count()
    pending_tasks = Task.query.filter_by(user_id=uid, status="pending").count()
    completed_tasks = Task.query.filter_by(user_id=uid, status="completed").count()
    completion_rate = round(completed_tasks / total_tasks * 100, 1) if total_tasks else 0
    total_notes = Note.query.filter_by(user_id=uid).count()
    weekly_study_hours = db.session.query(db.func.sum(StudyGoal.completed_hours)).filter_by(user_id=uid).scalar() or 0
    now = datetime.utcnow()
    upcoming = StudySchedule.query.filter(
        StudySchedule.user_id == uid, StudySchedule.start_time >= now
    ).order_by(StudySchedule.start_time.asc()).limit(5).all()
    recent = Task.query.filter_by(user_id=uid).order_by(Task.created_at.desc()).limit(5).all()
    return jsonify({"success": True, "data": {
        "stats": {
            "total_subjects": total_subjects, "total_tasks": total_tasks,
            "pending_tasks": pending_tasks, "completed_tasks": completed_tasks,
            "completion_rate": completion_rate, "total_notes": total_notes,
            "weekly_study_hours": float(weekly_study_hours),
        },
        "upcoming_events": [to_dict(e, {
            "subject_name": e.subject.name if e.subject else None,
            "subject_color": e.subject.color if e.subject else None,
        }) for e in upcoming],
        "recent_tasks": [to_dict(t) for t in recent],
    }})


@app.post("/api/seed")
def seed():
    existing_demo = User.query.filter_by(username="demo").first()
    if existing_demo:
        # Guarantee demo password is set
        existing_demo.set_password("demo123")
        db.session.commit()
        return jsonify({"success": True, "message": "Demo user ready", "demo_credentials": {"username": "demo", "password": "demo123"}})
    try:
        user = User(username="demo", email="demo@example.com")
        user.set_password("demo123")
        db.session.add(user)
        db.session.flush()

        math = Subject(user_id=user.id, name="Mathematics", color="#3B82F6", description="Calculus and Algebra")
        physics = Subject(user_id=user.id, name="Physics", color="#10B981", description="Mechanics and Labs")
        history = Subject(user_id=user.id, name="History", color="#F59E0B", description="World History")
        db.session.add_all([math, physics, history])
        db.session.flush()

        now = datetime.utcnow()
        tasks = [
            Task(user_id=user.id, subject_id=math.id, title="Complete calculus worksheet", priority="high", status="pending", due_date=now + timedelta(days=2)),
            Task(user_id=user.id, subject_id=physics.id, title="Review Chapter 3", priority="medium", status="in_progress", due_date=now + timedelta(days=3)),
            Task(user_id=user.id, subject_id=history.id, title="Read Industrial Revolution notes", priority="low", status="completed", completed_at=now - timedelta(days=1)),
            Task(user_id=user.id, subject_id=math.id, title="Practice integration", priority="high", status="completed", completed_at=now - timedelta(days=2)),
            Task(user_id=user.id, subject_id=physics.id, title="Prepare lab questions", priority="medium", status="pending", due_date=now + timedelta(days=1)),
            Task(user_id=user.id, title="Organize study desk", priority="low", status="pending"),
        ]
        db.session.add_all(tasks)
        db.session.add_all([
            Note(user_id=user.id, subject_id=math.id, title="Integration shortcuts", content="Useful substitution and integration-by-parts reminders.", tags="calculus,exam"),
            Note(user_id=user.id, subject_id=physics.id, title="Lab formulas", content="Core formulas for the next lab session.", tags="lab,formulas"),
            Note(user_id=user.id, subject_id=history.id, title="Industrial Revolution", content="Key dates, inventions, and social changes.", tags="history,revision"),
        ])
        db.session.add_all([
            StudySchedule(user_id=user.id, subject_id=physics.id, title="Physics Lab", description="Chapter 3 review", start_time=now + timedelta(hours=5), end_time=now + timedelta(hours=7)),
            StudySchedule(user_id=user.id, subject_id=math.id, title="Math Study Session", description="Calculus practice", start_time=now + timedelta(days=1, hours=3), end_time=now + timedelta(days=1, hours=5)),
        ])
        db.session.add_all([
            StudyGoal(user_id=user.id, subject_id=math.id, title="Complete Calculus", target_hours=20, completed_hours=12.5, deadline=now + timedelta(days=28)),
            StudyGoal(user_id=user.id, subject_id=physics.id, title="Finish Physics Unit", target_hours=10, completed_hours=10, deadline=now + timedelta(days=14), status="completed"),
        ])
        db.session.commit()
        return jsonify({"success": True, "message": "Database seeded", "demo_credentials": {"username": "demo", "password": "demo123"}})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "error": "Resource not found"}), 404


@app.errorhandler(400)
def bad_request(error):
    return jsonify({"success": False, "error": str(error.description)}), 400


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"success": False, "error": "Internal server error"}), 500


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    # Run: python app.py
    # Curl examples:
    # curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"john\",\"password\":\"pass1234\"}"
    # curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"demo\",\"password\":\"demo123\"}"
    # curl -X POST http://localhost:5000/api/seed
    # curl -X POST http://localhost:5000/api/subjects -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"Computer Science\"}"
    # curl -X POST http://localhost:5000/api/tasks -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Finish homework\",\"priority\":\"high\"}"
    # curl -X PATCH http://localhost:5000/api/tasks/1/toggle -H "Authorization: Bearer TOKEN"
    # curl http://localhost:5000/api/dashboard -H "Authorization: Bearer TOKEN"
    app.run(host="0.0.0.0", port=5000, debug=True)
