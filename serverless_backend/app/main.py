from fastapi import FastAPI
from mangum import Mangum
from app.core.config import settings
from app.api.v1.endpoints import auth

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

@app.get("/")
def root():
    return {"message": "Welcome to DadaIsland Serverless API"}

# Handler for AWS Lambda
handler = Mangum(app)
