from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Role
from app.core.security import decode_token
from app.database import get_db
from app.models.session import UserSession
from app.models.user import User

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise unauthorized
        user_id: str = payload.get("sub")
        session_id: str = payload.get("sid")
        if not user_id:
            raise unauthorized
    except JWTError:
        raise unauthorized

    # Validate user
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise unauthorized

    # Validate session — blocks revoked sessions immediately, no waiting for JWT expiry
    if session_id:
        sess_result = await db.execute(
            select(UserSession).where(
                UserSession.id == UUID(session_id),
                UserSession.user_id == UUID(user_id),
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc),
            )
        )
        if sess_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session revoked or expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user


def require_role(*roles: Role):
    async def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return _check


require_student = require_role(Role.student, Role.instructor, Role.admin)
require_instructor = require_role(Role.instructor, Role.admin)
require_admin = require_role(Role.admin)
