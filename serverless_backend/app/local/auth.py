"""Dev-only identity provider, standing in for Cognito when AUTH_MODE=local.

It mirrors what Cognito gives the app: sign-up, sign-in, a JWT carrying `sub`
and `cognito:groups`, and a profile provisioned on confirmation. It is never
mounted on Lambda (see `Settings`), and stores scrypt-hashed passwords only.
"""

import hashlib
import hmac
import secrets

from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.errors import Conflict, Unauthorized
from app.core.ids import new_id
from app.core.security import GlobalRole, LocalTokenVerifier, Principal
from app.db import keys
from app.db.table import get_table
from app.services import users


class Credentials(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=200)
    password: str = Field(min_length=8, max_length=200)


class Registration(Credentials):
    name: str = Field(min_length=1, max_length=60)


class Session(BaseModel):
    access_token: str
    user_id: str


def _hash(password: str, salt: bytes) -> str:
    return hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1).hex()


def _session(user_id: str, email: str, name: str | None, groups: list[str]) -> Session:
    principal = Principal(sub=user_id, email=email, name=name, groups=groups)
    verifier = LocalTokenVerifier(settings.LOCAL_JWT_SECRET)
    token = verifier.issue(principal, settings.LOCAL_TOKEN_TTL_MINUTES)
    return Session(access_token=token, user_id=user_id)


def register(payload: Registration, groups: list[str] | None = None) -> Session:
    email = payload.email.strip().lower()
    user_id = new_id()
    salt = secrets.token_bytes(16)
    pk, sk = keys.credential(email)
    groups = groups or [GlobalRole.USER.value]
    try:
        get_table().put(
            {
                "PK": pk,
                "SK": sk,
                "type": "LOCAL_CREDENTIAL",
                "user_id": user_id,
                "salt": salt.hex(),
                "password_hash": _hash(payload.password, salt),
                "groups": groups,
            },
            unless_exists=True,
        )
    except Conflict as exc:
        raise Conflict("An account with this email already exists") from exc
    users.provision(user_id, email, payload.name)
    return _session(user_id, email, payload.name, groups)


def login(payload: Credentials) -> Session:
    email = payload.email.strip().lower()
    record = get_table().get(*keys.credential(email))
    expected = record["password_hash"] if record else ""
    salt = bytes.fromhex(record["salt"]) if record else b"\0" * 16
    if not hmac.compare_digest(_hash(payload.password, salt), expected) or not record:
        raise Unauthorized("Incorrect email or password")
    return _session(record["user_id"], email, None, record.get("groups") or [])
