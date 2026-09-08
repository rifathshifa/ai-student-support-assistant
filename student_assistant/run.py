"""Application runner for the AI Student Support Assistant."""
import uvicorn
from student_assistant.config import HOST, PORT

if __name__ == "__main__":
    print(f"🚀 Starting AI Student Support Assistant at http://localhost:{PORT}")
    uvicorn.run("student_assistant.server:app", host=HOST, port=PORT, reload=True)
