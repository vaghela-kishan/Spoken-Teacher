"""Transactional email service (async SMTP).

In development (or when SMTP isn't configured) emails are logged to the console
instead of being sent, so verification/reset flows are testable offline — the
token link is printed for you to click.
"""

from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings
from app.core.logging import logger


def _wrap(title: str, body_html: str, cta_text: str, cta_url: str) -> str:
    return f"""\
<!doctype html><html><body style="margin:0;background:#0f172a;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="480" style="background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px;text-align:center">
        <span style="font-size:22px;font-weight:800;color:#fff">🎙️ AI English Tutor</span>
      </td></tr>
      <tr><td style="padding:32px">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">{title}</h1>
        <p style="color:#475569;line-height:1.6;font-size:15px">{body_html}</p>
        <div style="text-align:center;margin:28px 0">
          <a href="{cta_url}" style="background:#6366f1;color:#fff;text-decoration:none;
             padding:12px 28px;border-radius:10px;font-weight:600;display:inline-block">{cta_text}</a>
        </div>
        <p style="color:#94a3b8;font-size:12px">If the button doesn't work, paste this link:<br>{cta_url}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>"""


async def _send(to: str, subject: str, html: str) -> None:
    if not settings.emails_enabled:
        logger.info(f"[EMAIL:dev] To={to} | {subject}\n{html[:200]}...")
        return
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content("Please view this email in an HTML-capable client.")
    msg.add_alternative(html, subtype="html")
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Sent '{subject}' to {to}")
    except Exception as exc:  # pragma: no cover
        logger.error(f"Failed to send email to {to}: {exc}")


async def send_verification_email(to: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = _wrap(
        "Verify your email",
        "Welcome aboard! Confirm your email to start speaking with Aria, your AI English tutor.",
        "Verify email",
        url,
    )
    await _send(to, "Verify your email — AI English Tutor", html)


async def send_reset_email(to: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = _wrap(
        "Reset your password",
        "We received a request to reset your password. This link expires in 2 hours. "
        "If you didn't request it, you can safely ignore this email.",
        "Reset password",
        url,
    )
    await _send(to, "Reset your password — AI English Tutor", html)
