// Solace AI Student Support Client
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();

  // Navigation Tabs
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const breadcrumb = document.getElementById('topbarBreadcrumb');

  function switchTab(tabId, subtab) {
    navLinks.forEach(link => {
      const active = link.getAttribute('data-tab') === tabId;
      link.classList.toggle('active', active);
      const dot = link.querySelector('.nav-active-dot');
      if (dot) dot.remove();
      if (active) {
        const newDot = document.createElement('span');
        newDot.className = 'nav-active-dot';
        link.appendChild(newDot);
      }
    });

    tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));

    const activeLink = document.querySelector(`.main-nav .nav-link[data-tab="${tabId}"]`);
    if (activeLink && breadcrumb) {
      breadcrumb.textContent = activeLink.querySelector('span').textContent;
    }

    if (tabId === 'knowledge') loadDocuments();
    if (tabId === 'tools') loadTools(subtab || 'timetable');
    if (tabId === 'memory') loadMemory();
    if (tabId === 'history') loadHistory();
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => switchTab(link.getAttribute('data-tab')));
  });

  // Direct tab triggers on cards
  document.querySelectorAll('[data-tab-target]').forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-tab-target');
      const subtab = card.getAttribute('data-tool-subtab');
      switchTab(tab, subtab);
    });
  });

  // Chat Submission
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatStream = document.getElementById('chatStream');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = chatInput.value.trim();
    if (!q) return;

    appendChatMessage('user', q);
    chatInput.value = '';
    chatInput.focus();

    // Loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-message assistant';
    loadingEl.id = loadingId;
    loadingEl.innerHTML = `
      <div class="message-avatar"><i data-lucide="sparkles" style="width:15px; height:15px;"></i></div>
      <div class="message-body">
        <span class="message-author">Solace <span>· Thinking with LangGraph & RAG...</span></span>
        <p style="color:var(--ink-soft);">Checking campus regulations and live records...</p>
      </div>
    `;
    chatStream.appendChild(loadingEl);
    if (window.lucide) window.lucide.createIcons();
    chatStream.scrollTop = chatStream.scrollHeight;

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, studentId: 'demo-student' })
      });
      const data = await res.json();
      loadingEl.remove();

      appendChatMessage('assistant', data.answer, data.citations, data.toolsUsed);
      loadDashboard();
    } catch (err) {
      loadingEl.innerHTML = `<p style="color:var(--coral);">Failed to reach assistant: ${err.message}</p>`;
    }
  });

  // Suggestion buttons
  document.querySelectorAll('.sugg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.getAttribute('data-query');
      chatForm.dispatchEvent(new Event('submit'));
    });
  });

  // Tool Subtabs
  document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderToolView(tab.getAttribute('data-tool'));
    });
  });

  // Upload Document Modal
  const uploadModal = document.getElementById('uploadModal');
  const openUploadBtn = document.getElementById('openUploadBtn');
  const closeUploadBtn = document.getElementById('closeUploadBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const uploadDocForm = document.getElementById('uploadDocForm');

  if (openUploadBtn) openUploadBtn.onclick = () => uploadModal.classList.remove('hidden');
  if (closeUploadBtn) closeUploadBtn.onclick = () => uploadModal.classList.add('hidden');
  if (cancelUploadBtn) cancelUploadBtn.onclick = () => uploadModal.classList.add('hidden');

  if (uploadDocForm) {
    uploadDocForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('docName').value;
      const category = document.getElementById('docCategory').value;
      const content = document.getElementById('docContent').value;

      try {
        await fetch('/api/assistant/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, content })
        });
        uploadModal.classList.add('hidden');
        uploadDocForm.reset();
        loadDocuments();
        loadDashboard();
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    });
  }

  // Memory Form toggle
  const editMemoryBtn = document.getElementById('toggleEditMemoryBtn');
  const cancelEditMemoryBtn = document.getElementById('cancelEditMemoryBtn');
  const memoryDisplay = document.getElementById('memoryDisplay');
  const memoryForm = document.getElementById('memoryForm');

  if (editMemoryBtn) {
    editMemoryBtn.onclick = () => {
      memoryDisplay.style.display = 'none';
      memoryForm.style.display = 'block';
    };
  }
  if (cancelEditMemoryBtn) {
    cancelEditMemoryBtn.onclick = () => {
      memoryDisplay.style.display = 'grid';
      memoryForm.style.display = 'none';
    };
  }

  if (memoryForm) {
    memoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        program: 'B.Tech Computer Science',
        semester: 'Semester 5',
        goals: document.getElementById('editGoals').value.split(',').map(s => s.trim()).filter(Boolean),
        preferences: document.getElementById('editPrefs').value.split(',').map(s => s.trim()).filter(Boolean),
      };

      try {
        const res = await fetch('/api/assistant/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await res.json();
        memoryDisplay.style.display = 'grid';
        memoryForm.style.display = 'none';
        loadMemory();
        loadDashboard();
      } catch (err) {
        alert('Failed to save profile: ' + err.message);
      }
    });
  }

  // Initial Boot
  loadDashboard();
  loadConversations();
});

