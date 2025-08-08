from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.auth import decode_token

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(payload: dict = Depends(lambda token=Depends(oauth2): decode_token(token))):
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload  # contains {'sub': email, 'type': 'customer'|'restaurant'}