"""
Gemini API Service
Handles prompt construction, context memory injection, and API calls.
"""

import logging
from typing import List, Dict

import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini SDK
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_INSTRUCTION = (
    "You are SmartAssist AI, an intelligent and friendly assistant. "
    "You provide clear, accurate, and helpful answers. "
    "You support markdown formatting in your responses including code blocks, "
    "tables, and bullet points. "
    "You are context-aware and remember the conversation history provided to you."
)


def build_prompt(
    user_message: str,
    category_suffix: str,
    history: List[Dict[str, str]],
) -> List[Dict]:
    """
    Build a Gemini-compatible content list with:
    - System context
    - Previous conversation history (last 10 turns)
    - Current user message
    """
    contents = []

    # Inject history (last 10 exchanges to stay within token budget)
    for turn in history[-10:]:
        contents.append({"role": "user",  "parts": [turn["message"]]})
        contents.append({"role": "model", "parts": [turn["response"]]})

    # Current message with category-aware suffix
    enhanced_message = (
        f"{user_message}\n\n"
        f"[Context: {category_suffix}]"
    )
    contents.append({"role": "user", "parts": [enhanced_message]})
    return contents


def detect_language(text: str) -> str:
    """Detect language and return instruction for Gemini to respond in same language."""
    try:
        from textblob import TextBlob
        lang = TextBlob(text).detect_language()
        if lang and lang != 'en':
            return f" Always respond in the same language as the user. The user is writing in language code: {lang}."
    except Exception:
        pass
    return ""


async def get_gemini_response(
    user_message: str,
    category_suffix: str,
    history: List[Dict[str, str]],
) -> str:
    """
    Send prompt to Gemini and return the text response.
    Includes automatic retry on transient errors.
    """
    lang_instruction = detect_language(user_message)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=f"{SYSTEM_INSTRUCTION} {category_suffix}{lang_instruction}",
    )

    contents = build_prompt(user_message, category_suffix, history)

    for attempt in range(3):
        try:
            response = model.generate_content(contents)
            return response.text
        except Exception as e:
            logger.warning(f"Gemini attempt {attempt + 1} failed: {e}")
            if attempt == 2:
                raise RuntimeError(f"Gemini API unavailable after 3 retries: {e}")

    return "I'm sorry, I couldn't generate a response right now. Please try again."


async def get_gemini_stream(
    user_message: str,
    category_suffix: str,
    history: List[Dict[str, str]],
):
    """Stream Gemini response chunk by chunk."""
    import asyncio
    lang_instruction = detect_language(user_message)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=f"{SYSTEM_INSTRUCTION} {category_suffix}{lang_instruction}",
    )
    contents = build_prompt(user_message, category_suffix, history)
    response = await asyncio.to_thread(model.generate_content, contents, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text


async def generate_chat_title(first_message: str) -> str:
    """Use Gemini to auto-generate a short, descriptive chat session title."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    try:
        prompt = (
            f"Generate a short, descriptive title (max 6 words) for a chat session "
            f"that starts with this message: '{first_message}'. "
            f"Return ONLY the title, nothing else."
        )
        response = model.generate_content(prompt)
        title = response.text.strip().strip('"').strip("'")
        return title[:60]  # Safety cap
    except Exception as e:
        logger.error(f"Title generation failed: {e}")
        return "New Conversation"


async def summarize_document(content: str) -> str:
    """Summarize extracted document text using Gemini."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    try:
        prompt = (
            f"Please provide a comprehensive summary of the following document. "
            f"Include key points, main topics, and important details:\n\n{content[:8000]}"
        )
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        raise RuntimeError("Could not summarize document.")
