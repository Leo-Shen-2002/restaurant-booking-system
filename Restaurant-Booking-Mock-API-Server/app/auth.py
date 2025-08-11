from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "change_me_in_env"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def _create_token(data: dict, minutes: int = None, days: int = None, token_type: str = "access"):
    to_encode = data.copy()
    if minutes is not None:
        exp = datetime.utcnow() + timedelta(minutes=minutes)
    else:
        exp = datetime.utcnow() + timedelta(days=days or 7)
    to_encode.update({"exp": exp, "token_type": token_type})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(sub: str, user_type: str) -> str:
    return _create_token({"sub": sub, "user_type": user_type}, token_type="access", minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

def create_refresh_token(sub: str, user_type: str) -> str:
    return _create_token({"sub": sub, "user_type": user_type}, token_type="refresh", days=REFRESH_TOKEN_EXPIRE_DAYS)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None