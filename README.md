# 🌴 搭搭岛 · DadaIsland

> 找到同路人，一起创造未来。  
> *Find your people. Build your world.*

---

## 🧭 项目简介 | Introduction

**搭搭岛（DadaIsland）** 是一个让志同道合的学生和年轻创作者相遇、组队、共创项目的平台。  
我们希望帮助那些：
- 想要在简历上展示真实、有含金量项目经历的学生；
- 想做项目、却苦于找不到合适队友的人；
- 想创业、想实现想法的年轻人。

在这里，你可以：
- 🌱 发布互联网项目（从模仿到原创、从练习到创业）；
- 🤝 寻找志同道合的伙伴（可按学校、城市、技术方向匹配）；
- 💬 一起协作、开发、分享、上线；
- 🧾 获得真实的项目记录与贡献证明，让简历经历更具可信度。

> “搭搭岛不是孤岛，而是一座由梦想和协作搭建的岛屿。”

---

## 🚀 项目愿景 | Vision

> 让每个学生，都能拥有一段真实可验证的项目经历。

在学校里，我们常常遇到这样的困境：
- 📚 课程项目过时，与产业脱节；
- 🧍‍♂️ 独立开发难度过高；
- 😩 找不到能一起坚持下去的伙伴。

**搭搭岛** 致力于改变这一切。  
通过连接创意与人才，记录贡献与成长，我们希望成为：
> 🎯 “下一代学生与青年开发者的协作基地”。

---

## 🛠️ 核心功能 | Core Features

| 模块 | 功能描述 |
|------|-----------|
| 🧑‍🤝‍🧑 **用户匹配系统** | 按城市、学校、技能标签推荐合适队友 |
| 🧩 **项目协作空间** | 项目主页、进度记录、任务分配、版本管理 |
| 🧾 **项目认证记录** | 自动生成项目参与记录与贡献证明 |
| 💬 **灵感与讨论区** | 讨论创意、组队招募、项目展示 |
| 🚀 **创业孵化区（规划中）** | 支持创新项目申请孵化与融资通道 |

---

## 🧑‍💻 适合人群 | For Whom

- 学生开发者 👩‍💻 —— 想用真实项目丰富简历  
- 设计师 🎨 —— 想参与互联网级产品设计  
- 创业者 🚀 —— 想找到有热情的队友共创  
- 技术爱好者 🧠 —— 想以项目为驱动持续成长  

> 不论你来自哪所学校，学什么专业，  
> 在 **搭搭岛**，都能找到与你频率相同的伙伴。

---

## 🌟 技术栈 | Tech Stack

| 类别 | 技术 |
|------|------|
| Backend | Java · Spring Boot · MySQL |
| Cache | Redis (planned) |
| Frontend | React / Vue (待定) |
| Message Queue | RocketMQ (future async pipelines) |
| Auth | Spring Security + JWT |
| Infra | Docker · Docker Compose |
| Collaboration | Git · RESTful API · CI/CD |

### Redis vs. RocketMQ — Why Redis First?

- Redis gives immediate wins for current priorities: caching hot project/user data, storing recommendation sets, rate limiting login/OTP flows, and tracking realtime counters without hammering MySQL.
- RocketMQ shines once we need decoupled, high-volume domain events (e.g., contribution approvals broadcasting to multiple consumers), but operating the outbox plus MQ introduces heavier complexity than we can justify today.
- We still plan to bring RocketMQ online for durable event pipelines; adopting Redis sooner keeps login and discovery responsive while the core feature set matures.

> TL;DR: adopt Redis first for latency/caching gains; add RocketMQ later when asynchronous workflows become unavoidable.

---

## 🧩 项目结构 | Project Structure
