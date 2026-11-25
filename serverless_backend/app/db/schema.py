"""Single-table layout for Oakie.

Every entity lives in one DynamoDB table; `template.yaml` must declare the same
keys and indexes. This definition is what local development and tests create.

| Entity              | PK              | SK                    | GSI1 (pk / sk)                         | GSI2 (pk / sk)                          |
|---------------------|-----------------|-----------------------|----------------------------------------|-----------------------------------------|
| User profile        | USER#<uid>      | PROFILE               | USER / <created_at>#<uid>              |                                         |
| Project             | PROJECT#<pid>   | METADATA              | PROJECT / <priority>#<created_at>#<pid>|                                         |
| Project member      | PROJECT#<pid>   | MEMBER#<uid>          |                                        | USER#<uid> / MEMBER#<joined_at>#<pid>   |
| Application         | PROJECT#<pid>   | APPLICATION#<uid>     |                                        | USER#<uid> / APPLICATION#<created_at>   |
| Timeline post       | PROJECT#<pid>   | TIMELINE#<post_id>    |                                        |                                         |
| Task                | PROJECT#<pid>   | TASK#<task_id>        |                                        | USER#<assignee> / TASK#<pid>#<task_id>  |
| Project like        | PROJECT#<pid>   | LIKE#<uid>            |                                        |                                         |
| Project follow      | PROJECT#<pid>   | FOLLOW#<uid>          |                                        | USER#<uid> / PFOLLOW#<created_at>       |
| User follow         | USER#<target>   | FOLLOWER#<uid>        |                                        | USER#<uid> / FOLLOWING#<created_at>     |
| Notification        | USER#<uid>      | NOTIF#<notif_id>      |                                        |                                         |
| Inbox entry         | USER#<uid>      | CONV#<cid>            |                                        | USER#<uid> / CONV#<last_at>             |
| Message             | CONV#<cid>      | MSG#<message_id>      |                                        |                                         |
| Contribution proof  | PROOF#<code>    | PROOF                 |                                        |                                         |
| Platform counters   | STATS           | GLOBAL                |                                        |                                         |
| Local credential *  | CRED#<email>    | CRED                  |                                        |                                         |

* only written when AUTH_MODE=local. Post, task, notification and message ids
are time-sortable, so their sort keys double as chronological order.
"""

GSI1 = "GSI1"
GSI2 = "GSI2"

# index name -> (partition key attribute, sort key attribute)
INDEX_KEYS: dict[str | None, tuple[str, str]] = {
    None: ("PK", "SK"),
    GSI1: ("gsi1_pk", "gsi1_sk"),
    GSI2: ("gsi2_pk", "gsi2_sk"),
}


def table_definition(table_name: str) -> dict:
    """Keyword arguments for `create_table`."""
    return {
        "TableName": table_name,
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
            {"AttributeName": name, "AttributeType": "S"}
            for name in ("PK", "SK", "gsi1_pk", "gsi1_sk", "gsi2_pk", "gsi2_sk")
        ],
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": index,
                "KeySchema": [
                    {"AttributeName": pk, "KeyType": "HASH"},
                    {"AttributeName": sk, "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
            for index, (pk, sk) in INDEX_KEYS.items()
            if index is not None
        ],
    }
