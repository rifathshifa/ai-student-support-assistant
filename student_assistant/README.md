# AI Student Support Assistant (Python + LangChain + LangGraph)

A production-grade Python and LangChain implementation of the **CampusGuide / Solace AI Student Support Assistant**, developed as part of the **TNSDC Virtual Internship Program (IBM Agentic AI Track - Day 1 to Day 5)**.

Converted from TypeScript/Express to native Python with LangChain tool-calling, LangGraph multi-step state graph execution, grounded semantic RAG retrieval, and a high-performance web dashboard.

---

## 🌟 Key Capabilities

1. **LangGraph Multi-Step Workflow**:
   - `route_intent`: Analyzes queries and maps them to academic intents (timetable, attendance, policies, exams, FAQ).
   - `execute_tools`: Invokes LangChain tools (`get_timetable`, `get_attendance`, `get_notices`, `get_exams`, `get_faqs`).
   - `rag_retrieval`: Extracts semantic chunks from college handbooks, regulations, and course syllabi with ground-truth citations.
   - `generate_response`: Combines remembered student profile context, tool observations, and retrieved citations to produce grounded answers.

2. **Persistent SQLite Database**:
   - Stores knowledge base documents with chunk & word counts.
   - Remembers student profiles, academic goals, and answer preferences.
   - Preserves full conversation history with citations and tools utilized.

3. **FastAPI & REST API**:
   - Matches original OpenAPI specifications for `/api/assistant/*`.
   - Embeds the reactive Single Page Application (SPA) with live metrics ribbons and tabs.

---

## 🚀 How to Run

Activate the Python virtual environment and run the assistant:

```bash
# From workspace root:
source .venv/bin/activate

# Run the Student Support Assistant (default port: 8001)
python3 -m student_assistant.run
```

Open your browser at:
👉 **[http://localhost:8001](http://localhost:8001)**

---

## 📁 Subfolder Structure

```
student_assistant/
├── README.md             # Subfolder documentation
├── run.py                # Server launcher script
├── config.py             # Settings, port, and LLM configuration
├── db.py                 # SQLite database models, queries, and seed data
├── tools.py              # LangChain @tool definitions for campus data
├── rag.py                # Text chunking and semantic vector/TF-IDF retriever
├── graph.py              # LangGraph state machine workflow
├── server.py             # FastAPI web server and REST endpoints
└── static/               # Frontend Single Page Application
    ├── index.html        # Modern responsive student dashboard
    ├── style.css         # Glassmorphism and dark mode theme
    └── app.js            # Client-side routing and reactive UI logic
```
