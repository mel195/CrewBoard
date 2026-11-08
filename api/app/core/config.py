from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CREWBOARD_", env_file=".env", extra="ignore")

    env: str = "dev"  # dev | test | staging | prod
    # The app connects as a non-superuser role so row-level security applies.
    database_url: str = "postgresql+asyncpg://crewboard_app:crewboard_app@localhost:5432/crewboard"
    # Used by Alembic (sync driver). Runs as the owner role that creates tables and policies.
    migration_database_url: str = "postgresql+psycopg://crewboard:crewboard@localhost:5432/crewboard"
    # Auth: "dev" trusts an X-Dev-User header (local and tests only). "oidc" validates bearer tokens (TQ-01).
    auth_mode: str = "dev"
    oidc_issuer: str | None = None
    oidc_audience: str | None = None
    # Uploaded estimates (local disk until object storage is set up, DD-24)
    file_store_dir: str = ".data/files"
    # Estimate reading with Claude (DD-23). Without a key, the built-in rules reader is used.
    anthropic_api_key: str | None = None
    reader_model: str = "claude-haiku-4-5-20251001"
    # The outbox worker works across tenants, so it uses its own role (the owner role by default).
    worker_database_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
