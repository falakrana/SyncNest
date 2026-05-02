from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

TaskStatus = Literal["To Do", "In Progress", "In Testing", "Done"]

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[datetime] = None
    priority: Optional[str] = "Medium"
    assigned_to: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    due_date: Optional[datetime]
    priority: str
    status: str
    assigned_to: Optional[str]
    assigned_to_email: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
