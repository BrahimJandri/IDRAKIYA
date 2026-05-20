from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import PaymentStatus, Role
from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.course import Category, Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.models.session import UserSession
from app.models.user import User
from app.schemas.admin import (
    AdminCourseOut,
    AdminPaymentOut,
    AdminUserOut,
    AdminUserUpdate,
    StatsOut,
)
from app.schemas.course import CategoryCreate, CategoryOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsOut)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    total_users       = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    total_instructors = (await db.execute(select(func.count()).select_from(User).where(User.role == Role.instructor))).scalar_one()
    total_courses     = (await db.execute(select(func.count()).select_from(Course))).scalar_one()
    published_courses = (await db.execute(select(func.count()).select_from(Course).where(Course.is_published == True))).scalar_one()
    total_enrollments = (await db.execute(select(func.count()).select_from(Enrollment))).scalar_one()
    total_payments    = (await db.execute(select(func.count()).select_from(Payment).where(Payment.status == PaymentStatus.completed))).scalar_one()
    revenue_row       = (await db.execute(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == PaymentStatus.completed))).scalar_one()

    return StatsOut(
        total_users=total_users,
        total_instructors=total_instructors,
        total_courses=total_courses,
        published_courses=published_courses,
        total_enrollments=total_enrollments,
        total_payments=total_payments,
        total_revenue=Decimal(str(revenue_row)),
    )


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[AdminUserOut])
async def list_users(
    search: Optional[str] = None,
    role: Optional[Role] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(User)
    if search:
        q = q.where(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
    if role:
        q = q.where(User.role == role)
    q = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    return (await db.execute(q)).scalars().all()


@router.patch("/users/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account here")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    if payload.is_active is False:
        # Revoke all sessions when disabling a user
        await db.execute(
            update(UserSession)
            .where(UserSession.user_id == user_id)
            .values(is_active=False)
        )
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)


# ── Courses ───────────────────────────────────────────────────────────────────

@router.get("/courses", response_model=List[AdminCourseOut])
async def list_all_courses(
    search: Optional[str] = None,
    is_published: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(Course)
    if search:
        q = q.where(Course.title.ilike(f"%{search}%"))
    if is_published is not None:
        q = q.where(Course.is_published == is_published)
    q = q.order_by(Course.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    return (await db.execute(q)).scalars().all()


@router.patch("/courses/{course_id}", response_model=AdminCourseOut)
async def admin_update_course(
    course_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in payload.items():
        if hasattr(course, field):
            setattr(course, field, value)
    return course


@router.delete("/courses/{course_id}", status_code=204)
async def admin_delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryOut])
async def admin_list_categories(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return (await db.execute(select(Category))).scalars().all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
async def admin_create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    cat = Category(**payload.model_dump())
    db.add(cat)
    await db.flush()
    return cat


@router.delete("/categories/{category_id}", status_code=204)
async def admin_delete_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)


# ── Payments ──────────────────────────────────────────────────────────────────

@router.get("/payments", response_model=List[AdminPaymentOut])
async def list_all_payments(
    status: Optional[PaymentStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(Payment)
    if status:
        q = q.where(Payment.status == status)
    q = q.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    return (await db.execute(q)).scalars().all()
