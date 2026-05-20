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
    CourseOut,
    CourseUpdate,
    LessonCreate,
    LessonOut,
    LessonOutFull,
    LessonUpdate,
)

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
    existing = await db.execute(select(Course).where(Course.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already in use")

    course = Course(**payload.model_dump(), instructor_id=current_user.id)
    db.add(course)
    await db.flush()
    await db.refresh(course, ["category"])
    return course


@router.get("/{course_id}", response_model=CourseDetail)
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
    return course


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

    # Free preview or instructor/admin → full access
    is_privileged = current_user and current_user.role in ("admin", "instructor")
    is_owner = current_user and current_user.id == course.instructor_id

    if lesson.is_preview or is_privileged or is_owner:
        return LessonOutFull.model_validate(lesson)

    # Check enrollment
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    enroll_result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
        )
    )
    if not enroll_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    return LessonOutFull.model_validate(lesson)
