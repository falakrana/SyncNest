import motor.motor_asyncio
from app.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client["teamtaskmanager"]

users_collection = db["users"]
tenants_collection = db["tenants"]
tenant_invites_collection = db["tenant_invites"]
projects_collection = db["projects"]
tasks_collection = db["tasks"]


async def create_indexes():
    """Create indexes for performance."""
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("tenant_id")
    await tenants_collection.create_index("name")
    await tenant_invites_collection.create_index("token", unique=True)
    await tenant_invites_collection.create_index([("tenant_id", 1), ("email", 1), ("status", 1)])
    await projects_collection.create_index("admin_id")
    await projects_collection.create_index("tenant_id")
    await projects_collection.create_index("members")
    await tasks_collection.create_index("project_id")
    await tasks_collection.create_index("assigned_to")
    await tasks_collection.create_index([("project_id", 1), ("status", 1)])
