from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.core.security import get_password_hash

client = TestClient(app)

# Mock DB
mock_db = MagicMock()

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to DadaIsland Serverless API"}

@patch("app.api.v1.endpoints.auth.db")
def test_register_user(mock_db_module):
    # Setup mock
    mock_db_module.get_item.return_value = None # User doesn't exist
    
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Verify DB put_item was called
    mock_db_module.put_item.assert_called_once()
    call_args = mock_db_module.put_item.call_args[0][0]
    assert call_args["email"] == "test@example.com"
    assert call_args["PK"] == "USER#test@example.com"

@patch("app.api.v1.endpoints.auth.db")
def test_register_existing_user(mock_db_module):
    # Setup mock to return an existing user
    mock_db_module.get_item.return_value = {"email": "test@example.com"}
    
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

@patch("app.api.v1.endpoints.auth.db")
def test_login_user(mock_db_module):
    # Setup mock
    hashed_pw = get_password_hash("password123")
    mock_db_module.get_item.return_value = {
        "email": "test@example.com",
        "hashed_password": hashed_pw
    }
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
@patch("app.api.v1.endpoints.auth.db")
def test_login_wrong_password(mock_db_module):
    # Setup mock
    hashed_pw = get_password_hash("password123")
    mock_db_module.get_item.return_value = {
        "email": "test@example.com",
        "hashed_password": hashed_pw
    }
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "wrongpassword"}
    )
    
    assert response.status_code == 401
