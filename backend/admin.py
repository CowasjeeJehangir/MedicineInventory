from backend.db import SessionLocal
from models.staff import Staff, Credentials  # Correct import based on your schema
from models.inventory import Inventory  # If you have this model
from models.patient import Patient  # Based on your schema
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash
import logging

# Create a logger for better error tracking
logger = logging.getLogger(__name__)

def get_db_session():
    """Helper function to get database session with proper error handling"""
    return SessionLocal()

def add_user(details):
    """
    Adds a staff member
    
    Args:
        details (dict): Dictionary containing user details
                       Expected keys: username, name, role, phone_number, cnic, password (optional)
    
    Returns:
        dict: Success/error message with user data
    """
    session = get_db_session()
    try:
        # Check if user already exists by account_id (username)
        existing_creds = session.query(Credentials).filter_by(
            account_id=details['username']
        ).first()
        
        if existing_creds:
            return {
                'success': False, 
                'message': 'User with this username already exists'
            }
        
        # Check if CNIC already exists (if provided)
        if details.get('cnic'):
            existing_staff = session.query(Staff).filter_by(
                cnic=int(details['cnic'])
            ).first()
            if existing_staff:
                return {
                    'success': False,
                    'message': 'User with this CNIC already exists'
                }
        
        # Generate default password if not provided
        password = details.get('password', f"{details['username']}_123")
        hashed_password = generate_password_hash(password)
        
        # Create new staff member
        new_staff = Staff(
            cnic=int(details.get('cnic', 0)) if details.get('cnic') else 0,
            name=details.get('name', details['username']),
            phone_number=int(details.get('phone_number', 0)) if details.get('phone_number') else 0,
            designation=details['role']
        )
        
        session.add(new_staff)
        session.flush()  # Get the ID without committing
        
        # Create credentials
        new_credentials = Credentials(
            staff_id=new_staff.id,
            account_id=details['username'],
            password=hashed_password
        )
        
        session.add(new_credentials)
        session.commit()
        
        # Return user data (without password)
        user_data = {
            'id': new_staff.id,
            'username': new_credentials.account_id,
            'email': details.get('email', ''),
            'role': new_staff.designation,
            'status': 'Active',
            'name': new_staff.name,
            'phone_number': new_staff.phone_number,
            'cnic': new_staff.cnic
        }
        
        logger.info(f"Successfully added user: {details['username']}")
        return {
            'success': True, 
            'message': 'User added successfully',
            'user': user_data,
            'temp_password': password if 'password' not in details else None
        }
        
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error adding user: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error adding user: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

def dlt_user(staff_id):
    """
    Delete a user
    
    Args:
        staff_id (int): ID of the staff member to delete
    
    Returns:
        dict: Success/error message
    """
    session = get_db_session()
    try:
        # Find the user
        user = session.query(Staff).filter_by(id=staff_id).first()
        
        if not user:
            return {
                'success': False, 
                'message': 'User not found'
            }
        
        # Store name for logging
        username = user.name
        
        # Delete credentials first (due to foreign key constraint)
        credentials = session.query(Credentials).filter_by(staff_id=staff_id).first()
        if credentials:
            session.delete(credentials)
        
        # Delete the user
        session.delete(user)
        session.commit()
        
        logger.info(f"Successfully deleted user: {username} (ID: {staff_id})")
        return {
            'success': True, 
            'message': f'User {username} deleted successfully'
        }
        
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error deleting user {staff_id}: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error deleting user {staff_id}: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

def update_user(staff_id, details):
    """
    Update a user's details
    
    Args:
        staff_id (int): ID of the staff member to update
        details (dict): Dictionary containing updated user details
    
    Returns:
        dict: Success/error message with updated user data
    """
    session = get_db_session()
    try:
        user = session.query(Staff).filter_by(id=staff_id).first()
        
        if not user:
            return {
                'success': False, 
                'message': 'User not found'
            }
        
        # Update staff fields
        if 'name' in details:
            user.name = details['name']
        if 'role' in details:
            user.designation = details['role']
        if 'phone_number' in details:
            user.phone_number = int(details['phone_number']) if details['phone_number'] else 0
        if 'cnic' in details:
            user.cnic = int(details['cnic']) if details['cnic'] else 0
        
        # Update credentials if needed
        credentials = session.query(Credentials).filter_by(staff_id=staff_id).first()
        if credentials:
            if 'username' in details:
                # Check if new username is already taken
                existing = session.query(Credentials).filter(
                    Credentials.account_id == details['username'],
                    Credentials.staff_id != staff_id
                ).first()
                if existing:
                    return {
                        'success': False,
                        'message': 'Username already exists'
                    }
                credentials.account_id = details['username']
            
            if 'password' in details and details['password']:
                credentials.password = generate_password_hash(details['password'])
        
        session.commit()
        
        # Return updated user data
        user_data = {
            'id': user.id,
            'username': credentials.account_id if credentials else '',
            'email': details.get('email', ''),
            'role': user.designation,
            'status': 'Active',
            'name': user.name,
            'phone_number': user.phone_number,
            'cnic': user.cnic
        }
        
        logger.info(f"Successfully updated user: {user.name}")
        return {
            'success': True, 
            'message': 'User updated successfully',
            'user': user_data
        }
        
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error updating user {staff_id}: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error updating user {staff_id}: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

