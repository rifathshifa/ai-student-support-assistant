import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  Library,
  Loader2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  getGetAssistantDashboardQueryKey,
  getGetStudentProfileQueryKey,
  getListAssistantDocumentsQueryKey,
  useAskAssistant,
  useDeleteAssistantDocument,
  useGetAssistantDashboard,
  useGetAttendance,
  useGetExamSchedule,
  useGetFaqs,
  useGetNotices,
  useGetStudentProfile,
  useGetTimetable,
  useListAssistantConversations,
  useListAssistantDocuments,
  useUpdateStudentProfile,
  useUploadAssistantDocument,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation } from 'wouter';
import './index.css';

const queryClient = new QueryClient();

type IconType = typeof LayoutDashboard;
type ChatItem = {
  role: string;
  content: string;
  createdAt?: string;
  citations?: { documentName: string; category: string; excerpt: string }[];
  toolsUsed?: string[];
};

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/', label: 'Ask Solace', icon: MessageCircle },
  { href: '/knowledge', label: 'Knowledge', icon: Library },
  { href: '/tools', label: 'Campus tools', icon: LayoutDashboard },
  { href: '/memory', label: 'My memory', icon: UserRound },
  { href: '/history', label: 'Conversation history', icon: History },
];

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(value),
      )
    : 'Recently';

const formatTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
    : '';

