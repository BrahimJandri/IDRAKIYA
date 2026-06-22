import base64
import io
import secrets
import uuid as uuid_lib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List
from uuid import UUID

import httpx
import pyotp
import qrcode
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from jose import JWTError
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.permissions import Role
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_verification_token,
    hash_password,
    hash_token,
    verify_password,
    decode_token,
)
from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.session import UserSession
from app.models.user import User
from app.schemas.user import (
    GoogleAuthPayload,
    PasswordChange,
    RefreshRequest,
    SessionOut,
    TokenPair,
    TwoFALoginRequest,
    TwoFARecoverySend,
    TwoFARecoveryVerify,
    TwoFASetupOut,
    TwoFAVerify,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdate,
)
from app.services.redis_client import get_redis
from app.services.email import send_recovery_email

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
        is_active=False,
        verification_token=generate_verification_token(),
    )
    db.add(user)
    await db.flush()
    # TODO: send verification email with user.verification_token
    return user


@router.post("/login")
async def login(payload: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user: User | None = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="يرجى إنشاء حساب أولاً")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="pending_approval")

    # 2FA enforcement disabled — re-enable when email/SMTP is configured
    # if user.totp_enabled:
    #     temp_token = create_access_token(
    #         {"sub": str(user.id), "type": "2fa_pending",
    #          "dn": payload.device_name, "dt": payload.device_type},
    #         expires_delta=timedelta(minutes=5),
    #     )
    #     return {"requires_2fa": True, "temp_token": temp_token}

    return await _issue_tokens(user, payload.device_name, payload.device_type, request, db)


async def _issue_tokens(user: User, device_name, device_type, request: Request, db: AsyncSession) -> TokenPair:
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.is_active == True)
        .values(is_active=False)
    )
    refresh_token = create_refresh_token({"sub": str(user.id)})
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    session = UserSession(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        device_name=device_name,
        device_type=device_type,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "sid": str(session.id),
    })
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/2fa/login", response_model=TokenPair)
async def login_2fa(payload: TwoFALoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    invalid = HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        data = decode_token(payload.temp_token)
        if data.get("type") != "2fa_pending":
            raise invalid
        user_id = UUID(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise invalid

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user or not user.is_active or not user.totp_enabled or not user.totp_secret:
        raise invalid

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    return await _issue_tokens(user, data.get("dn"), data.get("dt"), request, db)


@router.post("/2fa/setup", response_model=TwoFASetupOut)
async def setup_2fa(current_user: User = Depends(get_current_user)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="IDRAKIYA")

    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    # Store the secret temporarily (not enabled yet — confirmed in /2fa/enable)
    current_user.totp_secret = secret
    return TwoFASetupOut(otpauth_uri=uri, qr_base64=qr_b64)


@router.post("/2fa/enable", response_model=UserOut)
async def enable_2fa(
    payload: TwoFAVerify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Run /2fa/setup first")
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code — try again")
    current_user.totp_enabled = True
    return current_user


@router.post("/2fa/disable", response_model=UserOut)
async def disable_2fa(
    payload: TwoFAVerify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")
    current_user.totp_enabled = False
    current_user.totp_secret = None
    return current_user


@router.post("/google", response_model=TokenPair)
async def google_auth(payload: GoogleAuthPayload, request: Request, db: AsyncSession = Depends(get_db)):
    """Sign in or register with a Google OAuth access token."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {payload.access_token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    info = resp.json()
    email: str = info.get("email", "")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    result = await db.execute(select(User).where(User.email == email))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(secrets.token_hex(32)),
            full_name=info.get("name", email.split("@")[0]),
            avatar_url=info.get("picture"),
            role=Role.student,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
    elif not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.is_active == True)
        .values(is_active=False)
    )

    refresh_token = create_refresh_token({"sub": str(user.id)})
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        device_name=payload.device_name,
        device_type=payload.device_type,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "sid": str(session.id),
    })
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    invalid = HTTPException(status_code=401, detail="Invalid or expired refresh token")
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise invalid
        user_id = UUID(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise invalid

    token_hash = hash_token(payload.refresh_token)
    result = await db.execute(
        select(UserSession).where(
            UserSession.token_hash == token_hash,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )
    session: UserSession | None = result.scalar_one_or_none()
    if not session:
        raise invalid

    user_result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise invalid

    # Rotate refresh token (invalidate old, issue new)
    new_refresh = create_refresh_token({"sub": str(user.id)})
    new_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    session.token_hash = hash_token(new_refresh)
    session.expires_at = new_expires
    session.last_used_at = datetime.now(timezone.utc)

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "sid": str(session.id),
    })
    return TokenPair(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token_hash = hash_token(payload.refresh_token)
    result = await db.execute(
        select(UserSession).where(
            UserSession.token_hash == token_hash,
            UserSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session:
        session.is_active = False


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke all active sessions for the current user (sign out from every device)."""
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == current_user.id, UserSession.is_active == True)
        .values(is_active=False)
    )


@router.get("/sessions", response_model=List[SessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True,
        )
    )
    return result.scalars().all()


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    return current_user


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم. المسموح: jpg, png, webp, gif")

    max_bytes = 5 * 1024 * 1024  # 5 MB
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail="حجم الملف كبير جداً. الحد الأقصى 5 ميغابايت")

    avatars_dir = Path(settings.UPLOAD_DIR) / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid_lib.uuid4()}{ext}"
    (avatars_dir / filename).write_bytes(contents)

    current_user.avatar_url = f"/media/avatars/{filename}"
    return current_user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    # Revoke all sessions so all devices must re-login
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == current_user.id)
        .values(is_active=False)
    )


