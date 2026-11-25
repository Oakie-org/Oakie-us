# Oakie execution timeline

Status after the architecture rebuild. "Built" means implemented in the API and
the web app, covered by backend tests and exercised locally. Nothing here has
been redeployed to AWS yet (see `docs/architecture.md`, "Deploying to AWS").

## Week 0: foundation and core loop — built

- Cognito sign-up/sign-in with PostConfirmation profile provisioning; local dev identity provider.
- Projects: publish, edit, delete, browse with search and filters, cursor pagination, visibility levels.
- Profiles: private and public views, editing, avatar and banner uploads via presigned S3 POST.
- Platform stats and option catalog.

## Week 1: applications and interaction — built

- Apply, withdraw, approve, decline; team-size enforcement; owner and applicant views.
- Talent directory with skill, school, city and "open to" filters.
- Team management: project admins, removing members, leaving.

## Week 2: social and messaging — built

- One-to-one conversations with unread counts (polling).
- Notifications for applications, decisions, follows, project updates and task assignment.
- Follow users, like and follow projects.

## Week 3: polish and scale — partly built

- Built: search over denormalised text, in-memory caching of platform stats,
  a single notification seam ready for EventBridge.
- Next: move notification fan-out to EventBridge; real-time messages (API Gateway
  WebSockets); a dedicated search index once listings outgrow filtered queries.

## Collaboration space and proof — built

- Project timeline (updates, milestones, releases) and a task board with owners and due dates.
- Contribution records: one verifiable record per member per project, with a public
  verification page (`/verify/<code>`).

## Not started

- Incubation channel (investors, mentors, incubators): planned in the README, no design yet.
- Email notifications, moderation tools, admin console.
- Migrating data from the pre-rebuild tables; first deploy of the new stack.
