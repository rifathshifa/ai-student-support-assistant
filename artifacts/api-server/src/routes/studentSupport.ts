import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  AskAssistantBody,
  DeleteAssistantDocumentParams,
  GetAssistantDashboardQueryParams,
  GetStudentProfileQueryParams,
  GetTimetableQueryParams,
  GetAttendanceQueryParams,
  ListAssistantConversationsQueryParams,
  UpdateStudentProfileBody,
  UploadAssistantDocumentBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  assistantMessagesTable,
  knowledgeDocumentsTable,
  studentProfilesTable,
} from "@workspace/db";

const router: IRouter = Router();
const DEMO_STUDENT_ID = "demo-student";

const timetable = [
  { id: 1, day: "Monday", time: "09:00 – 10:00", course: "Data Structures", room: "B-204", instructor: "Dr. Meera Nair" },
  { id: 2, day: "Monday", time: "11:00 – 12:00", course: "Database Systems", room: "Lab 3", instructor: "Prof. Arjun Rao" },
  { id: 3, day: "Tuesday", time: "10:00 – 11:00", course: "Operating Systems", room: "A-102", instructor: "Dr. Kavita Shah" },
  { id: 4, day: "Wednesday", time: "14:00 – 16:00", course: "Applied AI Lab", room: "Innovation Hub", instructor: "Dr. Vikram Iyer" },
  { id: 5, day: "Thursday", time: "09:00 – 10:00", course: "Computer Networks", room: "B-201", instructor: "Prof. Neha Kulkarni" },
  { id: 6, day: "Friday", time: "13:00 – 14:00", course: "Professional Communication", room: "C-105", instructor: "Ms. Ritu Menon" },
];

const attendance = [
  { id: 1, course: "Data Structures", attended: 23, total: 25, percentage: 92, status: "Healthy" },
  { id: 2, course: "Database Systems", attended: 20, total: 24, percentage: 83, status: "Healthy" },
  { id: 3, course: "Operating Systems", attended: 18, total: 23, percentage: 78, status: "Watch" },
  { id: 4, course: "Applied AI Lab", attended: 14, total: 16, percentage: 88, status: "Healthy" },
  { id: 5, course: "Computer Networks", attended: 16, total: 22, percentage: 73, status: "At risk" },
];

const notices = [
  { id: 1, title: "Mid-semester examination registration", category: "Examinations", date: "2026-09-08", summary: "Register through the student portal by 12 September. Late requests need department approval.", priority: "High" },
  { id: 2, title: "Innovation Hub extended hours", category: "Campus", date: "2026-09-06", summary: "The Innovation Hub will remain open until 21:00 during project submission week.", priority: "Normal" },
  { id: 3, title: "Scholarship renewal window", category: "Student services", date: "2026-09-04", summary: "Submit renewal documents to the financial aid office before 30 September.", priority: "Normal" },
];

const exams = [
  { id: 1, course: "Data Structures", date: "2026-09-21", time: "10:00 – 12:00", venue: "Main Hall", type: "Mid-semester" },
  { id: 2, course: "Database Systems", date: "2026-09-23", time: "14:00 – 16:00", venue: "Main Hall", type: "Mid-semester" },
  { id: 3, course: "Operating Systems", date: "2026-09-25", time: "10:00 – 12:00", venue: "Block A-101", type: "Mid-semester" },
  { id: 4, course: "Applied AI Lab", date: "2026-09-28", time: "09:00 – 11:00", venue: "Innovation Hub", type: "Practical" },
];

const faqs = [
  { id: 1, question: "How do I request a bonafide certificate?", answer: "Open Student Services in the portal, choose Certificates, select Bonafide, and submit the request. Processing usually takes two working days.", category: "Student services" },
  { id: 2, question: "What is the minimum attendance requirement?", answer: "Students should maintain at least 75% attendance in each registered course. Medical exceptions require supporting documents and approval.", category: "Academic rules" },
  { id: 3, question: "Where can I find the academic calendar?", answer: "The current academic calendar is published under Notices in the student portal and on the Registrar's office page.", category: "General" },
  { id: 4, question: "How can I contact the department office?", answer: "Visit the department office between 09:30 and 16:30 on working days, or email the department coordinator through the portal.", category: "General" },
];