def get_all_users():
    """
    Get all staff members with their credentials
    
    Returns:
        dict: Success/error message with users list
    """
    session = get_db_session()
    try:
        # Join Staff and Credentials tables
        users_with_creds = session.query(Staff, Credentials).join(
            Credentials, Staff.id == Credentials.staff_id
        ).all()
        
        users_data = []
        for staff, creds in users_with_creds:
            users_data.append({
                'id': staff.id,
                'username': creds.account_id,
                'email': '',  # Add email field to your model if needed
                'role': staff.designation,
                'status': 'Active',  # Add status field to your model if needed
                'name': staff.name,
                'phone_number': staff.phone_number,
                'cnic': staff.cnic
            })
        
        return {
            'success': True,
            'users': users_data
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching users: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        logger.error(f"Unexpected error fetching users: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

def inventory_update(items, operation):
    """
    Add or remove items from the inventory
    
    Args:
        items (list): List of dictionaries with item details
                     Expected keys: med_batch_id, quantity, price_per_unit
        operation (str): 'add' or 'remove'
    
    Returns:
        dict: Success/error message
    """
    session = get_db_session()
    try:
        if operation not in ['add', 'remove']:
            return {
                'success': False, 
                'message': 'Operation must be either "add" or "remove"'
            }
        
        updated_items = []
        
        for item_data in items:
            med_batch_id = item_data.get('med_batch_id')
            quantity = item_data.get('quantity', 0)
            
            if not med_batch_id or quantity <= 0:
                continue
            
            # Find existing item
            existing_item = session.query(Inventory).filter_by(
                med_batch_id=med_batch_id
            ).first()
            
            if operation == 'add':
                if existing_item:
                    # Update existing item
                    existing_item.quantity += quantity
                    existing_item.available_quantity += quantity
                    if 'price_per_unit' in item_data:
                        existing_item.price_per_unit = item_data['price_per_unit']
                    updated_items.append(f"Updated batch {med_batch_id}: +{quantity}")
                else:
                    # Create new item
                    new_item = Inventory(
                        med_batch_id=med_batch_id,
                        quantity=quantity,
                        available_quantity=quantity,
                        price_per_unit=item_data.get('price_per_unit', 0.0)
                    )
                    session.add(new_item)
                    updated_items.append(f"Added new batch {med_batch_id}: {quantity}")
            
            elif operation == 'remove':
                if existing_item:
                    if existing_item.available_quantity >= quantity:
                        existing_item.available_quantity -= quantity
                        updated_items.append(f"Removed from batch {med_batch_id}: -{quantity}")
                    else:
                        return {
                            'success': False,
                            'message': f'Insufficient quantity for batch {med_batch_id}. Available: {existing_item.available_quantity}, Requested: {quantity}'
                        }
                else:
                    return {
                        'success': False,
                        'message': f'Batch {med_batch_id} not found in inventory'
                    }
        
        session.commit()
        
        logger.info(f"Inventory {operation} completed: {updated_items}")
        return {
            'success': True,
            'message': f'Inventory {operation} completed successfully',
            'updated_items': updated_items
        }
        
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error in inventory update: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error in inventory update: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

def view_inventory():
    """
    Display all items currently in inventory
    
    Returns:
        dict: Success/error message with inventory data
    """
    session = get_db_session()
    try:
        # Join with medicine batch to get medicine details
        from backend.models.medicine import MedicineBatch, Medicine
        
        inventory_items = session.query(
            Inventory, MedicineBatch, Medicine
        ).join(
            MedicineBatch, Inventory.med_batch_id == MedicineBatch.id
        ).join(
            Medicine, MedicineBatch.med_id == Medicine.id
        ).all()
        
        items_data = []
        for inventory, batch, medicine in inventory_items:
            items_data.append({
                'id': inventory.id,
                'medicine_name': medicine.name,
                'batch_no': batch.batch_no,
                'quantity': inventory.quantity,
                'available_quantity': inventory.available_quantity,
                'price_per_unit': float(inventory.price_per_unit),
                'total_value': float(inventory.available_quantity * inventory.price_per_unit),
                'best_before': batch.best_before.isoformat() if batch.best_before else None,
                'low_stock': inventory.available_quantity < 10,  # Flag for low stock
                'needs_prescription': medicine.needs_prescription
            })
        
        # Calculate summary statistics
        total_items = len(items_data)
        low_stock_items = sum(1 for item in items_data if item['low_stock'])
        total_value = sum(item['total_value'] for item in items_data)
        
        return {
            'success': True,
            'inventory': items_data,
            'summary': {
                'total_items': total_items,
                'low_stock_items': low_stock_items,
                'total_value': round(total_value, 2)
            }
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching inventory: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        logger.error(f"Unexpected error fetching inventory: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

def get_patient_history(patient_id=None):
    """
    Display customer details and medical history
    
    Args:
        patient_id (int, optional): Specific patient ID, if None returns all patients
    
    Returns:
        dict: Success/error message with patient data
    """
    session = get_db_session()
    try:
        if patient_id:
            # Get specific patient
            patient = session.query(Patient).filter_by(id=patient_id).first()
            if not patient:
                return {
                    'success': False,
                    'message': 'Patient not found'
                }
            patients = [patient]
        else:
            # Get all patients
            patients = session.query(Patient).all()
        
        patients_data = []
        for patient in patients:
            patient_info = {
                'id': patient.id,
                'name': patient.name,
                'cnic': patient.cnic,
                'phone_number': patient.phone_number,
                'billing_history': []
            }
            
            # Get billing/distribution history if the relationship exists
            if hasattr(patient, 'billing_logs'):
                for log in patient.billing_logs:
                    patient_info['billing_history'].append({
                        'id': log.id,
                        'date_given': log.date_given.isoformat() if log.date_given else None,
                        'quantity': log.quantity,
                        'notes': log.notes,
                        'staff_name': log.staff.name if log.staff else 'Unknown'
                    })
            
            patients_data.append(patient_info)
        
        return {
            'success': True,
            'patients': patients_data
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching patient history: {str(e)}")
        return {
            'success': False, 
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        logger.error(f"Unexpected error fetching patient history: {str(e)}")
        return {
            'success': False, 
            'message': f'Unexpected error: {str(e)}'
        }
    finally:
        session.close()

# Additional utility functions
def get_user_by_id(staff_id):
    """Get a specific user by ID"""
    session = get_db_session()
    try:
        staff = session.query(Staff).filter_by(id=staff_id).first()
        if staff:
            credentials = session.query(Credentials).filter_by(staff_id=staff_id).first()
            return {
                'success': True,
                'user': {
                    'id': staff.id,
                    'username': credentials.account_id if credentials else '',
                    'email': '',
                    'role': staff.designation,
                    'status': 'Active',
                    'name': staff.name,
                    'phone_number': staff.phone_number,
                    'cnic': staff.cnic
                }
            }
        else:
            return {
                'success': False,
                'message': 'User not found'
            }
    except Exception as e:
        logger.error(f"Error fetching user {staff_id}: {str(e)}")
        return {
            'success': False,
            'message': f'Error: {str(e)}'
        }
    finally:
        session.close()

def get_medicines():
    """Get all medicines with their details"""
    session = get_db_session()
    try:
        from backend.models.medicine import Medicine
        
        medicines = session.query(Medicine).all()
        
        medicines_data = []
        for medicine in medicines:
            medicines_data.append({
                'id': medicine.id,
                'name': medicine.name,
                'potential_allergens': medicine.potential_allergens,
                'restock_threshold': medicine.restock_threshold,
                'needs_prescription': medicine.needs_prescription
            })
        
        return {
            'success': True,
            'medicines': medicines_data
        }
        
    except Exception as e:
        logger.error(f"Error fetching medicines: {str(e)}")
        return {
            'success': False,
            'message': f'Error: {str(e)}'
        }
    finally:
        session.close()