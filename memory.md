# UAV taxonomy enrichment — Cowork working log

Task: research + classify the 220 domain-only `category='UAV'` products in
`uav-enrichment-queue-2026-09.csv` into `product_taxonomy`, per
`cuas-uav-taxonomy-classification-2026-09.md`.
Both input files live in `~/Downloads/` (not in this repo).

Writes: `product_taxonomy` only, `source='web'`. `products` / `companies` never touched.

## Queue partition (done once, up front)

220 rows. The `flag` column marks 58; of those, **40 match the skip rules**
("not a UAV" / "crewed" / "programme" / "component" / "company name" /
"wrong manufacturer" / "duplicate") and are excluded from research.
The other 18 flagged rows are kept — their flags are domain notes
("USV/UGV — domain already corrected"), `hq_country` corrections, or "ambiguous name",
none of which is a skip reason.

**180 products to research → 8 batches (7×25 + 5).**

Note: 3 CSV rows (lines 87, 88, 117 — Blackbird, Peregreen V4, DA 15-N.ISS) have an
unquoted comma that splits the `flag` field across two columns. Rejoined when parsing.

### Skipped — 40 rows (rule 1)

| product | manufacturer | reason |
|---|---|---|
| AE200 | Aerofugia | crewed eVTOL |
| Ghost Shark | Albacore | wrong manufacturer + duplicate of Anduril Ghost Shark |
| Cheyenne II | Anduril | Bell crewed tiltrotor, wrong manufacturer |
| Midnight | Anduril | Archer crewed eVTOL, wrong manufacturer |
| KGK | ASELSAN | guided glide-bomb kit |
| A250 / Alia 250 / ALIA CTOL / ALIA VTOL | BETA Technologies | crewed |
| Universal Maritime Craft Aerial Delivery System | Capewell | airdrop system |
| EL9 | Electra | crewed eSTOL |
| e200X | ePlane Company | crewed eVTOL |
| Flock DFR | Flock | programme/service name |
| Cavorite X7 | Horizon Aircraft | crewed hybrid eVTOL |
| Joby Air Taxi / S4 | Joby Aviation | crewed eVTOL (Air Taxi also dup of S4) |
| UC65 Pro | KLM Defense | gimbal/sight payload |
| Blackbird / Peregreen V4 | Quantum Systems | wrong manufacturer (hobbyist record quads) |
| Squire | REGENT Craft | crewed seaglider |
| A3-001 / A3-01 | Saab | duplicates of A3 |
| SD-05 | SkyDrive | crewed eVTOL |
| Velocity XL-RG | Velocity Aircraft | crewed kit aircraft |
| Cassio S | Voltaero | crewed hybrid-electric aircraft |
| DA 15-N.ISS | Volz Servos | servo actuator (component) |
| V.MO | Xpeng | crewed eVTOL |
| Bell MV-75 / MV-75 / MV-75A Cheyenne II | — | crewed tiltrotor (FLRAA), 3 duplicates |
| Dovhyi Neptun | — | cruise missile |
| Fire Point | — | company name, not a product |
| FP-7.X | — | Fire Point ballistic missile |
| K3 Kraken | — | duplicate of Kraken K3 Scout (USV) |
| Launched Effects | — | US Army programme |
| MMCM / rMCM | — | USV programmes |
| Mwari | — | Paramount crewed ISR aircraft |
| Nyan OWE | — | duplicate of Callen-Lenz Nyan |
| Storm Fighter | — | UK MoD ACP programme |

---

## Batch 1 — products 1–25 of the work list (19 tagged, 6 not)

**Tagged (19), 123 rows written:** Pioneer, PW.ORCA, AirKamuy 150, Ghostfin, Thunder,
TEC800, Ascento Guard Dori USA v1, LUNA-2, Katana, MV250, Nyan, Eiger 3, CAVOK CK25VE,
Black Betty, CAPSTONE, Aspik, Kryla, MONTIS, Aero-200.

