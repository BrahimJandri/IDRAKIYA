import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.core.permissions import PaymentStatus


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(8), nullable=False, default="USD")
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    stripe_payment_intent_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_charge_id = Column(String(255), nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    student = relationship("User", back_populates="payments")
    course = relationship("Course", back_populates="payments")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False)  # 1.0 – 5.0
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student = relationship("User", back_populates="reviews")
    course = relationship("Course", back_populates="reviews")
