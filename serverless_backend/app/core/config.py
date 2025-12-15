import os
from typing import Any, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    PROJECT_NAME: str = "Oakie Serverless"
    API_V1_STR: str = "/api/v1"

    # AWS / DynamoDB
    AWS_REGION: str = "us-west-2"
    DYNAMODB_ENDPOINT_URL: Optional[str] = os.getenv("DYNAMODB_ENDPOINT_URL")
    USERS_TABLE_NAME: str = os.getenv("USERS_TABLE_NAME", "Oakie-Users")
    PROJECTS_TABLE_NAME: str = os.getenv("PROJECTS_TABLE_NAME", "Oakie-Projects")
    TABLES: dict[str, str] = Field(default_factory=dict)

    # CORS (local dev)
    CORS_ORIGINS: str = "*"

    # Security
    SECRET_KEY: str = "CHANGE_THIS_TO_A_SECURE_SECRET_KEY_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Cognito
    COGNITO_USER_POOL_ID: Optional[str] = None
    COGNITO_CLIENT_ID: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        self.TABLES = {
            "users": self.USERS_TABLE_NAME,
            "projects": self.PROJECTS_TABLE_NAME,
        }


settings = Settings()
