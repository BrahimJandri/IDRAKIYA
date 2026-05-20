from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.routers import auth, courses, enrollments, payments

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.UPLOAD_DIR), name="media")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(enrollments.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
