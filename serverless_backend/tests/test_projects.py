def test_create_and_get_project(api_client):
    create_response = api_client.post(
        "/api/v1/projects",
        json={
            "title": "Test Project",
            "subtitle": "Hello",
            "description": "World",
            "tags": ["Python", "FastAPI"],
            "status": "Recruiting",
            "category": "Web",
            "uni": "MIT",
            "city": "Cambridge, MA",
            "max_members": 6,
            "image": "linear-gradient(135deg, #000 0%, #111 100%)",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["title"] == "Test Project"
    assert created["status"] == "Recruiting"
    assert created["current_members"] == 1
    assert created["max_members"] == 6
    assert created["id"]

    project_id = created["id"]
    get_response = api_client.get(f"/api/v1/projects/{project_id}")
    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["id"] == project_id
    assert fetched["title"] == "Test Project"


def test_list_projects_filters(api_client):
    api_client.post(
        "/api/v1/projects",
        json={
            "title": "Alpha",
            "description": "Finance project",
            "tags": ["Quant", "Python"],
            "status": "Recruiting",
            "category": "Finance",
            "city": "New York, NY",
        },
    )
    api_client.post(
        "/api/v1/projects",
        json={
            "title": "Beta",
            "description": "Media project",
            "tags": ["Film"],
            "status": "Completed",
            "category": "Design",
            "city": "New York, NY",
        },
    )

    all_response = api_client.get("/api/v1/projects/cursor?page_size=50")
    assert all_response.status_code == 200
    all_items = all_response.json()["items"]
    assert len(all_items) >= 2

    recruiting_response = api_client.get(
        "/api/v1/projects/cursor?page_size=50&status=Recruiting"
    )
    assert recruiting_response.status_code == 200
    recruiting = recruiting_response.json()["items"]
    assert any(p["title"] == "Alpha" for p in recruiting)
    assert all(p["status"] == "Recruiting" for p in recruiting)

    tag_response = api_client.get("/api/v1/projects/cursor?page_size=50&tag=Python")
    assert tag_response.status_code == 200
    tagged = tag_response.json()["items"]
    assert any(p["title"] == "Alpha" for p in tagged)
    assert all("Python" in (p.get("tags") or []) for p in tagged)

    q_response = api_client.get("/api/v1/projects/cursor?page_size=50&q=media")
    assert q_response.status_code == 200
    q_items = q_response.json()["items"]
    assert any(p["title"] == "Beta" for p in q_items)
