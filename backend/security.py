import os
import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import models

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

def verify_password(password:str, password_hash:str)->bool:
    return bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )

def create_access_token(user_id: int)->str:
    payload = {
            "sub": str(user_id)
        }

    return jwt.encode(
            payload,
            JWT_SECRET,
            algorithm = JWT_ALGORITHM
        )

security = HTTPBearer()

def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms = [JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                    status_code = 401,
                    detail = "Invalid Token"
                )
        return int(user_id)

    except jwt.InvalidTokenError:
        raise HTTPException(
                    status_code=401,
                    detail = "Invalid Token" 
                )


def authorize_file_access(
        user_id: int,
        file_id: int,
        action: str,
        db
):
    file = db.query(models.File).filter(
            models.File.id == file_id
        ).first()

    if not file:
        raise HTTPException(
                status_code = 404,
                detail = "File not found"
        )

    if file.owner_id == user_id:
        return file

    if has_role_permission(db, user_id, "ADMIN"):
        return file

    required_permissions = [action]

    if action == "READ":
        required_permissions.append("WRITE")

    permission = db.query(models.FileUserPermission).filter(
            models.FileUserPermission.file_id == file_id,
            models.FileUserPermission.user_id == user_id,
            models.FileUserPermission.permission.in_(required_permissions)
    ).first()

    if permission:
        return file

    memberships = db.query(models.GroupMember).filter(
        models.GroupMember.user_id == user_id
    ).all()

    group_ids = [membership.group_id for membership in memberships]

    if group_ids:
        group_permission = db.query(
            models.FileGroupPermission
        ).filter(
            models.FileGroupPermission.file_id == file_id,
            models.FileGroupPermission.group_id.in_(group_ids),
            models.FileGroupPermission.permission == action
        ).first()

    if group_permission:
            return file

    raise HTTPException(
            status_code = 403,
            detail = "You don't have permission to access this file"
    )

def create_audit_log(
    db,
    user_id: int,
    action: str,
    resource_type: str = None,
    resource_id: int = None
):
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id
    )

    db.add(log)
    db.commit()

def has_role_permission(
    db,
    user_id: int,
    permission: str
):
    result = db.query(
        models.RolePermission
    ).join(
        models.UserRole,
        models.UserRole.role_id == models.RolePermission.role_id
    ).filter(
        models.UserRole.user_id == user_id,
        models.RolePermission.permission == permission
    ).first()

    return result is not None
