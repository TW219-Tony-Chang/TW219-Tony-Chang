import { useRef } from "react";
import type { Phase, Session } from "./types";
import { useSession } from "./store";
import { SetupView } from "./views/SetupView";
import { RegisterView } from "./views/RegisterView";
import { VoteView } from "./views/VoteView";
import { LotteryView } from "./views/LotteryView";
import { ResultView } from "./views/ResultView";

const PHASES: { id: Phase; label: string }[] = [
  { id: "setup", label: "設定" },
  { id: "register", label: "報名" },
  { id: "vote", label: "投票" },
  { id: "lottery", label: "抽籤" },
  { id: "result", label: "結果" },
];

const ORDER: Phase[] = ["setup", "register", "vote", "lottery", "result"];

export default function App() {
  const phase = useSession((s) => s.phase);
  const setPhase = useSession((s) => s.setPhase);
  const resetAll = useSession((s) => s.resetAll);
  const exportSession = useSession((s) => s.exportSession);
  const importSession = useSession((s) => s.importSession);
  const candidates = useSession((s) => s.candidates);
  const outcome = useSession((s) => s.outcome);
  const fileRef = useRef<HTMLInputElement>(null);

  function phaseDone(id: Phase): boolean {
    const cur = ORDER.indexOf(phase);
    const i = ORDER.indexOf(id);
    if (id === "result") return !!outcome;
    if (id === "vote") return candidates.length > 0 && (phase === "result" || !!outcome);
    return i < cur;
  }

  function download() {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `welfare-select-${data.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="atmosphere" aria-hidden />
      <div className="app-shell">
        <header className="topbar">
          <p className="brand">
            福代遴選
            <span>投票 · 主管指定 · 加權抽籤</span>
          </p>
          <div className="top-actions">
            <button type="button" className="btn btn-ghost" onClick={download}>
              匯出 JSON
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileRef.current?.click()}
            >
              匯入
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text) as Session;
                  if (!data.teams || !data.phase) throw new Error("格式不對");
                  importSession(data);
                } catch {
                  alert("匯入失敗：JSON 無效");
                }
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm("確定清空本屆資料？")) resetAll();
              }}
            >
              重置
            </button>
          </div>
        </header>

        <nav className="phase-nav" aria-label="流程">
          {PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${phase === p.id ? "active" : ""} ${phaseDone(p.id) ? "done" : ""}`}
              onClick={() => setPhase(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>

        {phase === "setup" && <SetupView />}
        {phase === "register" && <RegisterView />}
        {(phase === "vote" || phase === "decide") && <VoteView />}
        {phase === "lottery" && <LotteryView />}
        {phase === "result" && <ResultView />}

        <section className="rules">
          <h2>遴選辦法（Draft）</h2>
          <ol>
            <li>福代原則上以工程師（含）以上擔任，每年一任。</li>
            <li>若跨部門福委由本部門出任，福代兼任福委。</li>
            <li>
              Step 1 報名 → 投票／主管擇一；無人則 Step 2 依 Team 人數加權抽籤；Step 3
              中籤 Team 由主管／TL 推派。
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}
