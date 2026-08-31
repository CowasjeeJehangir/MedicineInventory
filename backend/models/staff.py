from db import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True)
    cnic = Column(Integer, nullable=False, unique=True)
    name = Column(String, nullable=False)
    phone_number = Column(Integer, nullable=False)
    designation = Column(String, nullable=False)
    
    credentials = relationship("Credentials", back_populates="staff", uselist=False)
    logs = relationship("DistributionLog", back_populates="staff")
    restock_logs = relationship("RestockLog", back_populates="staff")
    
class Credentials(Base):
    __tablename__ = "credentials"
    
    staff_id = Column(Integer, ForeignKey("staff.id"), primary_key=True)
    account_id = Column(String, nullable=False, unique=True) # email or username
    password = Column(String)
    
    staff = relationship("Staff", back_populates="credentials")
