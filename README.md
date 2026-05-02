# Team Task Manager

A full-stack project management application built with React, FastAPI, and MongoDB.

## Features

- **JWT Authentication**: Secure signup and login.
- **Project Management**: Create projects, add/remove members (Admin only).
- **Task Management**: Create, edit, and delete tasks (Admin only).
- **Interactive Dashboard**: Real-time stats and charts for project progress.
- **Role-Based Access**: Admins control the project; members update task status.
- **Modern UI**: Built with Tailwind CSS and Lucide icons.

## Tech Stack

- **Frontend**: React, Vite, Zustand, React Router, Tailwind CSS, Recharts.
- **Backend**: FastAPI, Motor (Async MongoDB), Poetry, Pydantic, JWT.
- **Database**: MongoDB Atlas.
- **Deployment**: Vercel (Frontend), Render (Backend).

## Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance (local or Atlas)

### Backend Setup
1. `cd backend`
2. `poetry install`
3. Create `.env` based on `.env.example`
4. `poetry run uvicorn app.main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create `.env` with `VITE_API_BASE_URL=http://localhost:8000`
4. `npm run dev`

## Environment Variables

### Backend (`.env`)
- `MONGODB_URL`: MongoDB connection string.
- `JWT_SECRET_KEY`: Secret for JWT signing.
- `ALLOWED_ORIGINS`: CORS allowed origins.

### Frontend (`.env`)
- `VITE_API_BASE_URL`: URL of the backend API.
