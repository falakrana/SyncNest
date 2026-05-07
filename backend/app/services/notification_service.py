import asyncio
from typing import Optional

async def send_task_assignment_email(
    assignee_email: str,
    assignee_name: Optional[str],
    project_name: str,
    task_title: str,
    admin_email: Optional[str] = None,
    admin_name: Optional[str] = None,
) -> None:
    # Email notifications are temporarily disabled.
    return None


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
