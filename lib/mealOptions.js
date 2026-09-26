// Sums the price/macro deltas of a set of selected meal_options rows.
export function sumOptionDeltas(selectedOptions) {
  return selectedOptions.reduce((acc, o) => ({
    price: acc.price + Number(o.price_delta || 0),
    calories: acc.calories + Number(o.calories_delta || 0),
    protein: acc.protein + Number(o.protein_delta || 0),
    carbs: acc.carbs + Number(o.carbs_delta || 0),
    fat: acc.fat + Number(o.fat_delta || 0),
  }), { price: 0, calories: 0, protein: 0, carbs: 0, fat: 0 });
}

// Applies selected options on top of a meal's base price/macros.
export function applyOptionsToMeal(meal, selectedOptions) {
  const delta = sumOptionDeltas(selectedOptions);
  return {
    price: Number(meal.price) + delta.price,
    calories: Number(meal.calories) + delta.calories,
    protein: Number(meal.protein) + delta.protein,
    carbs: Number(meal.carbs) + delta.carbs,
    fat: Number(meal.fat) + delta.fat,
  };
}

export function optionsLabel(selectedOptions) {
  return selectedOptions.map(o => o.label).join(", ");
}

// Human-readable summary of one option's macro deltas, e.g.
// "+120 cal · +25g P · +5g C" — only nonzero fields are shown, in the
// same cal/P/C/F order used everywhere else in the app.
export function optionMacroSummary(option) {
  const parts = [];
  const push = (delta, suffix) => {
    const n = Number(delta || 0);
    if (n !== 0) parts.push(`${n > 0 ? "+" : ""}${n}${suffix}`);
  };
  push(option.calories_delta, " cal");
  push(option.protein_delta, "g P");
  push(option.carbs_delta, "g C");
  push(option.fat_delta, "g F");
  return parts.join(" · ");
}
