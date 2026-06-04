import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.config import settings
from app.dependencies.auth import require_instructor
from app.models.user import User

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".ogg", ".mov", ".avi"}

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(require_instructor),
):
    # Validate extension
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}")

    # Validate content-type header
    if file.content_type and file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Invalid content type")

    # Check size (stream first chunk to validate before reading all)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Save to media/videos/
    videos_dir = Path(settings.UPLOAD_DIR) / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{ext}"
    dest = videos_dir / filename
    dest.write_bytes(contents)

    return JSONResponse({"url": f"/media/videos/{filename}", "filename": filename})