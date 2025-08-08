from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.models import Customer, Restaurant
from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
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
        token = create_access_token({"sub": user.email, "type": "customer"})
        return TokenResponse(access_token=token, user_type="customer")

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
        token = create_access_token({"sub": rest.email, "type": "restaurant"})
        return TokenResponse(access_token=token, user_type="restaurant")

    raise HTTPException(status_code=400, detail="Invalid user_type")

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if data.user_type == "customer":
        user = db.query(Customer).filter(Customer.email == data.email).first()
    else:
        user = db.query(Restaurant).filter(Restaurant.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email, "type": data.user_type})
    return TokenResponse(access_token=token, user_type=data.user_type)