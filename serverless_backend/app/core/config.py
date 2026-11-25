"""Environment-driven settings.

Nothing deployment-specific is hardcoded here: Lambda gets its values from the
SAM template, local development gets them from `scripts/dev_server.py` or `.env`.
"""

import os
from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Oakie API"
    API_V1_STR: str = "/api/v1"

    # "cognito" verifies Cognito-issued JWTs (production).
    # "local" enables the dev-only identity provider under /api/v1/dev/auth.
    AUTH_MODE: Literal["cognito", "local"] = "cognito"

    # AWS
    AWS_REGION: str = "us-west-2"
    # Points boto3 at an emulator (moto server, DynamoDB Local, LocalStack).
    AWS_ENDPOINT_URL: str | None = None
    TABLE_NAME: str = "Oakie-Core"
    UPLOADS_BUCKET_NAME: str | None = None
    # Base URL uploaded objects are served from. Defaults to the bucket's S3 URL.
    UPLOADS_PUBLIC_BASE_URL: str | None = None

    # Cognito
    COGNITO_USER_POOL_ID: str | None = None
    COGNITO_CLIENT_ID: str | None = None

    # Local auth (AUTH_MODE=local only)
    LOCAL_JWT_SECRET: str = "local-dev-secret-not-for-production"
    LOCAL_TOKEN_TTL_MINUTES: int = 60 * 24 * 7

    # Comma-separated origins, or "*".
    CORS_ORIGINS: str = "*"

    # Lowest global role allowed to publish a project ("user" = any signed-in member).
    PROJECT_CREATION_MIN_ROLE: Literal["user", "creator", "moderator", "admin"] = "user"

    @model_validator(mode="after")
    def _forbid_local_auth_on_lambda(self) -> "Settings":
        if self.AUTH_MODE == "local" and os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
            raise ValueError("AUTH_MODE=local must never be enabled on AWS Lambda")
        return self

    @property
    def cors_origins(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
