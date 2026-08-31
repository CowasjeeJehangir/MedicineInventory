from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from db import get_db
from auth.dependencies import require_admin
from models.inventory import RestockLog, Inventory
from models.medicine import Medicine, MedicineBatch
from models.staff import Staff
from schemas.schemas import (
    RestockLogCreate, RestockLogResponse,
    RestockLogDetailResponse
)

router = APIRouter()

@router.post("/", response_model=RestockLogResponse, status_code=status.HTTP_201_CREATED)
async def create_restock(
    restock_data: RestockLogCreate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Create a restock entry (Admin only)"""
    # Verify medicine exists
    medicine = db.query(Medicine).filter(Medicine.id == restock_data.med_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Check if batch already exists
    existing_batch = db.query(MedicineBatch).filter(
        MedicineBatch.med_id == restock_data.med_id,
        MedicineBatch.batch_no == restock_data.batch_no
    ).first()
    
    if existing_batch:
        # Update existing batch
        medicine_batch = existing_batch
        medicine_batch.total_count = (medicine_batch.total_count or 0) + restock_data.quantity_added
        
        # Update batch details if provided
        if restock_data.best_before:
            medicine_batch.best_before = restock_data.best_before
        if restock_data.particulars_b is not None:
            medicine_batch.particulars_b = restock_data.particulars_b
        if restock_data.particulars_f is not None:
            medicine_batch.particulars_f = restock_data.particulars_f
        if restock_data.particulars_t is not None:
            medicine_batch.particulars_t = restock_data.particulars_t
    else:
        # Create new batch
        medicine_batch = MedicineBatch(
            batch_no=restock_data.batch_no,
            med_id=restock_data.med_id,
            restock_date=datetime.now(),
            total_count=restock_data.quantity_added,
            best_before=restock_data.best_before,
            particulars_b=restock_data.particulars_b,
            particulars_f=restock_data.particulars_f,
            particulars_t=restock_data.particulars_t
        )
        db.add(medicine_batch)
        db.flush()
    
    # Create restock log
    restock_log = RestockLog(
        med_id=restock_data.med_id,
        batch_no=restock_data.batch_no,
        quantity_added=restock_data.quantity_added,
        restock_date=datetime.now(),
        restocked_by=current_user.id
    )
    db.add(restock_log)
    db.flush()
    
    # Create or update inventory entry
    existing_inventory = db.query(Inventory).filter(
        Inventory.med_batch_id == medicine_batch.id
    ).first()
    
    if existing_inventory:
        # Update existing inventory
        existing_inventory.quantity += restock_data.quantity_added
        existing_inventory.available_quantity += restock_data.quantity_added
        existing_inventory.price_per_unit = restock_data.price_per_unit
    else:
        # Create new inventory entry
        new_inventory = Inventory(
            med_batch_id=medicine_batch.id,
            price_per_unit=restock_data.price_per_unit,
            quantity=restock_data.quantity_added,
            available_quantity=restock_data.quantity_added,
            restock_log_id=restock_log.id
        )
        db.add(new_inventory)
    
    db.commit()
    db.refresh(restock_log)
    
    return restock_log

@router.get("/", response_model=List[RestockLogDetailResponse])
async def get_restock_logs(
    skip: int = 0,
    limit: int = 100,
    med_id: int = None,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Get restock logs (Admin only)"""
    query = db.query(
        RestockLog,
        Medicine.name.label('medicine_name'),
        Staff.name.label('restocked_by_name')
    ).join(
        Medicine, RestockLog.med_id == Medicine.id
    ).join(
        Staff, RestockLog.restocked_by == Staff.id
    )
    
    if med_id:
        query = query.filter(RestockLog.med_id == med_id)
    
    if start_date:
        query = query.filter(RestockLog.restock_date >= start_date)
    
    if end_date:
        query = query.filter(RestockLog.restock_date <= end_date)
    
    results = query.order_by(RestockLog.restock_date.desc()).offset(skip).limit(limit).all()
    
    restock_list = []
    for log, medicine_name, restocked_by_name in results:
        item = RestockLogDetailResponse.model_validate(log)
        item.medicine_name = medicine_name
        item.restocked_by_name = restocked_by_name
        restock_list.append(item)
    
    return restock_list

@router.get("/{restock_id:int}", response_model=RestockLogDetailResponse)
async def get_restock_log(
    restock_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Get specific restock log (Admin only)"""
    result = db.query(
        RestockLog,
        Medicine.name.label('medicine_name'),
        Staff.name.label('restocked_by_name')
    ).join(
        Medicine, RestockLog.med_id == Medicine.id
    ).join(
        Staff, RestockLog.restocked_by == Staff.id
    ).filter(
        RestockLog.id == restock_id
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restock log not found"
        )
    
    log, medicine_name, restocked_by_name = result
    item = RestockLogDetailResponse.model_validate(log)
    item.medicine_name = medicine_name
    item.restocked_by_name = restocked_by_name
    
    return item

@router.get("/medicine/{med_id}/history", response_model=List[RestockLogDetailResponse])
async def get_medicine_restock_history(
    med_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(require_admin)
):
    """Get restock history for a specific medicine (Admin only)"""
    query = db.query(
        RestockLog,
        Medicine.name.label('medicine_name'),
        Staff.name.label('restocked_by_name')
    ).join(
        Medicine, RestockLog.med_id == Medicine.id
    ).join(
        Staff, RestockLog.restocked_by == Staff.id
    ).filter(
        RestockLog.med_id == med_id
    ).order_by(RestockLog.restock_date.desc()).offset(skip).limit(limit)
    
    results = query.all()
    
    restock_list = []
    for log, medicine_name, restocked_by_name in results:
        item = RestockLogDetailResponse.model_validate(log)
        item.medicine_name = medicine_name
        item.restocked_by_name = restocked_by_name
        restock_list.append(item)
    
    return restock_list
