from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from boto3.dynamodb.conditions import Key, Attr

from app.db.dynamodb import get_projects_db
from app.models.project import (
    ProjectCreate,
    ProjectListRequest,
    ProjectPublic,
    ProjectsListResponse,
)
from app.models.timeline import (
    CreateTimelinePostRequest,
    UpdateTimelinePostRequest,
    TimelinePostPublic,
    TimelinePostsListResponse,
)
from app.shared.enum import ProjectStatus, ProjectVisibility
from app.core.security import TokenPayload, get_current_user_optional
from app.core.permissions import require_creator_or_above

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

    # Parse visibility with fallback to PUBLIC for backward compatibility
    visibility_str = item.get("visibility", ProjectVisibility.PUBLIC)
    try:
        visibility = ProjectVisibility(visibility_str)
    except ValueError:
        visibility = ProjectVisibility.PUBLIC

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
        visibility=visibility,
        owner_id=item.get("owner_id"),
        created_at=str(created_at),
        updated_at=str(updated_at),
    )


@router.get("", response_model=ProjectsListResponse)
def list_projects(
    filters: ProjectListRequest = Depends(),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ProjectsListResponse:
    """
    List all PUBLIC projects.

    Note: Private projects are excluded from this listing.
    Members-only projects show in list but may have restricted detail access.
    """
    db = get_projects_db()

    # Base filter: only PROJECT type, exclude PRIVATE visibility
    filter_expression = Attr("type").eq("PROJECT") & Attr("visibility").ne(
        ProjectVisibility.PRIVATE.value
    )

    if filters.status:
        filter_expression = filter_expression & Attr("status").eq(filters.status)
    if filters.category:
        filter_expression = filter_expression & Attr("category").eq(filters.category)
    if filters.city:
        filter_expression = filter_expression & Attr("city").eq(filters.city)
    if filters.uni:
        filter_expression = filter_expression & Attr("uni").eq(filters.uni)
    # Note: tag filter moved to Python layer for partial matching support
    if filters.owner_id:
        filter_expression = filter_expression & Attr("owner_id").eq(filters.owner_id)
    if filters.q:
        q = filters.q.strip()
        if q:
            filter_expression = filter_expression & (
                Attr("title").contains(q) | Attr("description").contains(q)
            )

    items = db.scan(filter_expression=filter_expression)
    projects = [_project_from_item(item) for item in items]

    # Apply partial tag matching in Python layer
    # This allows "Web" to match "Web3", "Mobile" to match "Mobile App", etc.
    if filters.tag:
        tag_lower = filters.tag.lower()
        projects = [p for p in projects if any(tag_lower in t.lower() for t in p.tags)]

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
def get_project(
    project_id: str,
    current_user: TokenPayload | None = Depends(get_current_user_optional),
) -> ProjectPublic:
    """
    Get a single project by ID.

    Access rules:
    - PUBLIC: Anyone can view
    - MEMBERS_ONLY: Anyone can view basic info (full access requires membership - TODO)
    - PRIVATE: Only members can view (returns 404 for non-members)
    """
    db = get_projects_db()
    item = db.get_item(f"PROJECT#{project_id}", sk="METADATA")
    if not item or item.get("type") != "PROJECT":
        raise HTTPException(status_code=404, detail="Project not found")

    # Check visibility restrictions
    visibility = item.get("visibility", ProjectVisibility.PUBLIC.value)
    owner_id = item.get("owner_id")

    if visibility == ProjectVisibility.PRIVATE.value:
        # Private projects: only owner/members can access
        # TODO: Check project membership when ProjectMember API is implemented
        if not current_user:
            raise HTTPException(status_code=404, detail="Project not found")

        # For now, only owner can see private projects
        # Later: check if user is in project members
        if current_user.sub != owner_id and not current_user.is_admin():
            raise HTTPException(status_code=404, detail="Project not found")

    return _project_from_item(item)


@router.post("", response_model=ProjectPublic, status_code=201)
def create_project(
    payload: ProjectCreate,
    current_user: TokenPayload = Depends(require_creator_or_above()),
) -> ProjectPublic:
    """
    Create a new project.

    Requires 'creator' role or above.
    Automatically sets current user as owner.
    """
    db = get_projects_db()
    now = _iso_now()
    project_id = str(uuid4())

    item = {
        "PK": f"PROJECT#{project_id}",
        "SK": "METADATA",
        "type": "PROJECT",
        "id": project_id,
        "title": payload.title,
        "subtitle": payload.subtitle,
        "description": payload.description,
        "tags": list(payload.tags),  # Ensure list type
        "status": str(payload.status.value),  # Convert enum to string
        "category": payload.category,
        "uni": payload.uni,
        "city": payload.city,
        "current_members": 1,
        "max_members": payload.max_members,
        "likes": 0,
        "follows": 0,
        "image": payload.image,
        "image_url": payload.image_url,
        "visibility": str(payload.visibility.value),  # Convert enum to string
        "owner_id": current_user.sub,
        "created_at": now,
        "updated_at": now,
    }

    db.put_item(item, condition_expression="attribute_not_exists(PK)")
    return _project_from_item(item)


# =============================================================================
# TIMELINE ENDPOINTS
# =============================================================================


@router.post(
    "/{project_id}/timeline", response_model=TimelinePostPublic, status_code=201
)
def create_timeline_post(
    project_id: str,
    payload: CreateTimelinePostRequest,
    current_user: TokenPayload = Depends(require_creator_or_above()),
):
    """
    Add a new post to the project timeline.
    Only the project owner can post details.
    """
    db = get_projects_db()

    # Verify Project Ownership
    project_item = db.get_item(f"PROJECT#{project_id}", sk="METADATA")
    if not project_item:
        raise HTTPException(status_code=404, detail="Project not found")

    if project_item.get("owner_id") != current_user.sub:
        raise HTTPException(
            status_code=403, detail="Only the project owner can post updates"
        )

    now = _iso_now()
    post_id = str(uuid4())

    # Store with Composite Key for sorting
    item = {
        "PK": f"PROJECT#{project_id}",
        "SK": f"TIMELINE#{now}#{post_id}",
        "type": "TIMELINE_POST",
        "id": post_id,
        "project_id": project_id,
        "title": payload.title,
        "content": payload.content,
        "media_urls": payload.media_urls,
        "created_at": now,
        "updated_at": now,
    }

    db.put_item(item)

    return TimelinePostPublic(
        id=post_id,
        project_id=project_id,
        title=payload.title,
        content=payload.content,
        media_urls=payload.media_urls,
        created_at=now,
        updated_at=now,
    )


@router.get("/{project_id}/timeline", response_model=TimelinePostsListResponse)
def list_timeline_posts(
    project_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: TokenPayload | None = Depends(get_current_user_optional),
):
    """
    List timeline posts for a project.
    """
    db = get_projects_db()

    # Fetch posts (reverse chronological)
    items = db.query(
        KeyConditionExpression=Key("PK").eq(f"PROJECT#{project_id}")
        & Key("SK").begins_with("TIMELINE#"),
        ScanIndexForward=False,
    )

    posts = []
    for item in items:
        posts.append(
            TimelinePostPublic(
                id=item["id"],
                project_id=item["project_id"],
                title=item["title"],
                content=item["content"],
                media_urls=item.get("media_urls", []),
                created_at=item["created_at"],
                updated_at=item.get("updated_at"),
            )
        )

    total = len(posts)
    start = (page - 1) * page_size
    end = start + page_size

    return TimelinePostsListResponse(
        items=posts[start:end], total=total, page=page, page_size=page_size
    )


@router.put("/{project_id}/timeline/{post_id}", response_model=TimelinePostPublic)
def update_timeline_post(
    project_id: str,
    post_id: str,
    payload: UpdateTimelinePostRequest,
    current_user: TokenPayload = Depends(require_creator_or_above()),
):
    db = get_projects_db()

    # Check Ownership
    project_item = db.get_item(f"PROJECT#{project_id}", sk="METADATA")
    if project_item.get("owner_id") != current_user.sub:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch all posts to find target
    items = db.query(
        KeyConditionExpression=Key("PK").eq(f"PROJECT#{project_id}")
        & Key("SK").begins_with("TIMELINE#"),
    )

    target_item = None
    for item in items:
        if item.get("id") == post_id:
            target_item = item
            break

    if not target_item:
        raise HTTPException(status_code=404, detail="Post not found")

    # Update Fields
    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        return TimelinePostPublic(**target_item)

    target_item.update(update_data)
    target_item["updated_at"] = _iso_now()

    db.put_item(target_item)

    return TimelinePostPublic(
        id=target_item["id"],
        project_id=target_item["project_id"],
        title=target_item["title"],
        content=target_item["content"],
        media_urls=target_item.get("media_urls", []),
        created_at=target_item["created_at"],
        updated_at=target_item.get("updated_at"),
    )


@router.delete("/{project_id}/timeline/{post_id}", status_code=204)
def delete_timeline_post(
    project_id: str,
    post_id: str,
    current_user: TokenPayload = Depends(require_creator_or_above()),
):
    db = get_projects_db()

    # Check Ownership
    project_item = db.get_item(f"PROJECT#{project_id}", sk="METADATA")
    if project_item.get("owner_id") != current_user.sub:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find item
    items = db.query(
        KeyConditionExpression=Key("PK").eq(f"PROJECT#{project_id}")
        & Key("SK").begins_with("TIMELINE#"),
    )

    target_item = None
    for item in items:
        if item.get("id") == post_id:
            target_item = item
            break

    if not target_item:
        raise HTTPException(status_code=404, detail="Post not found")

    # Delete
    db.delete_item(f"PROJECT#{project_id}", target_item["SK"])
    return None
