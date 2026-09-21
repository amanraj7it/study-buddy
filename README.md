# 🎒 Education Chest (StudyBuddy)
### *Solving The Learning Gap After School*

> **Hackathon Problem Statement:**
> *"Many students fall behind because tuition is costly and their parents cannot help with homework. Good after-school support is out of reach for those who need it most."*

**Education Chest** is an AI-powered, community-driven after-school learning platform that eliminates tuition costs through **pedagogical AI doubt resolution**, **collaborative peer study circles**, **adaptive exam planning**, and **multilingual parent WhatsApp reports**.

---

## 🌟 The Core Innovation & Solution Pillars

```
                     ┌──────────────────────────────────────────────┐
                     │           EDUCATION CHEST ECOSYSTEM          │
                     └──────────────────────┬───────────────────────┘
                                            │
         ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
         │                  │                               │                  │
         ▼                  ▼                               ▼                  ▼
┌──────────────────┐ ┌──────────────────┐     ┌──────────────────┐  ┌──────────────────┐
│  AI Doubt Solver │ │Peer Study Circles│     │  Smart Planner   │  │ Parent Dashboard │
│  • Step-by-Step  │ │  • Grade Rooms   │     │ • Exam Revision  │  │ • Hindi, Marathi │
│  • Active Recall │ │  • Upvotes & Pts │     │ • Weak Diagnosis │  │ • 1-Click WhatsApp│
│  • Doubt Journal │ │  • Leaderboards  │     │ • 1-Click Timetable││ • Zero Jargon   │
└──────────────────┘ └──────────────────┘     └──────────────────┘  └──────────────────┘
         ▲                  ▲                               ▲                  ▲
         └──────────────────┴───────────────┬───────────────┴──────────────────┘
                                            │
                     ┌──────────────────────┴───────────────────────┐
                     │          100% Free Core Freemium             │
                     │   Sponsors & Supporter Tier at ₹99/month     │
                     └──────────────────────────────────────────────┘
```

### 1. 💡 AI Doubt Solver & Doubt Journal (`/doubts`)
- **Step-by-Step Logic**: Breaks difficult math, science, and humanities questions down into 4 clear steps (Identify Given, Core Principle, Step-by-Step Working, Verification).
- **Active Recall**: Supplies an automated follow-up practice problem to reinforce learning rather than just providing homework answers.
- **Doubt Journal**: Automatically saves doubts, allowing students to filter by subject and flag items as **Needs Revision** or **Mastered**.
- **Photo & Camera Input**: Students can snap a picture of their textbook or handwritten problem.
- **Zero Downtime Fallback**: Powered by Gemini 1.5 Flash when an API key is present, with an intelligent pedagogical engine fallback for offline and demo environments.

### 2. 👥 Peer Study Circles (`/circles`)
- **Collaborative Study Rooms**: Filtered by Grade (Grade 8 to College) and Subject (Math, Physics, Chemistry, English).
- **Shared Doubt Board**: Students ask peers for help and provide step-by-step explanations.
- **Gamified Peer Tutor Reputation**: Contributing an answer earns **+10 points**; community upvotes award **+15 points**, unlocking badges like *Study Buddy*, *Peer Tutor*, and *Community Mentor*.
- **Community Leaderboard**: Highlights the most helpful peer tutors in the school community.

### 3. 📅 Smart Adaptive Exam Planner (`/smart-planner`)
- **Weak Topic Diagnosis**: Automatically analyzes the student's Doubt Journal history to identify struggling topics (e.g. Calculus, Optics, Chemical Equations).
- **Exam Countdown Generation**: Generates balanced daily study sessions (Core Syllabus + Weak Topic Targeted Intervention + Active Recall).
- **1-Click Push to Timetable**: Automatically inserts the generated sessions directly into the student's main schedule.

### 4. 👨‍👩‍👧 Parent Dashboard & WhatsApp Reports (`/parent-report`)
- **No Academic Jargon**: Replaces confusing grade metrics with encouraging summaries of weekly study hours, completed tasks, and streak consistency.
- **Multilingual Support**: Supports English, **हिंदी (Hindi)**, **मराठी (Marathi)**, and **Español (Spanish)**.
- **1-Click WhatsApp & SMS Share**: Instant `wa.me` sharing so parents receive progress updates on the messaging app they use daily.

### 5. 💰 Sustainable Social Impact & Freemium (`/subscription`)
- **100% Free Forever**: All core learning tools (AI doubt solving, peer circles, journal, planner, parent reports) remain free to ensure underprivileged students are never locked out.
- **Supporter / Sponsor Tier (₹99/month)**: Allows schools, NGOs, and affluent families to sponsor underprivileged students and access offline PDF exports.

### 6. 📊 Live Impact Analytics (`/pitch-analytics`)
- **Macro Economic Relief**: Tracks simulated community impact (1,240+ students supported, ₹18.5+ Lakhs in private tuition fees saved).
- **Visual Problem-to-Solution Map**: Prepares live presentation slides directly inside the web application for hackathon judges.

---

## 📈 Economic Impact & Tuition Savings

| Category | Traditional Private Tuition | Education Chest | Annual Savings per Family |
| :--- | :--- | :--- | :--- |
| **Monthly Coaching Fees** | ₹1,500 – ₹4,000 / month | **₹0 (Free Forever)** | **₹18,000 – ₹48,000 / year** |
| **Homework Support** | Dependent on educated parents | **24/7 Step-by-Step AI + Peers** | Priceless peace of mind |
| **Parent Visibility** | Expensive parent-teacher meetings | **Free Vernacular WhatsApp Reports** | Instant regular feedback |
| **Accessibility** | Urban coaching centres | **Any Smartphone / Web Browser** | Equal opportunity |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, Canvas Confetti.
- **Backend**: Python 3.13, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, SQLite.
- **AI Engine**: Google Gemini 1.5 Flash API with built-in pedagogical rule engine fallback.
- **Offline Tolerance**: LocalStorage caching layer with online/offline network detection.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd studybuddy-backend

# (Optional) Set your Gemini API key in .env or environment
# export GEMINI_API_KEY="your-api-key-here"

# Install dependencies
pip install -r requirements.txt

# Seed the demo ecosystem (Aman, Priya, circles, doubts)
python -c "from app import app, db; from app import seed; app.test_client().post('/api/seed')"

# Run backend server (default port 5000)
python app.py
```

### 2. Frontend Setup
```bash
cd studybuddy-frontend

# Install dependencies
npm install

# Start Vite development server (default port 5173)
npm run dev
```

### 3. Demo Credentials
- **Student User**: `username: demo` | `password: demo123`
- **Peer Tutor**: `username: priya_tutor` | `password: demo123`

---

## 🧪 Testing

Run backend integration test suite:
```bash
cd studybuddy-backend
python test_education_chest.py
```
*Tests verify authentication, doubt solver fallback, study circles, peer answers, upvotes, smart planner generation, parent WhatsApp report generation, and tier upgrade.*

Run frontend production build verification:
```bash
cd studybuddy-frontend
npm run build
```

---

## 👥 Contributors
Developed for Hackathon to bridge the after-school education divide.
