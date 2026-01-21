#!/usr/bin/env python3
"""
Seed script to insert mock projects into Oakie-Projects DynamoDB table.
Projects are inserted with priority=10 to indicate they are showcase/featured projects.
Image fields are left empty as image storage is not yet implemented.
"""

import boto3
from datetime import datetime, timezone
from uuid import uuid4

# Connect to DynamoDB
dynamodb = boto3.resource("dynamodb", region_name="us-west-2")
table = dynamodb.Table("Oakie-Projects-v2")


def iso_now():
    return datetime.now(timezone.utc).isoformat()


# Mock projects data (more diverse, more realistic, closer to Oakie positioning)
MOCK_PROJECTS = [
    {
        "title": "DormSwap: Campus Micro-Marketplace",
        "subtitle": "帮同校学生把闲置物品“快速安全地交接”起来（像校内版闲鱼）。",
        "description": (
            "我们先从一个很小的场景做起：宿舍搬家季/毕业季的闲置交换。"
            "现阶段有 Figma 原型 + 简单的 React demo，准备做一次 2 周校内试点。"
            "需要：后端同学（FastAPI/Node 都可）、以及愿意跑一跑运营的同学（拉 50 个种子用户）。"
            "目标：试点期完成 200+ 物品发布、30+ 成交，并沉淀反诈骗/信用机制。"
        ),
        "tags": ["Marketplace", "Community", "Trust & Safety", "React", "Operations"],
        "status": "Recruiting",
        "category": "Web Development",
        "uni": "University of Washington",
        "city": "Seattle, WA",
        "current_members": 2,
        "max_members": 6,
        "likes": 47,
        "follows": 19,
    },
    {
        "title": "Rainy Day Map: Tokyo Umbrella Sharing",
        "subtitle": "雨天“借伞/还伞”小程序 + 校园/地铁站点合作方案。",
        "description": (
            "东京下雨天经常临时买伞很浪费，我们想做轻量共享：二维码借还 + 站点库存。"
            "目前做完需求访谈（20 人）和成本测算，下一步要做 MVP：用户端借还记录 + 站点端库存管理。"
            "需要：移动端/前端（React Native/Flutter/Next.js 任一）、以及会谈合作的 BD 同学。"
        ),
        "tags": ["Civic Tech", "Sustainability", "Mobile App", "MVP", "Japan"],
        "status": "Idea",
        "category": "Mobile Apps",
        "uni": "Waseda University",
        "city": "Tokyo, JP",
        "current_members": 1,
        "max_members": 5,
        "likes": 35,
        "follows": 22,
    },
    {
        "title": "LabNote Buddy",
        "subtitle": "把实验室散乱的记录变成“可追溯、可复现”的研究笔记工作流。",
        "description": (
            "很多实验室还是靠 Word/纸笔/微信碎片记录，复现很痛苦。"
            "我们想做一个插件式工作流：模板化实验记录 + 数据文件关联 + 导出可复现摘要。"
            "现阶段：Notion 模板 + 简单脚本自动归档（已在一个小组试用）。"
            "需要：对科研工作流有兴趣的同学（产品/研究）、以及会做集成（Notion/Google Drive/Git）的工程同学。"
        ),
        "tags": ["Research", "Productivity", "Reproducibility", "Notion", "Automation"],
        "status": "In Progress",
        "category": "AI/ML",
        "uni": "University of Toronto",
        "city": "Toronto, CA",
        "current_members": 3,
        "max_members": 7,
        "likes": 58,
        "follows": 31,
    },
    {
        "title": "QuietHours: Library Noise Signals",
        "subtitle": "图书馆“安静度”匿名上报，让找自习位不再踩雷。",
        "description": (
            "动机很简单：我每次去图书馆都像开盲盒。"
            "我们想做一个极简网页：地点 -> 当前安静/一般/吵 + 可选备注（比如‘有人开会’）。"
            "不做复杂社交，只把信息做准：反刷票、地理围栏、时间衰减。"
            "需要：做数据/反作弊的同学 + 会做 UI 的同学（尤其是信息设计）。"
        ),
        "tags": ["Campus Life", "Data", "Trust", "UI/UX", "Web App"],
        "status": "Recruiting",
        "category": "Web Development",
        "uni": "University of Michigan",
        "city": "Ann Arbor, MI",
        "current_members": 2,
        "max_members": 5,
        "likes": 61,
        "follows": 28,
    },
    {
        "title": "Open Meals: Community Fridge Tracker",
        "subtitle": "公益冰箱库存/保质期记录，让食物更快到需要的人手里。",
        "description": (
            "社区公益冰箱经常出现：某些点位爆满、某些点位空空，捐赠者也不知道放哪更有效。"
            "我们想做一个开源工具：点位地图 + 简单库存类别 + 过期提醒（站点志愿者端）。"
            "现阶段：已联系 1 个社区组织愿意试用；需要把原型做成可部署的开源项目。"
            "需要：后端/DevOps（部署、权限）、以及愿意做田野调研/访谈的同学。"
        ),
        "tags": [
            "Social Impact",
            "Open Source",
            "Community",
            "Mapping",
            "Field Research",
        ],
        "status": "In Progress",
        "category": "Startup",
        "uni": "UCLA",
        "city": "Los Angeles, CA",
        "current_members": 4,
        "max_members": 8,
        "likes": 74,
        "follows": 40,
    },
    {
        "title": "Subtitles for All",
        "subtitle": "给校园讲座/学生短片做多语言字幕与无障碍校对（英/中/日）。",
        "description": (
            "我们是几个做视频的人，发现字幕质量决定传播效果，也影响听障同学的获取。"
            "想组织一个小型“字幕协作队”：统一风格指南、术语表、以及质量检查流程。"
            "会做：字幕时间轴/翻译/校对/术语维护；也欢迎做一个小工具把流程自动化（例如批量 QC）。"
            "目标：本学期完成 30+ 条内容字幕，并公开一个开源 style guide。"
        ),
        "tags": ["Media", "Accessibility", "Translation", "Community", "Japanese"],
        "status": "Recruiting",
        "category": "Design",
        "uni": "NYU",
        "city": "New York, NY",
        "current_members": 5,
        "max_members": 12,
        "likes": 68,
        "follows": 55,
    },
    {
        "title": "Street Poster Archive",
        "subtitle": "把城市街头海报/传单做成可检索的设计档案（摄影 + 元数据）。",
        "description": (
            "灵感来自：每次路过很棒的海报，过两天就没了。"
            "我们想做一个“设计标本库”：拍摄 -> 标注（地点/字体/色彩/主题）-> 搜索与策展。"
            "现阶段：已经收集 200+ 张图片，缺一个清晰的信息架构和展示站点。"
            "需要：信息设计/视觉策展、以及能把图库做成网站的工程同学。"
        ),
        "tags": ["Design Research", "Photography", "Archive", "Typography", "Web"],
        "status": "In Progress",
        "category": "Design",
        "uni": "RISD",
        "city": "Providence, RI",
        "current_members": 2,
        "max_members": 6,
        "likes": 52,
        "follows": 26,
    },
    {
        "title": "KitchenTimer: Shared Cooking Scheduler",
        "subtitle": "合租/宿舍公共厨房预约 + 清洁责任分配（轻量，不做复杂社交）。",
        "description": (
            "公共厨房最常见的问题：占用、插队、没人清洁。我们想做一个很小的工具解决摩擦。"
            "功能只做三件事：预约、提醒、清洁轮换。"
            "现阶段：Google Form + 手动排班跑过 1 周，确实能减少冲突；现在想产品化。"
            "需要：移动端开发 + 愿意做用户访谈的同学。"
        ),
        "tags": ["Living", "Scheduling", "Mobile", "Behavior Design", "MVP"],
        "status": "Recruiting",
        "category": "Mobile Apps",
        "uni": "Duke University",
        "city": "Durham, NC",
        "current_members": 3,
        "max_members": 6,
        "likes": 43,
        "follows": 17,
    },
    {
        "title": "Internship OS: Peer Interview Library",
        "subtitle": "学生互助整理面试题与复盘，重点是“可验证贡献”而不是刷题墙。",
        "description": (
            "我们想把面试复盘做成一个“贡献驱动”的资料库：每条内容都有来源、适用岗位、以及改进建议。"
            "贡献可以被记录（谁整理、谁校对、谁补充案例），未来能生成个人贡献档案。"
            "现阶段：Notion + Git 仓库混合维护，正在迁移到一个更友好的 Web 界面。"
            "需要：全栈（Next.js/DB）、以及愿意做内容编辑/规范制定的同学。"
        ),
        "tags": [
            "Career",
            "Knowledge Base",
            "Open Contribution",
            "Full-Stack",
            "Community",
        ],
        "status": "Recruiting",
        "category": "Web Development",
        "uni": "Georgia Tech",
        "city": "Atlanta, GA",
        "current_members": 4,
        "max_members": 9,
        "likes": 81,
        "follows": 60,
    },
    {
        "title": "ClubFinance: Transparent Budget Toolkit",
        "subtitle": "学生社团预算透明化：报销流程、公开账本、年度报告一键生成。",
        "description": (
            "很多社团会因为财务不透明产生信任问题。我们想做一个工具包："
            "收支录入（模板）+ 审批流（轻量）+ 自动生成图表与报告。"
            "现阶段：Excel 模板 + Google Sheets 脚本已可用，但很难规模化给不同社团复用。"
            "需要：会做产品化（权限/多社团隔离）的工程同学 + 有社团财务经验的 PM。"
        ),
        "tags": [
            "FinTech",
            "Governance",
            "Transparency",
            "Automation",
            "Student Clubs",
        ],
        "status": "In Progress",
        "category": "Finance",
        "uni": "University of Illinois Urbana-Champaign",
        "city": "Champaign, IL",
        "current_members": 3,
        "max_members": 7,
        "likes": 66,
        "follows": 33,
    },
    {
        "title": "Micro Museum: 60-Second Creator Stories",
        "subtitle": "每个创作者一个 60 秒“作品背后”短片：更像作品集，而不是 vlog。",
        "description": (
            "我们想做一个很克制的内容项目：每条 60 秒，固定结构（作品 -> 决策 -> 失败 -> 迭代）。"
            "目标是帮创作者建立‘可讲述的贡献记录’，也便于招募队友/合作者。"
            "现阶段：已拍 6 条样片，正在摸索剪辑模板与采访提纲。"
            "需要：剪辑/拍摄、主持采访、以及会做内容分发的同学。"
        ),
        "tags": ["Content", "Creator", "Storytelling", "Portfolio", "Video"],
        "status": "In Progress",
        "category": "Design",
        "uni": "USC",
        "city": "Los Angeles, CA",
        "current_members": 4,
        "max_members": 10,
        "likes": 59,
        "follows": 48,
    },
    {
        "title": "BreatheLight: Desk Stress Indicator",
        "subtitle": "一个很小的桌面硬件：呼吸灯 + 轻触反馈，提醒你别憋太久。",
        "description": (
            "我们不做‘医疗’，只做‘习惯提示’：长时间专注时给一个柔和的呼吸节奏提示。"
            "现阶段：Arduino 原型能跑，外壳还很丑；需要把电路和结构做得更可靠。"
            "需要：工业设计/结构设计 + 会做简单 PCB 的同学。"
        ),
        "tags": ["Hardware", "Wellbeing", "Industrial Design", "PCB", "Prototyping"],
        "status": "Recruiting",
        "category": "Hardware/IoT",
        "uni": "MIT",
        "city": "Cambridge, MA",
        "current_members": 2,
        "max_members": 5,
        "likes": 38,
        "follows": 21,
    },
]


