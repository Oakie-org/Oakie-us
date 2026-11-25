"""Finding things and people: filters, facet counts, typeahead, invitations,
follower lists and the designable parts of a profile."""

from tests.conftest import PROJECT, Member

API = "/api/v1"

FILM = {
    **PROJECT,
    "title": "Short Film Crew",
    "category": "Media & Content",
    "tags": ["Film"],
    "city": "Austin, TX",
    "uni": "UT Austin",
    "remote_ok": False,
    "max_members": 1,
    "open_roles": [{"title": "Editor", "skills": ["Video Editing"]}],
}


def _titles(client, query: str = "") -> list[str]:
    response = client.get(f"{API}/projects?{query}")
    assert response.status_code == 200, response.text
    return sorted(item["title"] for item in response.json()["items"])


def test_listing_filters_by_skill_remote_seats_and_age(ada, anon, project):
    assert ada.post(f"{API}/projects", json=FILM).status_code == 201

    assert _titles(anon, "skill=backend") == ["Campus Quant Lab"]
    assert _titles(anon, "skill=video editing") == ["Short Film Crew"]
    assert _titles(anon, "remote=true") == ["Campus Quant Lab"]
    assert _titles(anon, "remote=false") == ["Short Film Crew"]
    # The film crew's only seat is the owner's, so it has no opening.
    assert _titles(anon, "open_only=true") == ["Campus Quant Lab"]
    assert _titles(anon, "within_days=7") == ["Campus Quant Lab", "Short Film Crew"]
    assert _titles(anon, "uni=nyu&skill=backend") == ["Campus Quant Lab"]
    assert _titles(anon, "uni=nyu&skill=video editing") == []
    assert anon.get(f"{API}/projects?within_days=0").status_code == 422


def test_facets_count_options_without_narrowing_their_own_facet(ada, anon, project):
    ada.post(f"{API}/projects", json=FILM)

    def options(facets: dict, facet: str) -> dict[str, int]:
        return {option["value"]: option["count"] for option in facets[facet]}

    everything = anon.get(f"{API}/projects/facets").json()
    assert everything["total"] == 2
    assert options(everything, "category") == {"Finance & Quant": 1, "Media & Content": 1}
    assert options(everything, "skill") == {"Backend": 1, "Video Editing": 1}
    assert options(everything, "uni") == {"NYU": 1, "UT Austin": 1}

    narrowed = anon.get(f"{API}/projects/facets?category=Finance %26 Quant").json()
    assert narrowed["total"] == 1
    # The chosen facet still offers its alternatives...
    assert options(narrowed, "category") == {"Finance & Quant": 1, "Media & Content": 1}
    # ...while every other facet reflects the choice.
    assert options(narrowed, "skill") == {"Backend": 1}
    assert options(narrowed, "city") == {"New York, NY": 1}


def test_private_projects_never_reach_facets_or_suggestions(ada, anon):
    ada.post(f"{API}/projects", json={**PROJECT, "title": "Stealth Thing", "visibility": "private"})
    assert anon.get(f"{API}/projects/facets").json()["total"] == 0
    assert anon.get(f"{API}/search/suggest?q=stealth").json()["projects"] == []


def test_search_suggestions_span_projects_people_and_skills(ada, ben, anon, project):
    ben.patch(f"{API}/users/me", json={"headline": "Backend tinkerer", "skills": ["Backend"]})

    found = anon.get(f"{API}/search/suggest?q=back").json()
    assert [hit["title"] for hit in found["projects"]] == ["Campus Quant Lab"]
    assert [person["name"] for person in found["people"]] == ["Ben"]
    assert found["skills"] == ["Backend"]

    # Too short to mean anything: no work is done.
    assert anon.get(f"{API}/search/suggest?q=b").json() == {
        "projects": [], "people": [], "skills": [],
    }  # fmt: skip


def test_invitation_accept_seats_the_member(ada, ben, cy, project):
    base = f"{API}/projects/{project['id']}"
    invite = {"user_id": ben.id, "role_title": "Backend engineer", "message": "Join us?"}

    assert ben.post(f"{base}/invitations", json=invite).status_code == 403  # not a manager
    assert ada.post(f"{base}/invitations", json={"user_id": "nobody"}).status_code == 404
    assert ada.post(f"{base}/invitations", json={"user_id": ada.id}).status_code == 400
    created = ada.post(f"{base}/invitations", json=invite)
    assert created.status_code == 201 and created.json()["invitee"]["name"] == "Ben"
    assert ada.post(f"{base}/invitations", json=invite).status_code == 409  # already pending

    assert ben.get(f"{API}/notifications").json()["items"][0]["kind"] == "invitation.received"
    mine = ben.get(f"{API}/users/me/invitations").json()
    assert [(i["project_title"], i["inviter"]["name"]) for i in mine] == [
        ("Campus Quant Lab", "Ada")
    ]
    assert ben.get(base).json()["viewer"]["invitation"]["role_title"] == "Backend engineer"
    assert cy.get(base).json()["viewer"]["invitation"] is None
    assert cy.post(f"{base}/invitations/me/decision", json={"accept": True}).status_code == 404

    accepted = ben.post(f"{base}/invitations/me/decision", json={"accept": True})
    assert accepted.status_code == 200 and accepted.json()["status"] == "accepted"
    assert ben.post(f"{base}/invitations/me/decision", json={"accept": True}).status_code == 409

    detail = ben.get(base).json()
    assert detail["current_members"] == 2 and detail["viewer"]["role"] == "member"
    members = {m["user"]["name"]: m["title"] for m in ada.get(f"{base}/members").json()}
    assert members["Ben"] == "Backend engineer"
    assert ben.get(f"{API}/users/me/invitations").json() == []
    assert ada.get(f"{API}/notifications").json()["items"][0]["kind"] == "invitation.accepted"
    # Joining by invitation issues the same verifiable record as applying.
    assert len(ben.get(f"{API}/users/{ben.id}/contributions").json()) == 1
    assert ada.post(f"{base}/invitations", json=invite).status_code == 409  # already a member


