"""
TalentX AI Service
Resume parsing, embeddings, and AI-powered features
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import urllib.request
import urllib.error

app = FastAPI(
    title="TalentX AI Service",
    description="AI-powered features for the TalentX ATS",
    version="0.1.0",
)

# CORS Configuration
# In production, set ALLOWED_ORIGINS env var to comma-separated list of allowed origins
# e.g., ALLOWED_ORIGINS=https://app.ayphen.com,https://admin.ayphen.com
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []

# Default development origins
DEFAULT_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]

# Use production origins if set, otherwise use development defaults
cors_origins = ALLOWED_ORIGINS if ALLOWED_ORIGINS and ALLOWED_ORIGINS[0] else DEFAULT_DEV_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)


# Models
class ParsedResume(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    skills: list[str] = []
    experience: list[dict] = []
    education: list[dict] = []
    rawText: str = ""


class JDGenerateRequest(BaseModel):
    title: str
    department: Optional[str] = None
    skills: list[str] = []
    experience: Optional[str] = None
    tone: str = "professional"


class JDGenerateResponse(BaseModel):
    description: str
    requirements: str
    responsibilities: str
    skills: List[str] = []


class BiasCheckRequest(BaseModel):
    text: str


class BiasCheckResponse(BaseModel):
    issues: list[dict]
    suggestions: list[str]
    score: float  # 0-100, higher is better (less biased)


class MatchRequest(BaseModel):
    resumeText: str
    jobDescription: str


class MatchResponse(BaseModel):
    score: float  # 0-100
    matchedSkills: list[str]
    missingSkills: list[str]
    summary: str


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "talentx-ai"}


import re
import io
from PyPDF2 import PdfReader
from docx import Document

# OCR Support - optional dependencies
try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR dependencies not installed. Install with: pip install pillow pytesseract")

# ... (imports)

# Helper functions
def extract_text_from_pdf(file_content):
    try:
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(file_content):
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def extract_text_from_image(file_content):
    """
    Extract text from image using OCR (Tesseract).
    Supports JPG, PNG, TIFF, BMP, and other common image formats.
    """
    if not OCR_AVAILABLE:
        print("OCR not available - pytesseract/pillow not installed")
        return ""
    
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(file_content))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Pre-process image for better OCR results
        # Convert to grayscale
        image = image.convert('L')
        
        # Use Tesseract to extract text
        # Config options for better resume parsing:
        # --psm 1: Automatic page segmentation with OSD
        # --oem 3: Default, based on what is available
        custom_config = r'--oem 3 --psm 1'
        text = pytesseract.image_to_string(image, config=custom_config)
        
        return text.strip()
    except Exception as e:
        print(f"Error performing OCR on image: {e}")
        return ""

def extract_text_from_scanned_pdf(file_content):
    """
    Extract text from scanned PDF using OCR.
    First attempts regular text extraction, falls back to OCR if empty.
    """
    # Try regular extraction first
    text = extract_text_from_pdf(file_content)
    
    # If text is very short or empty, it might be a scanned PDF
    if len(text.strip()) < 100:
        if not OCR_AVAILABLE:
            print("Scanned PDF detected but OCR not available")
            return text
        
        try:
            # Convert PDF pages to images and OCR them
            import fitz  # PyMuPDF
            
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            ocr_text = ""
            
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                # Render page to image
                mat = fitz.Matrix(2, 2)  # 2x zoom for better quality
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                
                # OCR the image
                page_text = extract_text_from_image(img_data)
                ocr_text += page_text + "\n"
            
            pdf_document.close()
            
            if len(ocr_text.strip()) > len(text.strip()):
                return ocr_text
        except ImportError:
            print("PyMuPDF not available for scanned PDF OCR")
        except Exception as e:
            print(f"Error OCRing scanned PDF: {e}")
    
    return text

def extract_email(text):
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None

def extract_phone(text):
    # Basic phone regex - can be improved
    phone_pattern = r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}'
    match = re.search(phone_pattern, text)
    return match.group(0) if match else None

def extract_name(text):
    # Very basic name extraction: assume first non-empty line is name
    # or look for common patterns. This is hard without NLP.
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        return lines[0]
    return None

def extract_skills(text):
    # Simple keyword matching against a common list
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue",
        "Node.js", "HTML", "CSS", "SQL", "NoSQL", "PostgreSQL", "MongoDB",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD",
        "Agile", "Scrum", "Communication", "Leadership", "Management"
    ]
    found_skills = []
    text_lower = text.lower()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
    return found_skills

def extract_skills_llm(text):
    """
    Use Ollama to extract skills from text when regex is insufficient.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Truncate text to avoid context limit issues (approx 2000 chars)
    truncated_text = text[:2000]
    
    system_prompt = (
        "You are an expert technical recruiter. "
        "Extract a list of technical skills, programming languages, tools, and frameworks from the resume text. "
        "Return ONLY a JSON object with a single key 'skills' containing a list of strings. "
        "Normalize the skills to their standard names (e.g., 'React.js' -> 'React'). "
        "Do not include soft skills."
    )
    
    user_prompt = f"Resume Text:\n{truncated_text}\n\nReturn JSON."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json", # Enforce JSON mode if supported by model/ollama version
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        # Clean markdown code blocks if present
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        return parsed.get("skills", [])
    except Exception as e:
        print(f"LLM Skill Extraction Error: {e}")
        return []

