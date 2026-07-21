import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.config import settings
from app.dependencies.auth import require_instructor
from app.models.user import User

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".ogg", ".mov", ".avi"}

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(require_instructor),
):
    # Validate extension (the actual security boundary — files are saved under a
    # server-generated name with this extension; the browser-supplied content-type
    # is easily spoofed/unreliable and not checked)
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}")

    # Save to media/videos/
    videos_dir = Path(settings.UPLOAD_DIR) / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{ext}"
    dest = videos_dir / filename

    written = 0
    chunk_size = 1024 * 1024

    try:
        with dest.open("wb") as target:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                written += len(chunk)
                target.write(chunk)
    except HTTPException:
        if dest.exists():
            dest.unlink()
        raise

    return JSONResponse({"url": f"/media/videos/{filename}", "filename": filename})
