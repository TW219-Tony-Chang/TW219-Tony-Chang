import { useState } from "react";
import { formatTaipei, isPastDeadline, registerDeadlineIso } from "../lib/time";
import { useSession } from "../store";

export function RegisterView() {
  const teams = useSession((s) => s.teams);
  const candidates = useSession((s) => s.candidates);
  const registerDays = useSession((s) => s.registerDays);
  const registerOpenedAt = useSession((s) => s.registerOpenedAt);
  const registerClosed = useSession((s) => s.registerClosed);
  const addCandidate = useSession((s) => s.addCandidate);
  const removeCandidate = useSession((s) => s.removeCandidate);
  const openRegister = useSession((s) => s.openRegister);
  const closeRegister = useSession((s) => s.closeRegister);

  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const deadline = registerOpenedAt
    ? registerDeadlineIso(registerOpenedAt, registerDays)
    : null;
  const expired = isPastDeadline(registerOpenedAt, registerDays);
  const closed = registerClosed || expired;

  return (
    <section className="view">
      <h1>志願報名</h1>
      <p className="lede">
        Step 1：有意願同仁報名（email）。截止後有人 → 投票／主管擇一；無人 → 抽籤。
      </p>

      <div className="callout" style={{ marginBottom: "1.25rem" }}>
        {registerOpenedAt ? (
          <>
            報名開始：<strong>{formatTaipei(registerOpenedAt)} Asia/Taipei</strong>
            {deadline && (
              <>
                {" "}
                · 截止：<strong>{formatTaipei(deadline)} Asia/Taipei</strong>
              </>
            )}
            {closed && <> · <strong>已關閉</strong></>}
          </>
        ) : (
          <>尚未開放報名，請先到「設定」或按下方開放。</>
        )}
      </div>

      <div className="grid-2">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const res = addCandidate({ name, teamId, email, note });
            if (!res.ok) {
              setMsg({ ok: false, text: res.error });
              return;
            }
            setName("");
            setEmail("");
            setNote("");
            setMsg({ ok: true, text: "報名成功" });
          }}
        >
          <label className="field">
            姓名
            <input value={name} onChange={(e) => setName(e.target.value)} required disabled={closed} />
          </label>
          <label className="field">
            Team
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={closed}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={closed}
              placeholder="name@supermicro.com"
            />
          </label>
          <label className="field">
            備註（選填）
            <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={closed} />
          </label>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={closed || !registerOpenedAt}>
              送出報名
            </button>
            {!registerOpenedAt && (
              <button type="button" className="btn btn-sea" onClick={openRegister}>
                開放報名
              </button>
            )}
            {registerOpenedAt && !registerClosed && (
              <button type="button" className="btn btn-ghost" onClick={closeRegister}>
                關閉報名並進入下一步
              </button>
            )}
          </div>
          {msg && <p className={`flash ${msg.ok ? "" : "error"}`}>{msg.text}</p>}
        </form>

        <div>
          <p className="muted" style={{ marginTop: 0 }}>
            已報名 {candidates.length} 人
          </p>
          <ul className="list">
            {candidates.map((c) => {
              const team = teams.find((t) => t.id === c.teamId)?.name ?? "—";
              return (
                <li key={c.id}>
                  <div>
                    <strong>{c.name}</strong>
                    <div className="meta">
                      {team}
                      {c.email ? ` · ${c.email}` : ""}
                      <br />
                      {formatTaipei(c.registeredAt)} Asia/Taipei
                    </div>
                  </div>
                  {!registerClosed && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeCandidate(c.id)}
                    >
                      移除
                    </button>
                  )}
                </li>
              );
            })}
            {!candidates.length && <li className="muted">尚無報名</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
