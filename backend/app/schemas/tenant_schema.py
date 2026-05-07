from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


class TenantCreateRequest(BaseModel):
    name: str


class TenantResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime


class TenantInviteCreateRequest(BaseModel):
    email: str
    role: Literal["member", "admin"] = "member"


class TenantInviteResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    role: str
    status: str
    expires_at: datetime
    token: str
    invite_url: str


class AcceptInviteRequest(BaseModel):
    token: str


class TransferOwnershipRequest(BaseModel):
    email: str


class MembershipResponse(BaseModel):
    user_id: str
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    role: Optional[str] = None
