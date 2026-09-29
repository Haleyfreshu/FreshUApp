import { minutesOfDay } from "@/lib/format";

// Auto-places Breakfast/Lunch/Dinner/Evening Snack around today's training
// events using standard sports-nutrition timing (general performance
// guidance, not individualized/medical advice):
//   - a full pre-training meal sits ~3 hours before the session
//   - a full post-training meal follows ~90 min after (the immediate
//     30-45 min recovery snack is handled separately, see Pre-/Post- rows)
//   - meals stay at least ~3-4 hours apart so they don't stack
export const DEFAULT_MEAL_MINUTES = { Breakfast: 420, Lunch: 720, Dinner: 1140, "Evening Snack": 1260 };

const BANDS = {
  Breakfast: [300, 660],  // 5:00 AM - 11:00 AM
  Lunch: [660, 960],      // 11:00 AM - 4:00 PM
  Dinner: [960, 1260],    // 4:00 PM - 9:00 PM
};

function firstInBand(sortedMinutes, [start, end]) {
  return sortedMinutes.find(m => m >= start && m < end);
}

// How much of the day's macro targets each meal is expected to carry —
// used to figure out how much should realistically be eaten by *now*,
// not by the end of the day, so the Fuel Score reflects pace rather than
// penalizing someone for not having eaten dinner yet at breakfast time.
export const MEAL_MACRO_SHARE = { Breakfast: 0.25, Lunch: 0.3, Dinner: 0.35, "Evening Snack": 0.1 };

// Sums the shares of every meal whose scheduled time has already passed
// — e.g. right after breakfast, ~25% of the day's targets are "expected
// so far"; nothing eaten beyond that isn't behind pace yet.
export function expectedFractionByNow(mealMinutes, nowMinutes) {
  return Object.entries(mealMinutes).reduce(
    (sum, [slot, minutes]) => (nowMinutes >= minutes ? sum + (MEAL_MACRO_SHARE[slot] || 0) : sum),
    0
  );
}

// The most recent meal slot whose time has already arrived — the one
// driving an athlete's "behind pace" state right now, so the message can
// name it directly ("you're due for Lunch") instead of pointing at
// whatever's next on the schedule, which could be a meal away.
export function mostRecentMealSlot(mealMinutes, nowMinutes) {
  const passed = Object.entries(mealMinutes).filter(([, minutes]) => minutes <= nowMinutes);
  if (passed.length === 0) return null;
  return passed.sort((a, b) => b[1] - a[1])[0][0];
}

export function computeMealMinutes(todayEvents) {
  const eventMinutes = todayEvents.map(e => minutesOfDay(e.event_time)).sort((a, b) => a - b);

  let breakfast = DEFAULT_MEAL_MINUTES.Breakfast;
  const breakfastEvent = firstInBand(eventMinutes, BANDS.Breakfast);
  if (breakfastEvent !== undefined) breakfast = Math.max(300, breakfastEvent - 180);

  let lunch = DEFAULT_MEAL_MINUTES.Lunch;
  const lunchEvent = firstInBand(eventMinutes, BANDS.Lunch);
  if (lunchEvent !== undefined) lunch = Math.max(breakfast + 180, lunchEvent - 180);

  let dinner = DEFAULT_MEAL_MINUTES.Dinner;
  const dinnerEvent = firstInBand(eventMinutes, BANDS.Dinner);
  if (dinnerEvent !== undefined) dinner = Math.max(lunch + 240, Math.min(1320, dinnerEvent + 90));

  let snack = DEFAULT_MEAL_MINUTES["Evening Snack"];
  if (dinner + 120 > snack) snack = Math.min(1380, dinner + 120);

  return { Breakfast: breakfast, Lunch: lunch, Dinner: dinner, "Evening Snack": snack };
}
