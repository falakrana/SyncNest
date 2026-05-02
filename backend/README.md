# Team Task Manager - Backend

FastAPI backend for the Team Task Manager application.

## Features
- JWT Authentication
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
Create a `.env` file in this directory based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your MongoDB credentials, SMTP settings, and a secure JWT secret.

### 4. Running the Server
```bash
poetry run uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.
Swagger documentation is available at `http://localhost:8000/docs`.

## Project Structure
- `app/main.py`: Entry point.
- `app/routes/`: API endpoint definitions.
- `app/services/`: Business logic.
- `app/models/`: Database models.
- `app/schemas/`: Pydantic validation schemas.
- `app/database/`: Database connection logic.
