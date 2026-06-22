from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator

from app.core.permissions import Role


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=32)
    role: Role = Role.student


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    device_name: Optional[str] = None
    device_type: Optional[str] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str]
    bio: Optional[str]
    role: Role
    is_active: bool
    is_verified: bool
    totp_enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

    @model_validator(mode="after")
    def passwords_differ(self):
        if self.current_password == self.new_password:
            raise ValueError("New password must differ from the current password")
        return self


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class TwoFAVerify(BaseModel):
    code: str

class TwoFALoginRequest(BaseModel):
    temp_token: str
    code: str

class TwoFASetupOut(BaseModel):
    otpauth_uri: str
    qr_base64: str

class GoogleAuthPayload(BaseModel):
    access_token: str
    device_name: Optional[str] = None
    device_type: Optional[str] = None


class SessionOut(BaseModel):
    id: UUID
    device_name: Optional[str]
    device_type: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    last_used_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}
