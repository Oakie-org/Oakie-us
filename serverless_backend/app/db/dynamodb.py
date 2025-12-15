import boto3
from typing import Any, Dict, List, Optional
from app.core.config import settings
from botocore.exceptions import ClientError


class DynamoDBClient:
    def __init__(self):
        if settings.DYNAMODB_ENDPOINT_URL:
            self.resource = boto3.resource(
                "dynamodb",
                region_name=settings.AWS_REGION,
                endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
                aws_access_key_id="test",
                aws_secret_access_key="test",
            )
        else:
            self.resource = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
        self.table = self.resource.Table(settings.DYNAMODB_TABLE)

    def put_item(
        self,
        item: Dict[str, Any],
        *,
        condition_expression: Any | None = None,
        expression_attribute_names: Dict[str, str] | None = None,
        expression_attribute_values: Dict[str, Any] | None = None,
    ) -> None:
        try:
            kwargs: Dict[str, Any] = {"Item": item}
            if condition_expression is not None:
                kwargs["ConditionExpression"] = condition_expression
            if expression_attribute_names is not None:
                kwargs["ExpressionAttributeNames"] = expression_attribute_names
            if expression_attribute_values is not None:
                kwargs["ExpressionAttributeValues"] = expression_attribute_values
            self.table.put_item(**kwargs)
        except ClientError as e:
            print(f"Error putting item: {e}")
            raise e

    def get_item(self, pk: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.table.get_item(Key={"PK": pk})
            return response.get("Item")
        except ClientError as e:
            print(f"Error getting item: {e}")
            raise e

    def scan(
        self,
        *,
        filter_expression: Any | None = None,
        expression_attribute_names: Dict[str, str] | None = None,
        expression_attribute_values: Dict[str, Any] | None = None,
        limit: int | None = None,
    ) -> List[Dict[str, Any]]:
        try:
            kwargs: Dict[str, Any] = {}
            if filter_expression is not None:
                kwargs["FilterExpression"] = filter_expression
            if expression_attribute_names is not None:
                kwargs["ExpressionAttributeNames"] = expression_attribute_names
            if expression_attribute_values is not None:
                kwargs["ExpressionAttributeValues"] = expression_attribute_values
            if limit is not None:
                kwargs["Limit"] = limit

            items: List[Dict[str, Any]] = []
            last_evaluated_key: Dict[str, Any] | None = None
            while True:
                if last_evaluated_key is not None:
                    kwargs["ExclusiveStartKey"] = last_evaluated_key
                response = self.table.scan(**kwargs)
                items.extend(response.get("Items", []))
                last_evaluated_key = response.get("LastEvaluatedKey")
                if not last_evaluated_key:
                    break
            return items
        except ClientError as e:
            print(f"Error scanning items: {e}")
            raise e


_db: DynamoDBClient | None = None


def get_db() -> DynamoDBClient:
    global _db
    if _db is None:
        _db = DynamoDBClient()
    return _db
