"""FastAPI Server for AI Student Support Assistant."""
import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from student_assistant.config import STATIC_DIR, HOST, PORT
from student_assistant.db import (
    init_db,
    get_student_profile,
    update_student_profile,
    list_documents,
    add_document,
    delete_document,
    list_messages,
    save_message,
    DEFAULT_TIMETABLE,
    DEFAULT_ATTENDANCE,
    DEFAULT_NOTICES,
    DEFAULT_EXAMS,
    DEFAULT_FAQS,
    DEMO_STUDENT_ID
)
from student_assistant.graph import student_support_agent
from student_assistant.rag import chunk_document_text

app = FastAPI(
    title="CampusGuide AI Student Support Assistant",
    description="Agentic Student Support Assistant powered by LangChain, LangGraph, and RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Mount static directory
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse("<h1>CampusGuide UI is loading...</h1>")

# Pydantic models matching the OpenAPI spec
class StudentProfileInput(BaseModel):
    id: Optional[str] = None
    name: str
    program: str
    semester: str
    email: str
    goals: Optional[List[str]] = []
    preferences: Optional[List[str]] = []

class DocumentInput(BaseModel):
    name: str
    category: str
    content: str

class ChatInput(BaseModel):
    studentId: Optional[str] = DEMO_STUDENT_ID
    question: str

# ----------------- Dashboard & Profile -----------------
@app.get("/api/assistant/dashboard")
async def get_assistant_dashboard(studentId: Optional[str] = Query(DEMO_STUDENT_ID)):
    profile = get_student_profile(studentId)
    docs = list_documents()
    msgs = list_messages(studentId)
    user_questions = [m for m in msgs if m["role"] == "user"]
    
    avg_attendance = round(
        sum(item["percentage"] for item in DEFAULT_ATTENDANCE) / max(1, len(DEFAULT_ATTENDANCE)), 1
    )

    return {
        "documents": len(docs),
        "questions": len(user_questions),
        "upcomingExams": len(DEFAULT_EXAMS),
        "attendance": avg_attendance,
        "notices": len(DEFAULT_NOTICES),
        "profile": profile,
    }

@app.get("/api/assistant/profile")
async def get_profile_endpoint(studentId: Optional[str] = Query(DEMO_STUDENT_ID)):
    return get_student_profile(studentId)

@app.patch("/api/assistant/profile")
async def update_profile_endpoint(body: StudentProfileInput):
    data = body.dict()
    if not data.get("id"):
        data["id"] = DEMO_STUDENT_ID
    updated = update_student_profile(data)
    return updated

# ----------------- Knowledge Base / RAG -----------------
@app.get("/api/assistant/documents")
async def get_documents():
    return list_documents()

@app.post("/api/assistant/documents", status_code=201)
async def upload_document(body: DocumentInput):
    chunks = chunk_document_text(body.content)
    created = add_document(
        name=body.name,
        category=body.category,
        content=body.content,
        chunk_count=len(chunks)
    )
    return created

@app.delete("/api/assistant/documents/{doc_id}", status_code=204)
async def remove_document(doc_id: int):
    success = delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return

# ----------------- Conversations & Agentic Chat -----------------
@app.get("/api/assistant/conversations")
async def get_conversations(studentId: Optional[str] = Query(DEMO_STUDENT_ID)):
    return list_messages(studentId)

@app.post("/api/assistant/chat")
async def chat_with_agent(body: ChatInput):
    student_id = body.studentId or DEMO_STUDENT_ID
    profile = get_student_profile(student_id)
    recent_msgs = list_messages(student_id)[-6:]
    history = [{"role": m["role"], "content": m["content"]} for m in recent_msgs]

    initial_state = {
        "student_id": student_id,
        "question": body.question,
        "profile": profile,
        "history": history,
        "intent": "student_support",
        "tools_to_run": [],
        "tool_outputs": {},
        "citations": [],
        "answer": "",
        "memory_used": []
    }

    # Execute LangGraph pipeline
    final_state = student_support_agent.invoke(initial_state)

    # Save messages in persistent store
    save_message(student_id, "user", body.question, [], final_state["tools_to_run"])
    saved_assistant = save_message(
        student_id,
        "assistant",
        final_state["answer"],
        final_state["citations"],
        final_state["tools_to_run"]
    )

    return {
        "id": saved_assistant["id"],
        "answer": final_state["answer"],
        "citations": final_state["citations"],
        "toolsUsed": final_state["tools_to_run"],
        "memoryUsed": final_state["memory_used"],
        "intent": final_state["intent"],
        "createdAt": saved_assistant["createdAt"],
    }

# ----------------- Tools Direct Endpoints -----------------
@app.get("/api/assistant/tools/timetable")
async def get_timetable_endpoint(studentId: Optional[str] = Query(DEMO_STUDENT_ID)):
    return DEFAULT_TIMETABLE

@app.get("/api/assistant/tools/attendance")
async def get_attendance_endpoint(studentId: Optional[str] = Query(DEMO_STUDENT_ID)):
    return DEFAULT_ATTENDANCE

@app.get("/api/assistant/tools/notices")
async def get_notices_endpoint():
    return DEFAULT_NOTICES

@app.get("/api/assistant/tools/exams")
async def get_exams_endpoint():
    return DEFAULT_EXAMS

@app.get("/api/assistant/tools/faqs")
async def get_faqs_endpoint():
    return DEFAULT_FAQS
