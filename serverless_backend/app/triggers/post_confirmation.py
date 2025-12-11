import os
import boto3
from typing import Dict, Any

# Initialize DynamoDB resource outside handler for reuse
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("USER_TABLE_NAME")
table = dynamodb.Table(table_name) if table_name else None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Cognito PostConfirmation Trigger.
    Triggered after a user is confirmed (SignUp or ConfirmSignUp).
    Syncs user attributes to DynamoDB.
    """
    print(f"Received event: {event}")
    
    # 1. Validation
    if not table:
        print("Error: USER_TABLE_NAME environment variable not set")
        return event

    trigger_source = event.get("triggerSource")
    # We only care about PostConfirmation (Sign Up / Forgot Password)
    if trigger_source not in ["PostConfirmation_ConfirmSignUp", "PostConfirmation_ConfirmForgotPassword"]:
        # Just return event to allow flow to proceed
        return event

    request = event.get("request", {})
    user_attrs = request.get("userAttributes", {})
    
    # Cognito "sub" is the unique user ID
    user_sub = user_attrs.get("sub")
    email = user_attrs.get("email")
    nickname = user_attrs.get("nickname") or user_attrs.get("name") or "New User"
    
    if not user_sub or not email:
        print("Error: Missing sub or email in event")
        return event

    # 2. Write to DynamoDB
    # PK = USER#<sub-uuid>
    item = {
        "PK": f"USER#{user_sub}",
        "email": email,
        "nickname": nickname,
        "email_verified": user_attrs.get("email_verified"),
        "cognito_username": event.get("userName"),
        "updated_at": "now", # In production use real timestamp
        "type": "USER"
    }

    try:
        # Using update_item (upsert) to be safe, or put_item. put_item is simpler for new users.
        # ConditionExpression ensures we don't overwrite if it exists (idempotency)
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK)"
        )
        print(f"Successfully synced user {user_sub} to DynamoDB")
    except boto3.client("dynamodb").exceptions.ConditionalCheckFailedException:
        print(f"User {user_sub} already exists in DynamoDB. Skipping overwrite.")
    except Exception as e:
        print(f"Error syncing user to DynamoDB: {e}")
        # Note: If we raise an exception here, Cognito creates might fail.
        # Usually it's better to swallow non-critical errors or retry async.
        # For now, we print and return success so we don't block the user login.
    
    # 3. Return event to Cognito (required)
    return event