**Domain corrections applied** (aerial tag deleted, correct domain inserted, note
"filed under UAV — verify category"):
- **Pioneer** (ACUA Ocean) → `surface-usv`. 14.2 m SWATH USV, 25.7 t, 45 kW H2 fuel cell.
- **Ghostfin** (Albacore) → `underwater-uuv-auv`. 8.5 ft / 425 lb autonomous submarine.
- **TEC800** (Angatec) → `ground-ugv`. Tracked teleoperated firefighting robot, 500 kg.
- **LUNA-2** (ASELSAN) → `space-orbital`. **Not a UAV at all** — it is a LoRa IoT
  nanosatellite launched by SpaceX on 30 Mar 2026. Named like the EMT LUNA UAV family,
  which is probably how it entered the queue.

Ascento Guard was already `ground-ugv` — left alone, other facets added.

**Not tagged (6):**
- **Sky Garden** (Aerofugia) — unidentified after 2 searches. Aerofugia's only known
  aircraft is the crewed AE200 (already skipped). No product by this name found.
- **RIZER** (Aeryon Labs / Teledyne FLIR) — unidentified after 2 searches. Teledyne FLIR's
  line is SkyRanger / Black Hornet / Black Recon; no "RIZER".
- **Monolith One** (AEVEX Aerospace) — **not a UAV.** Monolith One is Divergent's metal
  3D printer, used on the AEVEX/Divergent drone-manufacturing partnership. Miscaptured
  as a product. *Recommend adding to the flag list.*
- **Caméléon** (Atechsys) — **R&D programme, not a marketed product.** "Caméléon 2" is a
  France 2030 consortium project (Atechsys + La Poste + ENSEA + ONERA). *Recommend flagging.*
- **Sea Lancer** / **Sea Sabre** (Dutch Naval Design) — unidentified after 2 searches each.
  DND's actual work is an unnamed 12 m ASW USV programme for the RNLN ASW frigates
  (design started Jul 2026, Thales FLASH sonar). Neither product name appears anywhere.
  *Probable fabricated names — recommend flagging.*

### Corrections spotted (logged only, not fixed)
- **PW.ORCA** — manufacturer is **Phoenix-Wings GmbH (Germany)**, not ADLC; ADLC is the
  Belgian operator that flew it in Singapore. `hq_country` "Singapore" is wrong on both counts.
- **Eiger 3** — manufacturer is **RigiTech (Switzerland, Lausanne)**, not CATUAV; CATUAV is
  the Spanish *operator* that received the AESA SAIL III authorisation. `hq_country` wrong.
- **Katana** — Avidrone Aerospace is **Canadian** (Waterloo/Ontario); `hq_country` says
  United States.
- **Aero-200** — sources conflict on MTOW: helis.com says 150 kg for the Aero2, while the
  Aero-200 rename is stated to reflect MTOW (i.e. 200 kg). Tagged Class II at medium.

---

## Batch 2 — products 26–50 of the work list (16 tagged, 9 not)

**Tagged (16), 85 rows:** X1 (ESOX), GhostFoiler, DriX, DriX O-16, Griffen, Squall,
Flock Alpha, Beluga, Tracer-160, White Knight, Wildfire, AIR Pro, AIR Speed, Heliblade,
YETI, Alphawing.

GhostFoiler / DriX / DriX O-16 were already `surface-usv` — verified, no domain change needed.

**Not tagged (9) — and this batch is where the queue's quality really shows:**

*Software / systems mis-filed as aircraft (4):*
- **SkyWeaver** (DZYNE, spelled "DYZNE") — an **AI mission operating system** built with
  Palantir, not an aircraft.
- **SkyStream** — a **video-streaming software platform**, and it belongs to **Garuda
  Robotics (Singapore)**, not Garuda Aerospace (India). Two different companies.
- **ZEE** — **Archer's AI foundation model** for aviation, not an Insitu/Boeing aircraft.
- **VERTI-GO** (Honeywell) — an **EU SESAR research project** on integrating eVTOLs and
  cargo drones into European airspace. Not an aircraft.
  ⚠ This one is already live on the public site at `xsonomy.com/uav/verti-go/`.

*Crewed aircraft (2):*
- **CX300** — this is **BETA Technologies' Alia CX300**, a crewed all-electric fixed-wing
  aircraft that has flown fare-paying passengers. "Electric Aviation Maven" is a press
  phrase, not a manufacturer.
- **Ellyon** (IAI) — a crewed EW/ISTAR mission suite integrated onto **large business jet
  platforms**. Not a UAV.

