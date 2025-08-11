from fastapi import APIRouter, HTTPException, Depends, Response, Cookie
from sqlalchemy.orm import Session
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.models import Customer, Restaurant
from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if data.user_type == "customer":
        if db.query(Customer).filter(Customer.email == data.email).first():
            raise HTTPException(status_code=400, detail="Customer already exists")
        if not data.first_name or not data.surname:
            raise HTTPException(status_code=400, detail="first_name and surname required for customer")

        user = Customer(
            email=data.email,
            first_name=data.first_name,
            surname=data.surname,
            hashed_password=hash_password(data.password),
        )
        db.add(user)
        db.commit()
        claims = {"sub": user.email, "type": "customer"}
        
        access = create_access_token(sub=user.email, user_type="customer")
        refresh = create_refresh_token(sub=user.email, user_type="customer")
        response.set_cookie(
            key="rb_refresh", value=refresh,
            httponly=True, samesite="lax", secure=False  # secure=True in prod
        )
        return TokenResponse(access_token=access, user_type="customer")

    elif data.user_type == "restaurant":
        if not data.name:
            raise HTTPException(status_code=400, detail="name required for restaurant")
        if db.query(Restaurant).filter(Restaurant.email == data.email).first():
            raise HTTPException(status_code=400, detail="Restaurant email already exists")
        if db.query(Restaurant).filter(Restaurant.name == data.name).first():
            raise HTTPException(status_code=400, detail="Restaurant name already exists")

        rest = Restaurant(
            name=data.name,
            microsite_name=data.name,
            email=data.email,
            hashed_password=hash_password(data.password),
        )
        db.add(rest)
        db.commit()

        access = create_access_token(sub=rest.email, user_type="restaurant")
        refresh = create_refresh_token(sub=rest.email, user_type="restaurant")
        response.set_cookie(
            key="rb_refresh", value=refresh,
            httponly=True, samesite="lax", secure=False
        )
        return TokenResponse(access_token=access, user_type="restaurant")


    raise HTTPException(status_code=400, detail="Invalid user_type")

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    if data.user_type == "customer":
        user = db.query(Customer).filter(Customer.email == data.email).first()
    else:
        user = db.query(Restaurant).filter(Restaurant.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(sub=user.email, user_type=data.user_type)
    refresh = create_refresh_token(sub=user.email, user_type=data.user_type)
    response.set_cookie(
        key="rb_refresh", value=refresh,
        httponly=True, samesite="lax", secure=False
    )
    return TokenResponse(access_token=access, user_type=data.user_type)

@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, rb_refresh: str | None = Cookie(default=None)):
    if not rb_refresh:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = decode_token(rb_refresh)
    if not payload or payload.get("token_type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    sub = payload.get("sub")
    user_type = payload.get("user_type")
    if not sub or not user_type:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Issue new access (and optionally rotate refresh)
    new_access = create_access_token(sub=sub, user_type=user_type)

    # (Optional but recommended) rotate refresh:
    new_refresh = create_refresh_token(sub=sub, user_type=user_type)
    response.set_cookie(
        key="rb_refresh", value=new_refresh,
        httponly=True, samesite="none", secure=True
    )

    return TokenResponse(access_token=new_access, user_type=user_type)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="rb_refresh",
        samesite="none",
        secure=True,     # match how you set it
        httponly=True,
    )
    return {"ok": True}

@router.get("/me")
def me(current=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Return the authenticated user's profile based on the access token.
    Expects `Authorization: Bearer <access_token>` header.
    """
    # your get_current_user returns the decoded payload or raises
    email = current.get("sub")
    user_type = current.get("user_type") or current.get("type")
    if not email or not user_type:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    if user_type == "customer":
        user = db.query(Customer).filter(Customer.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "email": user.email,
            "user_type": "customer",
            "first_name": user.first_name,
            "surname": user.surname,
            "created_at": user.created_at,
        }

    elif user_type == "restaurant":
        rest = db.query(Restaurant).filter(Restaurant.email == email).first()
        if not rest:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "email": rest.email,
            "user_type": "restaurant",
            "name": rest.name,
            "microsite_name": rest.microsite_name,
            "created_at": rest.created_at,
        }

    raise HTTPException(status_code=401, detail="Unsupported user type")