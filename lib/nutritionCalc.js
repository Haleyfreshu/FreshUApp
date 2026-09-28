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
// day. Carb need is what actually swings with training/competition
// demand, so it's given separately for a normal training day vs. a game
// day (roughly 3-5 g/kg on a training day vs. 6-10 g/kg on a
// competition day, per standard sports-nutrition carb loading ranges).
export const GOAL_MACRO_TARGETS = {
  "Build Muscle & Strength": { proteinPerKg: 2.0, carbsPerKgTraining: 4.5, carbsPerKgGame: 6.5 },
  "Lean Performance": { proteinPerKg: 1.8, carbsPerKgTraining: 4.0, carbsPerKgGame: 6.0 },
  "Endurance Fuel": { proteinPerKg: 1.6, carbsPerKgTraining: 5.5, carbsPerKgGame: 8.0 },
  "Recovery & Maintenance": { proteinPerKg: 1.6, carbsPerKgTraining: 3.5, carbsPerKgGame: 5.0 },
};

const LB_TO_KG = 0.453592;
const IN_TO_CM = 2.54;

// dayType: "training" (default) or "game" — pass "game" to get the
// carb-boosted target for a day the athlete has tagged as a competition.
export function calculateNutritionGoals({ sex, age, heightIn, weightLb, sport, goal, dayType = "training" }) {
  if (!sex || !age || !heightIn || !weightLb) return null;

  const weightKg = weightLb * LB_TO_KG;
  const heightCm = heightIn * IN_TO_CM;
  const bmr = sex === "female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

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
