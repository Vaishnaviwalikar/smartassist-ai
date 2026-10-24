"""
ML Question Classifier
Uses TF-IDF + Logistic Regression to classify user questions into categories.
The predicted category is injected into the Gemini system prompt for better answers.
"""

import logging
import pickle
from pathlib import Path
from typing import Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from app.ml.dataset import TRAINING_DATA

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "classifier_model.pkl"

CATEGORIES = ["technology", "education", "health", "finance", "general"]

# System prompt suffixes per category
CATEGORY_PROMPTS = {
    "technology": "Answer as a senior software engineer and technology expert.",
    "education":  "Answer as an experienced educator and academic mentor.",
    "health":     "Answer as a knowledgeable health advisor (remind users to consult professionals).",
    "finance":    "Answer as a seasoned financial advisor (remind users to consult a professional).",
    "general":    "Answer in a helpful and friendly manner.",
}


class QuestionClassifier:
    """scikit-learn TF-IDF + LogReg pipeline for question category classification."""

    def __init__(self):
        self.pipeline: Pipeline | None = None

    def train(self) -> None:
        """Train on the built-in dataset and save model to disk."""
        texts = [item["text"] for item in TRAINING_DATA]
        labels = [item["label"] for item in TRAINING_DATA]

        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
            ("clf",   LogisticRegression(max_iter=300, C=5.0, solver="lbfgs")),
        ])
        self.pipeline.fit(X_train, y_train)

        acc = accuracy_score(y_test, self.pipeline.predict(X_test))
        logger.info(f"Classifier trained — accuracy: {acc:.2%}")

        # Persist to disk for faster restarts
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.pipeline, f)

    def load(self) -> bool:
        """Load pre-trained model from disk. Returns True on success."""
        if MODEL_PATH.exists():
            with open(MODEL_PATH, "rb") as f:
                self.pipeline = pickle.load(f)
            return True
        return False

    def predict(self, text: str) -> Tuple[str, float]:
        """Return (category, confidence) for the given text."""
        if self.pipeline is None:
            if not self.load():
                self.train()

        proba = self.pipeline.predict_proba([text])[0]
        classes = self.pipeline.classes_
        idx = int(np.argmax(proba))
        return classes[idx], float(proba[idx])

    def get_system_prompt_suffix(self, category: str) -> str:
        return CATEGORY_PROMPTS.get(category, CATEGORY_PROMPTS["general"])
