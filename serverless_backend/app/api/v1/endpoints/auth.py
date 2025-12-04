from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, Token, UserInDB
from app.db.dynamodb import db
from app.core.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta
from app.core.config import settings
import uuid

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user: UserCreate):
    # Check if user exists
    # Note: In a real app with Single Table Design, we'd check PK=USER#<email>
    # Here we assume email is the unique identifier for simplicity in this phase
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    # Check if email already exists (naive check, in production use condition expressions)
    existing_user = db.get_item(f"USER#{user.email}", "PROFILE")
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    item = {
        "PK": f"USER#{user.email}",
        "SK": "PROFILE",
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "user_id": user_id,
        "type": "USER"
    }
    
    db.put_item(item)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Fetch user
    user_item = db.get_item(f"USER#{form_data.username}", "PROFILE")
    if not user_item:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user_item["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user_item["email"], expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
