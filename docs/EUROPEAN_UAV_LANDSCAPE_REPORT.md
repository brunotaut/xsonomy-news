# European UAV & Counter-UAS Landscape — expansion pass

2026-10-23. Source file: `uav360_europe_uav_cuas_verification_complete_2026-10-23.xlsx`
(Final Verification sheet, 158 rows). Everything written in this pass is **draft**.
**No snapshot was taken.**

Companion documents: `CUAS_UAV_EXPANSION_AUDIT.md` (per-candidate decisions),
`CUAS_CLASSIFICATION_REPORT.md` (the narrower C-UAS pass that ran before this one).

---

## 1. What this pass did

Widened the Landscape from Counter-UAS only to **UAV and Counter-UAS across Europe**. The
C-UAS side was left exactly as it was: no existing C-UAS assignment was changed, removed or
re-confidenced, and the `europe-cuas-2026` edition still holds its original 807 rows.

## 2. Taxonomy

A UAV branch was added under the existing `uav` domain — three groups
(`uav-platform`, `uav-mission`, `uav-ecosystem`) and 21 leaves. The four platform rows the
catalogue already had were re-parented into `uav-platform` rather than duplicated.
The Counter-UAS taxonomy was not touched.

## 3. The 158 candidates

| Verdict | Count |
|---|---|
| NEW_COMPANY | 133 → **134 imported** (Robot Aviation was resolved out of review, §5) |
| MATCHED_EXISTING | 18 |
| ENTITY_REVIEW | 5 → 4 remaining |
| EXCLUDE | 2 |

### Excluded, with reasons

- **Sky-Hero by Axon** — a brand of Axon Enterprise (United States), already in UAV360.
  Not an independent European company.
- **SubSea Craft** — already in UAV360, and builds uncrewed *maritime* craft. Outside the
  aerial scope of this Landscape.

### Still unresolved (4)

| Candidate | Why |
|---|---|
| Odin | Matches an existing *product* named ODIN. Cannot tell whether the candidate is its maker, a different firm, or the same thing recorded twice. |
| MaXon | We hold "MaXon Systems" with no country. Probably the same company; identity not established. |
| Sky Eye Systems | We hold "Sky Eye" with no country. Probably the same company; identity not established. |
| Bavovna | Ukrainian-founded, but incorporated in Delaware with a US headquarters per its funding coverage. Country of record is contested. |

## 4. What was written

| | |
|---|---|
| Companies created | **134**, all `publication_status = 'draft'` |
| UAV-subtree sector assignments | **168** (134 new + 34 on matched-existing companies) |
| C-UAS assignments created or changed | **0** |
| Products created | **0** |
| Maturity assessments | **0** |
| Aliases added | 6 |
| `landscape_candidates` rows, `europe-uav-cuas-2026` | **946** (284 `included`, 662 `candidate`) |

New companies by country: Ukraine 75, Poland 13, United Kingdom 9, France 5, Norway 5,
Denmark 3, Estonia 3, Germany 3, Romania 3, Italy 2, Latvia 2, Lithuania 2, Netherlands 2, and
one each for Austria, Czech Republic, Finland, Spain, Sweden, Switzerland and Turkey.

### Why no products and no maturity

The verification sheet carries Company, Country, Landscape layer, Evidence URL, Discovery
source and Confidence. It has **no product names and no deployment, contract or funding
evidence**. Writing either would have meant inventing it, so neither was written. The
133 descriptions say only where the company was found.

### Confidence

`medium` only where the candidate's own website was resolved — **31 of 134**. The other 103
rest on a directory listing alone and are `low`. Four rows whose "Evidence URL" was prose
rather than a link ("Government market review only") were given the real source document.

No Counter-UAS leaf was inferred from a Landscape-layer string. C-UAS capability still
requires its own evidence, which this file does not provide.

## 5. Publication safety

- All 134 new rows are `draft`.
- The catalogue generator publishes `PUBLISH_STATUS = "live"` and **throws** if an
  unpublished row reaches it, so none of this can appear on xsonomy.com.
- Verified after the import: 0 new rows with a publication status other than `draft`.

## 6. QA

Clean:

- 0 duplicate normalised company names across the whole table.
- 0 new rows colliding with an existing company's alias.
- 0 new rows sharing a website domain with an existing company.
- 0 orphaned sector assignments.
- 14 companies carry both UAV and C-UAS assignments — expected, and they coexist correctly.
- 0 companies have the drone directory's own domain recorded as their website (a bug caught
  before the import; four rows would have had it).

Two corrections applied during the pass:

- **Shield Systems** (Ukraine) — the directory spells it "Sheild systems". Name corrected,
  own website recorded, directory spelling kept as an alias.
- **Autonomous Flight Technologies** (Romania) — own website recorded.

### Open issues, not fixed here

1. **Seven externally-researched companies are live.** OVES Enterprise, Qognifly, Sensrad,
   EGIDE, OSIRIS AI, ALX Systems and Delian Alliance Industries were created `live` during the
   2026-10-22 C-UAS pass, before the draft rule was in force. They are public now. Changing
   that is a publication decision — **your call, Nazar.**
2. **232 companies have no country.** Pre-existing. They cannot be scoped into any regional
   Landscape until that is filled in.
3. **43 groups of companies share a website domain.** Pre-existing; some will be genuine
   subsidiaries, some will be duplicates. Worth a dedicated pass.
4. **"Czechia" and "Czech Republic" both appear** as country values. One company on the
   former spelling.
5. **SubSea Craft's `hq_country` is "United States."** The company is British. Not changed
   here because this pass had no independent source for it.
6. **103 of the 134 new rows have no verified website**, which is why they are `low`
   confidence and why none of them should be published without a check.

## 7. Scope note for publication

This Landscape covers Europe. Israeli, American and Asian vendors are absent **by decision,
not by omission** — several significant suppliers are therefore missing, and the published
Landscape should say so.

---

READY FOR EUROPEAN LANDSCAPE SNAPSHOT: NO

Three things stand between this and a snapshot: 103 of 134 new companies have no verified
website and sit at `low` confidence; no product or maturity evidence exists for any of them;
and the four entity-review cases in §3 are unresolved duplicates-or-not. A snapshot now would
freeze a Landscape that is mostly unverified directory listings.
