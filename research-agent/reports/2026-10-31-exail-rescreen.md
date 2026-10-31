# Exail — full re-screen against the landscape criteria

**Date:** 2026-10-31 · **Status:** review only. No database write, no merge, no landscape
change, no publication change. Option **E2** was chosen: ECA Group / Infotron is **not**
merged into Exail yet.
**Supersedes the ECA/Exail section of** `2026-10-31-composite-correction-package.md`, three
of whose four findings turn out to be wrong once the screen is widened past aircraft
manufacturing.

---

## 1. The cluster is four records, not two

| Record | ID | Landscape | Sectors | Products |
|---|---|---|---|---|
| **Exail** | `8517768e-5a14-4ac2-8296-692a39e2a0a0` | **excluded** | **0** | 18 |
| **ECA Group / Infotron** | `92299e36-58f5-4c27-9486-20bae0ab2d26` | **included** | 1 (`uav`) | 1 (IT180 STH-U) |
| **iXblue** | `e99326a6-0edb-4920-bfe2-814b2e36281c` | **needs_review** | 0 | 0 |
| **Exail Robotics** (Belgium) | `ffa0380d-6768-4846-a396-49d7faca91c9` | excluded | 0 | 0 |

The iXblue record's own screening note already says *"Resolve the cluster before any
classification."* That is still the right instruction, and it is why E2 was the right call.

## 2. Why Exail is excluded, and why the reason does not hold

Its screening note, Batch 01:

> *"queued products (DriX, A-18M, DORCUS) are maritime/underwater. UMIS integrates
> third-party UAVs rather than establishing Exail as an aerial UAV OEM. Outside the aerial
> Landscape until Exail-owned aerial evidence appears."*

**The test applied was "is Exail an aerial UAV OEM".** That is not the landscape's test. The
taxonomy has a whole `UAV Ecosystem` branch — `Navigation / GNSS` (13 companies),
`Components` (19), `Autonomy / AI` (37), `Payloads` (27), `Propulsion`, `Sensors` — and the
landscape already admits suppliers on it who build no aircraft at all:

- **SBG Systems** — French, inertial navigation and georeferencing, `eco-navigation`
  (primary) + `eco-components`, assigned by an editor in the batch-15 reconciliation,
  **included**. Exail's direct competitor in the same country and the same market.
- **Civitanavi Systems** — Italian, "inertial navigation and stabilisation systems for
  airborne and defence platforms. **An ecosystem supplier, not a UAV OEM**" — the record's
  own description says so — `uav` + `eco-navigation`, **included**.
- **Septentrio** (GNSS receivers), **Liebherr Aerospace** (tier-1 aerospace components),
  **Photonis / Exosens** (image intensifiers) — all included, none a UAV OEM.

Exail was judged on a bar the landscape does not use for anyone else.

## 3. Current evidence versus legacy ECA/IT180 material

The earlier package said the newest IT180 material on exail.com is a 7 December 2015 ECA
press release. **That is wrong**, and so are two of its other three findings.

| Earlier finding | Verdict | Current evidence |
|---|---|---|
| "Exail's current robotics page lists no aerial family" | **Half right** | The product range has no aerial *platform* page — but it does carry a Defense category **"Land and air navigation & pointing"** (INS, IMUs, stabilised platforms) |
| "Newest IT180 material is a 2015 ECA press release" | **Wrong** | Exail newsroom, **1 July 2023**: the team fielded "two of **its** IT180-60 aerial drones", quoting **"Lionel Rosellini, Director of the Land and Air robotics division at Exail"** |
| "The 12 UAV-categorised products are all maritime" | **Right** | Confirmed below, and worse than described |
| "Exail has zero `company_sectors` rows" | **Right** | Confirmed — and this is the real mechanical blocker |

**Exail-owned, post-rebrand, aerial evidence — all primary:**

