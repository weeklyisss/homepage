// ============================================================
//  Weekly ISSS — Google Sheets CSV parser
//  모든 페이지에서 공통으로 사용
// ============================================================

// CSV 한 줄을 배열로 파싱 (큰따옴표 안의 콤마 처리 포함)
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  result.push(cur.trim());
  return result;
}

// CSV 텍스트 → [{header: value, ...}, ...] 객체 배열
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

// Sessions CSV → 페이지에서 쓰기 좋은 구조로 변환
// ideation 타입은 공개하지 않음
// 시트 컬럼: week, date, type, presenter, initials, title, slides, youtube, screenshot
function groupSessions(rows) {
  const map = {};
  rows.forEach(r => {
    if (r.type.toLowerCase() === 'ideation') return;
    const key = r.week;
    if (!map[key]) {
      map[key] = { week: Number(r.week), date: r.date, type: r.type.toLowerCase(), talks: [] };
    }
    map[key].talks.push({
      presenter:  r.presenter,
      initials:   r.initials,
      title:      r.title,
      slides:     r.slides     || null,
      youtube:    r.youtube    || null,
      screenshot: r.screenshot || null,
    });
  });
  return Object.values(map).sort((a, b) => b.week - a.week);
}

// ── Fallback data ──
const FALLBACK_SESSIONS = [
  {
    week: 4, date: "Apr 03, 2026", type: "paper",
    talks: [
      {
        presenter: "Edgar Gwon", initials: "EG",
        title: "Li, Huang, Wang, Jiang, & Luo (2026). Exploring Online Help-Seeking Tendencies: The Influence of Experience Type and Help Provider Type. MIS Quarterly, 50(1), 327–350.",
        slides: null, youtube: null, screenshot: null,
      },
      {
        presenter: "Sue Lee", initials: "SL",
        title: "Wang, Su, Gao, & Agarwal (2026). The Role of the User Information Environment in mHealth Effectiveness. Information Systems Research.",
        slides: null, youtube: null, screenshot: null,
      },
      {
        presenter: "Jane Shin", initials: "JS",
        title: "Wei & Malik (2025). Unstructured data, econometric models, and estimation bias. USC Marshall School of Business Research Paper Sponsored by iORB.",
        slides: null, youtube: null, screenshot: null,
      },
    ]
  },
  {
    week: 3, date: "Mar 25, 2026", type: "open",
    talks: [
      { presenter: "Edgar Gwon", initials: "EG", title: "How to manage Research Notes", slides: null, youtube: null, screenshot: null },
      { presenter: "Sue Lee", initials: "SL", title: "AI Safety", slides: null, youtube: null, screenshot: null },
      { presenter: "Jane Shin", initials: "JS", title: "AI Regulation", slides: null, youtube: null, screenshot: null },
    ]
  },
  {
    week: 2, date: "Mar 16, 2026", type: "paper",
    talks: [
      {
        presenter: "Edgar Gwon", initials: "EG",
        title: "Fügener, Walzner, & Gupta (2026). Roles of artificial intelligence in collaboration with humans: Automation, augmentation, and the future of work. Management Science, 72(1), 538–557.",
        slides: null, youtube: null, screenshot: null,
      },
      {
        presenter: "Sue Lee", initials: "SL",
        title: "AI Labeling Disclosure (working paper, anonymous)",
        slides: null, youtube: null, screenshot: null,
      },
      {
        presenter: "Jane Shin", initials: "JS",
        title: "Shan & Qiu (2026). Balancing Acts: Unveiling the Dynamics of Post Removal on Social Media User-Generated Content. Information Systems Research.",
        slides: null, youtube: null, screenshot: null,
      },
    ]
  },
  {
    week: 1, date: "Mar 09, 2026", type: "open",
    talks: [
      {
        presenter: "Edgar Gwon", initials: "EG",
        title: "Lessons from PhD Application",
        slides: "https://drive.google.com/file/d/1BpzP9sKq9i4CY5KXvoPHTVQEeGB-f2mL/view?usp=sharing",
        youtube: null, screenshot: null,
      },
      { presenter: "Sue Lee", initials: "SL", title: "New research idea — Agentic commerce", slides: null, youtube: null, screenshot: null },
      { presenter: "Jane Shin", initials: "JS", title: "PhD Application Tips", slides: null, youtube: null, screenshot: null },
    ]
  }
];

