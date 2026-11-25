"""Projects and everything stored in a project's partition:
members, applications, timeline posts, tasks, likes and follows."""

from boto3.dynamodb.conditions import Attr, ConditionBase

from app.db import keys
from app.db.schema import GSI1, GSI2
from app.db.table import Item, Page, get_table

_SEARCHABLE = ("title", "subtitle", "category", "uni", "city")
_COUNTER = {"LIKE": "likes", "FOLLOW": "follows"}


def _search_text(project: Item) -> str:
    parts = [str(project.get(field) or "") for field in _SEARCHABLE]
    parts += project.get("tags") or []
    parts += [role.get("title", "") for role in project.get("open_roles") or []]
    return " ".join(parts).lower()


# --------------------------------------------------------------- projects


def get(project_id: str) -> Item | None:
    return get_table().get(keys.project(project_id), keys.METADATA)


def get_many(project_ids: list[str]) -> dict[str, Item]:
    found = get_table().batch_get([(keys.project(pid), keys.METADATA) for pid in project_ids])
    return {item["id"]: item for item in found.values()}


def create(project: Item, owner_member: Item) -> None:
    """Atomically create a project together with its owner's membership."""
    table = get_table()
    pid, owner_id = project["id"], project["owner_id"]
    table.transact(
        [
            table.tx_put(
                {
                    **project,
                    "PK": keys.project(pid),
                    "SK": keys.METADATA,
                    "type": "PROJECT",
                    "gsi1_pk": keys.ALL_PROJECTS,
                    "gsi1_sk": keys.project_listing_sk(
                        project["priority"], project["created_at"], pid
                    ),
                    "search_text": _search_text(project),
                },
                unless_exists=True,
            ),
            table.tx_put(_member_item(pid, owner_member)),
            table.tx_put(_proof_item(pid, owner_member)),
            table.tx_update(keys.user(owner_id), keys.PROFILE, add={"num_projects": 1}),
            table.tx_update(*keys.STATS, add={"projects": 1}, condition=None),
        ]
    )


def update(current: Item, fields: Item) -> Item:
    """Apply `fields`, keeping the derived search text and listing order in sync."""
    merged = {**current, **fields}
    derived = {
        "search_text": _search_text(merged),
        "gsi1_sk": keys.project_listing_sk(merged["priority"], merged["created_at"], merged["id"]),
    }
    updated = get_table().update(
        keys.project(current["id"]), keys.METADATA, set_={**fields, **derived}
    )
    return updated or merged


def delete(project_id: str) -> None:
    """Remove the project and every item in its partition."""
    table = get_table()
    items = table.query_all(keys.project(project_id))
    members = [item for item in items if item["SK"].startswith("MEMBER#")]
    doomed = [(item["PK"], item["SK"]) for item in items]
    doomed += [keys.proof(member["proof_code"]) for member in members]
    table.delete_many(doomed)
    for member in members:
        table.update(keys.user(member["user_id"]), keys.PROFILE, add={"num_projects": -1})
    table.update(*keys.STATS, add={"projects": -1}, must_exist=False)


def list_page(limit: int, cursor: str | None, filter_expression: ConditionBase) -> Page:
    """Listable projects: featured first, then newest."""
    return get_table().query_page(
        keys.ALL_PROJECTS,
        index=GSI1,
        forward=False,
        limit=limit,
        cursor=cursor,
        filter_expression=filter_expression,
    )


def listing_filter(
    *,
    status: str | None,
    category: str | None,
    city: str | None,
    uni: str | None,
    tag: str | None,
    q: str | None,
) -> ConditionBase:
    condition: ConditionBase = Attr("visibility").ne("private")
    for attr, value in (("status", status), ("category", category)):
        if value:
            condition &= Attr(attr).eq(value)
    # Free-text facets match case-insensitively against the denormalised text.
    for value in (city, uni, tag, q):
        if value and value.strip():
            condition &= Attr("search_text").contains(value.strip().lower())
    return condition


