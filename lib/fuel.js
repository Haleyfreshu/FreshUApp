export const BUDDY_STATES = {
  under: { label: "Under Fueled", color: "#8C93B8", glow: "rgba(140,147,184,0.25)", mouth: "M 34 62 Q 50 52 66 62", msg: "Your tank's running low. Grab something now to get moving." },
  needs: { label: "Needs Fuel", color: "#FFB648", glow: "rgba(255,182,72,0.35)", mouth: "M 34 60 Q 50 60 66 60", msg: "You're getting there — one more solid meal puts you back on track." },
  ready: { label: "Ready", color: "#33D3A3", glow: "rgba(51,211,163,0.4)", mouth: "M 34 56 Q 50 68 66 56", msg: "Nice work — you're fueled up and ready to train." },
  game: { label: "Game Ready", color: "#2A3EFF", glow: "rgba(42,62,255,0.45)", mouth: "M 32 54 Q 50 72 68 54", msg: "Fully fueled. You're built for today. Go get it." },
};

export function fuelState(score) {
  if (score >= 95) return "game";
  if (score >= 70) return "ready";
  if (score >= 40) return "needs";
  return "under";
}

// expectedFraction (0-1) is how much of the day's targets should
// realistically be eaten by this point in the day — pass it for "today,
// right now" so a good breakfast at 8am reads as fully fueled instead of
// "under" just because breakfast alone can't hit 100% of the whole day's
// numbers. Leave it at the default (1, the whole day) for a day that's
// already over, like in Fuel History, where comparing to the full target
// is exactly right.
export function computeFuelScore(totals, profile, expectedFraction = 1) {
  if (expectedFraction <= 0) return 100; // before today's first meal window — nothing expected yet
  const pc = Math.min(100, (totals.calories / (profile.calorie_goal * expectedFraction)) * 100 || 0);
  const pp = Math.min(100, (totals.protein / (profile.protein_goal * expectedFraction)) * 100 || 0);
  const pcarb = Math.min(100, (totals.carbs / (profile.carb_goal * expectedFraction)) * 100 || 0);
  const pf = Math.min(100, (totals.fat / (profile.fat_goal * expectedFraction)) * 100 || 0);
  return Math.round(pc * 0.25 + pp * 0.35 + pcarb * 0.2 + pf * 0.2);
}