def seed_projects():
    now = iso_now()

    for project_data in MOCK_PROJECTS:
        project_id = str(uuid4())

        item = {
            "PK": f"PROJECT#{project_id}",
            "SK": "METADATA",
            "type": "PROJECT",
            "id": project_id,
            "title": project_data["title"],
            "subtitle": project_data["subtitle"],
            "description": project_data["description"],
            "tags": project_data["tags"],
            "status": project_data["status"],
            "category": project_data["category"],
            "uni": project_data["uni"],
            "city": project_data["city"],
            "current_members": project_data["current_members"],
            "max_members": project_data["max_members"],
            "likes": project_data["likes"],
            "follows": project_data["follows"],
            # Image fields left empty - storage not yet implemented
            "image": "",
            "image_url": None,
            # Visibility and ownership
            "visibility": "public",
            "owner_id": None,  # No owner for showcase projects
            # Priority 10 indicates showcase/featured project
            "priority": 10,
            # Timestamps
            "created_at": now,
            "updated_at": now,
            # GSI Keys for sorting: {priority}#{created_at}#{id}
            # Priority defaults to 10 for showcase projects
            "gsi1_sk": f"0010#{now}#{project_id}",
        }

        table.put_item(Item=item)
        print(f"✓ Inserted: {project_data['title']}")


if __name__ == "__main__":
    print("Seeding Oakie-Projects table with mock data...")
    seed_projects()
    print("\n✅ Done! All mock projects inserted with priority=10")
