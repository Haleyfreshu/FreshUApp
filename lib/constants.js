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
// A meal's dietary_tags say what it safely satisfies; an athlete's
// dietary_restrictions say what they need — the menu only shows meals
// where every one of the athlete's restrictions is covered by the meal's tags.
export const DIETARY_TAGS = ["Gluten-Free", "Dairy-Free", "Vegetarian", "Vegan", "Nut-Free"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SLOT_ORDER = ["Breakfast", "Lunch", "Pre-Practice Fuel", "Post-Practice Recovery", "Dinner", "Evening Snack"];

export const STAFF_STORAGE_BUCKET = "meal-photos";
