from bson import ObjectId
from fastapi import HTTPException, status
from app.database.mongodb import users_collection, tenants_collection
from app.models.user import UserModel
from app.schemas.user_schema import SignupRequest, UserResponse
from app.services.auth_service import get_password_hash

async def create_user(user_data: SignupRequest) -> UserResponse:
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password

    user_model = UserModel(**user_dict)
    
    result = await users_collection.insert_one(user_model.dict(by_alias=True, exclude_none=True))
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    
    return UserResponse(
        id=str(created_user["_id"]),
        name=created_user["name"],
        email=created_user["email"],
        tenant_id=created_user.get("tenant_id"),
        tenant_role=created_user.get("tenant_role"),
        created_at=created_user["created_at"]
    )

async def get_user_by_email(email: str):
    user = await users_collection.find_one({"email": email})
    return user

async def get_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    return user


async def get_tenant_name(tenant_id: str):
    if not tenant_id or not ObjectId.is_valid(tenant_id):
        return None
    tenant = await tenants_collection.find_one({"_id": ObjectId(tenant_id)})
    return tenant.get("name") if tenant else None