def test_invitation_decline_revoke_and_guards(ada, ben, cy, project):
    base = f"{API}/projects/{project['id']}"
    ada.post(f"{base}/invitations", json={"user_id": ben.id})
    declined = ben.post(f"{base}/invitations/me/decision", json={"accept": False})
    assert declined.json()["status"] == "declined"
    assert ben.get(base).json()["viewer"]["role"] is None
    # A declined invitation can be followed by a fresh one.
    assert ada.post(f"{base}/invitations", json={"user_id": ben.id}).status_code == 201

    assert ben.delete(f"{base}/invitations/{ben.id}").status_code == 403
    assert ada.delete(f"{base}/invitations/{ben.id}").status_code == 204
    assert ada.delete(f"{base}/invitations/{ben.id}").status_code == 404
    assert ben.get(f"{API}/users/me/invitations").json() == []
    assert ben.get(f"{base}/invitations").status_code == 403
    assert ada.get(f"{base}/invitations").json() == []

    # Someone who already applied should be approved, not invited.
    cy.post(f"{base}/applications", json={"message": "Count me in"})
    assert ada.post(f"{base}/invitations", json={"user_id": cy.id}).status_code == 409


def test_invitation_cannot_overfill_a_team(ada, ben, cy):
    duo = ada.post(f"{API}/projects", json={**PROJECT, "max_members": 2}).json()
    base = f"{API}/projects/{duo['id']}"
    assert ada.post(f"{base}/invitations", json={"user_id": ben.id}).status_code == 201
    assert ada.post(f"{base}/invitations", json={"user_id": cy.id}).status_code == 201
    assert ben.post(f"{base}/invitations/me/decision", json={"accept": True}).status_code == 200
    # The last seat is gone; the second acceptance loses the race cleanly.
    assert cy.post(f"{base}/invitations/me/decision", json={"accept": True}).status_code == 409
    assert ada.get(base).json()["current_members"] == 2
    # A full team cannot send more invitations.
    dee = Member("Dee")
    assert ada.post(f"{base}/invitations", json={"user_id": dee.id}).status_code == 400


def test_follower_and_following_lists(ada, ben, cy, anon):
    ben.put(f"{API}/users/{ada.id}/follow")
    cy.put(f"{API}/users/{ada.id}/follow")
    followers = anon.get(f"{API}/users/{ada.id}/followers").json()
    assert sorted(person["name"] for person in followers) == ["Ben", "Cy"]
    assert [p["name"] for p in anon.get(f"{API}/users/{ben.id}/following").json()] == ["Ada"]
    assert anon.get(f"{API}/users/{ada.id}/following").json() == []
    assert anon.get(f"{API}/users/missing/followers").status_code == 404


def test_profile_design_fields(ada, ben, project):
    saved = ada.patch(
        f"{API}/users/me",
        json={
            "accent": "coral",
            "availability": "5 hrs / week",
            "links": [{"label": "GitHub", "url": "https://github.com/ada"}],
            # Only projects the member is actually on can be pinned.
            "pinned_project_ids": [project["id"], "not-mine", project["id"]],
        },
    )
    assert saved.status_code == 200, saved.text
    profile = saved.json()
    assert profile["accent"] == "coral" and profile["availability"] == "5 hrs / week"
    assert profile["links"] == [{"label": "GitHub", "url": "https://github.com/ada"}]
    assert profile["pinned_project_ids"] == [project["id"]]

    public = ben.get(f"{API}/users/{ada.id}").json()
    assert public["links"][0]["label"] == "GitHub" and public["accent"] == "coral"

    bad_link = {"links": [{"label": "x", "url": "javascript:alert(1)"}]}
    assert ada.patch(f"{API}/users/me", json=bad_link).status_code == 422
    assert ada.patch(f"{API}/users/me", json={"accent": "neon"}).status_code == 422
    # Photos can still be cleared with null; other fields ignore it.
    cleared = ada.patch(f"{API}/users/me", json={"avatar_url": None, "name": None}).json()
    assert cleared["avatar_url"] is None and cleared["name"] == "Ada"


def test_school_email_is_recognised_at_sign_up(ada):
    from app.services.users import is_school_email

    assert ada.get(f"{API}/users/me").json()["verified_school"] is True  # ada@example.edu
    assert is_school_email("li@pku.edu.cn") and is_school_email("sam@cam.ac.uk")
    assert not is_school_email("sam@gmail.com") and not is_school_email("x@education.com")
    assert not is_school_email(None)
