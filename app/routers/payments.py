import stripe
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.permissions import PaymentStatus
from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin, require_student
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment, Review
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentIntentOut,
    PaymentOut,
    ReviewCreate,
    ReviewOut,
)

router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/checkout", response_model=PaymentIntentOut, status_code=201)
async def create_checkout(
    payload: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    course_result = await db.execute(
        select(Course).where(Course.id == payload.course_id, Course.is_published == True)
    )
    course: Course | None = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.is_free or float(course.price) == 0:
        raise HTTPException(status_code=400, detail="Course is free — enroll directly")

    # Prevent double purchase
    existing = await db.execute(
        select(Payment).where(
            Payment.student_id == current_user.id,
            Payment.course_id == course.id,
            Payment.status == PaymentStatus.completed,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already purchased")

    amount_cents = int(float(course.price) * 100)
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="usd",
        metadata={"user_id": str(current_user.id), "course_id": str(course.id)},
    )

    payment = Payment(
        student_id=current_user.id,
        course_id=course.id,
        amount=course.price,
        currency="USD",
        status=PaymentStatus.pending,
        stripe_payment_intent_id=intent["id"],
    )
    db.add(payment)
    await db.flush()

    return PaymentIntentOut(
        client_secret=intent["client_secret"],
        payment_id=payment.id,
        amount=course.price,
        currency="USD",
    )


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        result = await db.execute(
            select(Payment).where(Payment.stripe_payment_intent_id == intent["id"])
        )
        payment: Payment | None = result.scalar_one_or_none()
        if payment:
            payment.status = PaymentStatus.completed
            payment.stripe_charge_id = intent.get("latest_charge")

    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        result = await db.execute(
            select(Payment).where(Payment.stripe_payment_intent_id == intent["id"])
        )
        payment = result.scalar_one_or_none()
        if payment:
            payment.status = PaymentStatus.failed
            payment.failure_reason = intent.get("last_payment_error", {}).get("message")

    return {"received": True}


@router.get("/my", response_model=List[PaymentOut])
async def my_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Payment).where(Payment.student_id == current_user.id)
    )
    return result.scalars().all()


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.post("/courses/{course_id}/reviews", response_model=ReviewOut, status_code=201, tags=["Reviews"])
async def leave_review(
    course_id: UUID,
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    enroll_result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
        )
    )
    if not enroll_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Must be enrolled to review")

    existing = await db.execute(
        select(Review).where(Review.student_id == current_user.id, Review.course_id == course_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already reviewed")

    review = Review(student_id=current_user.id, course_id=course_id, **payload.model_dump())
    db.add(review)
    await db.flush()
    return review


@router.get("/courses/{course_id}/reviews", response_model=List[ReviewOut], tags=["Reviews"])
async def list_reviews(course_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.course_id == course_id))
    return result.scalars().all()
