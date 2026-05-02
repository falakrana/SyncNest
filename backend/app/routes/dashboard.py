from fastapi import APIRouter, Depends
from app.services.dashboard_service import get_dashboard_stats
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/{project_id}/stats")
async def api_get_dashboard_stats(project_id: str, current_user_id: str = Depends(get_current_user)):
    return await get_dashboard_stats(project_id, current_user_id)
