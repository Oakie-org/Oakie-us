# DadaIsland API Expectations (Serverless Edition)

## 1. General Conventions
- **Base URL**: `/api/v1`
- **Format**: JSON `snake_case`.
- **Auth**: proprietary standard `Authorization: Bearer <Access_Token>` (Cognito JWT).
- **Date**: ISO-8601 UTC.
- **Pagination**: `page`, `page_size`, returning `{ items: [], total: N, page: N }`.

## 2. Authentication (AWS Cognito Wrapped)
*Although Cognito is used, we wrap basic flows in our API for frontend consistency if needed, or frontend calls Cognito directly and verifies with Backend.*

- `POST /auth/register`: Signup (handled by Cognito, or proxied).
- `POST /auth/login`: Signin (proxied to Cognito `ADMIN_INITIATE_AUTH` or standard auth).
- `POST /auth/refresh`: Refresh Tokens.
- `GET /auth/me`: getCurrentUser (validates Token).

## 3. Projects Domain
- `GET /projects`: Search & List. Filters: `category`, `stage`, `city`.
- `POST /projects`: Create Project. Body: `{ title, description, category, tags[], city, stage, ... }`.
- `GET /projects/{id}`: Detail. Includes `owner` summary.
- `PATCH /projects/{id}`: Edit details.
- `POST /projects/{id}/positions`: Add open roles.

## 4. Users Domain
- `GET /users/{id}`: Public profile (nickname, avatar, headline, bio, skills).
- `GET /users/me`: Private full profile.
- `PATCH /users/me`: Update profile fields.
- `GET /users/{id}/projects`: Projects owned or joined.

## 5. Metadata & Common
- `POST /uploads/sign`: Get S3 Presigned URL for uploading `avatar` or `cover_image`.
- `GET /meta/categories`: List project categories.
- `GET /meta/skills`: List popular skills.
- `GET /stats`: System overview stats.

## 6. Implementation Notes (FastAPI)
- Use **Pydantic** models for all Request/Response schemas.
- Use **FastAPI Dependencies** for Auth (`get_current_user`).
- **DynamoDB**: Use `boto3` or `pynamodb` or single-table helper.
