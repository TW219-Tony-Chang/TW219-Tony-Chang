import { useSession } from "../store";

export function SetupView() {
  const title = useSession((s) => s.title);
  const year = useSession((s) => s.year);
  const registerDays = useSession((s) => s.registerDays);
  const teams = useSession((s) => s.teams);
  const setMeta = useSession((s) => s.setMeta);
  const setTeams = useSession((s) => s.setTeams);
  const openRegister = useSession((s) => s.openRegister);

  return (
    <section className="view">
      <h1>本屆設定</h1>
      <p className="lede">先設標題、報名天數與各 Team 人數（抽籤權重）。</p>

      <div className="grid-2">
        <div className="stack">
          <label className="field">
            遴選標題
            <input
              value={title}
              onChange={(e) => setMeta({ title: e.target.value })}
            />
          </label>
          <label className="field">
            年度
            <input
              type="number"
              value={year}
              onChange={(e) => setMeta({ year: Number(e.target.value) || year })}
            />
          </label>
          <label className="field">
            報名天數（辦法：5 日）
            <input
              type="number"
              min={1}
              value={registerDays}
              onChange={(e) =>
                setMeta({ registerDays: Math.max(1, Number(e.target.value) || 5) })
              }
            />
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={openRegister}>
              開放報名
            </button>
          </div>
        </div>

        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            Team 人數＝工程師（含）以上，作為 Step 2 抽籤權重
          </p>
          {teams.map((team, i) => (
            <div className="team-row" key={team.id}>
              <input
                value={team.name}
                aria-label={`Team ${i + 1} 名稱`}
                onChange={(e) => {
                  const next = teams.map((t) =>
                    t.id === team.id ? { ...t, name: e.target.value } : t,
                  );
                  setTeams(next);
                }}
              />
              <input
                type="number"
                min={0}
                value={team.count}
                aria-label={`${team.name} 人數`}
                onChange={(e) => {
                  const next = teams.map((t) =>
                    t.id === team.id
                      ? { ...t, count: Math.max(0, Math.floor(Number(e.target.value) || 0)) }
                      : t,
                  );
                  setTeams(next);
                }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                disabled={teams.length <= 1}
                onClick={() => setTeams(teams.filter((t) => t.id !== team.id))}
              >
                移除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setTeams([
                ...teams,
                { id: crypto.randomUUID(), name: `Team ${teams.length + 1}`, count: 1 },
              ])
            }
          >
            新增 Team
          </button>
        </div>
      </div>
    </section>
  );
}
