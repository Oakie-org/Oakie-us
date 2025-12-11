import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Oakie Serverless"
    API_V1_STR: str = "/api/v1"
    
    # AWS / DynamoDB
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    DYNAMODB_TABLE: str = "OakieTable"
    
    # Security
    SECRET_KEY: str = "CHANGE_THIS_TO_A_SECURE_SECRET_KEY_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Cognito
    COGNITO_USER_POOL_ID: Optional[str] = None
    COGNITO_CLIENT_ID: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
