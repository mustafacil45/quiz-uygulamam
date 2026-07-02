import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context

# ensure backend folder added to path so `app` package is importable
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine

from app.models import Base

config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

_raw_db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/trendquiz")

# Supabase/Render give "postgres[ql]://..." — need async driver prefix
if _raw_db_url.startswith("postgres://"):
    _raw_db_url = _raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_db_url.startswith("postgresql://") and "+asyncpg" not in _raw_db_url:
    _raw_db_url = _raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = _raw_db_url


def run_migrations_offline() -> None:
    url = DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
