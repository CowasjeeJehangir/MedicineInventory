from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from db import get_db
from auth.dependencies import get_current_user, require_pharmacist_or_admin
from models.medicine import Medicine, MedicineBatch
from models.inventory import Inventory
from models.staff import Staff
from schemas.schemas import (
    MedicineCreate, MedicineUpdate, MedicineResponse,
    MedicineBatchCreate, MedicineBatchUpdate, MedicineBatchResponse
)

router = APIRouter()

# ============= Medicine Endpoints =============
@router.post("/", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine(
    medicine_data: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_pharmacist_or_admin)
):
    """Create a new medicine (Pharmacist/Admin only)"""
    new_medicine = Medicine(**medicine_data.model_dump())
    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)
    
    return new_medicine

@router.get("/", response_model=List[MedicineResponse])
async def get_all_medicines(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    needs_prescription: bool = None,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get all medicines with optional filtering"""
    query = db.query(Medicine)
    
    if search:
        query = query.filter(Medicine.name.ilike(f"%{search}%"))
    
    if needs_prescription is not None:
        query = query.filter(Medicine.needs_prescription == needs_prescription)
    
    medicines = query.offset(skip).limit(limit).all()
    return medicines

@router.get("/low-stock", response_model=List[dict])
async def get_low_stock_medicines(
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get medicines with stock below restock threshold"""
    # Query to get total available quantity per medicine
    results = db.query(
        Medicine.id,
        Medicine.name,
        Medicine.restock_threshold,
        func.sum(Inventory.available_quantity).label('total_available')
    ).join(
        MedicineBatch, Medicine.id == MedicineBatch.med_id
    ).join(
        Inventory, MedicineBatch.id == Inventory.med_batch_id
    ).group_by(
        Medicine.id, Medicine.name, Medicine.restock_threshold
    ).having(
        func.sum(Inventory.available_quantity) < Medicine.restock_threshold
    ).all()
    
    return [
        {
            "medicine_id": r.id,
            "medicine_name": r.name,
            "total_available": r.total_available or 0,
            "restock_threshold": r.restock_threshold
        }
        for r in results
    ]

@router.get("/{medicine_id:int}", response_model=MedicineResponse)
async def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get medicine by ID"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    return medicine

@router.put("/{medicine_id:int}", response_model=MedicineResponse)
async def update_medicine(
    medicine_id: int,
    medicine_data: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_pharmacist_or_admin)
):
    """Update medicine (Pharmacist/Admin only)"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    update_data = medicine_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(medicine, field, value)
    
    db.commit()
    db.refresh(medicine)
    return medicine

@router.delete("/{medicine_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_pharmacist_or_admin)
):
    """Delete medicine (Pharmacist/Admin only)"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    db.delete(medicine)
    db.commit()
    
    return None

# ============= Medicine Batch Endpoints =============
@router.get("/{medicine_id:int}/batches", response_model=List[MedicineBatchResponse])
async def get_medicine_batches(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get all batches for a specific medicine"""
    batches = db.query(MedicineBatch).filter(
        MedicineBatch.med_id == medicine_id
    ).all()
    return batches

@router.get("/batches/{batch_id}", response_model=MedicineBatchResponse)
async def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get medicine batch by ID"""
    batch = db.query(MedicineBatch).filter(MedicineBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine batch not found"
        )
    return batch

@router.put("/batches/{batch_id}", response_model=MedicineBatchResponse)
async def update_batch(
    batch_id: int,
    batch_data: MedicineBatchUpdate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_pharmacist_or_admin)
):
    """Update medicine batch (Pharmacist/Admin only)"""
    batch = db.query(MedicineBatch).filter(MedicineBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine batch not found"
        )
    
    update_data = batch_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(batch, field, value)
    
    db.commit()
    db.refresh(batch)
    return batch
