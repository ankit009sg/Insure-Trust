import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from backend.app.core.logger import get_backend_logger

logger = get_backend_logger()

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every HTTP request and response:
      - Method, path, query string
      - Client IP
      - Response status code
      - Duration in milliseconds
      - Authenticated user email (if Bearer token is present and parseable)
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        # Try to extract user identity from Authorization header without fully verifying
        user_hint = self._extract_user_hint(request)

        # Log incoming request
        logger.info(
            f"→ REQUEST  | {request.method:6s} {request.url.path}"
            + (f"?{request.url.query}" if request.url.query else "")
            + f" | client={request.client.host if request.client else 'unknown'}"
            + (f" | user={user_hint}" if user_hint else "")
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"✗ ERROR    | {request.method:6s} {request.url.path}"
                f" | {duration_ms:.1f}ms | EXCEPTION: {type(exc).__name__}: {exc}"
            )
            raise

        duration_ms = (time.perf_counter() - start_time) * 1000

        # Choose log level by status code
        status = response.status_code
        if status < 300:
            log_fn = logger.info
            icon = "✓"
        elif status < 400:
            log_fn = logger.info
            icon = "→"
        elif status < 500:
            log_fn = logger.warning
            icon = "⚠"
        else:
            log_fn = logger.error
            icon = "✗"

        log_fn(
            f"{icon} RESPONSE | {request.method:6s} {request.url.path}"
            f" | {status} | {duration_ms:.1f}ms"
            + (f" | user={user_hint}" if user_hint else "")
        )

        return response

    def _extract_user_hint(self, request: Request) -> str | None:
        """
        Decodes the JWT payload WITHOUT signature verification just to extract
        the 'sub' (email) for log readability. Not used for auth decisions.
        """
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ", 1)[1]
        try:
            import base64, json
            # JWT is three base64-encoded segments separated by '.'
            payload_b64 = token.split(".")[1]
            # Pad to make base64 valid
            payload_b64 += "=" * (-len(payload_b64) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            return payload.get("sub", None)
        except Exception:
            return None
