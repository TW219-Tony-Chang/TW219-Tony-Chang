import { useMemo, useState } from "react";
import { useSession } from "../store";

export function VoteView() {
  const candidates = useSession((s) => s.candidates);
  const teams = useSession((s) => s.teams);
  const ballots = useSession((s) => s.ballots);
  const castVote = useSession((s) => s.castVote);
  const clearBallots = useSession((s) => s.clearBallots);
  const finalizeVote = useSession((s) => s.finalizeVote);
  const managerPick = useSession((s) => s.managerPick);
  const setPhase = useSession((s) => s.setPhase);

  const [voterId, setVoterId] = useState("");
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const tally = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of candidates) map.set(c.id, 0);
    for (const b of ballots) map.set(b.candidateId, (map.get(b.candidateId) ?? 0) + 1);
    return map;
  }, [ballots, candidates]);

  if (!candidates.length) {
    return (
      <section className="view">
        <h1>投票</h1>
        <p className="lede">目前沒有候選人。請回到報名，或改走抽籤。</p>
        <div className="btn-row">
          <button type="button" className="btn btn-sea" onClick={() => setPhase("lottery")}>
            改走加權抽籤
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPhase("register")}>
            回報名
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="view">
      <h1>投票／主管擇一</h1>
      <p className="lede">
        有自願者時：同仁投票選出福代，或由部門主管直接指定（對應辦法 Step 1）。
      </p>

      <div className="grid-2">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const res = castVote(voterId, candidateId);
            if (!res.ok) {
              setMsg({ ok: false, text: res.error });
              return;
            }
            setVoterId("");
            setMsg({ ok: true, text: "投票成功" });
          }}
        >
          <label className="field">
            工號／識別碼（防重複投票）
            <input
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              placeholder="例如 TW219"
              required
            />
          </label>

          <div className="candidate-pick">
            {candidates.map((c) => {
              const team = teams.find((t) => t.id === c.teamId)?.name ?? "—";
              return (
                <label key={c.id}>
                  <input
                    type="radio"
                    name="candidate"
                    checked={candidateId === c.id}
                    onChange={() => setCandidateId(c.id)}
                  />
                  <span>
                    <strong>{c.name}</strong>
                    <div className="meta">
                      {team}
                      {c.email ? ` · ${c.email}` : ""}
                    </div>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary">
              投下此票
            </button>
            <button
              type="button"
              className="btn btn-sea"
              onClick={() => {
                const res = finalizeVote();
                if (!res.ok) setMsg({ ok: false, text: res.error });
                else setMsg({ ok: true, text: "已依得票數產生結果" });
              }}
            >
              依票數結算
            </button>
          </div>
          {msg && <p className={`flash ${msg.ok ? "" : "error"}`}>{msg.text}</p>}
        </form>

        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            目前 {ballots.length} 票
          </p>
          <ul className="list">
            {candidates.map((c) => (
              <li key={c.id}>
                <span>
                  <strong>{c.name}</strong>
                  <div className="meta">
                    {teams.find((t) => t.id === c.teamId)?.name}
                  </div>
                </span>
                <strong>{tally.get(c.id) ?? 0} 票</strong>
              </li>
            ))}
          </ul>

          <p className="muted">主管指定（不經投票）：</p>
          <div className="btn-row">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                className="btn btn-ghost"
                onClick={() => managerPick(c.id)}
              >
                指定 {c.name}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-danger" onClick={clearBallots}>
            清空選票
          </button>
        </div>
      </div>
    </section>
  );
}
