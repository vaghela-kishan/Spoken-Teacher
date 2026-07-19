"""Add avatar_style to user_settings.

Revision ID: 0002
Revises: 0001
Create Date: 2026-01-02 00:00:00
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(col["name"] == column for col in inspector.get_columns(table))


def upgrade() -> None:
    # The 0001 baseline builds the schema from current ORM metadata, which
    # already includes `avatar_style`. Guard so a fresh deploy doesn't fail with
    # a duplicate-column error, while an older DB missing the column still gets it.
    if not _has_column("user_settings", "avatar_style"):
        op.add_column(
            "user_settings",
            sa.Column(
                "avatar_style", sa.String(length=20), nullable=False, server_default="female"
            ),
        )


def downgrade() -> None:
    if _has_column("user_settings", "avatar_style"):
        op.drop_column("user_settings", "avatar_style")
