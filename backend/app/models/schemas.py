"""
Pydantic schemas — request / response models for all API endpoints.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    created_at: Optional[datetime] = None


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    id: str
    message: str
    response: str
    sentiment: str
    category: str
    session_id: str
    created_at: datetime


class ChatHistoryItem(BaseModel):
    id: str
    message: str
    response: str
    sentiment: str
    category: Optional[str] = "general"
    session_id: Optional[str] = None
    created_at: datetime


class ChatSession(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime


# ── ML ────────────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    sentiment: str


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_chats: int
    sentiment_breakdown: dict
    category_breakdown: dict
    most_active_users: List[dict]
