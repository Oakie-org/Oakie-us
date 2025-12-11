# Oakie 开发者指南 (Developer Guide)

本文档旨在帮助新加入的开发者快速搭建环境、理解架构并开始为 Oakie (原 DadaIsland) 项目贡献代码。

---

## 1. 架构总览 (Architecture Overview)

Oakie 采用现代化的 **AWS Serverless** 架构，旨在实现低运维成本、按量付费和高扩展性。

### 核心组件
*   **计算 (Compute)**: `AWS Lambda` (运行 Python FastAPI 应用)。
*   **入口 (Gateway)**: `Amazon API Gateway (HTTP API)`，负责路由分发和鉴权。
*   **数据库 (Database)**: `Amazon DynamoDB` (单表/多表 NoSQL 设计)。
*   **身份认证 (Identity)**: `AWS Cognito User Pool`，托管用户注册、登录、邮件验证。
*   **基础设施 (IaC)**: `AWS SAM (Serverless Application Model)`，用 YAML 定义所有云资源。

### 数据流 (Data Flow)
1.  **用户请求** -> **API Gateway** (检查 Header 里的 JWT Token)
2.  **API Gateway** -> **Lambda Function** (FastAPI 解析请求)
3.  **Lambda** -> **DynamoDB** (读写数据) -> **Lambda** -> **Response**

---

## 2. 环境准备 (Prerequisites)

开发本机推荐使用 macOS 或 Linux。Windows 用户建议使用 WSL2。

### 2.1 获取 AWS 访问密钥 (Access Keys)
你需要一个 AWS 账号来部署应用。

1.  登录 [AWS Console](https://console.aws.amazon.com/).
2.  点击右上角用户名 -> **Security credentials (安全凭证)**.
    然后增加一个用户-目前我已经有一个phz的了。把用户加到TheFounders组中（权限我已经配置好了）。
3.  找到 **Access keys** -> 点击 **Create access key**.
4.  **重要**: 下载 `.csv` 文件或立即复制 `Access Key ID` 和 `Secret Access Key`。**这是你唯一能看到 Secret 的机会。**

### 2.2 安装开发工具 (Tools)

请按顺序安装以下工具：

#### 1. Homebrew (macOS 包管理器)
如果你还没装 Brew：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. AWS CLI (命令行工具)
用于与 AWS 交互。
```bash
brew install awscli
```
**配置凭据**:
安装后，立即运行配置命令，并输入刚才获取的 Key：
```bash
aws configure
# AWS Access Key ID: [粘贴你的 Access Key]
# AWS Secret Access Key: [粘贴你的 Secret Key]
# Default region name: us-west-2 (或者 us-east-1)
# Default output format: json
```

#### 3. AWS SAM CLI (Serverless 构建工具)
这是我们开发的核心工具。
```bash
brew tap aws/tap
brew install aws-sam-cli
```
验证安装：
```bash
sam --version
```

#### 4. Python 3.11 (运行时)
AWS Lambda 推荐使用 Python 3.11。
```bash
brew install python@3.11
```

---

## 3. 快速开始 (Quick Start)

### 3.1 克隆与初始化
```bash
git clone <repo-url>
cd Dada_Island/serverless_backend

# 创建虚拟环境
python3.11 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3.2 本地开发 (Local Dev)
虽然 Serverless 强依赖云环境，但你可以本地运行 FastAPI 调试逻辑：
```bash
uvicorn app.main:app --reload
```
访问文档: `http://127.0.0.1:8000/docs`

### 3.3 部署到 AWS (Deploy)
当你修改了代码想推送到云端时：

**首次部署 (引导式)**:
```bash
sam build
sam deploy --guided
# 一路回车，但在 "Confirm changes before deploy" 选 y
```

**后续部署 (快捷)**:
```bash
sam build
sam deploy
```

**极速开发模式 (Hot Reload)**:
如果你在频繁修改代码，不想每次都等部署：
```bash
sam sync --stack-name oakie-stack --watch
```
这会实时同步你的代码到 AWS Lambda (秒级生效)。

---

## 4. 常见问题 (Troubleshooting)

### Q: `sam build` 失败，提示找不到 Python 3.11？
**A**: 确保你用 `brew install python@3.11` 安装了对应版本，并且它在你的 PATH 里。

### Q: 部署时提示 `User: arn:aws:iam::... is not authorized`？
**A**: 你的 AWS IAM 用户权限不足。对于个人开发，确保存储该 Access Key 的用户拥有 `AdministratorAccess` (仅限个人学习) 或至少包含 CloudFormation/Lambda/APIGateway/DynamoDB/Cognito 的权限。

### Q: 上传特别慢？
**A**:
1. 确保你运行了 `sam build` 而不仅仅是 `sam deploy`。
2. 检查 `requirements.txt` 里是否包含不必要的重型库 (如 boto3, pandas)。AWS Lambda 运行时已内置 boto3。

### Q: 怎么看线上日志？
**A**:
```bash
sam logs -n FastAPIFunction --stack-name oakie-stack --tail
```
或者去 AWS Console -> Lambda -> Monitor -> CloudWatch Logs。

---

> **Happy Coding!** 🌴
