"""Thin gateway over the Oakie DynamoDB table.

Repositories talk to DynamoDB only through this class, so key handling, cursor
encoding, number conversion and error translation live in one place.
"""

from __future__ import annotations

import base64
import json
from collections.abc import Callable
from decimal import Decimal
from functools import lru_cache
from typing import Any, NamedTuple

import boto3
from boto3.dynamodb.conditions import ConditionBase, Key
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.errors import BadRequest, Conflict
from app.db.schema import INDEX_KEYS

Item = dict[str, Any]


class Page(NamedTuple):
    items: list[Item]
    next_cursor: str | None


def _plain(value: Any) -> Any:
    """DynamoDB returns numbers as Decimal; the app works with int/float."""
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, dict):
        return {key: _plain(inner) for key, inner in value.items()}
    if isinstance(value, list | set):
        return [_plain(inner) for inner in value]
    return value


def _encode_cursor(key: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(key).encode()).decode()


def _decode_cursor(cursor: str | None) -> dict | None:
    if not cursor:
        return None
    try:
        key = json.loads(base64.urlsafe_b64decode(cursor.encode()))
    except ValueError as exc:
        raise BadRequest("Invalid cursor") from exc
    if not isinstance(key, dict) or not all(isinstance(v, str) for v in key.values()):
        raise BadRequest("Invalid cursor")
    return key


def _update_expression(
    set_: Item | None, add: Item | None, remove: list[str] | None
) -> tuple[str, dict[str, str], Item]:
    names: dict[str, str] = {}
    values: Item = {}
    clauses: list[str] = []

    def name(attr: str) -> str:
        placeholder = f"#u{len(names)}"
        names[placeholder] = attr
        return placeholder

    def value(val: Any) -> str:
        placeholder = f":u{len(values)}"
        values[placeholder] = val
        return placeholder

    if set_:
        clauses.append("SET " + ", ".join(f"{name(k)} = {value(v)}" for k, v in set_.items()))
    if add:
        clauses.append("ADD " + ", ".join(f"{name(k)} {value(v)}" for k, v in add.items()))
    if remove:
        clauses.append("REMOVE " + ", ".join(name(k) for k in remove))
    return " ".join(clauses), names, values


