from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
from fastapi.responses import FileResponse as FastAPIFileResponse
import uuid

from database import engine, Base, get_db
from schemas import (UserCreate, 
                     UserLogin,
                     GroupCreate, 
                     FileShare, 
                     GroupFileShare, 
                     UserResponse, 
                     FileResponse, 
                     GroupResponse, 
                     FileListResponse, 
                     UserPermissionResponse, 
                     GroupPermissionResponse, 
                     FilePermissionsResponse, 
                     GroupPermissionRevoke, 
                     FilePermissionRevoke, 
                     GroupPermissionUpdate, 
                     FilePermissionUpdate
                     )
from security import hash_password, verify_password, create_access_token, get_current_user, authorize_file_access, create_audit_log
import models

app = FastAPI()

# Required for browser frontend (Vite on :5173) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("../storage", exist_ok=True)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "SecureShare API is running!"}

@app.post("/users", response_model=UserResponse)
def create_user(
        user: UserCreate,
        db : Session = Depends(get_db)
):
    new_user = models.User(
            username = user.username,
            email = user.email,
            password_hash = hash_password(user.password)
        )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

MAX_FILE_SIZE = 20*1024*1024
@app.post("/files/upload", response_model=FileResponse)
async def file_upload(
        file: UploadFile = File (...),
        current_user: int = Depends(get_current_user),
        db: Session = Depends(get_db)
        ):
    if not file.filename:
        raise HTTPException(
                status_code = 400,
                detail = "Invalid filename"
        )

    storage_name = str(uuid.uuid4())
    storage_path = f"../storage/{storage_name}"

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
                status_code = 413,
                detail = "File too large. Maximum size is 20MB."
        )

    # Write the bytes already read — file.file is exhausted after await file.read().
    with open(storage_path, "wb") as buffer:
        buffer.write(contents)

    new_file = models.File(
            filename = file.filename,
            storage_path = storage_path,
            owner_id = current_user
        )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    create_audit_log(
        db,
        current_user,
        "UPLOAD",
        "FILE",
        new_file.id
    )

    return new_file

