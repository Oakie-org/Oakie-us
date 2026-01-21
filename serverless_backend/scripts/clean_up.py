#!/usr/bin/env python3
import argparse
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Attr

REGION_DEFAULT = "us-west-2"
TABLE_DEFAULT = "Oakie-Projects-v2"


def parse_iso(dt_str: str):
    # created_at is stored like "2026-01-21T12:34:56.789+00:00"
    # datetime.fromisoformat handles offsets like +00:00
    try:
        return datetime.fromisoformat(dt_str)
    except Exception:
        # fallback: if format is weird, compare as string later
        return None


def scan_showcase_items(table):
    """
    Get candidate items for showcase seeds:
    - priority == 10
    - SK == "METADATA"
    - type == "PROJECT"
    Then we further check owner_id is None/missing in Python (NULL in DynamoDB maps to None here).
    """
    items = []
    last_key = None

    filter_expr = Attr("priority").eq(10) & Attr("SK").eq("METADATA")

    projection = "PK, SK, title, created_at, owner_id, priority"

    while True:
        kwargs = {
            "FilterExpression": filter_expr,
            "ProjectionExpression": projection,
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key

        resp = table.scan(**kwargs)
        batch = resp.get("Items", [])
        items.extend(batch)

        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    # Only keep items that look like seed showcase (no owner)
    # DynamoDB NULL -> Python None; also allow missing owner_id
    showcase = []
    for it in items:
        if ("owner_id" not in it) or (it.get("owner_id") is None):
            # must have title + created_at to dedupe safely
            if it.get("title") and it.get("created_at"):
                showcase.append(it)

    return showcase


def dedupe_by_title_keep_latest(items):
    """
    Returns (keep_map, delete_list)
    keep_map: title -> kept item
    delete_list: list of items (PK, SK) to delete
    """
    by_title = {}
    for it in items:
        title = it["title"]
        by_title.setdefault(title, []).append(it)

    keep = {}
    to_delete = []

    for title, group in by_title.items():
        if len(group) == 1:
            keep[title] = group[0]
            continue

        # sort by created_at parsed datetime; fallback to string compare if parsing fails
        def sort_key(x):
            dt = parse_iso(x.get("created_at", ""))
            if dt is not None:
                return (1, dt)
            return (0, x.get("created_at", ""))

        group_sorted = sorted(group, key=sort_key, reverse=True)
        kept = group_sorted[0]
        keep[title] = kept

        for dup in group_sorted[1:]:
            to_delete.append(
                {
                    "PK": dup["PK"],
                    "SK": dup["SK"],
                    "title": title,
                    "created_at": dup["created_at"],
                }
            )

    return keep, to_delete


def batch_delete(table, delete_keys):
    with table.batch_writer() as batch:
        for k in delete_keys:
            batch.delete_item(Key={"PK": k["PK"], "SK": k["SK"]})


def main():
    parser = argparse.ArgumentParser(
        description="Dedupe Oakie showcase projects by title; keep latest created_at."
    )
    parser.add_argument("--table", default=TABLE_DEFAULT, help="DynamoDB table name")
    parser.add_argument("--region", default=REGION_DEFAULT, help="AWS region")
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Actually delete items (otherwise dry-run)",
    )
    parser.add_argument(
        "--limit-print",
        type=int,
        default=20,
        help="Max number of deletions to print as preview",
    )
    args = parser.parse_args()

    dynamodb = boto3.resource("dynamodb", region_name=args.region)
    table = dynamodb.Table(args.table)

    print(
        f"Scanning table={args.table} region={args.region} for showcase candidates..."
    )
    items = scan_showcase_items(table)
    print(
        f"Found {len(items)} showcase candidate items (priority=10, PROJECT/METADATA, no owner_id)."
    )

    keep, to_delete = dedupe_by_title_keep_latest(items)

    print(f"Unique titles: {len(keep)}")
    print(f"Items to delete (duplicates): {len(to_delete)}")

    if len(to_delete) == 0:
        print("✅ No duplicates found. Nothing to delete.")
        return

    # Preview
    print("\nPreview of deletions (up to limit):")
    for i, k in enumerate(to_delete[: args.limit_print]):
        print(
            f"  - DELETE title='{k['title']}' created_at={k['created_at']} PK={k['PK']}"
        )

    if not args.commit:
        print("\nDRY-RUN ONLY. No deletions performed.")
        print("To actually delete, re-run with: --commit")
        return

    print("\nDeleting duplicates...")
    batch_delete(table, to_delete)
    print("✅ Done. Duplicates deleted, latest per title kept.")


if __name__ == "__main__":
    main()
