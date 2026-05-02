"""
admin_auth.py — Simple secret-key guard for all admin endpoints.

How it works:
  Every admin request must include the header:
    X-Admin-Key: <your secret>

  The secret is set via the ADMIN_SECRET_KEY env var.
  If the var is not set, admin endpoints are DISABLED entirely
  (returns 503) so you can't accidentally expose them on a
  misconfigured deploy.

Usage (FastAPI dependency):
  from admin_auth import require_admin
  @router.post("/apps", dependencies=[Depends(require_admin)])
"""

from fastapi import Header, HTTPException, Depends
from config import get_settings


def require_admin(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    settings = get_settings()

    if not settings.admin_secret_key:
        raise HTTPException(
            status_code=503,
            detail="Admin access is not configured on this server."
        )

    if x_admin_key != settings.admin_secret_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin key."
        )
