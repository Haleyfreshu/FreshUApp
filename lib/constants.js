// Numeric targets for each goal are computed per-athlete (sex, age,
// height, weight, sport) by lib/nutritionCalc.js — this just supplies
// the goal names/descriptions shown as choices, and the keys must match
// GOAL_MACRO_TARGETS in that file.
export const GOAL_PRESETS = {
  "Build Muscle & Strength": "Higher protein and calories to add size and power.",
  "Lean Performance": "Balanced fueling to perform and stay lean.",
  "Endurance Fuel": "Higher carbs to sustain long training sessions.",
  "Recovery & Maintenance": "Maintain current weight and recover between sessions.",
};

export const SPORTS = ["Football", "Basketball", "Soccer", "Track & Field", "Swimming", "Volleyball", "Lacrosse", "Wrestling", "Baseball/Softball", "Rowing", "Other"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SLOT_ORDER = ["Breakfast", "Lunch", "Pre-Practice Fuel", "Post-Practice Recovery", "Dinner", "Evening Snack"];

export const STAFF_STORAGE_BUCKET = "meal-photos";
