"""
Admin Routes — GET /admin/stats
Requires a valid JWT (any logged-in user can see aggregate stats for demo;
add role-based access control for production).
"""

import logging

from fastapi import APIRouter, Depends

from app.models.schemas import AdminStats
from app.auth.jwt_handler import get_current_user
from app.database.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/admin/stats", response_model=AdminStats)
async def admin_stats(current_user: dict = Depends(get_current_user)):
    """Return platform-wide statistics for the admin dashboard."""
    db = get_supabase_admin()

    # Total users
    users_res = db.table("users").select("id", count="exact").execute()
    total_users = users_res.count or len(users_res.data or [])

    # Total chats + breakdown
    chats_res = db.table("chats").select("user_id, sentiment, category").execute()
    chats = chats_res.data or []
    total_chats = len(chats)

    sentiment_breakdown: dict = {}
    category_breakdown: dict = {}
    user_message_count: dict = {}

    for chat in chats:
        s = chat.get("sentiment", "neutral")
        sentiment_breakdown[s] = sentiment_breakdown.get(s, 0) + 1

        c = chat.get("category", "general")
        category_breakdown[c] = category_breakdown.get(c, 0) + 1

        uid = chat.get("user_id", "")
        user_message_count[uid] = user_message_count.get(uid, 0) + 1

    # Most active users (top 5)
    top_user_ids = sorted(user_message_count, key=user_message_count.get, reverse=True)[:5]
    most_active_users = []
    for uid in top_user_ids:
        u_res = db.table("users").select("name, email").eq("id", uid).execute()
        if u_res.data:
            most_active_users.append({
                "name": u_res.data[0]["name"],
                "email": u_res.data[0]["email"],
                "message_count": user_message_count[uid],
            })

    return AdminStats(
        total_users=total_users,
        total_chats=total_chats,
        sentiment_breakdown=sentiment_breakdown,
        category_breakdown=category_breakdown,
        most_active_users=most_active_users,
    )
