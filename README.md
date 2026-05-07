# Team Task Manager

A full-stack tenant-aware project and task management application built with React, FastAPI, and MongoDB.

## Features

- JWT authentication (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`)
- Tenant management (create tenant, invite users, accept invites, membership lookup)
- Project management inside a tenant (create/update/delete, add/remove members)
- Task management (create/update/delete, status updates, assignment)
- Dashboard statistics per project
- Role-aware access (`owner`, `admin`, `member`)

## Tech Stack

- Frontend: React, Vite, Zustand, React Router, Tailwind CSS, Recharts
- Backend: FastAPI, Motor (async MongoDB driver), Poetry, Pydantic
- Database: MongoDB

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB instance (local or Atlas)
- Poetry

### Backend Setup

1. `cd backend`
2. `poetry install`
3. Create `.env` in `backend/`
4. `poetry run uvicorn app.main:app --reload`

Backend runs at `http://localhost:8000` and Swagger docs at `http://localhost:8000/docs`.

### Frontend Setup

1. `cd frontend`
2. `npm install`
3. Create `.env` with `VITE_API_BASE_URL=http://localhost:8000`
4. `npm run dev`

## API Overview

- Auth: `/api/auth/*`
- Tenants: `/api/tenants/*`
- Projects: `/api/projects/*`
- Tasks: `/api/projects/{project_id}/tasks`, `/api/tasks/{task_id}*`
- Dashboard: `/api/dashboard/{project_id}/stats`

## Environment Variables

### Backend (`backend/.env`)

- `MONGODB_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM` (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default `60`)
- `ALLOWED_ORIGINS` (comma-separated)
- `SMTP_HOST`
- `SMTP_PORT` (default `587`)
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_USE_TLS` (default `true`)
- `EMAIL_FROM`
- `FRONTEND_BASE_URL` (default `http://localhost:5173`)

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL`
