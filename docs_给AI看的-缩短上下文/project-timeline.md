# Oakie Serverless Execution Timeline

## Week 0: Foundation & Core Loops (Current Focus)
**Goal**: Implement Registration/Login, Project Browsing/Creation, and Personal Homepage.
**Tech**: Python FastAPI, AWS Lambda, DynamoDB, AWS Cognito.

### Key Deliverables
1.  **Authentication (Cognito Integration)**
    *   Register/Login via Cognito (Email/Password or Phone).
    *   `PostConfirmation` Lambda to sync User Profile to DynamoDB.
    *   FastAPI Dependency `get_current_user` reading JWT claims.
2.  **Project Discovery (Read)**
    *   `GET /projects`: List with pagination and basic filtering (Newest, Category).
    *   `GET /projects/{id}`: Detail view.
    *   `GET /stats/overview`: Simple counters for Landing Page.
3.  **Project Creation (Write)**
    *   `POST /projects`: Create a new project (Owner = Current User).
    *   `POST /uploads/sign`: Signed URL for image uploads (Cover/Avatar).
4.  **User Profile (Personal Homepage)**
    *   `GET /users/me`: My profile & settings.
    *   `GET /users/{id}`: Public profile view.
    *   `PATCH /users/me`: Update bio, nickname, avatar.

## Week 1: Applications & Interaction
*   **Application Flow**: Apply to projects (`POST /projects/{id}/apply`), Appicant/Owner views.
*   **Talent Directory**: `GET /talent` with filters.
*   **Interactions**: simple "Ping" or "Invite" mechanism.

## Week 2: Social & Messaging
*   **Messaging**: One-on-one chat (`/conversations`).
*   **Notifications**: Activity feed (Application updates, Invites).
*   **Social**: Follow/Unfollow users/projects.

## Week 3: Polish & Scale
*   **Search**: Optimized storage/query for keywords (CloudSearch or DynamoDB Filters).
*   **Caching**: DAF (DynamoDB Accelerator) or internal memory cache for config APIs.
*   **Async**: EventBridge implementation for decoupled notifications.
