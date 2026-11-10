const DEFAULT_TEAMS = [
  { id: crypto.randomUUID(), name: "Edward", count: 8 },
  { id: crypto.randomUUID(), name: "David", count: 8 },
  { id: crypto.randomUUID(), name: "Brian", count: 8 },
  { id: crypto.randomUUID(), name: "Roland", count: 8 },
  { id: crypto.randomUUID(), name: "Tony", count: 8 },
];

const STORAGE_KEY = "welfare-lottery-teams-v1";

/** @typedef {{ id: string, name: string, count: number }} Team */

/** @type {Team[]} */
let teams = loadTeams();
/** @type {{ team: string, at: string, odds: number }[]} */
let history = [];
let spinning = false;

const teamsList = document.getElementById("teamsList");
const oddsList = document.getElementById("oddsList");
const totalCount = document.getElementById("totalCount");
const drawBtn = document.getElementById("drawBtn");
const scrollTeamsBtn = document.getElementById("scrollTeamsBtn");
const addTeamBtn = document.getElementById("addTeamBtn");
const resetTeamsBtn = document.getElementById("resetTeamsBtn");
const resultSection = document.getElementById("resultSection");
const resultTeam = document.getElementById("resultTeam");
const resultDetail = document.getElementById("resultDetail");
const resultCard = document.getElementById("resultCard");
const historyList = document.getElementById("historyList");
const reel = document.getElementById("heroReel");
const reelStrip = document.getElementById("reelStrip");

function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefaults();
    return parsed.map((t) => ({
      id: String(t.id || crypto.randomUUID()),
      name: String(t.name || "Team"),
      count: Math.max(0, Number(t.count) || 0),
    }));
  } catch {
    return cloneDefaults();
  }
}

function cloneDefaults() {
  return DEFAULT_TEAMS.map((t) => ({ ...t, id: crypto.randomUUID() }));
}

function saveTeams() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

function eligibleTeams() {
  return teams.filter((t) => t.name.trim() && t.count > 0);
}

function totalWeight() {
  return eligibleTeams().reduce((sum, t) => sum + t.count, 0);
}

/** crypto-secure float in [0, 1) */
function secureRandom() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/**
 * Weighted pick by headcount.
 * @param {Team[]} pool
 */
function pickWeighted(pool) {
  const total = pool.reduce((s, t) => s + t.count, 0);
  if (total <= 0) return null;
  let r = secureRandom() * total;
  for (const team of pool) {
    r -= team.count;
    if (r < 0) return team;
  }
  return pool[pool.length - 1];
}

function renderTeams() {
  teamsList.replaceChildren();
  teams.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = "team-row";
    row.style.animationDelay = `${index * 40}ms`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = team.name;
    nameInput.setAttribute("aria-label", `Team ${index + 1} 名稱`);
    nameInput.addEventListener("input", () => {
      team.name = nameInput.value;
      saveTeams();
      renderOdds();
      buildReel();
    });

    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = "0";
    countInput.step = "1";
    countInput.value = String(team.count);
    countInput.setAttribute("aria-label", `${team.name || "Team"} 人數`);
    countInput.addEventListener("input", () => {
      team.count = Math.max(0, Math.floor(Number(countInput.value) || 0));
      saveTeams();
      renderOdds();
      buildReel();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove";
    removeBtn.textContent = "移除";
    removeBtn.disabled = teams.length <= 1;
    removeBtn.addEventListener("click", () => {
      if (teams.length <= 1) return;
      teams = teams.filter((t) => t.id !== team.id);
      saveTeams();
      renderTeams();
      renderOdds();
      buildReel();
    });

    row.append(nameInput, countInput, removeBtn);
    teamsList.append(row);
  });
}

