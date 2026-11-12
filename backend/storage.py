import os
import re
import time
import uuid
from pathlib import Path

import cloudinary
from cloudinary import api, uploader
from cloudinary.utils import api_sign_request, private_download_url


CLOUD_NAME = os.environ["CLOUDINARY_CLOUD_NAME"]
API_KEY = os.environ["CLOUDINARY_API_KEY"]
API_SECRET = os.environ["CLOUDINARY_API_SECRET"]

FOLDER_MODE = os.getenv(
    "CLOUDINARY_FOLDER_MODE", "dynamic"
).lower()

RESOURCE_TYPE = "raw"
DELIVERY_TYPE = "authenticated"
MAX_FILE_SIZE = 10_000_000

cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
    secure=True,
)


def create_upload_signature(
    user_id: int,
    filename: str,
    purpose: str = "upload",
    file_id: int | None = None,
):
    filename = Path(filename.replace("\\", "/")).name

    extension = Path(filename).suffix.lower()

    if not re.fullmatch(r"\.[a-z0-9]{1,10}", extension):
        extension = ".bin"

    if purpose == "upload":
        folder = "secureshare/uploads"
        public_id = f"ss_u{user_id}_{uuid.uuid4().hex}{extension}"

    elif purpose == "update" and file_id is not None:
        folder = "secureshare/updates"
        public_id = (
            f"ss_update_u{user_id}_f{file_id}_"
            f"{uuid.uuid4().hex}{extension}"
        )

    else:
        raise ValueError("Invalid upload purpose")

    params = {
        "timestamp": int(time.time()),
        "public_id": public_id,
	"type": DELIVERY_TYPE,
    }

    if FOLDER_MODE == "dynamic":
        params["asset_folder"] = folder
    elif FOLDER_MODE == "fixed":
        params["folder"] = folder
    else:
        raise RuntimeError("Invalid Cloudinary folder mode")

    signature = api_sign_request(params, API_SECRET)

    return {
        **params,
        "signature": signature,
        "api_key": API_KEY,
        "cloud_name": CLOUD_NAME,
        "resource_type": RESOURCE_TYPE,
    }


def verify_uploaded_asset(
    user_id: int,
    public_id: str,
    purpose: str = "upload",
    file_id: int | None = None,
):
    if purpose == "upload":
        folder = "secureshare/uploads"
        prefix = f"ss_u{user_id}_"

    elif purpose == "update" and file_id is not None:
        folder = "secureshare/updates"
        prefix = f"ss_update_u{user_id}_f{file_id}_"

    else:
        raise ValueError("Invalid verification purpose")

    if FOLDER_MODE == "fixed":
        prefix = f"{folder}/{prefix}"

    if not public_id.startswith(prefix):
        raise ValueError("Invalid Cloudinary asset ownership")

    resource = api.resource(
        public_id,
        resource_type=RESOURCE_TYPE,
        type=DELIVERY_TYPE,
    )

    if resource.get("type") != DELIVERY_TYPE:
        raise ValueError("Asset is not private")

    if resource.get("resource_type") != RESOURCE_TYPE:
        raise ValueError("Invalid asset resource type")

    if int(resource.get("bytes", 0)) > MAX_FILE_SIZE:
        uploader.destroy(
            public_id,
            resource_type=RESOURCE_TYPE,
            type=DELIVERY_TYPE,
            invalidate=True,
        )
        raise ValueError("File exceeds the 10 MB limit")

    return resource


def encode_storage_path(public_id: str) -> str:
    return f"cloudinary://{RESOURCE_TYPE}/{DELIVERY_TYPE}/{public_id}"


def decode_storage_path(storage_path: str) -> str:
    prefix = f"cloudinary://{RESOURCE_TYPE}/{DELIVERY_TYPE}/"

    if not storage_path.startswith(prefix):
        raise ValueError("Invalid Cloudinary storage reference")

    return storage_path[len(prefix):]


def generate_download_url(public_id: str, filename: str) -> str:
    extension = Path(filename).suffix.lower().lstrip(".") or "bin"

    return private_download_url(
        public_id,
        format=extension,
        resource_type=RESOURCE_TYPE,
        type=DELIVERY_TYPE,
        expires_at=int(time.time()) + 300,
        attachment=True,
    )


def delete_asset(public_id: str):
    return uploader.destroy(
        public_id,
        resource_type=RESOURCE_TYPE,
        type=DELIVERY_TYPE,
        invalidate=True,
    )
