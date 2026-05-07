# Team Task Manager - Backend

FastAPI backend for the Team Task Manager application.

## Features
- JWT Authentication
- Tenant management (create tenant, invite, accept invite, membership, leave workspace, transfer ownership)
- Project & Task management
- MongoDB integration (Motor)
- Email notifications (SMTP)
- Real-time dashboard stats

## Setup

### 1. Prerequisites
- Python 3.10+
- Poetry

### 2. Installation
```bash
poetry install
```

### 3. Environment Setup
Create a `.env` file in this directory and configure:
- `MONGODB_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ALLOWED_ORIGINS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_USE_TLS`
- `EMAIL_FROM`
- `FRONTEND_BASE_URL`

### 4. Running the Server
```bash
poetry run uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.
Swagger documentation is available at `http://localhost:8000/docs`.

## Route Groups

- `/api/auth` - signup/login/me
- `/api/tenants` - tenant creation, membership, invites, invite acceptance, leave workspace, transfer ownership
- `/api/projects` - project CRUD + member management
- `/api/projects/{project_id}/tasks` and `/api/tasks/{task_id}` - task CRUD/status
- `/api/dashboard` - project stats

## Tenant Lifecycle Notes

- `POST /api/tenants/leave`
  - Allows a user to leave their current workspace.
  - Workspace owners cannot leave directly; they must transfer ownership first.
  - If a non-owner is admin of one or more projects, project admin rights are reassigned to the current workspace owner before leaving.
  - Removes the user from workspace projects and clears task assignments in that workspace.

- `POST /api/tenants/transfer-ownership`
  - Owner-only action.
  - Request body: `{ "email": "member@company.com" }`
  - Target user must already belong to the same workspace.
  - Updates tenant `owner_id`, promotes target user to `owner`, demotes previous owner to `admin`.
  - Reassigns project admin ownership from previous owner to the new owner for all projects in that workspace.

## Project Structure
- `app/main.py`: Entry point.
- `app/routes/`: API endpoint definitions.
- `app/services/`: Business logic.
- `app/models/`: Database models.
- `app/schemas/`: Pydantic validation schemas.
- `app/database/`: Database connection logic.
