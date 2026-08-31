from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from db import get_db
from auth.dependencies import get_current_user
from models.inventory import Inventory
from models.medicine import MedicineBatch, Medicine
from models.staff import Staff
from schemas.schemas import (
    InventoryResponse, InventoryDetailResponse, 
    InventoryUpdate, ExpiringBatch
)

router = APIRouter()

@router.get("/", response_model=List[InventoryDetailResponse])
async def get_inventory(
    skip: int = 0,
    limit: int = 100,
    medicine_name: str = None,
    min_quantity: int = None,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get inventory with details"""
    query = db.query(
        Inventory,
        Medicine.id.label('medicine_id'),
        Medicine.name.label('medicine_name'),
        Medicine.potential_allergens,
        Medicine.restock_threshold,
        Medicine.needs_prescription,
        MedicineBatch.batch_no,
        MedicineBatch.best_before,
        MedicineBatch.restock_date,
        MedicineBatch.total_count,
        MedicineBatch.particulars_b,
        MedicineBatch.particulars_f,
        MedicineBatch.particulars_t
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    )
    
    if medicine_name:
        query = query.filter(Medicine.name.ilike(f"%{medicine_name}%"))
    
    if min_quantity:
        query = query.filter(Inventory.available_quantity >= min_quantity)
    
    results = query.offset(skip).limit(limit).all()
    
    inventory_list = []
    for (
        inv, medicine_id, med_name, potential_allergens, restock_threshold,
        needs_prescription, batch_no, best_before, restock_date, total_count,
        particulars_b, particulars_f, particulars_t
    ) in results:
        item = InventoryDetailResponse.model_validate(inv)
        item.medicine_id = medicine_id
        item.medicine_name = med_name
        item.potential_allergens = potential_allergens
        item.restock_threshold = restock_threshold
        item.needs_prescription = needs_prescription
        item.batch_no = batch_no
        item.best_before = best_before
        item.restock_date = restock_date
        item.total_count = total_count
        item.particulars_b = particulars_b
        item.particulars_f = particulars_f
        item.particulars_t = particulars_t
        inventory_list.append(item)
    
    return inventory_list

@router.get("/expiring-soon", response_model=List[ExpiringBatch])
async def get_expiring_batches(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get batches expiring within specified days"""
    cutoff_date = datetime.now() + timedelta(days=days)
    
    results = db.query(
        MedicineBatch.id,
        Medicine.name,
        MedicineBatch.batch_no,
        MedicineBatch.best_before,
        func.sum(Inventory.available_quantity).label('total_available')
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    ).join(
        Inventory, MedicineBatch.id == Inventory.med_batch_id
    ).filter(
        MedicineBatch.best_before <= cutoff_date,
        MedicineBatch.best_before >= datetime.now()
    ).group_by(
        MedicineBatch.id,
        Medicine.name,
        MedicineBatch.batch_no,
        MedicineBatch.best_before
    ).all()
    
    expiring_batches = []
    for batch_id, med_name, batch_no, best_before, available in results:
        days_until = (best_before - datetime.now()).days
        expiring_batches.append(ExpiringBatch(
            batch_id=batch_id,
            medicine_name=med_name,
            batch_no=batch_no,
            best_before=best_before,
            available_quantity=available or 0,
            days_until_expiry=days_until
        ))
    
    return expiring_batches

@router.get("/expired", response_model=List[InventoryDetailResponse])
async def get_expired_inventory(
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get expired inventory items"""
    query = db.query(
        Inventory,
        Medicine.name.label('medicine_name'),
        MedicineBatch.batch_no,
        MedicineBatch.best_before
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    ).filter(
        MedicineBatch.best_before < datetime.now(),
        Inventory.available_quantity > 0
    )
    
    results = query.all()
    
    inventory_list = []
    for inv, med_name, batch_no, best_before in results:
        item = InventoryDetailResponse.model_validate(inv)
        item.medicine_name = med_name
        item.batch_no = batch_no
        item.best_before = best_before
        inventory_list.append(item)
    
    return inventory_list

@router.get("/medicine/{medicine_id}/total", response_model=dict)
async def get_medicine_total_stock(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get total stock for a specific medicine across all batches"""
    result = db.query(
        func.sum(Inventory.available_quantity).label('total_available'),
        func.sum(Inventory.quantity).label('total_quantity')
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).filter(
        MedicineBatch.med_id == medicine_id
    ).first()
    
    return {
        "medicine_id": medicine_id,
        "total_available": result.total_available or 0,
        "total_quantity": result.total_quantity or 0
    }

@router.get("/{inventory_id:int}", response_model=InventoryDetailResponse)
async def get_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Get specific inventory item with details"""
    result = db.query(
        Inventory,
        Medicine.id.label('medicine_id'),
        Medicine.name.label('medicine_name'),
        Medicine.potential_allergens,
        Medicine.restock_threshold,
        Medicine.needs_prescription,
        MedicineBatch.batch_no,
        MedicineBatch.best_before,
        MedicineBatch.restock_date,
        MedicineBatch.total_count,
        MedicineBatch.particulars_b,
        MedicineBatch.particulars_f,
        MedicineBatch.particulars_t
    ).join(
        MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
    ).join(
        Medicine, MedicineBatch.med_id == Medicine.id
    ).filter(
        Inventory.id == inventory_id
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    (
        inv, medicine_id, med_name, potential_allergens, restock_threshold,
        needs_prescription, batch_no, best_before, restock_date, total_count,
        particulars_b, particulars_f, particulars_t
    ) = result
    item = InventoryDetailResponse.model_validate(inv)
    item.medicine_id = medicine_id
    item.medicine_name = med_name
    item.potential_allergens = potential_allergens
    item.restock_threshold = restock_threshold
    item.needs_prescription = needs_prescription
    item.batch_no = batch_no
    item.best_before = best_before
    item.restock_date = restock_date
    item.total_count = total_count
    item.particulars_b = particulars_b
    item.particulars_f = particulars_f
    item.particulars_t = particulars_t
    
    return item

@router.put("/{inventory_id:int}", response_model=InventoryResponse)
async def update_inventory_item(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: Staff = Depends(get_current_user)
):
    """Update inventory item (price, quantities)"""
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    update_data = inventory_data.model_dump(exclude_unset=True)
    
    # Validate available_quantity doesn't exceed quantity
    if 'available_quantity' in update_data:
        if update_data['available_quantity'] > inventory.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Available quantity cannot exceed total quantity"
            )
    
    for field, value in update_data.items():
        setattr(inventory, field, value)
    
    db.commit()
    db.refresh(inventory)
    return inventory
