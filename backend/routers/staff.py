from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from auth.dependencies import get_current_user, require_admin, get_password_hash
from models.staff import Staff, Credentials
from schemas.schemas import StaffCreate, StaffUpdate, StaffResponse, StaffWithCredentials

router = APIRouter()

@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Create a new staff member (Admin only)"""
    # Check if CNIC already exists
    if db.query(Staff).filter(Staff.cnic == staff_data.cnic).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff with this CNIC already exists"
        )
    
    # Check if account_id already exists
    if db.query(Credentials).filter(Credentials.account_id == staff_data.account_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account ID already exists"
        )
    
    # Create staff
    new_staff = Staff(
        cnic=staff_data.cnic,
        name=staff_data.name,
        phone_number=staff_data.phone_number,
        designation=staff_data.designation
    )
    db.add(new_staff)
    db.flush()  # Get the staff.id
    
    # Create credentials
    hashed_password = get_password_hash(staff_data.password)
    credentials = Credentials(
        staff_id=new_staff.id,
        account_id=staff_data.account_id,
        password=hashed_password
    )
    db.add(credentials)
    db.commit()
    db.refresh(new_staff)
    
    return new_staff

@router.get("/", response_model=List[StaffResponse])
async def get_all_staff(
    skip: int = 0,
    limit: int = 100,
    designation: str = None,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get all staff members with optional filtering"""
    query = db.query(Staff)
    
    if designation:
        query = query.filter(Staff.designation.ilike(f"%{designation}%"))
    
    staff = query.offset(skip).limit(limit).all()
    return staff

@router.get("/{staff_id}", response_model=StaffWithCredentials)
async def get_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get staff member by ID"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Include account_id if viewing own profile or admin
    response = StaffWithCredentials.model_validate(staff)
    if current_user.id == staff_id or current_user.designation.lower() in ["admin", "administrator"]:
        credential = db.query(Credentials).filter(Credentials.staff_id == staff_id).first()
        if credential:
            response.account_id = credential.account_id
    
    return response

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Update staff member (Admin only)"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    update_data = staff_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(staff, field, value)
    
    db.commit()
    db.refresh(staff)
    return staff

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Delete staff member (Admin only)"""
    if staff_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Delete credentials first
    db.query(Credentials).filter(Credentials.staff_id == staff_id).delete()
    db.delete(staff)
    db.commit()
    
    return None
