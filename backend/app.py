import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from datetime import datetime

# Import your helper functions
from auth import authenticate_staff
# from db import SessionLocal, get_db_session
from models.staff import Staff, Credentials
from models.patient import Patient
from backend.models.medicine import Medicine, MedicineBatch
from models.inventory import Inventory

# Import all your helper functions
from admin import (
    add_user, dlt_user, update_user, get_all_users,
    inventory_update, view_inventory, get_patient_history,
    get_user_by_id, get_medicines)
from auth import is_authorized
from med_issue import has_prescription
from show_users import show_users
from stock import (add_medicine,
    add_batch, update_inventory, dispense_medicine,
    get_medicine_stock, is_available, restock_required,
    get_inventory, get_inventory_full)

app = Flask(__name__)
CORS(app)

# ============================================================================
# UTILITY FUNCTIONS & DECORATORS
# ============================================================================

def handle_errors(f):
    """Decorator to handle errors consistently across all endpoints"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Error in {f.__name__}: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': 'Server error occurred'
            }), 500
    return wrapper

def validate_json(required_fields=None):
    """Decorator to validate JSON input"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            if required_fields:
                missing = [field for field in required_fields if not data.get(field)]
                if missing:
                    return jsonify({
                        'success': False,
                        'message': f'Missing required fields: {", ".join(missing)}'
                    }), 400
            
            return f(data, *args, **kwargs)
        return wrapper
    return decorator

def success_response(data=None, message=None, status=200):
    """Standardized success response"""
    response = {'success': True}
    if message:
        response['message'] = message
    if data:
        response.update(data)
    return jsonify(response), status

def error_response(message, status=400):
    """Standardized error response"""
    return jsonify({
        'success': False,
        'message': message
    }), status

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/login', methods=['POST'])
@handle_errors
@validate_json(['username', 'password'])
def login(data):
    """Login endpoint - authenticate staff"""
    username = data['username']
    password = data['password']
    
    print(f"Login attempt - Username: '{username}'")
    
    auth_result = authenticate_staff(username, password)
    
    if auth_result:
        return success_response(
            data={'user': auth_result},
            message='Login successful'
        )
    
    # Debug logging for failed authentication
    with get_db_session() as db:
        creds = db.query(Credentials).filter_by(account_id=username).first()
        if creds:
            print(f"Found credentials for {username}")
            from werkzeug.security import check_password_hash
            manual_check = check_password_hash(creds.password, password)
            print(f"Manual password check: {manual_check}")
        else:
            print(f"No credentials found for username: '{username}'")
    
    return error_response('Invalid username or password', 401)

