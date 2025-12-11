# 🌴 搭搭岛 · DadaIsland

> 找到同路人，一起创造未来。  
> *Find your people. Build your world.*

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

| 模块 | 功能描述 |
|------|-----------|
| 🧑‍🤝‍🧑 **跨界人才匹配** | 连接程序员、金融分析师、自媒体人、策划师等多元角色 |
| 🧩 **项目协作空间** | 项目主页、进度记录、任务分配、版本管理 |
| 🧾 **项目认证记录** | 自动生成项目参与记录与贡献证明 |
| 💬 **灵感与合伙人** | 讨论创意、招募联合创始人(Co-founder)、路演展示 |
| 🚀 **创业孵化通道** | 对接投资人、创业导师与孵化器资源（规划中） |

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

## 🌟 技术栈 | Tech Stack (New Serverless Architecture)

本项目已从传统的 Java/Spring Boot 架构迁移至 **AWS Serverless** 架构，以实现更高的扩展性和成本效益。

| 类别 | 技术 | 说明 |
|------|------|------|
| **Backend** | Python · FastAPI | 高性能异步 Web 框架，运行于 AWS Lambda |
| **Database** | Amazon DynamoDB | Serverless NoSQL 数据库，毫秒级响应 |
| **Compute** | AWS Lambda | 按需运行，自动扩缩容 |
| **API Gateway** | Amazon API Gateway | HTTP API 入口，负责路由和限流 |
| **Auth** | JWT + Custom Authorizer | 基于 Token 的无状态认证 |
| **Infra** | AWS SAM / Serverless Framework | 基础设施即代码 (IaC) |

> **注意**: 旧的 Java/Spring Boot 实现已归档至 `archived_java_impl/` 目录。

---

## 📂 项目结构 | Project Structure

```text
Dada_Island/
├── serverless_backend/       # Python/FastAPI 源代码
│   ├── app/
│   │   ├── api/              # API 路由与控制器
│   │   ├── core/             # 配置与安全工具
│   │   ├── db/               # 数据库访问层 (DynamoDB)
│   │   ├── models/           # Pydantic 数据模型
│   │   └── main.py           # 应用入口
│   ├── tests/                # 单元测试
│   └── requirements.txt      # Python 依赖
├── serverless_analysis_zh.md # 架构分析报告 (中文)
├── progress_report.md        # 迁移进度报告
├── archived_java_impl/       # [归档] 旧 Java 实现
└── docs/                     # 项目文档
```

---

## 🚀 快速开始 | Getting Started

### 前置要求
- Python 3.11+
- AWS 账号 (用于部署，本地开发可选)

### 本地开发

1.  **进入后端目录**:
    ```bash
    cd serverless_backend
    ```

2.  **创建并激活虚拟环境**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # macOS/Linux
    # venv\Scripts\activate   # Windows
    ```

3.  **安装依赖**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **运行本地服务器**:
    ```bash
    uvicorn app.main:app --reload
    ```
    访问文档: `http://127.0.0.1:8000/docs`

5.  **运行测试**:
    ```bash
    PYTHONPATH=. pytest
    ```

---

## 📚 文档 | Documentation

- [Serverless 架构分析报告](./serverless_analysis_zh.md)
- [迁移进度报告](./progress_report.md)
- [API 规范](./docs/api-spec.md)

---

## 📅 规划与进度 | Planning & Timeline

> 基于周迭代的开发计划 (Ref: `docs/project-timeline.md`)

- [x] **Week 0: 基础设施与认证 (Foundation & Auth)**
    - [x] Serverless 架构迁移 (Lambda + FastAPI).
    - [x] 集成 AWS Cognito (User Pool, Hosted UI).
    - [x] 实现 PostConfirmation Trigger (同步用户画像到 DynamoDB).
    - [x] 配置 API Gateway JWT Authorizer.
    - [x] 实现 `/auth/me` 端点.

- [ ] **Week 0: 核心业务 MVP**
    - [ ] Project API (`GET /projects`, `POST /projects`).
    - [ ] User Profile API (`GET /users/{id}`, `PATCH /users/me`).
    - [ ] S3 图片上传签名 (`/uploads/sign`).

- [ ] **Week 1: 申请与互动 (Interaction)**
    - [ ] 项目申请流程 (`Apply`, `Approve`, `Reject`).
    - [ ] 人才库目录 (`Talent Directory`).

- [ ] **Week 2: 社交与消息 (Social)**
    - [ ] 站内信/私聊 (`Conversations`).
    - [ ] 活动通知流 (`Activity Feed`).

- [ ] **Week 3: 优化与扩展 (Scale)**
    - [ ] 搜索优化 (Search).
    - [ ] 缓存机制 (Caching).

---

## 🤝 贡献 | Contributing

欢迎提交 Issue 和 Pull Request！

---

> “搭搭岛不是孤岛，而是一座由梦想和协作搭建的岛屿。”
