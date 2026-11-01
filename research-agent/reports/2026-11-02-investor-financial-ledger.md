# Investor financial-coverage ledger — 2 November 2026

Supersedes the earlier ledgers of 1 and 2 November. All **118** approved directory records
appear exactly once. Generated from the database, not maintained by hand: the queue lives in
the `investor_financial_research_log` table, so these counts are measurable rather than asserted.

| State | Records | Meaning |
|---|---:|---|
| **Found** | **102** | At least one typed, sourced, current observation is stored |
| **Researched, nothing usable** | **16** | Sources were opened and read; no figure could be stored honestly |
| **Never researched** | **0** | No row in the research log |
| | **118** | |

**The queue is empty.** Every record now has a research-log row, and 102 carry figures.

Progress across the three passes of 1–2 November:

| | Found | Researched, nothing | Never researched |
|---|---:|---:|---:|
| Start of 1 November | 23 | 19 | 76 |
| After the second pass | 55 | 23 | 40 |
| **Now** | **102** | **16** | **0** |

207 current metric observations across 104 registered vehicles.

Ukraine-linked coverage: **23 of 26** carry figures. The three without are **Defender Ventures**
(no fund of that name exists in any reviewed source), **R-G.AI** (not a fund — a US defence
technology company, recovered from the source workbook as part of a grouped syndicate row) and
**Varangians** (its only source returns 404, and the firm is described as an investment company
rather than a fund).

---

## Found (102)

Figure counts in brackets. `[UA]` marks Ukraine-linked records.

201 Ventures (1) · Accel (1) · Adara Ventures (3) · Alpine Space Ventures (3) ·
Amadeus Capital Partners (4) · Angel One [UA] (3) · Archangel (2) · Atlantic Bridge (1) ·
BADideas.fund (3) · Baillie Gifford (1) · Balnord (2) · Bpifrance (3) · Brave1 [UA] (2) ·
BSV Ventures (1) · Change Ventures (3) · Coinvest Capital [UA] (1) · D3 [UA] (3) ·
Darkstar [UA] (3) · Day One Capital (2) · Defence Builder [UA] (3) · Defence Invest (1) ·
Depo Ventures (2) · Double Tap Investments [UA] (2) · DOVOS (1) · DTCP (3) ·
EIF / Defence Equity Facility (2) · Expeditions [UA] (2) · Faber (3) · Final Frontier (2) ·
Flyer One Ventures [UA] (3) · Freedom Fund VC [UA] (1) · Front Ventures (1) · GapMinder (3) ·
General Catalyst (1) · Green Flag Ventures [UA] (1) · Gungnir Capital (1) ·
HBOR defence and security lending (2) · Helantic (1) · HTGF (2) · Hyperion (2) ·
In-Q-Tel [UA] (2) · Investinor (2) · IQ Capital (3) · Iron Wolf Capital (2) ·
IVC / Ilavska Vuillermoz Capital (1) · Join Capital (2) · Karista (3) · Kaya VC (4) ·
Keen Venture Partners [UA] (2) · Kibo Ventures (5) · Lakestar (2) · Lifeline Ventures (2) ·
Lightspeed (1) · LitBAN (1) · Lux Capital [UA] (2) · Marathon Venture Capital (2) ·
METU70 / ODTU70 (2) · MITS Capital / Lightning Fund [UA] (4) · NATO Innovation Fund [UA] (2) ·
Nazca Capital (1) · Network VC [UA] (1) · NewSpace Capital (3) · NSSIF (3) · Omnes (4) ·
Osney Capital (1) · OTB Ventures (4) · Plural (2) · Polarion (1) · Prima Materia (1) ·
Primo Capital (6) · Project A (3) · PSV Hafnium (2) · Purple Ventures (1) ·
Radius Capital [UA] (1) · Radix Ventures (2) · Redalpine (2) · Rockaway Alpha Defense (1) ·
Rockaway Ventures (1) · Saab (1) · Safran Corporate Ventures (1) · Scale Capital (2) ·
SecFund / BOM (2) · Seraphim Space (1) · Seven Capital (1) · SFPIM Defence (1) ·
Shield Capital [UA] (3) · Sienna Investment Managers (2) · SmartCap (2) ·
SNCI / National Defence Fund (1) · Speedinvest (2) · Sunfish Partners (1) · Tech Horizons (2) ·
Tensor Ventures (3) · Tesi (1) · Tikehau Capital (3) · Twin Track Ventures (1) · TYR.vc (2) ·
UA1 VC [UA] (2) · Ukraine Phoenix Tech Fund [UA] (1) · Vsquared Ventures [UA] (2) ·
Weinberg Capital Partners (4) · ZAS Ventures [UA] (1)

---

## Researched, nothing usable (16)

Each of these has a log row explaining what was checked and why nothing could be stored.
**"Not found in reviewed sources" is not "does not exist."** Where a next source is known,
the log row names it.

Airbus Ventures / AV · Baryon Fund · Defender Ventures [UA] · EIFO · Expansion VC ·
Greenoaks · iG TECH Capital · Invest-NL · MD One Ventures · N1 · Neo Ventures / Neo Autonomy ·
R-G.AI [UA] · ScaleWolf · Sisyphus Ventures · Varangians [UA] · Verve Ventures

Four of these are worth separating, because the reason is not "no figure published":

- **iG TECH Capital** — three managed funds are registered as vehicles from the manager's own
  site (iG TECH II, iG TECH III, iG TECH Energy). Hungarian private equity funds are not
  required to publish fund size; the next source is the MNB fund register.
- **N1** — the record's identity question is resolved (the Czech group at n1.rocks, whose
  U-Tech Fund backs Ukrainian founders, not the Kyiv N1 Investment Company). Its own fund
  page publishes no size.
- **Expansion VC** — no fund of that name was located. A near-miss, the Polish fund
  Expeditions, was deliberately not adopted.
- **R-G.AI** — not a fund at all, so there is no fund size to find.

---

## What the numbers mean

- An investor with **no row** in `investor_financial_research_log` and **no** current metric is
  an unresearched record. There are now none.
- A **vehicle** with no figures is not a gap in the data: 11 of the 104 registered vehicles
  exist precisely to record that a named fund has no published size, so that a sibling fund's
  figure cannot drift onto it.
- Unknown amounts are stored as `null` and rendered as unknown. **No unknown amount is stored
  or displayed as zero** — there is a test for this.

---

## Reversing any of this

The date-scoped delete commands that earlier versions of this ledger carried are gone, and
they are not coming back: three — now five — separate passes wrote to these tables on
2026-11-01, so `where created_at::date = '2026-11-01'` was always far wider than the batch
it claimed to reverse. Exact row ids, before-images, concurrency guards and dependency
checks live in two manifests:

- `research-agent/imports/README-investor-rollback-manifest-2026-11-01.md` — the semantics
  pass of 17:02–17:40 UTC.
- `research-agent/imports/README-investor-rollback-manifest-2026-11-01-coverage-and-correction.md`
  — the coverage pass of 18:43–19:05 that produced the 102 figures counted above, and the
  Tech Horizons correction that followed it.

Both distinguish a rollback **at the original checkpoint** from a **selective** rollback
against today's database, and both name what cannot be reversed instead of guessing at a
before-image. Neither has been executed against production.
