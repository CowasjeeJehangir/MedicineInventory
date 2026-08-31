from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from auth.dependencies import get_current_user, require_admin
from models.patient import Ward
from models.staff import Staff
from schemas.schemas import WardCreate, WardUpdate, WardResponse, WardWithPatients

router = APIRouter()

@router.post("/", response_model=WardResponse, status_code=status.HTTP_201_CREATED)
async def create_ward(
    ward_data: WardCreate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Create a new ward (Admin only)"""
    # Check if ward code already exists
    if db.query(Ward).filter(Ward.ward_code == ward_data.ward_code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ward with this code already exists"
        )
    
    new_ward = Ward(**ward_data.model_dump())
    db.add(new_ward)
    db.commit()
    db.refresh(new_ward)
    
    return new_ward

@router.get("/", response_model=List[WardResponse])
async def get_all_wards(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get all wards"""
    wards = db.query(Ward).offset(skip).limit(limit).all()
    return wards

@router.get("/{ward_id}", response_model=WardWithPatients)
async def get_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get ward by ID with patients"""
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )
    return ward

@router.put("/{ward_id}", response_model=WardResponse)
async def update_ward(
    ward_id: int,
    ward_data: WardUpdate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Update ward (Admin only)"""
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )
    
    update_data = ward_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ward, field, value)
    
    db.commit()
    db.refresh(ward)
    return ward

@router.delete("/{ward_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Delete ward (Admin only)"""
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )
    
    # Check if ward has patients
    if ward.patients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete ward with patients. Reassign patients first."
        )
    
    db.delete(ward)
    db.commit()
    
    return None
