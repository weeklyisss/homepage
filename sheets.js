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
// 시트 컬럼: week, date, type, presenter, initials, title, slides, youtube
function groupSessions(rows) {
  const map = {};
  rows.forEach(r => {
    if (r.type.toLowerCase() === 'ideation') return; // ideation 비공개
    const key = r.week;
    if (!map[key]) {
      map[key] = { week: Number(r.week), date: r.date, type: r.type.toLowerCase(), talks: [] };
    }
    map[key].talks.push({
      presenter: r.presenter,
      initials:  r.initials,
      title:     r.title,
      slides:    r.slides  || null,
      youtube:   r.youtube || null,
    });
  });
  return Object.values(map).sort((a, b) => b.week - a.week);
}

// ── Fallback data (로컬 file:// 환경 또는 Sheets 미설정 시 사용) ──
const FALLBACK_SESSIONS = [
  {
    week: 1, date: "Mar 09, 2026", type: "open",
    talks: [
      {
        presenter: "Edgar Gwon", initials: "EG",
        title:     "Lessons from PhD Application",
        slides:    "https://drive.google.com/file/d/1BpzP9sKq9i4CY5KXvoPHTVQEeGB-f2mL/view?usp=sharing",
        youtube:   "https://www.youtube.com/watch?v=UHxpi1OIW78"
      },
      {
        presenter: "Sue Lee", initials: "SL",
        title:     "How I use Claude",
        slides:    null,
        youtube:   null
      },
      {
        presenter: "Jane Shin", initials: "JS",
        title:     "TBD",
        slides:    null,
        youtube:   null
      },
    ]
  }
];

const FALLBACK_MEMBERS = [
  { initials: "SL", name: "Suhyeon (Sue) Lee",       role: "1st year PhD Student", affil: "KAIST",                      color: "c1", website: "", scholar: "" },
  { initials: "EG", name: "Myeongseok (Edgar) Gwon", role: "1st year PhD Student", affil: "University of Minnesota",    color: "c2", website: "", scholar: "" },
  { initials: "JS", name: "Jane Shin",                role: "1st year PhD Student", affil: "Carnegie Mellon University", color: "c3", website: "", scholar: "" },
];

async function fetchSessions() {
  // file:// 환경이거나 SHEET_ID 미설정이면 fallback 사용
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

// 공통 에러 배너
function showError(container, msg) {
  container.innerHTML = `
    <div style="padding:2rem;font-size:0.85rem;color:#888;text-align:center;">
      ${msg}
    </div>`;
}
