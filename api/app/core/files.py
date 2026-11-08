"""File storage behind a small interface (DD-24). Local disk now; S3-compatible storage later."""
from __future__ import annotations

import pathlib
import uuid

from .config import get_settings


class LocalFileStore:
    def __init__(self, root: str):
        self.root = pathlib.Path(root)

    def put(self, tenant_id: uuid.UUID, data: bytes, suffix: str = "") -> str:
        key = f"{tenant_id}/{uuid.uuid4()}{suffix}"
        p = self.root / key
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        return key

    def get(self, key: str) -> bytes:
        return (self.root / key).read_bytes()


def file_store() -> LocalFileStore:
    return LocalFileStore(get_settings().file_store_dir)
