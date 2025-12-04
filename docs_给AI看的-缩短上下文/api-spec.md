# DadaIsland API Expectations (Draft)

Source of truth: mobile-first mockups in `tpyrced_sj-warm.html` (沙滩暖色版). All endpoints below assume `/api/v1` prefix and JWT bearer auth unless explicitly marked public.

## 1. Screen-Driven Scope

| Mock Screen | Key Data Needs |
| --- | --- |
| 01 Landing | Global stats, featured projects, entry points for login/register |
| 02 Discover Projects | Search, filters, paginated project cards, notification badge |
| 03 Project Detail | Cover, owner info, skills, openings, apply CTA |
| 04 Create Project | Upload cover, pick categories/tags/city/stage, submit form |
| 05 Find Teammates | Filterable talent list, chat/contact action |
| 06 Profile | Bio, skills, participation stats, follow counts, project history |

## 2. API Conventions

- Every response wraps data + paging metadata when applicable:
  ```json
  { "data": [...], "pagination": {"page":1,"page_size":20,"total":200} }
  ```
- Pagination: `page` + `page_size` for grids; `cursor` optional for infinite scroll.
- Enums (e.g., `project_stage`, `role_type`, `recruit_status`) exposed through `/meta/*` endpoints to keep filters/form options synced.
- All timestamps ISO-8601 UTC. Frontend localizes displays.
- Image/file uploads use signed URLs: client requests signed upload, pushes asset to object storage, then references returned `asset_id` in form payloads.
- Auth: registration via phone + OTP; all mutating/read-sensitive routes require bearer token.

## 3. Authentication & Session

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| POST | `/auth/send-otp` | Issue phone OTP with rate-limit metadata | Public |
| POST | `/auth/register` | Create account w/ phone, otp, password, profile basics; returns access + refresh tokens | Public |
| POST | `/auth/login` | Password (or OTP) login, returns tokens | Public |
| POST | `/auth/token/refresh` | Rotate access token using refresh token | Refresh token |
| POST | `/auth/logout` | Invalidate refresh token + server cache | Bearer |

## 4. Landing & Discover Data

| Method | Path | Description | Notes |
| --- | --- | --- | --- |
| GET | `/stats/overview` | Total active projects, creators, successful launches for hero stats | Public cacheable |
| GET | `/projects/trending?limit=6` | Featured projects section | Compact card payload |
| GET | `/projects` | Discover feed; supports `keyword`, `category`, `city`, `stage`, `status`, `skills[]`, `remote_only`, `sort`, pagination | Bearer optional; public browsing allowed |
| GET | `/projects/search/suggestions?q=` | Autocomplete for search bars | Public |
| GET | `/tags/popular?type=project` | Quick filter chips (技术开发/设计创意/内容运营) | Cached |