# ---------------------------------------------------------------- members


def _member_item(project_id: str, member: Item) -> Item:
    return {
        **member,
        "PK": keys.project(project_id),
        "SK": f"MEMBER#{member['user_id']}",
        "type": "MEMBER",
        "project_id": project_id,
        "gsi2_pk": keys.user(member["user_id"]),
        "gsi2_sk": f"MEMBER#{member['joined_at']}#{project_id}",
    }


def _proof_item(project_id: str, member: Item) -> Item:
    pk, sk = keys.proof(member["proof_code"])
    return {
        "PK": pk,
        "SK": sk,
        "type": "PROOF",
        "code": member["proof_code"],
        "project_id": project_id,
        "user_id": member["user_id"],
    }


def get_member(project_id: str, user_id: str) -> Item | None:
    return get_table().get(keys.project(project_id), f"MEMBER#{user_id}")


def list_members(project_id: str) -> list[Item]:
    return get_table().query_all(keys.project(project_id), "MEMBER#")


def add_member(project_id: str, member: Item) -> None:
    """Seat a member. Raises Conflict when already seated or the team is full."""
    table = get_table()
    table.transact(
        [
            table.tx_put(_member_item(project_id, member), unless_exists=True),
            table.tx_put(_proof_item(project_id, member)),
            table.tx_update(
                keys.project(project_id),
                keys.METADATA,
                add={"current_members": 1},
                condition="#cur < #max",
                condition_names={"#cur": "current_members", "#max": "max_members"},
            ),
            table.tx_update(keys.user(member["user_id"]), keys.PROFILE, add={"num_projects": 1}),
            table.tx_update(*keys.STATS, add={"teammates_matched": 1}, condition=None),
        ]
    )


def update_member(project_id: str, user_id: str, fields: Item) -> Item | None:
    return get_table().update(keys.project(project_id), f"MEMBER#{user_id}", set_=fields)


def remove_member(project_id: str, member: Item) -> None:
    table = get_table()
    user_id = member["user_id"]
    table.transact(
        [
            table.tx_delete(keys.project(project_id), f"MEMBER#{user_id}", must_exist=True),
            table.tx_delete(*keys.proof(member["proof_code"])),
            table.tx_update(keys.project(project_id), keys.METADATA, add={"current_members": -1}),
            table.tx_update(keys.user(user_id), keys.PROFILE, add={"num_projects": -1}),
        ]
    )


def memberships_of(user_id: str) -> list[Item]:
    return get_table().query_all(keys.user(user_id), "MEMBER#", index=GSI2, forward=False)


def get_proof(code: str) -> Item | None:
    return get_table().get(*keys.proof(code))


# ----------------------------------------------------------- applications


def get_application(project_id: str, user_id: str) -> Item | None:
    return get_table().get(keys.project(project_id), f"APPLICATION#{user_id}")


def put_application(application: Item) -> None:
    table = get_table()
    project_id, user_id = application["project_id"], application["applicant_id"]
    table.put(
        {
            **application,
            "PK": keys.project(project_id),
            "SK": f"APPLICATION#{user_id}",
            "type": "APPLICATION",
            "gsi2_pk": keys.user(user_id),
            "gsi2_sk": f"APPLICATION#{application['created_at']}#{project_id}",
        }
    )


def update_application(project_id: str, user_id: str, fields: Item) -> Item | None:
    return get_table().update(keys.project(project_id), f"APPLICATION#{user_id}", set_=fields)


def list_applications(project_id: str) -> list[Item]:
    return get_table().query_all(keys.project(project_id), "APPLICATION#")


def applications_of(user_id: str) -> list[Item]:
    return get_table().query_all(keys.user(user_id), "APPLICATION#", index=GSI2, forward=False)


def count_application() -> None:
    get_table().update(*keys.STATS, add={"applications": 1}, must_exist=False)


