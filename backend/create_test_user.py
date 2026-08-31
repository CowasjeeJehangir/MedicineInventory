import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from werkzeug.security import generate_password_hash
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Create engine directly
from backend.db import Base, SessionLocal

def create_tables_and_test_user():
    db = SessionLocal()
    
    try:
        # Drop existing tables to ensure correct schema (CASCADE handles foreign keys)
        db.execute(text('DROP TABLE IF EXISTS credentials CASCADE'))
        db.execute(text('DROP TABLE IF EXISTS staff CASCADE'))
        db.commit()

        # Create tables manually with raw SQL to avoid relationship issues
        db.execute(text('''
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
                cnic INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                phone_number INTEGER NOT NULL,
                designation TEXT NOT NULL
            )
        '''))
        
        db.execute(text('''
            CREATE TABLE IF NOT EXISTS credentials (
                staff_id INTEGER PRIMARY KEY,
                account_id TEXT NOT NULL UNIQUE,
                password TEXT,
                FOREIGN KEY (staff_id) REFERENCES staff (id)
            )
        '''))
        
        db.commit()
        
        # Check if test user already exists
        result = db.execute(text("SELECT * FROM staff WHERE cnic = :cnic"), {"cnic": 1234567890})
        existing_staff = result.fetchone()
        
        if existing_staff:
            print("Test user already exists!")
            print("Username: admin")
            print("Password: admin123")
            return
        
        # Insert staff member
        db.execute(text('''
            INSERT INTO staff (cnic, name, phone_number, designation)
            VALUES (:cnic, :name, :phone_number, :designation)
        '''), {
            "cnic": 1234567890,
            "name": "Test Admin",
            "phone_number": 1234567890,
            "designation": "Admin"
        })
        
        # Get the staff ID
        result = db.execute(text("SELECT id FROM staff WHERE cnic = :cnic"), {"cnic": 1234567890})
        staff_id = result.fetchone()[0]
        
        # Create credentials
        hashed_password = generate_password_hash("admin123")
        db.execute(text('''
            INSERT INTO credentials (staff_id, account_id, password)
            VALUES (:staff_id, :account_id, :password)
        '''), {
            "staff_id": staff_id,
            "account_id": "admin",
            "password": hashed_password
        })
        
        db.commit()
        
        print("Test user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print(f"Staff ID: {staff_id}")
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_tables_and_test_user()