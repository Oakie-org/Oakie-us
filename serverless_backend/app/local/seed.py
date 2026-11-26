"""Demo data for local development, written through the real services so it
obeys the same rules as production data."""

from datetime import UTC, datetime, timedelta

from app.core.security import Principal
from app.local import auth
from app.models.project import (
    ApplicationCreate,
    InvitationCreate,
    OpenRole,
    ProjectCreate,
    TaskCreate,
    TimelinePostCreate,
)
from app.models.user import ProfileLink, UserUpdate
from app.repositories import projects as projects_repo
from app.repositories import users as users_repo
from app.services import applications, invitations, messaging, projects, users, workspace

# Demo "uploads" are files in frontend/public/seed, served by the Vite dev server.
# Only some projects have one: a picture is optional, and most posts are text.
SEED_IMAGES = "/seed"

# Local-only demo accounts; the password is the same for all of them.
DEMO_PASSWORD = "oakie-demo-2026"
DEMO_EMAIL = "maya@oakie.dev"

MEMBERS = [
    ("maya", "Maya Chen", "Product designer building tools for campus life", "New York, NY",
     "NYU", ["UI/UX Design", "Product Management", "Frontend"], ["Co-founder", "Side project"],
     "I turn fuzzy ideas into things people can click. Two shipped apps, one failed startup, "
     "many lessons."),
    ("leo", "Leo Park", "Quant research @ student fund", "Chicago, IL", "UChicago",
     ["Quant Research", "Financial Modeling", "Data Analysis"], ["Co-founder", "Hackathon"],
     "Factor models by day, basketball analytics by night. Looking for engineers who like "
     "markets."),
    ("sofia", "Sofia Alvarez", "Short-form video creator, 120k followers", "Los Angeles, CA",
     "UCLA", ["Video Editing", "Copywriting", "Marketing"], ["Side project", "Internship"],
     "I script, shoot and edit. I want to pair with builders who need a story told well."),
    ("omar", "Omar Haddad", "Full-stack engineer, serverless enthusiast", "Seattle, WA",
     "", ["Backend", "Frontend", "Mobile"], ["Co-founder", "Mentoring"],
     "Shipped three production apps on AWS. Happy to mentor first-time technical founders."),
    ("priya", "Priya Nair", "ML engineer exploring applied NLP", "Toronto, CA",
     "University of Toronto", ["Machine Learning", "Data Analysis", "Backend"],
     ["Side project", "Hackathon"],
     "Research assistant in an NLP lab. I like projects where the model is 20% of the work."),
    ("jun", "Jun Tanaka", "Freelance illustrator and brand designer", "Tokyo, JP", "",
     ["Illustration", "UI/UX Design"], ["Side project"],
     "Character design, brand systems, and the occasional zine."),
    ("grace", "Grace Okafor", "Community organizer and event producer", "Austin, TX",
     "", ["Community Ops", "Business Development", "Marketing"],
     ["Co-founder", "Internship"],
     "Ran a 600-person community conference. I make sure the room is full and the sponsors "
     "are happy."),
]  # fmt: skip

