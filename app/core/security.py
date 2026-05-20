import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(
        {**data, "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_refresh_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {**data, "exp": expire, "type": "refresh"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def hash_token(token: str) -> str:
    """Store only a hash of refresh tokens in the DB, never the raw token."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)
