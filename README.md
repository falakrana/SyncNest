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

### Backend (`backend/.env`)
- `MONGODB_URL`: MongoDB connection string.
- `JWT_SECRET_KEY`: Secret for JWT signing.
- `JWT_ALGORITHM`: Algorithm for JWT (default: HS256).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time.
- `ALLOWED_ORIGINS`: CORS allowed origins.
- `SMTP_HOST`: SMTP server host.
- `SMTP_PORT`: SMTP server port.
- `SMTP_USERNAME`: SMTP login username.
- `SMTP_PASSWORD`: SMTP login password.
- `SMTP_USE_TLS`: Use TLS for SMTP.
- `EMAIL_FROM`: Sender email address.
- `FRONTEND_BASE_URL`: URL of the frontend (for email links).

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL`: URL of the backend API.