const seedDocuments = [
  {
    name: "B.Tech CSE Student Handbook 2026",
    category: "Regulations",
    content: "Students must maintain a minimum of 75% attendance in every registered course. Requests for attendance condonation must be submitted to the department office with supporting documents within seven working days. Mid-semester examination registration closes on 12 September 2026. Students may request bonafide certificates through the Student Services portal. The academic grievance committee accepts written appeals within ten working days of a result being published.",
  },
  {
    name: "Data Structures — Course Syllabus",
    category: "Syllabus",
    content: "Data Structures covers algorithm analysis, arrays, linked lists, stacks, queues, trees, graphs, hashing, and sorting. Assessment is 30% continuous assessment, 20% mid-semester examination, and 50% end-semester examination. The mid-semester exam is scheduled for 21 September 2026 from 10:00 to 12:00 in the Main Hall. Students should bring their university ID card.",
  },
  {
    name: "Student Services FAQ",
    category: "FAQs",
    content: "To request a bonafide certificate, open Student Services in the portal, choose Certificates, select Bonafide, and submit the request. Processing usually takes two working days. The academic calendar is published under Notices in the student portal. Department offices are open from 09:30 to 16:30 on working days.",
  },
];

type Citation = { documentName: string; category: string; excerpt: string };
type ToolName = "get_timetable" | "get_attendance" | "get_notices" | "get_exams" | "get_faqs";

let seedPromise: Promise<void> | undefined;

function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
  const existingProfile = await db
    .select()
    .from(studentProfilesTable)
    .where(eq(studentProfilesTable.studentId, DEMO_STUDENT_ID))
    .limit(1);

  if (existingProfile.length === 0) {
    await db.insert(studentProfilesTable).values({
      studentId: DEMO_STUDENT_ID,
      name: "Aarav Sharma",
      program: "B.Tech Computer Science",
      semester: "Semester 5",
      email: "aarav.sharma@campus.edu",
      goals: ["Build a strong AI portfolio", "Stay above 75% attendance"],
      preferences: ["Concise answers", "Include deadlines", "Use my course context"],
    });
  }

  const existingDocuments = await db.select({ id: knowledgeDocumentsTable.id }).from(knowledgeDocumentsTable).limit(1);
  if (existingDocuments.length === 0) {
    await db.insert(knowledgeDocumentsTable).values(
      seedDocuments.map((document) => ({
        ...document,
        chunkCount: chunkDocument(document.content).length,
        wordCount: document.content.split(/\s+/).filter(Boolean).length,
      })),
    );
  }

  const existingMessages = await db.select({ id: assistantMessagesTable.id }).from(assistantMessagesTable).limit(1);
  if (existingMessages.length === 0) {
    await db.insert(assistantMessagesTable).values([
      { studentId: DEMO_STUDENT_ID, role: "user", content: "What should I focus on this week?", citations: [], toolsUsed: [] },
      { studentId: DEMO_STUDENT_ID, role: "assistant", content: "This week, prioritize your Data Structures revision, keep Computer Networks attendance above 75%, and register for mid-semester exams before 12 September. I can also pull up your timetable or upcoming exam venues.", citations: [{ documentName: "B.Tech CSE Student Handbook 2026", category: "Regulations", excerpt: "Mid-semester examination registration closes on 12 September 2026." }], toolsUsed: ["get_attendance", "get_exams"], },
    ]);
  }
  })().catch((error) => {
    seedPromise = undefined;
    throw error;
  });
  return seedPromise;
}

function chunkDocument(content: string) {
  const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    chunks.push(sentences.slice(index, index + 2).join(" "));
  }
  return chunks;
}

function profileResponse(profile: typeof studentProfilesTable.$inferSelect) {
  return {
    id: profile.studentId,
    name: profile.name,
    program: profile.program,
    semester: profile.semester,
    email: profile.email,
    goals: profile.goals,
    preferences: profile.preferences,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

async function getProfile(studentId = DEMO_STUDENT_ID) {
  await ensureSeeded();
  const rows = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.studentId, studentId)).limit(1);
  return rows[0] ?? (await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.studentId, DEMO_STUDENT_ID)).limit(1))[0];
}

