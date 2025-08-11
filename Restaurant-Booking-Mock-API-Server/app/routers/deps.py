from typing import Dict, Literal, TypedDict
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.auth import decode_token

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

class CurrentUser(TypedDict, total=False):
    sub: str                 # the email (subject)
    user_type: Literal["customer", "restaurant"]
    token_type: Literal["access", "refresh"]

def get_current_user(token: str = Depends(oauth2)) -> CurrentUser:
    """
    Accepts the bearer token from the Authorization header, decodes it,
    ensures it's a valid *access* token, and returns its claims.
    """
    payload: Dict | None = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("token_type") != "access":
        # Make sure refresh tokens cannot be used on protected endpoints
        raise HTTPException(status_code=401, detail="Access token required")

    if "sub" not in payload or "user_type" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # You can return the payload directly; TypedDict helps with editor hints.
    return {
        "sub": payload["sub"],
        "user_type": payload["user_type"],
        "token_type": payload["token_type"],
    }

def require_user_type(*allowed: Literal["customer", "restaurant"]):
    """
    Dependency factory: require that the current user has one of the allowed roles.
    Usage:
        @router.get("/restaurant/only")
        def handler(current = Depends(require_user_type("restaurant"))):
            ...
    """
    def dep(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current["user_type"] not in allowed:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current
    return dep