1. **Airbus SIRTAP tactical UAS, 12 May 2025** (exail.com newsroom). Exail and Grafinta
   supply the **UmiX-40 IMU** for the navigation system of Airbus's SIRTAP, which the
   release calls an "unmanned aerial system (UAS)", for navigation in GNSS-denied
   conditions "throughout all phases of flight". A named aerial programme, a named Exail
   product, current. This is precisely the "Exail-owned aerial evidence" the exclusion note
   said it was waiting for.
2. **"AIR & LAND DEFENSE ROBOTIC SOLUTIONS" brochure**, Exail-branded, created
   2023-01-29: *"Exail, a global partner for Air & Land defense robotic solutions"* and
   *"Exail solutions – that range from Unmanned Ground Vehicles (UGVs), **Unmanned Aerial
   Vehicles (UAVs)** and Teleoperation Systems… to Command & Control (C2) systems"*, with a
   C2 system *"able to control multiple UGVs **and UAVs**"*.
3. **UMIS datasheet**, Exail-branded, 2022-07-29 V0002: *"Relying on its 60 years expertise
   in providing the most high-performance unmanned systems for missions at sea **and in the
   air**, Exail offers… drone-based systems"*, and the toolbox *"comprises a wide range of
   unmanned vehicles such as USV, AUV, ROV, MIDS, Towed systems **and Unmanned Aerial
   Vehicles (UAV)**."* The open-architecture paragraph says third-party drones **may also**
   be integrated. **The exclusion note read that second sentence as if it replaced the
   first.** It does not.
4. **Eurosatory 2026 DORCUS listing** names Exail for *"inertial navigation solutions
   already fielded by French armed forces"*.

**Counter-UAS, secondary but current:**

5. **Neptis, 9 October 2026** (exail.com): Exail's new maritime surveillance system lists
   **"Counter-Uncrewed Aerial Systems (C-UAS)"** among its mission areas.
6. **DriX H-9 selected for counter-UAS research, April 2026** — but read this carefully:
   the DriX is the *carrier*; a third party integrates the C-UAS payload. It is context,
   not grounds.

## 4. The 12 products categorised `UAV` — every one is wrong

None is aerial. Exact IDs, all `live`, all owned by `8517768e-5a14-4ac2-8296-692a39e2a0a0`:

| ID | Name | Actually is | Proposed |
|---|---|---|---|
| `1de976af-ff68-498c-b855-7c9ac2514e4d` | A-18M | A18-M autonomous **underwater** vehicle, MCM | category → `Other`; name → `A18-M` |
| `c87b1319-f15d-48d3-a7fd-a09a49893e57` | DriX | **series name**, not a product | retire as a product |
| `b9f83dc2-3ae3-4ef0-9be1-349000e17688` | DriX H-8 | DriX H-8 USV, 7.71 m, 1.6 t | category → `Other` |
| `2dbd66ec-3f36-4a0a-87ff-0561e2bed85e` | DriX O-16 | DriX O-16 USV, 15.75 m, 10.5 t | category → `Other` |
| `3515b298-4a7d-4cff-a1f4-ec6a7bf24726` | Exail A27 | **no source found anywhere** | unpublish pending evidence |
| `e38073ce-dce9-4c86-b5cd-9214cad0963e` | H-8 | bare designation | **duplicate** |
| `9511089c-3fcf-4cc8-b884-acfb13c6a97d` | H-9 | bare designation | **duplicate** |
| `3e1dcc70-b839-4a78-a87b-d9dbe3678205` | Inspector | Inspector 125 / 90 **surface** vessel | category → `Other`; name → `Inspector 125` |
| `6efaadb9-8c45-4695-ac50-49e3fdba53b0` | K-Ster | K-Ster C expendable mine-disposal **ROV** | category → `Other` |
| `b9dbf15b-ce58-4fa5-afa2-751c96ec1d6e` | Neptis | maritime surveillance **system**, Oct 2026 | category → `Software` or `Other` |
| `0aa9487c-aa91-4bb2-be9c-68b3c3f6df62` | O-16 | bare designation | **duplicate** |
| `8b1f6503-d1cc-416f-ad98-c39dce97115f` | Oryx | **series name**, not a product | retire as a product |