*Crewed + duplicate (1):*
- **Flying Tiger** — the nickname for the **V.MO passenger eVTOL**, which carries four
  people, and it is **Volkswagen Group China's**, not Geely's. Also a duplicate of the
  `V.MO` row already skipped (which itself is misattributed to Xpeng). Three errors in one row.

*Unidentified after 2 searches (2):*
- **X3** (ESOX Group) — ESOX has an X1 interceptor drone and an X2 UGV; no X3 found.
- **HP47** (Foxtech) — no such model in Foxtech's catalogue.

### Corrections spotted (logged only, not fixed)
- **Tracer-160** — Frost Unmanned is a **Swedish** defence manufacturer; `hq_country` says France.
- **AIR Pro / AIR Speed** — General Cherry (General Chereshnya) is **Ukrainian**;
  `hq_country` says Croatia. Croatia is where it is opening a production line, not its HQ.
- **Heliblade** — designed by **X721** (ex-Airbus/Arianespace engineers); Hemeria's role
  looks like partner/industrialiser rather than designer.
- **Beluga** naming clash: Flyde's Beluga (France, yacht delivery) is unrelated to
  **Eurolink Systems' BELUGA** (Italy). Different products, same name.
- **Squall** — built with Croatian firm **Orqa**, the same company flagged elsewhere in the
  queue for a wrong `hq_country` (SkyAgent 001 row).
- **Heliblade** weight vs role: 18 m wingspan but under 4 kg takeoff mass, so it tags
  Class I by weight while being a HALE platform by role. Tagged on weight, noted here.

---

## Batch 3 — products 51–75 of the work list (19 tagged, 6 not)

**Tagged (19), 128 rows:** J-110 Pegasus, Astore Levante, HALIA, Mule 28, Quencher, Max1,
Raptor 2, Kuryer, Kestrel, Spectr, Ayre CX, Cobra 600, DropShip, Ghost Hunter, Hunter Eagle,
A3, Saildrone Explorer, Saildrone Spectre, Argo-1.

**Domain corrections applied:**
- **Max1** (Maximus Labs) → `ground-ugv`. A modular UGV: 850 kg payload, tows 4.5 t, 16 km/h.
- **Kuryer** (NPO Android Technology) → `ground-ugv`. Tracked Russian UGV, 200 kg, 35 km/h.
- **HALIA** (LeVanta Tech) → **added** `surface-usv` alongside `aerial-uav-uas`. It is genuinely
  amphibious — a "float-and-fly" maritime drone that loiters on the sea for 30+ days between
  flights — so both domains apply. Flagged for category review rather than replaced.

Saildrone Explorer / Spectre were already `surface-usv` — verified.

**Not tagged (6):**
- **Flatbow** (Kraken Kinetics) — a **ground control system** (soldier-borne Crossbow GCS
  successor), not an aircraft; and in the US Army PBAS programme it pairs with **Neros'** Archer,
  not a Kraken Kinetics airframe. Kraken Kinetics makes the Terminus strike *payload*.
- **DiSCO** (L3Harris) — an **EW system architecture** (Distributed Spectrum Collaboration and
  Operations), flown as a payload on L3Harris Green Wolf and on a Seasats Lightfish USV.
- **DroneHive** (Rheinmetall) — a **launcher**: a 4x4 container grid of launch pods holding up to
  18 munitions. The aircraft in it is the FV-014 loitering munition, which is the row that should
  exist instead.
- **SkyAgent 001** — a **700 g passive RF SIGINT sensor** made by **Sky Spy**, carried on Orqa's
  MRM2-10 FPV drone. A payload, not an aircraft, and not Orqa's product.
- **STRIX** (MP-SEC) — MP-Sec France is a **tactical-equipment distributor**, not a manufacturer.
  At least three unrelated STRIX UAVs exist (BAE Systems Australia STRIX, EOS Technologie
  STRIX 300, Alpi Aviation Strix-DF Mini) and the row cannot be resolved to one.
- **COBRA** (POLARIS Spaceplanes) — probable duplicate of **Cobra 600**, which is tagged.

### Corrections spotted (logged only, not fixed)
- **Ayre CX** — made by **EXEDY Globalparts**, not Parallel Flight Technologies (whose heavy-lift
  product is the Firefly). Tagged anyway, since the airframe itself is real and correctly described;
  only the company attribution is wrong.
