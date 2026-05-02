from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectResponse, MemberAddRequest
from app.services.project_service import (
    create_project, get_user_projects, get_project_by_id, 
    update_project, delete_project, add_member, remove_member
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def api_create_project(project_data: ProjectCreate, current_user_id: str = Depends(get_current_user)):
    return await create_project(project_data, current_user_id)

@router.get("", response_model=List[ProjectResponse])
async def api_get_projects(current_user_id: str = Depends(get_current_user)):
    return await get_user_projects(current_user_id)

@router.get("/{project_id}", response_model=ProjectResponse)
async def api_get_project(project_id: str, current_user_id: str = Depends(get_current_user)):
    return await get_project_by_id(project_id, current_user_id)

@router.put("/{project_id}", response_model=ProjectResponse)
async def api_update_project(project_id: str, update_data: ProjectUpdate, current_user_id: str = Depends(get_current_user)):
    return await update_project(project_id, update_data, current_user_id)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def api_delete_project(project_id: str, current_user_id: str = Depends(get_current_user)):
    await delete_project(project_id, current_user_id)
    return None

@router.post("/{project_id}/members")
async def api_add_member(project_id: str, member_data: MemberAddRequest, current_user_id: str = Depends(get_current_user)):
    return await add_member(project_id, member_data.email, current_user_id)

@router.delete("/{project_id}/members/{user_id}")
async def api_remove_member(project_id: str, user_id: str, current_user_id: str = Depends(get_current_user)):
    return await remove_member(project_id, user_id, current_user_id)
