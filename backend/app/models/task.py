from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user import PyObjectId


class TaskModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    project_id: str
    title: str
    description: str = ""
    due_date: Optional[datetime] = None
    priority: str = "Medium"  # Low, Medium, High
    status: str = "To Do"  # To Do, In Progress, In Testing, Done
    assigned_to: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
