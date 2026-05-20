# IDRAKIYA — Online Courses Platform (Backend)

FastAPI + PostgreSQL backend for IDRAKIYA, an Arabic online course platform.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | FastAPI (async) |
| ORM | SQLAlchemy 2 (async) |
| DB | PostgreSQL 16 |
| Cache/Blacklist | Redis 7 |
| Auth | JWT (access + refresh token rotation) |
| Payments | Stripe (PaymentIntent) |
| Migrations | Alembic |

## Quick Start

```bash
# 1. Copy env file and fill in values
cp .env.example .env

# 2. Start Postgres + Redis
docker compose up db redis -d

# 3. Create and activate virtualenv
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 4. Run migrations
alembic upgrade head

# 5. Start dev server
uvicorn app.main:app --reload
```

Interactive API docs: http://localhost:8000/api/docs

## Run Everything with Docker

```bash
docker compose up --build
```

## API Overview

### Auth  `POST /api/v1/auth/...`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create student/instructor account |
| POST | `/login` | Login — returns access + refresh tokens, creates device session |
| POST | `/refresh` | Rotate refresh token, get new access token |
| POST | `/logout` | Revoke current device session |
| POST | `/logout-all` | Sign out from all devices |
| GET | `/sessions` | List all active device sessions |
| DELETE | `/sessions/{id}` | Revoke a specific session |
| GET | `/me` | Current user profile |
| PATCH | `/me` | Update profile |
| POST | `/me/change-password` | Change password (invalidates all sessions) |

### Courses  `GET/POST /api/v1/courses/...`
| Method | Path | Description |
|---|---|---|
| GET | `/courses` | List published courses (search, filter, paginate) |
| POST | `/courses` | Create course (instructor/admin) |
| GET | `/courses/{id}` | Course detail with chapters/lessons |
| PATCH | `/courses/{id}` | Update course |
| DELETE | `/courses/{id}` | Delete course |
| POST | `/courses/{id}/chapters` | Add chapter |
| POST | `/courses/{id}/chapters/{ch}/lessons` | Add lesson |
| GET | `/courses/{id}/chapters/{ch}/lessons/{ls}` | Get lesson with video URL (enrolled only) |

### Enrollments  `/api/v1/enrollments/...`
| Method | Path | Description |
|---|---|---|
| POST | `/{course_id}` | Enroll (free courses, or after payment) |
| GET | `/` | My enrollments |
| GET | `/{course_id}` | Enrollment detail + progress |
| POST | `/{course_id}/progress/{lesson_id}` | Update lesson watch time / mark complete |

### Payments  `/api/v1/payments/...`
| Method | Path | Description |
|---|---|---|
| POST | `/checkout` | Create Stripe PaymentIntent |
| POST | `/webhook` | Stripe webhook handler |
| GET | `/my` | My payment history |
| POST | `/courses/{id}/reviews` | Leave a review (enrolled students) |
| GET | `/courses/{id}/reviews` | List course reviews |

## Role System

| Role | Can do |
|---|---|
| `student` | Enroll, track progress, review |
| `instructor` | All student actions + create/manage own courses |
| `admin` | Everything |

## Session & Security Design

- **Multi-device**: each login creates a `UserSession` row (device name, type, IP, user-agent) — users can see and revoke individual sessions.
- **Refresh token rotation**: every `/auth/refresh` call invalidates the old token and issues a new one.
- **Password change**: automatically revokes all active sessions.
- **Video watermarking**: `watermark_enabled` flag per course — the video URL delivered per lesson carries per-user metadata so leaked screenshots/recordings are traceable.

## Migrations

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.
