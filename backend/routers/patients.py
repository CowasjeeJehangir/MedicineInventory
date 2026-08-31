from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import String
from typing import List
from db import get_db
from auth.dependencies import get_current_user
from models.patient import Patient, Ward
from models.staff import Staff
from schemas.schemas import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter()

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Create a new patient"""
    # Check if CNIC already exists when supplied
    if patient_data.cnic and db.query(Patient).filter(Patient.cnic == patient_data.cnic).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient with this CNIC already exists"
        )
    
    patient_payload = patient_data.model_dump(exclude={"ward_code"})
    if patient_data.ward_code and not patient_payload.get("ward_id"):
        ward = db.query(Ward).filter(Ward.ward_code == patient_data.ward_code).first()
        if not ward:
            ward = Ward(ward_code=patient_data.ward_code)
            db.add(ward)
            db.flush()
        patient_payload["ward_id"] = ward.id

    new_patient = Patient(**patient_payload)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return new_patient

@router.get("/", response_model=List[PatientResponse])
async def get_all_patients(
    skip: int = 0,
    limit: int = 100,
    ward_id: int = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get all patients with optional filtering"""
    query = db.query(Patient)
    
    if ward_id:
        query = query.filter(Patient.ward_id == ward_id)
    
    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%")) |
            (Patient.cnic.cast(String).ilike(f"%{search}%"))
        )
    
    patients = query.offset(skip).limit(limit).all()
    return patients

@router.get("/{patient_id:int}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient

@router.get("/cnic/{cnic}", response_model=PatientResponse)
async def get_patient_by_cnic(
    cnic: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get patient by CNIC"""
    patient = db.query(Patient).filter(Patient.cnic == cnic).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient

@router.put("/{patient_id:int}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Update patient information"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Delete patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    db.delete(patient)
    db.commit()
    
    return None
