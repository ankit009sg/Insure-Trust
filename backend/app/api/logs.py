from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from backend.app.core.logger import get_frontend_logger

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])
logger = get_frontend_logger()


class FrontendLogEntry(BaseModel):
    level: str          # "info" | "warn" | "error"
    method: Optional[str] = None   # GET, POST, etc.
    url: str
    status: Optional[int] = None
    duration_ms: Optional[float] = None
    message: Optional[str] = None
    error: Optional[str] = None
    user_email: Optional[str] = None


@router.post("", status_code=204)
async def receive_frontend_log(entry: FrontendLogEntry, request: Request):
    """
    Receives structured log events from the React frontend (Axios interceptors)
    and writes them to logs/frontend.log on the server.
    """
    level = entry.level.lower()
    parts = []

    if entry.method and entry.url:
        parts.append(f"{entry.method} {entry.url}")
    elif entry.url:
        parts.append(entry.url)

    if entry.status is not None:
        parts.append(f"status={entry.status}")

    if entry.duration_ms is not None:
        parts.append(f"duration={entry.duration_ms:.1f}ms")

    if entry.user_email:
        parts.append(f"user={entry.user_email}")

    if entry.message:
        parts.append(f"msg={entry.message}")

    if entry.error:
        parts.append(f"error={entry.error}")

    log_line = " | ".join(parts) if parts else "(empty log)"

    if level == "error":
        logger.error(log_line)
    elif level == "warn":
        logger.warning(log_line)
    else:
        logger.info(log_line)
