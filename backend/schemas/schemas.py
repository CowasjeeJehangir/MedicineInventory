from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# ============= Authentication Schemas =============
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    account_id: Optional[str] = None

class LoginRequest(BaseModel):
    account_id: str
    password: str

# ============= Staff Schemas =============
class StaffBase(BaseModel):
    cnic: int
    name: str
    phone_number: int
    designation: str

class StaffCreate(StaffBase):
    account_id: str
    password: str

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[int] = None
    designation: Optional[str] = None

class StaffResponse(StaffBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StaffWithCredentials(StaffResponse):
    account_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ============= Patient Schemas =============
class PatientBase(BaseModel):
    cnic: Optional[int] = None
    name: str
    phone_number: Optional[int] = None
    ward_id: Optional[int] = None
    ward_code: Optional[str] = None
    diagnosis: Optional[str] = None
    medicines: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[int] = None
    ward_id: Optional[int] = None
    diagnosis: Optional[str] = None
    medicines: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ============= Ward Schemas =============
class WardBase(BaseModel):
    ward_code: str

class WardCreate(WardBase):
    pass

class WardUpdate(BaseModel):
    ward_code: Optional[str] = None

class WardResponse(WardBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class WardWithPatients(WardResponse):
    patients: list[PatientResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ============= Medicine Schemas =============
class MedicineBase(BaseModel):
    name: str
    potential_allergens: Optional[str] = None
    restock_threshold: Optional[int] = None
    needs_prescription: Optional[bool] = False

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    potential_allergens: Optional[str] = None
    restock_threshold: Optional[int] = None
    needs_prescription: Optional[bool] = None

class MedicineResponse(MedicineBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ============= Medicine Batch Schemas =============
class MedicineBatchBase(BaseModel):
    batch_no: int
    med_id: int
    restock_date: Optional[datetime] = None
    total_count: Optional[int] = None
    best_before: Optional[datetime] = None
    particulars_b: Optional[int] = None
    particulars_f: Optional[int] = None
    particulars_t: Optional[int] = None

class MedicineBatchCreate(MedicineBatchBase):
    pass

class MedicineBatchUpdate(BaseModel):
    total_count: Optional[int] = None
    best_before: Optional[datetime] = None
    particulars_b: Optional[int] = None
    particulars_f: Optional[int] = None
    particulars_t: Optional[int] = None

class MedicineBatchResponse(MedicineBatchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ============= Inventory Schemas =============
class InventoryBase(BaseModel):
    med_batch_id: int
    price_per_unit: float
    quantity: int
    available_quantity: int
    restock_log_id: Optional[int] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    price_per_unit: Optional[float] = None
    quantity: Optional[int] = None
    available_quantity: Optional[int] = None

class InventoryResponse(InventoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class InventoryDetailResponse(InventoryResponse):
    medicine_id: Optional[int] = None
    medicine_name: Optional[str] = None
    batch_no: Optional[int] = None
    best_before: Optional[datetime] = None
    restock_date: Optional[datetime] = None
    total_count: Optional[int] = None
    particulars_b: Optional[int] = None
    particulars_f: Optional[int] = None
    particulars_t: Optional[int] = None
    potential_allergens: Optional[str] = None
    restock_threshold: Optional[int] = None
    needs_prescription: Optional[bool] = None
    model_config = ConfigDict(from_attributes=True)

# ============= Distribution Log Schemas =============
class DistributionLogBase(BaseModel):
    patient_id: int
    staff_id: int
    inventory_id: int
    quantity: int
    date_given: datetime
    notes: Optional[str] = None

class DistributionLogCreate(BaseModel):
    patient_id: int
    inventory_id: int
    quantity: int
    notes: Optional[str] = None

class DistributionLogResponse(DistributionLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DistributionLogDetailResponse(DistributionLogResponse):
    patient_name: Optional[str] = None
    staff_name: Optional[str] = None
    medicine_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ============= Restock Log Schemas =============
class RestockLogBase(BaseModel):
    med_id: int
    batch_no: int
    quantity_added: int
    restock_date: datetime

class RestockLogCreate(BaseModel):
    med_id: int
    batch_no: int
    quantity_added: int
    price_per_unit: float
    best_before: Optional[datetime] = None
    particulars_b: Optional[int] = None
    particulars_f: Optional[int] = None
    particulars_t: Optional[int] = None

class RestockLogResponse(RestockLogBase):
    id: int
    restocked_by: int
    model_config = ConfigDict(from_attributes=True)

class RestockLogDetailResponse(RestockLogResponse):
    medicine_name: Optional[str] = None
    restocked_by_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ============= Dashboard/Statistics Schemas =============
class LowStockItem(BaseModel):
    medicine_id: int
    medicine_name: str
    total_available: int
    restock_threshold: int

class ExpiringBatch(BaseModel):
    batch_id: int
    medicine_name: str
    batch_no: int
    best_before: datetime
    available_quantity: int
    days_until_expiry: int

class DashboardStats(BaseModel):
    total_medicines: int
    total_inventory_items: int
    low_stock_count: int
    expiring_soon_count: int
    total_patients: int
    distributions_today: int
