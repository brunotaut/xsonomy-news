# Company data model

What we want to know about every company, where each field lives, and what is still missing.
Companion to `ARCHITECTURE.md`. Figures measured against the live database on 2026-10-22
(2,268 companies, 3,385 products).

The headline: **most of this model already exists in the database.** The problem is not the
schema, it is that the fields are empty. Two things are genuinely missing — maturity, and a
place to record evidence of real-world use. Those are specified in sections 4 and 5.

---

## 1. The requested fields, and where they live today

### Basic

| Field | Column | Filled |
|---|---|---|
| Company | `companies.name` | 2,268 / 2,268 — 100% |
| Country | `companies.hq_country` | 2,042 — **90%** |
| City | `companies.hq_city` | 365 — 16% |
| Website | `companies.website` | 1,059 — 47% |
| Founded | `companies.founded_year` | 411 — 18% |
| Description | `companies.description` | 612 — 27% |
| Company type | `companies.company_type` | 1,896 — **84%** |

`company_type` already has a working vocabulary: `prime`, `tier1`, `tier2`, `sme`, `startup`,
`division`, `state_owned`, `jv`, `distributor`, `research_institute`, `university`, `other`.

### Classification

| Field | Where | Filled |
|---|---|---|
| Primary category | `company_sectors` where `is_primary` | 208 companies — **9%** |
| Secondary categories | `company_sectors` where not `is_primary` | 502 companies have any sector — 22% |
| Technologies | `sectors` where `kind = 'capability'` | 12 defined, 5 in use |
| UAV / C-UAS / Dual | *missing at company level* | — |
| Hardware / Software / Both | *missing* | — |

`sectors` is already a proper three-level vocabulary — `domain` (UAV, Sensors, Counter-UAS,
Effectors, EW, ISR, C2 & Software, Space & SATCOM), `capability` (Radar, RF detection, EO/IR,
Lidar, Acoustic, Passive radar, Hyperspectral, Satellite imagery, and the four C-UAS roles),
and `platform` (fixed-wing, multirotor, VTOL, loitering munition, smallsat).

So "Primary category" and "Technologies" need no new columns. They need filling: seven of the
twelve capability sectors are attached to zero companies.

### Products

| Field | Where | Filled |
|---|---|---|
| Product names | `products.name` | 3,385 products |
| Product category | `products.category` | 100% — UAV 1,417 · Sensor 493 · Counter-UAS 472 · Software 380 · Other 323 · Effector 300 |
| Product URL | `products.website` | 556 — 16% |
| Short description | `products.summary` | ~2,100 — 62% |
| Company → products | `products.company_id` + `product_companies` | 907 companies have at least one — **40%** |

`product_companies` (2,455 rows) is the many-to-many, for products with more than one maker.

### Commercial

| Field | Where | Filled |
|---|---|---|
| Customers | *missing* | — |
| Known contracts | *missing* | — |
| Partners | `company_relationships` | 46 rows total |
| Funding | `companies.total_funding` | **0 rows** |
| Deployment status | *missing* | — |

See section 5 — these four belong in one table, not four columns.

`investors` exists (197 rows) but has no link to `companies`, so it is currently unreachable.

### Evidence

| Field | Column | Filled |
|---|---|---|
| Source | `companies.source_urls` | 1,979 — **87%** |
| Last verified | `companies.last_reviewed_at` | **0 rows — never written** |
| Confidence | `companies.confidence` | 100%, but 1,977 of them are `low` |

`last_reviewed_at` is the "Last verified" field, already in the schema. Nothing has ever set it.
That is a pipeline gap, not a schema gap.

---

## 2. What is actually missing

Only five things:

1. **Maturity** — on products and on companies (section 4).
2. **Evidence of real-world use** — customers, contracts, deployments, partners (section 5).
3. **`companies.offering_type`** — hardware / software / both / services.
4. **`companies.use_class`** — UAV / C-UAS / dual.
5. **Writing `last_reviewed_at`** — no new column, just populate it.

Everything else in the brief is already modelled.

---

## 3. Priority — the critical path

The stated first-stage priority is **Company → Country → Category → Technology → Products → Sources**.
Measured today:

| Step | State |
|---|---|
| Company | 2,268 rows — done |
| Country | 90% — nearly done |
| Category | **9% have a primary category** — the real gap |
| Technology | capability sectors largely unused — the real gap |
| Products | 40% of companies have a linked product |
| Sources | 87% — nearly done |

So the first stage is not a schema job at all. It is ~2,000 companies needing a primary category
and a technology tag. Worth noting before any migration is written.

---

## 4. Maturity — the UAV360 Maturity Classification

### It goes on products first, companies second

The five levels mix two different subjects:

- "prototype / startup / limited evidence" describes a **company**
- "product commercially available", "confirmed operational deployment" describe a **product**

