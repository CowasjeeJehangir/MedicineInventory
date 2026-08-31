from backend.db import SessionLocal
from models.patient import Ward

wards = ["A1", "B2", "C3", "D4"]

session = SessionLocal()
try:
    for code in wards:
        # Check if ward already exists
        existing = session.query(Ward).filter_by(ward_code=code).first()
        if not existing:
            new_ward = Ward(ward_code=code)
            session.add(new_ward)
    session.commit()
    print("Wards added successfully")
finally:
    session.close()