- **Raptor 2** — Nordic Wing is **Danish**; `hq_country` says Sweden. Sweden is the customer (FMV).
- **Quencher** — Marcos Aerospace is **Greek**; `hq_country` is blank.
- **Kestrel / Spectr** — OM Defence Systems is **Ukrainian**; `hq_country` is blank on both.
- **HALIA** — LeVanta Tech is **California-based**, developing with Ukrainian industry;
  `hq_country` is blank.
- **Astore Levante** — worth noting it is a rebadged **Bayraktar TB3**, so it may duplicate a TB3
  row elsewhere in the catalogue.

### Taxonomy gap worth raising
`weight_class` splits Class III (>600 kg) into **MALE / HALE / Strike-combat** only. Large
**uncrewed cargo/logistics** aircraft have no correct home: Pyka **DropShip** (635 kg MTOW) and
BETA **MV250** both fit none of the three. I left `weight_class` untagged for them rather than
file a cargo aircraft as MALE. Consider adding a Class III "transport/logistics" option.

---

## Batch 4 — products 76–100 of the work list (20 tagged, 5 not)

**Tagged (20), 139 rows:** H-07, Q12, Q250, Firefly, Shrike 10-F, Hitchhiker, Saboteur,
FireAnt, AR6, DT61, Tiguar M, VQ1600, Vulcan SX, Vulcan YX, ABE 1.01, Aero Spirit, Apollo R,
Behemoth, Black Recon, Bullet.

**Domain correction applied:**
- **FireAnt** (Swarmbotics AI) → `ground-ugv`. Confirms the queue's "likely UGV" flag: it is a
  small ground swarm robot for anti-armour work, under $50k a unit, tested by the US Army.

**Flag questions answered:**
- **VQ1600** (flagged "check whether a UAV") — **it is a UAV.** Valqari is known for delivery
  mailboxes, but the VQ1600 is its own in-house aircraft; it flew 303 medical specimen deliveries
  at Northwestern Medicine Delnor with a 100% success rate. Tagged.

**Not tagged (5):**
- **E455** (TB2 Aerospace) — no such model and no such company. "TB2" is Baykar's Bayraktar TB2.
  Probable fabricated row.
- **Bandit**, **Beast+**, **C20**, **C26** — no manufacturer, no country, no summary in the DB and
  nothing findable. "Beast+" only matches consumer ZLL SG906 "Beast" toy quadcopters, which is not
  a confident match. These are the start of the 115-row no-manufacturer block and I expect a high
  unidentifiable rate through it.

### Corrections spotted (logged only, not fixed)
Several rows in this batch have the **manufacturer attached to the wrong product**, and two of them
are a clean swap:
- **Firefly** is **Parallel Flight Technologies'** heavy-lift hybrid drone, not SiFly Aviation's.
- **Ayre CX** (batch 3) is **EXEDY Globalparts'**, not Parallel Flight's.
  The two rows appear to have exchanged manufacturers.
- **DT61** is **Delair's**, not Thales'. (Delair's Aspik is already correctly attributed in batch 1.)
- **Shrike 10-F** is made by **SkyFall (Ukraine)**; Skycutter (UK) provides logistics and engineering
  support and Germany funds it. `hq_country` "Germany" is wrong on all counts.
- **Q12 / Q250** — confirms the queue flag: SiFly is a **US** (Silicon Valley) company, not Chinese.
- **Bullet** — same error as AIR Pro / AIR Speed: General Chereshnya is **Ukrainian**, not Croatian.
  (Some coverage credits Degree Trans instead; the two are both named as developers.)
- **AR6** — Tekever is Portuguese but the AR6 is described throughout as **UK-built** and was
  launched at Farnborough.
- Missing manufacturers now identified: **ABE 1.01** = US Army 101st Airborne Division (built
  in-house at Fort Campbell); **Aero Spirit** = Ascent AeroSystems, and the product is just called
  **Spirit**; **Apollo R** = Icarus **Apollo-R**; **Behemoth** = Culver Aerospace + GLEFA (Ukraine);
  **Black Recon** = Teledyne FLIR Defense.

### Second taxonomy gap
`airframe` has quad / hex / octo but **no tricopter**. Vision Aerial's **Vulcan SX** is a tricopter,
so I left its airframe untagged rather than file it as a quad.
