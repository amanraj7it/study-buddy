from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Gamification & Freemium tier support for Education Chest
    reputation_points = db.Column(db.Integer, default=0)
    badge = db.Column(db.String(60), default="Study Buddy")
    tier = db.Column(db.String(20), default="free")  # 'free' or 'supporter'
    preferred_parent_language = db.Column(db.String(10), default="en")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def update_badge(self):
        pts = self.reputation_points or 0
        if pts >= 250:
            self.badge = "Community Mentor"
        elif pts >= 100:
            self.badge = "Subject Master"
        elif pts >= 40:
            self.badge = "Peer Tutor"
        else:
            self.badge = "Study Buddy"


class PendingRegistration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)

    def is_expired(self):
        return datetime.utcnow() > self.expires_at


class PasswordResetOTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)

    def is_expired(self):
        return datetime.utcnow() > self.expires_at


class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(7), default="#3B82F6")
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="subjects")
    tasks = db.relationship(
        "Task", backref="subject", lazy="dynamic", cascade="all, delete-orphan"
    )
    notes = db.relationship(
        "Note", backref="subject", lazy="dynamic", cascade="all, delete-orphan"
    )
    schedules = db.relationship("StudySchedule", backref="subject", lazy="dynamic")
    goals = db.relationship("StudyGoal", backref="subject", lazy="dynamic")


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    priority = db.Column(db.String(20), default="medium")
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref="tasks")


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User", backref="notes")


class StudySchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_rule = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="schedules")


class StudyGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    target_hours = db.Column(db.Float, nullable=False)
    completed_hours = db.Column(db.Float, default=0.0)
    deadline = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default="active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="goals")


# ==========================================
# EDUCATION CHEST EXTENSIONS (Hackathon Models)
# ==========================================

class Doubt(db.Model):
    """
    AI Doubt Solver & Personal Doubt Journal for students without costly tuition.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=True, index=True)
    subject_name = db.Column(db.String(100), default="General Studies")
    title = db.Column(db.String(250), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.Text, nullable=True)  # optional base64 image
    solution_steps = db.Column(db.Text, nullable=False)  # JSON or markdown formatted
    concept_summary = db.Column(db.Text, nullable=True)
    practice_question = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(20), default="medium")  # easy, medium, hard
    status = db.Column(db.String(30), default="solved")  # 'solved', 'mastered', 'needs_revision'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="doubts")


class StudyCircle(db.Model):
    """
    Free collaborative peer study circle by grade level and subject.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    grade_level = db.Column(db.String(50), nullable=False)  # 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'
    subject_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon_color = db.Column(db.String(20), default="#8B5CF6")
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    member_count = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CircleMessage(db.Model):
    """
    Peer group chat messages in a study room.
    """
    id = db.Column(db.Integer, primary_key=True)
    circle_id = db.Column(db.Integer, db.ForeignKey("study_circle.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    username = db.Column(db.String(80), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    circle = db.relationship("StudyCircle", backref=db.backref("messages", lazy="dynamic", cascade="all, delete-orphan"))


class CircleDoubt(db.Model):
    """
    Shared doubt board inside a peer study circle where students help each other.
    """
    id = db.Column(db.Integer, primary_key=True)
    circle_id = db.Column(db.Integer, db.ForeignKey("study_circle.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    username = db.Column(db.String(80), nullable=False)
    title = db.Column(db.String(250), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="open")  # 'open', 'resolved'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    circle = db.relationship("StudyCircle", backref=db.backref("shared_doubts", lazy="dynamic", cascade="all, delete-orphan"))


class CircleDoubtAnswer(db.Model):
    """
    Peer-to-peer answers with reputation and upvoting (+15 points for helpful answer).
    """
    id = db.Column(db.Integer, primary_key=True)
    circle_doubt_id = db.Column(db.Integer, db.ForeignKey("circle_doubt.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    username = db.Column(db.String(80), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    upvotes = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doubt = db.relationship("CircleDoubt", backref=db.backref("answers", lazy="dynamic", cascade="all, delete-orphan"))


class AdaptivePlan(db.Model):
    """
    Smart study plan auto-generated from exam deadlines & detected weak topics.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    target_exam = db.Column(db.String(150), nullable=False)
    exam_date = db.Column(db.DateTime, nullable=True)
    daily_hours = db.Column(db.Float, default=2.0)
    weak_topics = db.Column(db.Text, nullable=True)  # JSON string
    plan_schedule = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="adaptive_plans")
