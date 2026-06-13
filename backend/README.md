# TrendQuiz - Backend

FastAPI backend for TrendQuiz.

Folder: `app/` contains the FastAPI application.

Run locally (after installing requirements):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

CI / Migrations
---------------

This project uses Alembic for schema migrations. There is a GitHub Actions workflow at `/.github/workflows/alembic.yml` which runs Alembic against a temporary Postgres service.

Locally you can:

1. Create a virtualenv and install deps:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create the DB (quick dev):

```bash
python init_db.py
```

3. Create an Alembic revision (autogenerate):

```bash
# from repo root
cd backend
alembic -c alembic.ini revision --autogenerate -m "your message"
```

4. Apply migrations:

```bash
alembic -c alembic.ini upgrade head
# or use helper script
./scripts/migrate.sh
```

In CI (GitHub Actions) the workflow will:
- check out the repo
- start a Postgres service
- install backend deps
- run `alembic -c alembic.ini upgrade head`

Makefile targets are provided under `backend/Makefile` for convenience (`make -C backend migrate`, `make -C backend init-db`).

