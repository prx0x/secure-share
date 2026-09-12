from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column (String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class File(Base):
    __tablename__ = "files"

    id = Column (Integer, primary_key=True)
    filename = Column(String(50), nullable=False)
    storage_path = Column(String(500), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Group(Base):
    __tablename__  = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable = False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class GroupMember(Base):
    __tablename__ = "group_members"

    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), primary_key = True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key = True)

class FileUserPermission(Base):
    __tablename__ = "file_user_permissions"

    file_id = Column(
            Integer,
            ForeignKey("files.id", ondelete="CASCADE"),
            primary_key = True
    )

    user_id = Column(
            Integer,
            ForeignKey("users.id", ondelete="CASCADE"),
            primary_key = True
    )

    permission = Column(
            String(20),
            primary_key = True
    )

class FileGroupPermission(Base):
    __tablename__ = "file_group_permissions"

    file_id = Column(
            Integer,
            ForeignKey("files.id", ondelete="CASCADE"),
            primary_key=True
    )

    group_id = Column(
            Integer,
            ForeignKey("groups.id", ondelete="CASCADE"),
            primary_key = True
    )

    permission = Column(
            String(20),
            primary_key = True
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    action = Column(String(50), nullable=False)

    resource_type = Column(String(50))

    resource_id = Column(Integer)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True
    )

    permission = Column(
        String(20),
        primary_key=True
    )

class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    role_id = Column(
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True
    )