@app.route('/api/verify-session', methods=['GET'])
@handle_errors
def verify_session():
    """Verify if the current session/user is still valid"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return error_response('No authorization header', 401)
    
    user_data = request.headers.get('X-User-Data')
    if user_data:
        import json
        try:
            user = json.loads(user_data)
            staff_id = user.get('staff_id')
            
            if staff_id:
                user_info = get_user_by_id(staff_id)
                if user_info:
                    return success_response(
                        data={
                            'valid': True,
                            'user': {
                                'staff_id': user_info['id'],
                                'name': user_info['name'],
                                'designation': user_info['designation']
                            }
                        }
                    )
        except:
            pass
    
    return error_response('Invalid session', 401)

@app.route('/api/logout', methods=['POST'])
@handle_errors
def logout():
    """Logout endpoint - invalidate session"""
    return success_response(message='Logged out successfully')

# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/users', methods=['GET'])
@handle_errors
def get_users():
    """Get all staff members - uses helper function"""
    users = get_all_users()
    return success_response(data={'users': users})

@app.route('/api/users', methods=['POST'])
@handle_errors
@validate_json(['username', 'role'])
def create_user(data):
    """Create a new staff member - uses helper function"""
    # Check if username already exists
    with get_db_session() as db:
        existing = db.query(Credentials).filter_by(account_id=data['username']).first()
        if existing:
            return error_response('Username already exists')
    
    # Prepare user details
    user_details = {
        'username': data['username'],
        'password': data.get('password', f"{data['username']}_123"),
        'name': data.get('name', data['username']),
        'designation': data['role'],
        'cnic': int(data.get('cnic', 0)) if data.get('cnic') else 0,
        'phone_number': int(data.get('phone_number', 0)) if data.get('phone_number') else 0
    }
    
    result = add_user(user_details)
    
    if result:
        response_data = {'user': result}
        if 'password' not in data:
            response_data['temp_password'] = user_details['password']
        return success_response(
            data=response_data,
            message='User created successfully',
            status=201
        )
    
    return error_response('Failed to create user')

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@handle_errors
@validate_json()
def update_user_endpoint(data, user_id):
    """Update an existing staff member - uses helper function"""
    # Check if new username is already taken
    if 'username' in data:
        with get_db_session() as db:
            existing = db.query(Credentials).filter(
                Credentials.account_id == data['username'],
                Credentials.staff_id != user_id
            ).first()
            if existing:
                return error_response('Username already exists')
    
    # Map data to helper function format
    update_details = {}
    if 'name' in data:
        update_details['name'] = data['name']
    if 'role' in data:
        update_details['designation'] = data['role']
    if 'phone_number' in data:
        update_details['phone_number'] = int(data['phone_number']) if data['phone_number'] else 0
    if 'cnic' in data:
        update_details['cnic'] = int(data['cnic']) if data['cnic'] else 0
    if 'username' in data:
        update_details['username'] = data['username']
    if 'password' in data and data['password']:
        update_details['password'] = data['password']
    
    result = update_user(user_id, update_details)
    
    if result:
        return success_response(
            data={'user': result},
            message='User updated successfully'
        )
    
    return error_response('User not found', 404)

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@handle_errors
def delete_user_endpoint(user_id):
    """Delete a staff member - uses helper function"""
    result = dlt_user(user_id)
    
    if result:
        return success_response(message=f'User deleted successfully')
    
    return error_response('User not found', 404)

# ============================================================================
# PATIENT ENDPOINTS
# ============================================================================

@app.route('/api/patients', methods=['GET'])
@handle_errors
def get_patients():
    """Get all patients"""
    # Assuming you have a get_all_patients helper or use get_patient_history
    with get_db_session() as db:
        patients = db.query(Patient).all()
        patients_data = [
            {
                'id': p.id,
                'name': p.name,
                'phone_number': getattr(p, 'phone_number', ''),
                'patient_id': f"P{str(p.id).zfill(3)}",
                'cnic': getattr(p, 'cnic', 0)
            }
            for p in patients
        ]
    
    return success_response(data={'patients': patients_data})

# ============================================================================
# INVENTORY ENDPOINTS
# ============================================================================

@app.route('/api/inventory', methods=['GET'])
@handle_errors
def get_inventory_endpoint():
    """Get all inventory items - uses helper function"""
    inventory_data = get_inventory_full()
    
    # Calculate summary
    total_items = len(inventory_data)
    low_stock_items = sum(1 for item in inventory_data if item.get('low_stock'))
    total_value = sum(item.get('total_value', 0) for item in inventory_data)
    
    return success_response(data={
        'inventory': inventory_data,
        'summary': {
            'total_items': total_items,
            'low_stock_items': low_stock_items,
            'total_value': round(total_value, 2)
        }
    })

# ============================================================================
# MEDICINE ENDPOINTS
# ============================================================================

@app.route('/api/medicines', methods=['GET'])
@handle_errors
def get_medicines_endpoint():
    """Get all medicines - uses helper function"""
    medicines = get_medicines()
    return success_response(data={'medicines': medicines})

@app.route('/api/medicines', methods=['POST'])
@handle_errors
@validate_json(['name'])
def create_medicine_endpoint(data):
    """Create a new medicine - uses helper function"""
    # Check if medicine already exists
    with get_db_session() as db:
        existing = db.query(Medicine).filter(
            Medicine.name.ilike(data['name'].strip())
        ).first()
        if existing:
            return error_response('Medicine with this name already exists')
    
    # Add medicine using helper
    medicine_result = add_medicine(
        name=data['name'].strip(),
        potential_allergens=data.get('potential_allergens', ''),
        restock_threshold=int(data.get('restock_threshold', 10)) if data.get('restock_threshold') else 10,
        needs_prescription=bool(data.get('needs_prescription', False))
    )
    
    if not medicine_result:
        return error_response('Failed to create medicine')
    
    med_id = medicine_result.get('id')
    
    # Add batch if initial stock provided
    if data.get('batch_no') and data.get('initial_stock') and med_id:
        try:
            best_before = None
            if data.get('best_before'):
                try:
                    best_before = datetime.strptime(data['best_before'], '%Y-%m-%d')
                except ValueError:
                    pass
            
            batch_result = add_batch(
                id=None,
                batch_no=int(data['batch_no']),
                med_id=med_id,
                total_count=int(data['initial_stock']),
                best_before=best_before
            )
            
            if batch_result:
                # Update inventory
                inventory_update(
                    items=[{
                        'med_id': med_id,
                        'batch_no': int(data['batch_no']),
                        'quantity': int(data['initial_stock']),
                        'price_per_unit': float(data.get('price_per_unit', 0.0)),
                        'particulars_b': int(data.get('particulars_b', 0)),
                        'particulars_f': int(data.get('particulars_f', 0)),
                        'particulars_t': int(data.get('particulars_t', 0))
                    }],
                    operation='add'
                )
        except (ValueError, TypeError) as e:
            return error_response(f'Invalid batch data: {str(e)}')
    
    return success_response(
        data={'medicine': medicine_result},
        message='Medicine created successfully',
        status=201
    )

@app.route('/api/medicines/<int:medicine_id>', methods=['DELETE'])
@handle_errors
def delete_medicine_endpoint(medicine_id):
    """Delete a medicine"""
    with get_db_session() as db:
        medicine = db.query(Medicine).filter_by(id=medicine_id).first()
        if not medicine:
            return error_response('Medicine not found', 404)
        
        medicine_name = medicine.name
        db.delete(medicine)
        db.commit()
    
    return success_response(message=f'Medicine {medicine_name} deleted successfully')

@app.route('/api/test', methods=['GET'])
def test():
    """Simple test endpoint"""
    return jsonify({'message': 'Backend is working!'})

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')