function retrieveDocuments(question: string, documents: Array<typeof knowledgeDocumentsTable.$inferSelect>) {
  const stopWords = new Set(["what", "when", "where", "which", "how", "can", "the", "are", "for", "from", "with", "about", "tell", "please", "does", "this", "that", "should", "have", "your", "my"]);
  const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stopWords.has(term));
  return documents
    .map((document) => {
      const lower = document.content.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
      const matchedTerm = terms.find((term) => lower.includes(term));
      const start = matchedTerm ? Math.max(0, lower.indexOf(matchedTerm) - 70) : 0;
      const excerpt = document.content.slice(start, start + 240).trim();
      return { document, score, excerpt };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function toolResult(tool: ToolName) {
  switch (tool) {
    case "get_timetable":
      return timetable;
    case "get_attendance":
      return attendance;
    case "get_notices":
      return notices;
    case "get_exams":
      return exams;
    case "get_faqs":
      return faqs;
  }
}

function inferTools(question: string): ToolName[] {
  const lower = question.toLowerCase();
  const tools: ToolName[] = [];
  if (/(timetable|schedule|class|lecture|today)/.test(lower)) tools.push("get_timetable");
  if (/(attendance|present|absent|eligib)/.test(lower)) tools.push("get_attendance");
  if (/(notice|announcement|deadline|registration|renewal)/.test(lower)) tools.push("get_notices");
  if (/(exam|mid-sem|test|assessment|venue)/.test(lower)) tools.push("get_exams");
  if (/(faq|certificate|bonafide|calendar|office|how do i)/.test(lower)) tools.push("get_faqs");
  return tools;
}

function intentFor(question: string, tools: ToolName[]) {
  if (tools.length > 0) return tools[0].replace("get_", "");
  if (/(syllabus|regulation|attendance requirement|policy)/i.test(question)) return "document_qa";
  return "student_support";
}

function fallbackAnswer(question: string, profile: ReturnType<typeof profileResponse>, citations: Citation[], tools: ToolName[]) {
  const lower = question.toLowerCase();
  const pieces: string[] = [];
  if (lower.includes("attendance")) {
    pieces.push(`Your current average across tracked courses is 83%. Computer Networks is at 73% (16 of 22 classes), so attending the next two sessions would be a good priority.`);
  } else if (lower.includes("timetable") || lower.includes("schedule") || lower.includes("class")) {
    pieces.push(`Your next scheduled class is Data Structures on Monday from 09:00 to 10:00 in B-204 with Dr. Meera Nair.`);
  } else if (lower.includes("exam")) {
    pieces.push(`Your next exam is Data Structures on 21 September 2026 from 10:00 to 12:00 in the Main Hall. Remember to complete registration by 12 September.`);
  } else if (lower.includes("notice") || lower.includes("deadline")) {
    pieces.push(`The highest-priority notice is mid-semester examination registration: submit it through the student portal by 12 September 2026.`);
  } else {
    pieces.push(`Based on your student profile and the college knowledge base, start with your Data Structures revision and keep an eye on Computer Networks attendance.`);
  }
  if (citations.length > 0) pieces.push(`I found this in ${citations[0].documentName}: “${citations[0].excerpt}”`);
  if (profile.goals.length > 0) pieces.push(`This aligns with your goal to ${profile.goals[0].toLowerCase()}.`);
  if (tools.length > 0) pieces.push(`I also checked ${tools.map((tool) => tool.replace("get_", "").replace("_", " ")).join(" and ")} for the latest details.`);
  return pieces.join(" ");
}

async function askOpenAi(
  question: string,
  profile: ReturnType<typeof profileResponse>,
  history: Array<{ role: string; content: string }>,
  citations: Citation[],
  tools: ToolName[],
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const toolDefinitions = [
    { type: "function", function: { name: "get_timetable", description: "Retrieve the student's current timetable.", parameters: { type: "object", properties: {} } } },
    { type: "function", function: { name: "get_attendance", description: "Retrieve attendance percentage by course.", parameters: { type: "object", properties: {} } } },
    { type: "function", function: { name: "get_notices", description: "Retrieve current college notices and deadlines.", parameters: { type: "object", properties: {} } } },
    { type: "function", function: { name: "get_exams", description: "Retrieve upcoming exam dates, venues, and times.", parameters: { type: "object", properties: {} } } },
    { type: "function", function: { name: "get_faqs", description: "Retrieve common student service FAQs.", parameters: { type: "object", properties: {} } } },
  ];

  const system = `You are CampusGuide, a grounded college student support agent. Answer clearly and kindly, with concise paragraphs and bullets when useful. Never invent college rules or deadlines. Use the provided knowledge snippets as the source of truth and mention uncertainty when a source does not answer the question. You have tool access for live timetable, attendance, notices, exams, and FAQs. The student's remembered context is below.
Student: ${profile.name}, ${profile.program}, ${profile.semester}
Goals: ${profile.goals.join(", ") || "not provided"}
Preferences: ${profile.preferences.join(", ") || "not provided"}
Retrieved knowledge snippets:
${citations.map((citation) => `[${citation.documentName} / ${citation.category}] ${citation.excerpt}`).join("\n") || "No matching document snippet was found."}
The assistant may have already called these tools: ${tools.join(", ") || "none"}.`;

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: system },
    ...history.slice(-8).map((message) => ({ role: message.role, content: message.content })),
    { role: "user", content: question },
  ];

  const firstResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, tools: toolDefinitions, tool_choice: "auto", max_tokens: 700 }),
  });
  if (!firstResponse.ok) return null;
  const firstPayload = (await firstResponse.json()) as {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ id: string; function: { name: ToolName; arguments: string } }> } }>;
  };
  const firstMessage = firstPayload.choices?.[0]?.message;
  if (!firstMessage) return null;

  if (firstMessage.tool_calls && firstMessage.tool_calls.length > 0) {
    messages.push({ role: "assistant", content: firstMessage.content ?? null, tool_calls: firstMessage.tool_calls });
    for (const toolCall of firstMessage.tool_calls) {
      if (toolResult(toolCall.function.name)) {
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult(toolCall.function.name)) });
      }
    }
    const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, tools: toolDefinitions, max_tokens: 700 }),
    });
    if (!secondResponse.ok) return null;
    const secondPayload = (await secondResponse.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
    return secondPayload.choices?.[0]?.message?.content ?? null;
  }

  return firstMessage.content ?? null;
}

