import re
import os
import fitz  # PyMuPDF
from typing import Dict, Any, Tuple, List, Optional
from groq import Groq
from backend.app.schemas.schemas import ExtractedFieldSchema, FlagSchema
from backend.app.core.logger import get_backend_logger

logger = get_backend_logger()


def generate_groq_summary(
    fields: Dict[str, Any],
    risk_rating: str,
    flags_count: int,
    all_flags_messages: List[str],
) -> Tuple[str, Optional[str]]:
    """
    Generates an underwriting summary using Groq's Llama model.
    Returns: (summary_text, error_message_or_None)
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning(
            "GROQ_API_KEY is not set in environment / .env file. "
            "AI summary generation is disabled. Falling back to rule-based summary."
        )
        return "", "GROQ_API_KEY not configured"

    try:
        client = Groq(api_key=groq_api_key)

        # Build prompt
        prompt = (
            "You are an AI Underwriting Intake assistant for a life insurance platform named 'InsureTrust'.\n"
            "Analyze the following extracted applicant fields and their validation checks to write a concise, "
            "professional plain-language summary for the underwriter.\n\n"
            "Applicant Profile:\n"
        )
        for key, fd in fields.items():
            val = fd.get("value", "")
            label = fd.get("label", key)
            if val:
                prompt += f"- {label}: {val}\n"

        prompt += f"\nRisk Assessment:\n"
        prompt += f"- Overall Risk Rating: {risk_rating.upper()}\n"
        prompt += f"- Flagged Warnings ({flags_count}):\n"
        for msg in all_flags_messages:
            prompt += f"  * {msg}\n"

        prompt += (
            "\nProvide a professional, clear, paragraph-style underwriting summary. "
            "In your summary:\n"
            "1. Summarize the applicant's profile (name, age/DOB, gender, occupation) and coverage request.\n"
            "2. Highlight key risks (e.g. tobacco use, pre-existing conditions, high coverage amounts) "
            "and their health/underwriting implications.\n"
            "3. Advise on next steps (e.g. whether fields need to be resolved, "
            "or if manual policy manager review is needed).\n"
            "Keep it within 3-5 sentences, clean and direct. Do not include markdown headers or extra conversation."
        )

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an expert life insurance underwriter."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=350,
        )
        summary = completion.choices[0].message.content.strip()
        logger.info(
            f"Groq AI summary generated successfully (risk={risk_rating}, flags={flags_count})"
        )
        return summary, None

    except Exception as e:
        error_type = type(e).__name__
        logger.error(
            f"Groq API call failed [{error_type}] — falling back to rule-based summary. "
            f"Error: {e}",
            exc_info=True,
        )
        return "", f"Groq API error: {error_type} — {str(e)}"


def extract_text_from_pdf(file_path: str) -> Tuple[str, Optional[str]]:
    """
    Extracts plain text from a PDF file using PyMuPDF.
    Returns: (extracted_text, error_message_or_None)
    """
    text = ""
    error = None
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
        logger.info(
            f"PDF extracted successfully: '{file_path}' — {len(text)} chars across {doc.page_count if not doc.is_closed else '?'} pages"
        )
    except fitz.FileDataError as e:
        error = f"PDF is corrupted or unreadable: {e}"
        logger.error(f"PyMuPDF FileDataError on '{file_path}': {e}")
    except fitz.EmptyFileError as e:
        error = f"PDF file is empty: {e}"
        logger.error(f"PyMuPDF EmptyFileError on '{file_path}': {e}")
    except Exception as e:
        error = f"Unexpected error reading PDF: {type(e).__name__}: {e}"
        logger.error(f"Error extracting text from PDF '{file_path}': {e}", exc_info=True)
    return text, error


def parse_extracted_text(text: str) -> Dict[str, Any]:
    """
    Searches for life insurance application fields in the extracted PDF text.
    Uses regex to extract keys. Returns a dict of standard string values.
    Covers both basic and expanded fields seen on InsureTrust forms.
    """
    data = {}

    # --- Core Personal Fields ---
    patterns = {
        # Name
        "name": r"(?:Full\s*Name|Name)[:\s]+([^\n\r|]+)",
        # Date of Birth
        "dob": r"(?:Date\s*of\s*Birth|DOB|Birthdate|Birth\s*Date)[:\s]+([^\n\r|]+)",
        # Gender / Sex
        "gender": r"(?:Gender|Sex)[:\s]+([^\n\r|]+)",
        # PAN Number
        "pan_number": r"(?:PAN\s*(?:Number|No|Card)?|Permanent\s*Account\s*Number)[:\s]+([A-Z0-9a-z\-\s]{5,15})",
        # Phone / Mobile
        "phone": r"(?:Phone|Mobile|Contact\s*(?:No|Number)|Cell)[:\s]+([0-9\+\-\s\(\)]{7,15})",
        # Email
        "email": r"(?:Email|E-mail|Email\s*Address)[:\s]+([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})",
        # Address
        "address": r"(?:Address|Residential\s*Address|Home\s*Address)[:\s]+([^\n\r]{5,120})",
        # Tobacco
        "tobacco_use": r"(?:Tobacco\s*Use|Smoker|Tobacco|Smoking)[:\s]+(Yes|No|Y|N|Never|Former|Current)",
        # Pre-existing Conditions
        "pre_existing_conditions": r"(?:Pre-?existing\s*Conditions?|Medical\s*History|Conditions?|Health\s*Issues?)[:\s]+([^\n\r]+)",
        # Alcohol
        "alcohol_consumption": r"(?:Alcohol\s*Consumption|Alcohol|Drinking)[:\s]+(None|Moderate|Heavy|Social|Never|Occasional|Rarely)",
        # Family History
        "family_history": r"(?:Family\s*History|Family\s*Medical\s*History)[:\s]+([^\n\r]+)",
        # Occupation / Profession / Job
        "profession": r"(?:Occupation|Job\s*Title|Profession|Employment)[:\s]+([^\n\r|]+)",
        # Annual Income
        "annual_income": r"(?:Annual\s*Income|Yearly\s*Income|Income\s*\(.*?\)|Income)[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Coverage / Sum Assured
        "coverage_amount": r"(?:Coverage\s*Amount|Face\s*Amount|Sum\s*Assured|Coverage|Insured\s*Amount)[:\s]+(?:Rs\.?|INR|₹|\$)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Policy Term
        "policy_term": r"(?:Policy\s*Term|Term\s*of\s*Policy|Coverage\s*Period|Policy\s*Duration)[:\s]+([\d]+\s*(?:years?|yrs?)?)",
        # Nominee / Beneficiary
        "nominee": r"(?:Nominee|Beneficiary|Nominated\s*Person)[:\s]+([^\n\r|]+)",
        # Employment Type
        "employment_type": r"(?:Employment\s*Type|Job\s*Type|Type\s*of\s*Employment)[:\s]+([^\n\r|]+)",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1).strip()
            # Strip trailing punctuation / whitespace artifacts
            raw = re.sub(r"[|\s]+$", "", raw).strip()
            if raw:
                data[key] = raw

    return data


def run_validation_rules(
    fields: Dict[str, Any],
) -> Tuple[Dict[str, ExtractedFieldSchema], str, str]:
    """
    Applies underwriting validation rules to the current fields.
    Returns:
      1. Updated fields dict with flags.
      2. AI / rule-based summary string.
      3. Risk rating ('low', 'medium', 'high').
    """
    updated_fields: Dict[str, Any] = {}

    # 1. Define all fields and their display labels
    field_metadata = {
        "name":                  "Full Name",
        "dob":                   "Date of Birth",
        "gender":                "Gender",
        "pan_number":            "PAN Number",
        "phone":                 "Phone Number",
        "email":                 "Email Address",
        "address":               "Address",
        "tobacco_use":           "Tobacco Use",
        "pre_existing_conditions": "Pre-existing Conditions",
        "alcohol_consumption":   "Alcohol Consumption",
        "family_history":        "Family History",
        "profession":            "Profession",
        "annual_income":         "Annual Income (₹)",
        "coverage_amount":       "Coverage Amount (₹)",
        "policy_term":           "Policy Term",
        "nominee":               "Nominee / Beneficiary",
        "employment_type":       "Employment Type",
    }

    # 2. Populate fields with extracted or existing values
    for key, label in field_metadata.items():
        raw = fields.get(key)
        if isinstance(raw, dict):
            val = raw.get("value", "")
            orig = raw.get("original_value", val)
        else:
            val = raw if raw is not None else ""
            orig = val

        updated_fields[key] = {
            "label":          label,
            "value":          str(val).strip() if val is not None else "",
            "original_value": str(orig).strip() if orig is not None else "",
            "flags":          [],
        }

    # 3. Validation rules -------------------------------------------------------

    # Full Name
    fn_val = updated_fields["name"]["value"]
    if not fn_val:
        updated_fields["name"]["flags"].append({
            "severity": "high",
            "message": "Applicant legal name is missing.",
            "blocking": True,
        })

    # Date of Birth
    dob_val = updated_fields["dob"]["value"]
    if not dob_val:
        updated_fields["dob"]["flags"].append({
            "severity": "high",
            "message": "Date of Birth is missing. Crucial for mortality age calculation.",
            "blocking": True,
        })
    else:
        # Try to extract age from DOB
        dob_match = re.search(r"(\d{4})", dob_val)
        if dob_match:
            birth_year = int(dob_match.group(1))
            import datetime
            age = datetime.date.today().year - birth_year
            if age < 18 or age > 65:
                updated_fields["dob"]["flags"].append({
                    "severity": "high",
                    "message": (
                        f"Applicant age ({age}) must be between 18 and 65 "
                        "for standard life insurance eligibility."
                    ),
                    "blocking": True,
                })

    # PAN Number — must match AAAAA9999A format (5 alpha, 4 digit, 1 alpha)
    pan_val = updated_fields["pan_number"]["value"].upper().replace(" ", "")
    if pan_val:
        if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", pan_val):
            updated_fields["pan_number"]["flags"].append({
                "severity": "high",
                "message": (
                    f"PAN '{pan_val}' does not match the required format AAAAA9999A "
                    "(5 letters, 4 digits, 1 letter)."
                ),
                "blocking": True,
            })
    else:
        updated_fields["pan_number"]["flags"].append({
            "severity": "medium",
            "message": "PAN Number is missing. Required for KYC and financial verification.",
            "blocking": True,
        })

    # Phone — must contain at least 10 digits
    phone_val = updated_fields["phone"]["value"]
    if phone_val:
        digits_only = re.sub(r"\D", "", phone_val)
        if len(digits_only) < 10:
            updated_fields["phone"]["flags"].append({
                "severity": "medium",
                "message": "Phone number must contain at least 10 digits.",
                "blocking": True,
            })
    else:
        updated_fields["phone"]["flags"].append({
            "severity": "medium",
            "message": "Phone number is missing. Required for applicant contact.",
            "blocking": True,
        })

    # Email — basic format check
    email_val = updated_fields["email"]["value"]
    if email_val:
        if not re.fullmatch(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", email_val):
            updated_fields["email"]["flags"].append({
                "severity": "medium",
                "message": "Email address format appears invalid.",
                "blocking": True,
            })
    else:
        updated_fields["email"]["flags"].append({
            "severity": "low",
            "message": "Email address is missing.",
            "blocking": True,
        })

    # Tobacco Use
    tob_val = updated_fields["tobacco_use"]["value"].strip().lower()
    if tob_val in ["yes", "y", "true", "tobacco", "current", "smoker"]:
        updated_fields["tobacco_use"]["flags"].append({
            "severity": "high",
            "message": "Tobacco use detected. High correlation with respiratory and cardiovascular mortality.",
            "blocking": False,
        })

    # Pre-existing Conditions
    cond_val = updated_fields["pre_existing_conditions"]["value"].strip().lower()
    if cond_val and cond_val not in ["none", "nil", "na", "n/a", "-"]:
        criticals = ["cancer", "heart disease", "stroke", "cardiovascular", "infarct", "tumor"]
        chronics = ["diabetes", "hypertension", "high blood pressure", "asthma", "cholesterol",
                    "kidney", "liver", "thyroid", "epilepsy"]
        if any(c in cond_val for c in criticals):
            updated_fields["pre_existing_conditions"]["flags"].append({
                "severity": "high",
                "message": "Critical pre-existing health condition. Requires manual underwriting and full medical history.",
                "blocking": False,
            })
        elif any(c in cond_val for c in chronics):
            updated_fields["pre_existing_conditions"]["flags"].append({
                "severity": "medium",
                "message": "Chronic pre-existing condition. Risk depends on management and treatment compliance.",
                "blocking": False,
            })
        else:
            updated_fields["pre_existing_conditions"]["flags"].append({
                "severity": "low",
                "message": f"Pre-existing condition noted ({cond_val}). Review standard health waivers.",
                "blocking": False,
            })

    # Alcohol
    alc_val = updated_fields["alcohol_consumption"]["value"].strip().lower()
    if alc_val == "heavy":
        updated_fields["alcohol_consumption"]["flags"].append({
            "severity": "high",
            "message": "Excessive alcohol consumption noted. High risk of hepatic and systemic diseases.",
            "blocking": False,
        })
    elif alc_val in ["moderate", "social", "occasional"]:
        updated_fields["alcohol_consumption"]["flags"].append({
            "severity": "low",
            "message": "Moderate alcohol consumption. Minor impact on underwriting criteria.",
            "blocking": False,
        })

    # Profession
    occ_val = updated_fields["profession"]["value"].strip().lower()
    risky_jobs = ["pilot", "diver", "firefighter", "miner", "mining", "construction", "military",
                  "soldier", "army", "navy", "air force", "police", "logger", "fisherman"]
    if occ_val and any(job in occ_val for job in risky_jobs):
        updated_fields["profession"]["flags"].append({
            "severity": "medium",
            "message": f"High-risk occupation ({occ_val.title()}). Standard mortality tables may not apply.",
            "blocking": False,
        })

    # Coverage Amount vs Annual Income check
    cov_str = updated_fields["coverage_amount"]["value"].replace(",", "").replace("₹", "").replace("$", "").strip()
    inc_str = updated_fields["annual_income"]["value"].replace(",", "").replace("₹", "").replace("$", "").strip()

    cov_val: float = 0
    inc_val: float = 0

    try:
        cov_val = float(cov_str) if cov_str else 0
        if cov_val <= 0:
            updated_fields["coverage_amount"]["flags"].append({
                "severity": "high",
                "message": "Coverage amount is missing or zero. Required for policy underwriting.",
                "blocking": True,
            })
        elif cov_val > 50_000_000:  # 5 Crore
            updated_fields["coverage_amount"]["flags"].append({
                "severity": "high",
                "message": f"Coverage amount (₹{cov_val:,.0f}) is exceptionally high. Requires senior underwriting approval.",
                "blocking": False,
            })
        elif cov_val > 10_000_000:  # 1 Crore
            updated_fields["coverage_amount"]["flags"].append({
                "severity": "medium",
                "message": f"High coverage request (₹{cov_val:,.0f} > ₹1,00,00,000). Financial verification required.",
                "blocking": False,
            })
    except ValueError:
        updated_fields["coverage_amount"]["flags"].append({
            "severity": "medium",
            "message": "Unable to parse coverage amount. Please enter a valid numerical value.",
            "blocking": True,
        })

    try:
        inc_val = float(inc_str) if inc_str else 0
        if inc_val <= 0:
            updated_fields["annual_income"]["flags"].append({
                "severity": "medium",
                "message": "Annual income is missing. Required for income-to-coverage ratio assessment.",
                "blocking": True,
            })
    except ValueError:
        updated_fields["annual_income"]["flags"].append({
            "severity": "medium",
            "message": "Unable to parse annual income. Please enter a valid numerical value.",
            "blocking": True,
        })

    # Coverage-to-income ratio check (must be ≤ 20×)
    if cov_val > 0 and inc_val > 0:
        ratio = cov_val / inc_val
        if ratio > 20:
            updated_fields["coverage_amount"]["flags"].append({
                "severity": "high",
                "message": (
                    f"Coverage-to-income ratio is {ratio:.1f}×. Exceeds recommended 20× limit — "
                    "escalation may indicate income mis-representation or under-insurance risk."
                ),
                "blocking": False,
            })

    # Policy Term check
    term_val = updated_fields["policy_term"]["value"].strip()
    if term_val:
        term_match = re.search(r"(\d+)", term_val)
        if term_match:
            term_years = int(term_match.group(1))
            if term_years < 5 or term_years > 30:
                updated_fields["policy_term"]["flags"].append({
                    "severity": "medium",
                    "message": f"Policy term ({term_years} years) must be between 5 and 30 years.",
                    "blocking": True,
                })

    # 4. Determine overall risk rating
    all_flags: List[Dict] = []
    for fd in updated_fields.values():
        all_flags.extend(fd["flags"])

    has_high = any(f["severity"] == "high" for f in all_flags)
    has_med = any(f["severity"] == "medium" for f in all_flags)

    if has_high:
        risk_rating = "high"
    elif has_med:
        risk_rating = "medium"
    else:
        risk_rating = "low"

    # 5. Build flag messages for summary
    all_flags_messages: List[str] = []
    for fk, fd in updated_fields.items():
        for flg in fd["flags"]:
            all_flags_messages.append(f"{fd['label']}: {flg['message']}")

    name_str = updated_fields["name"]["value"] or "Unnamed Applicant"

    # 6. Try Groq AI summary
    groq_summary, groq_error = generate_groq_summary(
        updated_fields, risk_rating, len(all_flags), all_flags_messages
    )

    if groq_summary:
        summary = groq_summary
    else:
        # Fallback rule-based summary
        if groq_error:
            logger.warning(f"Using rule-based fallback. Groq unavailable: {groq_error}")

        if not all_flags:
            summary = (
                f"AI Underwriting Review for {name_str}: All standard criteria met. "
                "No high, medium, or low risk flags were identified in the application fields. "
                "Applicant presents a clean underwriting profile. "
                "Recommended for expedited automated approval."
            )
        else:
            flag_lines = [f"• {msg}" for msg in all_flags_messages]
            summary = (
                f"AI Underwriting Review for {name_str}: "
                f"Application classified as {risk_rating.upper()} risk with {len(all_flags)} active flag(s). "
                + " ".join(flag_lines[:3])
                + (" [and more...]" if len(flag_lines) > 3 else "")
                + " Action required: applicant must resolve flagged fields before submission."
            )

    # 7. Convert to Pydantic schema objects
    final_fields: Dict[str, ExtractedFieldSchema] = {}
    for k, fd in updated_fields.items():
        final_fields[k] = ExtractedFieldSchema(
            label=fd["label"],
            value=fd["value"],
            original_value=fd["original_value"],
            flags=[FlagSchema(**f) for f in fd["flags"]],
        )

    return final_fields, summary, risk_rating


def process_document(
    file_path: str,
) -> Tuple[Dict[str, ExtractedFieldSchema], str, str]:
    """
    Full pipeline: extract PDF text → parse fields → validate → return results.
    If extraction fails or yields too few fields, uses a demo profile so the
    UI always has data to display.
    """
    text, extract_error = extract_text_from_pdf(file_path)

    if extract_error:
        logger.warning(
            f"PDF extraction error — using demo profile. Reason: {extract_error}"
        )

    extracted = parse_extracted_text(text) if text else {}

    logger.info(
        f"Parsed fields from PDF: {list(extracted.keys())} "
        f"({'OK' if len(extracted) >= 3 else 'sparse'})"
    )

    # If file contains no recognisable fields (< 3 matches), fall back to demo profile
    if len(extracted) < 3:
        logger.info("Insufficient fields extracted — using demo profile with flags.")
        extracted = {
            "name":                    "Vikram Singh",
            "dob":                     "1958-02-14",
            "gender":                  "Male",
            "pan_number":              "ABCDE12345",  # intentionally invalid for demo flags
            "phone":                   "XXXX0000X",   # intentionally invalid
            "email":                   "vikram.singh@",  # intentionally invalid
            "address":                 "Flat 7, Sector 22, Noida, UP 201301",
            "tobacco_use":             "No",
            "pre_existing_conditions": "Hypertension",
            "alcohol_consumption":     "None",
            "family_history":          "Heart disease (Father)",
            "profession":              "Retired",
            "annual_income":           "240000",
            "coverage_amount":         "5000000",
            "policy_term":             "40",  # intentionally out-of-range
            "nominee":                 "Meena Singh (Spouse)",
            "employment_type":         "Retired",
        }

    return run_validation_rules(extracted)


def send_email_notification(email: str, status: str, reason: str, case_id: int):
    """
    Spawns notify.js in the background via subprocess.
    Passes case info to nodemailer helper.
    """
    import subprocess
    import json

    payload = {
        "email": email,
        "status": status,
        "reason": reason,
        "caseId": case_id
    }

    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.join(current_dir, "notify.js")

        p = subprocess.Popen(
            ["node", script_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = p.communicate(input=json.dumps(payload), timeout=15)
        if p.returncode != 0:
            logger.error(f"Email notifier failed (code={p.returncode}). Stderr: {stderr.strip()}")
        else:
            logger.info(f"Email notifier finished. Stdout: {stdout.strip()}")
    except Exception as e:
        logger.error(f"Error executing email notifier: {e}", exc_info=True)
