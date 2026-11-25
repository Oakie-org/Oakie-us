"""Cognito PostConfirmation trigger.

Runs once a sign-up is confirmed: provisions the member's profile and adds them
to the default `user` group. It must always return the event, and must never
raise, or Cognito would block the registration.
"""

import logging
from typing import Any

import boto3

from app.core.security import GlobalRole
from app.services import users

logger = logging.getLogger(__name__)
_cognito = None


def _add_to_default_group(user_pool_id: str, username: str) -> None:
    global _cognito
    if _cognito is None:
        _cognito = boto3.client("cognito-idp")
    _cognito.admin_add_user_to_group(
        UserPoolId=user_pool_id, Username=username, GroupName=GlobalRole.USER.value
    )


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    if event.get("triggerSource") != "PostConfirmation_ConfirmSignUp":
        return event

    attributes = event.get("request", {}).get("userAttributes", {})
    user_id = attributes.get("sub")
    if not user_id:
        logger.error("PostConfirmation event without a sub")
        return event

    try:
        users.provision(
            user_id, attributes.get("email"), attributes.get("name") or attributes.get("nickname")
        )
    except Exception:
        # The API self-heals a missing profile on first request.
        logger.exception("Could not provision profile for %s", user_id)

    try:
        _add_to_default_group(event["userPoolId"], event["userName"])
    except Exception:
        logger.exception("Could not add %s to the default group", user_id)

    return event
