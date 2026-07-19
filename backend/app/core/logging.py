"""Structured, environment-aware logging built on Loguru.

`configure_logging()` is called once on startup. It intercepts the stdlib
logging (used by uvicorn / SQLAlchemy) so everything flows through one sink
with consistent formatting — JSON in production, pretty colours in dev.
"""

from __future__ import annotations

import logging
import sys

from loguru import logger

from app.core.config import settings


class InterceptHandler(logging.Handler):
    """Route stdlib logging records into Loguru."""

    def emit(self, record: logging.LogRecord) -> None:  # noqa: D401
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def configure_logging() -> None:
    logger.remove()
    if settings.is_production:
        logger.add(sys.stdout, level="INFO", serialize=True, backtrace=False, diagnose=False)
    else:
        logger.add(
            sys.stdout,
            level="DEBUG",
            colorize=True,
            format=(
                "<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
            ),
        )

    logging.basicConfig(handlers=[InterceptHandler()], level=logging.INFO, force=True)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(name).handlers = [InterceptHandler()]
        logging.getLogger(name).propagate = False


__all__ = ["configure_logging", "logger"]
