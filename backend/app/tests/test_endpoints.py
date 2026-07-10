import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from backend.app.database.connection import Base, get_db
from backend.app.main import app
from backend.app.models.models import User, Application

# Setup test SQLite DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_insureverify.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test_insureverify.db"):
        try:
            os.remove("./test_insureverify.db")
        except PermissionError:
            pass

def test_user_registration_and_login():
    # 1. Register User
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"email": "test_applicant@insureverify.com", "password": "password123", "role": "applicant"}
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == "test_applicant@insureverify.com"
    assert reg_response.json()["role"] == "applicant"

    # 2. Login User
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test_applicant@insureverify.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["role"] == "applicant"

def test_api_me_endpoint():
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "test_me@insureverify.com", "password": "password123", "role": "applicant"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test_me@insureverify.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Check Profile
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test_me@insureverify.com"

def test_application_upload_and_validation():
    # Register & Login Applicant
    client.post(
        "/api/v1/auth/register",
        json={"email": "app_user@insureverify.com", "password": "password123", "role": "applicant"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "app_user@insureverify.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload mock file
    # We will simulate uploading a small PDF / text file
    file_content = b"%PDF-1.4 mock pdf structure"
    files = {"file": ("application.pdf", file_content, "application/pdf")}
    
    upload_res = client.post("/api/v1/applications/upload", files=files, headers=headers)
    assert upload_res.status_code == 200
    app_data = upload_res.json()
    assert app_data["status"] == "draft"
    assert "extracted_data" in app_data
    assert "tobacco_use" in app_data["extracted_data"]

    # Validate updates
    # Change Tobacco to No and Pre-existing conditions to None to resolve flags
    app_id = app_data["id"]
    updated_fields = app_data["extracted_data"].copy()
    updated_fields["tobacco_use"]["value"] = "No"
    updated_fields["pre_existing_conditions"]["value"] = "None"
    updated_fields["occupation"]["value"] = "Software Engineer"
    updated_fields["coverage_amount"]["value"] = "500000"
    # Also resolve alcohol flag since it prevents submission
    updated_fields["alcohol_consumption"]["value"] = "None"

    validate_res = client.put(
        f"/api/v1/applications/{app_id}/validate",
        json={"extracted_data": updated_fields},
        headers=headers
    )
    assert validate_res.status_code == 200
    assert validate_res.json()["risk_rating"] == "low"

    # Submit application
    submit_res = client.post(f"/api/v1/applications/{app_id}/submit", headers=headers)
    if submit_res.status_code != 200:
        print(f"Submit failed body: {submit_res.json()}")
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "pending"

def test_get_application_pdf_and_delete():
    # Register & Login Applicant
    client.post(
        "/api/v1/auth/register",
        json={"email": "pdf_user@insureverify.com", "password": "password123", "role": "applicant"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "pdf_user@insureverify.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload mock file
    file_content = b"%PDF-1.4 mock pdf structure"
    files = {"file": ("application.pdf", file_content, "application/pdf")}
    upload_res = client.post("/api/v1/applications/upload", files=files, headers=headers)
    assert upload_res.status_code == 200
    app_id = upload_res.json() ["id"]

    # 1. Fetch PDF
    pdf_res = client.get(f"/api/v1/applications/{app_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"

    # 2. Delete Application
    delete_res = client.delete(f"/api/v1/applications/{app_id}", headers=headers)
    assert delete_res.status_code == 204

    # 3. Check PDF and Application details are gone/404
    get_res = client.get(f"/api/v1/applications/{app_id}", headers=headers)
    assert get_res.status_code == 404
