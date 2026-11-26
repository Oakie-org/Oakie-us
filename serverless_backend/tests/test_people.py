"""Profiles, talent directory, follows, notifications, messages, platform."""

import jwt

from tests.conftest import Member

API = "/api/v1"


def test_profile_update_cannot_touch_protected_fields(ada):
    response = ada.patch(
        f"{API}/users/me",
        json={"headline": "Quant researcher", "skills": ["Python", "Quant Research"],
              "city": "New York, NY", "id": "someone-else", "num_followers": 9999},
    )  # fmt: skip
    assert response.status_code == 200
    profile = response.json()
    assert profile["id"] == ada.id and profile["num_followers"] == 0
    assert profile["headline"] == "Quant researcher"
    assert profile["email"] == "ada@example.edu" and profile["roles"] == ["user"]


def test_availability_is_a_fixed_scale(ada, anon):
    options = anon.get(f"{API}/meta").json()["availability"]
    assert "5-10 hrs / week" in options
    saved = ada.patch(f"{API}/users/me", json={"availability": options[0]})
    assert saved.status_code == 200 and saved.json()["availability"] == options[0]
    assert ada.patch(f"{API}/users/me", json={"availability": "whenever"}).status_code == 422
    # Clearing it is allowed: not everyone wants to say.
    assert ada.patch(f"{API}/users/me", json={"availability": ""}).json()["availability"] == ""


def test_profile_pictures_must_be_own_uploads(ada, ben):
    def signed(member, purpose: str) -> str:
        body = {"file_type": "image/png", "purpose": purpose}
        return member.post(f"{API}/uploads/sign", json=body).json()["public_url"]

    mine = signed(ada, "user_avatar")
    saved = ada.patch(f"{API}/users/me", json={"avatar_url": mine})
    assert saved.status_code == 200 and saved.json()["avatar_url"] == mine
    # Saving other fields, or the same picture again, is not re-checked away.
    assert (
        ada.patch(f"{API}/users/me", json={"avatar_url": mine, "city": "Oslo"}).status_code == 200
    )

    for foreign in (
        "https://tracker.example.com/pixel.png",  # someone else's server
        signed(ben, "user_avatar"),  # another member's upload
        signed(ada, "user_banner"),  # uploaded for a different purpose
    ):
        refused = ada.patch(f"{API}/users/me", json={"avatar_url": foreign})
        assert refused.status_code == 400, foreign
    assert ada.get(f"{API}/users/me").json()["avatar_url"] == mine

    banner = signed(ada, "user_banner")
    assert ada.patch(f"{API}/users/me", json={"banner_url": banner}).status_code == 200
    cleared = ada.patch(f"{API}/users/me", json={"avatar_url": None, "banner_url": None}).json()
    assert cleared["avatar_url"] is None and cleared["banner_url"] is None


def test_matches_follow_the_members_skills(ada, ben, cy, project):
    url = f"{API}/users/me/matches"
    assert ben.get(url).json() == []  # no skills listed, nothing to match on

    ben.patch(f"{API}/users/me", json={"skills": ["backend", "Illustration"]})
    found = ben.get(url).json()
    assert [(p["id"], p["matched_skills"]) for p in found] == [(project["id"], ["backend"])]
    assert found[0]["owner"]["name"] == "Ada"

    # A better overlap ranks first; a project wanting nothing they do is absent.
    both = ada.post(
        f"{API}/projects",
        json={
            "title": "Zine Engine",
            "description": "A static site generator for illustrated zines.",
            "category": "Design & Art",
            "max_members": 4,
            "open_roles": [{"title": "Maker", "skills": ["Backend", "Illustration"]}],
        },
    ).json()
    ada.post(
        f"{API}/projects",
        json={
            "title": "Tax Club",
            "description": "We read tax law for fun.",
            "category": "Finance & Quant",
            "open_roles": [{"title": "Analyst", "skills": ["Financial Modeling"]}],
        },
    )
    assert [p["id"] for p in ben.get(url).json()] == [both["id"], project["id"]]
    assert ben.get(f"{url}?limit=1").json()[0]["id"] == both["id"]

    # Their own projects, ones they applied to and full teams are left out.
    ada.patch(f"{API}/users/me", json={"skills": ["Backend"]})
    assert ada.get(url).json() == []
    ben.post(f"{API}/projects/{both['id']}/applications", json={"message": "Count me in"})
    assert [p["id"] for p in ben.get(url).json()] == [project["id"]]
    # A team with no seat left stops being suggested.
    cy.patch(f"{API}/users/me", json={"skills": ["Backend"]})
    assert project["id"] in [p["id"] for p in cy.get(url).json()]
    members = [ben, Member("Dee")]
    for member in members:
        base = f"{API}/projects/{project['id']}/applications"
        assert member.post(base, json={"message": "Hi"}).status_code == 201
        decided = ada.post(f"{base}/{member.id}/decision", json={"approve": True})
        assert decided.status_code == 200, decided.text
    assert project["id"] not in [p["id"] for p in cy.get(url).json()]


