from __future__ import annotations

import shutil
from typing import TYPE_CHECKING, Generator

import boto3
import pytest
from fastapi.testclient import TestClient
from moto import mock_aws


if TYPE_CHECKING:
    from testcontainers.core.container import DockerContainer


def _try_start_dynamodb_local() -> tuple["DockerContainer", str] | None:
    if not shutil.which("docker"):
        return None

    from testcontainers.core.container import DockerContainer

    container = None
    try:
        container = DockerContainer("amazon/dynamodb-local:latest").with_exposed_ports(
            8000
        )
        container.start()
        host = container.get_container_host_ip()
        port = container.get_exposed_port(8000)
        return container, f"http://{host}:{port}"
    except Exception:
        if container is not None:
            try:
                container.stop()
            except Exception:
                pass
        return None


@pytest.fixture(scope="session")
def dynamodb_endpoint_url() -> Generator[str | None, None, None]:
    """
    Prefer real DynamoDB Local (Docker). Fall back to Moto when Docker isn't available.
    """
    started = _try_start_dynamodb_local()
    if started:
        container, endpoint_url = started
        try:
            yield endpoint_url
        finally:
            container.stop()
        return

    with mock_aws():
        yield None


@pytest.fixture(scope="session")
def dynamodb_table_name() -> str:
    return "Oakie-Users-Test"


@pytest.fixture(scope="session")
def projects_table_name() -> str:
    return "Oakie-Projects-Test"


@pytest.fixture(scope="session")
def _ensure_table(dynamodb_endpoint_url: str | None, dynamodb_table_name: str) -> None:
    kwargs: dict = {
        "service_name": "dynamodb",
        "region_name": "us-west-2",
        "aws_access_key_id": "test",
        "aws_secret_access_key": "test",
    }
    if dynamodb_endpoint_url is not None:
        kwargs["endpoint_url"] = dynamodb_endpoint_url

    client = boto3.client(**kwargs)

    try:
        client.create_table(
            TableName=dynamodb_table_name,
            AttributeDefinitions=[{"AttributeName": "PK", "AttributeType": "S"}],
            KeySchema=[{"AttributeName": "PK", "KeyType": "HASH"}],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
    except client.exceptions.ResourceInUseException:
        pass

    waiter = client.get_waiter("table_exists")
    waiter.wait(TableName=dynamodb_table_name)


@pytest.fixture(scope="session")
def _ensure_projects_table(
    dynamodb_endpoint_url: str | None, projects_table_name: str
) -> None:
    kwargs: dict = {
        "service_name": "dynamodb",
        "region_name": "us-west-2",
        "aws_access_key_id": "test",
        "aws_secret_access_key": "test",
    }
    if dynamodb_endpoint_url is not None:
        kwargs["endpoint_url"] = dynamodb_endpoint_url

    client = boto3.client(**kwargs)

    client.create_table(
        TableName=projects_table_name,
        AttributeDefinitions=[{"AttributeName": "PK", "AttributeType": "S"}],
        KeySchema=[{"AttributeName": "PK", "KeyType": "HASH"}],
        ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
    )

    waiter = client.get_waiter("table_exists")
    waiter.wait(TableName=projects_table_name)


@pytest.fixture()
def api_client(
    monkeypatch: pytest.MonkeyPatch,
    dynamodb_endpoint_url: str | None,
    dynamodb_table_name: str,
    projects_table_name: str,
    _ensure_table: None,
    _ensure_projects_table: None,
) -> TestClient:
    monkeypatch.setenv("AWS_REGION", "us-west-2")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.setenv("USERS_TABLE_NAME", dynamodb_table_name)
    monkeypatch.setenv("PROJECTS_TABLE_NAME", projects_table_name)
    if dynamodb_endpoint_url is None:
        monkeypatch.delenv("DYNAMODB_ENDPOINT_URL", raising=False)
    else:
        monkeypatch.setenv("DYNAMODB_ENDPOINT_URL", dynamodb_endpoint_url)

    from app.main import app

    return TestClient(app)
