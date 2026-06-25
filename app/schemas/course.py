from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.permissions import CourseLevel


# ── Category ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    slug: str = Field(min_length=2, max_length=128)
    description: Optional[str] = None
    icon_url: Optional[str] = None


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    icon_url: Optional[str]

    model_config = {"from_attributes": True}


# ── Lesson ────────────────────────────────────────────────────────────────────

class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    order: int = 0
    is_preview: bool = False
    resource_url: Optional[str] = None
    resource_name: Optional[str] = None


class LessonUpdate(LessonCreate):
    title: Optional[str] = None
    order: Optional[int] = None
    is_preview: Optional[bool] = None


class LessonOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    duration_seconds: Optional[int]
    order: int
    is_preview: bool
    resource_name: Optional[str]
    # video_url exposed only to enrolled users or admins — handled at router level

    model_config = {"from_attributes": True}


class LessonOutFull(LessonOut):
    video_url: Optional[str]
    resource_url: Optional[str]


# ── Chapter ───────────────────────────────────────────────────────────────────

class ChapterCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    order: int = 0
    is_free_preview: bool = False


class ChapterOut(BaseModel):
    id: UUID
    title: str
    order: int
    is_free_preview: bool
    lessons: List[LessonOut] = []

    model_config = {"from_attributes": True}


class ChapterOutFull(ChapterOut):
    lessons: List[LessonOutFull] = []


# ── Course ────────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    category_id: Optional[UUID] = None
    price: Decimal = Field(default=Decimal("0"), ge=0)
    is_free: bool = False
    level: CourseLevel = CourseLevel.beginner
    language: str = "Arabic"
    watermark_enabled: bool = True


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    category_id: Optional[UUID] = None
    price: Optional[Decimal] = None
    is_free: Optional[bool] = None
    is_published: Optional[bool] = None
    level: Optional[CourseLevel] = None
    language: Optional[str] = None
    watermark_enabled: Optional[bool] = None


class CourseOut(BaseModel):
    id: UUID
    title: str
    slug: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    preview_video_url: Optional[str]
    price: Decimal
    is_free: bool
    is_published: bool
    level: CourseLevel
    language: str
    duration_hours: Optional[float]
    total_lessons: int
    watermark_enabled: bool
    created_at: datetime
    category: Optional[CategoryOut]

    model_config = {"from_attributes": True}


class CourseDetail(CourseOut):
    chapters: List[ChapterOut] = []


class CourseDetailFull(CourseOut):
    chapters: List[ChapterOutFull] = []
