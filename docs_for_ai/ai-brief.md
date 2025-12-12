# Oakie AI Brief

## Rules & Context
- **Architecture**: Serverless Microservices using AWS Lambda, Python 3.11+, and FastAPI.
- **Data**: Amazon DynamoDB (NoSQL) for business data; AWS Cognito for identity management.
- **Code Style**: Python formatting (Black/Isort), Pydantic for Validation, Type Hints everywhere.
- **Principles**: Single Responsibility, Stateless Compute, Event-Driven (where applicable).
- **Project**: Oakie connects students and young creators so they can meet teammates, build internet projects, and earn verifiable contribution records.

## 1. API Essentials
- `/api/v1` prefix.
- **FastAPI** handles routing and validation.
- **Mangum** adapts FastAPI for Lambda.
- **API Gateway** handles entry point and JWT Authorizer (Cognito).

### Auth & Session (AWS Cognito)
- **Identity**: AWS Cognito User Pool handles Users/Password/OTP/MFA.
- **Tokens**: Access/ID Tokens issued by Cognito. API Gateway validates them automatically (`Authorizer`).
- **Profile Config**: `PostConfirmation` Lambda trigger creates initial user profile in DynamoDB upon registration.
- **Auth Flow**: 
  - Frontend interacts directly with AWS Cognito for Registration/Login (Hosted UI or Amplify SDK).
  - Cognito triggers `PostConfirmation` Lambda to sync User Profile to DynamoDB.
  - Frontend obtains JWT (Access Token) and sends it in `Authorization` header to Backend.
  - Backend validates Token via API Gateway Authorizer and reads user data from DynamoDB.

### Core Domains (FastAPI Routers)
- `landing`: `/stats/overview` (counters), `/projects/trending`.
- `projects`: CRUD for Projects (`/projects`). Stored in DynamoDB `Projects` table.
   - **Features**: Team Management (Roles/Skills), Interactive Timeline (Milestones/Updates).
- `applications`: Manage join requests. Stored in DynamoDB `Applications` table.
- `users`: User profiles (`/users/{id}`). Stored in DynamoDB `Users` table (PK = Cognito Sub).
- `meta`: Enums for frontend forms (Skills, Cities, Stages).

## 2. Progress & Goals

### Current Stack (Migrated)
- **Backend**: Python / FastAPI / Mangum / Boto3.
- **Database**: DynamoDB (Single-table or multi-table design per access pattern).
- **Auth**: AWS Cognito User Pool.
- **Infra**: AWS SAM / Serverless Framework (assumed).

### Timeline Targets (docs/project-timeline.md)
- **Week 0 (Current)**: 
  - **Goal**: End-to-end "Register -> Login -> View Projects -> Create Project -> View Profile".
  - **Deliverables**: 
    - functional `/auth` endpoints (Cognito wrapped).
    - `/projects` list & detail & create.
    - `/users/me` profile.
- **Week 1**: Applications & Talent Directory.
- **Week 2**: Messaging & Notifications.
- **Week 3**: Async Events, Caching, Polish.

## 3. Database Schema (DynamoDB NoSQL)
- **Users Table**: PK=`User#<CognitoSub>`, Attributes: `nickname`, `avatar`, `skills[]`, `bio`.
- **Projects Table**: PK=`Project#<UUID>`, Attributes: `title`, `subtitle` (short intro), `description`, `tags[]` (Generic: Tech/Content), `status`, `owner_id`, `members[]`.
    - GSI: `OwnerIndex` (query by `owner_id`).
    - GSI: `CategoryIndex` (filter by category).
- **Applications Table**: PK=`App#<UUID>`, Attributes: `project_id`, `applicant_id`, `status`.
- **Single-Table Design Consideration**: May consolidate if access patterns require complex joins, but keeping separate tables is fine for MVP speed.
