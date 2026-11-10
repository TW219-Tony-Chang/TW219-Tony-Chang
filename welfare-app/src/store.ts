import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pickWeighted, oddsFor } from "./lib/lottery";
import { nowIso } from "./lib/time";
import type { Ballot, Candidate, Outcome, Phase, Session, Team } from "./types";

function uid(): string {
  return crypto.randomUUID();
}

function defaultTeams(): Team[] {
  return ["Edward", "David", "Brian", "Roland", "Tony"].map((name) => ({
    id: uid(),
    name,
    count: 8,
  }));
}

function blankSession(): Session {
  const year = new Date().getFullYear();
  return {
    title: `${year} 福代／福委遴選`,
    year,
    registerDays: 5,
    registerOpenedAt: null,
    registerClosed: false,
    teams: defaultTeams(),
    candidates: [],
    ballots: [],
    phase: "setup",
    outcome: null,
    lotteryHistory: [],
  };
}

type Actions = {
  resetAll: () => void;
  setMeta: (patch: Partial<Pick<Session, "title" | "year" | "registerDays">>) => void;
  setTeams: (teams: Team[]) => void;
  setPhase: (phase: Phase) => void;
  openRegister: () => void;
  closeRegister: () => void;
  addCandidate: (input: Omit<Candidate, "id" | "registeredAt">) => { ok: true } | { ok: false; error: string };
  removeCandidate: (id: string) => void;
  castVote: (voterId: string, candidateId: string) => { ok: true } | { ok: false; error: string };
  clearBallots: () => void;
  managerPick: (candidateId: string) => void;
  finalizeVote: () => { ok: true } | { ok: false; error: string };
  runLottery: () =>
    | { ok: true; teamId: string; odds: number }
    | { ok: false; error: string };
  commitLottery: (teamId: string, odds: number) => void;
  importSession: (data: Session) => void;
  exportSession: () => Session;
};

export const useSession = create<Session & Actions>()(
  persist(
    (set, get) => ({
      ...blankSession(),

      resetAll: () => set({ ...blankSession(), teams: defaultTeams() }),

      setMeta: (patch) => set(patch),

      setTeams: (teams) => set({ teams }),

      setPhase: (phase) => set({ phase }),

      openRegister: () =>
        set({
          phase: "register",
          registerOpenedAt: get().registerOpenedAt ?? nowIso(),
          registerClosed: false,
          outcome: null,
        }),

      closeRegister: () => {
        const { candidates } = get();
        set({
          registerClosed: true,
          phase: candidates.length > 0 ? "vote" : "lottery",
        });
      },

      addCandidate: (input) => {
        const name = input.name.trim();
        const email = input.email.trim();
        if (!name) return { ok: false, error: "請填姓名" };
        if (!input.teamId) return { ok: false, error: "請選 Team" };
        const { candidates, registerClosed, phase } = get();
        if (registerClosed || (phase !== "register" && phase !== "setup")) {
          return { ok: false, error: "報名已關閉" };
        }
        if (candidates.some((c) => c.email && email && c.email.toLowerCase() === email.toLowerCase())) {
          return { ok: false, error: "此 email 已報名" };
        }
        const next: Candidate = {
          id: uid(),
          name,
          teamId: input.teamId,
          email,
          note: input.note.trim(),
          registeredAt: nowIso(),
        };
        set({ candidates: [...candidates, next], phase: "register" });
        return { ok: true };
      },

      removeCandidate: (id) =>
        set({ candidates: get().candidates.filter((c) => c.id !== id) }),

      castVote: (voterId, candidateId) => {
        const id = voterId.trim().toUpperCase();
        if (!id) return { ok: false, error: "請填工號／識別碼" };
        const { phase, candidates, ballots, registerClosed } = get();
        if (phase !== "vote" || !registerClosed) return { ok: false, error: "目前非投票階段" };
        if (!candidates.some((c) => c.id === candidateId)) {
          return { ok: false, error: "候選人不存在" };
        }
        if (ballots.some((b) => b.voterId === id)) {
          return { ok: false, error: "此識別碼已投過票" };
        }
        const ballot: Ballot = { voterId: id, candidateId, at: nowIso() };
        set({ ballots: [...ballots, ballot] });
        return { ok: true };
      },

      clearBallots: () => set({ ballots: [] }),

      managerPick: (candidateId) => {
        const { candidates } = get();
        if (!candidates.some((c) => c.id === candidateId)) return;
        const outcome: Outcome = {
          kind: "manager-pick",
          candidateId,
          at: nowIso(),
        };
        set({ outcome, phase: "result" });
      },

      finalizeVote: () => {
        const { ballots, candidates } = get();
        if (!candidates.length) return { ok: false, error: "沒有候選人" };
        if (!ballots.length) return { ok: false, error: "尚無選票" };

        const tally = new Map<string, number>();
        for (const b of ballots) {
          tally.set(b.candidateId, (tally.get(b.candidateId) ?? 0) + 1);
        }
        let bestId = candidates[0].id;
        let bestVotes = -1;
        let tie = false;
        for (const c of candidates) {
          const v = tally.get(c.id) ?? 0;
          if (v > bestVotes) {
            bestVotes = v;
            bestId = c.id;
            tie = false;
          } else if (v === bestVotes) {
            tie = true;
          }
        }
        if (tie) return { ok: false, error: "票數平手，請主管指定或繼續投票" };

        const outcome: Outcome = {
          kind: "volunteer-vote",
          candidateId: bestId,
          votes: bestVotes,
          at: nowIso(),
        };
        set({ outcome, phase: "result" });
        return { ok: true };
      },

      runLottery: () => {
        const { teams } = get();
        const winner = pickWeighted(teams);
        if (!winner) return { ok: false, error: "沒有有效 Team／人數" };
        return { ok: true, teamId: winner.id, odds: oddsFor(winner, teams) };
      },

      commitLottery: (teamId, odds) => {
        const at = nowIso();
        const outcome: Outcome = { kind: "lottery-team", teamId, odds, at };
        set({
          outcome,
          phase: "result",
          lotteryHistory: [{ teamId, odds, at }, ...get().lotteryHistory].slice(0, 10),
        });
      },

      importSession: (data) => set({ ...blankSession(), ...data }),

      exportSession: () => {
        const s = get();
        return {
          title: s.title,
          year: s.year,
          registerDays: s.registerDays,
          registerOpenedAt: s.registerOpenedAt,
          registerClosed: s.registerClosed,
          teams: s.teams,
          candidates: s.candidates,
          ballots: s.ballots,
          phase: s.phase,
          outcome: s.outcome,
          lotteryHistory: s.lotteryHistory,
        };
      },
    }),
    {
      name: "welfare-select-session-v1",
      partialize: (s) => ({
        title: s.title,
        year: s.year,
        registerDays: s.registerDays,
        registerOpenedAt: s.registerOpenedAt,
        registerClosed: s.registerClosed,
        teams: s.teams,
        candidates: s.candidates,
        ballots: s.ballots,
        phase: s.phase,
        outcome: s.outcome,
        lotteryHistory: s.lotteryHistory,
      }),
    },
  ),
);