PROJECTS = [
    ("maya", dict(
        title="DormSwap", subtitle="A trusted micro-marketplace for move-out season",
        description="Every May, tons of perfectly good furniture ends up on the curb. DormSwap "
        "lets students at the same school hand things off quickly and safely.\n\nWe have a Figma "
        "prototype and a React demo, and we are preparing a two-week pilot on one campus. The "
        "goal: 200 listings, 30 completed hand-offs, and a first version of our trust signals.",
        category="Software", tags=["Marketplace", "React", "Trust & Safety"],
        status="Recruiting", uni="NYU", city="New York, NY", max_members=6,
        image_url=f"{SEED_IMAGES}/dormswap.svg",
        open_roles=[OpenRole(title="Backend engineer", skills=["Backend"]),
                    OpenRole(title="Campus growth lead", skills=["Marketing", "Community Ops"])])),
    ("leo", dict(
        title="Campus Quant Lab", subtitle="Student-run factor research with a paper-trading book",
        description="We research, backtest and paper-trade equity factor strategies, then write "
        "up what we learn in the open.\n\nThe research notebook pipeline works; what we lack is "
        "a proper data layer and someone who enjoys explaining results to non-quants.",
        category="Finance & Quant", tags=["Python", "Backtesting", "Equities"],
        status="In Progress", uni="UChicago", city="Chicago, IL", max_members=5,
        image_url=f"{SEED_IMAGES}/quant-lab.svg",
        open_roles=[OpenRole(title="Data engineer", skills=["Backend", "Data Analysis"]),
                    OpenRole(title="Research writer", skills=["Copywriting"])])),
    ("sofia", dict(
        title="Subtitles for All", subtitle="Multilingual captions for campus talks and films",
        description="Caption quality decides who gets to learn from a lecture. We are a small "
        "crew producing English, Spanish and Japanese subtitles for student media, with a shared "
        "style guide and QC process.\n\nGoal this semester: 30 captioned pieces and an "
        "open-source style guide.",
        category="Media & Content", tags=["Accessibility", "Translation", "Video"],
        status="Recruiting", uni="UCLA", city="Los Angeles, CA", max_members=10,
        open_roles=[OpenRole(title="Japanese translator", skills=["Copywriting"]),
                    OpenRole(title="QC tooling developer", skills=["Backend"])])),
    ("priya", dict(
        title="LabNote Buddy", subtitle="Reproducible research notes without the busywork",
        description="Lab records live in Word files, paper and chat threads. LabNote Buddy is a "
        "plugin workflow: templated experiment logs, linked data files, and an exportable "
        "reproducibility summary.\n\nOne research group is already using the prototype.",
        category="AI & Data", tags=["Research", "Productivity", "Automation"],
        status="In Progress", uni="University of Toronto", city="Toronto, CA", max_members=7,
        open_roles=[OpenRole(title="Integrations engineer", skills=["Backend"])])),
    ("grace", dict(
        title="Open Meals", subtitle="A live map of community fridges and what they need",
        description="Community fridges are either overflowing or empty, and donors never know "
        "which. Open Meals is an open-source tracker: a map of locations, simple stock "
        "categories and expiry reminders for site volunteers.\n\nOne community partner has "
        "agreed to pilot.",
        category="Social Impact", tags=["Open Source", "Mapping", "Community"],
        status="Recruiting", city="Austin, TX", max_members=8,
        image_url=f"{SEED_IMAGES}/open-meals.svg",
        open_roles=[OpenRole(title="Mobile developer", skills=["Mobile"]),
                    OpenRole(title="Field researcher", skills=["Community Ops"])])),
    ("jun", dict(
        title="Rainy Day Zine", subtitle="An illustrated anthology about cities in the rain",
        description="Twelve illustrators, twelve cities, one printed zine. We are looking for "
        "two more artists and someone who can run a small pre-order campaign.",
        category="Design & Art", tags=["Illustration", "Print", "Anthology"],
        status="Idea", city="Tokyo, JP", max_members=14,
        image_url=f"{SEED_IMAGES}/rainy-day-zine.svg",
        open_roles=[OpenRole(title="Illustrator", skills=["Illustration"]),
                    OpenRole(title="Campaign manager", skills=["Marketing"])])),
    ("omar", dict(
        title="QuietHours", subtitle="Know how loud the library is before you walk there",
        description="Finding a study spot is a lottery. QuietHours is a minimal web app: pick a "
        "building, see if it is quiet, okay or loud right now, based on anonymous reports with "
        "time decay and geofencing.",
        category="Software", tags=["Study spots", "Web App", "Data"],
        status="Recruiting", city="Seattle, WA", max_members=5,
        open_roles=[OpenRole(title="Product designer", skills=["UI/UX Design"])])),
    ("grace", dict(
        title="Founders' Supper Club", subtitle="Monthly dinners where early founders demo",
        description="Eight founders, one long table, three demos. We host a monthly dinner "
        "where small teams show work in progress and get candid feedback.",
        category="Events & Community", tags=["Startup", "Networking", "Demo night"],
        status="In Progress", city="Austin, TX", max_members=6,
        open_roles=[OpenRole(title="Sponsorship lead", skills=["Business Development"])])),
    ("leo", dict(
        title="Tip Jar Analytics", subtitle="Fair-pay insights for baristas",
        description="A weekend project that became a real tool: baristas log tips, the "
        "app shows how pooling rules change take-home pay.",
        category="Startup", tags=["Fintech", "Analytics", "Mobile"],
        status="Completed", city="Chicago, IL", max_members=4, open_roles=[])),
]  # fmt: skip

