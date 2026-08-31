from db import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class DistributionLog(Base): #stock inward outward (TBC)
    __tablename__ = "distribution_log"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    date_given = Column(DateTime, nullable=False)
    notes = Column(String)

    patient = relationship("Patient", back_populates="billing_logs")
    staff = relationship("Staff", back_populates="logs")
    inventory = relationship("Inventory", back_populates="distribution_logs")
    
class RestockLog(Base): #Access only to admins
    __tablename__ = "restock_log"

    id = Column(Integer, primary_key=True)
    med_id = Column(Integer, ForeignKey("medicine.id"), nullable=False)
    batch_no = Column(Integer, nullable=False)
    quantity_added = Column(Integer, nullable=False)
    restock_date = Column(DateTime, nullable=False)
    restocked_by = Column(Integer, ForeignKey("staff.id"), nullable=False)

    medicine = relationship("Medicine", back_populates="restock_logs")
    staff = relationship("Staff", back_populates="restock_logs")
    inventory_entry = relationship("Inventory", uselist=False, back_populates="restock_log")

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True)
    med_batch_id = Column(Integer, ForeignKey("medicine_batch.id"), nullable=False)
    price_per_unit = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    restock_log_id = Column(Integer, ForeignKey("restock_log.id"))  # trace origin

    medicine_batch = relationship("MedicineBatch", back_populates="inventory_items")
    restock_log = relationship("RestockLog", back_populates="inventory_entry")
    distribution_logs = relationship("DistributionLog", back_populates="inventory", cascade="all, delete-orphan")
