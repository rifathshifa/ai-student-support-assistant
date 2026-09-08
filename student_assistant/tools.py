"""LangChain Tools for Student Support Assistant."""
import json
from typing import Optional, List, Dict, Any
from langchain_core.tools import tool
from student_assistant.db import (
    DEFAULT_TIMETABLE,
    DEFAULT_ATTENDANCE,
    DEFAULT_NOTICES,
    DEFAULT_EXAMS,
    DEFAULT_FAQS,
)

@tool
def get_timetable(day: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve the student's current weekly lecture and lab timetable.
    Optionally filter by day of week (e.g. 'Monday', 'Tuesday')."""
    if day:
        day_lower = day.strip().lower()
        return [entry for entry in DEFAULT_TIMETABLE if entry["day"].lower() == day_lower]
    return DEFAULT_TIMETABLE

@tool
def get_attendance(course: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve attendance percentage, attended vs total classes, and risk status for registered courses.
    Optionally filter by course name like 'Operating Systems' or 'Computer Networks'."""
    if course:
        query = course.strip().lower()
        return [item for item in DEFAULT_ATTENDANCE if query in item["course"].lower()]
    return DEFAULT_ATTENDANCE

@tool
def get_notices(priority: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve official college notices, circulars, and administrative deadlines.
    Optionally filter by priority ('High', 'Normal')."""
    if priority:
        pri_lower = priority.strip().lower()
        return [notice for notice in DEFAULT_NOTICES if notice["priority"].lower() == pri_lower]
    return DEFAULT_NOTICES

@tool
def get_exams(course: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve upcoming exam dates, timings, venues, and exam types (Mid-semester, Practical).
    Optionally filter by course name."""
    if course:
        query = course.strip().lower()
        return [exam for exam in DEFAULT_EXAMS if query in exam["course"].lower()]
    return DEFAULT_EXAMS

@tool
def get_faqs(query: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve frequently asked campus service questions, certificates, rules, and departmental contacts."""
    if query:
        q_lower = query.strip().lower()
        return [
            faq for faq in DEFAULT_FAQS
            if q_lower in faq["question"].lower() or q_lower in faq["answer"].lower() or q_lower in faq["category"].lower()
        ]
    return DEFAULT_FAQS

ALL_STUDENT_TOOLS = [
    get_timetable,
    get_attendance,
    get_notices,
    get_exams,
    get_faqs,
]

def execute_tool_by_name(tool_name: str, args: Optional[Dict[str, Any]] = None) -> Any:
    """Helper to run a student tool directly by name."""
    args = args or {}
    for t in ALL_STUDENT_TOOLS:
        if t.name == tool_name:
            return t.invoke(args)
    return None
