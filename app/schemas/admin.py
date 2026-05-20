from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.core.permissions import Role, PaymentStatus


class AdminUserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: Role
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    role: Optional[Role] = None
    is_active: Optional[bool] = None


class AdminCourseOut(BaseModel):
    id: UUID
    title: str
    slug: str
    price: Decimal
    is_free: bool
    is_published: bool
    total_lessons: int
    created_at: datetime
    instructor_id: Optional[UUID]

    model_config = {"from_attributes": True}


class AdminPaymentOut(BaseModel):
    id: UUID
    student_id: Optional[UUID]
    course_id: Optional[UUID]
    amount: Decimal
    currency: str
    status: PaymentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class StatsOut(BaseModel):
    total_users: int
    total_instructors: int
    total_courses: int
    published_courses: int
    total_enrollments: int
    total_revenue: Decimal
    total_payments: int
