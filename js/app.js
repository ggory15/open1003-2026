// 공통 유틸리티 + Supabase 클라이언트 초기화. 모든 페이지에서 config.js 다음에 로드합니다.
const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function weekInfo(n) {
  return CONFIG.WEEKS.find((w) => w.week === Number(n)) || null;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric", day: "numeric", weekday: "short",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}

// 이메일 인증 링크가 돌아올 주소 (GitHub Pages 하위 경로에서도 동작)
function siteBase() {
  return location.origin + location.pathname.replace(/[^/]*$/, "");
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session || null;
}

async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  return data || null;
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return false;
  const { data, error } = await sb.rpc("is_admin");
  return !error && data === true;
}

// 상단 내비게이션 렌더링
async function renderHeader(active) {
  const el = $("#site-header");
  if (!el) return;
  const session = await getSession();
  const admin = session ? await checkAdmin() : false;

  const link = (href, label, key) =>
    `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;

  let right = "";
  if (session) {
    const profile = await getProfile();
    const who = profile && profile.name
      ? `${esc(profile.name)} (${esc(profile.student_id)})`
      : esc(session.user.email);
    right = `<span class="who">${who}</span>
             <button class="btn btn-ghost btn-sm" id="btn-logout">로그아웃</button>`;
  } else {
    right = `<a class="btn btn-primary btn-sm" href="login.html">로그인</a>`;
  }

  el.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">
        <span class="brand-badge">${esc(CONFIG.COURSE_CODE)}</span>
        <span class="brand-name">${esc(CONFIG.COURSE_NAME)}</span>
      </a>
      <nav>
        ${link("index.html", "강의자료·제출", "home")}
        ${admin ? link("admin.html", "관리자", "admin") : ""}
      </nav>
      <div class="header-right">${right}</div>
    </div>`;

  const btn = $("#btn-logout");
  if (btn) btn.addEventListener("click", async () => {
    await sb.auth.signOut();
    location.href = "index.html";
  });
}

function toast(msg, kind = "info") {
  let box = $("#toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${kind}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
