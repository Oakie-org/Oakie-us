def test_root(api_client):
    response = api_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Oakie Serverless API"}


def test_auth_me(api_client):
    response = api_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert "msg" in response.json()
