"""
Simple test script to verify API functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health Check: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_login():
    """Test login endpoint"""
    data = {
        "account_id": "admin",
        "password": "admin123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login/json", json=data)
    print(f"Login: {response.status_code}")
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"Token received: {token[:50]}...\n")
        return token
    else:
        print(f"Login failed: {response.json()}\n")
        return None

def test_get_medicines(token):
    """Test getting medicines"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/medicines/", headers=headers)
    print(f"Get Medicines: {response.status_code}")
    if response.status_code == 200:
        medicines = response.json()
        print(f"Found {len(medicines)} medicines")
        for med in medicines[:3]:  # Show first 3
            print(f"  - {med['name']}")
    print()

def test_get_inventory(token):
    """Test getting inventory"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/inventory/", headers=headers)
    print(f"Get Inventory: {response.status_code}")
    if response.status_code == 200:
        inventory = response.json()
        print(f"Found {len(inventory)} inventory items")
        for item in inventory[:3]:  # Show first 3
            print(f"  - {item.get('medicine_name', 'N/A')}: {item['available_quantity']} available")
    print()

def test_get_patients(token):
    """Test getting patients"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/patients/", headers=headers)
    print(f"Get Patients: {response.status_code}")
    if response.status_code == 200:
        patients = response.json()
        print(f"Found {len(patients)} patients")
        for patient in patients[:3]:  # Show first 3
            print(f"  - {patient['name']} (Ward: {patient.get('ward_id', 'N/A')})")
    print()

def test_low_stock(token):
    """Test low stock endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/medicines/low-stock", headers=headers)
    print(f"Low Stock Check: {response.status_code}")
    if response.status_code == 200:
        low_stock = response.json()
        print(f"Found {len(low_stock)} medicines with low stock")
        for item in low_stock:
            print(f"  - {item['medicine_name']}: {item['total_available']}/{item['restock_threshold']}")
    print()

def run_tests():
    """Run all tests"""
    print("=" * 50)
    print("Medicine Inventory API - Basic Tests")
    print("=" * 50)
    print()
    
    # Test health endpoint
    test_health()
    
    # Test login
    token = test_login()
    
    if token:
        # Test authenticated endpoints
        test_get_medicines(token)
        test_get_inventory(token)
        test_get_patients(token)
        test_low_stock(token)
    
    print("=" * 50)
    print("Tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    try:
        run_tests()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"Error: {e}")
