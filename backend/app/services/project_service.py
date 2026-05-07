from bson import ObjectId
from fastapi import HTTPException, status
from app.database.mongodb import projects_collection, users_collection
from app.models.project import ProjectModel
from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectResponse

async def create_project(project_data: ProjectCreate, user_id: str) -> ProjectResponse:
    creator = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not creator or not creator.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Create or join a tenant first")

    project_dict = project_data.dict()
    project_dict["tenant_id"] = creator["tenant_id"]
    project_dict["admin_id"] = user_id
    project_dict["members"] = [user_id] # Admin is also a member

    project_model = ProjectModel(**project_dict)
    
    result = await projects_collection.insert_one(project_model.dict(by_alias=True, exclude_none=True))
    created_project = await projects_collection.find_one({"_id": result.inserted_id})
    
    return await _format_project_response(created_project)

async def get_user_projects(user_id: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc or not user_doc.get("tenant_id"):
        return []
    projects_cursor = projects_collection.find({"tenant_id": user_doc["tenant_id"], "members": user_id})
    projects = await projects_cursor.to_list(length=100)
    return [await _format_project_response(p) for p in projects]

async def get_project_by_id(project_id: str, user_id: str):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc or user_doc.get("tenant_id") != project.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")
        
    if user_id not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this project")
        
    return await _format_project_response(project)

async def update_project(project_id: str, update_data: ProjectUpdate, user_id: str):
    project = await _check_project_admin(project_id, user_id)
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if not update_dict:
        return await _format_project_response(project)
        
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_dict}
    )
    
    updated_project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    return await _format_project_response(updated_project)

async def delete_project(project_id: str, user_id: str):
    await _check_project_admin(project_id, user_id)
    
    await projects_collection.delete_one({"_id": ObjectId(project_id)})
    # Could also cascade delete tasks here or handle via task_service
    from app.database.mongodb import tasks_collection
    await tasks_collection.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted successfully"}

async def add_member(project_id: str, email: str, admin_id: str):
    project = await _check_project_admin(project_id, admin_id)
    
    user_to_add = await users_collection.find_one({"email": email})
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with this email not found")

    if user_to_add.get("tenant_id") != project.get("tenant_id"):
        raise HTTPException(
            status_code=400,
            detail="User must join this tenant before project assignment",
        )
        
    user_id_to_add = str(user_to_add["_id"])
    if user_id_to_add in project.get("members", []):
        raise HTTPException(status_code=400, detail="User already in project")
        
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"members": user_id_to_add}}
    )
    
    return {"message": "Member added successfully"}

async def remove_member(project_id: str, user_id_to_remove: str, admin_id: str):
    await _check_project_admin(project_id, admin_id)
    
    if user_id_to_remove == admin_id:
        raise HTTPException(status_code=400, detail="Cannot remove admin from project")
        
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"members": user_id_to_remove}}
    )
    
    return {"message": "Member removed successfully"}

async def _check_project_admin(project_id: str, user_id: str):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.get("admin_id") != user_id:
        raise HTTPException(status_code=403, detail="Only project admin can perform this action")
        
    return project

async def _format_project_response(project):
    member_ids = project.get("members", [])
    members_data = []
    
    if member_ids:
        # Fetch all members in one query
        cursor = users_collection.find({"_id": {"$in": [ObjectId(mid) for mid in member_ids]}})
        async for user_doc in cursor:
            members_data.append({
                "id": str(user_doc["_id"]),
                "email": user_doc["email"],
                "name": user_doc.get("name")
            })

    return ProjectResponse(
        id=str(project["_id"]),
        name=project["name"],
        description=project.get("description", ""),
        tenant_id=project["tenant_id"],
        admin_id=project["admin_id"],
        members=members_data,
        created_at=project["created_at"]
    )
