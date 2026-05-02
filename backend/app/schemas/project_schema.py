from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.user_schema import UserResponse

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    admin_id: str
    members: List[str]
    created_at: datetime

class MemberAddRequest(BaseModel):
    email: str
