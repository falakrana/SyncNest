from fastapi import APIRouter, Depends, status

from app.config import settings
from app.middleware.auth_middleware import get_current_user
from app.schemas.tenant_schema import (
    AcceptInviteRequest,
    MembershipResponse,
    TenantCreateRequest,
    TenantInviteCreateRequest,
    TenantInviteResponse,
    TenantResponse,
)
from app.services.tenant_service import (
    accept_tenant_invite,
    create_tenant,
    create_tenant_invite,
    get_tenant_membership,
)

router = APIRouter(prefix="/api/tenants", tags=["tenants"])


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def api_create_tenant(data: TenantCreateRequest, current_user_id: str = Depends(get_current_user)):
    return await create_tenant(data, current_user_id)


@router.get("/membership", response_model=MembershipResponse)
async def api_get_membership(current_user_id: str = Depends(get_current_user)):
    return await get_tenant_membership(current_user_id)


@router.post("/invites", response_model=TenantInviteResponse, status_code=status.HTTP_201_CREATED)
async def api_create_tenant_invite(
    data: TenantInviteCreateRequest,
    current_user_id: str = Depends(get_current_user),
):
    return await create_tenant_invite(data, current_user_id, settings.FRONTEND_BASE_URL)


@router.post("/invites/accept", response_model=MembershipResponse)
async def api_accept_tenant_invite(data: AcceptInviteRequest, current_user_id: str = Depends(get_current_user)):
    return await accept_tenant_invite(data.token, current_user_id)
