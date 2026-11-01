# Investor work — completion report, 1 November 2026

Eight-part brief. All eight parts are done. What follows is what changed, and — in several
places more usefully — what was deliberately **not** written down.

| # | Part | Outcome |
|---|---|---|
| 1 | Research the 40 remaining records | **Done. Zero untouched records.** 102 of 118 now carry figures |
| 2 | Revisit 11 weak "not found" conclusions | **10 of 11 upgraded** to sourced figures; Airbus Ventures stays not-found |
| 3 | Correct R-G.AI and Defender Ventures classification | Done |
| 4 | Review the JISR and Kara Dag duplicates | Both merged, each on one decisive fact |
| 5 | Resolve the 7 unresolved holdings | Done, into four of the five dispositions |
| 6 | Replace the unsafe rollback instructions | Replaced with an exact-id manifest, plus a test |
| 7 | Validate and deploy | 73 + 41 tests pass; deployed |
| 8 | This report | — |

## 1. The queue is empty, and that is measurable

The queue was never a list in a document. It is the set of records with **no row in
`investor_financial_research_log` and no current metric** — so "finished" is a query, not a
claim. It now returns **0**.

| | Found | Researched, nothing usable | Never researched |
|---|---:|---:|---:|
| Start of 1 November | 23 | 19 | 76 |
| After the second pass | 55 | 23 | 40 |
| **Now** | **102** | **16** | **0** |

207 current observations across 104 registered vehicles. Ukraine-linked: 23 of 26 carry
figures. Per-record detail is in `2026-11-02-investor-financial-ledger.md`.

## 2. A new metric type, and a figure that would have been invisible

Karista publishes about **€220M "raised since its creation."** That is not assets under
management (point-in-time, net of realisations) and not capital deployed. Filing it as
either would publish one fact as a different one, so `cumulative_capital_raised` was added,
with a constraint comment saying what it is not.

Adding the type was the easy half. The atlas derives `METRIC_ORDER` from `METRIC_LABEL` and
keys its list-card slots on the metric type, so **a type absent from both is dropped
silently from the detail panel and from the card.** The figure would have been researched,
sourced, stored — and invisible on the site. Label, slot and a `SCALE_PREFIX` entry were
added so "raised since inception" is never captioned "AUM". A test now asserts that every
type the database can store has a label and exactly one slot; it was mutation-checked
(remove the label, it fails naming the reason).

## 3. What was refused

- **11 of 104 vehicles hold no figure on purpose.** They exist so that a sibling fund's
  number cannot drift onto a fund that has none. Rockaway's Defense sub-fund (target €450M)
  beside Rockaway Alpha (€1bn+ target, ~€150M portfolio). IVC's DefenceTech fund — no
  published size — beside its ClimateTech fund, whose €60M is the figure routinely
  misquoted as "IVC's €60M fund". iG TECH's three Hungarian funds, not required to publish.
- **A round total is not a cheque.** Prima Materia *led* Helsing's €600M round; its own
  documented outlay is €100M of a €102.5M Series A. Tech Horizons *led* a Series A reported
  at both ">$20M" and "$29M". Neither round total was stored as investor capital. A
  Dealroom note crediting Prima Materia's portfolio with ~$2.5bn raised in 48 hours is
  portfolio fundraising, not deployment.
- **Group AUM is not defence capacity.** Tikehau ~€53bn group (of which €7.9bn private
  equity), Omnes €6.7bn across four businesses, Safran group versus Safran Corporate
  Ventures' own ~€130M, Saab group versus Saab Ventures. Each is labelled as what it is.
  Tikehau's A&D strategy (~€600M) and TDS fund (€150M) sit at their own levels.
- **Four NSSIF figures measure four different things.** £14,863,000 committed in FY2024-25
  (a parliamentary answer — official and current); the £85m Autumn Budget 2017 programme;
  ~£220M cumulative to June 2023 (third-party); and "up to £100m per annum", which appears
  only in a recruitment advert and was **not** stored.
