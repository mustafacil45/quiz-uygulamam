from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import Optional

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate a unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return public URL (assuming mounted at /static)
        # We return a relative path that frontend can prepend with API_BASE
        # Or better yet, we can't easily guess the full URL here without Request context, 
        # so let's return the relative path from root.
        
        return {"url": f"/static/uploads/{unique_filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