function appendChatMessage(role, text, citations = [], tools = []) {
  const stream = document.getElementById('chatStream');
  const msg = document.createElement('div');
  msg.className = `chat-message ${role}`;

  const isUser = role === 'user';
  let tracesHtml = '';

  if (citations && citations.length > 0) {
    citations.forEach(c => {
      tracesHtml += `<span class="trace-chip"><i data-lucide="bookmark" style="width:11px; height:11px;"></i> ${escapeHtml(c.documentName)}</span>`;
    });
  }
  if (tools && tools.length > 0) {
    tools.forEach(t => {
      tracesHtml += `<span class="trace-chip trace-tool"><i data-lucide="wrench" style="width:11px; height:11px;"></i> tool:${escapeHtml(t)}</span>`;
    });
  }

  msg.innerHTML = `
    ${!isUser ? `<div class="message-avatar"><i data-lucide="sparkles" style="width:15px; height:15px;"></i></div>` : ''}
    <div class="message-body">
      ${!isUser ? `<span class="message-author">Solace</span>` : ''}
      <p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>
      ${tracesHtml ? `<div class="chat-trace">${tracesHtml}</div>` : ''}
    </div>
  `;

  stream.appendChild(msg);
  if (window.lucide) window.lucide.createIcons();
  stream.scrollTop = stream.scrollHeight;
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/assistant/dashboard');
    const data = await res.json();
    document.getElementById('statAttendance').innerText = data.attendance + '%';
    document.getElementById('statExams').innerText = data.upcomingExams;
    document.getElementById('statDocs').innerText = data.documents;
    document.getElementById('statNotices').innerText = data.notices;

    if (data.profile) {
      document.getElementById('sidebarName').innerText = data.profile.name;
      document.getElementById('sidebarProgram').innerText = `${data.profile.program} · ${data.profile.semester}`;
      const initials = data.profile.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
      document.getElementById('sidebarAvatar').innerText = initials;
      document.getElementById('topbarAvatar').innerText = initials;
      document.getElementById('memAvatar').innerText = initials;
    }
  } catch (err) {
    console.error('Dashboard load failed:', err);
  }
}

async function loadConversations() {
  const stream = document.getElementById('chatStream');
  stream.innerHTML = '';
  try {
    const res = await fetch('/api/assistant/conversations');
    const msgs = await res.json();
    msgs.forEach(m => appendChatMessage(m.role, m.content, m.citations, m.toolsUsed));
  } catch (err) {
    console.error(err);
  }
}

