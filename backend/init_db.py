"""
Database initialization script
Creates sample data for testing the API
"""
from sqlalchemy.orm import Session
from db import SessionLocal, engine, Base
from models.staff import Staff, Credentials
from models.patient import Patient, Ward
from models.medicine import Medicine, MedicineBatch
from models.inventory import Inventory, RestockLog
from auth.dependencies import get_password_hash
from datetime import datetime, timedelta

def init_db():
    """Initialize database with sample data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(Staff).first():
            print("Database already initialized")
            return
        
        print("Initializing database with sample data...")
        
        # Create admin staff
        admin_staff = Staff(
            cnic=1234567890123,
            name="Admin User",
            phone_number=3001234567,
            designation="Admin"
        )
        db.add(admin_staff)
        db.flush()
        
        admin_credentials = Credentials(
            staff_id=admin_staff.id,
            account_id="admin",
            password=get_password_hash("admin123")
        )
        db.add(admin_credentials)
        
        # Create pharmacist staff
        pharmacist_staff = Staff(
            cnic=9876543210987,
            name="Pharmacist User",
            phone_number=3009876543,
            designation="Pharmacist"
        )
        db.add(pharmacist_staff)
        db.flush()
        
        pharmacist_credentials = Credentials(
            staff_id=pharmacist_staff.id,
            account_id="pharmacist",
            password=get_password_hash("pharm123")
        )
        db.add(pharmacist_credentials)
        
        # Create wards
        ward1 = Ward(ward_code="W-101")
        ward2 = Ward(ward_code="W-102")
        db.add_all([ward1, ward2])
        db.flush()
        
        # Create patients
        patient1 = Patient(
            cnic=1111111111111,
            name="John Doe",
            phone_number=3001111111,
            ward_id=ward1.id,
            diagnosis="Fever",
            medicines="Paracetamol"
        )
        patient2 = Patient(
            cnic=2222222222222,
            name="Jane Smith",
            phone_number=3002222222,
            ward_id=ward1.id,
            diagnosis="Headache",
            medicines="Ibuprofen"
        )
        db.add_all([patient1, patient2])
        
        # Create medicines
        medicine1 = Medicine(
            name="Paracetamol 500mg",
            potential_allergens="None",
            restock_threshold=100,
            needs_prescription=False
        )
        medicine2 = Medicine(
            name="Ibuprofen 400mg",
            potential_allergens="None",
            restock_threshold=100,
            needs_prescription=False
        )
        medicine3 = Medicine(
            name="Amoxicillin 500mg",
            potential_allergens="Penicillin",
            restock_threshold=50,
            needs_prescription=True
        )
        db.add_all([medicine1, medicine2, medicine3])
        db.flush()
        
        # Create medicine batches
        batch1 = MedicineBatch(
            batch_no=1001,
            med_id=medicine1.id,
            restock_date=datetime.now(),
            total_count=500,
            best_before=datetime.now() + timedelta(days=365),
            particulars_b=10,
            particulars_f=50,
            particulars_t=500
        )
        batch2 = MedicineBatch(
            batch_no=1002,
            med_id=medicine2.id,
            restock_date=datetime.now(),
            total_count=300,
            best_before=datetime.now() + timedelta(days=365),
            particulars_b=10,
            particulars_f=30,
            particulars_t=300
        )
        batch3 = MedicineBatch(
            batch_no=1003,
            med_id=medicine3.id,
            restock_date=datetime.now(),
            total_count=200,
            best_before=datetime.now() + timedelta(days=730),
            particulars_b=10,
            particulars_f=20,
            particulars_t=200
        )
        db.add_all([batch1, batch2, batch3])
        db.flush()
        
        # Create restock logs
        restock1 = RestockLog(
            med_id=medicine1.id,
            batch_no=1001,
            quantity_added=500,
            restock_date=datetime.now(),
            restocked_by=admin_staff.id
        )
        restock2 = RestockLog(
            med_id=medicine2.id,
            batch_no=1002,
            quantity_added=300,
            restock_date=datetime.now(),
            restocked_by=admin_staff.id
        )
        restock3 = RestockLog(
            med_id=medicine3.id,
            batch_no=1003,
            quantity_added=200,
            restock_date=datetime.now(),
            restocked_by=admin_staff.id
        )
        db.add_all([restock1, restock2, restock3])
        db.flush()
        
        # Create inventory
        inventory1 = Inventory(
            med_batch_id=batch1.id,
            price_per_unit=5.0,
            quantity=500,
            available_quantity=500,
            restock_log_id=restock1.id
        )
        inventory2 = Inventory(
            med_batch_id=batch2.id,
            price_per_unit=8.0,
            quantity=300,
            available_quantity=300,
            restock_log_id=restock2.id
        )
        inventory3 = Inventory(
            med_batch_id=batch3.id,
            price_per_unit=15.0,
            quantity=200,
            available_quantity=200,
            restock_log_id=restock3.id
        )
        db.add_all([inventory1, inventory2, inventory3])
        
        db.commit()
        print("Database initialized successfully!")
        print("\nDefault credentials:")
        print("Admin - Username: admin, Password: admin123")
        print("Pharmacist - Username: pharmacist, Password: pharm123")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