router.get("/assistant/dashboard", async (req, res) => {
  await ensureSeeded();
  const params = GetAssistantDashboardQueryParams.parse(req.query);
  const profile = await getProfile(params.studentId);
  const documents = await db.select({ id: knowledgeDocumentsTable.id }).from(knowledgeDocumentsTable);
  const questions = await db.select({ id: assistantMessagesTable.id }).from(assistantMessagesTable).where(and(eq(assistantMessagesTable.studentId, params.studentId), eq(assistantMessagesTable.role, "user")));
  res.json({
    documents: documents.length,
    questions: questions.length,
    upcomingExams: exams.length,
    attendance: Math.round((attendance.reduce((sum, record) => sum + record.percentage, 0) / attendance.length) * 10) / 10,
    notices: notices.length,
    profile: profileResponse(profile),
  });
});

router.get("/assistant/profile", async (req, res) => {
  const params = GetStudentProfileQueryParams.parse(req.query);
  res.json(profileResponse(await getProfile(params.studentId)));
});

router.patch("/assistant/profile", async (req, res) => {
  const body = UpdateStudentProfileBody.parse(req.body);
  const studentId = body.id ?? DEMO_STUDENT_ID;
  await ensureSeeded();
  const [profile] = await db.update(studentProfilesTable).set({
    name: body.name,
    program: body.program,
    semester: body.semester,
    email: body.email,
    goals: body.goals ?? [],
    preferences: body.preferences ?? [],
    updatedAt: new Date(),
  }).where(eq(studentProfilesTable.studentId, studentId)).returning();
  res.json(profileResponse(profile));
});

router.get("/assistant/documents", async (_req, res) => {
  await ensureSeeded();
  const documents = await db.select().from(knowledgeDocumentsTable).orderBy(desc(knowledgeDocumentsTable.createdAt));
  res.json(documents.map((document) => ({
    id: document.id,
    name: document.name,
    category: document.category,
    chunkCount: document.chunkCount,
    wordCount: document.wordCount,
    createdAt: document.createdAt.toISOString(),
  })));
});