const FALLBACK_MEMBERS = [
  { initials: "SL", name: "Suhyeon (Sue) Lee",       role: "1st year PhD Student", affil: "KAIST",                      color: "c1", website: "", scholar: "" },
  { initials: "EG", name: "Myeongseok (Edgar) Gwon", role: "1st year PhD Student", affil: "University of Minnesota",    color: "c2", website: "", scholar: "" },
  { initials: "JS", name: "Jane Shin",                role: "1st year PhD Student", affil: "Carnegie Mellon University", color: "c3", website: "", scholar: "" },
];

async function fetchSessions() {
  if (location.protocol === 'file:' || CONFIG.SESSIONS_URL.includes('SHEET_ID')) {
    return FALLBACK_SESSIONS;
  }
  try {
    const res  = await fetch(CONFIG.SESSIONS_URL);
    const text = await res.text();
    return groupSessions(parseCSV(text));
  } catch(e) {
    return FALLBACK_SESSIONS;
  }
}

async function fetchMembers() {
  if (location.protocol === 'file:' || CONFIG.MEMBERS_URL.includes('SHEET_ID')) {
    return FALLBACK_MEMBERS;
  }
  try {
    const res  = await fetch(CONFIG.MEMBERS_URL);
    const text = await res.text();
    return parseCSV(text);
  } catch(e) {
    return FALLBACK_MEMBERS;
  }
}

function showError(container, msg) {
  container.innerHTML = `<div style="padding:2rem;font-size:0.85rem;color:#888;text-align:center;">${msg}</div>`;
}

// ── Slides password protection ──
const SLIDES_PASSWORD = "1234";

function handleSlidesClick(url, event) {
  if (event) event.preventDefault();
  const modal = document.getElementById('slides-modal');
  const input = document.getElementById('slides-pw');
  const err   = document.getElementById('slides-err');
  if (!modal) return;
  input.value = '';
  err.style.display = 'none';
  modal.dataset.url = url;
  modal.style.display = 'flex';
  setTimeout(() => input.focus(), 100);
}

function closeSlidesModal() {
  const modal = document.getElementById('slides-modal');
  if (modal) modal.style.display = 'none';
}

function submitSlidesPassword() {
  const modal = document.getElementById('slides-modal');
  const input = document.getElementById('slides-pw');
  const err   = document.getElementById('slides-err');
  if (input.value === SLIDES_PASSWORD) {
    window.open(modal.dataset.url, '_blank');
    closeSlidesModal();
  } else {
    err.style.display = 'block';
    input.value = '';
    input.focus();
  }
}

function injectSlidesModal() {
  if (document.getElementById('slides-modal')) return;
  const div = document.createElement('div');
  div.innerHTML = `
    <div id="slides-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);align-items:center;justify-content:center" onclick="if(event.target===this)closeSlidesModal()">
      <div style="background:#fff;border-radius:4px;padding:2rem;width:340px;max-width:90vw;box-shadow:0 8px 30px rgba(0,0,0,.18)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.3rem">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><path d="M8 1C5.79 1 4 2.79 4 5v2H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V5c0-2.21-1.79-4-4-4zm0 1.5A2.5 2.5 0 0110.5 5v2h-5V5A2.5 2.5 0 018 2.5zM8 10a1.25 1.25 0 110 2.5A1.25 1.25 0 018 10z" fill="#8a0019"/></svg>
          <h3 style="font-size:0.95rem;font-weight:600">Slides Access</h3>
        </div>
        <p style="font-size:0.78rem;color:#888;margin-bottom:1.2rem">Enter the password to view slides.</p>
        <input id="slides-pw" type="password" placeholder="Password" autocomplete="off"
          style="width:100%;padding:0.55rem 0.75rem;font-size:0.85rem;border:1px solid #e4e0e1;border-radius:2px;outline:none;font-family:inherit"
          onkeydown="if(event.key==='Enter')submitSlidesPassword()"/>
        <p id="slides-err" style="display:none;font-size:0.72rem;color:#c0392b;margin-top:0.4rem">Incorrect password. Try again.</p>
        <div style="display:flex;gap:0.5rem;margin-top:1rem;justify-content:flex-end">
          <button onclick="closeSlidesModal()" style="padding:0.45rem 1rem;font-size:0.8rem;border:1px solid #e4e0e1;background:#fff;border-radius:2px;cursor:pointer;font-family:inherit;color:#444">Cancel</button>
          <button onclick="submitSlidesPassword()" style="padding:0.45rem 1rem;font-size:0.8rem;border:1px solid #8a0019;background:#8a0019;color:#fff;border-radius:2px;cursor:pointer;font-family:inherit">Open</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(div);
}
