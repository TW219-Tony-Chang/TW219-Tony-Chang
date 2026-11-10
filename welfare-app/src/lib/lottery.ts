import type { Team } from "../types";

/** crypto-secure float in [0, 1) */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

export function eligibleTeams(teams: Team[]): Team[] {
  return teams.filter((t) => t.name.trim() && t.count > 0);
}

export function totalWeight(teams: Team[]): number {
  return eligibleTeams(teams).reduce((sum, t) => sum + t.count, 0);
}

export function pickWeighted(teams: Team[]): Team | null {
  const pool = eligibleTeams(teams);
  const total = pool.reduce((s, t) => s + t.count, 0);
  if (!pool.length || total <= 0) return null;
  let r = secureRandom() * total;
  for (const team of pool) {
    r -= team.count;
    if (r < 0) return team;
  }
  return pool[pool.length - 1] ?? null;
}

export function oddsFor(team: Team, teams: Team[]): number {
  const total = totalWeight(teams);
  if (total <= 0) return 0;
  return (team.count / total) * 100;
}
