import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.core.permissions import Role


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(Enum(Role), nullable=False, default=Role.student)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    courses_taught = relationship("Course", back_populates="instructor")
    enrollments = relationship("Enrollment", back_populates="student")
    payments = relationship("Payment", back_populates="student")
    reviews = relationship("Review", back_populates="student")
