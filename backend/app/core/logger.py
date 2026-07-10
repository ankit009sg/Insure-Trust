import logging
import logging.handlers
import os
from datetime import datetime

# Create logs directory at project root
LOGS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "logs"
)
os.makedirs(LOGS_DIR, exist_ok=True)

# --- Backend API Logger ---
_backend_log_path = os.path.join(LOGS_DIR, "backend.log")

backend_logger = logging.getLogger("insureverify.backend")
backend_logger.setLevel(logging.DEBUG)

if not backend_logger.handlers:
    # Rotating file handler: max 5 MB per file, keep last 5 files
    file_handler = logging.handlers.RotatingFileHandler(
        _backend_log_path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)

    # Console handler (visible in uvicorn terminal output)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    backend_logger.addHandler(file_handler)
    backend_logger.addHandler(console_handler)
    backend_logger.propagate = False  # Avoid duplicate uvicorn logs

# --- Frontend Event Logger ---
_frontend_log_path = os.path.join(LOGS_DIR, "frontend.log")

frontend_logger = logging.getLogger("insureverify.frontend")
frontend_logger.setLevel(logging.DEBUG)

if not frontend_logger.handlers:
    fe_file_handler = logging.handlers.RotatingFileHandler(
        _frontend_log_path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    fe_file_handler.setLevel(logging.DEBUG)
    fe_formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | FRONTEND | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    fe_file_handler.setFormatter(fe_formatter)
    frontend_logger.addHandler(fe_file_handler)
    frontend_logger.propagate = False

def get_backend_logger():
    return backend_logger

def get_frontend_logger():
    return frontend_logger
