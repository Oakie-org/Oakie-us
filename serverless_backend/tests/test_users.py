import boto3


def _put_user(
    *,
    dynamodb_endpoint_url: str | None,
    table_name: str,
    sub: str,
    item_overrides: dict | None = None,
) -> None:
    kwargs: dict = {
        "service_name": "dynamodb",
        "region_name": "us-west-2",
        "aws_access_key_id": "test",
        "aws_secret_access_key": "test",
    }
    if dynamodb_endpoint_url is not None:
        kwargs["endpoint_url"] = dynamodb_endpoint_url

    # Seed a minimal user record into the DynamoDB users table.
    table = boto3.resource(**kwargs).Table(table_name)
    item = {
        "PK": f"USER#{sub}",
        "type": "USER",
    }
    if item_overrides:
        item.update(item_overrides)
    table.put_item(Item=item)


def test_list_users_returns_public_profiles(
    api_client, dynamodb_endpoint_url, dynamodb_table_name
):
    # Insert users with name and nickname to verify fallback behavior.
    _put_user(
        dynamodb_endpoint_url=dynamodb_endpoint_url,
        table_name=dynamodb_table_name,
        sub="user-ada",
        item_overrides={
            "name": "Ada Lovelace",
            "bio": "Math pioneer",
        },
    )
    _put_user(
        dynamodb_endpoint_url=dynamodb_endpoint_url,
        table_name=dynamodb_table_name,
        sub="user-bob",
        item_overrides={
            "nickname": "Bobby",
            "bio": "Builder",
        },
    )

    # Basic list call should include both users with correct names/subs.
    response = api_client.get("/api/v1/users")
    assert response.status_code == 200
    data = response.json()
    items = data["items"]
    names = {item["name"] for item in items}
    subs = {item["sub"] for item in items}

    assert "Ada Lovelace" in names
    assert "Bobby" in names
    assert "user-ada" in subs
    assert "user-bob" in subs


def test_list_users_filters_by_query(
    api_client, dynamodb_endpoint_url, dynamodb_table_name
):
    # Insert users with searchable fields for query matching.
    _put_user(
        dynamodb_endpoint_url=dynamodb_endpoint_url,
        table_name=dynamodb_table_name,
        sub="user-alice",
        item_overrides={
            "name": "Alice Wonderland",
            "bio": "Loves AI",
            "skills": ["React", "Python"],
        },
    )
    _put_user(
        dynamodb_endpoint_url=dynamodb_endpoint_url,
        table_name=dynamodb_table_name,
        sub="user-charlie",
        item_overrides={
            "nickname": "Charlie",
            "bio": "Music maker",
            "skills": ["Guitar"],
        },
    )

    # Query should match by name.
    response = api_client.get("/api/v1/users?q=alice")
    assert response.status_code == 200
    subs = {item["sub"] for item in response.json()["items"]}
    assert "user-alice" in subs

    # Query should match by bio.
    response = api_client.get("/api/v1/users?q=music")
    assert response.status_code == 200
    subs = {item["sub"] for item in response.json()["items"]}
    assert "user-charlie" in subs

    # Query should match by skills.
    response = api_client.get("/api/v1/users?q=python")
    assert response.status_code == 200
    subs = {item["sub"] for item in response.json()["items"]}
    assert "user-alice" in subs
