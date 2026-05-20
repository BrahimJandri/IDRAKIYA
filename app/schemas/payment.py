from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.core.permissions import PaymentStatus


class PaymentCreate(BaseModel):
    course_id: UUID


class PaymentOut(BaseModel):
    id: UUID
    course_id: Optional[UUID]
    amount: Decimal
    currency: str
    status: PaymentStatus
    stripe_payment_intent_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentIntentOut(BaseModel):
    client_secret: str
    payment_id: UUID
    amount: Decimal
    currency: str


class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: UUID
    student_id: UUID
    course_id: UUID
    rating: float
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
