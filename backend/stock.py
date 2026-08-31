from backend.db import SessionLocal
from backend.models.medicine import Medicine, MedicineBatch
from models.inventory import DistributionLog, RestockLog, Inventory
from sqlalchemy import func
from datetime import datetime

data = SessionLocal()

def add_medicine(name, potential_allergens, restock_threshold, needs_prescription):
    """Adds medicine to inventory"""
    ## add to Medicine table
    med_new = Medicine(
        name = name,
        potential_allergens = potential_allergens,
        restock_threshold = restock_threshold,
        needs_prescription = needs_prescription
    )
    data.add(med_new)
    data.commit

def add_batch(id, batch_no, med_id, total_count, best_before):
    """Adds batch to inventory"""
    ## add to MedicineBatch
    batch_new = MedicineBatch(
        id = id,
        batch_no = batch_no,
        med_id = med_id,
        total_count = total_count,
        best_before = best_before
    )
    data.add(batch_new)
    data.commit


def update_inventory(med_id, batch_no, quantity, price_per_unit, restocked_by, expiry):
    """Updates or adds medicine inventory and logs the restocking."""

    # Check if batch exists
    existing_batch = data.query(MedicineBatch).filter_by(batch_no=batch_no, med_id=med_id).first()

    if existing_batch:
        # Existing batch: update counts
        existing_batch.total_count += quantity
        
        inventory_entry = data.query(Inventory).filter_by(med_batch_id=existing_batch.id).first()
        inventory_entry.quantity += quantity
        inventory_entry.available_quantity += quantity
        inventory_entry.price_per_unit = price_per_unit  # optional: update to latest price
    else:
        # New batch: create MedicineBatch
        new_batch = MedicineBatch(
            batch_no=batch_no,
            med_id=med_id,
            total_count=quantity,
            best_before=expiry,  
            restock_date=datetime.now()
        )
        data.add(new_batch)
        data.flush()  # get new_batch.id

        # Add Inventory entry
        inventory_entry = Inventory(
            med_batch_id=new_batch.id,
            price_per_unit=price_per_unit,
            quantity=quantity,
            available_quantity=quantity
        )
        data.add(inventory_entry)

    # Add RestockLog entry
    restock_log = RestockLog(
        med_id=med_id,
        batch_no=batch_no,
        quantity_added=quantity,
        restock_date=datetime.now(),
        restocked_by=restocked_by
    )
    data.add(restock_log)
    data.flush()

    # Link RestockLog to Inventory
    inventory_entry.restock_log_id = restock_log.id

    data.commit()

def dispense_medicine(customer_id, staff_id, med_id, batch_no, quantity, notes=None):
    """Reduces available quantity of a medicine batch and logs the distribution."""

    # Find the correct batch
    batch = data.query(MedicineBatch).filter_by(med_id=med_id, batch_no=batch_no).first()
    if not batch:
        raise ValueError(f"No batch {batch_no} found for medicine ID {med_id}.")

    # Find inventory entry
    inventory_entry = data.query(Inventory).filter_by(med_batch_id=batch.id).first()
    if not inventory_entry:
        raise ValueError("Inventory entry not found for the batch.")

    if inventory_entry.available_quantity < quantity:
        raise ValueError("Not enough medicine available to dispense.")

    # Deduct quantity
    inventory_entry.available_quantity -= quantity

    # Log the distribution
    distribution_log = DistributionLog(
        customer_id=customer_id,
        staff_id=staff_id,
        med_id=med_id,
        batch_no=batch_no,
        quantity_dispensed=quantity,
        date_dispensed=datetime.now(),
        notes=notes
    )
    data.add(distribution_log)

    data.commit()

def get_medicine_stock(med_id):
    """Shows available quantity per batch"""
    total_available = data.query(MedicineBatch.id, func.sum(MedicineBatch.id, Inventory.available_quantity).label("Avaialable")) \
        .join(MedicineBatch, Inventory.med_batch_id == MedicineBatch.id) \
        .filter(MedicineBatch.med_id == med_id) \
        .group_by(MedicineBatch.id) \
        .scalar() or 0
    
    return total_available

def is_available(med_id, required_quantity):
    """Checks if required quantity of medicine is in stock"""
    total_available = data.query(func.sum(Inventory.available_quantity)) \
        .join(MedicineBatch, Inventory.med_batch_id == MedicineBatch.id) \
        .filter(MedicineBatch.med_id == med_id) \
        .scalar() or 0
    
    return total_available is not None and total_available >= required_quantity

def restock_required():
    """Returns a list of medicines that require restocking"""
    results = data.query(Medicine.id, Medicine.name, func.sum(Inventory.available_quantity).label("stock")) \
        .join(MedicineBatch, Medicine.id == MedicineBatch.med_id) \
        .join(Inventory, Inventory.med_batch_id == MedicineBatch.id) \
        .group_by(Medicine.id, Medicine.name) \
        .having(func.sum(Inventory.available_quantity) < Medicine.restock_threshold) \
        .all()
    
    return results

def get_inventory():
    """Returns a list of medicines currently in stock"""
    results = data.query(MedicineBatch.med_id) \
        .join(Inventory, Inventory.med_batch_id == MedicineBatch.id) \
        .filter(Inventory.available_quantity > 0) \
        .distinct() \
        .all()
    
    return [r[0] for r in results]

### Extra details if required ###
def get_inventory_full():
    """Returns a list of (id, name) for medicines in stock"""
    results = data.query(Medicine.id, Medicine.name) \
        .join(MedicineBatch, Medicine.id == MedicineBatch.med_id) \
        .join(Inventory, Inventory.med_batch_id == MedicineBatch.id) \
        .filter(Inventory.available_quantity > 0) \
        .distinct() \
        .all()
    
    return results
