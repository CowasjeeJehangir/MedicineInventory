from db import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy import ForeignKey, Boolean
from sqlalchemy.orm import relationship

class Medicine(Base):
    __tablename__ = "medicine"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    potential_allergens = Column(String)
    restock_threshold = Column(Integer)
    needs_prescription = Column(Boolean)
    
    batches = relationship("MedicineBatch", back_populates="medicine", cascade="all, delete-orphan")
    restock_logs = relationship("RestockLog", back_populates="medicine", cascade="all, delete-orphan")
    
    
class MedicineBatch(Base):
    __tablename__ = "medicine_batch"
    id = Column(Integer, primary_key=True)
    batch_no = Column(Integer, nullable=False)
    med_id = Column(Integer, ForeignKey("medicine.id"), nullable=False)
    restock_date = Column(DateTime)
    total_count = Column(Integer)
    best_before = Column(DateTime)
    particulars_b = Column(Integer)
    particulars_f = Column(Integer)
    particulars_t = Column(Integer)
    
    medicine = relationship("Medicine", back_populates="batches")
    inventory_items = relationship("Inventory", back_populates="medicine_batch", cascade="all, delete-orphan")