def extract_details_llm(text):
    """
    Use Ollama to extract personal details from text.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Truncate text to avoid context limit issues, but keep enough for header info
    truncated_text = text[:4000]
    
    system_prompt = (
        "You are an expert technical recruiter. "
        "Extract the candidate's First Name, Last Name, Email, Phone Number, and a brief Professional Summary from the resume text. "
        "Return ONLY a JSON object with keys: 'firstName', 'lastName', 'email', 'phone', 'summary'. "
        "If a field is not found, use null. "
        "For the summary, extract the professional summary section if it exists, otherwise generate a brief 2-sentence summary."
    )
    
    user_prompt = f"Resume Text:\n{truncated_text}\n\nReturn JSON."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        return parsed
    except Exception as e:
        print(f"LLM Entity Extraction Error: {e}")
        return {}


def extract_experience_llm(text):
    """
    Use Ollama to extract work experience from resume text.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Use more text for experience section
    truncated_text = text[:6000]
    
    system_prompt = (
        "You are an expert technical recruiter analyzing a resume. "
        "Extract ALL work experience entries from the resume. "
        "Return ONLY a JSON object with a single key 'experience' containing a list of objects. "
        "Each experience object should have: 'company' (string), 'title' (string), 'startDate' (string like 'Jan 2020' or '2020'), "
        "'endDate' (string like 'Present' or 'Dec 2023'), 'description' (string - brief summary of responsibilities). "
        "If a field is not found, use null. Extract as many entries as you can find."
    )
    
    user_prompt = f"Resume Text:\n{truncated_text}\n\nReturn JSON with experience array."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        return parsed.get("experience", [])
    except Exception as e:
        print(f"LLM Experience Extraction Error: {e}")
        return []


