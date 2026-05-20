import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, Numeric,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.core.permissions import CourseLevel


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), unique=True, nullable=False)
    slug = Column(String(128), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String(512), nullable=True)

    courses = relationship("Course", back_populates="category")


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(512), nullable=True)
    preview_video_url = Column(String(512), nullable=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    is_free = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    level = Column(Enum(CourseLevel), nullable=False, default=CourseLevel.beginner)
    language = Column(String(64), nullable=False, default="Arabic")
    duration_hours = Column(Float, nullable=True)
    total_lessons = Column(Integer, default=0)
    # Watermark metadata embedded per video stream (user_id injected at serve time)
    watermark_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    instructor = relationship("User", back_populates="courses_taught")
    category = relationship("Category", back_populates="courses")
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan", order_by="Chapter.order")
    enrollments = relationship("Enrollment", back_populates="course")
    payments = relationship("Payment", back_populates="course")
    reviews = relationship("Review", back_populates="course")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False, default=0)
    is_free_preview = Column(Boolean, default=False)

    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan", order_by="Lesson.order")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String(512), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    is_preview = Column(Boolean, default=False)
    resource_url = Column(String(512), nullable=True)
    resource_name = Column(String(255), nullable=True)

    chapter = relationship("Chapter", back_populates="lessons")
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
