// Athletes can only build/submit a weekly order Sunday through Wednesday.
// Day-of-week is computed in a fixed timezone (not the visitor's device
// timezone, and not raw server UTC) so the Wed->Thu cutoff lands at actual
// midnight for the team, regardless of where the app is deployed.
export const ORDER_TIMEZONE = "America/New_York";
export const ORDER_OPEN_DAYS = ["Sun", "Mon", "Tue", "Wed"];

export function currentDayAbbrev(date = new Date(), timeZone = ORDER_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
}

export function isOrderingOpen(date = new Date()) {
  return ORDER_OPEN_DAYS.includes(currentDayAbbrev(date));
}
