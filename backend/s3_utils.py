import boto3
from botocore.exceptions import ClientError

BUCKET_NAME = "cloudvault-secure-storage-tharun"
REGION = "ap-south-1"

s3_client = boto3.client("s3", region_name=REGION)


# ================= UPLOAD =================
def upload_file_to_s3(file, filename, user_id):
    key = f"{user_id}/{filename}"

    s3_client.upload_fileobj(
        file,
        BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": file.content_type}
    )


# ================= PRESIGNED URL =================
def generate_presigned_url(s3_key, expires=60, download=False):
    try:
        params = {
            "Bucket": BUCKET_NAME,
            "Key": s3_key
        }

        if download:
            params["ResponseContentDisposition"] = "attachment"

        return s3_client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=expires
        )

    except ClientError as e:
        print("Presigned URL error:", e)
        return None


# ================= LIST FILES =================
def list_user_files(user_id):
    try:
        response = s3_client.list_objects_v2(
            Bucket=BUCKET_NAME,
            Prefix=f"{user_id}/"
        )

        if "Contents" not in response:
            return []

        files = []
        for obj in response["Contents"]:
            if obj["Key"].endswith("/"):
                continue

            files.append({
                "filename": obj["Key"].split("/", 1)[1],
                "size_kb": round(obj["Size"] / 1024, 2)
            })

        return files

    except ClientError as e:
        print("List error:", e)
        return []


# ================= DELETE =================
def delete_file(user_id, filename):
    s3_client.delete_object(
        Bucket=BUCKET_NAME,
        Key=f"{user_id}/{filename}"
    )
