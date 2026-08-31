import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.db import SessionLocal
from models.staff import Staff, Credentials
from werkzeug.security import check_password_hash

def authenticate_staff(username, password):
    """Check if username and password match a user in the database."""
    data = SessionLocal()
    
    try:
        # Find credentials by account_id (username)
        creds = data.query(Credentials).filter_by(account_id=username).first()
        
        if creds:
            # Get the associated staff member
            staff = data.query(Staff).filter_by(id=creds.staff_id).first()
            
            if staff and check_password_hash(creds.password, password):
                return {
                    "staff_id": staff.id,
                    "name": staff.name,
                    "designation": staff.designation,
                    "account_id": creds.account_id
                }
        
        return None
        
    except Exception as e:
        print(f"Authentication error: {e}")
        return None
    finally:
        data.close()

def is_query(inp):
    """Check if an input is a query"""
    sql_keywords = {"SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", "WHERE", "FROM", "JOIN"}
    input_upper = inp.upper()
    
    status = any(keyword in input_upper for keyword in sql_keywords)
    
    if status:
        return True
    return False

def is_authorized(staff_id, required_role):
    """Check if the staff member is authorized access depending on the role."""
    data = SessionLocal()
    
    try:
        staff = data.query(Staff).filter_by(id=staff_id).first()
        
        if staff and staff.designation == required_role:
            return True
        return False
    finally:
        data.close()