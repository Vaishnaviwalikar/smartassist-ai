"""
Text cleaning utilities — remove noise before sending to Gemini.
"""

import re
import logging

logger = logging.getLogger(__name__)

# Very basic profanity / spam word list (extend as needed)
_BLOCKED_PATTERNS = re.compile(
    r"\b(spam|scam|buy now|click here|free money|xxx)\b",
    re.IGNORECASE,
)


def clean_text(text: str) -> str:
    """
    1. Strip leading/trailing whitespace
    2. Collapse multiple spaces/newlines
    3. Remove HTML tags
    4. Normalize unicode quotes
    """
    text = text.strip()
    text = re.sub(r"<[^>]+>", "", text)          # strip HTML
    text = re.sub(r"[ \t]+", " ", text)           # collapse spaces
    text = re.sub(r"\n{3,}", "\n\n", text)        # collapse blank lines
    text = text.replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    return text


def is_spam_or_abusive(text: str) -> bool:
    """Return True if the text contains obvious spam / abusive patterns."""
    if _BLOCKED_PATTERNS.search(text):
        logger.warning("Blocked message matched spam/abusive pattern.")
        return True
    return False


def sanitize_for_prompt(text: str) -> str:
    """Full pipeline: clean + abuse-check, raise ValueError on blocked input."""
    cleaned = clean_text(text)
    if is_spam_or_abusive(cleaned):
        raise ValueError("Message contains inappropriate or spam content.")
    return cleaned