@app.get("/files", response_model=FileListResponse)
def list_files(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Files owned by the user
    owned_files = db.query(models.File).filter(
        models.File.owner_id == current_user
    ).all()

    # Files shared directly with the user
    direct_permissions = db.query(
        models.FileUserPermission
    ).filter(
        models.FileUserPermission.user_id == current_user,
        models.FileUserPermission.permission.in_(["READ", "WRITE"])
    ).all()

    direct_file_ids = [
        permission.file_id
        for permission in direct_permissions
    ]

    # Groups the user belongs to
    memberships = db.query(models.GroupMember).filter(
        models.GroupMember.user_id == current_user
    ).all()

    group_ids = [
        membership.group_id
        for membership in memberships
    ]

    # Files shared with those groups
    group_file_ids = []

    if group_ids:
        group_permissions = db.query(
            models.FileGroupPermission
        ).filter(
            models.FileGroupPermission.group_id.in_(group_ids),
            models.FileGroupPermission.permission.in_(["READ", "WRITE"])
        ).all()

        group_file_ids = [
            permission.file_id
            for permission in group_permissions
        ]

    # Combine all accessible file IDs
    accessible_file_ids = set(
        direct_file_ids + group_file_ids
    )

    # Remove files already included through ownership
    owned_file_ids = {
        file.id
        for file in owned_files
    }

    accessible_file_ids -= owned_file_ids

    # Get shared files
    shared_files = []

    if accessible_file_ids:
        shared_files = db.query(models.File).filter(
            models.File.id.in_(accessible_file_ids)
        ).all()

    return {
        "owned_files": owned_files,
        "shared_files": shared_files
    }

@app.get("/files/{file_id}")
def download_file(
    file_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = authorize_file_access(
            current_user,
            file_id,
            "READ",
            db
    )

    create_audit_log(
        db,
        current_user,
        "DOWNLOAD",
        "FILE",
        file_id
    )

    return FastAPIFileResponse(
            path = file.storage_path,
            filename = file.filename
    )


@app.post("/login")
def login(
        user: UserLogin,
        db: Session = Depends(get_db)
    ):
    db_user = db.query(models.User).filter(
            models.User.username == user.username
            ).first()
    if not db_user:
        raise HTTPException(
                status_code = 401,
                detail = "Invalid Username or Password"
            )

    if not verify_password (user.password, db_user.password_hash):
        raise HTTPException(
                status_code = 401,
                detail = "Invalid Username or Password"
            )

    access_token = create_access_token(db_user.id)
    
    return {
        "access_token": access_token,
        "token_type" : "bearer"
            }

@app.post("/groups", response_model=GroupResponse)
def create_group(
        group: GroupCreate,
        current_user: int = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    new_group = models.Group(
            name = group.name,
            owner_id = current_user
        )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    return new_group

@app.post("/groups/{group_id}/members/{user_id}")
def add_member(
        group_id: int,
        user_id: int,
        current_user: int = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    group = db.query(models.Group).filter(
            models.Group.id == group_id
    ).first()

    if not group:
        raise HTTPException(
                status_code = 404,
                detail = "Group not found"
        )

    if group.owner_id != current_user:
        raise HTTPException(
                status_code = 403,
                detail = "Only the group owner can add members"
        )

    user = db.query(models.User).filter(
            models.User.id ==user_id
    ).first()

    if not user:
        raise HTTPException(
                status_code = 404,
                detail = "User not found!"
        )

    membership = models.GroupMember(
            group_id = group_id,
            user_id = user_id
    )

    db.add(membership)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "ADD_MEMBER",
        "GROUP",
        group_id
    )

    return {
            "message" : "User added to group"
    }


@app.post("/files/{file_id}/share/user")
def share_file_with_user(
    file_id: int,
    share: FileShare,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can share this file"
        )
 
    user = db.query(models.User).filter(
        models.User.id == share.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_permission = db.query(
            models.FileUserPermission
        ).filter(
                models.FileUserPermission.file_id == file_id,
                models.FileUserPermission.user_id == share.user_id,
                models.FileUserPermission.permission == share.permission
        ).first()

    if existing_permission:
        raise HTTPException(
                status_code = 409,
                detail = "Permission already exists"
        )

    permission = models.FileUserPermission(
        file_id=file_id,
        user_id=share.user_id,
        permission=share.permission
    )

    db.add(permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "SHARE_USER",
        "FILE",
        file_id
    )

    return {
        "message": "File shared successfully"
    }

@app.post("/files/{file_id}/share/group")
def share_file_with_group(
    file_id: int,
    share: GroupFileShare,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can share this file"
        )

    group = db.query(models.Group).filter(
        models.Group.id == share.group_id
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )

    existing_permission = db.query(
        models.FileGroupPermission
    ).filter(
        models.FileGroupPermission.file_id == file_id,
        models.FileGroupPermission.group_id == share.group_id,
        models.FileGroupPermission.permission == share.permission
    ).first()

    if existing_permission:
        raise HTTPException(
            status_code=409,
            detail="Permission already exists"
        )

    permission = models.FileGroupPermission(
        file_id=file_id,
        group_id=share.group_id,
        permission=share.permission
    )

    db.add(permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "SHARE_GROUP",
        "FILE",
            file_id
    )

    return {
        "message": "File shared with group successfully"
    }

@app.delete("/files/{file_id}")
def delete_file(
    file_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = authorize_file_access(
        current_user,
        file_id,
        "DELETE",
        db
    )

    import os

    if os.path.exists(file.storage_path):
        os.remove(file.storage_path)

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "FILE",
        file_id
    )

    db.delete(file)
    db.commit()

    return {
        "message": "File deleted successfully"
    }

@app.put("/files/{file_id}")
def update_file(
    file_id: int,
    file: UploadFile = File(...),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_file = authorize_file_access(
        current_user,
        file_id,
        "WRITE",
        db
    )

    with open(existing_file.storage_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    create_audit_log(
        db,
        current_user,
        "UPDATE",
        "FILE",
        file_id
    )

    return {
        "message": "File updated successfully"
    }

@app.delete("/files/{file_id}/share/user")
def revoke_user_permission(
    file_id: int,
    share: FileShare,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    # Only owner can revoke access
    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can revoke permissions"
        )

    permission = db.query(models.FileUserPermission).filter(
        models.FileUserPermission.file_id == file_id,
        models.FileUserPermission.user_id == share.user_id,
        models.FileUserPermission.permission == share.permission
    ).first()

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    create_audit_log(
        db,
        current_user,
        "REVOKE_USER",
        "FILE",
        file_id
    )

    db.delete(permission)
    db.commit()

    return {
        "message": "Permission revoked successfully"
    }

@app.delete("/files/{file_id}/share/group")
def revoke_group_permission(
    file_id: int,
    share: GroupFileShare,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can revoke permissions"
        )

    permission = db.query(models.FileGroupPermission).filter(
        models.FileGroupPermission.file_id == file_id,
        models.FileGroupPermission.group_id == share.group_id,
        models.FileGroupPermission.permission == share.permission
    ).first()

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    db.delete(permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "REVOKE_GROUP",
        "FILE",
        file_id
    )

    return {
        "message": "Group permission revoked successfully"
    }

@app.get("/groups")
def list_groups(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(models.GroupMember).filter(
        models.GroupMember.user_id == current_user
    ).all()

    group_ids = [
        membership.group_id
        for membership in memberships
    ]

    # Include groups owned by the user even if they aren't explicitly present in group_members.
    owned_groups = db.query(models.Group).filter(
        models.Group.owner_id == current_user
    ).all()

    owned_group_ids = {
        group.id
        for group in owned_groups
    }

    group_ids = set(group_ids) | owned_group_ids

    if not group_ids:
        return []

    groups = db.query(models.Group).filter(
        models.Group.id.in_(group_ids)
    ).all()

    return groups

@app.get("/groups/{group_id}/members", response_model=list[UserResponse])
def list_group_members(
    group_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.Group).filter(
        models.Group.id == group_id
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )

    # Only group members or the owner can see members
    is_member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == current_user
    ).first()

    if group.owner_id != current_user and not is_member:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this group"
        )

    members = db.query(models.User).join(
        models.GroupMember,
        models.User.id == models.GroupMember.user_id
    ).filter(
        models.GroupMember.group_id == group_id
    ).all()

    return members

@app.delete("/groups/{group_id}/members/{user_id}")
def remove_member(
    group_id: int,
    user_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.Group).filter(
        models.Group.id == group_id
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )

    if group.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the group owner can remove members"
        )

    if user_id == group.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Group owner cannot be removed"
        )

    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="User is not a member of this group"
        )

    create_audit_log(
        db,
        current_user,
        "REMOVE_MEMBER",
        "GROUP",
        group_id
    )

    db.delete(membership)
    db.commit()

    return {
        "message": "User removed from group"
    }


@app.get(
    "/files/{file_id}/permissions",
    response_model=FilePermissionsResponse
)
def list_file_permissions(
    file_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can view permissions"
        )

    user_permissions = db.query(
        models.FileUserPermission,
        models.User
    ).join(
        models.User,
        models.User.id == models.FileUserPermission.user_id
    ).filter(
        models.FileUserPermission.file_id == file_id
    ).all()

    group_permissions = db.query(
        models.FileGroupPermission,
        models.Group
    ).join(
        models.Group,
        models.Group.id == models.FileGroupPermission.group_id
    ).filter(
        models.FileGroupPermission.file_id == file_id
    ).all()

    users = [
        {
            "user_id": permission.user_id,
            "username": user.username,
            "permission": permission.permission
        }
        for permission, user in user_permissions
    ]

    groups = [
        {
            "group_id": permission.group_id,
            "group_name": group.name,
            "permission": permission.permission
        }
        for permission, group in group_permissions
    ]

    create_audit_log(
        db,
        current_user,
        "VIEW_PERMISSIONS",
        "FILE",
        file_id
    )

    return {
        "users": users,
        "groups": groups
    }

@app.delete("/files/{file_id}/permissions/user")
def revoke_user_permission(
    file_id: int,
    revoke: FilePermissionRevoke,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can revoke permissions"
        )

    permission = db.query(models.FileUserPermission).filter(
        models.FileUserPermission.file_id == file_id,
        models.FileUserPermission.user_id == revoke.user_id,
        models.FileUserPermission.permission == revoke.permission
    ).first()

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    db.delete(permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "REVOKE_USER",
        "FILE",
        file_id
    )

    return {
        "message": "User permission revoked"
    }

@app.delete("/files/{file_id}/permissions/group")
def revoke_group_permission(
    file_id: int,
    revoke: GroupPermissionRevoke,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can revoke permissions"
        )

    permission = db.query(models.FileGroupPermission).filter(
        models.FileGroupPermission.file_id == file_id,
        models.FileGroupPermission.group_id == revoke.group_id,
        models.FileGroupPermission.permission == revoke.permission
    ).first()

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    db.delete(permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "REVOKE_GROUP",
        "FILE",
        file_id
    )

    return {
        "message": "Group permission revoked"
    }

@app.put("/files/{file_id}/permissions/user")
def update_user_permission(
    file_id: int,
    update: FilePermissionUpdate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can update permissions"
        )

    permissions = db.query(models.FileUserPermission).filter(
        models.FileUserPermission.file_id == file_id,
        models.FileUserPermission.user_id == update.user_id
    ).all()

    if not permissions:
        raise HTTPException(
            status_code=404,
            detail="User has no permission on this file"
        )

    # Remove existing permissions
    for permission in permissions:
        db.delete(permission)

    db.flush()

    # Add the new permission
    new_permission = models.FileUserPermission(
        file_id=file_id,
        user_id=update.user_id,
        permission=update.permission
    )

    db.add(new_permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "UPDATE_USER_PERMISSION",
        "FILE",
        file_id
    )

    return {
        "message": "User permission updated"
    }

@app.put("/files/{file_id}/permissions/group")
def update_group_permission(
    file_id: int,
    update: GroupPermissionUpdate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
        models.File.id == file_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file.owner_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Only the file owner can update permissions"
        )

    permissions = db.query(models.FileGroupPermission).filter(
        models.FileGroupPermission.file_id == file_id,
        models.FileGroupPermission.group_id == update.group_id
    ).all()

    if not permissions:
        raise HTTPException(
            status_code=404,
            detail="Group has no permission on this file"
        )

    for permission in permissions:
        db.delete(permission)

    db.flush()

    new_permission = models.FileGroupPermission(
        file_id=file_id,
        group_id=update.group_id,
        permission=update.permission
    )

    db.add(new_permission)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "UPDATE_GROUP_PERMISSION",
        "FILE",
        file_id
    )

    return {
        "message": "Group permission updated"
    }
