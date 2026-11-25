"""Applications, team, timeline, task board and contribution records."""

API = "/api/v1"


def _apply(member, project, message="I can build the backend."):
    return member.post(
        f"{API}/projects/{project['id']}/applications",
        json={"message": message, "role_title": "Backend engineer"},
    )


def test_application_flow_approve(ada, ben, project):
    base = f"{API}/projects/{project['id']}"
    assert _apply(ben, project).status_code == 201
    assert _apply(ben, project).status_code == 409  # one pending application at a time
    assert _apply(ada, project).status_code == 409  # already on the team

    assert ben.get(f"{base}/applications").status_code == 403
    pending = ada.get(f"{base}/applications").json()
    assert [(a["applicant"]["name"], a["status"]) for a in pending] == [("Ben", "pending")]
    assert ada.get(f"{API}/notifications").json()["items"][0]["kind"] == "application.received"

    decision = ada.post(f"{base}/applications/{ben.id}/decision", json={"approve": True})
    assert decision.status_code == 200 and decision.json()["status"] == "approved"
    # Resolving twice is rejected.
    assert (
        ada.post(f"{base}/applications/{ben.id}/decision", json={"approve": False}).status_code
        == 409
    )

    detail = ben.get(base).json()
    assert detail["current_members"] == 2
    assert detail["viewer"] == {
        "role": "member", "has_liked": False, "is_following": False,
        "application_status": "approved",
    }  # fmt: skip
    members = ben.get(f"{base}/members").json()
    assert [(m["user"]["name"], m["title"]) for m in members] == [
        ("Ada", "Founder"), ("Ben", "Backend engineer"),
    ]  # fmt: skip
    assert ben.get(f"{API}/notifications").json()["items"][0]["kind"] == "application.approved"
    assert [a["project_title"] for a in ben.get(f"{API}/users/me/applications").json()] == [
        "Campus Quant Lab"
    ]


def test_reject_withdraw_and_reapply(ada, ben, project):
    base = f"{API}/projects/{project['id']}"
    _apply(ben, project)
    assert (
        ada.post(f"{base}/applications/{ben.id}/decision", json={"approve": False}).json()["status"]
        == "rejected"
    )
    assert ben.get(base).json()["viewer"]["role"] is None

    assert _apply(ben, project, "Second try").status_code == 201
    assert ben.delete(f"{base}/applications/me").status_code == 204
    assert ben.delete(f"{base}/applications/me").status_code == 409
    assert ben.get(base).json()["viewer"]["application_status"] == "withdrawn"


def test_team_cannot_exceed_its_size(ada, ben, cy, project):
    base = f"{API}/projects/{project['id']}"
    ada.patch(base, json={"max_members": 2})
    _apply(ben, project)
    _apply(cy, project)
    assert (
        ada.post(f"{base}/applications/{ben.id}/decision", json={"approve": True}).status_code
        == 200
    )
    full = ada.post(f"{base}/applications/{cy.id}/decision", json={"approve": True})
    assert full.status_code == 409
    assert ada.get(base).json()["current_members"] == 2
    # Shrinking below the current team is refused.
    assert ada.patch(base, json={"max_members": 1}).status_code == 400


def test_members_can_leave_and_be_removed(ada, ben, cy, project):
    base = f"{API}/projects/{project['id']}"
    for member in (ben, cy):
        _apply(member, project)
        ada.post(f"{base}/applications/{member.id}/decision", json={"approve": True})

    assert ada.delete(f"{base}/members/{ada.id}").status_code == 400  # owner stays
    assert cy.delete(f"{base}/members/{ben.id}").status_code == 403  # members can't remove others
    assert ben.delete(f"{base}/members/{ben.id}").status_code == 204  # leave
    assert ada.delete(f"{base}/members/{cy.id}").status_code == 204  # removed by owner
    assert ada.get(base).json()["current_members"] == 1
    assert ben.get(f"{API}/users/me").json()["num_projects"] == 0

    assert cy.patch(f"{base}/members/{ada.id}", json={"role": "member"}).status_code in (400, 403)


