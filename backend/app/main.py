import os
import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from app.routers import auth, quiz, rooms, questions, duel, leaderboard, stats, users

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ADMIN_STATIC_DIR = os.path.join(BASE_DIR, "static", "admin")

app = FastAPI(title="TrendQuiz Backend")

# Production'da ALLOWED_ORIGINS env ile kontrol edilir
# Örnek: ALLOWED_ORIGINS=https://trendquiz-admin.vercel.app,https://trendquiz.com
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()] if _origins_env else ["*"]

# Vercel preview domain'leri için regex desteği
# Örnek: ALLOWED_ORIGINS_REGEX=https://trendquiz-admin.*\.vercel\.app
_origins_regex = os.getenv("ALLOWED_ORIGINS_REGEX", "")

_cors_kwargs = {
    "allow_origins": ALLOWED_ORIGINS,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if _origins_regex:
    _cors_kwargs["allow_origin_regex"] = _origins_regex

app.add_middleware(CORSMiddleware, **_cors_kwargs)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(duel.router, prefix="/api/duel", tags=["duel"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

# New Upload Router
from app.routers import upload
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])

# Mount static for uploads
# Yüklenen görseller ayrı mount: UPLOAD_DIR kalıcı bir diske taşınsa da
# "/static/uploads/..." adresleri çalışmaya devam eder (sıra önemli).
from app.routers.upload import UPLOAD_DIR as _UPLOAD_DIR
app.mount("/static/uploads", StaticFiles(directory=_UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
async def startup_event():
    from app.database import engine, DATABASE_URL
    from app import models
    # Production'da Alembic migration kullanılır (Render pre-deploy: alembic upgrade head)
    # Geliştirmede (SQLite) create_all() ile hızlı tablo oluşturma
    if "sqlite" in DATABASE_URL:
        async with engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)



@app.get("/health")
async def health():
    from app.database import engine
    import time

    checks = {"api": "ok", "database": "unknown", "redis": "unknown"}

    # Database check
    try:
        async with engine.connect() as conn:
            await conn.execute(sa.text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {type(e).__name__}"

    # Redis check (non-critical)
    try:
        from app.ws_manager import manager
        await manager.init_redis()
        if manager.redis:
            await manager.redis.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "unavailable (fallback to local)"
    except Exception as e:
        checks["redis"] = f"error: {type(e).__name__}"

    overall = "ok" if checks["database"] == "ok" else "degraded"
    return {
        "status": overall,
        "version": "1.0.0",
        "checks": checks,
    }

# Mount Admin Panel Static Files (only if exported build exists)
# When admin panel is deployed to Vercel separately, these files won't exist on Render
if os.path.isdir(ADMIN_STATIC_DIR):
    _admin_next_dir = os.path.join(ADMIN_STATIC_DIR, "_next")
    if os.path.isdir(_admin_next_dir):
        app.mount("/admin/_next", StaticFiles(directory=_admin_next_dir), name="admin_next")

    @app.get("/admin/{rest_of_path:path}")
    async def serve_admin(rest_of_path: str):
        file_path = os.path.join(ADMIN_STATIC_DIR, rest_of_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        html_path = os.path.join(ADMIN_STATIC_DIR, f"{rest_of_path}.html")
        if os.path.isfile(html_path):
            return FileResponse(html_path)
        index_path = os.path.join(ADMIN_STATIC_DIR, rest_of_path, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        return FileResponse(os.path.join(ADMIN_STATIC_DIR, "index.html"))

    @app.get("/admin")
    async def admin_root():
        return FileResponse(os.path.join(ADMIN_STATIC_DIR, "index.html"))

