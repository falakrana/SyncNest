from datetime import datetime, timedelta
import secrets
from bson import ObjectId
from fastapi import HTTPException

from app.database.mongodb import (
    projects_collection,
    tasks_collection,
    tenants_collection,
    tenant_invites_collection,
    users_collection,
)
from app.schemas.tenant_schema import TenantCreateRequest, TenantInviteCreateRequest


INVITE_EXPIRY_DAYS = 7


async def create_tenant(data: TenantCreateRequest, user_id: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if user_doc.get("tenant_id"):
        raise HTTPException(status_code=400, detail="User already belongs to a tenant")

    tenant_doc = {
        "name": data.name.strip(),
        "owner_id": user_id,
        "created_at": datetime.utcnow(),
    }
    result = await tenants_collection.insert_one(tenant_doc)
    tenant_id = str(result.inserted_id)

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"tenant_id": tenant_id, "tenant_role": "owner"}},
    )

    created = await tenants_collection.find_one({"_id": result.inserted_id})
    return {
        "id": str(created["_id"]),
        "name": created["name"],
        "owner_id": created["owner_id"],
        "created_at": created["created_at"],
    }


async def create_tenant_invite(data: TenantInviteCreateRequest, user_id: str, _frontend_base_url: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    tenant_id = user_doc.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Create or join a tenant first")

    if user_doc.get("tenant_role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only tenant owner/admin can invite")

    token = secrets.token_urlsafe(32)
    invite_doc = {
        "tenant_id": tenant_id,
        "email": data.email.lower().strip(),
        "role": data.role,
        "token": token,
        "status": "pending",
        "created_by": user_id,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS),
    }

    result = await tenant_invites_collection.insert_one(invite_doc)
    return {
        "id": str(result.inserted_id),
        "tenant_id": tenant_id,
        "email": invite_doc["email"],
        "role": invite_doc["role"],
        "status": invite_doc["status"],
        "expires_at": invite_doc["expires_at"],
        "token": token,
    }


async def accept_tenant_invite(token: str, user_id: str):
    invite_doc = await tenant_invites_collection.find_one({"token": token})
    if not invite_doc:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite_doc.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invite is no longer valid")

    if invite_doc.get("expires_at") and invite_doc["expires_at"] < datetime.utcnow():
        await tenant_invites_collection.update_one(
            {"_id": invite_doc["_id"]},
            {"$set": {"status": "expired"}},
        )
        raise HTTPException(status_code=400, detail="Invite has expired")

    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if user_doc.get("email", "").lower() != invite_doc.get("email", "").lower():
        raise HTTPException(status_code=403, detail="Invite email does not match your account")

    if user_doc.get("tenant_id") and user_doc.get("tenant_id") != invite_doc.get("tenant_id"):
        raise HTTPException(status_code=400, detail="User already belongs to another tenant")

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"tenant_id": invite_doc["tenant_id"], "tenant_role": invite_doc.get("role", "member")}},
    )

    await tenant_invites_collection.update_one(
        {"_id": invite_doc["_id"]},
        {"$set": {"status": "accepted", "accepted_at": datetime.utcnow(), "accepted_by": user_id}},
    )

    tenant_doc = await tenants_collection.find_one({"_id": ObjectId(invite_doc["tenant_id"])})

    return {
        "user_id": user_id,
        "tenant_id": invite_doc["tenant_id"],
        "tenant_name": tenant_doc["name"] if tenant_doc else None,
        "role": invite_doc.get("role", "member"),
    }


async def get_tenant_membership(user_id: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    tenant_id = user_doc.get("tenant_id")
    tenant_name = None
    if tenant_id and ObjectId.is_valid(tenant_id):
        tenant_doc = await tenants_collection.find_one({"_id": ObjectId(tenant_id)})
        if tenant_doc:
            tenant_name = tenant_doc.get("name")

    return {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "tenant_name": tenant_name,
        "role": user_doc.get("tenant_role"),
    }


async def leave_tenant(user_id: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    tenant_id = user_doc.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="You are not in any workspace")

    role = (user_doc.get("tenant_role") or "").lower()
    if role == "owner":
        raise HTTPException(
            status_code=400,
            detail="Workspace owner cannot leave directly. Transfer ownership or delete the workspace first.",
        )

    admin_project_count = await projects_collection.count_documents(
        {"tenant_id": tenant_id, "admin_id": user_id}
    )
    if admin_project_count > 0:
        tenant_doc = await tenants_collection.find_one({"_id": ObjectId(tenant_id)})
        owner_id = tenant_doc.get("owner_id") if tenant_doc else None
        if not owner_id or owner_id == user_id:
            raise HTTPException(
                status_code=400,
                detail=f"You are project admin in {admin_project_count} project(s). Transfer admin role or delete those projects before leaving.",
            )
        await projects_collection.update_many(
            {"tenant_id": tenant_id, "admin_id": user_id},
            {"$set": {"admin_id": owner_id}},
        )

    await projects_collection.update_many(
        {"tenant_id": tenant_id},
        {"$pull": {"members": user_id}},
    )

    tenant_projects = await projects_collection.find({"tenant_id": tenant_id}, {"_id": 1}).to_list(length=None)
    tenant_project_ids = [str(project["_id"]) for project in tenant_projects]
    if tenant_project_ids:
        await tasks_collection.update_many(
            {"project_id": {"$in": tenant_project_ids}, "assigned_to": user_id},
            {"$set": {"assigned_to": None}},
        )

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"tenant_id": None, "tenant_role": None}},
    )

    return {"message": "You left the workspace successfully"}


async def transfer_tenant_ownership(user_id: str, target_email: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    tenant_id = user_doc.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Create or join a workspace first")

    if (user_doc.get("tenant_role") or "").lower() != "owner":
        raise HTTPException(status_code=403, detail="Only workspace owner can transfer ownership")

    normalized_email = (target_email or "").strip().lower()
    if not normalized_email:
        raise HTTPException(status_code=400, detail="Target email is required")

    if normalized_email == (user_doc.get("email") or "").strip().lower():
        raise HTTPException(status_code=400, detail="You are already the workspace owner")

    target_user = await users_collection.find_one({"email": normalized_email})
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    if target_user.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=400, detail="User must be in this workspace to become owner")

    await tenants_collection.update_one(
        {"_id": ObjectId(tenant_id)},
        {"$set": {"owner_id": str(target_user["_id"])}},
    )

    # Reassign project ownership within this tenant so previous owner can leave cleanly.
    await projects_collection.update_many(
        {"tenant_id": tenant_id, "admin_id": user_id},
        {"$set": {"admin_id": str(target_user["_id"])}},
    )

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"tenant_role": "admin"}},
    )
    await users_collection.update_one(
        {"_id": target_user["_id"]},
        {"$set": {"tenant_role": "owner"}},
    )

    return {
        "message": "Workspace ownership transferred successfully",
        "new_owner_email": target_user.get("email"),
    }
