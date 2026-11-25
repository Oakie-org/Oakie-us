"""Typeahead: a handful of projects, people and skills for what has been typed."""

from app.models.social import ProjectHit, SearchSuggestions
from app.repositories import projects as projects_repo
from app.services import platform, projects, users


def suggest(q: str, limit: int) -> SearchSuggestions:
    needle = q.strip().lower()
    if len(needle) < 2:
        return SearchSuggestions(projects=[], people=[], skills=[])
    found = projects_repo.list_page(limit, None, projects.ProjectQuery(q=needle).matcher())
    people = users.talent(
        q=needle, skill=None, city=None, uni=None, open_to=None, limit=limit, cursor=None
    )
    starts = [skill for skill in platform.SKILLS if skill.lower().startswith(needle)]
    contains = [
        skill for skill in platform.SKILLS if needle in skill.lower() and skill not in starts
    ]
    return SearchSuggestions(
        projects=[ProjectHit(**item) for item in found.items],
        people=people.items,
        skills=(starts + contains)[:4],
    )
