/**
 * All money and credit rules live here. Change a number here and it changes
 * everywhere. Prices are decided on the server, never taken from the browser.
 */

export type CreditPackage = {
  id: string;
  label: string;
  credits: number;
  priceNaira: number;
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter", credits: 500, priceNaira: 500 },
  { id: "basic", label: "Basic", credits: 1500, priceNaira: 1000 },
  { id: "popular", label: "Popular", credits: 3500, priceNaira: 2000 },
  { id: "value", label: "Value", credits: 8000, priceNaira: 4000 },
  { id: "professional", label: "Professional", credits: 25000, priceNaira: 10000 },
];

export const SIGNUP_BONUS_CREDITS = 500; // one free unlock for new seekers

// What it costs a seeker to unlock the full view + contact the lister.
export const UNLOCK_COST = { RENT: 500, SALE: 500 } as const;

// What it costs to ask an agent to take you to the property.
export const ESCORT_COST = 2000; // placeholder: set the real fee (escorts are off while there are no agents)

// Revenue split on credits spent: lister gets OWNER_SHARE, platform keeps the rest.
export const OWNER_SHARE = 0.4; // lister 40%, bedlisting 60%

// Sending a roommate request (placeholder: set the real fee). Returned if declined, cancelled or ignored.
export const ROOMMATE_CONNECT_COST = 300;
export const ROOMMATE_REQUEST_EXPIRES_HOURS = 72;
export const ROOMMATE_REQUESTS_PER_DAY = 10;

// Boosting a listing (spent from the lister's own bedcoins; platform keeps 100%).
export const BOOST_OPTIONS = [
  { days: 3, cost: 1000 },
  { days: 7, cost: 2000 },
  { days: 14, cost: 4000 },
] as const;

export const EARNING_HOLD_DAYS = 7;       // earnings wait this long before withdrawal
export const MIN_PAYOUT_NAIRA = 2000;     // smallest cash-out

export const toKobo = (naira: number) => Math.round(naira * 100);
export const toNaira = (kobo: number) => kobo / 100;

export function getPackage(id: string) {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

/**
 * A bedcoin is worth only a few kobo, so the per-coin value is stored multiplied
 * by COIN_VALUE_SCALE (hundredths of a kobo). This keeps lister earnings exact
 * instead of losing money to rounding.
 */
export const COIN_VALUE_SCALE = 100;

/**
 * Lister's earning (kobo): OWNER_SHARE of the money the buyer actually paid
 * for the paid credits they spent. bedlisting keeps the rest.
 * `coinValueScaled` is kobo per bedcoin x COIN_VALUE_SCALE.
 */
export function earningKobo(paidCreditsSpent: number, coinValueScaled: number) {
  return Math.round((paidCreditsSpent * coinValueScaled * OWNER_SHARE) / COIN_VALUE_SCALE);
}
