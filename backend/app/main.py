import os
from dotenv import load_dotenv

# Load .env from project root before anything else
_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(_ROOT_DIR, ".env"))

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import json

from backend.app.database.connection import engine, Base, get_db
from backend.app.models import models
from backend.app.schemas import schemas
from backend.app.auth import auth
from backend.app.services import parser_service
from backend.app.core.logger import get_backend_logger
from backend.app.core.middleware import RequestLoggingMiddleware
from backend.app.api.logs import router as logs_router

logger = get_backend_logger()

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InsureVerify API",
    description="AI-powered life insurance application intake platform API",
    version="1.0.0"
)

# Register request/response logging middleware (runs before CORS)
app.add_middleware(RequestLoggingMiddleware)

# Include log receiver router for frontend events
app.include_router(logs_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.on_event("startup")
async def on_startup():
    logger.info("=" * 60)
    logger.info("InsureVerify API started. Logging active.")
    logger.info(f"  Backend log : logs/backend.log")
    logger.info(f"  Frontend log: logs/frontend.log")
    logger.info(f"  Uploads dir : {UPLOAD_DIR}")
    logger.info("=" * 60)


# --- Authentication Endpoints ---

@app.post("/api/v1/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        logger.warning(f"Registration blocked: email already exists | email={user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    hashed_pw = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_pw,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"User registered | id={new_user.id} email={new_user.email} role={new_user.role}")
    return new_user

@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login(
    username: str = Form(...),  # Support OAuth2 form data
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(models.User.email == username).first()
    if not db_user or not auth.verify_password(password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": db_user.email, "role": db_user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "email": db_user.email
    }

# Additional JSON-only login endpoint for ease of use in frontend fetch/axios
@app.post("/api/v1/auth/login-json", response_model=schemas.Token)
def login_json(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not db_user or not auth.verify_password(user_in.password, db_user.hashed_password):
        logger.warning(f"Login failed | email={user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": db_user.email, "role": db_user.role}
    )
    logger.info(f"Login success | email={db_user.email} role={db_user.role}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "email": db_user.email
    }

@app.get("/api/v1/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# --- Application Endpoints ---

@app.post("/api/v1/applications/upload", response_model=schemas.ApplicationOut)
def upload_application(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.RoleChecker(["applicant"])),
    db: Session = Depends(get_db)
):
    # Save the file
    file_extension = os.path.splitext(file.filename)[1]
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process document
    extracted_fields, summary, risk_rating = parser_service.process_document(file_path)
    
    # Store in database
    # Serialize the fields dictionary to dicts compatible with Application model
    serialized_fields = {}
    for key, f_schema in extracted_fields.items():
        serialized_fields[key] = f_schema.model_dump()

    new_app = models.Application(
        applicant_id=current_user.id,
        status="draft",
        file_path=file_path,
        extracted_data=serialized_fields,
        summary=summary,
        risk_rating=risk_rating
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    logger.info(
        f"Document uploaded | app_id={new_app.id} user={current_user.email}"
        f" risk={risk_rating} file={unique_filename}"
    )
    return new_app

@app.get("/api/v1/applications", response_model=List[schemas.ApplicationOut])
def get_applications(
    status_filter: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Application)
    
    if current_user.role == "applicant":
        query = query.filter(models.Application.applicant_id == current_user.id)
    elif current_user.role == "policy_manager":
        # Policy manager sees pending, but can also see approved/rejected/escalated
        if status_filter:
            query = query.filter(models.Application.status == status_filter)
        else:
            # Default dashboard: pending
            query = query.filter(models.Application.status.in_(["pending", "escalated", "approved", "rejected"]))
    elif current_user.role == "senior_manager":
        # Senior manager dashboard: escalated or resolved by senior manager
        if status_filter:
            query = query.filter(models.Application.status == status_filter)
        else:
            query = query.filter(models.Application.status.in_(["escalated", "approved", "rejected"]))
            
    return query.order_by(models.Application.updated_at.desc()).all()

@app.get("/api/v1/applications/{app_id}", response_model=schemas.ApplicationOut)
def get_application_by_id(
    app_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
        
    # Authorization checks
    if current_user.role == "applicant" and app_record.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
        
    return app_record

@app.put("/api/v1/applications/{app_id}/validate", response_model=schemas.ApplicationOut)
def validate_application_updates(
    app_id: int,
    updates: schemas.ApplicationUpdate,
    current_user: models.User = Depends(auth.RoleChecker(["applicant"])),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current_user.id
    ).first()
    
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or unauthorized."
        )
        
    if app_record.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit application details once submitted."
        )
        
    # Re-run rule validation with user provided updates
    # Map the updates JSON back to raw values for the validation engine
    raw_updated_fields = {}
    for key, field_val in updates.extracted_data.items():
        # Carry over original value, use the new edited value
        raw_updated_fields[key] = {
            "value": field_val.value,
            "original_value": field_val.original_value
        }
        
    extracted_fields, summary, risk_rating = parser_service.run_validation_rules(raw_updated_fields)
    
    # Store updated fields in DB
    serialized_fields = {}
    for key, f_schema in extracted_fields.items():
        serialized_fields[key] = f_schema.model_dump()
        
    app_record.extracted_data = serialized_fields
    app_record.summary = summary
    app_record.risk_rating = risk_rating
    
    db.commit()
    db.refresh(app_record)
    return app_record

@app.post("/api/v1/applications/{app_id}/submit", response_model=schemas.ApplicationOut)
def submit_application(
    app_id: int,
    current_user: models.User = Depends(auth.RoleChecker(["applicant"])),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current_user.id
    ).first()
    
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
        
    if app_record.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has already been submitted."
        )
        
    # Count total flags remaining in extracted_data
    flag_count = 0
    for field_key, field_data in app_record.extracted_data.items():
        flags = field_data.get("flags", [])
        flag_count += len(flags)
        
    if flag_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit application. There are {flag_count} active warning flags remaining. Please resolve them."
        )
        
    app_record.status = "pending"
    db.commit()
    db.refresh(app_record)
    logger.info(f"Application submitted | app_id={app_id} user={current_user.email}")
    return app_record

@app.post("/api/v1/applications/{app_id}/action", response_model=schemas.ApplicationOut)
def review_action(
    app_id: int,
    action_in: schemas.ApplicationAction,
    current_user: models.User = Depends(auth.RoleChecker(["policy_manager", "senior_manager"])),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
        
    action = action_in.action.lower()
    reason = action_in.reason
    
    # Policy Manager Actions
    if current_user.role == "policy_manager":
        if app_record.status not in ["pending"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Policy manager cannot action application in status: {app_record.status}"
            )
            
        if action == "approve":
            app_record.status = "approved"
        elif action == "reject":
            if not reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A rejection reason is required."
                )
            app_record.status = "rejected"
            app_record.action_reason = reason
        elif action == "escalate":
            if not reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An escalation reason is required."
                )
            app_record.status = "escalated"
            app_record.action_reason = reason
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action for Policy Manager. Allowed: approve, reject, escalate"
            )
            
    # Senior Manager Actions
    elif current_user.role == "senior_manager":
        if app_record.status != "escalated":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senior manager can only action escalated applications."
            )
            
        if action == "approve":
            app_record.status = "approved"
        elif action == "reject":
            if not reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A rejection reason is required."
                )
            app_record.status = "rejected"
            app_record.action_reason = reason
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action for Senior Manager. Allowed: approve, reject"
            )
            
    db.commit()
    db.refresh(app_record)
    logger.info(
        f"Review action | app_id={app_id} action={action}"
        f" by={current_user.email} role={current_user.role}"
        + (f" reason={reason}" if reason else "")
    )
    return app_record


@app.get("/api/v1/applications/{app_id}/pdf")
def get_application_pdf(
    app_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
        
    # Authorization checks
    if current_user.role == "applicant" and app_record.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
        
    if not app_record.file_path or not os.path.exists(app_record.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found on server."
        )
        
    return FileResponse(app_record.file_path, media_type="application/pdf")


@app.delete("/api/v1/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    current_user: models.User = Depends(auth.RoleChecker(["applicant"])),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current_user.id
    ).first()
    
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or unauthorized."
        )
        
    if app_record.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete application once submitted."
        )
        
    # Delete file from disk
    if app_record.file_path and os.path.exists(app_record.file_path):
        try:
            os.remove(app_record.file_path)
        except Exception as e:
            logger.error(f"Failed to delete file {app_record.file_path}: {e}")
            
    db.delete(app_record)
    db.commit()
    logger.info(f"Application deleted | app_id={app_id} user={current_user.email}")
    return


@app.get("/")
def read_root():
    return {"status": "healthy", "name": "InsureVerify API Gateway", "version": "1.0.0"}
