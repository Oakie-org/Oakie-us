from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.core.config import settings
from app.api.v1.endpoints import projects, users, uploads

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

cors_origins = (
    ["*"]
    if settings.CORS_ORIGINS.strip() == "*"
    else [
        origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(
    projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"]
)
app.include_router(
    uploads.router, prefix=f"{settings.API_V1_STR}/uploads", tags=["uploads"]
)


@app.get("/")
def root():
    return {"message": "Welcome to Oakie Serverless API"}


# Handler for AWS Lambda
handler = Mangum(app)