router.post("/assistant/documents", async (req, res) => {
  const body = UploadAssistantDocumentBody.parse(req.body);
  const chunks = chunkDocument(body.content);
  const [document] = await db.insert(knowledgeDocumentsTable).values({
    name: body.name,
    category: body.category,
    content: body.content,
    chunkCount: chunks.length,
    wordCount: body.content.split(/\s+/).filter(Boolean).length,
  }).returning();
  res.status(201).json({
    id: document.id,
    name: document.name,
    category: document.category,
    chunkCount: document.chunkCount,
    wordCount: document.wordCount,
    createdAt: document.createdAt.toISOString(),
  });
});

router.delete("/assistant/documents/:id", async (req, res) => {
  const params = DeleteAssistantDocumentParams.parse({ id: Number(req.params.id) });
  await db.delete(knowledgeDocumentsTable).where(eq(knowledgeDocumentsTable.id, params.id));
  res.status(204).send();
});

router.get("/assistant/conversations", async (req, res) => {
  await ensureSeeded();
  const params = ListAssistantConversationsQueryParams.parse(req.query);
  const messages = await db.select().from(assistantMessagesTable)
    .where(eq(assistantMessagesTable.studentId, params.studentId))
    .orderBy(asc(assistantMessagesTable.createdAt), asc(assistantMessagesTable.id));
  res.json(messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    citations: message.citations,
    toolsUsed: message.toolsUsed,
  })));
});

router.post("/assistant/chat", async (req, res) => {
  const body = AskAssistantBody.parse(req.body);
  const studentId = body.studentId ?? DEMO_STUDENT_ID;
  const profile = await getProfile(studentId);
  const documents = await db.select().from(knowledgeDocumentsTable);
  const matches = retrieveDocuments(body.question, documents);
  const citations: Citation[] = matches.map(({ document, excerpt }) => ({
    documentName: document.name,
    category: document.category,
    excerpt,
  }));
  const inferredTools = inferTools(body.question);
  const historyRows = await db.select({ role: assistantMessagesTable.role, content: assistantMessagesTable.content })
    .from(assistantMessagesTable)
    .where(eq(assistantMessagesTable.studentId, studentId))
    .orderBy(desc(assistantMessagesTable.createdAt))
    .limit(8);
  const history = historyRows.reverse();
  const aiAnswer = await askOpenAi(body.question, profileResponse(profile), history, citations, inferredTools);
  const answer = aiAnswer ?? fallbackAnswer(body.question, profileResponse(profile), citations, inferredTools);
  const now = new Date();
  const [userMessage] = await db.insert(assistantMessagesTable).values({
    studentId,
    role: "user",
    content: body.question,
    citations: [],
    toolsUsed: inferredTools,
  }).returning();
  const [assistantMessage] = await db.insert(assistantMessagesTable).values({
    studentId,
    role: "assistant",
    content: answer,
    citations,
    toolsUsed: inferredTools,
  }).returning();
  res.json({
    id: assistantMessage.id,
    answer,
    citations,
    toolsUsed: inferredTools,
    memoryUsed: [
      profile.name ? `Remembered your name: ${profile.name}` : "",
      profile.program ? `Used your ${profile.program} context` : "",
      history.length > 0 ? "Used recent conversation history" : "",
    ].filter(Boolean),
    intent: intentFor(body.question, inferredTools),
    createdAt: now.toISOString(),
  });
});

router.get("/assistant/tools/timetable", async (req, res) => {
  GetTimetableQueryParams.parse(req.query);
  res.json(timetable);
});

router.get("/assistant/tools/attendance", async (req, res) => {
  GetAttendanceQueryParams.parse(req.query);
  res.json(attendance);
});

router.get("/assistant/tools/notices", (_req, res) => {
  res.json(notices);
});

router.get("/assistant/tools/exams", (_req, res) => {
  res.json(exams);
});

router.get("/assistant/tools/faqs", (_req, res) => {
  res.json(faqs);
});

export default router;