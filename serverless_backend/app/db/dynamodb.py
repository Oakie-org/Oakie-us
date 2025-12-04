import boto3
from typing import Dict, Any, List, Optional
from app.core.config import settings
from botocore.exceptions import ClientError

class DynamoDBClient:
    def __init__(self):
        self.client = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
        self.table = self.client.Table(settings.DYNAMODB_TABLE)

    def put_item(self, item: Dict[str, Any]):
        try:
            self.table.put_item(Item=item)
        except ClientError as e:
            print(f"Error putting item: {e}")
            raise e

    def get_item(self, pk: str, sk: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.table.get_item(Key={"PK": pk, "SK": sk})
            return response.get("Item")
        except ClientError as e:
            print(f"Error getting item: {e}")
            raise e

    def query_pk(self, pk: str) -> List[Dict[str, Any]]:
        from boto3.dynamodb.conditions import Key
        try:
            response = self.table.query(
                KeyConditionExpression=Key("PK").eq(pk)
            )
            return response.get("Items", [])
        except ClientError as e:
            print(f"Error querying items: {e}")
            raise e
            
    def query_gsi1(self, gsi1pk: str) -> List[Dict[str, Any]]:
        from boto3.dynamodb.conditions import Key
        try:
            response = self.table.query(
                IndexName="GSI1",
                KeyConditionExpression=Key("GSI1PK").eq(gsi1pk)
            )
            return response.get("Items", [])
        except ClientError as e:
            print(f"Error querying GSI1: {e}")
            raise e

db = DynamoDBClient()