def test_public_profile_hides_private_fields(ada, anon):
    public = anon.get(f"{API}/users/{ada.id}").json()
    assert "email" not in public and public["is_following"] is None
    assert anon.get(f"{API}/users/missing").status_code == 404
    assert anon.get(f"{API}/users/me").status_code == 401


def test_talent_directory_filters(ada, ben, cy, anon):
    ada.patch(
        f"{API}/users/me", json={"skills": ["Python"], "uni": "NYU", "open_to": ["Co-founder"]}
    )
    ben.patch(f"{API}/users/me", json={"skills": ["Video Editing"], "city": "Austin, TX"})

    def names(query: str) -> set[str]:
        response = anon.get(f"{API}/talent?{query}")
        assert response.status_code == 200, response.text
        return {u["name"] for u in response.json()["items"]}

    assert names("") == {"Ada", "Ben", "Cy"}
    assert names("skill=python") == {"Ada"}
    assert names("uni=nyu") == {"Ada"}
    assert names("city=austin") == {"Ben"}
    assert names("open_to=co-founder") == {"Ada"}
    assert names("q=video") == {"Ben"}

    first = anon.get(f"{API}/talent?limit=2").json()
    second = anon.get(f"{API}/talent?limit=2&cursor={first['next_cursor']}").json()
    assert len(first["items"]) == 2 and len(second["items"]) == 1 and not second["next_cursor"]


def test_follow_graph(ada, ben):
    url = f"{API}/users/{ada.id}/follow"
    assert ben.put(url).status_code == 204
    assert ben.put(url).status_code == 204  # idempotent
    assert ben.put(f"{API}/users/{ben.id}/follow").status_code == 400
    assert ben.put(f"{API}/users/missing/follow").status_code == 404

    assert ben.get(f"{API}/users/{ada.id}").json()["is_following"] is True
    assert ada.get(f"{API}/users/me").json()["num_followers"] == 1
    assert ben.get(f"{API}/users/me").json()["num_following"] == 1

    assert ben.delete(url).status_code == 204
    assert ben.delete(url).status_code == 204
    assert ada.get(f"{API}/users/me").json()["num_followers"] == 0


def test_notifications_read_state(ada, ben, cy):
    ben.put(f"{API}/users/{ada.id}/follow")
    cy.put(f"{API}/users/{ada.id}/follow")

    feed = ada.get(f"{API}/notifications").json()
    assert feed["unread_count"] == 2
    assert feed["items"][0]["actor"]["name"] == "Cy"  # newest first
    assert ada.get(f"{API}/inbox/summary").json()["unread_notifications"] == 2

    ada.post(f"{API}/notifications/read", json={"ids": [feed["items"][0]["id"]]})
    assert ada.get(f"{API}/notifications").json()["unread_count"] == 1
    ada.post(f"{API}/notifications/read", json={})
    feed = ada.get(f"{API}/notifications").json()
    assert feed["unread_count"] == 0 and all(n["read"] for n in feed["items"])
    # Other members' feeds are untouched.
    assert ben.get(f"{API}/notifications").json()["items"] == []


