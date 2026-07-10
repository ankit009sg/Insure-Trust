from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

# --- Auth Schemas ---

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "applicant"  # "applicant", "policy_manager", "senior_manager"

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Application Schemas ---

class FlagSchema(BaseModel):
    severity: str  # "low", "medium", "high"
    message: str

class ExtractedFieldSchema(BaseModel):
    label: str
    value: Any
    original_value: Any
    flags: List[FlagSchema] = []

class ApplicationCreate(BaseModel):
    extracted_data: Dict[str, ExtractedFieldSchema]
    summary: Optional[str] = None
    risk_rating: Optional[str] = "low"

class ApplicationUpdate(BaseModel):
    extracted_data: Dict[str, ExtractedFieldSchema]

class ApplicationAction(BaseModel):
    action: str  # "approve", "reject", "escalate"
    reason: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    applicant_id: int
    status: str
    file_path: Optional[str] = None
    extracted_data: Dict[str, ExtractedFieldSchema]
    summary: Optional[str] = None
    risk_rating: Optional[str] = None
    action_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
