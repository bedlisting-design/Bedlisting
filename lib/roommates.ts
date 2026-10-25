/**
 * Roommate matching. Pure functions (no database), so the rules are easy to test and change.
 *
 * Two HARD rules decide whether two people can be matched at all:
 *   1. gender preference: someone who chose "same gender only" is never shown to anyone else
 *   2. smoking: a smoker is never matched with someone who is not fine sharing with a smoker
 * Everything else only changes the score (0 to 100).
 */

export type MatchProfile = {
  mode: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  genderPref: "ANY" | "SAME";
  area: string;
  budgetMin: number;
  budgetMax: number;
  moveDate: Date | null;
  sleep: "EARLY" | "NIGHT" | "FLEXIBLE";
  cleanliness: number;
  smokes: boolean;
  smokingOk: boolean;
  visitors: "RARELY" | "SOMETIMES" | "OFTEN";
};

export const MODE_LABEL: Record<string, string> = {
  NEED_ROOM: "Looking for a place",
  HAVE_ROOM: "Has a place to share",
};
export const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
export const SLEEP_LABEL: Record<string, string> = { EARLY: "Early to bed", NIGHT: "Night owl", FLEXIBLE: "Flexible" };
export const VISITORS_LABEL: Record<string, string> = { RARELY: "Rarely has visitors", SOMETIMES: "Sometimes has visitors", OFTEN: "Often has visitors" };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function genderAllows(a: MatchProfile, b: MatchProfile) {
  return a.genderPref === "ANY" || a.gender === b.gender;
}

export function canMatch(a: MatchProfile, b: MatchProfile) {
  if (!genderAllows(a, b) || !genderAllows(b, a)) return false;
  if ((a.smokes && !b.smokingOk) || (b.smokes && !a.smokingOk)) return false;
  return true;
}

export function compatibility(a: MatchProfile, b: MatchProfile): { ok: boolean; score: number; reasons: string[] } {
  if (!canMatch(a, b)) return { ok: false, score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  // Area (30)
  const aa = norm(a.area), ba = norm(b.area);
  if (aa === ba) { score += 30; reasons.push("Same area"); }
  else if (aa && ba && (aa.includes(ba) || ba.includes(aa))) { score += 20; reasons.push("Nearby area"); }

  // Budget (25): overlapping ranges are best; a small gap earns a little
  const overlap = Math.min(a.budgetMax, b.budgetMax) - Math.max(a.budgetMin, b.budgetMin);
  if (overlap >= 0) { score += 25; reasons.push("Budgets overlap"); }
  else {
    const gap = -overlap;
    if (gap <= 0.2 * Math.max(a.budgetMax, b.budgetMax)) { score += 10; reasons.push("Budgets are close"); }
  }

  // Move-in date (15)
  if (a.moveDate && b.moveDate) {
    const days = Math.abs(a.moveDate.getTime() - b.moveDate.getTime()) / 86_400_000;
    if (days <= 30) { score += 15; reasons.push("Similar move-in date"); }
    else if (days <= 60) score += 8;
  } else score += 7;

  // Sleep (10)
  if (a.sleep === b.sleep) { score += 10; reasons.push("Same sleep schedule"); }
  else if (a.sleep === "FLEXIBLE" || b.sleep === "FLEXIBLE") score += 7;

  // Tidiness (10)
  const tidy = Math.abs(a.cleanliness - b.cleanliness);
  if (tidy <= 1) { score += 10; reasons.push("Similar tidiness"); }
  else if (tidy === 2) score += 5;

  // Visitors (10)
  const order = ["RARELY", "SOMETIMES", "OFTEN"];
  const gap = Math.abs(order.indexOf(a.visitors) - order.indexOf(b.visitors));
  if (gap === 0) { score += 10; reasons.push("Same attitude to visitors"); }
  else if (gap === 1) score += 5;

  return { ok: true, score: Math.min(100, score), reasons };
}