If maturity is stored only on the company, a firm with one deployed system and four prototypes
makes all five look deployed, and the catalogue states something untrue. If it is stored only on
the product, companies cannot be ranked or filtered.

So it goes on both:

- `products.maturity` — assessed from evidence about that specific product. This is the fact.
- `companies.maturity` — defaults to the highest maturity among the company's products, and can
  be overridden by hand. This is the summary.

The default is a suggestion, not a trigger. A company can be set to `scaled` on production volume
even when no single product qualifies, and the override is recorded as such.

### The five levels

| Level | Rank | What has to be true |
|---|---|---|
| `emerging` | 1 | Announced, a prototype shown, or a startup with a stated product. Single-source or vendor-only evidence. |
| `demonstrated` | 2 | A public demonstration, trial, test-range event or exercise — witnessed by somebody other than the vendor. |
| `commercial` | 3 | Can be bought: a price, a datasheet with ordering information, a distributor, a catalogue listing. |
| `deployed` | 4 | Confirmed operational use by a **named** user — a unit, agency, operator or force. Not a trial. |
| `scaled` | 5 | Several of: multiple named customers, multi-year or multi-unit contracts, serial production figures, separate deployments. |

### It is a ranking, not a ladder

`deployed` does not require `commercial` first. A loitering munition used in combat but never
offered for sale is `deployed` and was never `commercial`. The rank orders by **strength of
real-world evidence**, not by stages a product has passed through.

This is worth stating plainly, otherwise somebody will eventually "correct" the data to make it
monotonic and destroy the signal.

### It is an opinion, so it carries its receipts

This is UAV360's reading of the evidence, not an objective fact, so a bare label is not enough.
Every maturity value stores:

| Column | Meaning |
|---|---|
| `maturity` | the level |
| `maturity_rationale` | one or two sentences: what evidence supports this |
| `maturity_source_urls` | the links behind it — **at least one required** |
| `maturity_assessed_at` | when it was judged |
| `maturity_assessed_by` | `editor` / `llm` / `import` |
| `maturity_confidence` | `low` / `medium` / `high` |

The "at least one source" rule is enforced in the database, not by convention. Without it the
field decays into guesswork within a few months and cannot be audited afterwards.

### Who sets it

**The LLM publishes directly.** There is no editor queue: an assessment written by the
enrichment pass goes live, recorded as `maturity_assessed_by = 'llm'`.

That makes the evidence rule the *only* guard, so it has to be real. The enrichment script
must cite source URLs it actually retrieved and read in that run — never a URL recalled from
training, and never a plausible-looking link it has not fetched. A maturity value whose
sources do not exist is worse than no maturity value, because it looks checked.

Two things make this recoverable rather than permanent:

- Every row records who assessed it, so a bad batch can be found and reverted in one
  statement (`where maturity_assessed_by = 'llm' and maturity_assessed_at > …`).
- Nothing overwrites an editor. `maturity_is_override` on companies, and a non-`llm`
  `maturity_assessed_by` on products, mark human judgements the automation leaves alone.

Worth knowing going in: twice on this project unreviewed automation has been confidently
wrong on exactly the best-known items — the image search matched an F/A-18 to "Hornet", and
the summary pass refused the MQ-9 Reaper and AMRAAM as unidentifiable. Maturity is a
judgement published under the UAV360 name, so it is worth spot-checking the first live batch
against twenty products you already know, and keeping the revert statement to hand.

### On the site

Always labelled **"UAV360 maturity"**, never a bare word like "Deployed", with the rationale
available on the product and company pages and the assessment date shown. A reader must be able
to tell our judgement from a vendor's claim.

### Staleness

`maturity_assessed_at` plus a **24-month** review horizon gives a report of what needs
re-checking — the same mechanism as `last_reviewed_at`. A `deployed` judgement from three years
ago is not the same claim as one from last month.

---

## 5. Evidence of real-world use

Customers, known contracts, deployment status and partners are four names for one thing: **a
dated, sourced claim that somebody bought, used or worked with this.**

As four text columns they would be unfillable, unverifiable and impossible to count. As rows they
are searchable, countable and each one carries its own source.

One table, `company_evidence`:

| Column | Notes |
|---|---|
| `company_id` | required |
| `product_id` | optional — set when the evidence is about one product |
| `kind` | `customer` · `contract` · `deployment` · `partnership` · `funding` · `demonstration` · `production` |
| `counterparty` | who: the customer, partner, investor or unit — free text, most are not in our DB |
| `counterparty_country` | |
| `summary` | one line |
| `occurred_on` / `occurred_year` | whichever is known |
| `value_amount` / `value_currency` | contracts and funding |
| `source_url` | **required** |
| `source_title` | |
| `confidence` | `low` / `medium` / `high` |

