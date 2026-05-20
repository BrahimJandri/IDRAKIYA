import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.core.permissions import EnrollmentStatus


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_enrollment"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(EnrollmentStatus), nullable=False, default=EnrollmentStatus.active)
    progress_percent = Column(Float, default=0.0, nullable=False)
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    lesson_progress = relationship("LessonProgress", back_populates="enrollment", cascade="all, delete-orphan")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("enrollment_id", "lesson_id", name="uq_lesson_progress"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    watch_time_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    enrollment = relationship("Enrollment", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress_records")
