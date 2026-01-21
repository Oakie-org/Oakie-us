import requests
import os

BASE_URL = os.environ.get("API_URL", "http://localhost:8000/api/v1")


def verify_pagination():
    print(f"Testing pagination against {BASE_URL}...")

    # 1. Fetch first page
    print("\n--- Page 1 (size=15) ---")
    try:
        r1 = requests.get(f"{BASE_URL}/projects/cursor", params={"page_size": 15})
        r1.raise_for_status()
        data1 = r1.json()
        items1 = data1["items"]
        next_cursor = data1["next_cursor"]
        has_more = data1["has_more"]

        print(f"Items returned: {len(items1)}")
        print(f"Next cursor: {next_cursor}")
        print(f"Has more: {has_more}")

        ids1 = [p["id"] for p in items1]
        print(f"IDs: {ids1}")

        if not next_cursor:
            print("No next cursor returned. Cannot test page 2.")
            return

        # 2. Fetch second page
        print("\n--- Page 2 (size=15) ---")
        r2 = requests.get(
            f"{BASE_URL}/projects/cursor",
            params={"page_size": 15, "cursor": next_cursor},
        )
        r2.raise_for_status()
        data2 = r2.json()
        items2 = data2["items"]

        print(f"Items returned: {len(items2)}")
        ids2 = [p["id"] for p in items2]
        print(f"IDs: {ids2}")

        # 3. Check for overlap
        s1 = set(ids1)
        s2 = set(ids2)
        overlap = s1.intersection(s2)

        if overlap:
            print(f"\n❌ ERROR: Found {len(overlap)} duplicate IDs between pages!")
            print(f"Overlapping IDs: {overlap}")
        else:
            print("\n✅ SUCCESS: No overlap between pages.")

        # 4. Check total unique count
        all_ids = s1.union(s2)
        print(f"Total unique IDs found: {len(all_ids)}")

    except Exception as e:
        print(f"\n❌ Exception occurred: {e}")


if __name__ == "__main__":
    verify_pagination()