### Why this matters more than the maturity column itself

With this table, maturity stops being a hand-typed opinion and becomes a **summary of rows you
can see**. `scaled` means "there are five customer rows from five different counterparties, here
they are". Somebody can disagree with the label and still check the evidence.

Without it, maturity is a word somebody typed, and in a year nobody will remember why.

### Relationship to existing tables

- `company_relationships` stays for company-to-company links where **both** sides exist in our
  database (subsidiary, division, JV, acquisition). Most partners will not, so they go in
  `company_evidence` with `kind='partnership'` and a free-text counterparty.
- `investors` keeps its 197 named investor entities; funding rounds go in `company_evidence` with
  `kind='funding'`. No `company_investors` link table is needed for now.
- `companies.total_funding` becomes a derived total rather than a hand-entered number.

---

## 6. Suggested order of work

**Stage 1 — fill what exists.** Primary category and technology for ~2,000 companies; start
writing `last_reviewed_at` whenever any enrichment script touches a row. No migration needed.

**Stage 2 — the two new classification columns.** `offering_type` and `use_class` on companies.
Small migration, can be back-filled largely from the products a company already has.

**Stage 3 — `company_evidence`.** The table, then back-fill from the 6,100 articles already
linked to companies — contract and deployment reporting is most of what the news pipeline ingests.

**Stage 4 — maturity.** Products first, derived from the evidence rows; company roll-up after.
Doing maturity before stage 3 means judging it from memory instead of from evidence.

---

## 7. Decisions taken — 2026-10-22

The schema migration is **applied**. `products.status` is still empty — that needs
`npm run migrate:status`, which has not been run (§9).

1. **`products.use_class` is redefined** to `uav` / `cuas` / `dual` (§8).
2. **The LLM publishes maturity directly**, no editor queue (§4, "Who sets it").
3. **Review horizon is 24 months.**
4. **Production status moves out of `specs` into `products.status`** (§9).

---

## 8. Redefining `products.use_class`

Old vocabulary: `Civil` / `C-UAS` / `Dual-use`, on 225 of 3,385 rows — and every one of those
225 is a Sensor. It was only ever used to say what a *sensor* was for.

New vocabulary: `uav` / `cuas` / `dual`.

| Old | Rows | New | Why |
|---|---|---|---|
| `C-UAS` | 86 | `cuas` | same meaning |
| `Dual-use` | 98 | `dual` | same meaning |
| `Civil` | 41 | **NULL** | see below |

The 41 `Civil` rows are agricultural satellite constellations, industrial LiDAR, hyperspectral
crop analytics and acoustic cameras. They are neither UAV products nor counter-UAS products, so
there is no honest value for them in `uav / cuas / dual`. Mapping them to `uav` would put crop
sensors in the UAV column.

They go to NULL, which already means "not classified on this axis" for the other 3,160 rows, and
they can be reclassified by the enrichment pass under the new definition.

**Worth flagging:** NULL means "unknown", but for these 41 the truth is "neither". If that
distinction turns out to matter on the site, the fix is a fourth value (`civil` or `neither`)
rather than leaving them ambiguous. Not doing that now, because it was not the decision.

The same vocabulary is used by the new `companies.use_class`, so a company and its products can
be compared directly.

---

## 9. Moving production status into `products.status`

`products.status` exists, is unconstrained, and is empty on all 3,385 rows. Production status
currently lives in `specs` under the key `UAV · Production status`, on 408 products.

Those 408 rows hold about 160 distinct free-text values — `In production`, `in service`,
`Prototype/limited`, `Cancelled (program ended 2018)`, `Discontinued (AscTec acquired by Intel
2016)`, `Superseded by Orlan-3M`, and so on. The catalogue already normalises these at build
time in `xSonomy/scripts/generate-supabase.mjs` (`normaliseStatus`); that logic moves into the
database so the normalising happens once, not on every build.

**Two columns, not one**, because the free text carries information the vocabulary cannot:

| Column | Holds | Example |
|---|---|---|
| `products.status` | the normalised value — filterable | `cancelled` |
| `products.status_detail` | the original text — readable | `Cancelled (program ended 2018)` |

Vocabulary: `in_production` · `discontinued` · `prototype` · `development` · `cancelled` ·
`unknown`.

After the backfill, `UAV · Production status` is removed from `specs` — nothing is lost, because
the raw string is preserved in `status_detail`.

### Status is not maturity

They answer different questions and both are worth having:

- **status** — is it still being made? (`in_production`, `discontinued`, `cancelled`)
- **maturity** — has it been used in the real world? (`emerging` … `deployed`, `scaled`)

A discontinued system can be `deployed` — plenty are still in service. A product `in_production`
can be `emerging` if nobody has bought one yet. Neither column can be derived from the other.
