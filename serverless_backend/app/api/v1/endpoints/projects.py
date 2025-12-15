from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db.dynamodb import get_db
from app.models.project import (
    ProjectCreate,
    ProjectListRequest,
    ProjectPublic,
    ProjectsListResponse,
)
from app.shared.enum import ProjectStatus

router = APIRouter()


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_int(value: object, default: int) -> int:
    if value is None:
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, Decimal):
        return int(value)
    try:
        return int(value)  # pyright: ignore[reportGeneralTypeIssues]
    except (TypeError, ValueError):
        return default


def _project_from_item(item: dict) -> ProjectPublic:
    project_id = item.get("id")
    if (
        not project_id
        and isinstance(item.get("PK"), str)
        and item["PK"].startswith("PROJECT#")
    ):
        project_id = item["PK"].split("#", 1)[1]
    if not project_id:
        raise ValueError("Project item missing id")

    created_at = item.get("created_at") or ""
    updated_at = item.get("updated_at") or created_at

    return ProjectPublic(
        id=str(project_id),
        title=str(item.get("title") or ""),
        subtitle=(str(item["subtitle"]) if item.get("subtitle") else None),
        description=str(item.get("description") or ""),
        tags=list(item.get("tags") or []),
        status=ProjectStatus(item.get("status") or ProjectStatus.RECRUITING),
        category=str(item.get("category") or "General"),
        uni=str(item.get("uni") or ""),
        city=str(item.get("city") or ""),
        current_members=_as_int(item.get("current_members"), 1),
        max_members=_as_int(item.get("max_members"), 5),
        likes=_as_int(item.get("likes"), 0),
        follows=_as_int(item.get("follows"), 0),
        image=str(item.get("image") or ""),
        image_url=(str(item["image_url"]) if item.get("image_url") else None),
        created_at=str(created_at),
        updated_at=str(updated_at),
    )


@router.get("", response_model=ProjectsListResponse)
def list_projects(
    filters: ProjectListRequest = Depends(),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ProjectsListResponse:
    from boto3.dynamodb.conditions import Attr

    db = get_db()
    filter_expression = Attr("type").eq("PROJECT")
    if filters.status:
        filter_expression = filter_expression & Attr("status").eq(filters.status)
    if filters.category:
        filter_expression = filter_expression & Attr("category").eq(filters.category)
    if filters.city:
        filter_expression = filter_expression & Attr("city").eq(filters.city)
    if filters.uni:
        filter_expression = filter_expression & Attr("uni").eq(filters.uni)
    if filters.tag:
        filter_expression = filter_expression & Attr("tags").contains(filters.tag)
    if filters.q:
        q = filters.q.strip()
        if q:
            filter_expression = filter_expression & (
                Attr("title").contains(q) | Attr("description").contains(q)
            )

    items = db.scan(filter_expression=filter_expression)
    projects = [_project_from_item(item) for item in items]
    projects.sort(key=lambda p: p.created_at, reverse=True)

    total = len(projects)
    start = (page - 1) * page_size
    end = start + page_size
    return ProjectsListResponse(
        items=projects[start:end],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{project_id}", response_model=ProjectPublic)
def get_project(project_id: str) -> ProjectPublic:
    db = get_db()
    item = db.get_item(f"PROJECT#{project_id}")
    if not item or item.get("type") != "PROJECT":
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_from_item(item)


@router.post("", response_model=ProjectPublic, status_code=201)
def create_project(payload: ProjectCreate) -> ProjectPublic:
    db = get_db()
    now = _iso_now()
    project_id = str(uuid4())

    item = {
        "PK": f"PROJECT#{project_id}",
        "type": "PROJECT",
        "id": project_id,
        "title": payload.title,
        "subtitle": payload.subtitle,
        "description": payload.description,
        "tags": payload.tags,
        "status": payload.status,
        "category": payload.category,
        "uni": payload.uni,
        "city": payload.city,
        "current_members": 1,
        "max_members": payload.max_members,
        "likes": 0,
        "follows": 0,
        "image": payload.image,
        "image_url": payload.image_url,
        "created_at": now,
        "updated_at": now,
    }

    db.put_item(item, condition_expression="attribute_not_exists(PK)")
    return _project_from_item(item)
