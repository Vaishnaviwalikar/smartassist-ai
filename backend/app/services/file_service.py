"""
File Service — extract text from uploaded PDF and DOCX files.
"""

import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def extract_text_from_file(content: bytes, filename: str) -> str:
    """
    Extract plain text from a PDF, DOCX, or TXT file.
    Raises ValueError for unsupported formats.
    """
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}")

    if ext == ".txt":
        return content.decode("utf-8", errors="ignore")

    elif ext == ".pdf":
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join(
                page.extract_text() or "" for page in reader.pages
            )
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise ValueError("Could not extract text from PDF.")

    elif ext == ".docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            text = "\n".join(para.text for para in doc.paragraphs)
            return text.strip()
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            raise ValueError("Could not extract text from DOCX.")

    return ""
