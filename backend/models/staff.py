from db import Base
from sqlalchemy import Column, Integer, BigInteger, String, ForeignKey, DateTime, CheckConstraint
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True)
    cnic = Column(BigInteger, nullable=False, unique=True)
    name = Column(String, nullable=False)
    phone_number = Column(BigInteger, nullable=False)
    designation = Column(String, nullable=False)
    email = Column(String(320), nullable=True, unique=True)
    
    credentials = relationship("Credentials", back_populates="staff", uselist=False)
    logs = relationship("DistributionLog", back_populates="staff")
    restock_logs = relationship("RestockLog", back_populates="staff")
    
class Credentials(Base):
    __tablename__ = "credentials"
    
    staff_id = Column(Integer, ForeignKey("staff.id"), primary_key=True)
    account_id = Column(String, nullable=False, unique=True) # email or username
    password = Column(String)
    
    staff = relationship("Staff", back_populates="credentials")

class Invitation(Base):
    __tablename__ = "invitation"

    invite_id = Column(Integer, primary_key=True)
    invite_email = Column(String(320), nullable=False)
    cnic = Column(BigInteger, nullable=False)
    name = Column(String, nullable=False)
    phone_number = Column(BigInteger, nullable=False)
    designation = Column(String, nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True)
    inviting_admin = Column(Integer, ForeignKey("staff.id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'accepted', 'revoked', 'expired')",
                        name="invitation_status_check"),
    )
    admin = relationship("Staff")
