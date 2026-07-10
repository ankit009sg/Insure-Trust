from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "applicant", "policy_manager", "senior_manager"

    applications = relationship("Application", back_populates="applicant")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="draft")  # "draft", "pending", "approved", "rejected", "escalated"
    file_path = Column(String, nullable=True)
    extracted_data = Column(JSON, nullable=False)  # JSON representation of fields with values, flags
    summary = Column(String, nullable=True)
    risk_rating = Column(String, nullable=True)  # "low", "medium", "high"
    action_reason = Column(String, nullable=True)  # Reason for rejection or escalation
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = relationship("User", back_populates="applications")
