import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UserSession(Base):
    """Tracks per-device refresh tokens to support multi-device login."""

    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    device_name = Column(String(255), nullable=True)
    device_type = Column(String(64), nullable=True)   # mobile / desktop / tablet
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_used_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
