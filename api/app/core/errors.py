"""RFC 9457 problem+json errors with stable codes (Phase 2, tab 2: Error conditions)."""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm.exc import StaleDataError

TITLES = {
    400: "Bad request", 401: "Not signed in", 403: "Not allowed", 404: "Not found", 409: "Conflict",
    422: "Can't do that", 428: "Precondition required", 429: "Too many requests", 503: "Unavailable",
}


class AppError(Exception):
    def __init__(self, status: int, code: str, detail: str, **extra: Any):
        self.status, self.code, self.detail, self.extra = status, code, detail, extra


def not_found(what: str = "Resource") -> AppError:
    return AppError(404, "not_found", f"{what} not found")


def problem(status: int, code: str, detail: str, **extra: Any) -> JSONResponse:
    body = {"type": f"https://crewboard.app/problems/{code}", "title": TITLES.get(status, "Error"), "status": status,
            "code": code, "detail": detail, **extra}
    return JSONResponse(body, status_code=status, media_type="application/problem+json")


def install(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, e: AppError):
        return problem(e.status, e.code, e.detail, **e.extra)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, e: RequestValidationError):
        errors = [{"field": ".".join(str(p) for p in err["loc"][1:]), "message": err["msg"]} for err in e.errors()]
        return problem(422, "validation_failed", "Some fields aren't valid", errors=errors)

    @app.exception_handler(StaleDataError)
    async def _stale(_: Request, e: StaleDataError):
        return problem(409, "version_conflict", "Someone else changed this. Reload and try again.")
