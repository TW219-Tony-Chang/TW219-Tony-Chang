export function nowIso(): string {
  return new Date().toISOString();
}

export function formatTaipei(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function registerDeadlineIso(openedAt: string, days: number): string {
  const d = new Date(openedAt);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function isPastDeadline(openedAt: string | null, days: number): boolean {
  if (!openedAt) return false;
  return Date.now() >= new Date(registerDeadlineIso(openedAt, days)).getTime();
}