async function loadDocuments() {
  const container = document.getElementById('documentsList');
  container.innerHTML = '<p style="color:var(--ink-soft);">Loading knowledge sources...</p>';
  try {
    const res = await fetch('/api/assistant/documents');
    const docs = await res.json();
    container.innerHTML = '';
    docs.forEach(doc => {
      const row = document.createElement('div');
      row.className = 'document-row';
      row.innerHTML = `
        <div class="document-type document-type-${doc.category.toLowerCase()}">
          <i data-lucide="file-text" style="width:18px; height:18px;"></i>
        </div>
        <div class="document-main">
          <strong>${escapeHtml(doc.name)}</strong>
          <span>${escapeHtml(doc.category)} · added ${new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="document-stats">
          <span>${doc.wordCount} words</span>
          <span>${doc.chunkCount} sections</span>
        </div>
        <button type="button" class="ghost-icon" onclick="deleteDocument(${doc.id})">
          <i data-lucide="trash-2" style="width:15px; height:15px;"></i>
        </button>
      `;
      container.appendChild(row);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<p style="color:var(--coral);">Failed to load documents: ${err.message}</p>`;
  }
}

window.deleteDocument = async (id) => {
  if (!confirm('Remove this document from knowledge base?')) return;
  await fetch(`/api/assistant/documents/${id}`, { method: 'DELETE' });
  loadDocuments();
  loadDashboard();
};

let cachedToolsData = null;

async function loadTools(activeTool = 'timetable') {
  document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tool') === activeTool);
  });

  if (!cachedToolsData) {
    const [ttRes, attRes, exRes, notRes, faqRes] = await Promise.all([
      fetch('/api/assistant/tools/timetable'),
      fetch('/api/assistant/tools/attendance'),
      fetch('/api/assistant/tools/exams'),
      fetch('/api/assistant/tools/notices'),
      fetch('/api/assistant/tools/faqs')
    ]);
    cachedToolsData = {
      timetable: await ttRes.json(),
      attendance: await attRes.json(),
      exams: await exRes.json(),
      notices: await notRes.json(),
      faqs: await faqRes.json()
    };
  }
  renderToolView(activeTool);
}

function renderToolView(toolType) {
  const container = document.getElementById('toolViewContainer');
  const data = cachedToolsData ? cachedToolsData[toolType] : [];

  if (toolType === 'timetable') {
    container.innerHTML = `
      <div class="timetable-grid">
        ${data.map(item => `
          <div class="class-card">
            <span class="class-day">${item.day}</span>
            <strong style="display:block; margin:6px 0; font-size:12px; font-family:var(--font-mono); color:var(--ink-soft);">${item.time}</strong>
            <h3>${item.course}</h3>
            <span>${item.room} · ${item.instructor}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (toolType === 'attendance') {
    container.innerHTML = `
      <div>
        ${data.map(item => `
          <div class="attendance-row">
            <div style="min-width:180px;">
              <strong>${item.course}</strong>
              <span style="display:block; margin-top:2px; font-size:11px; color:var(--ink-soft); font-family:var(--font-mono);">${item.attended} / ${item.total} sessions</span>
            </div>
            <div class="attendance-meter"><span style="width:${item.percentage}%"></span></div>
            <strong class="attendance-percent ${item.status.toLowerCase().replace(' ', '-')}">${item.percentage}%</strong>
          </div>
        `).join('')}
      </div>
    `;
  } else if (toolType === 'exams') {
    container.innerHTML = `
      <div>
        ${data.map(item => `
          <div class="exam-row">
            <div style="min-width:110px;">
              <span class="eyebrow">${item.type}</span>
              <strong style="display:block; margin-top:2px;">${item.date}</strong>
            </div>
            <div style="flex:1;">
              <h3 style="font-size:16px;">${item.course}</h3>
              <span style="font-size:11px; color:var(--ink-soft);">${item.time} · ${item.venue}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (toolType === 'notices') {
    container.innerHTML = `
      <div>
        ${data.map(item => `
          <div class="notice-row">
            <div style="flex:1;">
              <span class="eyebrow" style="color:var(--sage);">${item.category} · ${item.date}</span>
              <h3 style="font-size:16px; margin:4px 0;">${item.title}</h3>
              <p style="font-size:12px; color:var(--ink-soft);">${item.summary}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (toolType === 'faqs') {
    container.innerHTML = `
      <div>
        ${data.map(item => `
          <div class="surface-card" style="margin-bottom:10px; padding:16px;">
            <strong style="display:block; font-size:14px; margin-bottom:6px;">${item.question}</strong>
            <p style="font-size:12px; color:var(--ink-soft); line-height:1.6;">${item.answer}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
}

async function loadMemory() {
  const res = await fetch('/api/assistant/profile');
  const p = await res.json();

  document.getElementById('memName').textContent = p.name;
  document.getElementById('memProgram').textContent = `${p.program} · ${p.semester}`;
  document.getElementById('memEmail').textContent = p.email;

  document.getElementById('editName').value = p.name;
  document.getElementById('editEmail').value = p.email;
  document.getElementById('editGoals').value = (p.goals || []).join(', ');
  document.getElementById('editPrefs').value = (p.preferences || []).join(', ');

  const goalsContainer = document.getElementById('memGoals');
  goalsContainer.innerHTML = (p.goals || []).map(g => `<span class="soft-chip">${escapeHtml(g)}</span>`).join('');

  const prefsContainer = document.getElementById('memPreferences');
  prefsContainer.innerHTML = (p.preferences || []).map(pr => `<span class="soft-chip">${escapeHtml(pr)}</span>`).join('');
}

async function loadHistory() {
  const container = document.getElementById('historyList');
  container.innerHTML = '<p style="color:var(--ink-soft);">Loading history...</p>';
  try {
    const res = await fetch('/api/assistant/conversations');
    const msgs = await res.json();
    container.innerHTML = '';
    msgs.forEach(m => {
      const isAssistant = m.role === 'assistant';
      const row = document.createElement('div');
      row.className = 'document-row';
      row.innerHTML = `
        <div class="document-type ${isAssistant ? 'document-type-syllabus' : 'document-type-regulations'}">
          <i data-lucide="${isAssistant ? 'sparkles' : 'user'}" style="width:18px; height:18px;"></i>
        </div>
        <div class="document-main">
          <strong>${isAssistant ? 'Solace Response' : 'Student Query'}</strong>
          <p style="font-size:12px; color:var(--ink-soft); margin-top:4px;">${escapeHtml(m.content)}</p>
        </div>
        <span style="font-family:var(--font-mono); font-size:10px; color:var(--ink-soft);">
          ${new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      `;
      container.appendChild(row);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<p style="color:var(--coral);">Failed to load history: ${err.message}</p>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
