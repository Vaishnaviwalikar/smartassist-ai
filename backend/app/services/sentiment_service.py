"""
Sentiment Analysis Service
Uses TextBlob polarity to classify messages as positive / negative / neutral.
"""

import logging
from textblob import TextBlob

logger = logging.getLogger(__name__)


def analyze_sentiment(text: str) -> str:
    """
    Returns 'positive', 'negative', or 'neutral' based on TextBlob polarity.
    Polarity ranges from -1.0 (very negative) to +1.0 (very positive).
    """
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity

        if polarity > 0.1:
            return "positive"
        elif polarity < -0.1:
            return "negative"
        else:
            return "neutral"
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return "neutral"


