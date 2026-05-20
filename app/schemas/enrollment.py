from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.core.permissions import EnrollmentStatus


class EnrollmentOut(BaseModel):
    id: UUID
    course_id: UUID
    student_id: UUID
    status: EnrollmentStatus
    progress_percent: float
    enrolled_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class LessonProgressUpdate(BaseModel):
    is_completed: bool
    watch_time_seconds: int = 0


class LessonProgressOut(BaseModel):
    lesson_id: UUID
    is_completed: bool
    watch_time_seconds: int
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
