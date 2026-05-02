import asyncio
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.config import settings


def _email_enabled() -> bool:
    return bool(
        settings.SMTP_HOST
        and settings.SMTP_PORT
        and settings.EMAIL_FROM
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
    )


def _send_email_sync(to_email: str, subject: str, body: str) -> None:
    if not _email_enabled():
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)


async def send_task_assignment_email(
    assignee_email: str,
    assignee_name: Optional[str],
    project_name: str,
    task_title: str,
) -> None:
    if not assignee_email:
        return

    assignee_label = assignee_name or assignee_email
    subject = f"You were assigned a task in {project_name}"
    task_url = settings.FRONTEND_BASE_URL.rstrip("/")
    body = (
        f"Hi {assignee_label},\n\n"
        f"You have been assigned to the task \"{task_title}\" in project \"{project_name}\".\n\n"
        f"Open app: {task_url}\n\n"
        "Best,\nTeam Task Manager"
    )
    await asyncio.to_thread(_send_email_sync, assignee_email, subject, body)


def trigger_task_assignment_email(
    assignee_email: str,
    assignee_name: Optional[str],
    project_name: str,
    task_title: str,
) -> None:
    asyncio.create_task(
        send_task_assignment_email(
            assignee_email=assignee_email,
            assignee_name=assignee_name,
            project_name=project_name,
            task_title=task_title,
        )
    )