# --------------------------------------------------------------- timeline


def get_post(project_id: str, post_id: str) -> Item | None:
    return get_table().get(keys.project(project_id), f"TIMELINE#{post_id}")


def put_post(post: Item) -> None:
    get_table().put(
        {
            **post,
            "PK": keys.project(post["project_id"]),
            "SK": f"TIMELINE#{post['id']}",
            "type": "TIMELINE_POST",
        }
    )


def update_post(project_id: str, post_id: str, fields: Item) -> Item | None:
    return get_table().update(keys.project(project_id), f"TIMELINE#{post_id}", set_=fields)


def delete_post(project_id: str, post_id: str) -> None:
    get_table().delete(keys.project(project_id), f"TIMELINE#{post_id}")


def list_posts(project_id: str, limit: int, cursor: str | None) -> Page:
    return get_table().query_page(
        keys.project(project_id), "TIMELINE#", forward=False, limit=limit, cursor=cursor
    )


# ------------------------------------------------------------------ tasks


def _task_item(task: Item) -> Item:
    item = {
        **task,
        "PK": keys.project(task["project_id"]),
        "SK": f"TASK#{task['id']}",
        "type": "TASK",
    }
    if task.get("assignee_id"):
        item["gsi2_pk"] = keys.user(task["assignee_id"])
        item["gsi2_sk"] = f"TASK#{task['project_id']}#{task['id']}"
    return item


def get_task(project_id: str, task_id: str) -> Item | None:
    return get_table().get(keys.project(project_id), f"TASK#{task_id}")


def put_task(task: Item) -> None:
    """Write the full task; index keys follow the assignee."""
    clean = {k: v for k, v in task.items() if k not in ("gsi2_pk", "gsi2_sk")}
    get_table().put(_task_item(clean))


def delete_task(project_id: str, task_id: str) -> None:
    get_table().delete(keys.project(project_id), f"TASK#{task_id}")


def list_tasks(project_id: str) -> list[Item]:
    return get_table().query_all(keys.project(project_id), "TASK#")


def tasks_assigned_to(user_id: str) -> list[Item]:
    return get_table().query_all(keys.user(user_id), "TASK#", index=GSI2)


# ------------------------------------------------------- likes and follows


def has_reaction(project_id: str, kind: str, user_id: str) -> bool:
    return get_table().get(keys.project(project_id), f"{kind}#{user_id}") is not None


def add_reaction(project_id: str, kind: str, user_id: str, created_at: str) -> None:
    """`kind` is LIKE or FOLLOW. Raises Conflict when already present."""
    table = get_table()
    item: Item = {
        "PK": keys.project(project_id),
        "SK": f"{kind}#{user_id}",
        "type": f"PROJECT_{kind}",
        "project_id": project_id,
        "user_id": user_id,
        "created_at": created_at,
    }
    if kind == "FOLLOW":
        item["gsi2_pk"] = keys.user(user_id)
        item["gsi2_sk"] = f"PFOLLOW#{created_at}#{project_id}"
    table.transact(
        [
            table.tx_put(item, unless_exists=True),
            table.tx_update(keys.project(project_id), keys.METADATA, add={_COUNTER[kind]: 1}),
        ]
    )


def remove_reaction(project_id: str, kind: str, user_id: str) -> None:
    table = get_table()
    table.transact(
        [
            table.tx_delete(keys.project(project_id), f"{kind}#{user_id}", must_exist=True),
            table.tx_update(keys.project(project_id), keys.METADATA, add={_COUNTER[kind]: -1}),
        ]
    )


def followed_project_ids(user_id: str) -> list[str]:
    items = get_table().query_all(keys.user(user_id), "PFOLLOW#", index=GSI2, forward=False)
    return [item["project_id"] for item in items]


def follower_ids(project_id: str) -> list[str]:
    items = get_table().query_all(keys.project(project_id), "FOLLOW#")
    return [item["user_id"] for item in items]
