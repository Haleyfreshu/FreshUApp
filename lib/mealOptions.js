// Applies selected options on top of a meal's base price/macros. Price
// stacks additively from every selected option (a variant can still cost
// extra on top of the base price), but macros work differently: an
// option's calories/protein/carbs/fat are the meal's actual totals when
// that option is picked, not an amount added to the base — so the first
// selected option carrying macro values replaces the base macros
// entirely rather than adding to them.
export function applyOptionsToMeal(meal, selectedOptions) {
  const priceDelta = selectedOptions.reduce((sum, o) => sum + Number(o.price_delta || 0), 0);
  const override = selectedOptions.find(o => o.calories != null);
  return {
    price: Number(meal.price) + priceDelta,
    calories: override ? Number(override.calories) : Number(meal.calories),
    protein: override ? Number(override.protein) : Number(meal.protein),
    carbs: override ? Number(override.carbs) : Number(meal.carbs),
    fat: override ? Number(override.fat) : Number(meal.fat),
  };
}

export function optionsLabel(selectedOptions) {
  return selectedOptions.map(o => o.label).join(", ");
}

// Human-readable summary of one option's full macro profile — what the
// meal's totals become if it's picked, e.g. "650 cal · 55g P · 40g C · 18g F".
export function optionMacroSummary(option) {
  if (option.calories == null) return "";
  return [
    `${option.calories} cal`,
    `${option.protein}g P`,
    `${option.carbs}g C`,
    `${option.fat}g F`,
  ].join(" · ");
}
