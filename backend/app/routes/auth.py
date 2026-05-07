from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user_schema import SignupRequest, UserResponse, TokenResponse
from app.services.user_service import create_user, get_user_by_email, get_user_by_id, get_tenant_name
from app.services.auth_service import verify_password, create_access_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: SignupRequest):
    return await create_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_email(form_data.username) # OAuth2 uses username field
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user_id: str = Depends(get_current_user)):
    user = await get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    tenant_name = await get_tenant_name(user.get("tenant_id"))
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        tenant_id=user.get("tenant_id"),
        tenant_role=user.get("tenant_role"),
        tenant_name=tenant_name,
        created_at=user["created_at"]
    )
