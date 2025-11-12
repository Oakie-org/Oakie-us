# 搭搭岛接口预期（草案）

依据 `tpyrced_sj-warm.html` 移动端高保真稿（沙滩暖色版）整理。所有接口默认挂在 `/api/v1` 前缀下，除特别标注外均需 JWT Bearer 鉴权。

## 1. 按页面划分的能力范围

| 模拟页面 | 数据诉求 |
| --- | --- |
| 01 首页 | 平台总览、精选项目、登录/注册入口 |
| 02 发现项目 | 搜索、筛选、分页项目卡片、通知角标 |
| 03 项目详情 | 项目信息、发起人、技能/岗位、申请入口 |
| 04 发布项目 | 上传封面、选择品类/标签/城市/阶段、提交表单 |
| 05 找队友 | 可过滤的人才列表、约聊动作 |
| 06 个人主页 | 简介、技能、参与统计、关注关系、项目履历 |

## 2. API 约定

- 返回格式：列表接口统一携带分页信息
  ```json
  { "data": [...], "pagination": {"page":1,"page_size":20,"total":200} }
  ```
- 分页：默认 `page` + `page_size`，也可扩展 `cursor` 模式以支持无限滚动。
- 枚举（`project_stage`、`role_type`、`recruit_status` 等）通过 `/meta/*` 输出，确保筛选项与表单一致。
- 时间：全部使用 ISO-8601 UTC，前端自行本地化展示。
- 上传：`/uploads/sign` 下发签名 URL，前端直传对象存储，再在业务表单中引用 `asset_id`。
- 鉴权：注册走手机号 + OTP；除公共资源外的读写接口都要求 Bearer Token。

## 3. 认证与会话

| Method | Path | 说明 | 权限 |
| --- | --- | --- | --- |
| POST | `/auth/send-otp` | 下发手机验证码并返回限流信息 | Public |
| POST | `/auth/register` | 校验 OTP、创建账号、返回 Access/Refresh Token | Public |
| POST | `/auth/login` | 账号登录（密码/OTP），返回 Token | Public |
| POST | `/auth/token/refresh` | 使用 refresh token 换新 access token | Refresh 必填 |
| POST | `/auth/logout` | 注销，作废 refresh token 与缓存态 | Bearer |

## 4. 首页 / 发现所需数据

| Method | Path | 说明 | 备注 |
| --- | --- | --- | --- |
| GET | `/stats/overview` | 活跃项目、创造者、成功落地等 KPI | 可 CDN 缓存 |
| GET | `/projects/trending?limit=6` | 首页精选项目 | 精简卡片字段 |
| GET | `/projects` | 发现页数据源；支持 `keyword`、`category`、`city`、`stage`、`status`、`skills[]`、`remote_only`、`sort`、分页 | 未登录可访问，带登录态追加关系字段 |
| GET | `/projects/search/suggestions?q=` | 搜索自动补全 | Public |
| GET | `/tags/popular?type=project` | 快捷筛选标签（技术/设计/运营） | 建议长缓存 |

## 5. 项目详情与成员/申请

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/projects/{projectId}` | 详情页视图：封面、简介、阶段、城市、容量、关注/申请状态、发起人摘要 |
| GET | `/projects/{projectId}/positions` | 招募岗位（含状态、描述） |
| GET | `/projects/{projectId}/team` | 当前成员（角色、职责、加入时间） |
| POST | `/projects/{projectId}/applications` | 提交加入申请（`role_id`, `pitch`, `contact_handle`） |
| GET | `/projects/{projectId}/applications/me` | 查询本人在该项目的申请状态 |
| POST | `/projects/{projectId}/follow` | 关注项目 |
| DELETE | `/projects/{projectId}/follow` | 取消关注 |

## 6. 项目创建与管理

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/uploads/sign` | 获取封面上传签名与 `asset_id` |
| POST | `/projects` | 新建项目（标题、品类、简介、技能列表、团队规模、城市、阶段、封面） |
| PATCH | `/projects/{projectId}` | 发起人更新项目信息 |
| POST | `/projects/{projectId}/positions` | 新增招募岗位 |
| PATCH | `/positions/{positionId}` | 编辑/关闭岗位 |
| PATCH | `/projects/{projectId}/status` | 切换项目状态：`recruiting / in_progress / completed` |
| GET | `/projects/me` | 当前用户管理页（我的项目列表） |

## 7. 人才/组队

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/talent` | 找队友列表；支持 `role_type`、`skills[]`、`school`、`city`、`availability`、`experience_years`、分页 |
| GET | `/talent/{userId}` | 人才卡片详情（可组队状态、简介、技能） |
| POST | `/talent/{userId}/ping` | 发起约聊/邀约 |
| GET | `/talent/recommendations` | 给登录用户的推荐人选 |
| POST | `/projects/{projectId}/invites` | 项目方主动邀请人才 |

## 8. 个人主页与社交关系

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/users/{userId}` | 个人信息：头像、头衔、城市、年限、签名、统计 |
| GET | `/users/{userId}/skills` | 技能标签 |
| PATCH | `/users/me/skills` | 维护我的技能 |
| GET | `/users/{userId}/projects?role=member` | 参与项目列表 |
| POST | `/users/{userId}/follow` | 关注用户 |
| DELETE | `/users/{userId}/follow` | 取消关注 |
| PATCH | `/users/me` | 编辑简介、城市、可组队状态 |

## 9. 消息与通知

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/conversations` | 会话列表（消息 Tab / 通知图标） |
| POST | `/conversations` | 创建会话（约聊、项目邀请） |
| GET | `/conversations/{conversationId}/messages` | 拉取消息历史 |
| POST | `/conversations/{conversationId}/messages` | 发送文字/附件 |
| GET | `/notifications?types=project,application,follow` | 通知流 |
| POST | `/notifications/{notificationId}/read` | 单条已读 |
| POST | `/notifications/read-all` | 清空红点 |

## 10. 元数据与字典

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/meta/categories` | 项目品类（技术/设计/运营/其他） |
| GET | `/meta/skills` | 技能字典（支持前端搜索提示） |
| GET | `/meta/cities` | 城市列表 + 远程选项 |
| GET | `/meta/stages` | 项目阶段枚举 |
| GET | `/meta/roles` | 角色类型（工程/设计/运营等） |
| GET | `/meta/counters` | 其他配置（最大团队人数、经验分层） |

## 11. 示例载荷

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
    { "id": "pos_1", "title": "前端工程师", "status": "open", "description": "负责 Web / 移动端界面开发" },
    { "id": "pos_2", "title": "UI 设计师", "status": "open", "description": "负责视觉与交互设计" }
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

## 12. 后续步骤

1. 与前端确认字段稀疏化/分页约定，避免过度取数。
2. 优先上线登录与 `/projects`，因其驱动多数页面。
3. 提前交付 `/meta/*`，解锁前端筛选组件开发。
4. 随着消息/通知等新页面定稿，迭代扩充本规范。
