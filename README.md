# Rajasthan Exam Twister — Telegram Quiz Management Platform

> **Mobile-First Telegram Quiz Management and Question Pool Platform for Rajasthan Competitive Examinations (RAS, CET, Patwar, Police Constable, 1st/2nd/3rd Grade Teacher, REET).**

---

## 📱 System Architecture

```mermaid
flowchart TD
    subgraph MobileDevice [Mobile Browser (Admin UI)]
        Dashboard["Dashboard & Analytics"]
        PromptMgr["Claude Prompt Assistant (1-Tap Copy)"]
        ImportView["Paste / Upload & Live Validator"]
        PoolView["Question Pool & Filter"]
        BuilderView["Quiz Builder & Reordering"]
        PublishView["Live Telegram Publisher"]
        HistoryView["Quiz History & Usage Tracker"]
        SettingsView["Settings & Connection Status"]
    end

    subgraph BackendAPI [Node.js & Express REST API]
        AuthGuard["Admin Auth (JWT / Bcrypt)"]
        ParserEngine["Multi-Format Parser (JSON, Markdown, Legacy TXT)"]
        ValidatorEngine["Validation Engine (Telegram character & option limits)"]
        DedupeEngine["Duplicate Detection Engine (Normalized Matching)"]
        QuizService["Quiz Assembly & Draft Manager"]
        TelegramService["Telegram Dispatch Engine (Rate-limiting, Message ID tracking, Dry-Run safety)"]
    end

    subgraph Database [MongoDB Database]
        ColQuestions[("questions")]
        ColQuizzes[("quizzes")]
        ColQuizQuestions[("quizQuestions")]
        ColPrompts[("prompts")]
        ColSettings[("settings")]
    end

    subgraph External [External Services]
        TelegramAPI["Telegram Bot API (/sendPoll)"]
        ClaudeAI["Claude AI (Manual generation helper)"]
    end

    MobileDevice <-->|REST API + JWT| BackendAPI
    BackendAPI <--> Database
    BackendAPI -->|sendPoll| TelegramAPI
    PromptMgr -.->|1-Tap Copy Prompt| ClaudeAI
    ClaudeAI -.->|Paste Output| ImportView
```

---

## ✨ Key Features

- **📱 100% Mobile-First Experience:** Tailored specifically for mobile browsers (360px–430px) with large touch targets, sticky navigation, and clear Hindi typography.
- **💡 Claude Prompt Assistant:** 1-Tap copy of high-yield prompts with dynamic topic insertion.
- **📥 Robust Multi-Format Importer:** Ingests raw JSON, Markdown code blocks (` ```json `), or legacy `questions.txt` format.
- **🔍 Instant Validation & Duplicate Detection:**
  - Enforces Telegram poll limits ($\le 300$ chars for question, $\le 100$ chars per option, 4 options).
  - Exact normalized duplicate detection against pool with *Skip* or *Import Anyway* options.
- **📚 Permanent Question Pool:**
  - Search by keyword, ID (`Q-0001`), category, or exam.
  - Filter by `Unused`, `Used`, `Archived`, or `Difficulty`.
  - Detailed modal with **"Used In Quizzes"** history tracking.
- **⚡ Mobile Quiz Builder:** Pick questions with 1 tap, reorder question sequence, and create drafts.
- **🚀 Safe Telegram Publishing Engine:**
  - Dispatches official Telegram quizzes with `type: "quiz"`, option indices (0–3), and explanations.
  - Rate-limited (default 2 seconds interval) to prevent API flooding.
  - Captures and stores Telegram `message_id` and `poll_id` in database.
  - **🛡️ Dry Run Safety Mode** (`TELEGRAM_DRY_RUN=true` by default) prevents accidental dispatches during staging/testing.
- **📜 Quiz History & Tracking:** Complete audit log of every published quiz and question usage count.
- **🔄 Legacy Fallback Preserved:** `rajasthan_border_quiz_telegram.py` and `questions.txt` remain intact as fallback utilities.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18+ (tested on v24)
- **MongoDB:** Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

### 2. Installation
Clone the repository and install dependencies:
```bash
# Install root, backend, and frontend packages
npm run build
```
Or install in each directory:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment Configuration
Create `.env` inside the `server/` directory (or use root `.env`):
```env
# Telegram Bot Configuration
BOT_TOKEN="your_telegram_bot_token_here"
CHAT_ID="-100xxxxxxxxxx"
SUBJECT="History - राजस्थान का इतिहास जानने के स्त्रोत"

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI="mongodb://127.0.0.1:27017/rajasthan_exam_twister"

# Security & Authentication
JWT_SECRET="your_random_secret_jwt_key_here"
ADMIN_PASSWORD="admin_password_change_me"

# Safety Defaults (Keep true until ready to send live)
TELEGRAM_DRY_RUN=true
TELEGRAM_PUBLISH_DELAY_SECONDS=2
```

### 4. Running Locally
Start both backend and frontend development servers:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Running on http://localhost:3000
```

Open `http://localhost:3000` (or your local network IP on your mobile phone connected to the same Wi-Fi) and sign in using your `ADMIN_PASSWORD`.

---

## 📲 Daily Mobile Quiz Workflow

1. **Open Mobile Browser:** Go to your hosted URL or local server.
2. **Sign In:** Enter admin password.
3. **Claude Prompt Tab (`/prompts`):**
   - Type your target topic (e.g. *1857 की क्रांति*).
   - Tap **"1-Tap Copy Prompt"**.
4. **Generate in Claude:** Paste prompt into Claude mobile app / browser and copy the returned JSON.
5. **Import Tab (`/import`):**
   - Paste Claude response $\rightarrow$ Tap **"Parse & Validate Preview"**.
   - Review valid questions and duplicate warnings $\rightarrow$ Tap **"Confirm & Import"**.
6. **Quiz Builder (`/quizzes/new`):**
   - Tap **"+ Select All Unused"** or pick desired MCQs.
   - Tap **"Create Draft & Proceed to Publish"**.
7. **Live Publishing Screen (`/quizzes/[id]/publish`):**
   - Verify questions and tap **"Publish Now"**.
   - Watch live dispatch ticker and progress.
8. **Quiz History (`/history`):**
   - Review message IDs and question delivery status.

---

## 🔒 Security Best Practices

- `.env` is ignored in `.gitignore` and must **never** be committed.
- All API routes (except login & healthcheck) require valid JWT Bearer authorization.
- Passwords are encrypted with `bcrypt` (10 salt rounds).
- Telegram Bot Tokens are masked in all UI screens and server logs.
- Telegram dispatches default to `TELEGRAM_DRY_RUN=true` to prevent unauthorized or accidental broadcasting.

---

## 📜 License
ISC License • Developed for Rajasthan Exam Preparation Automation.
