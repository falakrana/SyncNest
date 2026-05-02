from bson import ObjectId
from fastapi import HTTPException
from app.database.mongodb import tasks_collection, projects_collection
from datetime import datetime

async def get_dashboard_stats(project_id: str, user_id: str):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project or user_id not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to view this project")

    pipeline = [
        {"$match": {"project_id": project_id}},
        {"$facet": {
            "total_count": [{"$count": "count"}],
            "by_status": [
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ],
            "by_user": [
                {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}}
            ],
            "overdue": [
                {"$match": {"due_date": {"$lt": datetime.utcnow()}, "status": {"$ne": "Done"}}},
                {"$count": "count"}
            ]
        }}
    ]

    result = await tasks_collection.aggregate(pipeline).to_list(1)
    
    if not result:
        return {"total_tasks": 0, "by_status": [], "by_user": [], "overdue": 0}

    stats = result[0]
    total = stats["total_count"][0]["count"] if stats["total_count"] else 0
    overdue = stats["overdue"][0]["count"] if stats["overdue"] else 0

    return {
        "total_tasks": total,
        "by_status": [{"status": item["_id"], "count": item["count"]} for item in stats["by_status"]],
        "by_user": [{"user_id": item["_id"], "count": item["count"]} for item in stats["by_user"]],
        "overdue_count": overdue
    }
