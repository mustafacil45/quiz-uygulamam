from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import schemas, models
from app.database import get_db
from app.core import security
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.User).where((models.User.username == user.username) | (models.User.email == user.email)))
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = security.get_password_hash(user.password)
    new = models.User(username=user.username, email=user.email, hashed_password=hashed)
    db.add(new)
    await db.commit()
    await db.refresh(new)
    logger.info(f"New user registered: {new.username}")
    return new


@router.post("/token", response_model=schemas.Token)
async def token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Allow login with either username or email for convenience
    res = await db.execute(select(models.User).where((models.User.username == form_data.username) | (models.User.email == form_data.username)))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = security.create_access_token({"sub": user.username})
    refresh_token = security.create_refresh_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}


@router.post("/admin/token", response_model=schemas.Token)
async def admin_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.User).where((models.User.username == form_data.username) | (models.User.email == form_data.username)))
    user = res.scalar_one_or_none()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    if not security.is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    token_data = {"sub": user.username, "admin": True}
    access_token = security.create_access_token(token_data)
    refresh_token = security.create_refresh_token(token_data)
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}


@router.get("/admin/me", response_model=schemas.UserOut)
async def read_admin_me(current_user: models.User = Depends(security.get_current_admin)):
    return current_user


@router.post("/refresh", response_model=schemas.Token)
async def refresh(payload: dict, db: AsyncSession = Depends(get_db)):
    # expects {"refresh_token": "..."}
    token = payload.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token required")
    try:
        data = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = data.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    res = await db.execute(select(models.User).where(models.User.username == username))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access_token = security.create_access_token({"sub": user.username})
    refresh_token = security.create_refresh_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}
