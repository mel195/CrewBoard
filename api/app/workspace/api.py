"""Workspace export and import (WS-05). Owner only."""
from __future__ import annotations

import json
import re
from datetime import date

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from app.core.context import Ctx, require
from app.core.errors import AppError

from . import transfer

router = APIRouter(tags=["workspace"])
MAX_BYTES = 50 * 1024 * 1024


@router.get("/workspace/export", operation_id="workspace_export")
async def export(ctx: Ctx = Depends(require("owner"))):
    """The whole workspace as one JSON file (a backup you can load into an empty or demo workspace)."""
    data = await transfer.export(ctx)
    slug = re.sub(r"[^a-z0-9]+", "-", ctx.tenant.name.lower()).strip("-") or "workspace"
    fn = f"crewboard-{slug}-{date.today().isoformat()}.json"
    return JSONResponse(data, headers={"Content-Disposition": f'attachment; filename="{fn}"'})


@router.post("/workspace/import", operation_id="workspace_import")
async def import_(file: UploadFile = File(...), ctx: Ctx = Depends(require("owner"))):
    """Load an export. Only into an empty workspace or a demo workspace (a demo's data is replaced)."""
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise AppError(413, "file_too_large", "Workspace files can be up to 50 MB")
    try:
        data = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        raise AppError(422, "not_a_backup", "That file isn't a Crew Board workspace export")
    return await transfer.import_(ctx, data)
