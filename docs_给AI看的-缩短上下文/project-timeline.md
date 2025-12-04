# DadaIsland Backend Execution Timeline

This plan builds on current progress (Spring Boot + JWT + MyBatis scaffolding) and aligns with the mobile mockups in `tpyrced_sj-warm.html`. Each phase completes prerequisites for the next screen/functionality.

## Week 0 – Core Auth & Discover Foundations
- Finalize login + refresh token rotation so `/auth/login` and `/auth/token/refresh` return 200 with JWTs.
- Implement `GET /stats/overview` for landing KPIs and `GET /projects` with filters/pagination for the discover feed.
- Outcome: Frontend can render landing + discover screens with live data; auth gates start working end-to-end.

## Week 1 – Project Detail & Creation
- Deliver `GET /projects/{id}` including owner summary, stage/city, headcount, follow/apply state, and preview of positions/team.
- Ship project creation flow: `/uploads/sign`, `POST /projects`, `/projects/{id}/positions`, and PATCH endpoints for edits/status changes.
- Outcome: Project detail page and “发布项目” form become functional, enabling creators to seed real content.

## Week 2 – Application Workflow & Talent Directory
- Build application APIs (`POST /projects/{id}/applications`, `/projects/{id}/applications/me`, owner review stubs) to power “申请加入项目”.
- Stand up talent discovery: `GET /talent`, `GET /talent/{id}`, `POST /talent/{id}/ping`, plus optional `/projects/{id}/invites` for owner outreach.
- Outcome: Collaboration loop closes—users can apply to or invite teammates directly from the app.

## Week 3 – Profile, Follow Graph & Metadata
- Implement `/users/{id}`, `/users/{id}/projects`, skills maintenance, and follow/unfollow endpoints to support the profile screen and social cues.
- Expose `/meta/categories|skills|cities|stages|roles|counters` with caching/ETag so forms and filters stay in sync.
- Outcome: “我的”页面可用，所有筛选/表单项可读后端枚举，社交数据连通。

## Week 4 – Messaging & Notifications MVP
- Deliver conversations + messaging (`/conversations`, `/conversations/{id}/messages`) and notifications feed (`/notifications`, read APIs).
- Add `/session/bootstrap` (or `/users/me`) to return user profile + unread counts in one call, reducing client waterfalls.
- Outcome: “约聊”按钮与通知铃铛有真实数据，App 启动加载体验改善。

## Week 5 – Async Plumbing, Caching & Polish
- Integrate Redis for OTP rate limiting + hot feed caching; hook RocketMQ/outbox for application/follow events.
- Add seed data scripts (`docker/mysql/init`) and expand README setup/testing sections; increase automated test coverage around auth/projects/applications.
- Outcome: System可靠度提升，开发者上手流程完善，为 Beta 发布做准备。

> Adjust week numbering based on actual sprint length/capacity; sequence matters (later milestones depend on earlier deliverables).