def extract_education_llm(text):
    """
    Use Ollama to extract education from resume text.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    truncated_text = text[:4000]
    
    system_prompt = (
        "You are an expert technical recruiter analyzing a resume. "
        "Extract ALL education entries from the resume. "
        "Return ONLY a JSON object with a single key 'education' containing a list of objects. "
        "Each education object should have: 'institution' (string - school/university name), 'degree' (string - e.g., 'Bachelor of Science'), "
        "'field' (string - field of study like 'Computer Science'), 'graduationYear' (string like '2020' or null if not found). "
        "If a field is not found, use null. Extract as many entries as you can find."
    )
    
    user_prompt = f"Resume Text:\n{truncated_text}\n\nReturn JSON with education array."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        return parsed.get("education", [])
    except Exception as e:
        print(f"LLM Education Extraction Error: {e}")
        return []

# Resume parsing
@app.post("/parse-resume", response_model=ParsedResume)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a resume file (PDF, DOCX, or image) and extract structured data.
    Supports OCR for image-based resumes (JPG, PNG, TIFF, BMP) and scanned PDFs.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = file.filename.lower().split(".")[-1]
    supported_docs = ["pdf", "docx", "doc"]
    supported_images = ["jpg", "jpeg", "png", "tiff", "tif", "bmp", "webp"]
    
    if ext not in supported_docs + supported_images:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Use PDF, DOCX, or image formats ({', '.join(supported_images)})."
        )
    
    content = await file.read()
    
    text = ""
    extraction_method = "text"
    
    if ext == "pdf":
        # Try scanned PDF extraction (which includes OCR fallback)
        text = extract_text_from_scanned_pdf(content)
        if len(text.strip()) < 100:
            extraction_method = "ocr"
    elif ext in ["docx", "doc"]:
        text = extract_text_from_docx(content)
    elif ext in supported_images:
        # Image-based resume - use OCR
        if not OCR_AVAILABLE:
            raise HTTPException(
                status_code=400, 
                detail="OCR not available. Please install pytesseract and pillow for image support."
            )
        text = extract_text_from_image(content)
        extraction_method = "ocr"
        print(f"OCR extracted {len(text)} characters from image")
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from file.")

    # Basic Regex Extraction (Fallback/Initial)
    email = extract_email(text)
    phone = extract_phone(text)
    
    # LLM Extraction for better accuracy (Name, Summary, and corrections)
    print("Attempting LLM entity extraction...")
    llm_entities = extract_details_llm(text)
    
    first_name = llm_entities.get("firstName") or ""
    last_name = llm_entities.get("lastName") or ""
    
    # Fallback to basic name extraction if LLM fails
    if not first_name and not last_name:
        name_line = extract_name(text)
        if name_line:
            parts = name_line.split()
            if len(parts) >= 2:
                first_name = parts[0]
                last_name = " ".join(parts[1:])
            else:
                first_name = name_line

    # Prefer LLM email/phone if found, otherwise keep regex
    if llm_entities.get("email"):
        email = llm_entities["email"]
    if llm_entities.get("phone"):
        phone = llm_entities["phone"]
        
    summary = llm_entities.get("summary")
    if not summary:
        summary = text[:500].strip() + "..." if len(text) > 500 else text

    # Hybrid Skill Extraction
    skills = extract_skills(text)
    print(f"Regex skills found: {skills}")
    
    # Always try LLM for skills to be thorough
    print("Attempting LLM skill extraction...")
    llm_skills = extract_skills_llm(text)
    print(f"LLM skills found: {llm_skills}")
    
    existing_lower = {s.lower() for s in skills}
    for s in llm_skills:
        if isinstance(s, str) and s.lower() not in existing_lower:
            skills.append(s)
            existing_lower.add(s.lower())

    print(f"Final skills: {skills}")

    # Extract experience and education using LLM
    print("Attempting LLM experience extraction...")
    experience = extract_experience_llm(text)
    print(f"Experience entries found: {len(experience)}")

    print("Attempting LLM education extraction...")
    education = extract_education_llm(text)
    print(f"Education entries found: {len(education)}")

    return ParsedResume(
        firstName=first_name,
        lastName=last_name,
        email=email,
        phone=phone,
        summary=summary,
        skills=skills,
        experience=experience,
        education=education,
        rawText=text
    )


# JD Generation
@app.post("/generate-jd", response_model=JDGenerateResponse)
async def generate_job_description(request: JDGenerateRequest):
    """Generate a job description using a local open-source LLM via Ollama."""

    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")

    skills_str = ", ".join(request.skills) if request.skills else "(any relevant technologies and tools)"
    
    experience_str = request.experience or "3+ years of relevant experience"
    # If the user just entered a number like "7", make it "7 years" to be clearer to the LLM
    if experience_str.isdigit():
        experience_str = f"{experience_str} years"

    department_str = request.department or "Engineering"

    system_prompt = (
        "You are an expert HR and hiring manager assistant. "
        "Write a clear, inclusive, and practical job description. "
        "Also generate a list of 5-10 relevant skills (keywords) for this role."
        "Output PURE JSON only. No markdown formatting, no backticks, no introduction."
        "The JSON object must look exactly like this: "
        "{ \"description\": \"<html string>\", \"requirements\": \"<html string with <ul>>\", \"responsibilities\": \"<html string with <ul>>\", \"skills\": [\"skill1\", \"skill2\"] }"
    )

    user_prompt = (
        f"Write a job description for:\n"
        f"Title: {request.title}\n"
        f"Department: {department_str}\n"
        f"Skills needed: {skills_str}\n"
        f"Experience Level: {experience_str}\n"
        f"Tone: {request.tone or 'professional'}\n\n"
        "Strictly adhere to the specified experience level in the requirements.\n"
        "Ensure description, requirements, and responsibilities are properly formatted HTML strings.\n"
        "Include a list of relevant skills."
    )

    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)

        message = resp_json.get("message", {})
        content = message.get("content", "")

        # Clean markdown code blocks if present (just in case)
        content = content.replace("```json", "").replace("```", "").strip()

        # Parse JSON
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            # Try to rescue if it's just wrapped in quotes
            try:
                if content.startswith('"') and content.endswith('"'):
                     parsed = json.loads(json.loads(content))
                else:
                     raise
            except:
                return JDGenerateResponse(
                    description=content or "",
                    requirements="",
                    responsibilities="",
                    skills=[]
                )

        # Handle simplified/nested cases where LLM might just return one big string in 'description'
        description = parsed.get("description", "")
        # Check if description itself is a JSON string (double encoding issue)
        if isinstance(description, str) and description.strip().startswith('{') and "requirements" in description:
             try:
                 inner = json.loads(description)
                 return JDGenerateResponse(
                     description=inner.get("description", ""),
                     requirements=inner.get("requirements", ""),
                     responsibilities=inner.get("responsibilities", ""),
                     skills=inner.get("skills", [])
                 )
             except:
                 pass

        return JDGenerateResponse(
            description=description,
            requirements=parsed.get("requirements", ""),
            responsibilities=parsed.get("responsibilities", ""),
            skills=parsed.get("skills", [])
        )

    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
        print(f"Ollama Error: {e}")
        # If the local LLM is unavailable, fall back to a simple deterministic template
        fallback_description = (
            f"We are hiring a {request.title} to join our team. "
            f"You will work with {skills_str} and partners across the business "
            f"to deliver high-quality outcomes."
        )
        fallback_requirements = (
            f"- {experience_str}\n"
            f"- Hands-on experience with {skills_str}\n"
            "- Strong communication and collaboration skills"
        )
        fallback_responsibilities = (
            f"- Own key initiatives as a {request.title}\n"
            "- Collaborate with cross-functional teams\n"
            "- Continuously improve processes and quality"
        )

        return JDGenerateResponse(
            description=fallback_description,
            requirements=fallback_requirements,
            responsibilities=fallback_responsibilities,
            skills=request.skills
        )


# Bias detection
@app.post("/check-bias", response_model=BiasCheckResponse)
async def check_bias(request: BiasCheckRequest):
    """
    Analyze text for potentially biased or non-inclusive language using LLM.
    """
    issues = []
    suggestions = []
    
    # Expanded list of problematic terms for fallback/fast checking
    # Format: term -> (Issue Type, Replacement Suggestion)
    problematic_terms = {
        # Gender-coded (Masculine)
        "ninja": ("Gender-coded (Masculine)", "specialist"),
        "rockstar": ("Gender-coded (Masculine)", "high performer"),
        "guru": ("Gender-coded (Masculine)", "expert"),
        "hacker": ("Gender-coded (Masculine)", "engineer"),
        "superhero": ("Gender-coded (Masculine)", "problem solver"),
        "manpower": ("Gender-coded (Masculine)", "workforce"),
        "mankind": ("Gender-coded (Masculine)", "humanity"),
        "chairman": ("Gender-coded (Masculine)", "chairperson"),
        "brotherhood": ("Gender-coded (Masculine)", "community"),
        "guys": ("Gender-coded (Masculine)", "everyone/team"),
        "salesman": ("Gender-coded (Masculine)", "salesperson"),
        "he": ("Gender-specific pronoun", "they"),
        "him": ("Gender-specific pronoun", "them"),
        "his": ("Gender-specific pronoun", "their"),
        
        # Gender-coded (Feminine) - context dependent, but often flagged
        "nurture": ("Gender-coded (Feminine)", "mentor/develop"),
        "supportive": ("Gender-coded (Feminine)", "helpful"),
        
        # Ageism
        "young": ("Possible Ageism", "energetic/early-career"),
        "digital native": ("Ageism", "tech-savvy"),
        "recent graduate": ("Possible Ageism", "entry-level"),
        "fresh graduate": ("Possible Ageism", "entry-level"),
        "energetic": ("Possible Ageism", "motivated"),
        
        # Ableism
        "blind to": ("Ableism", "unaware of"),
        "turn a blind eye": ("Ableism", "ignore"),
        "cripple": ("Ableism", "impair/hinder"),
        "sanity check": ("Ableism", "completeness check"),
        "dummy": ("Ableism", "sample/placeholder"),
        
        # Exclusivity / Other
        "native english": ("Exclusivity", "fluent in English"),
        "master": ("Non-inclusive", "primary/expert"),
        "slave": ("Non-inclusive", "secondary/replica"),
        "blacklist": ("Non-inclusive", "blocklist"),
        "whitelist": ("Non-inclusive", "allowlist"),
        "tribe": ("Cultural appropriation", "team/squad"),
        "pow wow": ("Cultural appropriation", "meeting"),
        "spirit animal": ("Cultural appropriation", "favorite"),
    }
    
    text_lower = request.text.lower()
    
    # Use regex to find whole words only
    for term, (issue_type, suggestion) in problematic_terms.items():
        # Escape the term for regex, but allow for simple variations if needed
        # Using word boundaries \b
        pattern = r'\b' + re.escape(term) + r'\b'
        if re.search(pattern, text_lower):
             issues.append({
                "term": term,
                "type": issue_type,
                "suggestion": suggestion
            })
    
    # Use LLM for deeper analysis if available
    llm_was_used = False
    try:
        print("Attempting LLM bias check...")
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        
        system_prompt = (
            "You are an expert Diversity, Equity, and Inclusion (DEI) consultant. "
            "Analyze the provided job description text for biased, non-inclusive, gender-coded, or ageist language. "
            "Return ONLY a JSON object with a key 'issues' which is a list of objects. "
            "Each object in 'issues' must have: 'term' (the problematic word/phrase found), "
            "'type' (e.g., 'Gender-coded', 'Ageism', 'Ableism', 'Exclusive'), and "
            "'suggestion' (a better alternative). "
            "Also include a 'score' (0-100, where 100 is perfectly inclusive) and 'suggestions' (list of general strings). "
            "If no issues are found, return empty lists."
        )
        
        user_prompt = f"Text to analyze:\n{request.text[:4000]}\n\nReturn JSON."
        
        payload = {
            "model": model_name,
            "stream": False,
            "format": "json",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
    
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp: # Short timeout for LLM
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        llm_issues = parsed.get("issues", [])
        
        # Merge LLM issues with hardcoded ones
        for issue in llm_issues:
            if not any(i['term'].lower() == issue['term'].lower() for i in issues):
                issues.append(issue)
                
        llm_suggestions = parsed.get("suggestions", [])
        for sugg in llm_suggestions:
            if sugg not in suggestions:
                suggestions.append(sugg)
        
        llm_score = float(parsed.get("score", 100))
        llm_was_used = True
        
    except Exception as e:
        print(f"LLM Bias Check Error (using fallback): {e}")
    
    # Generate suggestions for hardcoded issues if LLM didn't provide them or for mixed results
    for issue in issues:
        sugg_text = f"Consider replacing '{issue['term']}' with '{issue['suggestion']}'"
        if sugg_text not in suggestions:
             suggestions.append(sugg_text)

    # Calculate score
    if llm_was_used:
         calculated_score = max(0, 100 - len(issues) * 5)
         # Blend scores
         final_score = (llm_score + calculated_score) / 2
    else:
         final_score = max(0, 100 - len(issues) * 10)

    return BiasCheckResponse(
        issues=issues,
        suggestions=suggestions,
        score=final_score
    )


# Candidate-Job matching
@app.post("/match", response_model=MatchResponse)
async def match_candidate_to_job(request: MatchRequest):
    """
    Calculate match score between a resume and job description using LLM.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Truncate to avoid context limits
    resume_text = request.resumeText[:4000]
    jd_text = request.jobDescription[:4000]
    
    system_prompt = (
        "You are an expert technical recruiter and hiring manager. "
        "Evaluate the candidate's resume against the job description. "
        "Determine a match score from 0 to 100 based on skills, experience, and requirements. "
        "Identify matched skills and missing skills. "
        "Write a brief executive summary (max 3 sentences) explaining the score and fit. "
        "Return ONLY JSON with keys: 'score' (number), 'matchedSkills' (list of strings), 'missingSkills' (list of strings), and 'summary' (string)."
    )
    
    user_prompt = f"Job Description:\n{jd_text}\n\nResume:\n{resume_text}\n\nReturn JSON."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        # Clean markdown if present
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        return MatchResponse(
            score=float(parsed.get("score", 0)),
            matchedSkills=parsed.get("matchedSkills", []),
            missingSkills=parsed.get("missingSkills", []),
            summary=parsed.get("summary", "Analysis failed.")
        )
        
    except Exception as e:
        print(f"Match Error: {e}")
        # Fallback Mock
        return MatchResponse(
            score=0.0,
            matchedSkills=[],
            missingSkills=[],
            summary="AI Service unavailable. Could not calculate match."
        )


