// The importer's only job is to not create duplicates. These are the duplicates this
// database has actually produced, plus the near-misses that must NOT be merged.
//
//   node scripts/test-company-match.mjs

import { nameKey, domainKey, buildIndex, findExisting, validateEntry, slugify }
  from "./lib/company-match.mjs";

let failed = 0;
const eq = (label, got, want) => {
  if (got !== want) { failed++; console.error(`  FAIL ${label}\n    got  ${got}\n    want ${want}`); }
};
const same = (label, a, b) => eq(label, nameKey(a) === nameKey(b) ? "same" : `${nameKey(a)} != ${nameKey(b)}`, "same");
const diff = (label, a, b) => eq(label, nameKey(a) !== nameKey(b) ? "different" : `both ${nameKey(a)}`, "different");

// --- the real duplicates this database produced, all merged by hand in §16 ---------
same("DroneShield spacing", "DroneShield", "Drone Shield");
same("Drone Volt spacing", "Drone Volt", "DroneVolt");
same("EagleNXT spacing", "EagleNXT", "Eagle NXT");
same("Fire Point spacing", "Fire Point", "FirePoint");
same("MSI hyphen", "MSI-Defence Systems", "MSI Defence Systems");
same("Overland AI spacing", "Overland AI", "OverlandAI");
same("Prodrone spacing", "Prodrone", "Pro Drone");
same("Smart Shooter spacing", "Smart Shooter", "SmartShooter");
same("Uralvagonzavod spacing", "Uralvagonzavod", "Uralvagon Zavod");
same("ZeroZero spacing", "ZeroZero Robotics", "Zero Zero Robotics");

// --- legal suffixes are noise ------------------------------------------------------
same("GmbH", "AirRobot GmbH & Co. KG", "AirRobot");
same("Ltd", "Blighter Surveillance Systems Ltd", "Blighter Surveillance Systems");
same("A/S", "Terma A/S", "Terma");
same("Oy", "Sensofusion Oy", "Sensofusion");
same("sp. z o.o.", "Hertz Systems sp. z o.o.", "Hertz Systems");
same("parenthesised owner", "Aveillant (Thales)", "Aveillant");
same("case and punctuation", "ROHDE & SCHWARZ", "Rohde and Schwarz");

// --- things that look similar and are NOT the same, from §16 -----------------------
diff("parent vs division: Hanwha", "Hanwha", "Hanwha Aerospace");
diff("parent vs division: Honeywell", "Honeywell", "Honeywell Aerospace");
diff("parent vs division: KNDS", "KNDS", "KNDS Robotics");
diff("different firms", "Origin Robotics", "Marduk Technologies");
diff("shared first word", "Quantum Systems", "Quantum Cyber");

// --- domains ------------------------------------------------------------------------
eq("https and www", domainKey("https://www.robinradar.com/products"), "robinradar.com");
eq("bare host", domainKey("robinradar.com"), "robinradar.com");
eq("subdomain", domainKey("https://shop.aaronia.de"), "aaronia.de");
eq("co.uk kept whole", domainKey("https://www.openworksengineering.co.uk/"), "openworksengineering.co.uk");
eq("com.au kept whole", domainKey("https://droneshield.com.au"), "droneshield.com.au");
eq("empty", domainKey(""), null);
eq("null", domainKey(null), null);
eq("not a domain", domainKey("see their website"), null);
eq("trailing path and query", domainKey("http://cerbair.com/en/?x=1"), "cerbair.com");

// --- the index and lookups ------------------------------------------------------------
const index = buildIndex(
  [{ id: "c1", name: "DroneShield", website: "https://www.droneshield.com" },
   { id: "c2", name: "Robin Radar Systems", website: "https://robinradar.com" },
   { id: "c3", name: "Harmattan AI", website: null }],
  [{ company_id: "c3", alias: "Harmattan" }],
  [{ name: "EAGLE.ONE", company_id: "c9" }],
);

eq("new company is new", findExisting({ name: "Sensrad", website: "https://sensrad.com" }, index).match, null);
eq("spacing variant caught by name", findExisting({ name: "Drone Shield" }, index).match, "name");
eq("caught by domain despite a different name",
   findExisting({ name: "DroneShield Europe", website: "https://www.droneshield.com/eu" }, index).match, "domain");
eq("domain beats name", findExisting({ name: "Robin Radar", website: "https://robinradar.com" }, index).match, "domain");
eq("alias match", findExisting({ name: "Harmattan" }, index).match, "alias");
eq("alias reports the canonical name", findExisting({ name: "Harmattan" }, index).existing.name, "Harmattan AI");
eq("product-name collision is flagged", findExisting({ name: "Eagle One" }, index).match, "product");
eq("empty name matches nothing", findExisting({ name: "" }, index).match, null);

// --- entry validation -------------------------------------------------------------------
const good = { name: "Sensrad", hq_country: "Sweden", source_urls: ["https://example.com/a"] };
eq("valid entry", validateEntry(good), null);
eq("no name", validateEntry({ ...good, name: "  " }), "no name");
eq("no country", validateEntry({ ...good, hq_country: null }), "no hq_country");
eq("no sources", validateEntry({ ...good, source_urls: [] }), "no source_urls");
eq("sources not an array", validateEntry({ ...good, source_urls: "https://x.com" }), "no source_urls");
eq("source is not a URL", validateEntry({ ...good, source_urls: ["their website"] }), "a source_url is not a URL");
eq("not an object", validateEntry("Sensrad"), "not an object");

// --- slugs ---------------------------------------------------------------------------------
eq("plain", slugify("Sensrad"), "sensrad");
eq("spaces and case", slugify("Delian Alliance Industries"), "delian-alliance-industries");
eq("punctuation", slugify("MSI-Defence Systems"), "msi-defence-systems");
eq("accents", slugify("Säab Thalès"), "saab-thales");
eq("nothing usable", slugify("!!!"), "company");

console.log(failed ? `\n${failed} failing.` : "company matching: all checks passed");
if (failed) process.exit(1);
