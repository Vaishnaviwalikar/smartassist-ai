"""
ML Routes
POST /predict-category  — classify a text snippet
GET  /analytics         — per-user sentiment & category breakdown
"""

import logging

from fastapi import APIRouter, Depends

from app.models.schemas import ClassifyRequest, ClassifyResponse
from app.auth.jwt_handler import get_current_user
from app.database.supabase_client import get_supabase_admin
from app.services.sentiment_service import analyze_sentiment
from app.ml.classifier import QuestionClassifier

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/predict-category", response_model=ClassifyResponse)
async def predict_category(
    body: ClassifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Classify text and return category + sentiment."""
    classifier = QuestionClassifier()
    category, confidence = classifier.predict(body.text)
    sentiment = analyze_sentiment(body.text)
    return ClassifyResponse(category=category, confidence=confidence, sentiment=sentiment)


@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """Return per-user analytics: sentiment breakdown, category breakdown."""
    db = get_supabase_admin()
    user_id = current_user["sub"]

    result = db.table("chats").select("sentiment, category").eq("user_id", user_id).execute()
    chats = result.data or []

    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    category_counts: dict = {}

    for chat in chats:
        s = chat.get("sentiment", "neutral")
        sentiment_counts[s] = sentiment_counts.get(s, 0) + 1

        c = chat.get("category", "general")
        category_counts[c] = category_counts.get(c, 0) + 1

    return {
        "total_chats": len(chats),
        "sentiment_breakdown": sentiment_counts,
        "category_breakdown": category_counts,
    }
