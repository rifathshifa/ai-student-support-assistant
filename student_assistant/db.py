"""SQLite database layer for AI Student Support Assistant with seeding."""
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional
from student_assistant.config import DB_PATH

DEMO_STUDENT_ID = "demo-student"

DEFAULT_TIMETABLE = [
    {"id": 1, "day": "Monday", "time": "09:00 – 10:00", "course": "Data Structures", "room": "B-204", "instructor": "Dr. Meera Nair"},
    {"id": 2, "day": "Monday", "time": "11:00 – 12:00", "course": "Database Systems", "room": "Lab 3", "instructor": "Prof. Arjun Rao"},
    {"id": 3, "day": "Tuesday", "time": "10:00 – 11:00", "course": "Operating Systems", "room": "A-102", "instructor": "Dr. Kavita Shah"},
    {"id": 4, "day": "Wednesday", "time": "14:00 – 16:00", "course": "Applied AI Lab", "room": "Innovation Hub", "instructor": "Dr. Vikram Iyer"},
    {"id": 5, "day": "Thursday", "time": "09:00 – 10:00", "course": "Computer Networks", "room": "B-201", "instructor": "Prof. Neha Kulkarni"},
    {"id": 6, "day": "Friday", "time": "13:00 – 14:00", "course": "Professional Communication", "room": "C-105", "instructor": "Ms. Ritu Menon"},
]

DEFAULT_ATTENDANCE = [
    {"id": 1, "course": "Data Structures", "attended": 23, "total": 25, "percentage": 92, "status": "Healthy"},
    {"id": 2, "course": "Database Systems", "attended": 20, "total": 24, "percentage": 83, "status": "Healthy"},
    {"id": 3, "course": "Operating Systems", "attended": 18, "total": 23, "percentage": 78, "status": "Watch"},
    {"id": 4, "course": "Applied AI Lab", "attended": 14, "total": 16, "percentage": 88, "status": "Healthy"},
    {"id": 5, "course": "Computer Networks", "attended": 16, "total": 22, "percentage": 73, "status": "At risk"},
]

DEFAULT_NOTICES = [
    {
        "id": 1,
        "title": "Mid-semester examination registration",
        "category": "Examinations",
        "date": "2026-09-08",
        "summary": "Register through the student portal by 12 September. Late requests need department approval.",
        "priority": "High",
    },
    {
        "id": 2,
        "title": "Innovation Hub extended hours",
        "category": "Campus",
        "date": "2026-09-06",
        "summary": "The Innovation Hub will remain open until 21:00 during project submission week.",
        "priority": "Normal",
    },
    {
        "id": 3,
        "title": "Scholarship renewal window",
        "category": "Student services",
        "date": "2026-09-04",
        "summary": "Submit renewal documents to the financial aid office before 30 September.",
        "priority": "Normal",
    },
]

DEFAULT_EXAMS = [
    {"id": 1, "course": "Data Structures", "date": "2026-09-21", "time": "10:00 – 12:00", "venue": "Main Hall", "type": "Mid-semester"},
    {"id": 2, "course": "Database Systems", "date": "2026-09-23", "time": "14:00 – 16:00", "venue": "Main Hall", "type": "Mid-semester"},
    {"id": 3, "course": "Operating Systems", "date": "2026-09-25", "time": "10:00 – 12:00", "venue": "Block A-101", "type": "Mid-semester"},
    {"id": 4, "course": "Applied AI Lab", "date": "2026-09-28", "time": "09:00 – 11:00", "venue": "Innovation Hub", "type": "Practical"},
]

