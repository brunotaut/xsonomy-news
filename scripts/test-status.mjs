// Every distinct `UAV · Production status` string in the database on 2026-10-22,
// with the bucket it must land in. 160 values across 408 products.
//
// This is here because the migration is one-way: once the specs key is removed,
// a wrong mapping is a wrong value on a public page with nothing left to compare
// against. The awkward cases are real and were chosen deliberately — see the
// comments beside them.
//
//   node scripts/test-status.mjs

import { normaliseStatus, STATUS_VALUES } from "./lib/status.mjs";

const CASES = [
  // --- cancelled: the override pass has to beat everything else -------------
  ["Cancelled", "cancelled"],
  ["Cancelled (1999)", "cancelled"],
  ["Cancelled (2012)", "cancelled"],
  ["cancelled (defunct / bankrupt)", "cancelled"],
  ["Cancelled (Kickstarter refunded)", "cancelled"],
  ["Cancelled (program ended 2018)", "cancelled"],
  ["Cancelled / company folded (2017)", "cancelled"],
  ["Cancelled / demonstrator only", "cancelled"],   // not prototype

  // --- discontinued ---------------------------------------------------------
  ["Discontinued", "discontinued"],
  ["Discontinued (2018)", "discontinued"],
  ["Discontinued (AscTec acquired by Intel 2016)", "discontinued"],
  ["Discontinued (company defunct ~2019)", "discontinued"],
  ["Discontinued (succeeded by Alta X)", "discontinued"],
  ["discontinued (succeeded by Typhoon H Plus)", "discontinued"],
  ["Discontinued (succeeded by V3)", "discontinued"],
  ["Discontinued/crowdfunding", "discontinued"],
  ["Discontinued/historic", "discontinued"],
  ["Discontinued/legacy", "discontinued"],
  ["Discontinued/limited", "discontinued"],
  ["Out of production", "discontinued"],
  ["Out of production (legacy)", "discontinued"],
  ["Out of production (replaced by Irkut-3)", "discontinued"],
  ["Out of production; legacy stocks", "discontinued"],
  ["Retired", "discontinued"],
  ["Retired from USAF (2018)", "discontinued"],
  ["Retired/legacy", "discontinued"],
  ["Retired/limited", "discontinued"],
  ["Superseded by Elios 3", "discontinued"],
  ["Superseded by MQ-8B/MQ-8C", "discontinued"],
  ["Superseded by Orlan-3M", "discontinued"],
  ["superseded by Zephyr S/8", "discontinued"],
  ["Predecessor model (superseded)", "discontinued"],
  ["Prototype / superseded by Elios", "discontinued"],   // superseded wins over prototype
  ["In service (legacy/largely superseded)", "discontinued"],
  ["legacy/in service", "discontinued"],
  ["limited/legacy", "discontinued"],
  // "Consumer (legacy)" reads as a shipping consumer drone, but legacy means it
  // is no longer sold. This is the pair that broke the catalogue filter once.
  ["Consumer (legacy)", "discontinued"],
  ["Consumer (discontinued/legacy)", "discontinued"],
  ["Consumer toy (legacy)", "discontinued"],
  ["Produced (legacy)", "discontinued"],
  ["Crowdfunded (delivery uncertain / likely discontinued)", "discontinued"],
  ["Demonstrator (single aircraft, retired)", "discontinued"],

  // --- in production --------------------------------------------------------
  ["In production", "in_production"],
  ["In production (~100 units produced)", "in_production"],
  ["In production (deliveries 2014)", "in_production"],
  ["In production (eBee X family)", "in_production"],
  ["In production (export)", "in_production"],
  // "succeeded by" is not "superseded by": this one says it is still in production,
  // and a successor existing does not stop that. The leading phrase decides.
  ["In production (succeeded by Spirit)", "in_production"],
  ["In production / development", "in_production"],
  ["In production / in service", "in_production"],
  ["In production / in use", "in_production"],
  ["In production / operational", "in_production"],
  ["In production / serial", "in_production"],
  ["In production / testing", "in_production"],
  ["In production/catalogue", "in_production"],
  ["In production/catalogue (NELK-V6.M1)", "in_production"],
  ["in service", "in_production"],
  ["In service", "in_production"],
  ["in service (Belarus)", "in_production"],
  ["In service (transitioning to MQ-8C)", "in_production"],
  ["In service / in production", "in_production"],
  ["In service / low-rate production", "in_production"],
  ["In service / production", "in_production"],
  ["In service / serial / exported", "in_production"],
  ["In service / serial production", "in_production"],
  ["In service / used in combat", "in_production"],
  ["Produced", "in_production"],
  ["Production", "in_production"],
  ["Active", "in_production"],
  ["Active (~250/year, scaling)", "in_production"],
  ["Active (company)", "in_production"],
  ["Commercial", "in_production"],
  ["available (commercial)", "in_production"],
  ["Catalogue", "in_production"],
  ["Catalogue/limited production", "in_production"],
  ["Consumer product", "in_production"],
  ["Consumer product (startup)", "in_production"],
  ["Consumer toy", "in_production"],
  ["Export offering", "in_production"],
  ["Fielded/limited production", "in_production"],
  ["In operation (commercial service)", "in_production"],
  ["In use (civil)", "in_production"],
  ["Limited production", "in_production"],
  ["Marketed / limited", "in_production"],
  ["Mature product family", "in_production"],
  ["Operational (limited fleet)", "in_production"],
  ["Limited/prototype-commercial", "development"],
  ["Developed / in use", "in_production"],            // "in use" beats the weak "developed"
  ["Developed/limited production", "in_production"],



  // --- prototype ------------------------------------------------------------
  ["Prototype", "prototype"],
  ["Prototype / development", "prototype"],
  ["Prototype / limited", "prototype"],
  ["Prototype / limited (program largely shelved)", "prototype"],
  ["prototype / low-rate", "prototype"],
  ["Prototype / not series produced", "prototype"],
  ["Prototype / startup", "prototype"],
  ["Prototype / technology demonstrator", "prototype"],
  ["Prototype only (company defunct 2017)", "prototype"],
  ["Prototype/frozen program", "prototype"],
  ["prototype/limited", "prototype"],
  ["Prototype/low-rate", "prototype"],
  ["Prototype/testing", "prototype"],

  ["Research / prototype", "prototype"],
  ["Research prototype", "prototype"],
  ["Research/limited (university)", "prototype"],

  ["Experimental/demonstration", "prototype"],
  ["Experimental/prototype", "prototype"],
  ["experimental/testing", "prototype"],
  ["Demonstrator (not production)", "prototype"],
  ["Demonstrator (program ended 2006)", "prototype"],
  ["Demonstrator only", "prototype"],

  // --- development ----------------------------------------------------------
  ["Development", "development"],
  ["Development / limited", "development"],
  ["Development / limited (orders announced)", "development"],
  ["Development / low-rate", "development"],
  ["development/concept", "development"],
  ["Development/evaluation", "development"],
  ["Development/limited", "development"],
  ["Development/testing (circa 2015)", "development"],
  ["In development", "development"],
  ["In development (prototype flown)", "development"],
  ["In development / limited service", "development"],
  ["In development / on order", "development"],
  ["in development/operational testing", "development"],
  ["Concept / development (mockup stage)", "development"],
  ["Concept / project", "development"],
  ["Concept/development", "development"],
  ["Concept/mock-up", "development"],
  ["Export development", "development"],
  ["Flight trials / development", "development"],
  ["Testing / development", "development"],
  ["Testing / pre-production", "development"],
  ["Trials began 2015", "development"],
  ["in testing", "development"],
  ["project / concept", "development"],
  ["Project / limited", "development"],
  ["announced/limited", "development"],
  ["Limited", "development"],
  ["limited (~50 units reported)", "development"],
  ["Limited / prototype-era", "development"],
  ["Tested/limited", "development"],
  // A bare "Developed" is the weak rule's whole reason for existing.
  ["Developed", "development"],
  ["Developed (mid-2000s)", "development"],
  ["Developed; military variant in development", "development"],
  // Leading phrase wins over a later one. Each of these mentions production or a
  // prototype further along the string, but what it leads with is what it mostly
  // is — a thing being tested, not a thing being sold.
  ["Flight testing / limited production", "development"],
  ["Testing / limited production", "development"],
  ["Development/limited production", "development"],
  ["Project / prototype", "development"],
  ["Concept/prototype", "development"],

  // --- unknown: nothing to go on -------------------------------------------
  ["uncertain", "unknown"],
  ["Uncertain", "unknown"],
  ["Family - various", "unknown"],
  ["", "unknown"],
  [null, "unknown"],
  [undefined, "unknown"],
];

let failed = 0;
const buckets = {};
for (const [input, expected] of CASES) {
  const got = normaliseStatus(input);
  buckets[got] = (buckets[got] || 0) + 1;
  if (got !== expected) {
    failed++;
    console.error(`  FAIL  ${JSON.stringify(input)}\n        expected ${expected}, got ${got}`);
  }
}

for (const b of Object.keys(buckets)) {
  if (!STATUS_VALUES.includes(b)) {
    failed++;
    console.error(`  FAIL  produced "${b}", which is not in STATUS_VALUES`);
  }
}

console.log(`status normaliser: ${CASES.length - failed}/${CASES.length} cases pass`);
console.log("  " + Object.entries(buckets).sort((a, b) => b[1] - a[1])
  .map(([k, n]) => `${k} ${n}`).join(" · "));

if (failed) {
  console.error(`\n${failed} failing.`);
  process.exit(1);
}