Two more are already `Other` and correctly so: `513779b6…` DriX H-9, `b0d223b9…` Oryx O-16.
One is wrong in the other direction: **`17f660ef-102d-4998-82b6-88174c68af1b` DORCUS,
categorised `Counter-UAS`, is not an Exail product at all** — it is a SOFRAME / MAC JEE
armoured fire-support vehicle unveiled at Eurosatory 2026, in which Exail appears only as
an inertial-navigation supplier. **Proposed: detach from Exail or unpublish.**

### Families versus genuine variants

The instruction asked to tell these apart, and the answer only became clear with the
**9 October 2026** Neptis launch:

- **DriX** is the *civil* USV series: genuine variants **H-8**, **H-9**, **O-16**.
- **Oryx** is a *new defence* USV family unveiled 9 Oct 2026, reusing the same
  designations: **H-8**, **H-9**, **O-16**. It draws on DriX hydrodynamics but is a
  separate line.
- So `DriX H-8` and `Oryx H-8` would be **genuine distinct products**. The bare
  `H-8`, `H-9`, `O-16` records are **ambiguous** — they cannot be assigned to either family
  from the record alone, and are almost certainly prefix-stripped duplicates.
- `DriX` and `Oryx` as standalone records are **family names masquerading as products**.

This is why "several are duplicates of each other" was too loose a reading: three records
are duplicates, two are family names, and the rest are real but mis-categorised.

## 5. Missing taxonomy — the actual blocker

**Exail has zero `company_sectors` rows.** The landscape build skips any company with no
explicit taxonomy assignment (`if (!explicit.length) continue;`), so Exail could be flipped
to `included` and still not appear. Any admission has to add the sector rows in the same
change, or the site and the database will disagree.

Proposed, mirroring SBG Systems exactly:

| sector_id | sector | is_primary | basis |
|---|---|---|---|
| `157db255-fce0-48ca-bf3a-6724f67aba5d` | Navigation / GNSS | **true** | UmiX-40 IMU on Airbus SIRTAP; "Land and air navigation & pointing" product line |
| `e73703e1-38b0-4bee-beea-ac1a3d8d2582` | Components | false | IMUs and INS supplied into third-party airborne platforms |

`confidence: high`, `assigned_by: editor`, with the SIRTAP release and the product-range
page as `source_urls`.

## 6. Landscape recommendation

**Admit Exail on the ecosystem-supplier limb — Navigation / GNSS — not as a UAV OEM.**

The evidence that satisfies the exclusion note's own condition is the SIRTAP IMU
selection: a named, current, Exail-owned supply into a named unmanned *aerial* system. On
the standard already applied to SBG Systems and Civitanavi, that is sufficient, and
continuing to exclude Exail while including its French competitor for the same capability
is not defensible.

**What I am not claiming.** Exail is not an aerial UAV OEM today. The IT180 has no current
product page, and the 2023 "its IT180-60" reference is operational use, not a marketed
line. The admission rests on navigation and components, and the screening note should say
exactly that so nobody later reads it as an aircraft claim.

### The count — stated honestly, not steered

- Admitting Exail on its own merits: **567 → 568**.
- Merging ECA Group / Infotron into Exail afterwards: **568 → 567**.
- Merging without admitting Exail (the earlier Option E1): **567 → 566**.

The 567 that falls out of the first two is **a coincidence of two independent decisions,
not a target**. Each should be taken on its merits; if only the merge is approved, the
honest number is 566 and the site should say 566.

## 7. How a future merge would preserve everything

Once Exail carries taxonomy and a screening verdict of its own, the merge is mechanical:

