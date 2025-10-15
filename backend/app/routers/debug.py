from fastapi import APIRouter, Request, Depends
from typing import Any, Dict
from app.dependencies import get_current_user_optional

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/headers")
async def debug_headers(request: Request, current_user=Depends(get_current_user_optional)) -> Dict[str, Any]:
    """Development-only endpoint that returns the incoming request headers
    and the optional current user decoded from the Authorization header.

    NOTE: This endpoint should only be used in local/dev environments.
    """
    headers = dict(request.headers)
    user_info = None
    if current_user:
        # current_user may be a dict-like user object from the DB layer
        try:
            user_info = {
                "id": getattr(current_user, "id", None) or current_user.get("id"),
                "role": getattr(current_user, "role", None) or current_user.get("role"),
            }
        except Exception:
            user_info = str(current_user)

    return {"headers": headers, "current_user": user_info}
