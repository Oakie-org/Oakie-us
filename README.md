# 🌴 搭搭岛 · DadaIsland

> 找到同路人，一起创造未来。
> _Find your people. Build your world._

---

## 🧭 项目简介 | Introduction

**搭搭岛（DadaIsland）** 是一个让志同道合的学生和年轻创作者相遇、组队、共创事业的平台。
我们希望帮助那些：

- 想要在简历上展示真实、有含金量项目经历的学生；
- 想做项目、却苦于找不到合适队友的人；
- **想寻找合伙人、从零开始共同创业的梦想家。**

在这里，你可以：

- 🌱 **发布各类创新项目**：不限于互联网开发，更涵盖**金融量化、自媒体运营、活动策划、艺术创作**等多元领域；
- 🤝 **寻找志同道合的伙伴**：按学校、城市、技能（如编程、建模、文案、设计）精准匹配；
- 💬 **深度协作与孵化**：从灵感碰撞到项目落地，甚至注册公司、共同创业；
- 🧾 **沉淀真实经历**：获得可验证的项目记录与贡献证明，为升学、求职或融资背书。

> “搭搭岛不是孤岛，而是一座由梦想和协作搭建的岛屿。”

---

## 🚀 项目愿景 | Vision

> **从一次项目合作，到一生的创业伙伴。**

在校园和初入社会时，我们常面临：

- 📚 有绝佳的**量化策略**，却找不到会写代码的队友；
- 💡 有爆火的**短视频脚本**，却缺乏懂拍摄剪辑的搭档；
- � 有改变世界的**创业点子**，却孤军奋战，难以落地。

**搭搭岛** 致力于改变这一切。
我们不仅是一个组队工具，更是一个**创业孵化器**。通过连接不同背景的人才（技术、金融、传媒、设计），我们希望成为：

> 🎯 **“下一代青年创造者与创业者的黄埔军校”。**

---

## 🛠️ 核心功能 | Core Features

| 模块                | 功能描述                                           |
| ------------------- | -------------------------------------------------- |
| 🧑‍🤝‍🧑 **跨界人才匹配** | 连接程序员、金融分析师、自媒体人、策划师等多元角色 |
| 🧩 **项目协作空间** | 项目主页、进度记录、任务分配、版本管理             |
| 🧾 **项目认证记录** | 自动生成项目参与记录与贡献证明                     |
| 💬 **灵感与合伙人** | 讨论创意、招募联合创始人(Co-founder)、路演展示     |
| 🚀 **创业孵化通道** | 对接投资人、创业导师与孵化器资源（规划中）         |

---

## 🧑‍💻 适合人群 | For Whom

- **技术极客** 👩‍💻 —— 全栈开发、AI 算法、硬件工程师
- **金融/商科生** 📊 —— 量化交易、商业分析、市场调研
- **内容创作者** 🎥 —— 自媒体运营、短视频编导、文案策划
- **设计师/艺术家** 🎨 —— UI/UX 设计、插画绘制、IP 打造
- **创业梦想家** 🚀 —— 寻找互补技能的联合创始人

> 不论你来自哪所学校，学什么专业，
> 在 **搭搭岛**，都能找到与你频率相同的伙伴，一起搞大事。

---

## 🌟 技术栈 | Tech Stack

| 类别         | 技术                                           | 说明                                        |
| ------------ | ---------------------------------------------- | ------------------------------------------- |
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS v4 | 单页应用，TanStack Query 管理服务端状态     |
| **Backend**  | Python 3.11 · FastAPI · Mangum                 | 单个 Lambda 承载全部路由                    |
| **Database** | Amazon DynamoDB                                | 单表设计 + 2 个 GSI，事务维护计数器         |
| **Auth**     | Amazon Cognito（JWT）                          | API Gateway JWT Authorizer + 应用内二次校验 |
| **Storage**  | Amazon S3                                      | 浏览器直传（Presigned POST）                |
| **Infra**    | AWS SAM                                        | `serverless_backend/template.yaml`          |

> 旧的 Java/Spring Boot 实现已归档至 `archived_java_impl/`。

---

## 🚀 快速开始 | Getting Started

**本地开发不需要 AWS 账号。** 后端会启动一个内存版的 DynamoDB/S3 模拟器，并内置演示数据和本地登录。

### 前置要求

- Python 3.11+
- Node.js 20+

### 一键安装与启动

```bash
./scripts/setup-dev.sh   # 创建后端 venv、安装前后端依赖
./scripts/dev.sh         # 同时启动后端 (:8000) 和前端 (:5173)
```

打开 <http://localhost:5173>，在登录页点击 **Fill in the demo account** 即可用演示账号登录。
演示数据保存在内存中，后端重启后会重置。

### 分别启动

```bash
# 后端：API http://127.0.0.1:8000/docs
serverless_backend/venv/bin/python serverless_backend/scripts/dev_server.py

# 前端：http://localhost:5173（/api 自动代理到后端）
cd frontend && npm run dev
```

### 检查

```bash
serverless_backend/venv/bin/python -m pytest          # 后端测试（仓库根目录运行）
serverless_backend/venv/bin/python -m ruff check .    # Python 规范
cd frontend && npm run lint && npm run build          # 前端规范与构建
```

### 连接真实 AWS

复制 `frontend/.env.example` 为 `frontend/.env`，填入 SAM 部署输出的 API 地址与 Cognito 配置，并设置 `VITE_AUTH_MODE=cognito`。
部署前请先阅读 [`docs/architecture.md`](./docs/architecture.md) 的「Deploying to AWS」一节（新栈名为 `oakie-v2`，旧表数据不会自动迁移）。

---

## 📚 文档 | Documentation

- [架构说明](./docs/architecture.md)：关键决策、分层、单表数据模型、鉴权、部署注意事项
- [设计系统](./docs/design-system.md)：配色、字体、交互规范
- [AI 协作规则](./AGENTS.md)：命令、约定、完成标准（`CLAUDE.md` 直接引用它）

---

## 📅 规划与进度 | Planning & Timeline

- [x] **基础设施与认证**：Lambda + FastAPI、Cognito、PostConfirmation 同步用户、JWT 校验、本地开发模式
- [x] **核心业务**：项目发布 / 编辑 / 浏览 / 搜索筛选、个人主页与资料编辑、S3 图片上传
- [x] **申请与互动**：申请 / 通过 / 拒绝 / 撤回、团队人数上限、人才库目录
- [x] **社交与消息**：私信、通知、关注用户、点赞与关注项目
- [x] **项目协作空间**：项目动态时间线、任务看板与分配
- [x] **项目认证记录**：每位成员在每个项目的可验证贡献记录（`/verify/<code>`）
- [ ] **扩展**：EventBridge 异步通知、WebSocket 实时消息、独立搜索服务
- [ ] **创业孵化通道**：对接投资人、导师与孵化器（规划中）
- [ ] **运营工具**：邮件通知、内容审核、管理后台
- [ ] **重新部署到 AWS**：新栈首次部署与旧数据迁移

---

## 🤝 贡献 | Contributing

欢迎提交 Issue 和 Pull Request！

---

> “搭搭岛不是孤岛，而是一座由梦想和协作搭建的岛屿。”
