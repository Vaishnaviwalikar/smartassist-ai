"""
Chat Routes
POST /chat             — send message, get AI response
GET  /chat-history     — all chats for the current user
GET  /chat-session/{id} — all chats in a specific session
DELETE /chat/{id}      — delete a single chat message
POST /chat/upload      — upload PDF/DOCX and get AI summary
GET  /chat/export/{session_id} — export session as plain text
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse, StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, ChatHistoryItem, ChatSession
from app.auth.jwt_handler import get_current_user
from app.database.supabase_client import get_supabase_admin
from app.services.gemini_service import get_gemini_response, get_gemini_stream, generate_chat_title, summarize_document
from app.services.sentiment_service import analyze_sentiment
from app.utils.text_cleaner import sanitize_for_prompt
from app.services.file_service import extract_text_from_file

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def send_message(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Full chat pipeline: clean → classify → sentiment → Gemini → store."""
    from app.ml.classifier import QuestionClassifier

    db = get_supabase_admin()
    user_id = current_user["sub"]

    # ── 1. Sanitize input ──────────────────────────────────────────────────────
    try:
        clean_message = sanitize_for_prompt(body.message)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # ── 2. ML classification ───────────────────────────────────────────────────
    classifier = QuestionClassifier()
    category, confidence = classifier.predict(clean_message)
    system_suffix = classifier.get_system_prompt_suffix(category)
    logger.info(f"Category: {category} ({confidence:.2%})")

    # ── 3. Sentiment analysis ──────────────────────────────────────────────────
    sentiment = analyze_sentiment(clean_message)

    # ── 4. Session handling ────────────────────────────────────────────────────
    session_id = body.session_id
    if not session_id:
        session_id = str(uuid.uuid4())
        title = await generate_chat_title(clean_message)
        db.table("chat_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "title": title,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

    # ── 5. Retrieve conversation history ───────────────────────────────────────
    history_res = (
        db.table("chats")
        .select("message, response")
        .eq("session_id", session_id)
        .order("created_at")
        .limit(20)
        .execute()
    )
    history = history_res.data or []

    # ── 6. Call Gemini ─────────────────────────────────────────────────────────
    try:
        ai_response = await get_gemini_response(clean_message, system_suffix, history)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # ── 7. Store in Supabase ───────────────────────────────────────────────────
    chat_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    db.table("chats").insert({
        "id": chat_id,
        "user_id": user_id,
        "session_id": session_id,
        "message": clean_message,
        "response": ai_response,
        "sentiment": sentiment,
        "category": category,
        "created_at": now,
    }).execute()

    return ChatResponse(
        id=chat_id,
        message=clean_message,
        response=ai_response,
        sentiment=sentiment,
        category=category,
        session_id=session_id,
        created_at=datetime.utcnow(),
    )


@router.get("/chat-history", response_model=list[ChatHistoryItem])
async def get_chat_history(
    search: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Fetch all chats for the user with optional search / sentiment filter."""
    db = get_supabase_admin()
    user_id = current_user["sub"]

    query = db.table("chats").select("*").eq("user_id", user_id).order("created_at", desc=True)

    if sentiment:
        query = query.eq("sentiment", sentiment)

    result = query.limit(100).execute()
    chats = result.data or []

    if search:
        s = search.lower()
        chats = [c for c in chats if s in c["message"].lower() or s in c["response"].lower()]

    return [ChatHistoryItem(**c) for c in chats]


@router.get("/chat-sessions", response_model=list[ChatSession])
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """Return all chat sessions for the current user."""
    db = get_supabase_admin()
    result = (
        db.table("chat_sessions")
        .select("*")
        .eq("user_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return [ChatSession(**s) for s in (result.data or [])]


@router.get("/chat-session/{session_id}", response_model=list[ChatHistoryItem])
async def get_session_chats(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return all messages within a specific chat session."""
    db = get_supabase_admin()
    result = (
        db.table("chats")
        .select("*")
        .eq("session_id", session_id)
        .eq("user_id", current_user["sub"])
        .order("created_at")
        .execute()
    )
    return [ChatHistoryItem(**c) for c in (result.data or [])]


@router.delete("/chat/{chat_id}", status_code=204)
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a single chat message owned by the user."""
    db = get_supabase_admin()
    db.table("chats").delete().eq("id", chat_id).eq("user_id", current_user["sub"]).execute()


@router.post("/chat/upload")
async def upload_and_summarize(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Extract text from PDF/DOCX and return an AI-generated summary."""
    content = await file.read()
    try:
        text = extract_text_from_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    summary = await summarize_document(text)
    return {"filename": file.filename, "summary": summary, "char_count": len(text)}


@router.websocket("/chat/stream")
async def stream_chat(websocket: WebSocket):
    """WebSocket endpoint — streams Gemini response token by token."""
    from app.ml.classifier import QuestionClassifier
    from app.auth.jwt_handler import decode_token

    await websocket.accept()
    try:
        data = await websocket.receive_json()
        token = data.get("token")
        message = data.get("message", "")
        session_id = data.get("session_id")

        # Verify JWT
        user = decode_token(token)
        if not user:
            await websocket.send_json({"error": "Unauthorized"})
            await websocket.close()
            return

        db = get_supabase_admin()
        user_id = user["sub"]

        clean_message = sanitize_for_prompt(message)
        classifier = QuestionClassifier()
        category, _ = classifier.predict(clean_message)
        system_suffix = classifier.get_system_prompt_suffix(category)
        sentiment = analyze_sentiment(clean_message)

        # Session handling
        if not session_id:
            session_id = str(uuid.uuid4())
            title = await generate_chat_title(clean_message)
            db.table("chat_sessions").insert({
                "id": session_id, "user_id": user_id,
                "title": title, "created_at": datetime.utcnow().isoformat(),
            }).execute()

        history_res = db.table("chats").select("message, response").eq("session_id", session_id).order("created_at").limit(20).execute()
        history = history_res.data or []

        # Send metadata first
        await websocket.send_json({"type": "meta", "session_id": session_id, "category": category, "sentiment": sentiment})

        # Stream response chunks
        full_response = ""
        async for chunk in get_gemini_stream(clean_message, system_suffix, history):
            full_response += chunk
            await websocket.send_json({"type": "chunk", "text": chunk})

        # Save to DB
        chat_id = str(uuid.uuid4())
        db.table("chats").insert({
            "id": chat_id, "user_id": user_id, "session_id": session_id,
            "message": clean_message, "response": full_response,
            "sentiment": sentiment, "category": category,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

        await websocket.send_json({"type": "done", "chat_id": chat_id})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Stream error: {e}")
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()


@router.get("/chat/export/{session_id}", response_class=PlainTextResponse)
async def export_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Export a chat session as a plain text transcript."""
    db = get_supabase_admin()
    result = (
        db.table("chats")
        .select("*")
        .eq("session_id", session_id)
        .eq("user_id", current_user["sub"])
        .order("created_at")
        .execute()
    )
    chats = result.data or []
    lines = ["SmartAssist AI — Chat Export", "=" * 40, ""]
    for c in chats:
        lines.append(f"You: {c['message']}")
        lines.append(f"AI:  {c['response']}")
        lines.append(f"[{c['created_at']} | sentiment: {c['sentiment']} | category: {c.get('category','general')}]")
        lines.append("")
    return "\n".join(lines)
