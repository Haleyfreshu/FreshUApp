// Athletes can only build/submit a weekly order Sunday through Wednesday,
// and the meals from that order are what should show up in Quick Log for
// the following Monday-Sunday consumption week. All of this is computed
// in a fixed timezone (not the visitor's device timezone, and not raw
// server UTC) so day boundaries land at actual midnight for the team,
// regardless of where the app is deployed.
export const ORDER_TIMEZONE = "America/New_York";
export const ORDER_OPEN_DAYS = ["Sun", "Mon", "Tue", "Wed"];

export function currentDayAbbrev(date = new Date(), timeZone = ORDER_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
}

export function isOrderingOpen(date = new Date()) {
  return ORDER_OPEN_DAYS.includes(currentDayAbbrev(date));
}

// "YYYY-MM-DD" for the given instant, as seen in timeZone — the athletes'
// actual calendar date, not the server's raw UTC date.
export function civilDateStr(date = new Date(), timeZone = ORDER_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// Pure calendar-date arithmetic on a "YYYY-MM-DD" string — safe because
// it never touches a real timezone offset, just civil-date bookkeeping.
function addCivilDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Monday..Sunday civil-date range (inclusive) of the consumption week
// containing `date`.
export function activeConsumptionWeekDates(date = new Date()) {
  const todayStr = civilDateStr(date);
  const dow = new Date(`${todayStr}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = addCivilDays(todayStr, diffToMonday);
  const sunday = addCivilDays(monday, 6);
  return { start: monday, end: sunday };
}

// Sunday..Wednesday civil-date range (inclusive) of the order window that
// feeds the consumption week containing `date` — i.e. an order placed in
// this range is what should appear in Quick Log all week.
export function activeOrderWindowDates(date = new Date()) {
  const { start: monday } = activeConsumptionWeekDates(date);
  return { start: addCivilDays(monday, -8), end: addCivilDays(monday, -5) };
}
