import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import auth, quiz, rooms, questions, duel, leaderboard, stats, users

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ADMIN_STATIC_DIR = os.path.join(BASE_DIR, "static", "admin")

app = FastAPI(title="TrendQuiz Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
async def startup_event():
    from app.database import engine
    from app import models
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)



@app.get("/health")
async def health():
    return {"status": "ok"}

# Mount Admin Panel Static Files
# We mount at /admin
# But we need to handle SPA routing (if user goes to /admin/dashboard directly, it should serve index.html)

# Serve static assets (js, css, etc.)
app.mount("/admin/_next", StaticFiles(directory=os.path.join(ADMIN_STATIC_DIR, "_next")), name="admin_next")

# Fallback for SPA routing in admin panel
@app.get("/admin/{rest_of_path:path}")
async def serve_admin(rest_of_path: str):
    # Try to serve a file if it exists (e.g. favicon.ico)
    file_path = os.path.join(ADMIN_STATIC_DIR, rest_of_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Check if it corresponds to an HTML file (Next.js export structure)
    # e.g. /admin/login -> /admin/login.html
    html_path = os.path.join(ADMIN_STATIC_DIR, f"{rest_of_path}.html")
    if os.path.isfile(html_path):
         return FileResponse(html_path)

    # For directory indices like /admin/dashboard -> /admin/dashboard/index.html
    index_path = os.path.join(ADMIN_STATIC_DIR, rest_of_path, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    # Otherwise return root index.html (SPA fallback) - NOT actually ideal for Next.js static export
    # Next.js static export creates actual .html files for routes.
    # If route is /admin/dashboard, Next generates /admin/dashboard.html (or /admin/dashboard/index.html)
    # So we should rely on file existence mostly.
    
    # If nothing found, return 404 or redirect to /admin/
    return FileResponse(os.path.join(ADMIN_STATIC_DIR, "index.html"))

@app.get("/admin")
async def admin_root():
    return FileResponse(os.path.join(ADMIN_STATIC_DIR, "index.html"))