# Optimization
class OptimizeRequest(BaseModel):
    text: str
    targetTone: str = "professional"

class OptimizeResponse(BaseModel):
    optimizedText: str
    changes: str

@app.post("/optimize-jd", response_model=OptimizeResponse)
async def optimize_jd(request: OptimizeRequest):
    """
    Rewrite job description text to match a specific tone.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    system_prompt = (
        "You are an expert copywriter for recruitment. "
        "Rewrite the provided job description text to be more " + request.targetTone + ". "
        "Maintain the core meaning and requirements, but improve the flow, engagement, and clarity. "
        "Return ONLY JSON with keys: 'optimizedText' (the rewritten text) and 'changes' (a brief summary of what you changed)."
    )
    
    user_prompt = f"Original Text:\n{request.text}\n\nReturn JSON."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        
        # Clean markdown if present
        content = content.replace("```json", "").replace("```", "").strip()
        
        parsed = json.loads(content)
        
        return OptimizeResponse(
            optimizedText=parsed.get("optimizedText", request.text),
            changes=parsed.get("changes", "Optimized for tone.")
        )
    except Exception as e:
        print(f"Optimization Error: {e}")
        # Fallback: return original
        return OptimizeResponse(
            optimizedText=request.text,
            changes="Failed to optimize due to service error."
        )

# SEO Suggestions
class SeoRequest(BaseModel):
    title: str
    description: str

class SeoResponse(BaseModel):
    keywords: List[str]
    score: float
    suggestions: List[str]

@app.post("/suggest-seo", response_model=SeoResponse)
async def suggest_seo(request: SeoRequest):
    """
    Analyze job description for SEO and suggest keywords.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    system_prompt = (
        "You are an SEO expert for recruitment. "
        "Analyze the job title and description. "
        "Identify missing high-value keywords that job seekers might use. "
        "Estimate an SEO score (0-100). "
        "Return ONLY JSON with keys: 'keywords' (list of 5-10 suggested keywords), 'score' (number), and 'suggestions' (list of actionable tips)."
    )
    
    user_prompt = f"Title: {request.title}\nDescription: {request.description[:1000]}...\n\nReturn JSON."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        
        # Clean markdown if present
        content = content.replace("```json", "").replace("```", "").strip()
        
        parsed = json.loads(content)
        
        return SeoResponse(
            keywords=parsed.get("keywords", []),
            score=parsed.get("score", 70.0),
            suggestions=parsed.get("suggestions", [])
        )
    except Exception as e:
        print(f"SEO Error: {e}")
        return SeoResponse(
            keywords=[],
            score=0.0,
            suggestions=["Service unavailable"]
        )

