"""
SmartAssist AI — FastAPI Entry Point
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routes import auth, chat, ml, admin
from app.config import settings
from app.ml.classifier import QuestionClassifier

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    logger.info("🚀 SmartAssist AI backend starting …")
    # Train ML classifier once at startup
    classifier = QuestionClassifier()
    classifier.train()
    app.state.classifier = classifier
    logger.info("✅ ML Classifier ready")
    yield
    logger.info("🛑 SmartAssist AI backend shutting down …")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SmartAssist AI",
    description="Intelligent Context-Aware Chatbot — FastAPI Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(ml.router, prefix="/api", tags=["ML"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "SmartAssist AI is running 🤖"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
