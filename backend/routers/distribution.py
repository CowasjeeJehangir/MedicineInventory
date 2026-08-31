from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, date
from db import get_db
from auth.dependencies import get_current_user
from models.inventory import DistributionLog, Inventory
from models.patient import Patient
from models.medicine import Medicine, MedicineBatch
from models.staff import Staff
from schemas.schemas import (
    DistributionLogCreate, DistributionLogResponse,
    DistributionLogDetailResponse
)

router = APIRouter()

@router.post("/", response_model=DistributionLogResponse, status_code=status.HTTP_201_CREATED)
async def create_distribution(
    distribution_data: DistributionLogCreate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Distribute medicine to a patient"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == distribution_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify inventory exists and has sufficient quantity
    inventory = db.query(Inventory).filter(Inventory.id == distribution_data.inventory_id).first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    if inventory.available_quantity < distribution_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient quantity. Available: {inventory.available_quantity}, Requested: {distribution_data.quantity}"
        )
    
    # Check if medicine requires prescription
    batch = db.query(MedicineBatch).filter(MedicineBatch.id == inventory.med_batch_id).first()
    medicine = db.query(Medicine).filter(Medicine.id == batch.med_id).first()
    
    if medicine.needs_prescription:
        # In a real system, you might check if patient has a valid prescription
        # For now, we'll just log it
        pass
    
    # Create distribution log
    new_distribution = DistributionLog(
        patient_id=distribution_data.patient_id,
        staff_id=current_user.id,
        inventory_id=distribution_data.inventory_id,
        quantity=distribution_data.quantity,
        date_given=datetime.now(),
        notes=distribution_data.notes
    )
    db.add(new_distribution)
    
    # Update inventory
    inventory.available_quantity -= distribution_data.quantity
    
    db.commit()
    db.refresh(new_distribution)
    
    return new_distribution

@router.get("/", response_model=List[DistributionLogDetailResponse])
async def get_distributions(
    skip: int = 0,
    limit: int = 100,
    patient_id: int = None,
    staff_id: int = None,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get distribution logs with optional filtering"""
    query = db.query(
        DistributionLog,
        Patient.name.label('patient_name'),
        Staff.name.label('staff_name'),
        Medicine.name.label('medicine_name')
    ).join(
        Patient, DistributionLog.patient_id == Patient.id
    ).join(
        Staff, DistributionLog.staff_id == Staff.id
    ).join(
        Inventory, DistributionLog.inventory_id == Inventory.id
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    )
    
    if patient_id:
        query = query.filter(DistributionLog.patient_id == patient_id)
    
    if staff_id:
        query = query.filter(DistributionLog.staff_id == staff_id)
    
    if start_date:
        query = query.filter(func.date(DistributionLog.date_given) >= start_date)
    
    if end_date:
        query = query.filter(func.date(DistributionLog.date_given) <= end_date)
    
    results = query.order_by(DistributionLog.date_given.desc()).offset(skip).limit(limit).all()
    
    distribution_list = []
    for dist, patient_name, staff_name, medicine_name in results:
        item = DistributionLogDetailResponse.model_validate(dist)
        item.patient_name = patient_name
        item.staff_name = staff_name
        item.medicine_name = medicine_name
        distribution_list.append(item)
    
    return distribution_list

@router.get("/today", response_model=List[DistributionLogDetailResponse])
async def get_today_distributions(
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get today's distribution logs"""
    today = date.today()
    
    query = db.query(
        DistributionLog,
        Patient.name.label('patient_name'),
        Staff.name.label('staff_name'),
        Medicine.name.label('medicine_name')
    ).join(
        Patient, DistributionLog.patient_id == Patient.id
    ).join(
        Staff, DistributionLog.staff_id == Staff.id
    ).join(
        Inventory, DistributionLog.inventory_id == Inventory.id
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    ).filter(
        func.date(DistributionLog.date_given) == today
    ).order_by(DistributionLog.date_given.desc())
    
    results = query.all()
    
    distribution_list = []
    for dist, patient_name, staff_name, medicine_name in results:
        item = DistributionLogDetailResponse.model_validate(dist)
        item.patient_name = patient_name
        item.staff_name = staff_name
        item.medicine_name = medicine_name
        distribution_list.append(item)
    
    return distribution_list

@router.get("/{distribution_id:int}", response_model=DistributionLogDetailResponse)
async def get_distribution(
    distribution_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get specific distribution log"""
    result = db.query(
        DistributionLog,
        Patient.name.label('patient_name'),
        Staff.name.label('staff_name'),
        Medicine.name.label('medicine_name')
    ).join(
        Patient, DistributionLog.patient_id == Patient.id
    ).join(
        Staff, DistributionLog.staff_id == Staff.id
    ).join(
        Inventory, DistributionLog.inventory_id == Inventory.id
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    ).filter(
        DistributionLog.id == distribution_id
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distribution log not found"
        )
    
    dist, patient_name, staff_name, medicine_name = result
    item = DistributionLogDetailResponse.model_validate(dist)
    item.patient_name = patient_name
    item.staff_name = staff_name
    item.medicine_name = medicine_name
    
    return item

@router.get("/patient/{patient_id}/history", response_model=List[DistributionLogDetailResponse])
async def get_patient_distribution_history(
    patient_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get distribution history for a specific patient"""
    query = db.query(
        DistributionLog,
        Patient.name.label('patient_name'),
        Staff.name.label('staff_name'),
        Medicine.name.label('medicine_name')
    ).join(
        Patient, DistributionLog.patient_id == Patient.id
    ).join(
        Staff, DistributionLog.staff_id == Staff.id
    ).join(
        Inventory, DistributionLog.inventory_id == Inventory.id
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    ).filter(
        DistributionLog.patient_id == patient_id
    ).order_by(DistributionLog.date_given.desc()).offset(skip).limit(limit)
    
    results = query.all()
    
    distribution_list = []
    for dist, patient_name, staff_name, medicine_name in results:
        item = DistributionLogDetailResponse.model_validate(dist)
        item.patient_name = patient_name
        item.staff_name = staff_name
        item.medicine_name = medicine_name
        distribution_list.append(item)
    
    return distribution_list
