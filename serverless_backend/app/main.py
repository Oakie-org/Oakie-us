"""Application entry point: one FastAPI app, served on Lambda through Mangum."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum

from app.api.v1.endpoints import inbox, platform, projects, users, workspace
from app.core.config import settings
from app.core.errors import AppError

logger = logging.getLogger("oakie")


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code, content={"detail": exc.message, "code": exc.code}
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong on our side", "code": "internal_error"},
        )

    v1 = settings.API_V1_STR
    app.include_router(platform.router, prefix=v1, tags=["platform"])
    app.include_router(projects.router, prefix=f"{v1}/projects", tags=["projects"])
    app.include_router(workspace.router, prefix=f"{v1}/projects", tags=["workspace"])
    app.include_router(users.router, prefix=v1, tags=["users"])
    app.include_router(inbox.router, prefix=v1, tags=["inbox"])

    if settings.AUTH_MODE == "local":
        from app.api.v1.endpoints import dev_auth

        app.include_router(dev_auth.router, prefix=f"{v1}/dev/auth", tags=["dev"])

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"service": settings.PROJECT_NAME, "docs": "/docs"}

    return app


app = create_app()
handler = Mangum(app)
