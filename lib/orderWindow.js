// FreshU runs two independent weekly delivery cycles, each with its own
// meal list and its own ordering window:
//   - "monday"   menu: order Sun-Wed, delivered the following Monday
//   - "thursday" menu: order Wed-Sun, delivered that Thursday
// Both windows are computed in a fixed timezone (not the visitor's device
// timezone, and not raw server UTC) so day boundaries land at actual
// midnight for the team, regardless of where the app is deployed.
export const ORDER_TIMEZONE = "America/New_York";

// deliveryWeekday uses JS's Date#getUTCDay() numbering: Sun=0 .. Sat=6.
export const MENUS = {
  monday: { label: "Monday Delivery", deliveryWeekday: 1, openDays: ["Sun", "Mon", "Tue", "Wed"] },
  thursday: { label: "Thursday Delivery", deliveryWeekday: 4, openDays: ["Wed", "Thu", "Fri", "Sat", "Sun"] },
};
export const MENU_KEYS = Object.keys(MENUS);

export function currentDayAbbrev(date = new Date(), timeZone = ORDER_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
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

function mostRecentWeekdayOnOrBefore(weekday, date) {
  const todayStr = civilDateStr(date);
  const dow = new Date(`${todayStr}T00:00:00Z`).getUTCDay();
  const diff = (dow - weekday + 7) % 7;
  return addCivilDays(todayStr, -diff);
}

export function isOrderingOpenFor(menuKey, date = new Date()) {
  return MENUS[menuKey].openDays.includes(currentDayAbbrev(date));
}

// The 7-day window (delivery day .. 6 days later) whose food is currently
// in the athlete's fridge for this menu.
export function activeConsumptionWeekFor(menuKey, date = new Date()) {
  const start = mostRecentWeekdayOnOrBefore(MENUS[menuKey].deliveryWeekday, date);
  return { start, end: addCivilDays(start, 6) };
}

// The order window (civil-date range, inclusive) that feeds the
// consumption week containing `date` for this menu — i.e. an order placed
// in this range is what should appear in Quick Log all week.
export function activeOrderWindowFor(menuKey, date = new Date()) {
  const { openDays } = MENUS[menuKey];
  const { start: consumptionStart } = activeConsumptionWeekFor(menuKey, date);
  const start = addCivilDays(consumptionStart, -8);
  return { start, end: addCivilDays(start, openDays.length - 1) };
}
