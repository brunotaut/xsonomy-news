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