## 5. Project Detail & Membership

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/{projectId}` | Full project detail: cover, description, owner summary, capacity, stage, city, follow/application status |
| GET | `/projects/{projectId}/positions` | Open/filled roles list with descriptions |
| GET | `/projects/{projectId}/team` | Current members (role, commitment) |
| POST | `/projects/{projectId}/applications` | Submit application (`role_id`, `pitch`, `contact_handle`) |
| GET | `/projects/{projectId}/applications/me` | Applicant sees current status |
| POST | `/projects/{projectId}/follow` | Follow project for updates |
| DELETE | `/projects/{projectId}/follow` | Unfollow |

## 6. Project Creation & Management

| Method | Path | Description |
| --- | --- | --- |
| POST | `/uploads/sign` | Return signed URL + `asset_id` for cover uploads |
| POST | `/projects` | Create new project (title, category, description, skills[], team_size, city, stage, cover_asset_id) |
| PATCH | `/projects/{projectId}` | Owner edits description, size, stage, tags, status |
| POST | `/projects/{projectId}/positions` | Add recruitment slots |
| PATCH | `/positions/{positionId}` | Update role info or close slot |
| PATCH | `/projects/{projectId}/status` | Toggle recruiting / in_progress / completed |
| GET | `/projects/me` | List projects owned by current user (for management UI later) |

## 7. Talent & Teaming

| Method | Path | Description |
| --- | --- | --- |
| GET | `/talent` | Filterable talent feed: `role_type`, `skills[]`, `school`, `city`, `availability`, `experience_years`, pagination |
| GET | `/talent/{userId}` | Detail card for modal (bio snippet, availability, skills) |
| POST | `/talent/{userId}/ping` | Send chat/invite request (“约聊”) |
| GET | `/talent/recommendations` | Personalized matches for current user |
| POST | `/projects/{projectId}/invites` | Owner invites a talent profile |

## 8. Profile & Social Graph

| Method | Path | Description |
| --- | --- | --- |
| GET | `/users/{userId}` | Profile header: avatar, headline, city, experience, bio, counters |
| GET | `/users/{userId}/skills` | Skills tag list |
| PATCH | `/users/me/skills` | Update own skills |
| GET | `/users/{userId}/projects?role=member` | Projects participated in (for card list) |
| POST | `/users/{userId}/follow` | Follow user (for +关注) |
| DELETE | `/users/{userId}/follow` | Unfollow |
| PATCH | `/users/me` | Update bio, city, availability toggle |

## 9. Messaging & Notifications

| Method | Path | Description |
| --- | --- | --- |
| GET | `/conversations` | List chat threads (用于 bell icon/messages tab) |
| POST | `/conversations` | Start conversation (project invite, talent ping) |
| GET | `/conversations/{conversationId}/messages` | Fetch messages |
| POST | `/conversations/{conversationId}/messages` | Send message/text/file |
| GET | `/notifications?types=project,application,follow` | Bell feed |
| POST | `/notifications/{notificationId}/read` | Mark single read |
| POST | `/notifications/read-all` | Clear badge |

## 10. Taxonomy & Metadata

| Method | Path | Description |
| --- | --- | --- |
| GET | `/meta/categories` | Project categories |
| GET | `/meta/skills` | Skills dictionary (with typeahead support) |
| GET | `/meta/cities` | Supported city list + remote option |
| GET | `/meta/stages` | Project stage enum |
| GET | `/meta/roles` | Role types for talent filters |
| GET | `/meta/counters` | Misc config (max team size, experience buckets) |

## 11. Sample Payloads

```json

GET /projects/{id}

{
  "id": "proj_123",
  "title": "智能学习笔记工具",
  "status": "recruiting",
  "stage": "mvp",
  "city": "杭州",
  "cover_url": "https://cdn.dada.island/...",
  "summary": "用AI帮助学生整理和复习笔记",
  "headcount": { "needed": 5, "filled": 2 },
  "needed_skills": ["Vue.js", "Node.js", "UI设计", "AI/ML"],
  "owner": {
    "id": "user_88",
    "name": "张小雨",
    "headline": "产品经理 · 浙江大学",
    "avatar_url": "...",
    "is_following": false
  },
  "positions": [
    { "id": "pos_1", "title": "前端工程师", "status": "open", "description": "负责Web端和移动端界面开发" },
    { "id": "pos_2", "title": "UI设计师", "status": "open", "description": "负责产品界面和交互设计" }
  ],
  "metrics": { "applicants": 6, "followers": 142 },
  "created_at": "2024-05-01T08:30:00Z"
}
```

```json
POST /projects (body)
{
  "title": "校园活动助手",
  "category": "content_ops",
  "description": "让学生轻松创建和推广活动……",
  "skills": ["产品", "运营", "Flutter"],
  "team_size": 5,
  "city": "北京",
  "stage": "idea",
  "cover_asset_id": "upl_456"
}
```

## 12. Next Steps

1. Confirm naming + pagination conventions with frontend before wiring.
2. Prioritize Auth login + `/projects` endpoints (most screens depend on them).
3. Ship metadata endpoints early so filters/forms unblock FE prototyping.
4. Extend spec as new screens (messaging, notifications detail) solidify.