- **Products.** Move `3b53c4ed-299e-4621-9d1a-a93d0ba47354` (IT180 STH-U) to Exail in
  **both** `products.company_id` **and** `product_companies` — ownership is stored twice and
  the generator reads only the first. The public product URL is derived from the product
  *name*, so the IT180 page does not move.
- **Evidence.** The IT180 record carries the only substantive description in the cluster
  (Infotron origin, contra-rotating coaxial rotors, 1.8 m). It transfers with the row.
- **Aliases.** Add `ECA Group` and `Infotron` as `former_name` on Exail. Exail already holds
  `Exail Technologies`, `Gorgé`, `Gorgé SA`, `Groupe Gorge` — see the defect below.
- **Redirects.** `eca-group → eca-group-infotron` already exists and would point at a
  retired slug. GitHub Pages cannot chain, so **repoint it to `exail`** and add
  `eca-group-infotron → exail`. Both are company-kind rows in `slug_redirects`
  (PK `from_slug`).
- **Landscape.** Delete the ECA row; Exail's own row carries the verdict. Membership is
  keyed on `company_id`, so nothing else moves.

## 8. Further defects found, none fixed here

1. **The Exail record conflates three legal entities.** It holds aliases `Exail
   Technologies`, `Gorgé`, `Gorgé SA` and former name `Groupe Gorge`. Groupe Gorgé is the
   listed *parent*; Exail Technologies is the listed holding company; Exail is the operating
   company. The `gorge → exail` redirect already bakes this in. Needs an ownership decision,
   which is not authorised here.
2. **`iXblue` is still `needs_review` with 0 sectors and 0 products** and should be resolved
   in the same pass — it is half of the entity that became Exail.
3. **`Exail Robotics` (Belgium)** is excluded on maritime grounds that look sound, but it
   should be re-checked against the same widened criteria rather than inherited.
4. **Thales agreed in July 2026 to a 35.51% controlling stake in Exail Technologies**,
   heading to full ownership by 2028. Recorded, not written — ownership changes are not
   authorised.

## Decisions this leaves

1. **Admit Exail to the landscape** as a Navigation / GNSS + Components ecosystem supplier,
   adding the two sector rows in the same change? (567 → 568)
2. **Then merge ECA Group / Infotron into Exail**, per section 7? (568 → 567)
3. **Approve the product corrections** in section 4 — 12 recategorisations, 3 duplicates,
   2 family-name records, 1 unverified product, 1 false attribution (DORCUS)?
4. **Resolve `iXblue` and re-check `Exail Robotics`** in the same pass?
5. **Record the Groupe Gorgé / Exail Technologies / Exail ownership structure** instead of
   carrying it as aliases on one record?

## Sources

- Exail, *"Exail to equip Airbus SIRTAP tactical UAS with advanced inertial navigation technology"*, 12 May 2025 — exail.com/news
- Exail, *"Exail air and land robots shine during French Army CoHoMa Challenge"*, 1 July 2023 — exail.com/news
- Exail, *"Exail unveils Neptis, a new model of maritime surveillance built on distributed autonomy"*, 9 October 2026 — exail.com/news
- Exail, *AIR & LAND DEFENSE ROBOTIC SOLUTIONS* brochure, created 2023-01-29
- Exail, *UMIS datasheet*, 2022-07-29 V0002 — exail.com/media-file/9729
- Exail product range — exail.com/product-range (Defense → "Land and air navigation & pointing")
- Exail, *DriX Series — Uncrewed surface vessels* and *UmiX Series IMU* product pages
- Naval News, *"Exail Introduces Neptis Uncrewed Maritime Surveillance System"* and *"Exail USVs Set for U.S. Navy and Coast Guard Evaluations"*, October 2026
- Naval News / Janes, *"Exail's DriX H-9 USV selected for Counter-UAS research"*, April 2026
- Euro-SD, *"Eurosatory 2026: official presentation of the DORCUS system by MAC JEE and SOFRAME"*, June 2026
