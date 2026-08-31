#!/usr/bin/env python3
"""
Show Users - Simple script to display all users in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.db import SessionLocal
from models.staff import Staff, Credentials

def show_users():
    """Display all users in the database"""
    session = SessionLocal()
    
    try:
        # Get all staff with their credentials
        users = session.query(Staff, Credentials).join(
            Credentials, Staff.id == Credentials.staff_id
        ).all()
        
        if users:
            print(f"👥 Found {len(users)} users in database:")
            print("-" * 80)
            print(f"{'ID':<5} {'Name':<20} {'Username':<15} {'Role':<12} {'CNIC':<15} {'Phone':<12}")
            print("-" * 80)
            
            for staff, creds in users:
                print(f"{staff.id:<5} {staff.name:<20} {creds.account_id:<15} {staff.designation:<12} {staff.cnic:<15} {staff.phone_number:<12}")
        else:
            print("❌ No users found in database")
            print("\nTo create test users, run:")
            print("python init_test_data.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    show_users()