def test_direct_messages(ada, ben, cy):
    started = ada.post(f"{API}/conversations", json={"recipient_id": ben.id, "body": "Hi Ben!"})
    assert started.status_code == 201
    cid = started.json()["id"]
    assert started.json()["peer"]["name"] == "Ben"
    assert (
        ada.post(f"{API}/conversations", json={"recipient_id": ada.id, "body": "me"}).status_code
        == 400
    )

    inbox = ben.get(f"{API}/conversations").json()
    assert [(c["id"], c["unread"], c["last_message"]) for c in inbox] == [(cid, 1, "Hi Ben!")]
    assert ben.get(f"{API}/inbox/summary").json()["unread_messages"] == 1

    assert (
        ben.post(f"{API}/conversations/{cid}/messages", json={"body": "Hey Ada"}).status_code == 201
    )
    # Starting again with the same person reuses the thread.
    again = ben.post(f"{API}/conversations", json={"recipient_id": ada.id, "body": "One more"})
    assert again.json()["id"] == cid

    thread = ada.get(f"{API}/conversations/{cid}").json()
    assert [m["body"] for m in thread["messages"]] == ["Hi Ben!", "Hey Ada", "One more"]
    assert ada.get(f"{API}/conversations").json()[0]["unread"] == 0  # reading clears it

    older = ada.get(f"{API}/conversations/{cid}?limit=2").json()
    assert [m["body"] for m in older["messages"]] == ["Hey Ada", "One more"]
    rest = ada.get(f"{API}/conversations/{cid}?limit=2&cursor={older['next_cursor']}").json()
    assert [m["body"] for m in rest["messages"]] == ["Hi Ben!"]

    # Outsiders cannot read or post.
    assert cy.get(f"{API}/conversations/{cid}").status_code == 404
    assert cy.post(f"{API}/conversations/{cid}/messages", json={"body": "x"}).status_code == 404


def test_catalog_and_stats(ada, ben, anon, project):
    catalog = anon.get(f"{API}/meta").json()
    assert "Finance & Quant" in catalog["categories"] and "Recruiting" in catalog["statuses"]
    stats = anon.get(f"{API}/stats/overview").json()
    assert stats["projects"] == 1 and stats["members"] == 2


def test_upload_signing(ada, anon):
    body = {"file_type": "image/png", "purpose": "project_cover"}
    assert anon.post(f"{API}/uploads/sign", json=body).status_code == 401
    assert (
        ada.post(f"{API}/uploads/sign", json={**body, "file_type": "text/html"}).status_code == 400
    )
    assert ada.post(f"{API}/uploads/sign", json={**body, "purpose": "anything"}).status_code == 400

    signed = ada.post(f"{API}/uploads/sign", json=body).json()
    assert signed["fields"]["key"].startswith(f"project_cover/{ada.id}/")
    assert signed["fields"]["key"].endswith(".png")
    assert signed["public_url"].endswith(signed["fields"]["key"])
    assert signed["max_bytes"] == 5 * 1024 * 1024


def test_tokens_must_be_valid(anon):
    forged = jwt.encode(
        {"sub": "user-ada", "iss": "oakie-local"}, "wrong-secret", algorithm="HS256"
    )
    for token in ("garbage", forged):
        headers = {"Authorization": f"Bearer {token}"}
        assert anon.get(f"{API}/users/me", headers=headers).status_code == 401
        # Optional-auth routes refuse bad tokens too, rather than downgrading to guest.
        assert anon.get(f"{API}/projects/whatever", headers=headers).status_code == 401


def test_local_sign_up_and_sign_in(anon):
    account = {"email": "Eve@Example.edu", "password": "correct-horse", "name": "Eve"}
    session = anon.post(f"{API}/dev/auth/register", json=account)
    assert session.status_code == 201
    assert anon.post(f"{API}/dev/auth/register", json=account).status_code == 409

    bad = anon.post(f"{API}/dev/auth/login", json={**account, "password": "wrong-password"})
    assert bad.status_code == 401
    unknown = {"email": "nobody@example.edu", "password": "whatever-123"}
    assert anon.post(f"{API}/dev/auth/login", json=unknown).status_code == 401

    login = anon.post(
        f"{API}/dev/auth/login", json={"email": "eve@example.edu", "password": "correct-horse"}
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    me = anon.get(f"{API}/users/me", headers=headers).json()
    assert me["name"] == "Eve" and me["id"] == session.json()["user_id"]
