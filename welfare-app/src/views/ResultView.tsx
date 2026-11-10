import { formatTaipei } from "../lib/time";
import { useSession } from "../store";

export function ResultView() {
  const outcome = useSession((s) => s.outcome);
  const candidates = useSession((s) => s.candidates);
  const teams = useSession((s) => s.teams);
  const title = useSession((s) => s.title);
  const setPhase = useSession((s) => s.setPhase);

  if (!outcome) {
    return (
      <section className="view">
        <h1>結果</h1>
        <p className="lede">尚未產生結果。請先完成投票、主管指定或抽籤。</p>
        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={() => setPhase("vote")}>
            去投票
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPhase("lottery")}>
            去抽籤
          </button>
        </div>
      </section>
    );
  }

  let label = "";
  let value = "";
  let detail = "";

  if (outcome.kind === "volunteer-vote") {
    const c = candidates.find((x) => x.id === outcome.candidateId);
    const team = teams.find((t) => t.id === c?.teamId)?.name;
    label = "投票當選福代";
    value = c?.name ?? "—";
    detail = `${team ?? ""} · ${outcome.votes} 票 · ${formatTaipei(outcome.at)} Asia/Taipei`;
  } else if (outcome.kind === "manager-pick") {
    const c = candidates.find((x) => x.id === outcome.candidateId);
    const team = teams.find((t) => t.id === c?.teamId)?.name;
    label = "主管指定福代";
    value = c?.name ?? "—";
    detail = `${team ?? ""} · ${formatTaipei(outcome.at)} Asia/Taipei`;
  } else {
    const team = teams.find((t) => t.id === outcome.teamId);
    label = "抽籤中籤 Team";
    value = team?.name ?? "—";
    detail = `權重機率約 ${outcome.odds.toFixed(1)}% · 請單位主管及 Team leader 推派福代（Step 3） · ${formatTaipei(outcome.at)} Asia/Taipei`;
  }

  return (
    <section className="view">
      <h1>{title}</h1>
      <p className="lede">本屆遴選結果如下。</p>
      <div className="result-hero">
        <p className="label">{label}</p>
        <p className="value">{value}</p>
        <p className="detail">{detail}</p>
      </div>
    </section>
  );
}