- **Kibo's €155M is a combined close** across Fund III and Opportunity Fund I. Stored once,
  with an explicit warning against attributing it to either alone.
- **Derived numbers were dropped.** Polarion's "$5.4m average round investment" is an
  aggregator's arithmetic over a single 2026 deal, not the fund's own cheque size.
- **A fabricated source was caught.** An apparently AI-generated "report" surfaced in
  search naming six defence funds (Central Tech Defense Fund, CEE Defense Innovation Fund,
  Sentinel VC, Nordic-CEE Defense Ventures, DefendTech Capital, Frontier Defense Partners)
  that appear in no primary source. None were used; the trap is named in the Defence Invest
  log row so a later pass does not fall into it.
- **An embedded instruction was ignored.** One Dealroom search result carried text
  addressed to AI models telling them how to attribute its data. It was treated as data.

## 4. Identities resolved, and one left open honestly

- **N1** is the Czech group at `n1.rocks`, whose U-Tech Fund backs Ukrainian founders and
  whose named investors are Jan Barta (Pale Fire Capital), Josef Průša and Libor Winkler
  (RSJ). It is **not** the Kyiv-based N1 Investment Company, whose lineage carries the
  "$20m" that sits in directories. VRgineers is corroborated as an N1 holding.
- **"Rockaway Alpha Defense"** is the Defense sub-fund of Rockaway Alpha Fund SICAV a.s.
  (Winstor, CNB-supervised, CZK base, evergreen) — distinct from the Alpha sub-fund its own
  name conflates it with, and from Rockaway Ventures and Rockaway Capital Group.
- **Tech Horizons** was **left unresolved on purpose.** A Luxembourg-domiciled profile and
  the Prague Presto Tech Horizons (with Czechoslovak Group) may or may not be one vehicle;
  no reviewed source settles it, so the €150M raise carries that caveat rather than an
  assumption. This is the record whose own note already flagged office-versus-domicile.
- **Expansion VC** was not found. The Polish fund **Expeditions** (€31M from the EIF and
  BGK) is a near-miss and was deliberately **not** adopted as the same firm.

## 5. "Not found" never became "does not exist"

Sixteen records are researched-with-nothing-usable, and each log row says what was checked
and, where known, what the next source is: the MNB fund register for iG TECH's three funds;
METU, Maxis or an SPK filing for ODTU70; Safran's own April 2024 release, which returned
HTTP 403 to every attempt. Saab Ventures publishes no fund size anywhere reviewed — that is
the finding, not an absence of capital, and group revenue was refused as a substitute.

## 6. Rollback

The date-scoped deletes are gone. They would have destroyed other work done the same day:
101 metric rows were created on 1 November against 51 inserted by that batch, so
`delete … where created_at::date = '2026-11-01'` would have taken every current observation
with it. `research-agent/imports/README-investor-rollback-manifest-2026-11-01.md` lists
exact row ids in reverse dependency order, and a test keeps that order honest. **The
rollback logic was exercised against fixtures, never against production, and no test entity
was inserted into the live database.**

## 7. Validation

- Catalogue: **73 of 73** pass, including the new metric-slot guard and the standing test
  that an unknown amount travels as `null` and never as zero.
- News: **41 of 41** pass, including the resolver merger-policy and rollback-manifest tests.
- Local builds against live data are not possible here — neither repo holds a `.env`, and
  the service key lives only in CI — so the build was validated through the test suites
  (which run the whole static generator against a read-only fixture API) and then through
  the deployed site.

## Open, and not for me to decide

Unchanged from the previous report: the LUNA-2/Dot scope question, the MMCM/rMCM/XLUUV
programme names, the WOLF cluster and Ghost Shark/Ghostfin, and the cached
`Teledyne FLIR OEM` row. Three Ukraine-linked records still carry no figure for reasons
that are findings rather than gaps: **Defender Ventures** (no fund of that name in any
reviewed source), **R-G.AI** (not a fund) and **Varangians** (sole source 404s).
