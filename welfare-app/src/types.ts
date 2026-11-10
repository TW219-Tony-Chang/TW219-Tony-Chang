export type Phase = "setup" | "register" | "decide" | "vote" | "lottery" | "result";

export type Team = {
  id: string;
  name: string;
  count: number;
};

export type Candidate = {
  id: string;
  name: string;
  teamId: string;
  email: string;
  note: string;
  registeredAt: string;
};

export type Ballot = {
  voterId: string;
  candidateId: string;
  at: string;
};

export type Outcome =
  | {
      kind: "volunteer-vote";
      candidateId: string;
      votes: number;
      at: string;
    }
  | {
      kind: "manager-pick";
      candidateId: string;
      at: string;
    }
  | {
      kind: "lottery-team";
      teamId: string;
      odds: number;
      at: string;
    };

export type Session = {
  title: string;
  year: number;
  registerDays: number;
  registerOpenedAt: string | null;
  registerClosed: boolean;
  teams: Team[];
  candidates: Candidate[];
  ballots: Ballot[];
  phase: Phase;
  outcome: Outcome | null;
  lotteryHistory: { teamId: string; odds: number; at: string }[];
};
