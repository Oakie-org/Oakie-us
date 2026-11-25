from tests.conftest import PROJECT, Member

API = "/api/v1"


def test_create_requires_sign_in(anon):
    assert anon.post(f"{API}/projects", json=PROJECT).status_code == 401


def test_create_makes_the_author_owner(ada, project):
    detail = ada.get(f"{API}/projects/{project['id']}").json()
    assert detail["owner"]["name"] == "Ada"
    assert detail["viewer"]["role"] == "owner"
    assert detail["current_members"] == 1

    members = ada.get(f"{API}/projects/{project['id']}/members").json()
    assert [(m["user"]["id"], m["role"]) for m in members] == [(ada.id, "owner")]
    assert ada.get(f"{API}/users/me").json()["num_projects"] == 1


def test_rejects_invalid_payload(ada):
    response = ada.post(f"{API}/projects", json={**PROJECT, "title": "x", "max_members": 0})
    assert response.status_code == 422


def test_list_filters_are_exact_and_case_insensitive(ada, anon, project):
    ada.post(
        f"{API}/projects",
        json={**PROJECT, "title": "Short Film Crew", "category": "Media & Content",
              "tags": ["Film"], "city": "Los Angeles, CA", "status": "Idea"},
    )  # fmt: skip

    def titles(query: str) -> list[str]:
        response = anon.get(f"{API}/projects?{query}")
        assert response.status_code == 200, response.text
        return [p["title"] for p in response.json()["items"]]

    assert set(titles("")) == {"Campus Quant Lab", "Short Film Crew"}
    assert titles("category=Media %26 Content") == ["Short Film Crew"]
    assert titles("status=Idea") == ["Short Film Crew"]
    assert titles("tag=quant") == ["Campus Quant Lab"]
    assert titles("q=FILM") == ["Short Film Crew"]
    assert titles("city=new york") == ["Campus Quant Lab"]
    assert titles("q=nothing-matches") == []


def test_cursor_pagination_returns_every_match_once(ada, anon):
    for index in range(7):
        category = "Software" if index % 2 == 0 else "Research"
        ada.post(
            f"{API}/projects", json={**PROJECT, "title": f"Proj {index}", "category": category}
        )

    seen, cursor = [], None
    while True:
        query = "category=Software&limit=2" + (f"&cursor={cursor}" if cursor else "")
        page = anon.get(f"{API}/projects?{query}").json()
        assert len(page["items"]) <= 2
        seen += [p["title"] for p in page["items"]]
        cursor = page["next_cursor"]
        if not cursor:
            break
    # Newest first, no gaps, no repeats.
    assert seen == ["Proj 6", "Proj 4", "Proj 2", "Proj 0"]


def test_invalid_cursor_is_a_client_error(anon):
    assert anon.get(f"{API}/projects?cursor=not-a-cursor").status_code == 400


def test_private_projects_are_hidden_from_outsiders(ada, ben, anon):
    created = ada.post(f"{API}/projects", json={**PROJECT, "visibility": "private"}).json()
    url = f"{API}/projects/{created['id']}"

    assert anon.get(f"{API}/projects").json()["items"] == []
    assert anon.get(url).status_code == 404
    assert ben.get(url).status_code == 404
    assert ada.get(url).status_code == 200
    assert ben.get(f"{API}/users/{ada.id}/projects").json() == []
    assert len(ada.get(f"{API}/users/{ada.id}/projects").json()) == 1


def test_only_managers_can_edit_and_only_owner_deletes(ada, ben, project):
    url = f"{API}/projects/{project['id']}"
    assert ben.patch(url, json={"title": "Hijacked"}).status_code == 403
    assert ben.delete(url).status_code == 403

    updated = ada.patch(url, json={"status": "In Progress", "tags": ["Rust"]})
    assert updated.status_code == 200
    assert updated.json()["status"] == "In Progress"
    # Search text follows the edit.
    assert ada.get(f"{API}/projects?tag=rust").json()["items"][0]["id"] == project["id"]
    assert ada.get(f"{API}/projects?tag=quant").json()["items"][0]["id"] == project["id"]

    assert ada.patch(url, json={"title": None}).status_code == 400
    assert ada.delete(url).status_code == 204
    assert ada.get(url).status_code == 404
    assert ada.get(f"{API}/users/me").json()["num_projects"] == 0


def test_likes_and_follows_are_idempotent(ada, ben, project):
    url = f"{API}/projects/{project['id']}"
    for _ in range(2):
        assert ben.put(f"{url}/like").status_code == 204
        assert ben.put(f"{url}/follow").status_code == 204
    detail = ben.get(url).json()
    assert (detail["likes"], detail["follows"]) == (1, 1)
    assert detail["viewer"]["has_liked"] and detail["viewer"]["is_following"]
    assert [p["id"] for p in ben.get(f"{API}/projects/following").json()] == [project["id"]]

    for _ in range(2):
        assert ben.delete(f"{url}/like").status_code == 204
    assert ben.get(url).json()["likes"] == 0

    # The owner hears about the new follower, once.
    feed = ada.get(f"{API}/notifications").json()
    assert [n["kind"] for n in feed["items"]] == ["project.followed"]


def test_creation_can_be_restricted_to_creators(monkeypatch, ada):
    from app.core.config import settings

    monkeypatch.setattr(settings, "PROJECT_CREATION_MIN_ROLE", "creator")
    assert ada.post(f"{API}/projects", json=PROJECT).status_code == 403
    creator = Member("Dee", groups=["creator"])
    assert creator.post(f"{API}/projects", json=PROJECT).status_code == 201


def test_featured_projects_are_listed_first(ada, anon, project):
    from app.repositories import projects as repo

    newer = ada.post(f"{API}/projects", json={**PROJECT, "title": "Newer project"}).json()
    repo.update(repo.get(project["id"]), {"priority": 10})
    titles = [p["title"] for p in anon.get(f"{API}/projects").json()["items"]]
    assert titles == ["Campus Quant Lab", newer["title"]]