DEFAULT_FAQS = [
    {
        "id": 1,
        "question": "How do I request a bonafide certificate?",
        "answer": "Open Student Services in the portal, choose Certificates, select Bonafide, and submit the request. Processing usually takes two working days.",
        "category": "Student services",
    },
    {
        "id": 2,
        "question": "What is the minimum attendance requirement?",
        "answer": "Students should maintain at least 75% attendance in each registered course. Medical exceptions require supporting documents and approval.",
        "category": "Academic rules",
    },
    {
        "id": 3,
        "question": "Where can I find the academic calendar?",
        "answer": "The current academic calendar is published under Notices in the student portal and on the Registrar's office page.",
        "category": "General",
    },
    {
        "id": 4,
        "question": "How can I contact the department office?",
        "answer": "Visit the department office between 09:30 and 16:30 on working days, or email the department coordinator through the portal.",
        "category": "General",
    },
]

SEED_DOCUMENTS = [
    {
        "name": "B.Tech CSE Student Handbook 2026",
        "category": "Regulations",
        "content": "Students must maintain a minimum of 75% attendance in every registered course. Requests for attendance condonation must be submitted to the department office with supporting documents within seven working days. Mid-semester examination registration closes on 12 September 2026. Students may request bonafide certificates through the Student Services portal. The academic grievance committee accepts written appeals within ten working days of a result being published.",
    },
    {
        "name": "Data Structures — Course Syllabus",
        "category": "Syllabus",
        "content": "Data Structures covers algorithm analysis, arrays, linked lists, stacks, queues, trees, graphs, hashing, and sorting. Assessment is 30% continuous assessment, 20% mid-semester examination, and 50% end-semester examination. The mid-semester exam is scheduled for 21 September 2026 from 10:00 to 12:00 in the Main Hall. Students should bring their university ID card.",
    },
    {
        "name": "Student Services FAQ",
        "category": "FAQs",
        "content": "To request a bonafide certificate, open Student Services in the portal, choose Certificates, select Bonafide, and submit the request. Processing usually takes two working days. The academic calendar is published under Notices in the student portal. Department offices are open from 09:30 to 16:30 on working days.",
    },
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables and populate seed data if not present."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_profiles (
        student_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        program TEXT NOT NULL,
        semester TEXT NOT NULL,
        email TEXT NOT NULL,
        goals TEXT NOT NULL,
        preferences TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS knowledge_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        chunk_count INTEGER NOT NULL,
        word_count INTEGER NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assistant_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        citations TEXT NOT NULL,
        tools_used TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()

    # Seed demo student profile
    cursor.execute("SELECT student_id FROM student_profiles WHERE student_id = ?", (DEMO_STUDENT_ID,))
    if not cursor.fetchone():
        now = datetime.utcnow().isoformat() + "Z"
        cursor.execute("""
        INSERT INTO student_profiles (student_id, name, program, semester, email, goals, preferences, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            DEMO_STUDENT_ID,
            "Aarav Sharma",
            "B.Tech Computer Science",
            "Semester 5",
            "aarav.sharma@campus.edu",
            json.dumps(["Build a strong AI portfolio", "Stay above 75% attendance"]),
            json.dumps(["Concise answers", "Include deadlines", "Use my course context"]),
            now
        ))
        conn.commit()

    # Seed knowledge documents
    cursor.execute("SELECT COUNT(*) FROM knowledge_documents")
    if cursor.fetchone()[0] == 0:
        now = datetime.utcnow().isoformat() + "Z"
        for doc in SEED_DOCUMENTS:
            words = [w for w in doc["content"].split() if w]
            cursor.execute("""
            INSERT INTO knowledge_documents (name, category, content, chunk_count, word_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                doc["name"],
                doc["category"],
                doc["content"],
                max(1, len(words) // 40),
                len(words),
                now
            ))
        conn.commit()

    # Seed initial welcome conversation
    cursor.execute("SELECT COUNT(*) FROM assistant_messages")
    if cursor.fetchone()[0] == 0:
        now = datetime.utcnow().isoformat() + "Z"
        cursor.execute("""
        INSERT INTO assistant_messages (student_id, role, content, citations, tools_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            DEMO_STUDENT_ID,
            "user",
            "What should I focus on this week?",
            json.dumps([]),
            json.dumps([]),
            now
        ))
        cursor.execute("""
        INSERT INTO assistant_messages (student_id, role, content, citations, tools_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            DEMO_STUDENT_ID,
            "assistant",
            "This week, prioritize your Data Structures revision, keep Computer Networks attendance above 75%, and register for mid-semester exams before 12 September. I can also pull up your timetable or upcoming exam venues.",
            json.dumps([{
                "documentName": "B.Tech CSE Student Handbook 2026",
                "category": "Regulations",
                "excerpt": "Mid-semester examination registration closes on 12 September 2026."
            }]),
            json.dumps(["get_attendance", "get_exams"]),
            now
        ))
        conn.commit()

    conn.close()

def get_student_profile(student_id: str = DEMO_STUDENT_ID) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM student_profiles WHERE student_id = ?", (student_id,))
    row = cursor.fetchone()
    if not row:
        cursor.execute("SELECT * FROM student_profiles WHERE student_id = ?", (DEMO_STUDENT_ID,))
        row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "id": DEMO_STUDENT_ID,
            "name": "Aarav Sharma",
            "program": "B.Tech Computer Science",
            "semester": "Semester 5",
            "email": "aarav.sharma@campus.edu",
            "goals": [],
            "preferences": [],
            "updatedAt": datetime.utcnow().isoformat() + "Z",
        }
    return {
        "id": row["student_id"],
        "name": row["name"],
        "program": row["program"],
        "semester": row["semester"],
        "email": row["email"],
        "goals": json.loads(row["goals"]),
        "preferences": json.loads(row["preferences"]),
        "updatedAt": row["updated_at"],
    }

def update_student_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    student_id = profile_data.get("id") or profile_data.get("studentId") or DEMO_STUDENT_ID
    now = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
    UPDATE student_profiles
    SET name = ?, program = ?, semester = ?, email = ?, goals = ?, preferences = ?, updated_at = ?
    WHERE student_id = ?
    """, (
        profile_data.get("name", "Aarav Sharma"),
        profile_data.get("program", "B.Tech Computer Science"),
        profile_data.get("semester", "Semester 5"),
        profile_data.get("email", "aarav.sharma@campus.edu"),
        json.dumps(profile_data.get("goals", [])),
        json.dumps(profile_data.get("preferences", [])),
        now,
        student_id
    ))
    conn.commit()
    conn.close()
    return get_student_profile(student_id)

def list_documents() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM knowledge_documents ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "content": row["content"],
            "chunkCount": row["chunk_count"],
            "wordCount": row["word_count"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]

def add_document(name: str, category: str, content: str, chunk_count: int) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    word_count = len([w for w in content.split() if w])
    cursor.execute("""
    INSERT INTO knowledge_documents (name, category, content, chunk_count, word_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (name, category, content, chunk_count, word_count, now))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": doc_id,
        "name": name,
        "category": category,
        "chunkCount": chunk_count,
        "wordCount": word_count,
        "createdAt": now,
    }

def delete_document(doc_id: int) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM knowledge_documents WHERE id = ?", (doc_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def list_messages(student_id: str = DEMO_STUDENT_ID) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM assistant_messages
    WHERE student_id = ?
    ORDER BY id ASC
    """, (student_id,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "role": row["role"],
            "content": row["content"],
            "citations": json.loads(row["citations"]),
            "toolsUsed": json.loads(row["tools_used"]),
            "createdAt": row["created_at"],
        }
        for row in rows
    ]

def save_message(student_id: str, role: str, content: str, citations: List[Dict[str, Any]], tools_used: List[str]) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
    INSERT INTO assistant_messages (student_id, role, content, citations, tools_used, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        student_id,
        role,
        content,
        json.dumps(citations),
        json.dumps(tools_used),
        now
    ))
    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": msg_id,
        "role": role,
        "content": content,
        "citations": citations,
        "toolsUsed": tools_used,
        "createdAt": now
    }
