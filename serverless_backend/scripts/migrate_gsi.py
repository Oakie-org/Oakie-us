#!/usr/bin/env python3
"""
Migration script to backfill gsi1_sk for existing projects.
gsi1_sk format: {priority:04d}#{created_at}#{id}
"""

import boto3
from botocore.exceptions import ClientError

# Connect to DynamoDB
# Note: Ensure AWS_PROFILE or credentials are set if running against cloud
dynamodb = boto3.resource("dynamodb", region_name="us-west-2")
table = dynamodb.Table("Oakie-Projects-v2")


def migrate():
    print("Starting migration of Oakie-Projects table...")

    try:
        # Scan for all projects
        # In a real large table, you'd use a paginated scan or Segmented Scan
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("type").eq("PROJECT")
        )
        items = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            response = table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr("type").eq("PROJECT"),
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        print(f"Found {len(items)} projects to migrate.")

        updated_count = 0
        for item in items:
            project_id = item["id"]
            priority = int(item.get("priority", 0))
            created_at = item.get("created_at", "")

            # Construct GSI1 SK
            # Format: {priority:04d}#{created_at}#{id}
            # Example: 0010#2024-01-21T...#uuid
            gsi1_sk = f"{priority:04d}#{created_at}#{project_id}"

            # Check if update is needed
            if item.get("gsi1_sk") == gsi1_sk:
                continue

            try:
                table.update_item(
                    Key={"PK": item["PK"], "SK": item["SK"]},
                    UpdateExpression="SET gsi1_sk = :g, #t = :t",
                    ExpressionAttributeNames={
                        "#t": "type"  # Ensure type is set correctly for GSI PK
                    },
                    ExpressionAttributeValues={":g": gsi1_sk, ":t": "PROJECT"},
                )
                updated_count += 1
                if updated_count % 10 == 0:
                    print(f"Updated {updated_count} items...")
            except ClientError as e:
                print(f"Failed to update project {project_id}: {e}")

        print(f"Migration complete. Updated {updated_count} items.")

    except Exception as e:
        print(f"Migration failed: {e}")


if __name__ == "__main__":
    migrate()
