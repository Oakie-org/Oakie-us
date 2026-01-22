"""
Upload signing endpoint for S3 presigned URLs.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from uuid import uuid4
import os

from app.core.security import get_current_user, TokenPayload

router = APIRouter()
s3 = boto3.client("s3")

# Allowed file types and their extensions
ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}

ALLOWED_PURPOSES = {"project_cover", "user_avatar"}


class SignRequest(BaseModel):
    """Request body for presigned URL generation."""

    file_type: str  # "image/jpeg", "image/png", "image/webp"
    purpose: str  # "project_cover", "user_avatar"


class SignResponse(BaseModel):
    """Response containing presigned URL and fields for POST upload."""

    url: str
    fields: dict
    public_url: str


@router.post("/sign", response_model=SignResponse)
def get_presigned_url(
    payload: SignRequest,
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Generate a presigned POST for uploading an image to S3.
    Enforces file size limits on the server side.
    """
    # Validate file type
    if payload.file_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {list(ALLOWED_TYPES.keys())}",
        )

    # Validate purpose and set size limit
    if payload.purpose not in ALLOWED_PURPOSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid purpose. Allowed: {list(ALLOWED_PURPOSES)}",
        )

    # Size limits in bytes
    # user_avatar: 2MB
    # project_cover: 5MB
    max_size = 2 * 1024 * 1024 if payload.purpose == "user_avatar" else 5 * 1024 * 1024

    bucket = os.environ.get("UPLOADS_BUCKET_NAME")
    if not bucket:
        raise HTTPException(
            status_code=500,
            detail="Upload bucket not configured",
        )

    # Generate unique object key: purpose/user_id/uuid.ext
    ext = ALLOWED_TYPES[payload.file_type]
    object_key = f"{payload.purpose}/{current_user.sub}/{uuid4()}.{ext}"

    try:
        response = s3.generate_presigned_post(
            Bucket=bucket,
            Key=object_key,
            Fields={
                "Content-Type": payload.file_type,
            },
            Conditions=[
                {"bucket": bucket},
                {"key": object_key},
                ["content-length-range", 10, max_size],  # Min 10 bytes, Max constraint
                {"Content-Type": payload.file_type},
            ],
            ExpiresIn=300,  # 5 minutes
        )
    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate presigned URL: {str(e)}",
        )

    # Construct public URL
    public_url = f"https://{bucket}.s3.amazonaws.com/{object_key}"

    return SignResponse(
        url=response["url"],
        fields=response["fields"],
        public_url=public_url,
    )