def test_timeline_posts(ada, ben, anon, project):
    base = f"{API}/projects/{project['id']}/timeline"
    ben.put(f"{API}/projects/{project['id']}/follow")

    assert ben.post(base, json={"title": "Hi", "content": "Not a member"}).status_code == 403
    first = ada.post(base, json={"title": "Kickoff", "content": "We started.", "kind": "milestone"})
    assert first.status_code == 201
    ada.post(base, json={"title": "Week 1", "content": "Data pipeline done."})

    posts = anon.get(base).json()["items"]
    assert [p["title"] for p in posts] == ["Week 1", "Kickoff"]
    assert posts[0]["author"]["name"] == "Ada"

    post_id = first.json()["id"]
    assert ben.patch(f"{base}/{post_id}", json={"title": "Nope"}).status_code == 403
    assert ada.patch(f"{base}/{post_id}", json={"title": "Kickoff!"}).json()["title"] == "Kickoff!"
    assert ada.delete(f"{base}/{post_id}").status_code == 204
    assert ada.delete(f"{base}/missing").status_code == 404
    assert [p["title"] for p in anon.get(base).json()["items"]] == ["Week 1"]

    # Followers are told about new posts.
    kinds = [n["kind"] for n in ben.get(f"{API}/notifications").json()["items"]]
    assert kinds.count("project.update") == 2


def test_members_only_projects_keep_updates_internal(ada, anon):
    from tests.conftest import PROJECT

    created = ada.post(f"{API}/projects", json={**PROJECT, "visibility": "members_only"}).json()
    base = f"{API}/projects/{created['id']}"
    ada.post(f"{base}/timeline", json={"title": "Internal", "content": "Team eyes only."})

    assert anon.get(base).status_code == 200  # still discoverable
    assert anon.get(f"{base}/timeline").json()["items"] == []
    assert len(ada.get(f"{base}/timeline").json()["items"]) == 1


def test_task_board_and_contribution_records(ada, ben, cy, anon, project):
    base = f"{API}/projects/{project['id']}"
    _apply(ben, project)
    ada.post(f"{base}/applications/{ben.id}/decision", json={"approve": True})

    assert cy.get(f"{base}/tasks").status_code == 403
    assert ada.post(f"{base}/tasks", json={"title": "x", "assignee_id": cy.id}).status_code == 400

    task = ada.post(f"{base}/tasks", json={"title": "Build loader", "assignee_id": ben.id}).json()
    other = ada.post(f"{base}/tasks", json={"title": "Write memo", "assignee_id": ben.id}).json()
    assert task["assignee"]["name"] == "Ben" and task["status"] == "backlog"
    assert ben.get(f"{API}/notifications").json()["items"][0]["kind"] == "task.assigned"

    done = ben.patch(f"{base}/tasks/{task['id']}", json={"status": "done"}).json()
    assert done["completed_at"] and done["assignee"]["id"] == ben.id
    reopened = ben.patch(f"{base}/tasks/{other['id']}", json={"status": "in_review"}).json()
    assert reopened["completed_at"] is None
    assert len(ben.get(f"{base}/tasks").json()) == 2

    records = anon.get(f"{API}/users/{ben.id}/contributions").json()
    assert len(records) == 1
    record = records[0]
    assert (record["tasks_completed"], record["tasks_assigned"]) == (1, 2)
    assert record["role"] == "member" and record["title"] == "Backend engineer"

    verified = anon.get(f"{API}/contributions/{record['code'].lower()}")
    assert verified.status_code == 200
    assert verified.json()["member"]["name"] == "Ben"
    assert anon.get(f"{API}/contributions/OAK-0000-0000").status_code == 404

    # Unassigning removes the task from the member's record; leaving voids the proof.
    ben.patch(f"{base}/tasks/{other['id']}", json={"assignee_id": None})
    assert anon.get(f"{API}/users/{ben.id}/contributions").json()[0]["tasks_assigned"] == 1
    ben.delete(f"{base}/members/{ben.id}")
    assert anon.get(f"{API}/contributions/{record['code']}").status_code == 404
