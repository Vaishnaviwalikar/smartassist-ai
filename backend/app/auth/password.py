"""
Password hashing utilities using bcrypt via passlib.
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Return bcrypt hash of a plaintext password."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plaintext matches the bcrypt hash."""
    return pwd_context.verify(plain, hashed)
