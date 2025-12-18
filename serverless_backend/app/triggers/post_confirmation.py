"""
Cognito PostConfirmation Trigger.
Triggered after a user is confirmed (SignUp or ConfirmSignUp).
Syncs user attributes to DynamoDB and assigns default Cognito group.
"""

import os
from datetime import datetime, timezone
from typing import Any

import boto3

# Initialize clients outside handler for reuse across invocations
dynamodb = boto3.resource("dynamodb")
cognito = boto3.client("cognito-idp")

table_name = os.environ.get("USER_TABLE_NAME")
user_pool_id = os.environ.get("COGNITO_USER_POOL_ID")
table = dynamodb.Table(table_name) if table_name else None


def _iso_now() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def _add_user_to_default_group(username: str) -> bool:
    """
    Add user to the 'user' Cognito group.
    Returns True on success, False on failure (non-blocking).
    """
    if not user_pool_id or not username:
        print("Warning: Missing user_pool_id or username, skipping group assignment")
        return False

    try:
        cognito.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=username,
            GroupName="user",  # Default group for all new users
        )
        print(f"Successfully added user '{username}' to 'user' group")
        return True
    except cognito.exceptions.ResourceNotFoundException:
        print("Warning: 'user' group not found in Cognito. Please deploy SAM template.")
        return False
    except Exception as e:
        # Log but don't fail - group assignment is non-critical
        print(f"Warning: Failed to add user to group: {e}")
        return False


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    Cognito PostConfirmation Trigger handler.

    Actions:
    1. Sync user to DynamoDB with global_role field
    2. Add user to 'user' Cognito group (for JWT cognito:groups claim)
    """
    print(f"PostConfirmation event: {event}")

    # 1. Validate trigger source
    trigger_source = event.get("triggerSource")
    if trigger_source not in [
        "PostConfirmation_ConfirmSignUp",
        "PostConfirmation_ConfirmForgotPassword",
    ]:
        # Not a confirmation event, pass through
        return event

    if not table:
        print("Error: USER_TABLE_NAME environment variable not set")
        return event

    # 2. Extract user attributes
    request = event.get("request", {})
    user_attrs = request.get("userAttributes", {})

    user_sub = user_attrs.get("sub")
    email = user_attrs.get("email")
    cognito_username = event.get("userName")
    nickname = user_attrs.get("nickname") or user_attrs.get("name") or "New User"

    if not user_sub or not email:
        print("Error: Missing sub or email in event")
        return event

    # 3. Sync to DynamoDB
    now = _iso_now()
    item = {
        "PK": f"USER#{user_sub}",
        "type": "USER",
        "email": email,
        "nickname": nickname,
        "email_verified": user_attrs.get("email_verified", "false"),
        "cognito_username": cognito_username,
        "global_role": "user",  # Default role for all new users
        "created_at": now,
        "updated_at": now,
    }

    try:
        # Use condition to prevent overwriting existing users (idempotency)
        table.put_item(Item=item, ConditionExpression="attribute_not_exists(PK)")
        print(f"Successfully synced user {user_sub} to DynamoDB")
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        print(f"User {user_sub} already exists in DynamoDB. Skipping sync.")
    except Exception as e:
        # Log but don't block user registration
        print(f"Error syncing user to DynamoDB: {e}")

    # 4. Add user to default Cognito group
    if cognito_username:
        _add_user_to_default_group(cognito_username)

    # 5. Return event to Cognito (required)
    return event
