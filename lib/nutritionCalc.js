// Personalized daily targets, built the way a sports dietitian actually
// sets them: BMR (Mifflin-St Jeor, which needs sex because the formula's
// constant term differs for men and women) scaled by a sport-specific
// training-load factor for total calories, then protein and carbs set
// per kilogram of bodyweight (so two athletes of very different sizes on
// the same sport/goal still land on different gram targets) with fat
// filling whatever's left of the calorie budget.

export const SPORT_ACTIVITY_FACTORS = {
  "Football": 1.9,
  "Basketball": 1.85,
  "Soccer": 1.9,
  "Track & Field": 1.8,
  "Swimming": 1.9,
  "Volleyball": 1.75,
  "Lacrosse": 1.85,
  "Wrestling": 1.8,
  "Baseball/Softball": 1.6,
  "Rowing": 1.95,
  "Other": 1.75,
};

// Protein need tracks the goal, not the day — it doesn't spike on game
// day. Ranges follow the ISSN 2017 position stand: 1.4-2.0 g/kg/day
// covers muscle maintenance/gain for most exercising individuals, so
// 2.0 is used only for the muscle-building goal (the higher 2.3-3.1
// g/kg range in that same position stand is reserved for athletes
// actively cutting calories, which this app doesn't program for).
//
// Carb need is what actually swings with training/competition demand.
// ACSM's nutrition-and-athletic-performance guidance puts moderate
// training (~1h/day) at 5-7 g/kg/day and moderate-high intensity
// training (1-3h/day, i.e. most team-sport practice/game loads) at
// 6-10 g/kg/day — carbsPerKgTraining/carbsPerKgGame below sit inside
// that bracket, with game day pushed toward the top of it to match the
// higher intensity of actual competition.
export const GOAL_MACRO_TARGETS = {
  "Build Muscle & Strength": { proteinPerKg: 2.0, carbsPerKgTraining: 5.0, carbsPerKgGame: 7.0 },
  "Lean Performance": { proteinPerKg: 1.8, carbsPerKgTraining: 5.0, carbsPerKgGame: 7.0 },
  "Endurance Fuel": { proteinPerKg: 1.6, carbsPerKgTraining: 6.5, carbsPerKgGame: 9.0 },
  "Recovery & Maintenance": { proteinPerKg: 1.6, carbsPerKgTraining: 4.0, carbsPerKgGame: 5.5 },
};

// Weight-class sports carry their own safe-fueling considerations (making
// weight the wrong way — chronic under-eating — is a well-documented risk
// specific to these sports) so the UI shows an extra note for them rather
// than silently applying the same guardrail as every other sport.
export const WEIGHT_CLASS_SPORTS = ["Wrestling"];

const LB_TO_KG = 0.453592;
const IN_TO_CM = 2.54;

export function calculateBMR({ sex, age, heightIn, weightLb }) {
  if (!sex || !age || !heightIn || !weightLb) return null;
  const weightKg = weightLb * LB_TO_KG;
  const heightCm = heightIn * IN_TO_CM;
  const bmr = sex === "female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr);
}

// The floor no athlete's calorie target should ever be edited below —
// resting metabolic need itself. Going under this isn't a "aggressive
// cut", it's a starting point for RED-S / low energy availability, so
// the app treats it as a hard minimum rather than a suggestion.
export function safeCalorieFloor(stats) {
  return calculateBMR(stats);
}

// dayType: "training" (default) or "game" — pass "game" to get the
// carb-boosted target for a day the athlete has tagged as a competition.
export function calculateNutritionGoals({ sex, age, heightIn, weightLb, sport, goal, dayType = "training" }) {
  const bmr = calculateBMR({ sex, age, heightIn, weightLb });
  if (bmr === null) return null;
  const weightKg = weightLb * LB_TO_KG;

  const activityFactor = SPORT_ACTIVITY_FACTORS[sport] || SPORT_ACTIVITY_FACTORS.Other;
  const tdee = bmr * activityFactor;

  const targets = GOAL_MACRO_TARGETS[goal] || GOAL_MACRO_TARGETS["Lean Performance"];
  const proteinG = Math.round(targets.proteinPerKg * weightKg);
  const carbsPerKg = dayType === "game" ? targets.carbsPerKgGame : targets.carbsPerKgTraining;
  const carbsG = Math.round(carbsPerKg * weightKg);

  const proteinCals = proteinG * 4;
  const carbCals = carbsG * 4;
  const minFatG = Math.round(0.5 * weightKg);
  const fatG = Math.max(Math.round((tdee - proteinCals - carbCals) / 9), minFatG);

  return {
    calories: proteinCals + carbCals + fatG * 9,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
  };
}

// Fluid target in fl oz/day: a bodyweight-based baseline (the common
// sports-dietitian rule of thumb of ~0.5-0.6 oz per lb) plus sweat-loss
// replacement for the day's training, scaled by the same sport activity
// factor used for calories so a higher-intensity sport (or a game, which
// runs hotter and harder than a practice) gets a bigger fluid target —
// following ACSM guidance to individualize fluid needs by sport/intensity
// rather than a flat "8 glasses a day" number.
export function calculateHydrationTarget({ weightLb, sport, dayType = "training" }) {
  if (!weightLb) return null;
  const baseline = weightLb * 0.6;
  const activityFactor = SPORT_ACTIVITY_FACTORS[sport] || SPORT_ACTIVITY_FACTORS.Other;
  const trainingLoss = 16 * activityFactor;
  const gameLoss = 20 * activityFactor;
  const sweatLoss = dayType === "game" ? gameLoss : trainingLoss;
  return Math.round(baseline + sweatLoss);
}
