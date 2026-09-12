from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class GroupCreate(BaseModel):
    name: str = Field(min_length = 3, max_length=100)

class FileShare(BaseModel):
    user_id: int
    permission: Literal["READ", "WRITE", "DELETE"]

class GroupFileShare(BaseModel):
    group_id: int
    permission: Literal["READ", "WRITE", "DELETE"]

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

class FileResponse(BaseModel):
    id: int
    filename: str
    created_at: datetime

class GroupResponse(BaseModel):
    id: int
    name: str
    owner_id : int
    created_at : datetime

class FileListResponse(BaseModel):
    owned_files: list[FileResponse]
    shared_files: list[FileResponse]

class UserPermissionResponse(BaseModel):
    user_id: int
    username: str
    permission: str

class GroupPermissionResponse(BaseModel):
    group_id: int
    group_name: str
    permission: str

class FilePermissionsResponse(BaseModel):
    users: list[UserPermissionResponse]
    groups: list[GroupPermissionResponse]

class FilePermissionRevoke(BaseModel):
    user_id: int
    permission: Literal["READ", "WRITE", "DELETE"]

class GroupPermissionRevoke(BaseModel):
    group_id: int
    permission: Literal["READ", "WRITE", "DELETE"]

class FilePermissionUpdate(BaseModel):
    user_id: int
    permission: Literal["READ", "WRITE", "DELETE"]

class GroupPermissionUpdate(BaseModel):
    group_id: int
    permission: Literal["READ", "WRITE", "DELETE"]
