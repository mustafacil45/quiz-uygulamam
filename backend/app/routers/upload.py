from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import Optional

router = APIRouter()

# Render/Heroku gibi platformlarda dosya sistemi geçicidir: her deploy'da yüklenen
# görseller silinir. Kalıcı disk (ör. Render Disk) bağlanırsa UPLOAD_DIR env'i ile
# oraya yönlendirilir; verilen URL ("/static/uploads/...") değişmez.
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR = os.getenv("UPLOAD_DIR") or os.path.join(_BACKEND_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    # Soru görselleri ve profil fotoğrafları için kullanılır; yalnızca görsel kabul edilir
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    is_image_type = (file.content_type or "").startswith("image/")
    if not is_image_type and file_ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(status_code=415, detail="Yalnızca görsel dosyaları yüklenebilir")
    if file_ext not in ALLOWED_IMAGE_EXT:
        file_ext = ".jpg"
    try:
        # Generate a unique filename
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
