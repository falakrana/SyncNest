from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user import PyObjectId


class ProjectModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: str = ""
    tenant_id: str
    admin_id: str
    members: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
