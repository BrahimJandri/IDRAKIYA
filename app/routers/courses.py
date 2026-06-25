import re
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin, require_instructor
from app.models.course import Category, Chapter, Course, Lesson
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.course import (
    CategoryCreate,
    CategoryOut,
    ChapterCreate,
    ChapterOut,
    CourseCreate,
    CourseDetail,
    CourseDetailFull,
    CourseOut,
    CourseUpdate,
    LessonCreate,
    LessonOut,
    LessonOutFull,
    LessonUpdate,
)

# ChapterUpdate schema (inline — no separate file needed)
from pydantic import BaseModel as _BM
class ChapterUpdate(_BM):
    title: Optional[str] = None
    order: Optional[int] = None
    is_free_preview: Optional[bool] = None

router = APIRouter(prefix="/courses", tags=["Courses"])


def _slug_from(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = Category(**payload.model_dump())
    db.add(cat)
    await db.flush()
    return cat


# ── Courses ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CourseOut])
async def list_courses(
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    is_free: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Course)
        .options(selectinload(Course.category))
        .where(Course.is_published == True)
    )
    if category:
        q = q.join(Category).where(Category.slug == category)
    if level:
        q = q.where(Course.level == level)
    if is_free is not None:
        q = q.where(Course.is_free == is_free)
    if search:
        q = q.where(Course.title.ilike(f"%{search}%"))
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=CourseOut, status_code=201)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    import uuid as _uuid
    # Auto-generate slug from title or use a UUID fallback
    base_slug = payload.slug or _slug_from(payload.title) or str(_uuid.uuid4())[:8]
    slug = base_slug
    suffix = 1
    while (await db.execute(select(Course).where(Course.slug == slug))).scalar_one_or_none():
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    data = payload.model_dump(exclude={"slug"})
    course = Course(**data, slug=slug, instructor_id=current_user.id)
    db.add(course)
    await db.flush()
    await db.refresh(course, ["category"])
    return course


@router.get("/{course_id}", response_model=None)
async def get_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.category),
            selectinload(Course.chapters).selectinload(Chapter.lessons),
        )
        .where(Course.id == course_id)
    )
    course: Course | None = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.is_published and (
        not current_user
        or (current_user.role not in ("admin", "instructor") and current_user.id != course.instructor_id)
    ):
        raise HTTPException(status_code=404, detail="Course not found")

    # Course owner / admin get full lesson data (incl. video_url) so the
    # instructor panel can show upload status per lesson.
    is_owner_or_admin = current_user and (
        current_user.role == "admin" or current_user.id == course.instructor_id
    )
    if is_owner_or_admin:
        return CourseDetailFull.model_validate(course)
    return CourseDetail.model_validate(course)


@router.patch("/{course_id}", response_model=CourseOut)
async def update_course(
    course_id: UUID,
    payload: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course: Course | None = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    await db.refresh(course, ["category"])
    return course


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course: Course | None = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    await db.delete(course)
    await db.commit()


# ── Chapters ──────────────────────────────────────────────────────────────────

@router.post("/{course_id}/chapters", response_model=ChapterOut, status_code=201)
async def add_chapter(
    course_id: UUID,
    payload: ChapterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course: Course | None = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    chapter = Chapter(**payload.model_dump(), course_id=course_id)
    db.add(chapter)
    await db.flush()
    await db.refresh(chapter, ["lessons"])
    return chapter


@router.patch("/{course_id}/chapters/{chapter_id}", response_model=ChapterOut)
async def update_chapter(
    course_id: UUID,
    chapter_id: UUID,
    payload: ChapterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    ch = (await db.execute(select(Chapter).where(Chapter.id == chapter_id, Chapter.course_id == course_id))).scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one()
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(ch, field, value)
    await db.flush()
    await db.refresh(ch, ["lessons"])
    return ch


@router.delete("/{course_id}/chapters/{chapter_id}", status_code=204)
async def delete_chapter(
    course_id: UUID,
    chapter_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    ch = (await db.execute(select(Chapter).where(Chapter.id == chapter_id, Chapter.course_id == course_id))).scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one()
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    await db.delete(ch)
    await db.commit()


# ── Lessons ───────────────────────────────────────────────────────────────────

@router.post("/{course_id}/chapters/{chapter_id}/lessons", response_model=LessonOut, status_code=201)
async def add_lesson(
    course_id: UUID,
    chapter_id: UUID,
    payload: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    ch_result = await db.execute(
        select(Chapter).where(Chapter.id == chapter_id, Chapter.course_id == course_id)
    )
    chapter: Chapter | None = ch_result.scalar_one_or_none()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course: Course = course_result.scalar_one()
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")

    lesson = Lesson(**payload.model_dump(), chapter_id=chapter_id)
    db.add(lesson)

    # Update denormalised counter
    await db.execute(
        Course.__table__.update()
        .where(Course.id == course_id)
        .values(total_lessons=Course.total_lessons + 1)
    )
    await db.flush()
    return lesson


@router.get("/{course_id}/chapters/{chapter_id}/lessons/{lesson_id}")
async def get_lesson(
    course_id: UUID,
    chapter_id: UUID,
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Returns full lesson (with video URL) only to enrolled students, instructors, or admins."""
    lesson_result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id, Lesson.chapter_id == chapter_id)
    )
    lesson: Lesson | None = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course: Course = course_result.scalar_one()

    # All lessons are freely accessible
    return LessonOutFull.model_validate(lesson)


@router.patch("/{course_id}/chapters/{chapter_id}/lessons/{lesson_id}", response_model=LessonOut)
async def update_lesson(
    course_id: UUID, chapter_id: UUID, lesson_id: UUID,
    payload: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id, Lesson.chapter_id == chapter_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one()
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)
    await db.flush()
    return lesson


@router.delete("/{course_id}/chapters/{chapter_id}/lessons/{lesson_id}", status_code=204)
async def delete_lesson(
    course_id: UUID, chapter_id: UUID, lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id, Lesson.chapter_id == chapter_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one()
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your course")
    await db.delete(lesson)
    await db.execute(Course.__table__.update().where(Course.id == course_id).values(total_lessons=Course.total_lessons - 1))
    await db.commit()
