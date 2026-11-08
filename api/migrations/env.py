from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import get_settings
from app.models import SCHEMAS, Base

target_metadata = Base.metadata


def include_name(name, type_, parent_names):
    if type_ == "schema":
        return name in SCHEMAS
    return True


def run_migrations_online() -> None:
    engine = create_engine(get_settings().migration_database_url, poolclass=pool.NullPool)
    with engine.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata, include_schemas=True, include_name=include_name,
                          version_table_schema="public")
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
