from backend.db import SessionLocal
from backend.models.medicine import Medicine

data = SessionLocal()

def has_prescription(med_id):
    """Check if a medicine requires a prescription before issuing"""
    med = data.query(Medicine).filter_by(id=med_id).first()
    if med.needs_prescription:
        return True
    return False

### other functions to manage medicine issuing ###
#Requisition slip function here