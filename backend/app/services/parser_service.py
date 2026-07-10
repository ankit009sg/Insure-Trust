import re
import fitz  # PyMuPDF
from typing import Dict, Any, Tuple, List
from backend.app.schemas.schemas import ExtractedFieldSchema, FlagSchema

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts plain text from a PDF file using PyMuPDF."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text

def parse_extracted_text(text: str) -> Dict[str, Any]:
    """
    Attempts to search for life insurance application fields in the text.
    Uses regex to extract keys. Returns a dict of standard string values.
    """
    data = {}
    
    # Define regex patterns for keys
    patterns = {
        "full_name": r"(?:Full\s*Name|Name)[:\s]+([^\n\r]+)",
        "dob": r"(?:Date\s*of\s*Birth|DOB|Birthdate)[:\s]+([^\n\r]+)",
        "gender": r"(?:Gender|Sex)[:\s]+([^\n\r]+)",
        "tobacco_use": r"(?:Tobacco\s*Use|Smoker|Tobacco)[:\s]+(Yes|No|Y|N)",
        "pre_existing_conditions": r"(?:Pre-existing\s*Conditions|Medical\s*History|Conditions)[:\s]+([^\n\r]+)",
        "alcohol_consumption": r"(?:Alcohol\s*Consumption|Alcohol)[:\s]+(None|Moderate|Heavy|Social)",
        "family_history": r"(?:Family\s*History)[:\s]+([^\n\r]+)",
        "occupation": r"(?:Occupation|Job)[:\s]+([^\n\r]+)",
        "coverage_amount": r"(?:Coverage\s*Amount|Face\s*Amount|Coverage)[:\s]+(?:\$?\s*)?([\d,]+)",
        "beneficiary": r"(?:Beneficiary)[:\s]+([^\n\r]+)"
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data[key] = match.group(1).strip()
            
    return data

def run_validation_rules(fields: Dict[str, Any]) -> Tuple[Dict[str, ExtractedFieldSchema], str, str]:
    """
    Applies rules to the current fields.
    Returns:
      1. Updated fields dict with correct flags list.
      2. AI summary.
      3. Risk rating (low, medium, high).
    """
    updated_fields = {}
    
    # 1. Define fields and their default labels
    field_metadata = {
        "full_name": "Full Name",
        "dob": "Date of Birth",
        "gender": "Gender",
        "tobacco_use": "Tobacco Use",
        "pre_existing_conditions": "Pre-existing Conditions",
        "alcohol_consumption": "Alcohol Consumption",
        "family_history": "Family History",
        "occupation": "Occupation",
        "coverage_amount": "Coverage Amount",
        "beneficiary": "Beneficiary"
    }

    # 2. Extract values and populate defaults if missing
    for key, label in field_metadata.items():
        val = fields.get(key, {}).get("value") if isinstance(fields.get(key), dict) else fields.get(key)
        orig = fields.get(key, {}).get("original_value") if isinstance(fields.get(key), dict) else val
        
        if val is None:
            val = ""
        if orig is None:
            orig = val
            
        updated_fields[key] = {
            "label": label,
            "value": val,
            "original_value": orig,
            "flags": []
        }

    # 3. Apply validation logic
    
    # Full Name Check
    fn_val = str(updated_fields["full_name"]["value"]).strip()
    if not fn_val:
        updated_fields["full_name"]["flags"].append({
            "severity": "high",
            "message": "Applicant legal name is missing."
        })

    # DOB Check
    dob_val = str(updated_fields["dob"]["value"]).strip()
    if not dob_val:
        updated_fields["dob"]["flags"].append({
            "severity": "high",
            "message": "Date of Birth is missing. Crucial for mortality age calculation."
        })

    # Tobacco Use Check
    tob_val = str(updated_fields["tobacco_use"]["value"]).strip().lower()
    if tob_val in ["yes", "y", "true", "tobacco"]:
        updated_fields["tobacco_use"]["flags"].append({
            "severity": "high",
            "message": "Tobacco use detected. High correlation with respiratory and cardiovascular mortality."
        })

    # Pre-existing Conditions Check
    cond_val = str(updated_fields["pre_existing_conditions"]["value"]).strip().lower()
    if cond_val and cond_val != "none":
        # Critical conditions
        criticals = ["cancer", "heart disease", "stroke", "cardiovascular", "infarct"]
        chronics = ["diabetes", "hypertension", "high blood pressure", "asthma", "cholesterol"]
        
        if any(c in cond_val for c in criticals):
            updated_fields["pre_existing_conditions"]["flags"].append({
                "severity": "high",
                "message": "Critical pre-existing health condition. Requires manual underwriting and medical history."
            })
        elif any(c in cond_val for c in chronics):
            updated_fields["pre_existing_conditions"]["flags"].append({
                "severity": "medium",
                "message": "Chronic pre-existing condition. Risk assessment depends on management and treatment compliance."
            })
        else:
            updated_fields["pre_existing_conditions"]["flags"].append({
                "severity": "low",
                "message": f"Pre-existing condition detected ({cond_val}). Review standard health waivers."
            })

    # Alcohol Consumption Check
    alc_val = str(updated_fields["alcohol_consumption"]["value"]).strip().lower()
    if alc_val == "heavy":
        updated_fields["alcohol_consumption"]["flags"].append({
            "severity": "high",
            "message": "Excessive alcohol consumption noted. High risk of hepatic and systemic diseases."
        })
    elif alc_val in ["moderate", "social"]:
        updated_fields["alcohol_consumption"]["flags"].append({
            "severity": "low",
            "message": "Moderate alcohol consumption. Minor impact on underwriting criteria."
        })

    # Occupation Check
    occ_val = str(updated_fields["occupation"]["value"]).strip().lower()
    risky_jobs = ["pilot", "diver", "firefighter", "miner", "construction", "military"]
    if any(job in occ_val for job in risky_jobs):
        updated_fields["occupation"]["flags"].append({
            "severity": "medium",
            "message": f"High-risk occupation ({occ_val}). Standard mortality tables may not apply."
        })

    # Coverage Amount Check
    cov_val_str = str(updated_fields["coverage_amount"]["value"]).replace("$", "").replace(",", "").strip()
    try:
        cov_val = float(cov_val_str) if cov_val_str else 0
        if cov_val > 1000000:
            updated_fields["coverage_amount"]["flags"].append({
                "severity": "medium",
                "message": f"Jumbo coverage request (${cov_val:,.2f} > $1,000,000). Requires financial verification."
            })
    except ValueError:
        updated_fields["coverage_amount"]["flags"].append({
            "severity": "medium",
            "message": "Unable to parse coverage amount. Please input a numerical value."
        })

    # 4. Determine overall risk and flags count
    all_flags = []
    for field_key, field_data in updated_fields.items():
        all_flags.extend(field_data["flags"])

    # Determine risk rating
    has_high = any(f["severity"] == "high" for f in all_flags)
    has_med = any(f["severity"] == "medium" for f in all_flags)
    has_low = any(f["severity"] == "low" for f in all_flags)

    if has_high:
        risk_rating = "high"
    elif has_med:
        risk_rating = "medium"
    elif has_low:
        risk_rating = "low"
    else:
        risk_rating = "low"

    # 5. Generate AI summary
    name_str = updated_fields["full_name"]["value"] or "Unnamed Applicant"
    if not all_flags:
        summary = (
            f"AI Underwriting Review for {name_str}: All standard criteria met. "
            "No high, medium, or low risk flags were identified in the application fields. "
            "Applicant presents a clean underwriting profile. Recommended for expedited automated approval."
        )
    else:
        summary_bullets = []
        for fk, fd in updated_fields.items():
            for flg in fd["flags"]:
                summary_bullets.append(f"- {fd['label']}: {flg['message']}")
        
        summary = (
            f"AI Underwriting Review for {name_str}:\n"
            f"Application classified with **{risk_rating.upper()}** risk rating based on {len(all_flags)} active flag(s).\n\n"
            "Key Underwriting Concerns:\n" + "\n".join(summary_bullets) + "\n\n"
            "Action required: Applicant must edit and verify flagged fields or Policy Manager must review detailed clinical records."
        )

    # Transform flags list into list of FlagSchema Pydantic objects or dicts
    final_fields = {}
    for k, fd in updated_fields.items():
        final_fields[k] = ExtractedFieldSchema(
            label=fd["label"],
            value=fd["value"],
            original_value=fd["original_value"],
            flags=[FlagSchema(**f) for f in fd["flags"]]
        )

    return final_fields, summary, risk_rating

def process_document(file_path: str) -> Tuple[Dict[str, ExtractedFieldSchema], str, str]:
    """
    Parses document text, maps fields, runs validation rules.
    If text is empty (or no matches), defaults to a demo profile containing flags.
    """
    text = extract_text_from_pdf(file_path)
    extracted = parse_extracted_text(text)
    
    # If file contains no standard keywords or text, generate a flagged mock profile
    if not extracted or len(extracted) < 2:
        extracted = {
            "full_name": "Johnathan Doe",
            "dob": "1984-06-12",
            "gender": "Male",
            "tobacco_use": "Yes",
            "pre_existing_conditions": "Diabetes, Hypertension",
            "alcohol_consumption": "Moderate",
            "family_history": "Heart disease (father)",
            "occupation": "Construction Worker",
            "coverage_amount": "1500000",
            "beneficiary": "Jane Doe"
        }
    
    return run_validation_rules(extracted)
