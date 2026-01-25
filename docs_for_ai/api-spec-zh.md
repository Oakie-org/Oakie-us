# 搭搭岛接口预期 (Serverless 版)

## 1. 通用约定

- **Base URL**: `/api/v1`
- **格式**: JSON `snake_case`.
- **鉴权**: 采用标准 `Authorization: Bearer <Access_Token>` (Cognito JWT).
- **时间**: ISO-8601 UTC.
- **分页**: 参数 `page`, `page_size`, 返回结构 `{ items: [], total: N, page: N }`.

## 2. 认证与会话 (AWS Cognito 封装)

_尽管核心使用 Cognito，我们在 API 层做一层轻量封装以保持前端调用习惯，或者由前端直接集成 Cognito SDK，后端负责验签。_

- **前端职责**: 使用 AWS SDK (如 Amplify) 或 Hosted UI 直接处理注册 (`signUp`)、登录 (`initiateAuth`) 和 Token 刷新。
- `GET /auth/me`: 获取当前用户资料 (需要 Bearer Token). 后端验证 Token 并从 DynamoDB 读取用户信息.

## 3. 项目 (Projects)

- `GET /projects/cursor`: 搜索与列表（游标分页）. 筛选: `category`, `stage`, `city`, `title`, `tag`.
- `POST /projects`: 创建项目. Body: `{ title, description, category, tags[], city, stage, ... }`.
- `GET /projects/{id}`: 项目详情. 包含 `owner` 摘要.
- `PATCH /projects/{id}`: 编辑信息.
- `POST /projects/{id}/positions`: 添加招募岗位.

## 4. 用户 (Users)

- `GET /users`: 搜索用户（查询参数：`name`, `nickname`, `bio`, `location`, `uni`, `skill`）。
- `GET /users/{id}`: 公开资料 (昵称, 头像, 头衔, 简介, 技能).
- `GET /users/me`: 个人完整资料 (私有).
- `PATCH /users/me`: 更新资料.
- `GET /users/{id}/projects`: 参与或拥有的项目.

## 5. 元数据与通用 (Metadata)

- `POST /uploads/sign`: 获取 S3 预签名 URL 用于上传 `avatar` 或 `cover_image`.
- `GET /meta/categories`: 项目分类列表.
- `GET /meta/skills`: 热门技能列表.
- `GET /stats`: 系统概览统计.

## 6. 技术实现备注 (FastAPI)

- 使用 **Pydantic** 定义所有的请求与响应模型.
- 使用 **FastAPI Dependencies** 处理鉴权 (`get_current_user`).
- **DynamoDB**: 使用 `boto3` 操作，PK 设计遵循 Serverless 最佳实践.
