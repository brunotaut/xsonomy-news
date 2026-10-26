# European UAV & Counter-UAS Landscape — legacy C-UAS provenance and capability audit

2026-10-26. `europe-uav-cuas-2026-v1` unchanged (273 entries, untampered). **No V2 created.**

---

## Executive result

**The "111 unevidenced C-UAS leaf assignments" figure in my earlier reports was wrong, and
the error was mine.** Queried properly, it breaks down as:

| | Count |
|---|---|
| **Specific capability leaves** without evidence | **10** — every one `cuas-c2` |
| **Mid-level nodes** without evidence (`cuas-mitigation`, `cuas-detection`, `counter-uas`) | **101** |

My earlier pattern `slug like 'cuas-%'` swept in the broad parent nodes and reported them as
leaves. Every *specific* leaf — radar, RF detection, EO/IR, acoustic, sensor fusion, AI/CV,
jamming, GNSS, interceptor, kinetic, directed energy, integrated — already had 100% evidence
coverage before this pass. The real debt was never 111 missing leaf sources; it was 10, plus
a structural question about broad nodes.

That reframing did not make the audit smaller. Auditing capability rather than provenance
removed 13 assignments and 5 companies.

| | |
|---|---|
| Legacy specific-leaf assignments audited | **10** |
| — confirmed | 4 |
| — corrected | 0 |
| — removed unsupported | 5 |
| — needs review | 1 |
| Evidence URLs added | **13** |
| Products linked as supporting evidence | 9 |
| Product ownership corrections | 0 |
| Verified C-UAS companies without a specific leaf, before | **21** |
| — specific leaf found | 9 |
| — corrected to a different capability | 3 |
| — legitimate root-only | 1 |
| — C-UAS classification unsupported | 4 |
| — needs review | 4 |
| **Verified landscape before** | **367** |
| **Verified landscape after** | **362** |

---

## Major corrections

Five classifications were simply wrong, and four of the five were on well-known defence names
— exactly where an inherited assumption is least likely to be questioned.

| Company | Was | Finding |
|---|---|---|
| **Elbit Systems Deutschland** | C-UAS C2 | ReDrone's C4I belongs to the **Israeli parent**. Nothing establishes the German subsidiary as a C-UAS supplier at all. Parent/subsidiary confusion. |
| **Safran** | C-UAS mitigation | The Skyjacker counter-UAS capability sits on **Safran Electronics & Defense**, which already carries it. The parent was double-counting it. Kept as a UAV manufacturer (S-15 Patroller). |
| **Telespazio Germany** | C-UAS C2 | DIDIT is drone **detection and identification**, not command and control. |
| **Grupo Amper** | C-UAS C2 | Tactical comms, SIGINT and EW. Two searches found no counter-UAS offering. |
| **Evica** | C-UAS mitigation | Makes **LED searchlights**. A searchlight is not a defeat mechanism. |
| **AirRobot** | C-UAS mitigation | A UAV manufacturer (AR-100 micro quadcopter). No counter-UAS offering. |
| **ALX Systems** | C-UAS mitigation | Surveillance drones and a loitering munition. A counter-UAS *startup-list* mention is not a capability. |
| **SteelRock Technologies** | C-UAS mitigation | UAV manufacturer. No C-UAS evidence. |
| **Roke Manor Research** | C-UAS mitigation | SIGINT/ESM is **detection**, not a defeat capability. Corrected to RF Detection. |
| **Dronehub** | C-UAS mitigation | Drone-in-a-box docking infrastructure. Corrected to UAV ecosystem (launch/recovery). |
| **ALTA ARES** | C-UAS C2 | Its evidence supports AI guidance *inside an interceptor*, not a C2 layer. Interceptor and AI/CV retained. |
| **Impianti** | C-UAS C2 | Integrates third-party detection and neutralisation. No C2 layer stated. |

### Leaves confirmed with evidence (4)

Cambridge Pixel (VSD-C2 command-and-control software for C-UAS), Escribano (ODIN-I carries
onboard C4), FREQUENTIS (its own Counter-UAS Incident Management product), OSL Technology
(sensor-fusion command-and-control for drone detection).

