from enum import Enum


class Role(str, Enum):
    student = "student"
    instructor = "instructor"
    admin = "admin"


class CourseLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class EnrollmentStatus(str, Enum):
    active = "active"
    completed = "completed"
    dropped = "dropped"
