"""The worker: drains the outbox (outgoing calls, stored webhooks). Run with `python -m app.worker` (add `--once` to drain and exit).

It connects with its own credentials (CREWBOARD_WORKER_DATABASE_URL, the owner role by default) because it works
across tenants. Jobs are claimed with SELECT ... FOR UPDATE SKIP LOCKED so several workers can run side by side.
Failed jobs retry with backoff (1, 2, 4, 8 minutes) and stop after 5 attempts.

Every handler is a stub until its connector exists: it marks the job done so nothing piles up, and the stored
payload stays for when processing is built.
"""
from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.integrations.models import OutboxJob

MAX_ATTEMPTS = 5


async def _stub(job: OutboxJob) -> None:
    return None


HANDLERS = {"webhook.": _stub, "salesforce.": _stub, "message.": _stub}


def handler_for(kind: str):
    return next((h for p, h in HANDLERS.items() if kind.startswith(p)), None)


def worker_url() -> str:
    s = get_settings()
    return s.worker_database_url or s.migration_database_url.replace("+psycopg", "+asyncpg")


async def drain(sm, limit: int = 50) -> int:
    """Run up to `limit` due jobs. Returns how many ran."""
    n = 0
    while n < limit:
        async with sm() as s:
            async with s.begin():
                job = (await s.execute(select(OutboxJob).where(OutboxJob.status == "pending", OutboxJob.run_after <= datetime.now(timezone.utc))
                                       .order_by(OutboxJob.run_after).limit(1).with_for_update(skip_locked=True))).scalar_one_or_none()
                if job is None:
                    return n
                job.attempts += 1
                h = handler_for(job.kind)
                try:
                    if h is None:
                        raise RuntimeError(f"no handler for {job.kind}")
                    await h(job)
                    job.status, job.last_error = "done", None
                except Exception as e:  # noqa: BLE001 - a failed job must not stop the worker
                    job.last_error = str(e)[:500]
                    if job.attempts >= MAX_ATTEMPTS:
                        job.status = "failed"
                    else:
                        job.run_after = datetime.now(timezone.utc) + timedelta(minutes=2 ** (job.attempts - 1))
        n += 1
    return n


async def main(once: bool = False) -> None:
    eng = create_async_engine(worker_url(), pool_pre_ping=True)
    sm = async_sessionmaker(eng, expire_on_commit=False)
    try:
        while True:
            ran = await drain(sm)
            if once:
                return
            if not ran:
                await asyncio.sleep(2)
    finally:
        await eng.dispose()


if __name__ == "__main__":
    asyncio.run(main(once="--once" in sys.argv))