class Table:
    def __init__(self, name: str, resource: Any):
        self.name = name
        self._table = resource.Table(name)
        self._client = resource.meta.client

    # ------------------------------------------------------------------ reads

    def get(self, pk: str, sk: str) -> Item | None:
        response = self._table.get_item(Key={"PK": pk, "SK": sk})
        item = response.get("Item")
        return _plain(item) if item else None

    def batch_get(self, keys: list[tuple[str, str]]) -> dict[tuple[str, str], Item]:
        found: dict[tuple[str, str], Item] = {}
        unique = list(dict.fromkeys(keys))
        for start in range(0, len(unique), 100):
            pending = [{"PK": pk, "SK": sk} for pk, sk in unique[start : start + 100]]
            while pending:
                response = self._client.batch_get_item(RequestItems={self.name: {"Keys": pending}})
                for raw in response["Responses"].get(self.name, []):
                    found[(raw["PK"], raw["SK"])] = _plain(raw)
                pending = response.get("UnprocessedKeys", {}).get(self.name, {}).get("Keys", [])
        return found

    def query_all(
        self,
        pk: str,
        sk_prefix: str | None = None,
        *,
        index: str | None = None,
        forward: bool = True,
        filter_expression: ConditionBase | None = None,
    ) -> list[Item]:
        """Every item under a key. Only for collections bounded by the domain."""
        kwargs = self._query_kwargs(pk, sk_prefix, index, forward, filter_expression)
        items: list[Item] = []
        while True:
            response = self._table.query(**kwargs)
            items.extend(_plain(raw) for raw in response["Items"])
            if "LastEvaluatedKey" not in response:
                return items
            kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

    def query_page(
        self,
        pk: str,
        sk_prefix: str | None = None,
        *,
        index: str | None = None,
        forward: bool = True,
        limit: int = 20,
        cursor: str | None = None,
        filter_expression: ConditionBase | None = None,
        predicate: Callable[[Item], bool] | None = None,
        max_requests: int = 8,
    ) -> Page:
        """One page of exactly-filtered results.

        DynamoDB applies `Limit` before filters, so a single request can return
        fewer matches than asked for. This keeps reading until `limit` matches
        are collected and derives the cursor from the last item actually
        returned, so no match is skipped or repeated between pages.
        """
        kwargs = self._query_kwargs(pk, sk_prefix, index, forward, filter_expression)
        kwargs["Limit"] = max(limit * 2, 25)
        start_key = _decode_cursor(cursor)
        items: list[Item] = []

        for _ in range(max_requests):
            if start_key:
                kwargs["ExclusiveStartKey"] = start_key
            try:
                response = self._table.query(**kwargs)
            except ClientError as exc:
                if exc.response["Error"]["Code"] == "ValidationException" and cursor:
                    raise BadRequest("Invalid cursor") from exc
                raise
            batch = response["Items"]
            for position, raw in enumerate(batch):
                item = _plain(raw)
                if predicate and not predicate(item):
                    continue
                items.append(item)
                if len(items) == limit:
                    more = position < len(batch) - 1 or "LastEvaluatedKey" in response
                    return Page(items, _encode_cursor(self._key_of(raw, index)) if more else None)
            start_key = response.get("LastEvaluatedKey")
            if not start_key:
                return Page(items, None)
        # Sparse filter: hand back what we have and let the client continue.
        return Page(items, _encode_cursor(start_key) if start_key else None)

    def count(
        self,
        pk: str,
        sk_prefix: str | None = None,
        *,
        filter_expression: ConditionBase | None = None,
    ) -> int:
        kwargs = self._query_kwargs(pk, sk_prefix, None, True, filter_expression)
        kwargs["Select"] = "COUNT"
        total = 0
        while True:
            response = self._table.query(**kwargs)
            total += response["Count"]
            if "LastEvaluatedKey" not in response:
                return total
            kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

    # ----------------------------------------------------------------- writes

    def put(self, item: Item, *, unless_exists: bool = False) -> None:
        kwargs: dict[str, Any] = {"Item": item}
        if unless_exists:
            kwargs["ConditionExpression"] = "attribute_not_exists(PK)"
        try:
            self._table.put_item(**kwargs)
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise Conflict("Already exists") from exc
            raise

    def update(
        self,
        pk: str,
        sk: str,
        *,
        set_: Item | None = None,
        add: Item | None = None,
        remove: list[str] | None = None,
        must_exist: bool = True,
    ) -> Item | None:
        """Apply a partial update. Returns the new item, or None when
        `must_exist` is set and the item is missing."""
        expression, names, values = _update_expression(set_, add, remove)
        kwargs: dict[str, Any] = {
            "Key": {"PK": pk, "SK": sk},
            "UpdateExpression": expression,
            "ExpressionAttributeNames": names,
            "ReturnValues": "ALL_NEW",
        }
        if values:
            kwargs["ExpressionAttributeValues"] = values
        if must_exist:
            kwargs["ConditionExpression"] = "attribute_exists(PK)"
        try:
            response = self._table.update_item(**kwargs)
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return None
            raise
        return _plain(response["Attributes"])

    def delete(self, pk: str, sk: str) -> None:
        self._table.delete_item(Key={"PK": pk, "SK": sk})

    def delete_many(self, keys: list[tuple[str, str]]) -> None:
        with self._table.batch_writer() as batch:
            for pk, sk in keys:
                batch.delete_item(Key={"PK": pk, "SK": sk})

    def transact(self, operations: list[dict]) -> None:
        """Run operations built with `tx_*` atomically.

        Raises Conflict when any condition fails."""
        try:
            self._client.transact_write_items(TransactItems=operations)
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "TransactionCanceledException":
                raise Conflict("The request conflicts with the current state") from exc
            raise

    # ----------------------------------------------------- transaction pieces

    def tx_put(self, item: Item, *, unless_exists: bool = False) -> dict:
        op: dict[str, Any] = {"TableName": self.name, "Item": item}
        if unless_exists:
            op["ConditionExpression"] = "attribute_not_exists(PK)"
        return {"Put": op}

    def tx_delete(self, pk: str, sk: str, *, must_exist: bool = False) -> dict:
        op: dict[str, Any] = {"TableName": self.name, "Key": {"PK": pk, "SK": sk}}
        if must_exist:
            op["ConditionExpression"] = "attribute_exists(PK)"
        return {"Delete": op}

    def tx_update(
        self,
        pk: str,
        sk: str,
        *,
        set_: Item | None = None,
        add: Item | None = None,
        condition: str | None = "attribute_exists(PK)",
        condition_names: dict[str, str] | None = None,
        condition_values: Item | None = None,
    ) -> dict:
        expression, names, values = _update_expression(set_, add, None)
        names.update(condition_names or {})
        values.update(condition_values or {})
        op: dict[str, Any] = {
            "TableName": self.name,
            "Key": {"PK": pk, "SK": sk},
            "UpdateExpression": expression,
            "ExpressionAttributeNames": names,
        }
        if values:
            op["ExpressionAttributeValues"] = values
        if condition:
            op["ConditionExpression"] = condition
        return {"Update": op}

    # ---------------------------------------------------------------- helpers

    def _query_kwargs(
        self,
        pk: str,
        sk_prefix: str | None,
        index: str | None,
        forward: bool,
        filter_expression: ConditionBase | None,
    ) -> dict[str, Any]:
        pk_name, sk_name = INDEX_KEYS[index]
        condition = Key(pk_name).eq(pk)
        if sk_prefix:
            condition &= Key(sk_name).begins_with(sk_prefix)
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": condition,
            "ScanIndexForward": forward,
        }
        if index:
            kwargs["IndexName"] = index
        if filter_expression is not None:
            kwargs["FilterExpression"] = filter_expression
        return kwargs

    @staticmethod
    def _key_of(raw: Item, index: str | None) -> dict[str, str]:
        key = {"PK": raw["PK"], "SK": raw["SK"]}
        if index:
            pk_name, sk_name = INDEX_KEYS[index]
            key[pk_name] = raw[pk_name]
            key[sk_name] = raw[sk_name]
        return key


def aws_client_kwargs() -> dict[str, Any]:
    """Shared boto3 arguments; honours the local emulator endpoint."""
    kwargs: dict[str, Any] = {"region_name": settings.AWS_REGION}
    if settings.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
    return kwargs


@lru_cache
def get_table() -> Table:
    resource = boto3.resource("dynamodb", **aws_client_kwargs())
    return Table(settings.TABLE_NAME, resource)
