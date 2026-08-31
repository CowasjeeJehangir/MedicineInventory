from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from db import get_db
from auth.dependencies import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user
)
from models.staff import Staff, Credentials
from schemas.schemas import Token, LoginRequest, StaffResponse

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint using OAuth2 password flow"""
    credential = db.query(Credentials).filter(
        Credentials.account_id == form_data.username
    ).first()
    
    if not credential or not verify_password(form_data.password, credential.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect account ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": credential.account_id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/json", response_model=Token)
async def login_json(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Alternative login endpoint accepting JSON"""
    credential = db.query(Credentials).filter(
        Credentials.account_id == login_data.account_id
    ).first()
    
    if not credential or not verify_password(login_data.password, credential.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect account ID or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": credential.account_id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=StaffResponse)
async def get_current_user_info(current_user: Staff = Depends(get_current_user)):
    """Get current logged-in user information"""
    return current_user

@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for current user"""
    credential = db.query(Credentials).filter(
        Credentials.staff_id == current_user.id
    ).first()
    
    if not credential or not verify_password(old_password, credential.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    credential.password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
