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
table = dynamodb.Table("Oakie-Projects")


def iso_now():
    return datetime.now(timezone.utc).isoformat()


# Mock projects data (from frontend mockProjects.ts)
MOCK_PROJECTS = [
    {
        "title": "AlphaSeeker Quant Fund",
        "subtitle": "Student-led high-frequency trading team focusing on crypto arbitrage.",
        "description": "We are building a lean quantitative trading team to test market neutral strategies on decentralized exchanges. We use Python for backtesting and Rust for execution. Our goal is to deploy 3 profitable strategies by the end of the semester.",
        "tags": ["Finance", "Quantitative Trading", "Python", "Crypto"],
        "status": "Recruiting",
        "category": "Finance",
        "uni": "Columbia University",
        "city": "New York, NY",
        "current_members": 3,
        "max_members": 5,
        "likes": 128,
        "follows": 42,
    },
    {
        "title": "Neon Tokyo: Cyberpunk Short Film",
        "subtitle": "An indie short film project mixing 3D animation and live action.",
        "description": "Looking for video editors, VFX artists (Blender/Maya), and creative directors for a 15-minute Cyberpunk narrative set in 2088. The story follows a rogue android finding its soul in a rain-drenched metropolis.",
        "tags": ["Film & Media", "VFX", "Blender", "Storytelling"],
        "status": "Idea",
        "category": "Design",
        "uni": "NYU",
        "city": "New York, NY",
        "current_members": 2,
        "max_members": 8,
        "likes": 85,
        "follows": 30,
    },
    {
        "title": "Campus Eats Delivery",
        "subtitle": "Efficient food delivery service exclusively for dorms.",
        "description": 'A logistics startup solving the "last 100 meters" problem of food delivery in secured campus buildings. We need an Operations guy and a Mobile Dev to streamline the runner app.',
        "tags": ["Startup", "Operations", "Mobile App", "Business"],
        "status": "In Progress",
        "category": "Mobile Apps",
        "uni": "Duke University",
        "city": "Durham, NC",
        "current_members": 6,
        "max_members": 10,
        "likes": 210,
        "follows": 89,
    },
    {
        "title": "Generative Art NFT Collection",
        "subtitle": "Algorithmically generated art exploring nature patterns.",
        "description": "Collaborating on a generative art series using p5.js and smart contracts. We aim to launch on Ethereum next quarter. Inspired by Tyler Hobbs and Fidenza.",
        "tags": ["Web3", "Generative Art", "JavaScript", "Design"],
        "status": "Recruiting",
        "category": "Web Development",
        "uni": "RISD",
        "city": "Providence, RI",
        "current_members": 1,
        "max_members": 3,
        "likes": 56,
        "follows": 12,
    },
    {
        "title": "Smart Dorm AI Mirror",
        "subtitle": "IoT magic mirror that organizes your day and outfits.",
        "description": "Building a hardware prototype for a smart mirror that integrates with Notion and Apple Calendar. It suggests outfits based on weather and schedule. Need electrical engineers.",
        "tags": ["IoT", "Hardware", "AI/ML", "Product Design"],
        "status": "Recruiting",
        "category": "Hardware/IoT",
        "uni": "MIT",
        "city": "Cambridge, MA",
        "current_members": 2,
        "max_members": 4,
        "likes": 92,
        "follows": 67,
    },
    {
        "title": "StudyBuddy AI 2.0",
        "subtitle": "The best LLM wrapper for reviewing lecture notes.",
        "description": "Updating our popular StudyBuddy app with the latest Claude 3.5 Sonnet API for better reasoning. We have 500 active users and are looking to scale.",
        "tags": ["AI/ML", "Education", "LLM", "React"],
        "status": "Completed",
        "category": "AI/ML",
        "uni": "Stanford University",
        "city": "Palo Alto, CA",
        "current_members": 4,
        "max_members": 4,
        "likes": 312,
        "follows": 156,
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
        }

        table.put_item(Item=item)
        print(f"✓ Inserted: {project_data['title']}")


if __name__ == "__main__":
    print("Seeding Oakie-Projects table with mock data...")
    seed_projects()
    print("\n✅ Done! All mock projects inserted with priority=10")
