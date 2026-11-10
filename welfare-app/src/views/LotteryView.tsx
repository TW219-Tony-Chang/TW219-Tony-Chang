import { useEffect, useMemo, useRef, useState } from "react";
import { eligibleTeams, oddsFor, totalWeight } from "../lib/lottery";
import { useSession } from "../store";

const ITEM_H = 56;

export function LotteryView() {
  const teams = useSession((s) => s.teams);
  const runLottery = useSession((s) => s.runLottery);
  const commitLottery = useSession((s) => s.commitLottery);

  const pool = useMemo(() => eligibleTeams(teams), [teams]);
  const total = useMemo(() => totalWeight(teams), [teams]);
  const stripRef = useRef<HTMLDivElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sequence = useMemo(() => {
    const names = pool.length ? pool.map((t) => t.name) : ["—"];
    const seq: string[] = [];
    for (let i = 0; i < 18; i++) seq.push(...names);
    return seq;
  }, [pool]);

  useEffect(() => {
    if (stripRef.current && !spinning) {
      stripRef.current.style.transform = "translateY(0)";
    }
  }, [sequence, spinning]);

  async function onDraw() {
    if (spinning || total <= 0) return;
    setError(null);
    setSpinning(true);
    setHighlight(null);

    const res = runLottery();
    if (!res.ok) {
      setSpinning(false);
      setError(res.error);
      return;
    }

    const winner = teams.find((t) => t.id === res.teamId);
    const name = winner?.name ?? "";
    const el = stripRef.current;

    if (el) {
      el.style.transform = "translateY(0)";
      void el.offsetWidth;

      let targetIndex = -1;
      for (let i = sequence.length - 1; i >= Math.floor(sequence.length * 0.55); i--) {
        if (sequence[i] === name) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex < 0) targetIndex = sequence.length - 1;
      const offset = targetIndex * ITEM_H - ITEM_H;
      el.style.transform = `translateY(-${offset}px)`;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      await new Promise((r) => setTimeout(r, reduced ? 50 : 2900));
      setHighlight(name);
    }

    setSpinning(false);
    commitLottery(res.teamId, res.odds);
  }

  return (
    <section className="view">
      <h1>加權抽籤</h1>
      <p className="lede">
        Step 2：無人報名時，依各 Team 工程師人數加權抽一個 Team，再由主管／TL 推派（Step 3）。
      </p>

      <div className="grid-2">
        <div>
          <div className={`reel ${spinning ? "spinning" : ""} ${highlight ? "done" : ""}`}>
            <div className="reel-window">
              <div className="reel-strip" ref={stripRef}>
                {sequence.map((n, i) => (
                  <div
                    key={`${n}-${i}`}
                    className={`reel-item ${highlight === n ? "active" : ""}`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={spinning || total <= 0}
              onClick={onDraw}
            >
              {spinning ? "抽籤中…" : "開始抽籤"}
            </button>
          </div>
          {error && <p className="flash error">{error}</p>}
          <p className="muted">合計權重 {total} · crypto.getRandomValues</p>
        </div>

        <div>
          <ul className="list odds">
            {pool.map((t) => {
              const pct = oddsFor(t, teams);
              return (
                <li key={t.id}>
                  <span>{t.name}</span>
                  <div className="bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="pct">{pct.toFixed(1)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