# One entry per project above: how long ago it was posted.
POSTED_HOURS_AGO = [5, 30, 3 * 24, 9 * 24, 2 * 24, 6 * 24, 20, 13 * 24, 40 * 24]


def run() -> None:
    """Populate an empty table. Safe to call once per fresh emulator."""
    people: dict[str, Principal] = {}
    for handle, name, headline, city, uni, skills, open_to, bio in MEMBERS:
        session = auth.register(
            auth.Registration(email=f"{handle}@oakie.dev", password=DEMO_PASSWORD, name=name)
        )
        principal = Principal(sub=session.user_id, email=f"{handle}@oakie.dev", name=name)
        users.update_me(
            principal,
            UserUpdate(
                headline=headline, city=city, uni=uni, skills=skills, open_to=open_to, bio=bio
            ),
        )
        people[handle] = principal

    # Demo accounts use one mail domain; mark a few as school-verified so the
    # badge is visible locally. In production the flag comes from the confirmed address.
    for handle in ("maya", "leo", "priya"):
        profile = users_repo.get(people[handle].sub)
        if profile:
            users_repo.update(profile, {"verified_school": True})
    users.update_me(
        people["maya"],
        UserUpdate(
            availability="5-10 hrs / week",
            accent="coral",
            links=[
                ProfileLink(label="Portfolio", url="https://example.com/maya"),
                ProfileLink(label="GitHub", url="https://github.com/example"),
            ],
        ),
    )

    for handle, availability in [
        ("leo", "10-20 hrs / week"),
        ("omar", "A few hrs / week"),
        ("sofia", "5-10 hrs / week"),
        ("grace", "Full-time"),
    ]:
        users.update_me(people[handle], UserUpdate(availability=availability))

    created: dict[str, str] = {}
    for owner, fields in PROJECTS:
        # Seed pictures are static files, not uploads, so they are attached
        # below the service, which only accepts a member's own upload.
        picture = fields.get("image_url")
        published = projects.create(people[owner], ProjectCreate(**{**fields, "image_url": None}))
        created[fields["title"]] = published.id
        project = projects_repo.get(published.id)
        if picture and project:
            projects_repo.update(project, {"image_url": picture})

    # Spread the posts over the last few weeks, so the feed has a sense of time.
    for (_, fields), hours in zip(PROJECTS, POSTED_HOURS_AGO, strict=True):
        project = projects_repo.get(created[fields["title"]])
        if project:
            posted = datetime.now(UTC) - timedelta(hours=hours)
            projects_repo.update(project, {"created_at": posted.isoformat(timespec="milliseconds")})

    # Feature two projects at the top of Explore.
    for title in ("DormSwap", "Campus Quant Lab"):
        project = projects_repo.get(created[title])
        if project:
            projects_repo.update(project, {"priority": 10})

    def join(handle: str, title: str, role_title: str, message: str, approve: bool = True) -> None:
        pid = created[title]
        applications.apply(
            pid, people[handle], ApplicationCreate(message=message, role_title=role_title)
        )
        if approve:
            owner = next(o for o, f in PROJECTS if f["title"] == title)
            applications.decide(pid, people[handle].sub, people[owner], True)

    join("omar", "DormSwap", "Backend engineer", "I can own the API and the deploy pipeline.")
    join("jun", "DormSwap", "Brand designer", "I'd love to give DormSwap a friendly identity.")
    join("priya", "Campus Quant Lab", "Data engineer", "Happy to build the data layer.")
    join("maya", "Subtitles for All", "Workflow designer", "I can design the QC workflow.")
    join("grace", "DormSwap", "Campus growth lead",
         "I ran move-out drives at UT and can adapt the playbook.", approve=False)  # fmt: skip
    join("sofia", "DormSwap", "Launch video",
         "I'd like to shoot a 30-second launch film for the pilot.", approve=False)  # fmt: skip

    dormswap = created["DormSwap"]
    maya, omar, jun = people["maya"], people["omar"], people["jun"]
    invitations.invite(
        created["QuietHours"],
        omar,
        InvitationCreate(
            user_id=maya.sub,
            role_title="Product designer",
            message="Your DormSwap cards are exactly the feel we want. "
            "Two weeks of design, then we ship.",
        ),
    )
    invitations.invite(
        dormswap,
        maya,
        InvitationCreate(user_id=people["priya"].sub, role_title="Trust & safety data", message=""),
    )
    users.update_me(maya, UserUpdate(pinned_project_ids=[dormswap]))
    for title, content, kind in [
        ("Pilot campus confirmed", "NYU housing agreed to let us run the two-week pilot in "
         "three residence halls. Launch date is the first week of May.", "milestone"),
        ("Prototype tested with 12 students", "Biggest finding: people want to see the "
         "seller's building before anything else. We moved location to the top of each card.",
         "update"),
        ("v0.2 demo is live", "Listings, photo upload and hand-off confirmation all work end "
         "to end. Next up: reporting and trust signals.", "release"),
    ]:  # fmt: skip
        workspace.create_post(
            dormswap, maya, TimelinePostCreate(title=title, content=content, kind=kind)
        )

    for title, status, assignee, due in [
        ("Design listing card v2", "done", maya, "2026-11-10"),
        ("Hand-off confirmation API", "done", omar, "2026-11-14"),
        ("Logo and colour system", "in_review", jun, "2026-11-25"),
        ("Photo upload from mobile web", "in_progress", omar, "2026-11-28"),
        ("Recruit 10 residence-hall ambassadors", "in_progress", maya, "2026-12-02"),
        ("Report-a-listing flow", "backlog", None, None),
        ("Pilot metrics dashboard", "backlog", omar, "2026-12-10"),
    ]:
        workspace.create_task(
            dormswap,
            maya,
            TaskCreate(
                title=title,
                status=status,
                assignee_id=assignee.sub if assignee else None,
                due_date=due,
            ),  # fmt: skip
        )

    quant = created["Campus Quant Lab"]
    workspace.create_post(
        quant,
        people["leo"],
        TimelinePostCreate(
            title="Momentum factor write-up published",
            content="Twelve-month momentum, monthly rebalance, 2010-2025. The write-up covers "
            "turnover costs, which eat about a third of the gross return.",
            kind="milestone",
        ),
    )

    for handle, target in [("leo", "maya"), ("sofia", "maya"), ("maya", "omar"), ("priya", "leo")]:
        users.follow(people[handle], people[target].sub)
    for handle, title in [("maya", "Campus Quant Lab"), ("leo", "DormSwap"), ("priya", "DormSwap")]:
        projects.set_reaction(created[title], people[handle], "FOLLOW", True)
        projects.set_reaction(created[title], people[handle], "LIKE", True)

    conversation = messaging.start(
        people["leo"], maya.sub, "Hey Maya, loved the DormSwap demo. Could we borrow your "
        "listing-card pattern for our research feed?"
    )  # fmt: skip
    messaging.send(maya, conversation.id, "Of course! I'll share the Figma file tonight.")
    messaging.send(people["leo"], conversation.id, "Amazing, thank you.")
    messaging.start(
        people["grace"], maya.sub, "Hi! I applied to DormSwap. Happy to chat about campus growth."
    )
