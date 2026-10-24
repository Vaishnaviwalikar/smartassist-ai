"""
Auth Routes — /api/signup, /api/login, /api/profile
"""

import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends

from app.models.schemas import SignupRequest, LoginRequest, TokenResponse, UserProfile
from app.auth.password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token, get_current_user
from app.database.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest):
    """Register a new user and return a JWT token."""
    db = get_supabase_admin()

    # Check if email already exists
    existing = db.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user_id = str(uuid.uuid4())
    hashed = hash_password(data.password)

    result = db.table("users").insert({
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hashed,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user.")

    token = create_access_token({"sub": user_id, "email": data.email, "name": data.name})
    logger.info(f"New user registered: {data.email}")
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Authenticate user and return a JWT token."""
    db = get_supabase_admin()

    result = db.table("users").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = result.data[0]
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
    })
    logger.info(f"User logged in: {data.email}")
    return TokenResponse(access_token=token)


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    db = get_supabase_admin()
    result = db.table("users").select("id, name, email, created_at").eq("id", current_user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserProfile(**result.data[0])
