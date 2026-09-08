"""Configuration for the AI Student Support Assistant."""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load .env from root or local subfolder
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")
elif (ROOT_DIR / ".env").exists():
    load_dotenv(ROOT_DIR / ".env")

PORT = int(os.getenv("STUDENT_PORT", "8001"))
HOST = os.getenv("STUDENT_HOST", "0.0.0.0")

# Ollama / LLM configuration
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama.com")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:120b")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# SQLite Database path: Use /tmp if running in serverless (e.g. Vercel)
if os.getenv("VERCEL") or not os.access(BASE_DIR, os.W_OK):
    DB_PATH = Path("/tmp/student_assistant.db")
else:
    DB_PATH = BASE_DIR / "student_assistant.db"

STATIC_DIR = BASE_DIR / "static"
