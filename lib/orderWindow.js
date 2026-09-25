// FreshU runs two independent weekly delivery cycles, each with its own
// meal list and its own ordering window:
//   - "monday"   menu: order Sun-Wed (4 days), delivered the following Monday
//   - "thursday" menu: order Sun-Sun (8 days), delivered that cycle's Thursday
// Both windows are computed in a fixed timezone (not the visitor's device
// timezone, and not raw server UTC) so day boundaries land at actual
// midnight for the team, regardless of where the app is deployed.
//
// Each menu is defined by:
//   deliveryWeekday - which weekday delivery lands on (Date#getUTCDay(): Sun=0..Sat=6)
//   gapDays         - days between the window closing and delivery (e.g. window
//                      closes Wed, delivery is the following Monday = 5 days later)
//   windowLength    - how many days the order window stays open, ending gapDays
//                      before delivery. A window longer than 7 days (like
//                      Thursday's 8) overlaps its own next cycle by one day —
//                      that shared boundary day is real: it's simultaneously the
//                      last chance to order for the nearer delivery and the first
//                      day open for the one after.
export const ORDER_TIMEZONE = "America/New_York";

export const MENUS = {
  monday: { label: "Monday Delivery", deliveryWeekday: 1, gapDays: 5, windowLength: 4 },
  thursday: { label: "Thursday Delivery", deliveryWeekday: 4, gapDays: 4, windowLength: 8 },
};
export const MENU_KEYS = Object.keys(MENUS);

// A meal can be offered on either menu, both, or (transiently, while
// unassigned) neither — it's two independent flags, not a single choice.
export function mealIsOnMenu(meal, menuKey) {
  return menuKey === "monday" ? !!meal.on_monday_menu : !!meal.on_thursday_menu;
}

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

function nextWeekdayOnOrAfter(weekday, date) {
  const todayStr = civilDateStr(date);
  const dow = new Date(`${todayStr}T00:00:00Z`).getUTCDay();
  const diff = (weekday - dow + 7) % 7;
  return addCivilDays(todayStr, diff);
}

// The order window (civil-date range, inclusive) that a specific delivery
// date is fed by.
function orderWindowForDelivery(menuKey, deliveryDateStr) {
  const { gapDays, windowLength } = MENUS[menuKey];
  const end = addCivilDays(deliveryDateStr, -gapDays);
  const start = addCivilDays(end, -(windowLength - 1));
  return { start, end, delivery: deliveryDateStr };
}

// The 7-day window (delivery day .. 6 days later) whose food is currently
// in the athlete's fridge for this menu — the most recent delivery that
// has already happened.
export function activeConsumptionWeekFor(menuKey, date = new Date()) {
  const start = mostRecentWeekdayOnOrBefore(MENUS[menuKey].deliveryWeekday, date);
  return { start, end: addCivilDays(start, 6) };
}

// The order window that fed the consumption week containing `date` — i.e.
// an order placed in this range is what should appear in Quick Log all
// week (looking backward from today to the delivery that already arrived).
export function activeOrderWindowFor(menuKey, date = new Date()) {
  const { start: deliveryDate } = activeConsumptionWeekFor(menuKey, date);
  return orderWindowForDelivery(menuKey, deliveryDate);
}

// Which upcoming delivery "today" is currently ordering for (looking
// forward). Tries the nearest upcoming delivery date first; if that
// delivery's window has already closed, today belongs to the window for
// the delivery after it instead (relevant for windows that overlap their
// own next cycle, like Thursday's).
export function activeOrderCycleFor(menuKey, date = new Date()) {
  const today = civilDateStr(date);
  const nearestDelivery = nextWeekdayOnOrAfter(MENUS[menuKey].deliveryWeekday, date);
  const nearestWindow = orderWindowForDelivery(menuKey, nearestDelivery);
  if (today >= nearestWindow.start && today <= nearestWindow.end) return nearestWindow;
  return orderWindowForDelivery(menuKey, addCivilDays(nearestDelivery, 7));
}

export function isOrderingOpenFor(menuKey, date = new Date()) {
  const today = civilDateStr(date);
  const { start, end } = activeOrderCycleFor(menuKey, date);
  return today >= start && today <= end;
}
