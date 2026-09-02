from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, staff, patients, medicines, inventory, distribution, restock, wards
from db import engine, Base, SessionLocal
from auth.dependencies import get_password_hash
from models.staff import Staff, Credentials
import os

# Create database tables
Base.metadata.create_all(bind=engine)

def seed_default_admin():
    db = SessionLocal()
    try:
        if db.query(Credentials).first():
            return

        admin = Staff(
            cnic=1000000000000,
            name="System Admin",
            phone_number=0,
            designation="Admin",
        )
        db.add(admin)
        db.flush()
        db.add(Credentials(
            staff_id=admin.id,
            account_id="admin",
            password=get_password_hash("admin123"),
        ))
        db.commit()
        print("Seeded default admin account: admin / admin123")
    finally:
        db.close()

seed_default_admin()

app = FastAPI(
    title="Medicine Inventory Management System",
    description="API for managing hospital medicine inventory, staff, patients, and distribution",
    version="1.0.0"
)

# CORS middleware
frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
).rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(wards.router, prefix="/api/wards", tags=["Wards"])
app.include_router(medicines.router, prefix="/api/medicines", tags=["Medicines"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(distribution.router, prefix="/api/distribution", tags=["Distribution"])
app.include_router(restock.router, prefix="/api/restock", tags=["Restock"])

@app.get("/")
def read_root():
    return {
        "message": "Medicine Inventory Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
