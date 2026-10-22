# European Counter-UAS Landscape 2026 — implementation plan

Audit of the existing system and a proposal for building the Landscape on top of it.
**Nothing in this document has been built.** Measured against the live database on 2026-10-22.

Read alongside `DATA-MODEL.md` (the company data model) and `ARCHITECTURE.md` (both repos).

---

## 0. The short version

**Most of what the brief asks for already exists.** The maturity classification was built on
2026-10-22 with the same five levels, word for word, and the evidence model it rests on was
built with it. `last_verified_at` exists as `companies.last_reviewed_at`. A controlled taxonomy
with a parent/child vocabulary and a company↔category junction exists as `sectors` /
`company_sectors`.

Three things are genuinely new:

1. **The 15-term C-UAS taxonomy.** The database has four coarse C-UAS capability tags, not fifteen.
2. **Snapshots.** Nothing can currently answer "what did the landscape look like in Q1?"
3. **European scoping.** `hq_region` cannot do this — see §5. It has to come from `hq_country`.

And one thing in the brief should **not** be built as described: `company_categories[]` and
`technologies[]` as array columns. The junction table that already exists is better, and §9 says why.

---

## 1. Current database schema

19 tables. The ones that matter here:

| Table | Rows | Role |
|---|---|---|
| `companies` | 2,287 | the entity. 51 columns incl. identity, HQ, financials, sanctions, provenance |
| `products` | 3,405 | with `specs` JSONB, `category`, `status`, `use_class` |
| `sectors` | 25 | the controlled vocabulary: `kind` (domain/capability/platform), `slug`, `parent_id` |
| `company_sectors` | 502 companies | company ↔ sector, with `is_primary` |
| `product_sectors` | **0** | exists, entirely unused |
| `company_evidence` | 0 (new) | dated, sourced claims — customers, contracts, deployments, partnerships, funding |
| `articles` | 6,749 | the news feed |
| `article_companies` / `article_products` | 8,712 / 9,181 | entity links, **noisy — see §12** |
| `company_relationships` | 46 | subsidiary / division / JV / acquisition |
| `investors`, `institutions` | 197 / — | present, `investors` has no link table |
| `company_aliases`, `tag_resolutions` | — | entity-resolution plumbing |

### Maturity — already live

`products` and `companies` both carry, as of 2026-10-22:

```
maturity              emerging | demonstrated | commercial | deployed | scaled
maturity_rationale    why, in a sentence or two — published next to the level
maturity_source_urls  text[], at least one REQUIRED by a CHECK constraint
maturity_assessed_at  REQUIRED by the same constraint
maturity_assessed_by  editor | llm | import
maturity_confidence   low | medium | high
```

