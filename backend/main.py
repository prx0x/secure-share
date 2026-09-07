from fastapi import FastAPI, Depends, UploadFile, File
from sqlalchemy.orm import Session
import os
import shutil
from fastapi.responses import FileResponse

from database import engine, Base, get_db
from schemas import UserCreate
import models

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "SecureShare API is running!"}

@app.post("/users")
def create_user(
        user: UserCreate,
        db : Session = Depends(get_db)
):
    new_user = models.User(
            username = user.username,
            email = user.email
        )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/files/upload")
def file_upload(
        file: UploadFile = File (...),
        owner_id: int = 1,
        db: Session = Depends(get_db)
        ):
    storage_path = f"../storage/{file.filename}"
    
    with open (storage_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_file = models.File(
            filename = file.filename,
            storage_path = storage_path,
            owner_id = owner_id
        )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    return new_file

@app.get("/files")
def list_files(db: Session = Depends(get_db)):
    files = db.query(models.File).all()
    return files

@app.get("/files/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    file = db.query(models.File).filter(
            models.File.id == file_id
            ).first()

    if not file:
        return {"error": "File not Found"}

    return FileResponse(
            path = file.storage_path,
            filename = file.filename
    )













