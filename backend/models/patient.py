from db import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

class Ward(Base):
    __tablename__ = "ward"
    
    id = Column(Integer, primary_key=True)
    ward_code = Column(String, unique=True, nullable=False)
    
    patients = relationship("Patient", back_populates="ward")

class Patient(Base):
    __tablename__ = "patient"
    
    id = Column(Integer, primary_key=True)
    cnic = Column(Integer, unique=True)
    name = Column(String, nullable=False)
    phone_number = Column(Integer)
    ward_id = Column(Integer, ForeignKey("ward.id"))
    diagnosis = Column(String)
    medicines = Column(String)
    
    billing_logs = relationship("DistributionLog", back_populates="patient", cascade="all, delete-orphan")
    ward = relationship("Ward", back_populates="patients")

    @property
    def ward_code(self):
        return self.ward.ward_code if self.ward else None
