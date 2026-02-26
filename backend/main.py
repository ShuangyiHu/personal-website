"""
backend/main.py — Career Conversation API Proxy
================================================
FastAPI server that:
  1. Proxies chat requests to the HuggingFace Gradio Space
  2. Serves resume data as structured JSON
  3. Handles CORS so the frontend can call it directly

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Deploy:
    Railway / Render / Fly.io (all have free tiers)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gradio_client import Client
import json, os


app = FastAPI(title="Shuangyi Portfolio API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://github.com/ShuangyiHu",
        "https://meowow.me",
        "https://shuangyi-hu.vercel.app",
        "https://shuangyi-hu.up.railway.app",
        "https://personal-website-git-master-amandashuangyihu-9253s-projects.vercel.app/",
        "https://personal-website-ihkgkoecm-amandashuangyihu-9253s-projects.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── HuggingFace Gradio client ─────────────────────────────────
HF_SPACE = os.getenv("HF_SPACE", "shuangyihu/career_conversation")
_client = None

def get_client():
    global _client
    if _client is None:
        _client = Client(HF_SPACE)
    return _client

# ── Models ────────────────────────────────────────────────────
class HistoryMessage(BaseModel):
    role: str     # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    # Must be OpenAI-style objects — matches gr.ChatInterface(type="messages")
    history: list[HistoryMessage] = []

class ChatResponse(BaseModel):
    reply: str
    history: list[list[str]]

# ── Routes ────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Shuangyi Portfolio API"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        client = get_client()

        result = client.predict(
            message=req.message,
            api_name="/chat"
        )

        reply = str(result) if result is not None else "Sorry, no response."

        return ChatResponse(reply=reply, history=[])

    except Exception as e:
        print(f"[Chat Error] {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resume")
def get_resume():
    """Return structured resume data for the widget."""
    return {
        "name": "Shuangyi Hu",
        "title": "M.S. Computer Software Engineering",
        "school": "Northeastern University",
        "gpa": "4.0",
        "location": "Boston, MA",
        "status": "Open to work — Summer 2025",
        "email": "amandashuangyihu@gmail.com",
        "linkedin": "https://www.linkedin.com/in/shuangyi-hu/",
        "skills": [
            "Java", "Python", "JavaScript", "TypeScript",
            "Spring Boot", "React", "Node.js", "Redis",
            "RabbitMQ", "Seata", "Docker", "AWS", "MongoDB", "MySQL",
            "Gemini AI", "Microservices"
        ],
        "projects": [
            {
                "name": "DrivePro",
                "type": "Distributed Systems · Backend",
                "desc": "Microservices-based chauffeur management system with real-time booking and distributed transactions.",
                "stack": ["Spring Boot", "Redis", "RabbitMQ", "Seata"]
            },
            {
                "name": "ShopEase",
                "type": "Full-Stack · E-Commerce",
                "desc": "MERN stack e-commerce platform with Redux, Docker deployment, and AWS S3 media storage.",
                "stack": ["MongoDB", "React", "Node.js", "Docker", "AWS S3"]
            },
            {
                "name": "EmailPilot",
                "type": "AI · Chrome Extension",
                "desc": "AI-powered Gmail & Outlook extension — auto-writes, smart-replies, summarizes. 40% efficiency gain.",
                "stack": ["JavaScript", "CSS", "Gemini Nano AI"]
            }
        ]
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
