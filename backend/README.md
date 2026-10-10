# TrendQuiz - Backend

FastAPI backend for TrendQuiz.

Folder: `app/` contains the FastAPI application.

Requires Python 3.11+ (3.12 recommended locally; Docker/CI use 3.11).

Setup (from `backend/`):

```bash
make venv            # python3.12 -m venv venv && pip install -r requirements.txt
make run             # uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or manually:

```bash
python3.12 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Without `DATABASE_URL` the app uses SQLite (`backend/dev.db`) and creates
tables on startup. Set `DATABASE_URL=postgresql://...` for Postgres (Alembic
migrations are used there, see below). Redis is optional; without `REDIS_URL`
the app falls back to in-memory state.

Note: if you move or rename the project folder, the venv breaks (its scripts
hardcode the absolute path). Delete `venv/` and run `make venv` again.

Note: `create_all()` only creates missing tables; it never adds columns to an
existing `dev.db`. After a model change, either delete `dev.db` (fresh start)
or apply the migration to it:

```bash
DATABASE_URL="sqlite+aiosqlite:///$PWD/dev.db" venv/bin/alembic -c alembic.ini upgrade head
# first time only, if dev.db predates alembic: ... alembic -c alembic.ini stamp <last applied revision>
```

CI / Migrations
---------------

This project uses Alembic for schema migrations. There is a GitHub Actions workflow at `/.github/workflows/alembic.yml` which runs Alembic against a temporary Postgres service.

Locally you can:

1. Create the DB (quick dev):

```bash
python init_db.py
```

2. Create an Alembic revision (autogenerate):

```bash
alembic -c alembic.ini revision --autogenerate -m "your message"
```

3. Apply migrations:

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

Makefile targets are provided under `backend/Makefile` for convenience (`make -C backend migrate`, `make -C backend init-db`, `make -C backend alembic-rev MIGRATION_MSG="..."`).
