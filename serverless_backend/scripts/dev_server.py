#!/usr/bin/env python3
"""Run the whole backend locally with no AWS account.

Starts an in-process AWS emulator (moto) for DynamoDB and S3, creates the table
and upload bucket, seeds demo data, then serves the API with the dev-only
identity provider enabled. Data lives in memory and resets on restart.

    python scripts/dev_server.py            # API on :8000, emulator on :5050
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

EMULATOR_PORT = int(os.getenv("OAKIE_EMULATOR_PORT", "5050"))
API_PORT = int(os.getenv("OAKIE_API_PORT", "8000"))

os.environ.update(
    AUTH_MODE="local",
    AWS_REGION="us-west-2",
    AWS_DEFAULT_REGION="us-west-2",
    AWS_ACCESS_KEY_ID="local",
    AWS_SECRET_ACCESS_KEY="local",
    AWS_ENDPOINT_URL=f"http://127.0.0.1:{EMULATOR_PORT}",
    TABLE_NAME="Oakie-Local",
    UPLOADS_BUCKET_NAME="oakie-local-uploads",
)


def main() -> None:
    import json
    import logging

    import boto3
    import uvicorn
    from moto.server import ThreadedMotoServer

    logging.getLogger("werkzeug").setLevel(logging.WARNING)  # quiet per-request emulator logs
    emulator = ThreadedMotoServer(ip_address="127.0.0.1", port=EMULATOR_PORT, verbose=False)
    emulator.start()

    from app.core.config import settings
    from app.db.schema import table_definition
    from app.db.table import aws_client_kwargs
    from app.local import seed

    boto3.client("dynamodb", **aws_client_kwargs()).create_table(
        **table_definition(settings.TABLE_NAME)
    )
    s3 = boto3.client("s3", **aws_client_kwargs())
    s3.create_bucket(
        Bucket=settings.UPLOADS_BUCKET_NAME,
        CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION},
    )
    s3.put_bucket_cors(
        Bucket=settings.UPLOADS_BUCKET_NAME,
        CORSConfiguration={
            "CORSRules": [
                {
                    "AllowedMethods": ["GET", "POST"],
                    "AllowedOrigins": ["*"],
                    "AllowedHeaders": ["*"],
                }
            ]
        },
    )
    # Same public-read policy the SAM template attaches to the real bucket.
    s3.put_bucket_policy(
        Bucket=settings.UPLOADS_BUCKET_NAME,
        Policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{settings.UPLOADS_BUCKET_NAME}/*",
                    }
                ],
            }
        ),
    )
    seed.run()

    print(f"\n  Oakie API       http://127.0.0.1:{API_PORT}/docs")
    print(f"  AWS emulator    http://127.0.0.1:{EMULATOR_PORT}")
    print(f"  Demo sign-in    {seed.DEMO_EMAIL} / {seed.DEMO_PASSWORD}\n")
    try:
        uvicorn.run("app.main:app", host="127.0.0.1", port=API_PORT, reload=True)
    finally:
        emulator.stop()


if __name__ == "__main__":
    main()
