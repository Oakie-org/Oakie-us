"""Platform-level concerns: option catalog, headline stats and upload signing."""

import time
from functools import lru_cache
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.errors import AppError, BadRequest
from app.core.ids import new_id
from app.core.security import Principal
from app.db.table import aws_client_kwargs
from app.models.common import ProjectStatus
from app.models.social import Catalog, SignResponse, StatsOverview
from app.models.user import AVAILABILITY
from app.repositories import stats as stats_repo

CATEGORIES = [
    "Software",
    "AI & Data",
    "Finance & Quant",
    "Media & Content",
    "Design & Art",
    "Events & Community",
    "Research",
    "Startup",
    "Social Impact",
]

SKILLS = [
    "Frontend",
    "Backend",
    "Mobile",
    "Machine Learning",
    "Data Analysis",
    "Quant Research",
    "Financial Modeling",
    "Product Management",
    "UI/UX Design",
    "Illustration",
    "Video Editing",
    "Copywriting",
    "Marketing",
    "Community Ops",
    "Business Development",
    "Hardware",
]

OPEN_TO = ["Co-founder", "Side project", "Hackathon", "Internship", "Mentoring"]

CATALOG = Catalog(
    categories=CATEGORIES,
    skills=SKILLS,
    statuses=[status.value for status in ProjectStatus],
    open_to=OPEN_TO,
    availability=list(AVAILABILITY),
)

# -------------------------------------------------------------------- stats

_STATS_TTL_SECONDS = 30
_stats_cache: tuple[float, StatsOverview] | None = None


def stats_overview() -> StatsOverview:
    """Counters change slowly; cache them per warm Lambda container."""
    global _stats_cache
    now = time.monotonic()
    if _stats_cache and now - _stats_cache[0] < _STATS_TTL_SECONDS:
        return _stats_cache[1]
    overview = StatsOverview(**stats_repo.get())
    _stats_cache = (now, overview)
    return overview


def reset_cache() -> None:
    global _stats_cache
    _stats_cache = None


# ------------------------------------------------------------------ uploads

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}

_MB = 1024 * 1024
PURPOSE_MAX_BYTES = {
    "user_avatar": 2 * _MB,
    "user_banner": 5 * _MB,
    "project_cover": 5 * _MB,
    "timeline_media": 5 * _MB,
}


class UploadsUnavailable(AppError):
    status_code = 503
    code = "uploads_unavailable"


@lru_cache
def _s3() -> Any:
    # Path-style addressing keeps presigned URLs valid for emulators too.
    config = Config(signature_version="s3v4", s3={"addressing_style": "path"})
    return boto3.client("s3", config=config, **aws_client_kwargs())


def _public_url(bucket: str, key: str) -> str:
    if settings.UPLOADS_PUBLIC_BASE_URL:
        return f"{settings.UPLOADS_PUBLIC_BASE_URL.rstrip('/')}/{key}"
    if settings.AWS_ENDPOINT_URL:
        return f"{settings.AWS_ENDPOINT_URL.rstrip('/')}/{bucket}/{key}"
    return f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"


def require_own_upload(user_id: str, url: str, purpose: str) -> None:
    """Refuse a picture that is not this member's own upload for `purpose`.
    Pictures are shown to everyone, so they may only point at our storage,
    never at an address on someone else's server."""
    bucket = settings.UPLOADS_BUCKET_NAME
    if not bucket or not url.startswith(_public_url(bucket, f"{purpose}/{user_id}/")):
        raise BadRequest("Upload the picture first, then save it")


def sign_upload(principal: Principal, file_type: str, purpose: str) -> SignResponse:
    """Presigned POST for a browser-direct image upload. S3 enforces the type
    and the size limit, so the client cannot exceed them."""
    if file_type not in ALLOWED_TYPES:
        raise BadRequest(f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}")
    if purpose not in PURPOSE_MAX_BYTES:
        raise BadRequest(f"Unknown purpose. Allowed: {', '.join(PURPOSE_MAX_BYTES)}")
    bucket = settings.UPLOADS_BUCKET_NAME
    if not bucket:
        raise UploadsUnavailable("Uploads are not configured")

    max_bytes = PURPOSE_MAX_BYTES[purpose]
    key = f"{purpose}/{principal.sub}/{new_id()}.{ALLOWED_TYPES[file_type]}"
    try:
        signed = _s3().generate_presigned_post(
            Bucket=bucket,
            Key=key,
            Fields={"Content-Type": file_type},
            Conditions=[
                {"Content-Type": file_type},
                ["content-length-range", 1, max_bytes],
            ],
            ExpiresIn=300,
        )
    except ClientError as exc:
        raise UploadsUnavailable("Could not prepare the upload") from exc
    return SignResponse(
        url=signed["url"],
        fields=signed["fields"],
        public_url=_public_url(bucket, key),
        max_bytes=max_bytes,
    )
