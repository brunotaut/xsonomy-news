// Is this story about military / counter-UAV, or is it consumer and civil?
//
// xSonomy covers defence and counter-UAS. Drone-industry feeds carry a lot of
// adjacent civil material — camera launches, delivery pilots, eVTOL air-taxi
// funding — and a digest that leads with "GoPro sells itself" or "Amazon expands
// drone delivery" is not serving that audience.
//
// The DB's own classification can't do this job: 2,147 of 2,372 products have no
// `use_class`, and company_sectors covers under half the registry. Article tags
// are populated on everything, so scoring is done on tags plus title wording.
//
// Judged on the STORY, not the company. "FCC proposes banning DJI" and "Ukraine
// jams Russian Mavics" are counter-UAV stories even though DJI sells to
// consumers; "DJI unveils the Osmo 360 II" is not. A company blocklist would get
// all three wrong.

// Curated themes that are defence by definition.
const CORE_THEMES = new Set(["counter-uas", "critical-infra", "ukraine", "swarm", "maritime"]);

// Raw per-outlet tags that reliably indicate a military story.
const MILITARY_TAGS = new Set([
  "army", "air-force", "air-warfare", "land-warfare", "naval", "sea", "military",
  "defense", "defence", "drone-warfare", "c-uas", "cuas", "counter-drone",
  "maritime-security", "russia", "collaborative-combat-aircraft",
  "counter-uas-systems-tenders", "unmanned-systems", "armies", "air-forces",
  "loitering-munition", "electronic-warfare", "isr", "air-and-missile-defence",
]);

// Raw tags that mark civil / consumer / commercial-mobility coverage.
const CIVIL_TAGS = new Set([
  "evtol", "advanced-air-mobility", "urban-air-mobility", "aam",
  "drone-delivery", "delivery", "drone-photography", "photography",
  "consumer", "hobby", "agriculture", "real-estate", "cinema",
  "uas-traffic-management-news", "drone-as-first-responder",
]);

const MILITARY_WORDS = /\b(army|navy|naval|air force|marines?|military|defen[cs]e|mod|nato|pentagon|dod|warfare|war|combat|troops?|soldiers?|battlefield|front[- ]line|munitions?|missiles?|jammer|jamming|interceptors?|counter[- ]drone|c-uas|cuas|isr|reconnaissance|surveillance|artillery|howitzer|sabotage|airbase|air base|brigade|regiment|procurement|tender|contract award)\b/i;

const CONSUMER_WORDS = /\b(camera|cameras|gimbal|vlog|vlogging|osmo|action cam|selfie|photograph|photography|videograph|wedding|real estate|hobbyist|consumer|influencer|creator|cinematic|streaming|gopro|air taxi|taxi|passenger|deliver(y|ies|ing)|groceries|takeaway|package|parcel|courier|pharmacy|vertiport|e-commerce|retail|tourism)\b/i;

/**
 * Score a story's defence relevance. Positive means military / counter-UAV.
 *
 * Deliberately additive rather than a hard rule: a story tagged `counter-uas`
 * whose headline mentions a camera still clears the bar, because the theme tag
 * is the stronger signal.
 */
export function defenceScore(article) {
  const tags = article.tags || [];
  const title = article.title || "";
  let score = 0;

  for (const t of tags) {
    if (CORE_THEMES.has(t)) score += 2;
    else if (MILITARY_TAGS.has(t)) score += 1;
    else if (CIVIL_TAGS.has(t)) score -= 2;
  }
  if (MILITARY_WORDS.test(title)) score += 2;
  if (CONSUMER_WORDS.test(title)) score -= 2;

  return score;
}

// The bar for appearing in a roundup.
//
// Zero, not one: the test is "is there positive evidence this is CIVIL", not
// "is there positive evidence this is military". Much defence news carries
// neither military tags nor military headline wording — "Tekever acquires
// Flowcopter" was the most-covered story of a real week and scores 0 — so
// demanding proof of military relevance threw out roughly half the genuine
// defence coverage. Only stories whose civil signal outweighs their military
// signal are dropped.
export const DEFENCE_MIN = 0;

export const isDefenceRelevant = (article, min = DEFENCE_MIN) => defenceScore(article) >= min;

export function splitByRelevance(items, min = DEFENCE_MIN) {
  const kept = [], dropped = [];
  for (const a of items || []) (isDefenceRelevant(a, min) ? kept : dropped).push(a);
  return { kept, dropped };
}

// ---------------------------------------------------------------------------
// Firms with no defence business, excluded from the highlighted entity lists.
//
// Story-level scoring handles most of this, but a few consumer and logistics
// names still accumulate enough mentions to reach "most talked about" on volume
// alone — which is how a counter-UAV briefing ends up leading with Amazon
// parcel drops. This list only suppresses NAME HIGHLIGHTING; their stories are
// still scored on merit like any other.
//
// EDIT THIS LIST as the market changes: if one of these firms takes on defence
// work, remove it. Names must match `companies.name` in Supabase exactly.
// DJI is deliberately ABSENT — it is consumer-branded but central to
// counter-UAV (import bans, jamming, front-line use), so it stays eligible.
// ---------------------------------------------------------------------------
export const CONSUMER_ONLY_COMPANIES = new Set([
  "GoPro", "Insta360", "Starman Optical",
  "Amazon", "Amazon Web Services", "DoorDash",
  "Zipline", "Wing (Alphabet Inc.)", "A2Z Drone Delivery", "A2Z Drone Delivery, Inc.",
  "Airbound", "Skyports", "Manna", "Flytrex", "Wingcopter",
  "EHang", "SkyDrive", "Vertical Aerospace", "Joby Aviation", "Archer Aviation",
  "Toyota Motor", "Fujitsu", "LandSpace",
]);

export const isConsumerCompany = (name) => CONSUMER_ONLY_COMPANIES.has(name);

// Strip consumer-only names from a list of company names.
export const withoutConsumerCompanies = (names) =>
  (names || []).filter((n) => !CONSUMER_ONLY_COMPANIES.has(n));
