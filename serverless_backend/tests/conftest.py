"""Test harness: the real app against an in-memory DynamoDB (moto).

No Docker and no AWS account are needed. Auth runs in local mode, so tests mint
tokens for whichever member they want to act as.
"""

import os

os.environ.update(
    AUTH_MODE="local",
    AWS_REGION="us-west-2",
    AWS_DEFAULT_REGION="us-west-2",
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
    TABLE_NAME="Oakie-Test",
    UPLOADS_BUCKET_NAME="oakie-test-uploads",
)
os.environ.pop("AWS_ENDPOINT_URL", None)

import boto3  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from moto import mock_aws  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import LocalTokenVerifier, Principal  # noqa: E402
from app.db.schema import table_definition  # noqa: E402
from app.db.table import get_table  # noqa: E402
from app.main import app  # noqa: E402
from app.services import platform  # noqa: E402


@pytest.fixture(autouse=True)
def aws():
    """A fresh table and bucket for every test."""
    with mock_aws():
        get_table.cache_clear()
        platform._s3.cache_clear()
        platform.reset_cache()
        boto3.client("dynamodb").create_table(**table_definition(settings.TABLE_NAME))
        boto3.client("s3").create_bucket(
            Bucket=settings.UPLOADS_BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION},
        )
        yield


class Member:
    """A signed-in member with a ready-to-use client."""

    def __init__(self, name: str, groups: list[str] | None = None):
        self.id = f"user-{name.lower()}"
        self.name = name
        principal = Principal(
            sub=self.id, email=f"{name.lower()}@example.edu", name=name, groups=groups or ["user"]
        )
        token = LocalTokenVerifier(settings.LOCAL_JWT_SECRET).issue(principal, 60)
        self.client = TestClient(app, headers={"Authorization": f"Bearer {token}"})
        # First authenticated request provisions the profile.
        assert self.client.get("/api/v1/users/me").status_code == 200

    def __getattr__(self, method: str):
        return getattr(self.client, method)


@pytest.fixture
def anon() -> TestClient:
    return TestClient(app)


@pytest.fixture
def ada() -> Member:
    return Member("Ada")


@pytest.fixture
def ben() -> Member:
    return Member("Ben")


@pytest.fixture
def cy() -> Member:
    return Member("Cy")


PROJECT = {
    "title": "Campus Quant Lab",
    "subtitle": "Backtest student-run strategies",
    "description": "We research and paper-trade factor strategies.",
    "category": "Finance & Quant",
    "tags": ["Python", "Quant"],
    "city": "New York, NY",
    "uni": "NYU",
    "max_members": 3,
    "open_roles": [{"title": "Backend engineer", "skills": ["Backend"]}],
}


@pytest.fixture
def project(ada: Member) -> dict:
    response = ada.post("/api/v1/projects", json=PROJECT)
    assert response.status_code == 201, response.text
    return response.json()
