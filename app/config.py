from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "IDRAKIYA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    # Comma-separated in env: https://idrakiya.vercel.app,http://localhost:3000
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str
    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Media / uploads
    UPLOAD_DIR: str = "media"
    MAX_UPLOAD_SIZE_MB: int = 500

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
