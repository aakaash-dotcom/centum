/**
 * Central application configuration flags.
 */

// Money mode: when true, NO currency amount is rendered anywhere in the app,
// paywalls direct to early-bird waitlist, and discount math is shown as % only.
export const COMING_SOON = true;

// PYQ beta gate: when true (default ON), papers/PYQ pages show GateSheet / waitlist signup CTA.
// Set NEXT_PUBLIC_PYQ_BETA_GATE=false or PYQ_BETA_GATE=false to disable.
export const PYQ_BETA_GATE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PYQ_BETA_GATE !== undefined
    ? process.env.NEXT_PUBLIC_PYQ_BETA_GATE !== 'false'
    : (typeof process !== 'undefined' && process.env.PYQ_BETA_GATE !== undefined
        ? process.env.PYQ_BETA_GATE !== 'false'
        : true);