function renderOdds() {
  const pool = eligibleTeams();
  const total = totalWeight();
  oddsList.replaceChildren();

  if (total === 0) {
    totalCount.textContent = "有效人數合計 0 — 無法抽籤";
    drawBtn.disabled = true;
    return;
  }

  drawBtn.disabled = spinning;
  totalCount.textContent = `有效工程師（含）以上合計 ${total} 人 · ${pool.length} 個 Team`;

  pool.forEach((team) => {
    const pct = (team.count / total) * 100;
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = team.name;
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("span");
    bar.append(fill);
    const pctEl = document.createElement("span");
    pctEl.className = "pct";
    pctEl.textContent = `${pct.toFixed(1)}%`;
    li.append(name, bar, pctEl);
    oddsList.append(li);
    requestAnimationFrame(() => {
      fill.style.width = `${pct}%`;
    });
  });
}

function buildReel(highlightName = null) {
  const pool = eligibleTeams();
  const names = pool.length ? pool.map((t) => t.name) : ["—"];
  // Enough copies for a long spin feel
  const sequence = [];
  for (let i = 0; i < 18; i++) {
    sequence.push(...names);
  }
  reelStrip.replaceChildren();
  sequence.forEach((name) => {
    const item = document.createElement("div");
    item.className = "reel-item";
    if (highlightName && name === highlightName) item.classList.add("active");
    item.textContent = name;
    reelStrip.append(item);
  });
  reelStrip.style.transform = "translateY(0)";
}

function showResult(team, total) {
  const odds = (team.count / total) * 100;
  resultSection.hidden = false;
  resultTeam.textContent = team.name;
  resultDetail.textContent = `權重 ${team.count} / ${total}（約 ${odds.toFixed(1)}%）`;
  resultCard.style.animation = "none";
  void resultCard.offsetWidth;
  resultCard.style.animation = "";

  const now = new Date();
  const stamp = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  history.unshift({ team: team.name, at: stamp, odds });
  history = history.slice(0, 8);
  historyList.replaceChildren();
  history.forEach((h) => {
    const li = document.createElement("li");
    const left = document.createElement("span");
    left.textContent = `${h.team}（${h.odds.toFixed(1)}%）`;
    const right = document.createElement("span");
    right.textContent = `${h.at} Asia/Taipei`;
    li.append(left, right);
    historyList.append(li);
  });

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function runDraw() {
  const pool = eligibleTeams();
  const total = totalWeight();
  if (!pool.length || total <= 0 || spinning) return;

  spinning = true;
  drawBtn.disabled = true;
  reel.classList.remove("done");
  reel.classList.add("spinning");

  const winner = pickWeighted(pool);
  if (!winner) {
    spinning = false;
    drawBtn.disabled = false;
    return;
  }

  buildReel();
  const items = [...reelStrip.children];
  const itemHeight = 56;
  // Land near the end of the strip on a matching name
  let targetIndex = -1;
  for (let i = items.length - 1; i >= Math.floor(items.length * 0.55); i--) {
    if (items[i].textContent === winner.name) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex < 0) targetIndex = items.length - 1;

  // Center the selected item in the 168px window (3 slots; middle = offset 56)
  const offset = targetIndex * itemHeight - itemHeight;
  void reelStrip.offsetWidth;
  reelStrip.style.transform = `translateY(-${offset}px)`;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waitMs = reduced ? 50 : 2900;

  await new Promise((resolve) => setTimeout(resolve, waitMs));

  items.forEach((el) => el.classList.toggle("active", el.textContent === winner.name));
  reel.classList.remove("spinning");
  reel.classList.add("done");
  showResult(winner, total);

  spinning = false;
  drawBtn.disabled = false;
}

drawBtn.addEventListener("click", () => {
  runDraw();
});

scrollTeamsBtn.addEventListener("click", () => {
  document.getElementById("teamsSection").scrollIntoView({ behavior: "smooth" });
});

addTeamBtn.addEventListener("click", () => {
  teams.push({ id: crypto.randomUUID(), name: `Team ${teams.length + 1}`, count: 1 });
  saveTeams();
  renderTeams();
  renderOdds();
  buildReel();
});

resetTeamsBtn.addEventListener("click", () => {
  teams = cloneDefaults();
  saveTeams();
  renderTeams();
  renderOdds();
  buildReel();
});

renderTeams();
renderOdds();
buildReel();
