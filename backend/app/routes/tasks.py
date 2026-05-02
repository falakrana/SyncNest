from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse
from app.services.task_service import (
    create_task, get_project_tasks, get_task_by_id, 
    update_task, update_task_status, delete_task
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(tags=["tasks"])

@router.post("/api/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def api_create_task(project_id: str, task_data: TaskCreate, current_user_id: str = Depends(get_current_user)):
    return await create_task(project_id, task_data, current_user_id)

@router.get("/api/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def api_get_project_tasks(project_id: str, current_user_id: str = Depends(get_current_user)):
    return await get_project_tasks(project_id, current_user_id)

@router.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def api_get_task(task_id: str, current_user_id: str = Depends(get_current_user)):
    return await get_task_by_id(task_id, current_user_id)

@router.put("/api/tasks/{task_id}", response_model=TaskResponse)
async def api_update_task(task_id: str, update_data: TaskUpdate, current_user_id: str = Depends(get_current_user)):
    return await update_task(task_id, update_data, current_user_id)

@router.patch("/api/tasks/{task_id}/status", response_model=TaskResponse)
async def api_update_task_status(task_id: str, update_data: TaskStatusUpdate, current_user_id: str = Depends(get_current_user)):
    return await update_task_status(task_id, update_data, current_user_id)

@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def api_delete_task(task_id: str, current_user_id: str = Depends(get_current_user)):
    await delete_task(task_id, current_user_id)
    return None
