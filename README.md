# ✦ Stardrawn ✦

A collaborative random entry picker with real-time sync. Let the stars decide.

## Live Demo
[stardrawn.vercel.app](https://stardrawn.vercel.app)

## Features
- Create a shared room and invite friends via URL
- Add and remove entries in real time
- Pick a random entry with a dramatic reveal
- Solo mode for quick private picking

## Tech Stack
**Frontend:** React, Vite, React Router  
**Backend:** Python, FastAPI, WebSockets  
**Database:** PostgreSQL  
**Hosting:** Vercel (frontend), Render (backend)

## Running Locally

**Backend:**
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```
cd frontend
npm install
npm run dev
```

## v2 Ideas
- Redis pub/sub for horizontal scaling
- Convert solo room to shared room
- User display names
- Presence indicator showing active users