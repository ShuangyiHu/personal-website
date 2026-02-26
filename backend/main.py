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
        "https://shuangyi-hu.up.railway.app",
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
    """
    Forward a message to the HuggingFace Career Conversation space.
    The Gradio app should expose a /predict endpoint accepting (message, history).
    Adjust fn_index based on your actual Gradio interface.
    """
    try:
        client = get_client()
        result = client.predict(
            req.message,
            req.history,
            api_name="/chat"     # adjust to match your Gradio fn name
        )
        # result is typically (bot_response, updated_history)
        reply, new_history = result
        return ChatResponse(reply=reply, history=new_history)
    except Exception as e:
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
