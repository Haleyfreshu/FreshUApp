import Stripe from "stripe";

let _stripe;

// Lazily constructed so the module can be imported at build time even
// before STRIPE_SECRET_KEY is configured.
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  }
  return _stripe;
}
