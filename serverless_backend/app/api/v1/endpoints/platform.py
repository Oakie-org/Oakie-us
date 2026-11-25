"""Catalog, stats and upload signing."""

from fastapi import APIRouter, Depends, Query

from app.core.security import Principal, get_current_user
from app.models.social import (
    Catalog,
    SearchSuggestions,
    SignRequest,
    SignResponse,
    StatsOverview,
)
from app.services import platform, search

router = APIRouter()


@router.get("/meta", response_model=Catalog)
def catalog():
    return platform.CATALOG


@router.get("/stats/overview", response_model=StatsOverview)
def stats_overview():
    return platform.stats_overview()


@router.get("/search/suggest", response_model=SearchSuggestions)
def search_suggest(q: str = Query("", max_length=80), limit: int = Query(4, ge=1, le=8)):
    """Typeahead across projects, people and skills."""
    return search.suggest(q, limit)


@router.post("/uploads/sign", response_model=SignResponse)
def sign_upload(payload: SignRequest, user: Principal = Depends(get_current_user)):
    return platform.sign_upload(user, payload.file_type, payload.purpose)
