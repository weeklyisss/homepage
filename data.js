// ============================================================
//  Weekly ISSS — Config
//  Google Sheets CSV URL만 여기서 관리합니다.
// ============================================================

const CONFIG = {
  // Google Sheets → 파일 → 공유 → "링크가 있는 모든 사용자" 설정 후
  // 아래 URL에서 SHEET_ID 부분을 본인 시트 ID로 교체하세요.
  // 시트 ID는 sheets.google.com/d/[여기]/edit 에서 확인할 수 있어요.
  SESSIONS_URL: "https://docs.google.com/spreadsheets/d/1ChEqnXFiOLagsisJjXSud7FybiLpJ0hgSddZWfNTPSM/gviz/tq?tqx=out:csv&sheet=Sessions",
  MEMBERS_URL:  "https://docs.google.com/spreadsheets/d/1ChEqnXFiOLagsisJjXSud7FybiLpJ0hgSddZWfNTPSM/gviz/tq?tqx=out:csv&sheet=Members",
};

const TYPE_META = {
  open:     { label: "Open Session", cls: "tag-open" },
  paper:    { label: "Paper Review", cls: "tag-paper" },
  ideation: { label: "Ideation",     cls: "tag-ideation" },
};