# ── 2FA Recovery (lost authenticator) ────────────────────────────────────────

@router.post("/2fa/recovery/send", status_code=status.HTTP_204_NO_CONTENT)
async def send_2fa_recovery(payload: TwoFARecoverySend, db: AsyncSession = Depends(get_db)):
    """Send a 6-digit recovery code to the user's email. Requires a valid 2fa_pending temp_token."""
    invalid = HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        data = decode_token(payload.temp_token)
        if data.get("type") != "2fa_pending":
            raise invalid
        user_id = UUID(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise invalid

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise invalid

    code = f"{secrets.randbelow(1_000_000):06d}"
    redis = await get_redis()
    await redis.setex(f"2fa_recovery:{user_id}", 600, code)  # 10-minute TTL

    await send_recovery_email(user.email, code)


@router.post("/2fa/recovery/verify", response_model=TokenPair)
async def verify_2fa_recovery(payload: TwoFARecoveryVerify, request: Request, db: AsyncSession = Depends(get_db)):
    """Verify the recovery code, disable 2FA, and issue full tokens."""
    invalid = HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        data = decode_token(payload.temp_token)
        if data.get("type") != "2fa_pending":
            raise invalid
        user_id = UUID(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise invalid

    redis = await get_redis()
    stored = await redis.get(f"2fa_recovery:{user_id}")
    if not stored or stored != payload.code:
        raise HTTPException(status_code=401, detail="رمز الاسترداد غير صحيح أو منتهي الصلاحية")

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise invalid

    # Disable 2FA so user can re-enroll
    user.totp_enabled = False
    user.totp_secret = None
    await redis.delete(f"2fa_recovery:{user_id}")

    return await _issue_tokens(user, data.get("dn"), data.get("dt"), request, db)


# ── Admin: pending user approvals ────────────────────────────────────────────

@router.get("/admin/pending-users", response_model=List[UserOut])
async def list_pending_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).where(User.is_active == False, User.role != "admin").order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.post("/admin/approve-user/{user_id}", response_model=UserOut)
async def approve_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.commit()
    return user


@router.post("/admin/reject-user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def reject_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