Plus `companies.maturity_is_override` (an editor's call, never overwritten by the roll-up),
`public.uav360_maturity_rank(text)` for sorting, and the `company_maturity_suggested` view.

The five levels are identical to the brief's. **No change needed.**

---

## 2. Existing company / product / category fields

**Category-ish fields that already exist:**

| Field | Where | State |
|---|---|---|
| Capability tags | `company_sectors` → `sectors.kind='capability'` | 4 C-UAS tags in use, 8 others defined but unused |
| Domain tags | `sectors.kind='domain'` | UAV 192, Sensors 197, Counter-UAS 11, others 0 |
| Platform tags | `sectors.kind='platform'` | all 0 |
| `companies.company_type` | prime/tier1/tier2/sme/startup/… | 84% filled |
| `products.category` | UAV / Sensor / Counter-UAS / Effector / Software / Other | 100% |
| `products.use_class` | uav / cuas / dual | 184 rows, 95% empty |
| `companies.offering_type` | hardware/software/both/services | added 2026-10-22, empty |
| `companies.use_class` | uav / cuas / dual | added 2026-10-22, empty |

**The four C-UAS capability tags in use today — 208 companies:**

| Slug | Companies | Maps to the new taxonomy as |
|---|---|---|
| `cuas-mitigation` | 90 | the DEFEAT group |
| `cuas-integrated` | 55 | INTEGRATED |
| `cuas-detection` | 52 | the DETECTION group |
| `cuas-c2` | 11 | Command & Control (a leaf) |

This is the single most valuable thing to reuse. 208 assignments already exist and map cleanly
onto the **groups** of the proposed taxonomy — just not onto the leaves. §9 keeps all of them.

---

## 3. How data enters the database

All writes come from `xsonomy-news`. The catalogue repo only reads.

```
~40 RSS feeds
      │  ingest.mjs            (daily 05:00 UTC)
      ▼
  articles ──► analyze.mjs     LLM reads the body, pulls out company/product NAMES
      │                        → articles.companies[] / products[]
      ▼
  resolve-entities.mjs         names → rows. Creates companies, products,
      │                        company_aliases, article_companies, article_products.
      │                        An LLM vets unknown names once; decisions cached in
      │                        tag_resolutions.
      ▼
  companies / products  ◄── enrich-companies.mjs   profile + financial fields (Claude recall)
                        ◄── enrich-wikidata.mjs    Wikidata
                        ◄── enrich-products.mjs    catalogue summaries from linked articles
                                                   (daily 04:00)
                        ◄── extract-evidence.mjs   company_evidence (daily 03:00, from 2026-10-22)
                        ◄── assess-maturity.mjs    maturity (manual for now)
```

**Every company in the database arrived because it was named in a news article.** There is no
directory import, no manual entry path, no vendor submission. That is the defining constraint
for the Landscape, and §12 explains why it matters.

---

## 4. Existing AI enrichment processes

| Script | Writes | Trigger | Gate |
|---|---|---|---|
| `analyze.mjs` | `articles.companies/products` | each ingest | relevance keywords |
| `resolve-entities.mjs` | companies, products, junctions | manual/scheduled | LLM vets unknown names, cached |
| `enrich-companies.mjs` | company profile fields | manual | leaves `publication_status='draft'` |
| `enrich-wikidata.mjs` | company fields from Wikidata | manual | — |
| `enrich-products.mjs` | `products.summary` | daily 04:00 | refuses when articles don't support it; marks `needs-review` |
| `extract-evidence.mjs` | `company_evidence` | daily 03:00 | validation lib + tests; sources cannot be fabricated |
| `assess-maturity.mjs` | maturity on both tables | manual | validation lib + tests; skips products with no evidence |

The last two establish the pattern the Landscape should follow: **a tested validation layer
between the model and the database, and source URLs the model cannot invent** — it cites items
by number and the caller substitutes real URLs from our own tables.

---

## 5. Geographic data — and a problem

| Field | Fill | Usable? |
|---|---|---|
| `hq_country` | 2,042 / 2,287 (90%) | **yes** |
| `hq_city` | 365 (16%) | partially |
| `hq_region` | 392 (17%) | **no** |
| `latitude` / `longitude` | — | unused |

`hq_region` mixes three incompatible things: continents (`Europe` 23), countries (`Germany` 11,
`France` 7, `Norway` 3) and sub-national regions (`Bavaria` 5, `Île-de-France` 10, `Virginia` 6,
`Moscow Oblast` 4). Filtering `hq_region='Europe'` returns **23 companies**, which is wrong by
more than an order of magnitude.

**Europe must be derived from `hq_country`.** Doing so against a 34-country list gives:

- **791 European companies**
- **141 of them already carry a C-UAS capability tag**
- 230 companies have no country at all and are invisible to any geographic filter

Recommendation: a `countries` reference table (`code`, `name`, `region`, `is_eu`, `is_nato`,
`is_european`) rather than a hard-coded list in each script. It also fixes the "is Turkey
European" question in one place, and the catalogue's region grouping can read the same table.

---

## 6. Existing source / evidence fields

| Field | Where | State |
|---|---|---|
| `source_urls text[]` | companies, products | 87% / 80% filled |
| `confidence` | companies, products | 100%, but 87% are `low` |
| `last_reviewed_at` | companies | **never written — 0 rows** |
| `enrichment_status` | companies, products | `llm` / `web` / `news-derived` / `needs-review` |
| `company_evidence` | new table | the real evidence model — see `DATA-MODEL.md` §5 |
| `maturity_source_urls` + `_assessed_at` / `_by` / `_confidence` | companies, products | the per-claim pattern |

`last_reviewed_at` is the brief's `last_verified_at`. The column exists; nothing populates it.
That is a pipeline gap, not a schema gap — every enrichment script should stamp it.

---

## 7. What can be reused

**Reuse as-is, no change:**
- the whole maturity model, including the five levels, the evidence constraint and the roll-up view
- `company_evidence` as the evidence store
- `sectors` + `company_sectors` as the taxonomy mechanism
- `companies.hq_country`, `source_urls`, `confidence`, `enrichment_status`
- `last_reviewed_at` (start writing it)
- the validation-lib + test pattern from `lib/evidence.mjs` and `lib/maturity.mjs`

**Reuse with extension:**
- `sectors` — add the 15 Landscape terms as children of the existing four
- `company_sectors` — add per-assignment provenance (§10)

**Do not reuse:**
- `hq_region` — see §5
- `product_sectors` — empty; decide whether product-level categorisation is in scope at all

---

## 8. Proposed schema changes — the minimum

Four changes. Nothing is dropped, nothing existing is rewritten.

### 8.1 Taxonomy rows (data, not schema)

Insert 15 new `sectors` rows with `kind='cuas_capability'` and `parent_id` pointing at the four
existing `cuas-*` rows. **No DDL at all** — the `sectors` table already has `parent_id` and `kind`.

### 8.2 Provenance on `company_sectors`

```sql
alter table company_sectors
  add column confidence  text,            -- low | medium | high
  add column source_urls text[] not null default '{}',
  add column assigned_by text,            -- editor | llm | import
  add column assigned_at timestamptz,
  add column note        text;
```

Plus the same evidence rule the maturity columns carry: an LLM-assigned category must cite at
least one source. `company_sectors` currently has no primary key beyond `(company_id, sector_id)` —
confirm that before adding.

### 8.3 Snapshots

```sql
create table landscape_snapshots (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,       -- 'europe-cuas-2026-q4'
  title        text not null,
  scope        jsonb not null,             -- {region:'europe', taxonomy:'cuas', countries:[...]}
  taken_at     timestamptz not null default now(),
  published_at timestamptz,                -- null = draft
  notes        text
);

create table landscape_entries (
  snapshot_id  uuid not null references landscape_snapshots(id) on delete cascade,
  company_id   uuid not null references companies(id),
  company_name text not null,              -- copied on purpose, see below
  hq_country   text,
  categories   text[] not null default '{}',   -- sector slugs, frozen
  maturity     text,
  maturity_rationale text,
  evidence_count int not null default 0,
  product_count  int not null default 0,
  primary key (snapshot_id, company_id)
);
```

**`landscape_entries` is denormalised deliberately.** A snapshot is a publication: what it said
in Q4 must not change when a company is re-categorised in Q1. Joining live rows at read time
would silently rewrite history and make version comparison meaningless. The copied `company_name`
and `hq_country` are the point, not redundancy.

### 8.4 Countries reference

```sql
create table countries (
  code text primary key,     -- ISO-3166 alpha-2
  name text not null,
  aliases text[] not null default '{}',   -- 'UK', 'Great Britain', 'Holland'
  region text,               -- Europe | North America | …
  is_eu boolean, is_nato boolean, is_european boolean
);
```
`companies.hq_country` is free text and stays that way for now; the table resolves it. Later,
an FK once the values are clean.

---

## 9. How the controlled taxonomy should be stored

**Not as array columns.** The brief suggests `company_categories[]` and `technologies[]`. The
junction table already in place is better on every axis that matters here:

| | array column | `company_sectors` |
|---|---|---|
| "all companies in RF Jamming" | array scan | indexed join |
| Per-assignment evidence and confidence | impossible | one row, one set of columns |
| Renaming a category | rewrite every row | rename one `sectors` row |
| Referential integrity | none | FK |
| Counts per category for the UI | scan | group by |

Evidence per assignment is the deciding factor: "this company does RF jamming, and *here is why
we say so*" is a per-assignment fact. An array cannot carry it.

### The hierarchy

Two levels, using `sectors.parent_id`, with the four existing rows promoted to groups:

```
DETECTION              (cuas-detection, 52 companies already tagged)
  ├ RF Detection
  ├ Radar
  ├ EO/IR
  ├ Acoustic Detection
  └ Multi-Sensor Detection
TRACKING / IDENTIFICATION   (new group)
  ├ Sensor Fusion
  ├ AI / Computer Vision
  └ Command & Control         ← cuas-c2 already exists; becomes this leaf
DEFEAT                 (cuas-mitigation, 90 companies already tagged)
  ├ RF Jamming
  ├ GNSS Jamming / Spoofing
  ├ Interceptor UAV
  ├ Kinetic
  └ Directed Energy
INTEGRATED SYSTEMS     (cuas-integrated, 55 — is both group and leaf)
```

**This preserves all 208 existing assignments.** A company tagged `cuas-mitigation` today becomes
"DEFEAT group, leaf not yet determined" rather than being discarded. Re-classification to leaves
is then an enrichment job that starts from a known group — a much easier and cheaper question than
classifying from scratch.

A company belongs to as many leaves as apply; group membership is implied by the leaf.

`kind='cuas_capability'` rather than reusing `kind='capability'` keeps the Landscape vocabulary
separable from the eight generic sensor tags, which are unused but may yet be.

---

## 10. How evidence and confidence should work

Follow the pattern already established and tested, rather than inventing a second one.

**Three levels of claim, each with its own evidence:**

1. **Category assignment** — `company_sectors.source_urls` + `confidence` + `assigned_by`.
   "Why do we say this company does RF jamming?"
2. **Maturity** — already built: `maturity_source_urls`, `_rationale`, `_assessed_at`, `_by`,
   `_confidence`, with a database CHECK refusing any maturity that has no source and no date.
3. **Underlying facts** — `company_evidence` rows (contracts, deployments, customers), each
   carrying its own `source_url` and `confidence`. Maturity is *derived* from these.

**The rule that makes this work, and it must be kept:** the model never writes a URL. It cites
sources by their number in a list it was shown, and the code substitutes real URLs from our own
tables. A fabricated citation has nothing to resolve to. This is enforced in
`lib/evidence.mjs` and `lib/maturity.mjs` and covered by tests.

**Confidence should be set by rule, not vibes:**

| | high | medium | low |
|---|---|---|---|
| Category | manufacturer's own site or datasheet | defence press | inferred from a product name |
| Maturity | multiple independent sources | one credible source | single passing mention |

**Staleness:** `maturity_assessed_at` plus a 24-month horizon, and `last_reviewed_at` for the
company record. A `deployed` judgement from three years ago is not the same claim as one from
last month, and the Landscape should show the date next to the level.

---

## 11. How snapshots should work

A snapshot is **taken**, not computed on demand:

```
npm run landscape:snapshot -- --slug europe-cuas-2026-q4
   ├ select companies where hq_country is European AND has ≥1 cuas_capability sector
   ├ freeze: name, country, categories, maturity, rationale, counts
   ├ write landscape_snapshots + landscape_entries
   └ published_at stays null until someone publishes it
```

Comparison is then a plain query between two `snapshot_id`s — companies added, removed, moved
category, moved maturity level. That is the Landscape's actual product: not the list, the *delta*.

**Why not a temporal/history table on `company_sectors`:** it would record every intermediate
correction — an LLM mis-tag at 03:00 and its fix at 04:00 both become history. A snapshot records
what was *published*, which is what a reader can be held to.

The live tables stay the working copy. Snapshots are the record. Both are needed.

---

## 12. Risks

**1 — Coverage is the real risk, not schema.** 791 European companies are in the database and 141
carry any C-UAS tag. The true European C-UAS landscape is larger, and every company here arrived
by being named in a news article (§3). A vendor with no press coverage does not exist in this
database. **A Landscape published from this data is a map of who gets written about.** Either
accept and state that explicitly, or add a directory-import path before publishing. This should be
decided before any schema work.

**2 — The entity links are noisy.** `article_companies` is produced by LLM extraction and is often
wrong: Lockheed Martin's four most recent linked articles were a Ukrainian medevac drone, a UK
policy question and Boeing's MQ-25. Any classification job reading them must be built to reject,
and must be measured on its refusals, not its output volume. See `DATA-MODEL.md` §10.

**3 — 230 companies have no country** and would be silently absent from a geographic Landscape.
They need filling or an explicit "unknown" bucket.

**4 — `hq_region` will be reached for by someone.** It looks like the right field and is not (§5).
Worth a comment on the column itself.

**5 — Re-classifying 208 companies into 15 leaves is LLM work** with the same confident-wrongness
risk that has bitten this project twice (an F/A-18 matched to "Hornet"; the MQ-9 Reaper refused as
unidentifiable). Validation layer and a hand-checked sample before it runs unattended.

**6 — `company_evidence` has RLS enabled with zero policies.** The catalogue site cannot read it.
Fine today; it will render an empty section the moment the frontend tries to show evidence.

**7 — `publication_status` is `live` on all 2,287 companies.** There is no draft gate any more, so
anything written to a company is public on the next build. The Landscape needs its own gate —
`landscape_snapshots.published_at` provides it.

---

## 13. Implementation sequence

Each step is independently useful and independently revertible.

| # | Step | Depends on | Notes |
|---|---|---|---|
| 0 | **Decide the coverage question** (risk 1) | — | a product decision, not a technical one |
| 1 | `countries` table + backfill `hq_country` for the 230 blanks | — | no LLM needed for most |
| 2 | Insert the 15 taxonomy rows under the existing four | — | data only, no DDL |
| 3 | Provenance columns on `company_sectors` | 2 | small migration |
| 4 | Let the evidence job run and accumulate | already running | ~6 weeks for 2,000 companies |
| 5 | Classify European C-UAS companies into leaves | 2, 3, 4 | starts from known groups; validation lib + tests first; hand-check a sample |
| 6 | Run maturity over the classified set | 4, 5 | already built, currently manual |
| 7 | `landscape_snapshots` + `landscape_entries` + the snapshot script | 5, 6 | |
| 8 | Frontend: Landscape view in the catalogue repo | 7 | reads a published snapshot, not live tables |
| 9 | Diff view between two snapshots | 7, 8 | the actual product |

Steps 1–3 can start immediately and are low-risk. Step 5 is the expensive one and should not
start before step 4 has produced evidence to classify against.

---

## 14. Keeping the future options open

The brief lists five things not to build yet. What this design does for each:

| Future need | Already possible? |
|---|---|
| **Company change logs** | Partly. `updated_at` exists; snapshots give published-state diffs. A proper log wants an audit table on `companies` and `company_sectors` — the provenance columns in §8.2 are the first half of it. |
| **Event tracking** | `company_evidence` is already an event store in all but name: dated, typed, sourced, with a counterparty. Adding `kind` values is a one-line change to a CHECK. |
| **Historical backfill** | Snapshots are append-only and carry `taken_at` separately from `published_at`, so a snapshot can be *reconstructed* for a past date and inserted without disturbing the series. |
| **UAV360 Index** | A per-snapshot computation over `landscape_entries`. The denormalised entries are exactly the right input — an index recomputed from live tables would change retroactively, which is the thing to avoid. |
| **Supplier / component intelligence** | `company_relationships` exists (46 rows, 5 types). A `supplies` / `component_of` type fits without new tables. `products.category='Other'` already holds 323 component records. |

The one decision that would be expensive to reverse is §9: array columns versus the junction
table. Arrays would make per-assignment evidence, the Index, and change logs all significantly
harder. That is the main reason not to follow the brief literally there.

---

## 15. Open questions

1. **Coverage** (risk 1) — publish from news-derived data and say so, or build an import path first?
2. **Is Turkey European** for this Landscape? Israel? Ukraine is presumably yes. The `countries`
   table makes this one flag, but someone has to set it.
3. **Products as well as companies?** `product_sectors` exists and is empty. The brief says
   "companies and products"; this plan covers companies, which is where the data is.
4. **Who may assign categories** — same answer as maturity (the LLM publishes), or stricter
   because a category is harder to walk back than a level?
5. **Snapshot cadence** — quarterly, or on demand when a report is written?
