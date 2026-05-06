import asyncio
import resend
from typing import Optional

from app.config import settings


def _email_enabled() -> bool:
    return bool(settings.RESEND_API_KEY)


async def send_task_assignment_email(
    assignee_email: str,
    assignee_name: Optional[str],
    project_name: str,
    task_title: str,
    admin_email: Optional[str] = None,
    admin_name: Optional[str] = None,
) -> None:
    if not _email_enabled() or not assignee_email:
        return

    resend.api_key = settings.RESEND_API_KEY
    
    assignee_label = assignee_name or assignee_email
    subject = f"New Task: {task_title} in {project_name}"
    task_url = settings.FRONTEND_BASE_URL.rstrip("/")
    
    # Professional HTML Body
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Task Assigned</h2>
        <p>Hi <strong>{assignee_label}</strong>,</p>
        <p>You have been assigned to a new task in <strong>{project_name}</strong>.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #007bff;"><strong>{task_title}</strong></p>
        </div>

        <p>Please log in to view the details and start working.</p>
        <a href="{task_url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Open SyncNest</a>
        
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #777;">This is an automated notification from SyncNest.</p>
    </div>
    """

    params = {
        "from": "SyncNest <onboarding@resend.dev>",  # Use your verified domain once ready
        "to": [assignee_email],
        "subject": subject,
        "html": html_content,
    }

    if admin_email:
        params["reply_to"] = f"{admin_name} <{admin_email}>" if admin_name else admin_email

    try:
        # Using loop.run_in_executor since resend SDK is synchronous
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: resend.Emails.send(params))
    except Exception as e:
        print(f"Error sending email via Resend: {e}")


def trigger_task_assignment_email(
    assignee_email: str,
    assignee_name: Optional[str],
    project_name: str,
    task_title: str,
    admin_email: Optional[str] = None,
    admin_name: Optional[str] = None,
) -> None:
    asyncio.create_task(
        send_task_assignment_email(
            assignee_email=assignee_email,
            assignee_name=assignee_name,
            project_name=project_name,
            task_title=task_title,
            admin_email=admin_email,
            admin_name=admin_name,
        )
    )