function Avatar({ name = 'Student', small = false }: { name?: string; small?: boolean }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div data-testid="avatar-student" className={`avatar ${small ? 'avatar-sm' : ''}`}>
      {initials || 'S'}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: dashboard } = useGetAssistantDashboard();
  const profile = dashboard?.profile;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={2.3} /></div>
          <div>
            <div className="brand-name">Solace</div>
            <div className="brand-caption">student support</div>
          </div>
        </div>

        <div className="sidebar-rule" />
        <div className="nav-eyebrow">Your workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                className={`nav-link ${active ? 'nav-link-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {active && <span className="nav-active-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="note-orbit"><Target size={16} /></div>
          <div>
            <strong>One step at a time.</strong>
            <span>Progress is still progress.</span>
          </div>
        </div>
        <Link href="/memory" className="profile-card" data-testid="link-profile-card">
          <Avatar name={profile?.name} small />
          <div className="profile-card-copy">
            <strong>{profile?.name || 'Your profile'}</strong>
            <span>{profile?.program || 'Set up your memory'}</span>
          </div>
          <ChevronRight size={15} />
        </Link>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            data-testid="button-toggle-menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb"><span>Student support</span><ChevronRight size={13} /><strong>{navItems.find((item) => item.href === location)?.label || 'Overview'}</strong></div>
          <div className="topbar-actions">
            <span className="status-pill"><span className="status-dot" /> All systems ready</span>
            <Link href="/memory" className="top-avatar" data-testid="link-top-profile"><Avatar name={profile?.name} small /></Link>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="loading-block" data-testid="loading-state">
      {Array.from({ length: rows }).map((_, index) => <div className="skeleton-line" key={index} style={{ width: `${80 - index * 13}%` }} />)}
    </div>
  );
}

function ErrorState({ message = 'We could not load this space.' }: { message?: string }) {
  return (
    <div className="empty-state error-state" data-testid="status-error">
      <CircleAlert size={22} />
      <strong>Something needs a second look.</strong>
      <span>{message} Try refreshing in a moment.</span>
    </div>
  );
}

function Home() {
  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError } = useGetAssistantDashboard();
  const { data: conversations, isLoading: conversationsLoading } = useListAssistantConversations();
  const askAssistant = useAskAssistant();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const profile = dashboard?.profile;
  const firstName = profile?.name?.split(' ')[0] || 'there';

  const prompts = [
    'What are my next three academic deadlines?',
    'How can I improve my attendance this month?',
    'Find the process for applying for a leave of absence',
  ];

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || askAssistant.isPending) return;
    setMessages((current) => [...current, { role: 'user', content: trimmed, createdAt: new Date().toISOString() }]);
    setQuestion('');
    askAssistant.mutate(
      { data: { question: trimmed, studentId: profile?.id } },
      {
        onSuccess: (response) => setMessages((current) => [...current, {
          role: 'assistant',
          content: response.answer,
          createdAt: response.createdAt,
          citations: response.citations,
          toolsUsed: response.toolsUsed,
        }]),
      },
    );
  };

  const recent = conversations?.slice(0, 4) || [];
  return (
    <div className="workspace animate-in">
      <div className="hero-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Your academic companion</div>
          <h1 className="hero-title">Good morning, <em>{firstName}.</em></h1>
          <p className="hero-subtitle">Let&apos;s make today a little lighter. What would you like to figure out?</p>
        </div>
        <div className="date-card">
          <span className="date-card-label">Today</span>
          <strong>{new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date())}</strong>
          <span>{new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(new Date())}</span>
        </div>
      </div>

      <section className="assistant-panel" data-testid="panel-assistant">
        <div className="assistant-panel-header">
          <div className="assistant-badge"><Sparkles size={18} /><span>Solace is listening</span></div>
          <span className="mono-label">PRIVATE · GROUNDED IN YOUR CAMPUS</span>
        </div>
        <div className="chat-stream">
          <div className="assistant-message">
            <div className="message-avatar"><Sparkles size={15} /></div>
            <div>
              <span className="message-author">Solace <span>· just now</span></span>
              <p>Hi {firstName}. I can look through your campus documents, remember what matters to you, and find the practical details that make student life easier.</p>
            </div>
          </div>
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.content}-${index}`} data-testid={`message-${message.role}-${index}`}>
              {message.role === 'assistant' && <div className="message-avatar"><Sparkles size={15} /></div>}
              <div className="message-body">
                <span className="message-author">{message.role === 'assistant' ? 'Solace' : 'You'} <span>· {formatTime(message.createdAt)}</span></span>
                <p>{message.content}</p>
                {message.role === 'assistant' && (message.citations?.length || message.toolsUsed?.length) ? (
                  <div className="chat-trace">
                    {message.toolsUsed?.map((tool) => <span className="trace-chip trace-tool" key={tool}><Settings2 size={11} /> {tool.replace('get_', '').replaceAll('_', ' ')}</span>)}
                    {message.citations?.slice(0, 2).map((citation) => <span className="trace-chip" key={citation.documentName}><FileText size={11} /> {citation.documentName}</span>)}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {askAssistant.isPending && (
            <div className="assistant-message" data-testid="status-assistant-loading">
              <div className="message-avatar"><Sparkles size={15} /></div>
              <div className="typing-dots"><i /><i /><i /></div>
            </div>
          )}
          {askAssistant.isError && <div className="inline-error"><CircleAlert size={15} /> I couldn&apos;t reach my notes just now. Please try again.</div>}
        </div>
        <form className="ask-form" onSubmit={submitQuestion}>
          <input
            data-testid="input-assistant-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about your courses, campus, or what comes next…"
            aria-label="Ask Solace a question"
          />
          <button type="submit" data-testid="button-submit-question" className="send-button" disabled={!question.trim() || askAssistant.isPending}>
            {askAssistant.isPending ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
          </button>
        </form>
        <div className="suggestion-row">
          <span>Try asking</span>
          {prompts.map((prompt) => <button type="button" key={prompt} data-testid={`button-prompt-${prompts.indexOf(prompt)}`} onClick={() => setQuestion(prompt)}>{prompt}</button>)}
        </div>
      </section>

      <div className="section-heading-row">
        <div><div className="eyebrow">A small overview</div><h2>Keep your bearings</h2></div>
        <Link href="/tools" className="text-link" data-testid="link-view-all-tools">View all tools <ArrowUpRight size={15} /></Link>
      </div>
      <div className="overview-grid">
        <OverviewCard icon={FileText} label="Knowledge library" value={dashboardLoading ? '—' : `${dashboard?.documents ?? 0}`} detail="campus documents" tone="sage" href="/knowledge" />
        <OverviewCard icon={MessageCircle} label="Questions answered" value={dashboardLoading ? '—' : `${dashboard?.questions ?? 0}`} detail="this semester" tone="coral" href="/history" />
        <OverviewCard icon={CalendarDays} label="Upcoming exams" value={dashboardLoading ? '—' : `${dashboard?.upcomingExams ?? 0}`} detail="on your schedule" tone="navy" href="/tools" />
        <OverviewCard icon={UsersRound} label="Attendance" value={dashboardLoading ? '—' : `${dashboard?.attendance ?? 0}%`} detail="across your courses" tone="gold" href="/tools" />
      </div>
      {dashboardError && <ErrorState message="Your overview is taking a little longer than expected." />}

      <div className="lower-grid">
        <section className="surface-card activity-card">
          <div className="card-heading"><div><div className="eyebrow">Recently asked</div><h3>Pick up where you left off</h3></div><Link href="/history" className="icon-link" data-testid="link-history-arrow"><ArrowUpRight size={17} /></Link></div>
          {conversationsLoading ? <LoadingBlock rows={4} /> : recent.length ? (
            <div className="activity-list">{recent.map((item) => <Link href="/history" className="activity-item" key={item.id} data-testid={`activity-item-${item.id}`}><div className="activity-icon"><MessageCircle size={16} /></div><div><strong>{item.content}</strong><span>{formatDate(item.createdAt)}</span></div><ChevronRight size={16} /></Link>)}</div>
          ) : <div className="compact-empty"><History size={20} /><span>Your conversations will appear here as you ask questions.</span></div>}
        </section>
        <section className="surface-card shortcut-card">
          <div className="card-heading"><div><div className="eyebrow">Quick access</div><h3>Campus tools</h3></div><Settings2 size={17} className="muted-icon" /></div>
          <div className="shortcut-list">
            <Link href="/tools?view=timetable" data-testid="link-shortcut-timetable"><CalendarDays size={17} /><span>Today&apos;s timetable</span><ArrowUpRight size={14} /></Link>
            <Link href="/tools?view=attendance" data-testid="link-shortcut-attendance"><Target size={17} /><span>Attendance check</span><ArrowUpRight size={14} /></Link>
            <Link href="/tools?view=notices" data-testid="link-shortcut-notices"><Archive size={17} /><span>Campus notices</span><ArrowUpRight size={14} /></Link>
            <Link href="/tools?view=faqs" data-testid="link-shortcut-faqs"><HelpCircle size={17} /><span>Frequently asked</span><ArrowUpRight size={14} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, detail, tone, href }: { icon: IconType; label: string; value: string; detail: string; tone: string; href: string }) {
  return <Link href={href} className={`overview-card tone-${tone}`} data-testid={`card-overview-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="overview-card-top"><div className="overview-icon"><Icon size={18} /></div><ArrowUpRight size={16} /></div><strong>{value}</strong><span>{label}</span><small>{detail}</small></Link>;
}

function Knowledge() {
  const { data: documents, isLoading, isError } = useListAssistantDocuments();
  const upload = useUploadAssistantDocument();
  const remove = useDeleteAssistantDocument();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Syllabus', content: '' });
  const filtered = useMemo(() => (documents || []).filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase()) || doc.category.toLowerCase().includes(search.toLowerCase())), [documents, search]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.content.trim()) return;
    upload.mutate({ data: form }, { onSuccess: () => { setDialogOpen(false); setForm({ name: '', category: 'Syllabus', content: '' }); setSelectedFile(''); setUploadSuccess(true); window.setTimeout(() => setUploadSuccess(false), 3600); qc.invalidateQueries({ queryKey: getListAssistantDocumentsQueryKey() }); } });
  };
  const readFile = (file?: File) => {
    if (!file) return;
    setSelectedFile(file.name);
    setForm((current) => ({ ...current, name: current.name || file.name.replace(/\.[^/.]+$/, '') }));
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, content: typeof reader.result === 'string' ? reader.result : current.content }));
    reader.readAsText(file);
  };
  const deleteDocument = (id: number) => {
    if (window.confirm('Remove this document from your knowledge library?')) remove.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListAssistantDocumentsQueryKey() }) });
  };
  return <div className="page-stack animate-in">
    <PageIntro eyebrow="Your source of truth" title="Knowledge library" description="The campus documents Solace uses to give you grounded, useful answers." action={<button type="button" className="primary-button" data-testid="button-open-upload" onClick={() => setDialogOpen(true)}><Upload size={16} /> Add document</button>} />
    <div className="library-toolbar"><div className="search-field"><Search size={17} /><input data-testid="input-search-documents" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your documents" /></div><span className="toolbar-count">{documents?.length || 0} sources connected</span></div>
    {isLoading ? <LoadingBlock rows={5} /> : isError ? <ErrorState message="Your document library could not be opened." /> : filtered.length ? <div className="document-list">{filtered.map((document) => <div className="document-row" key={document.id} data-testid={`row-document-${document.id}`}><div className={`document-type document-type-${document.category.toLowerCase().replaceAll(' ', '-')}`}><FileText size={20} /></div><div className="document-main"><strong>{document.name}</strong><span>{document.category} <i /> added {formatDate(document.createdAt)}</span></div><div className="document-stats"><span>{document.wordCount.toLocaleString()} words</span><span>{document.chunkCount} sections</span></div><button type="button" className="ghost-icon danger-hover" data-testid={`button-delete-document-${document.id}`} onClick={() => deleteDocument(document.id)} disabled={remove.isPending}><Trash2 size={16} /></button></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Library size={23} /></div><strong>No documents match that search.</strong><span>Try a different phrase or add a new campus source.</span></div>}
    <div className="upload-hint"><Sparkles size={17} /><div><strong>Good to know</strong><span>Solace cites the exact document and section behind an answer, so you can always check the context.</span></div></div>
    {dialogOpen && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-heading"><div><div className="eyebrow">New source</div><h2 id="upload-title">Add a document</h2></div><button type="button" className="ghost-icon" data-testid="button-close-upload" onClick={() => setDialogOpen(false)}><X size={18} /></button></div><p className="modal-copy">Upload a text document or paste content from a syllabus, notice, regulation, or FAQ. Solace will split it into searchable sections.</p><label className="file-drop"><Upload size={17} /><span><strong>{selectedFile || 'Choose a text document'}</strong><small>TXT, MD, CSV, or JSON</small></span><input data-testid="input-document-file" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,application/json" onChange={(event) => readFile(event.target.files?.[0])} /></label><form onSubmit={submit}><label>Document name<input data-testid="input-document-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. BSc Computer Science handbook" /></label><label>Category<select data-testid="select-document-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Syllabus</option><option>Regulations</option><option>Notice</option><option>FAQ</option></select></label><label>Document text<textarea data-testid="input-document-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Paste the document text here…" rows={7} /></label>{upload.isError && <div className="inline-error"><CircleAlert size={15} /> Upload failed. Check the text and try again.</div>}<div className="modal-actions"><button type="button" className="secondary-button" data-testid="button-cancel-upload" onClick={() => setDialogOpen(false)}>Cancel</button><button type="submit" className="primary-button" data-testid="button-submit-upload" disabled={upload.isPending || !form.name.trim() || !form.content.trim()}>{upload.isPending ? <Loader2 size={16} className="spin" /> : <Upload size={16} />} Add to library</button></div></form></div></div>}
    {uploadSuccess && <div className="success-banner" data-testid="status-upload-success"><Check size={16} /><span><strong>Document connected.</strong> Solace can now use it in an answer.</span><button type="button" className="ghost-icon" onClick={() => setUploadSuccess(false)} aria-label="Dismiss success"><X size={15} /></button></div>}
  </div>;
}

function Tools() {
  const [location] = useLocation();
  const viewFromUrl = new URLSearchParams(location.split('?')[1] || '').get('view');
  const [active, setActive] = useState(viewFromUrl || 'timetable');
  const timetable = useGetTimetable();
  const attendance = useGetAttendance();
  const notices = useGetNotices();
  const exams = useGetExamSchedule();
  const faqs = useGetFaqs();
  const tabs = [{ id: 'timetable', label: 'Timetable', icon: CalendarDays }, { id: 'attendance', label: 'Attendance', icon: Target }, { id: 'notices', label: 'Notices', icon: Archive }, { id: 'exams', label: 'Exams', icon: BookOpen }, { id: 'faqs', label: 'FAQs', icon: HelpCircle }];
  return <div className="page-stack animate-in"><PageIntro eyebrow="Practical campus information" title="Campus tools" description="The details you need, gathered in one calm place." /><div className="tool-tabs" role="tablist">{tabs.map((tab) => { const Icon = tab.icon; return <button type="button" role="tab" aria-selected={active === tab.id} className={`tool-tab ${active === tab.id ? 'tool-tab-active' : ''}`} data-testid={`tab-tool-${tab.id}`} key={tab.id} onClick={() => setActive(tab.id)}><Icon size={16} />{tab.label}</button>; })}</div><div className="tool-view">{active === 'timetable' && <Timetable data={timetable.data} loading={timetable.isLoading} error={timetable.isError} />}{active === 'attendance' && <Attendance data={attendance.data} loading={attendance.isLoading} error={attendance.isError} />}{active === 'notices' && <Notices data={notices.data} loading={notices.isLoading} error={notices.isError} />}{active === 'exams' && <Exams data={exams.data} loading={exams.isLoading} error={exams.isError} />}{active === 'faqs' && <Faqs data={faqs.data} loading={faqs.isLoading} error={faqs.isError} />}</div></div>;
}

function ToolHeader({ title, detail, icon: Icon }: { title: string; detail: string; icon: IconType }) { return <div className="tool-view-heading"><div className="tool-heading-icon"><Icon size={20} /></div><div><h2>{title}</h2><p>{detail}</p></div><MoreHorizontal size={19} className="muted-icon" /></div>; }
function ToolState({ loading, error, children }: { loading?: boolean; error?: boolean; children: ReactNode }) { if (loading) return <LoadingBlock rows={4} />; if (error) return <ErrorState />; return <>{children}</>; }
function Timetable({ data, loading, error }: { data?: any[]; loading: boolean; error: boolean }) { return <><ToolHeader title="This week" detail="Your teaching schedule at a glance." icon={CalendarDays} /><ToolState loading={loading} error={error}>{data?.length ? <div className="timetable-grid">{data.map((entry) => <div className="class-card" key={entry.id} data-testid={`card-class-${entry.id}`}><span className="class-day">{entry.day}</span><strong>{entry.time}</strong><h3>{entry.course}</h3><span>{entry.room} · {entry.instructor}</span></div>)}</div> : <div className="empty-state"><CalendarDays size={24} /><strong>Your timetable is clear.</strong><span>Once your schedule is available, it will show up here.</span></div>}</ToolState></>; }
function Attendance({ data, loading, error }: { data?: any[]; loading: boolean; error: boolean }) { return <><ToolHeader title="Attendance" detail="A gentle nudge before a small gap becomes a big one." icon={Target} /><ToolState loading={loading} error={error}>{data?.length ? <div className="attendance-list">{data.map((entry) => <div className="attendance-row" key={entry.id} data-testid={`row-attendance-${entry.id}`}><div><strong>{entry.course}</strong><span>{entry.attended} of {entry.total} sessions attended</span></div><div className="attendance-meter"><span style={{ width: `${entry.percentage}%` }} /></div><strong className={`attendance-percent ${entry.status.toLowerCase()}`}>{entry.percentage}%</strong></div>)}</div> : <div className="empty-state"><Target size={24} /><strong>No attendance records yet.</strong><span>Your course attendance will appear here.</span></div>}</ToolState></>; }
function Notices({ data, loading, error }: { data?: any[]; loading: boolean; error: boolean }) { return <><ToolHeader title="Campus notices" detail="The updates worth knowing about." icon={Archive} /><ToolState loading={loading} error={error}>{data?.length ? <div className="notice-list">{data.map((notice) => <div className="notice-row" key={notice.id} data-testid={`row-notice-${notice.id}`}><div className={`priority-mark priority-${notice.priority.toLowerCase()}`} /><div><div className="notice-meta"><span>{notice.category}</span><i />{formatDate(notice.date)}</div><h3>{notice.title}</h3><p>{notice.summary}</p></div><ChevronRight size={17} className="muted-icon" /></div>)}</div> : <div className="empty-state"><Archive size={24} /><strong>No new notices.</strong><span>You are all caught up for now.</span></div>}</ToolState></>; }
function Exams({ data, loading, error }: { data?: any[]; loading: boolean; error: boolean }) { return <><ToolHeader title="Exam schedule" detail="A clear view of what is coming up." icon={BookOpen} /><ToolState loading={loading} error={error}>{data?.length ? <div className="exam-list">{data.map((exam) => <div className="exam-row" key={exam.id} data-testid={`row-exam-${exam.id}`}><div className="exam-date"><strong>{new Intl.DateTimeFormat('en', { day: '2-digit' }).format(new Date(exam.date))}</strong><span>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(exam.date))}</span></div><div><span className="exam-type">{exam.type}</span><h3>{exam.course}</h3><p>{exam.time} · {exam.venue}</p></div><ChevronRight size={17} className="muted-icon" /></div>)}</div> : <div className="empty-state"><BookOpen size={24} /><strong>No exams on your schedule.</strong><span>We&apos;ll keep an eye on this space.</span></div>}</ToolState></>; }
function Faqs({ data, loading, error }: { data?: any[]; loading: boolean; error: boolean }) { return <><ToolHeader title="Frequently asked" detail="Short answers to common campus questions." icon={HelpCircle} /><ToolState loading={loading} error={error}>{data?.length ? <div className="faq-list">{data.map((faq) => <details key={faq.id} data-testid={`faq-${faq.id}`}><summary><span>{faq.question}</span><Plus size={17} /></summary><div className="faq-answer"><span className="faq-category">{faq.category}</span><p>{faq.answer}</p></div></details>)}</div> : <div className="empty-state"><HelpCircle size={24} /><strong>No FAQs available yet.</strong><span>Ask Solace and it will search your connected sources.</span></div>}</ToolState></>; }

function Memory() {
  const { data: profile, isLoading, isError } = useGetStudentProfile();
  const update = useUpdateStudentProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState<any>(null);
  const beginEdit = () => { if (profile) setForm({ ...profile, goals: profile.goals?.join(', ') || '', preferences: profile.preferences?.join(', ') || '' }); setEditing(true); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form) return; update.mutate({ data: { ...form, goals: form.goals.split(',').map((item: string) => item.trim()).filter(Boolean), preferences: form.preferences.split(',').map((item: string) => item.trim()).filter(Boolean) } }, { onSuccess: () => { setEditing(false); setSaveSuccess(true); window.setTimeout(() => setSaveSuccess(false), 3600); qc.invalidateQueries({ queryKey: getGetStudentProfileQueryKey() }); qc.invalidateQueries({ queryKey: getGetAssistantDashboardQueryKey() }); } }); };
  return <div className="page-stack animate-in"><PageIntro eyebrow="What Solace remembers" title="My memory" description="A little context helps every answer feel more like yours." action={!editing && <button type="button" className="secondary-button" data-testid="button-edit-memory" onClick={beginEdit}><Pencil size={15} /> Edit details</button>} />{saveSuccess && <div className="success-banner" data-testid="status-memory-success"><Check size={16} /><span><strong>Memory updated.</strong> Your support will reflect the new details.</span><button type="button" className="ghost-icon" onClick={() => setSaveSuccess(false)} aria-label="Dismiss success"><X size={15} /></button></div>}{isLoading ? <LoadingBlock rows={5} /> : isError ? <ErrorState message="Your remembered profile could not be loaded." /> : profile && !editing ? <div className="memory-layout"><section className="memory-profile surface-card"><div className="memory-profile-top"><Avatar name={profile.name} /><div><h2>{profile.name}</h2><span>{profile.program} · {profile.semester}</span></div></div><div className="memory-contact"><span>Email</span><strong>{profile.email}</strong></div><div className="memory-contact"><span>Last updated</span><strong>{formatDate(profile.updatedAt)}</strong></div></section><section className="surface-card memory-details"><div className="detail-block"><div className="detail-icon"><Target size={17} /></div><div><span className="detail-label">What I&apos;m working toward</span><div className="chip-row">{profile.goals?.map((goal) => <span className="soft-chip" key={goal}>{goal}</span>)}</div></div></div><div className="detail-divider" /><div className="detail-block"><div className="detail-icon coral"><Settings2 size={17} /></div><div><span className="detail-label">How I like support</span><div className="chip-row">{profile.preferences?.map((preference) => <span className="soft-chip" key={preference}>{preference}</span>)}</div></div></div></section><div className="memory-callout"><Sparkles size={19} /><div><strong>You&apos;re in control.</strong><span>Solace only uses this context to personalize your support. Update or clear it whenever you like.</span></div></div></div> : editing && form ? <form className="edit-form surface-card" onSubmit={submit}><div className="form-grid"><label>Name<input data-testid="input-profile-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email<input data-testid="input-profile-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Program<input data-testid="input-profile-program" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></label><label>Semester<input data-testid="input-profile-semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></label><label className="span-2">Goals <span className="field-hint">separate with commas</span><input data-testid="input-profile-goals" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} /></label><label className="span-2">Support preferences <span className="field-hint">separate with commas</span><input data-testid="input-profile-preferences" value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })} /></label></div>{update.isError && <div className="inline-error"><CircleAlert size={15} /> We couldn&apos;t save those changes.</div>}<div className="form-actions"><button type="button" className="secondary-button" data-testid="button-cancel-memory" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="primary-button" data-testid="button-save-memory" disabled={update.isPending}>{update.isPending ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Save changes</button></div></form> : null}</div>;
}

function HistoryPage() {
  const { data: conversations, isLoading, isError } = useListAssistantConversations();
  const [search, setSearch] = useState('');
  const items = (conversations || []).filter((item) => item.content.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-stack animate-in"><PageIntro eyebrow="A record of your questions" title="Conversation history" description="Your recent conversations with Solace, kept close when you need to revisit them." /><div className="library-toolbar"><div className="search-field"><Search size={17} /><input data-testid="input-search-history" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" /></div><span className="toolbar-count">{conversations?.length || 0} conversations</span></div>{isLoading ? <LoadingBlock rows={6} /> : isError ? <ErrorState message="Your conversation history could not be loaded." /> : items.length ? <div className="history-list">{items.map((item) => <div className="history-row" key={item.id} data-testid={`row-history-${item.id}`}><div className={`history-role ${item.role === 'assistant' ? 'role-assistant' : ''}`}>{item.role === 'assistant' ? <Sparkles size={16} /> : <UserRound size={16} />}</div><div className="history-copy"><span className="history-meta">{item.role === 'assistant' ? 'Solace' : 'You'} <i /> {formatDate(item.createdAt)}</span><p>{item.content}</p>{item.citations?.length ? <div className="citation-count"><FileText size={13} /> {item.citations.length} source{item.citations.length > 1 ? 's' : ''}</div> : null}</div><ChevronRight size={17} className="muted-icon" /></div>)}</div> : <div className="empty-state"><div className="empty-icon"><History size={23} /></div><strong>No conversations found.</strong><span>Ask Solace a question from your workspace to start a useful trail.</span><Link href="/" className="primary-button" data-testid="link-start-conversation"><MessageCircle size={15} /> Ask a question</Link></div>}</div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Home} /><Route path="/knowledge" component={Knowledge} /><Route path="/tools" component={Tools} /><Route path="/memory" component={Memory} /><Route path="/history" component={HistoryPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;