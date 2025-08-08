from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: Literal["customer", "restaurant"]

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: Literal["customer", "restaurant"]
    # customer fields
    first_name: Optional[str] = None
    surname: Optional[str] = None
    # restaurant fields
    name: Optional[str] = None   # restaurant name

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str