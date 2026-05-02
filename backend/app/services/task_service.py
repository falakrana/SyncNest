from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.database.mongodb import tasks_collection, projects_collection, users_collection
from app.models.task import TaskModel
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse
from app.services.notification_service import trigger_task_assignment_email

async def create_task(project_id: str, task_data: TaskCreate, user_id: str):
    # Verify project exists and user is admin
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.get("admin_id") != user_id:
        raise HTTPException(status_code=403, detail="Only project admin can create tasks")

    if task_data.assigned_to and task_data.assigned_to not in project.get("members", []):
        raise HTTPException(status_code=400, detail="Assigned user is not a member of the project")

    task_dict = task_data.dict()
    task_dict["project_id"] = project_id
    task_dict["created_by"] = user_id
    
    task_model = TaskModel(**task_dict)
    
    result = await tasks_collection.insert_one(task_model.dict(by_alias=True, exclude_none=True))
    created_task = await tasks_collection.find_one({"_id": result.inserted_id})

    if created_task and created_task.get("assigned_to"):
        await _notify_task_assignment_if_needed(
            project=project,
            task=created_task,
            previous_assigned_to=None,
            current_assigned_to=created_task.get("assigned_to"),
        )
    
    return await _format_task_response(created_task)

async def get_project_tasks(project_id: str, user_id: str):
    # Verify user is member of project
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if user_id not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this project")
        
    tasks_cursor = tasks_collection.find({"project_id": project_id})
    tasks = await tasks_cursor.to_list(length=1000)
    return [await _format_task_response(t) for t in tasks]

async def get_task_by_id(task_id: str, user_id: str):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
        
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Verify user is member of project
    project = await projects_collection.find_one({"_id": ObjectId(task["project_id"])})
    if not project or user_id not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
        
    return await _format_task_response(task)

async def update_task(task_id: str, update_data: TaskUpdate, user_id: str):
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = await projects_collection.find_one({"_id": ObjectId(task["project_id"])})
    if not project or project.get("admin_id") != user_id:
        raise HTTPException(status_code=403, detail="Only project admin can update all task details")

    if update_data.assigned_to and update_data.assigned_to not in project.get("members", []):
        raise HTTPException(status_code=400, detail="Assigned user is not a member of the project")

    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if not update_dict:
        return await _format_task_response(task)
        
    update_dict["updated_at"] = datetime.utcnow()
    
    previous_assigned_to = task.get("assigned_to")
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_dict}
    )
    
    updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    await _notify_task_assignment_if_needed(
        project=project,
        task=updated_task,
        previous_assigned_to=previous_assigned_to,
        current_assigned_to=updated_task.get("assigned_to") if updated_task else None,
    )
    return await _format_task_response(updated_task)

async def update_task_status(task_id: str, update_data: TaskStatusUpdate, user_id: str):
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = await projects_collection.find_one({"_id": ObjectId(task["project_id"])})
    
    # Admin or assigned user can update status
    is_admin = project and project.get("admin_id") == user_id
    is_assigned = task.get("assigned_to") == user_id
    
    if not (is_admin or is_assigned):
        raise HTTPException(status_code=403, detail="Not authorized to update this task status")
        
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"status": update_data.status, "updated_at": datetime.utcnow()}}
    )
    
    updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    return await _format_task_response(updated_task)

async def delete_task(task_id: str, user_id: str):
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = await projects_collection.find_one({"_id": ObjectId(task["project_id"])})
    if not project or project.get("admin_id") != user_id:
        raise HTTPException(status_code=403, detail="Only project admin can delete tasks")
        
    await tasks_collection.delete_one({"_id": ObjectId(task_id)})
    return {"message": "Task deleted successfully"}

async def _format_task_response(task):
    assigned_to_email = None
    assigned_to_name = None
    if task.get("assigned_to"):
        user_doc = await users_collection.find_one({"_id": ObjectId(task["assigned_to"])})
        if user_doc:
            assigned_to_email = user_doc["email"]
            assigned_to_name = user_doc.get("name")

    return TaskResponse(
        id=str(task["_id"]),
        project_id=task["project_id"],
        title=task["title"],
        description=task.get("description", ""),
        due_date=task.get("due_date"),
        priority=task.get("priority", "Medium"),
        status=task.get("status", "To Do"),
        assigned_to=task.get("assigned_to"),
        assigned_to_email=assigned_to_email,
        assigned_to_name=assigned_to_name,
        created_by=task["created_by"],
        created_at=task["created_at"],
        updated_at=task["updated_at"]
    )


async def _notify_task_assignment_if_needed(project, task, previous_assigned_to, current_assigned_to):
    if not current_assigned_to:
        return

    if previous_assigned_to == current_assigned_to:
        return

    user_doc = await users_collection.find_one({"_id": ObjectId(current_assigned_to)})
    if not user_doc:
        return

    trigger_task_assignment_email(
        assignee_email=user_doc.get("email", ""),
        assignee_name=user_doc.get("name"),
        project_name=project.get("name", "Project"),
        task_title=task.get("title", "Task"),
    )
