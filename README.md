A full-stack chat system with conversation storage, summaries, and an “Intelligence” search over past chats.

Backend: Django REST Framework + PostgreSQL
Frontend: React (Vite) + Tailwind CSS
AI: LM Studio (local)


Monorepo Layout

.
├─ TerminalA/                 # Backend (Django)
│  ├─ backend/                # settings, urls
│  ├─ conversations/          # models, serializers, views
│  └─ venv/                   # (local) virtualenv - ignored by git
└─ TerminalB/                 # Frontend (React + Vite)
   └─ src/
      ├─ api/
      └─ pages/


Quick Start
0) Prereqs
Python 3.11+
Node 18+
PostgreSQL 14+
LM Studio: https://lmstudio.ai

1) PostgreSQL setup
DB Name: terminal_chat
User: postgres
Password: <your-password>

2) Backend (Django + DRF)
cd TerminalA
# (optional) python -m venv venv
# .\venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

pip install --upgrade pip
pip install -r requirements.txt || true
pip install psycopg2-binary


Edit backend/settings.py:

DATABASES = {
  "default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": "terminal_chat",
    "USER": "postgres",
    "PASSWORD": "<your-password>",
    "HOST": "localhost",
    "PORT": "5432",
  }
}


Migrate & run:

python manage.py migrate
python manage.py runserver 8000


Open: http://127.0.0.1:8000/api/docs/

3) Frontend (React + Vite)
cd TerminalB
npm i


Set API base in TerminalB/.env:
VITE_API_BASE=http://127.0.0.1:8000/api


Run:
npm run dev

Open: http://127.0.0.1:5173/



🤖 AI Setup (Local)
Use LM Studio to avoid rate limits and work offline.
Install LM Studio → download an instruct model (e.g., qwen3-8b or Mistral-7B-Instruct).
Start Server in LM Studio (default: http://127.0.0.1:1234).
Configure backend env (optional .env):

LMSTUDIO_BASE=http://127.0.0.1:1234
LMSTUDIO_MODEL=Mistral-7B-Instruct   # or qwen3-8b, match the exact server tab name


🧩 Core Endpoints

GET /api/conversations/ — list conversations (title, dates, summary)
POST /api/conversations/ — create a new conversation
GET /api/conversations/{id}/ — retrieve single conversation (messages)
POST /api/conversations/{id}/messages/ — send a message ({ role, content }), auto AI reply returns
POST /api/conversations/{id}/end/ — mark ended + generate summary/tags
POST /api/query/ — search past conversations (keyword-based, friendly fallback)
OpenAPI docs: GET /api/docs/ or GET /api/schema/.


🖥️ Frontend Pages

Chat — Real-time chat with LLM, start/end conversation.
Conversations — List all chats (search by title/summary), open details.
Intelligence — Ask questions about past chats; shows relevant excerpts.



⚠️ Common Issues

429 / Quota / Rate limit — happens with cloud models; local LM Studio avoids this.
Postgres connection — check HOST=localhost, PORT=5432, user/password correct.
Vite import errors — ensure files live under TerminalB/src/ and import paths include .js if needed.
Tailwind PostCSS — install @tailwindcss/postcss and update postcss.config.js.
