"""Dev-only sign-up/sign-in. Mounted only when AUTH_MODE=local."""

from fastapi import APIRouter

from app.local import auth

router = APIRouter()


@router.post("/register", response_model=auth.Session, status_code=201)
def register(payload: auth.Registration):
    return auth.register(payload)


@router.post("/login", response_model=auth.Session)
def login(payload: auth.Credentials):
    return auth.login(payload)