# Email Subject Line Generation
class SubjectLineRequest(BaseModel):
    context: str  # e.g., "interview invitation", "offer letter", "rejection"
    candidateName: Optional[str] = None
    jobTitle: Optional[str] = None
    companyName: Optional[str] = None

class SubjectLineResponse(BaseModel):
    suggestions: List[str]

@app.post("/generate-subject-lines", response_model=SubjectLineResponse)
async def generate_subject_lines(request: SubjectLineRequest):
    """
    Generate AI-powered email subject line suggestions.
    """
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    system_prompt = (
        "You are an expert recruiter and email copywriter. "
        "Generate 5 compelling, professional email subject lines for the given context. "
        "Subject lines should be concise (under 60 characters), engaging, and appropriate for recruitment communication. "
        "Return ONLY JSON with key 'suggestions' containing a list of 5 strings."
    )
    
    context_details = f"Context: {request.context}"
    if request.candidateName:
        context_details += f"\nCandidate Name: {request.candidateName}"
    if request.jobTitle:
        context_details += f"\nJob Title: {request.jobTitle}"
    if request.companyName:
        context_details += f"\nCompany: {request.companyName}"
    
    user_prompt = f"{context_details}\n\nGenerate 5 subject line suggestions. Return JSON."
    
    payload = {
        "model": model_name,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            resp_json = json.loads(raw)
            
        content = resp_json.get("message", {}).get("content", "")
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        return SubjectLineResponse(
            suggestions=parsed.get("suggestions", [])[:5]
        )
    except Exception as e:
        print(f"Subject Line Generation Error: {e}")
        # Fallback suggestions based on context
        fallback = {
            "interview": [
                f"Interview Invitation - {request.jobTitle or 'Open Position'}",
                f"Next Steps: Schedule Your Interview",
                f"We'd Love to Meet You - Interview Request",
                f"Your Interview with {request.companyName or 'Our Team'}",
                f"Exciting Opportunity - Let's Talk!",
            ],
            "offer": [
                f"Congratulations! Your Offer from {request.companyName or 'Us'}",
                f"Welcome Aboard - Your Offer Letter",
                f"Great News: Job Offer for {request.jobTitle or 'the Role'}",
                f"Your Future Awaits - Offer Inside",
                f"We're Excited to Extend an Offer!",
            ],
            "rejection": [
                f"Update on Your Application",
                f"Thank You for Your Interest",
                f"Application Status Update",
                f"Regarding Your Application",
                f"Following Up on Your Application",
            ],
            "followup": [
                f"Following Up - {request.jobTitle or 'Your Application'}",
                f"Quick Update on Your Application",
                f"Checking In - Next Steps",
                f"Application Status for {request.jobTitle or 'the Role'}",
                f"We Haven't Forgotten About You!",
            ],
        }
        
        context_key = request.context.lower()
        for key in fallback:
            if key in context_key:
                return SubjectLineResponse(suggestions=fallback[key])
        
        return SubjectLineResponse(suggestions=[
            f"Regarding Your Application",
            f"Important Update from {request.companyName or 'Our Team'}",
            f"Next Steps in Your Journey",
            f"We Have News for You",
            f"Your Application Update",
        ])


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
