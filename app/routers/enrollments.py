from datetime import datetime, timezone
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_student
from app.models.course import Course, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.user import User
from app.schemas.enrollment import EnrollmentOut, LessonProgressOut, LessonProgressUpdate

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


async def _get_enrollment(
    student_id: UUID, course_id: UUID, db: AsyncSession
) -> Enrollment:
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.post("/{course_id}", response_model=EnrollmentOut, status_code=201)
async def enroll(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    course_result = await db.execute(select(Course).where(Course.id == course_id, Course.is_published == True))
    course: Course | None = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if not course.is_free and float(course.price) > 0:
        # Check if payment exists
        from app.models.payment import Payment
        from app.core.permissions import PaymentStatus
        pay_result = await db.execute(
            select(Payment).where(
                Payment.student_id == current_user.id,
                Payment.course_id == course_id,
                Payment.status == PaymentStatus.completed,
            )
        )
        if not pay_result.scalar_one_or_none():
            raise HTTPException(status_code=402, detail="Payment required to enroll in this course")

    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already enrolled")

    enrollment = Enrollment(student_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    await db.flush()
    return enrollment


@router.get("", response_model=List[EnrollmentOut])
async def my_enrollments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Enrollment).where(Enrollment.student_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{course_id}", response_model=EnrollmentOut)
async def get_enrollment(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_enrollment(current_user.id, course_id, db)


@router.post("/{course_id}/progress/{lesson_id}", response_model=LessonProgressOut)
async def update_lesson_progress(
    course_id: UUID,
    lesson_id: UUID,
    payload: LessonProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollment = await _get_enrollment(current_user.id, course_id, db)

    result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.enrollment_id == enrollment.id,
            LessonProgress.lesson_id == lesson_id,
        )
    )
    progress: LessonProgress | None = result.scalar_one_or_none()

    if progress is None:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson_id,
            is_completed=payload.is_completed,
            watch_time_seconds=payload.watch_time_seconds,
            completed_at=datetime.now(timezone.utc) if payload.is_completed else None,
        )
        db.add(progress)
    else:
        progress.watch_time_seconds = max(progress.watch_time_seconds, payload.watch_time_seconds)
        if payload.is_completed and not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = datetime.now(timezone.utc)

    await db.flush()

    # Recalculate overall progress
    total_result = await db.execute(
        select(func.count()).select_from(Lesson).join(Lesson.chapter).where(
            Lesson.chapter.has(course_id=course_id)
        )
    )
    total_lessons: int = total_result.scalar_one() or 1

    completed_result = await db.execute(
        select(func.count()).select_from(LessonProgress).where(
            LessonProgress.enrollment_id == enrollment.id,
            LessonProgress.is_completed == True,
        )
    )
    completed: int = completed_result.scalar_one()

    enrollment.progress_percent = round((completed / total_lessons) * 100, 2)
    if enrollment.progress_percent >= 100:
        enrollment.status = "completed"
        enrollment.completed_at = datetime.now(timezone.utc)

    return progress