### Specific leaves recovered from existing evidence (9)

| Company | Leaf | From |
|---|---|---|
| ARMMO Defense Technologies | Interceptor UAV | BANDIT-X interceptor trials |
| Granta Autonomy | Interceptor UAV | Black Wasp C-UAS interceptor |
| Uforce | Interceptor UAV | BUCHA interceptor |
| ERA | RF Detection | VERA-NG passive ESM tracker |
| Kara Dag | RF Detection | Obriy 2.0 RF drone detection |
| Roke Manor Research | RF Detection | SIGINT/ESM spectrum sensing |
| Copenhagen Sensor Technology | EO/IR | Electro-optical cameras in detection systems |
| Fiocchi | Kinetic | W-BITE tungsten counter-drone ammunition |
| Milrem Robotics | Directed Energy | HAVOC high-power microwave |
| Piranha Tech | RF Jamming | SF-3 anti-drone gun, AVD 360 RF protection |

Deliberate restraint: **Granta Autonomy's "AI-enabled" interceptor did not earn an AI/CV
leaf**, because the rules forbid inferring it from generic AI language.

---

## Companies losing verification (5)

All five lost their only UAV/C-UAS classification because that classification was unsupported.

| Company | Country | Why |
|---|---|---|
| Elbit Systems Deutschland | Germany | Capability belonged to the parent |
| Grupo Amper | Spain | No counter-UAS offering found |
| Telespazio Germany | Germany | Detection ≠ C2; modality unstated, so no substitute leaf |
| ALX Systems | Belgium | Loitering munition is not counter-UAS |
| Evica | United Kingdom | Searchlights are not a defeat mechanism |

None was deleted; each returns to candidate state in the working edition.

**Companies gaining verification: 0.** The nine leaf recoveries were on companies already
verified through a broad node.

---

## Remaining root-only / mid-level-only C-UAS (5, was 21)

| Company | Status | Why it remains |
|---|---|---|
| **AegisX** (Sweden) | LEGITIMATE_ROOT_ONLY | NATO states detection and tracking of low-flying **fibre-optic** drones but not the modality. Fibre-optic control specifically defeats RF detection, so guessing a leaf would be actively wrong. |
| **Cambridge Sensoriis** (UK) | NEEDS_REVIEW | Micro-radar for a drone's *own* detect-and-avoid and precision landing. The radar is real; the counter-UAS role is not established. May be a UAV-side sensor supplier misfiled. |
| **Phantom Defense** (Ukraine) | NEEDS_REVIEW | Coverage calls the Spectrum range "C-UAS EW systems", but the rules forbid inferring RF jamming from generic electronic-warfare language. |
| **SAF Tehnika** (Latvia) | NEEDS_REVIEW | Spectrum Compact is handheld RF **test equipment**. Whether it is marketed for drone detection is unestablished. |
| **DefSecIntel · Origin Robotics** (Estonia) | NEEDS_REVIEW | **Entity problem**: the record name conflates two companies. No source URLs, no products. The entity must be split before anything is classified. |

Four of the five are genuine "insufficient evidence", not laziness — and one is an entity
defect that classification would have papered over.

---

## Broad / mid-level C-UAS taxonomy findings

101 mid-level assignments carry no evidence URL and all have `assigned_by = NULL` — they
predate provenance enforcement entirely. After this audit:

| | Count |
|---|---|
| Mid-level rows **covered by a matching specific leaf** (structural parents) | **91** |
| Mid-level rows **standing alone**, no matching leaf | **10** |

The 91 are harmless: they are the parent of a leaf the company genuinely holds, so they add no
unevidenced claim. The 10 standing alone are the ones that were hiding missing capability
evidence, and they map onto the 5 remaining root-only companies above plus a few companies
holding a parent in one branch while evidenced in another.

**Architectural finding, for after V2 and not changed here:** these parents are *stored* rows,
not derived ones. The taxonomy has no mechanism distinguishing "assigned because evidenced"
from "implied by a child". Until it does, every count of C-UAS assignments mixes the two, and
a query like my own `cuas-%` pattern will keep producing misleading totals. The clean fix is to
derive parents at read time rather than store them. That is a schema change and belongs in its
own pass.

---

## Evidence quality of the 13 URLs attached

| Source type | Count |
|---|---|
| Official company page | 9 |
| Credible specialist defence publication | 3 |
| NATO | 1 |
| Government / procurement | 0 |
| Customer / military documentation | 0 |
| Weaker source (directory/aggregator) | 0 |

No directory or aggregator source was used for any capability claim.

---

## Remaining provenance debt

Actual numbers, not "clean":

| | Count |
|---|---|
| Specific C-UAS assignments still without an evidence URL | **1** (Sky Map, `cuas-c2`) |
| Verified C-UAS companies still without a specific leaf | **5** |
| C-UAS assignments still marked needs_review | **1** |
| Mid-level C-UAS rows still without evidence | **97** (91 structural, 6 standing alone) |
| Product ownership issues unresolved | **1** (DefSecIntel · Origin Robotics entity conflation) |

**Sky Map is the one material item.** Its product summary describes an AI C2 platform fusing
10,000+ acoustic and RF sensors — which would support the leaf — but the product carries no
source URL, the company has no website and no source URLs, and this leaf is the *only* thing
holding it in the verified subset. It was flagged rather than removed because the problem is
missing provenance, not disproof. It needs one source or it should go.

---

## QA

| Check | Result |
|---|---|
| V1 exactly 273 | **PASS** |
| V1 tampered rows | **PASS** (0) |
| No V2 exists | **PASS** — `europe-uav-cuas-2026-v1` only |
| Duplicate normalised company names | **PASS** (0) |
| Duplicate products | **PASS** — 2, pre-existing model variants (`Iris`/`Iris+`, `S1000`/`S1000+`) |
| Self relationships | **PASS** (0) |
| Orphan taxonomy | **PASS** (0) |
| Invalid company-sector-product links | **PASS** (0) |
| C-UAS specific leaves without evidence URL | **1** — Sky Map, flagged above |
| `cuas-integrated` without evidence | **1** — the Teledyne FLIR Defense case held from the 2026-10-25 audit |
| Manually assigned Multi-Sensor Detection | **PASS** (0) |
| Verified companies outside landscape scope | **PASS** (0) |
| Article-only verification | **PASS** (0) |
| Taxonomy relying only on description text | **PASS** — every assignment made today carries a URL (0 missing of 12) |
| New accidental publications | **PASS** — 24 companies created today are all draft; the 7 live rows are the nightly news pipeline |
| Article-link regression tests | **PASS** — 13/13 |
| Every CONFIRMED/added leaf has provenance | **PASS** (13 of 13) |

---

## Landscape after the audit

| | Before | After |
|---|---|---|
| European-scope companies | 1,002 | 1,002 |
| **Verified** | 367 | **362** |
| UAV only | 179 | 183 |
| C-UAS only | 175 | 168 |
| both | 13 | 11 |
| root-only UAV | 84 | 85 |
| C-UAS without a specific leaf | 21 | **5** |
| Unclassified | 535 | 540 |
| Unresolved | 74 | 74 |
| Needs review | 14 | 14 |
| Excluded | 9 | 9 |

---

C-UAS PROVENANCE NOT CLEAN — REMAINING BLOCKERS

Two blockers, both small and both specific:

1. **Sky Map's `cuas-c2` has no provenance anywhere** — not on the company, not on the
   product — and it is the sole classification keeping the company in the verified subset. A
   snapshot would freeze a verified company whose only capability claim is unsourced. One URL
   resolves it; absent that, the leaf should be removed and the company should leave.
2. **`DefSecIntel · Origin Robotics` is two companies in one record**, with no sources and no
   products, yet it is verified and carries a `counter-uas` classification. Freezing a
   conflated entity into an immutable artefact is the kind of error V1 already carries twice
   (Teledyne FLIR Defense and AIM Defence) and should not be repeated.

Explicitly **not** blockers: the 5 legitimate root-only and needs-review companies, the 91
structural parent rows, the Teledyne FLIR `cuas-integrated` case already held from the
previous audit, and the 85 root-only UAV companies.
