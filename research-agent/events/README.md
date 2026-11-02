# European UAV & Counter-UAS events

Research checkpoint: **2 November 2026**. Calendar window: **2 November 2026–1 November 2027**, inclusive.

## Database result

- **49 dated events, 19 countries:** 27 core UAV/C-UAS events and 22 adjacent defence, aerospace, autonomy or geospatial events.
- **8 undated watch items**, excluded from the integration projection.
- **72 source observations**, including organiser announcements, institutional listings and resolved conflicting dates.
- Data is in Supabase project `uobidcahmrmfdmfbrtkt`: `ecosystem_events`, `ecosystem_event_sources`, `ecosystem_event_research_runs`.
- Server integration view: `v_ecosystem_events`. No website interface, navigation or event pages have been deployed.
- RLS is enabled; anonymous/authenticated clients have no grants. The existing server build can use service_role when the UI is designed.

This is a broad first researched edition, **not a guarantee that every European event is covered**. Private events, new announcements and country-specific smaller events may be absent. Thirteen countries in the current company landscape have no confirmed event in this pass; this is not a no-events finding. Watchlist records preserve gaps rather than invent dates.

## Files and import

- `european-events-2026-2027.json`: canonical researched dataset, exclusions and methodology.
- `../../db/migrations/20261102_ecosystem_events.sql`: schema, grants and integration view.
- `import-events.sql`: idempotent source-backed upserts. No existing company/investor/hub data is changed.
- `validate-events.py`: structural and research-quality checks.

Apply the schema with Supabase migrations. Dry run the import inside `BEGIN; ... ROLLBACK;`, inspect counts, then import in a transaction. This checkpoint was dry-run before the live import; counts and access were verified afterwards. Repeated imports retain stable event IDs via unique slugs. Sources are upserted by event ID + URL and not silently deleted.

## Field dictionary

| Fields | Meaning |
|---|---|
| id, slug, series_key | Stable edition ID/URL key and recurring-series key. One record per edition or separately attendable event. |
| name, edition_year | Display name and announced edition year; unknown watchlist years stay null. |
| start_date, end_date | Local calendar dates; **end date inclusive**. No fabricated dates for watch items. |
| date_status, date_precision, date_label | Confirmed/announced/unannounced/conflicting; day/month/season/year/unknown precision; original approximate label when useful. |
| event_status | Scheduled, announced, unknown, postponed, cancelled or completed. |
| publication_status | ready/watchlist/retired. **ready means data ready, not published on the website.** |
| country_code, country, city, venue, timezone | ISO alpha-2 country, display geography, venue and IANA timezone where known. Online/hybrid events retain organiser geography. |
| attendance_mode | in_person/online/hybrid/unknown. |
| organizer_name, website_url | Public organiser label, official event website where available; null organiser where not established. |
| registration_url, exhibitor_url | Verified links when available; null means not collected or not verified. |
| event_types | Conference, exhibition, summit, symposium, workshop, demo, competition, hackathon. |
| topic_tags | UAV, C-UAS, autonomy, U-space/UTM, defence, public safety, critical infrastructure, research, geospatial, etc. |
| relevance_tier, classification_basis | Core or adjacent, and the editorial basis. Tags are editorial relevance labels, not proof of a dedicated track. |
| audience_tags | Editorial audience classification: industry/operators/government/military/research. |
| description_en | Short original English description. No full source pages copied. |
| access_policy | Invitation/approval requirements only where verified; otherwise not_verified. |
| ticket_price, ticket_currency | Paired nullable fields. No price imported without a verified ticket basis. |
| registration_deadline, speaker_deadline | Optional verified dates. Deadline purpose is explained in research_note_en, e.g. IDET's discounted exhibitor application. |
| research_note_en | Date discrepancies, co-location, restrictions and unresolved details. |
| source_verification, checked_at | Verification class and last human-readable research date. |
| created_at, updated_at | Database import timestamps. |
| sources (separate table) | URL, source type, supported fields, short finding, checked date. |
| research runs | Window, method, limitations, counts, coverage notes and exclusions. |

## Editorial decisions

- Physical venue decides European geography. The existing 32-country company landscape is the baseline, not a prohibition on other European events (Serbia watch item retained).
- Broad defence/geospatial events are **adjacent**; dedicated UAV/C-UAS and explicitly relevant unmanned systems events are **core**.
- AERO and Expert Security have confirmed edition dates but no verified dedicated 2027 UAV track. They are labelled adjacent with that limitation.
- UAS Norway's combined UNC + energy programme is one 16–18 February record; its internal programme dates are noted.
- European Drone Forum is separately attendable and kept apart from XPONENTIAL.
- DLR November launch symposium and April competition are separate dated events.
- The EU U-space stakeholder meeting is part of EU Drone Summit and is not counted twice.
- Organiser dates override older directories for Dronitaly, European Drone Forum, Drone World Expo, DroneTech World Meeting, Loitering Munitions, BEDEX, FEINDEF and DRONExpo. Competing sources are retained as research-status evidence.
- Amsterdam Drone Week is discontinued, not an expected 2027 event.
- International Security Expo's 24–25 November 2027 dates are outside this window.
- ICUAS/IMAV 2027 are in Brazil; Drone Warfare Summit is in the Philippines. They are excluded geographically.
- Generic templated conference-alert listings without corroborated organisers are not admitted.

## Integration contract

The future server build should read `v_ecosystem_events`, filter the desired date window (`end_date >= start` and `start_date <= end`), and display all provenance and date qualifications correctly. Do not read watchlist records as confirmed event dates. No automatic external research or refresh schedule is configured by this task.

## Confirmed calendar

| Dates | Event | Country | Relevance |
|---|---|---|---|
| 2026-11-02 – 2026-11-04 | [Integrated Air and Missile Defence Technology](https://www.smgconferences.com/defence/uk/conference/air-missile-defence) | United Kingdom | adjacent |
| 2026-11-04 – 2026-11-05 | [Aerial Cities](https://aerialcities.dronetalks.online/location/) | Spain | core |
| 2026-11-05 | [Drone Challenge Brunswick Symposium](https://www.dlr.de/en/fl/latest/events/symposium-drone-challenge-brunswick) | Germany | core |
| 2026-11-05 – 2026-11-06 | [TECNOSEC DRONExpo](https://www.dronexpo.es/en/) | Spain | core |
| 2026-11-09 – 2026-11-10 | [EU Drone Summit](https://transport.ec.europa.eu/news-events/events/eu-drone-summit-2026-2026-11-09_en) | Belgium | core |
| 2026-11-17 – 2026-11-18 | [DroneTech World Meeting](https://dronetechpoland.com/) | Poland | core |
| 2026-11-17 – 2026-11-19 | [Loitering Munitions](https://www.smgconferences.com/loitering-munitions) | United Kingdom | core |
| 2026-11-25 | [Drone Defense Summit](https://events.eurodefense.tech/drone-defense-summit) | Germany | core |
| 2026-12-01 – 2026-12-20 | [Drone Defense Hackathon Nordics](https://dronedefensehackathon.se/) | Sweden | core |
| 2026-12-02 – 2026-12-03 | [Uncrewed & Autonomous Systems](https://www.unmannedsystemstechnology.com/events/uncrewed-autonomous-systems/) | United Kingdom | core |
| 2026-12-03 – 2026-12-04 | [Drone International Expo Sweden](https://www.sweden.droneinternationalexpo.com/) | Sweden | core |
| 2026-12-14 | [Roma Drone Conference](https://www.romadrone.it/l-evento/dove-e-quando.html) | Italy | core |
| 2027-01-27 – 2027-01-28 | [Nordic Security Summit](https://events.uasnorway.no/events/security-summit-2027) | Sweden | core |
| 2027-02-02 – 2027-02-03 | [SecD-Day](https://secd-day.messukeskus.com/) | Finland | adjacent |
| 2027-02-10 – 2027-02-12 | [DAUS — International Conference on Drones and Unmanned Systems](https://daus-conference.com/) | Switzerland | core |
| 2027-02-16 – 2027-02-18 | [Unmanned Nordic Conference & Nordic Energy Summit](https://events.uasnorway.no/events/unc-2027) | Norway | core |
| 2027-03-01 | [AI in Defence Summit](https://aidefencesummit.eu/) | Belgium | adjacent |
| 2027-03-02 – 2027-03-04 | [Drone World Expo](https://droneworldexpo.pl/en/) | Poland | core |
| 2027-03-09 – 2027-03-12 | [DSEI Germany](https://www.dsei-germany.com/) | Germany | adjacent |
| 2027-03-12 – 2027-03-14 | [European Defense Tech Hackathon — Hannover](https://events.eurodefense.tech/hannover-2027) | Germany | adjacent |
| 2027-03-15 | [European Drone Forum](https://eudroneforum.org/) | Germany | core |
| 2027-03-16 – 2027-03-18 | [XPONENTIAL Europe](https://www.xponential-europe.com/) | Germany | core |
| 2027-03-16 – 2027-03-18 | [Security & Policing](https://www.securityandpolicing.co.uk/visit/apply-to-attend/) | United Kingdom | adjacent |
| 2027-04-06 – 2027-04-08 | [Military Robotics & Autonomous Systems](https://www.smgconferences.com/defence) | United Kingdom | adjacent |
| 2027-04-07 – 2027-04-09 | [Dronitaly](https://www.dronitaly.it/en/) | Italy | core |
| 2027-04-12 – 2027-04-14 | [BEDEX](https://www.bedex.brussels/en/news/10_bedex-2027-save-the-date-12-14th-of-april-2027) | Belgium | adjacent |
| 2027-04-13 – 2027-04-15 | [Counter UAS Technology Europe](https://www.smgconferences.com/defence/uk/conference/counter-uas-europe) | United Kingdom | core |
| 2027-04-14 – 2027-04-17 | [AERO Friedrichshafen](https://www.aero-expo.com/) | Germany | adjacent |
| 2027-04-27 – 2027-04-29 | [Drone Challenge Brunswick](https://www.dlr.de/en/site/drone-challenge-brunswick) | Germany | core |
| 2027-04-27 – 2027-04-29 | [ASDA — Adriatic Sea Defense & Aerospace](https://adriaticseadefense.com/home-store-copy-2/) | Croatia | adjacent |
| 2027-05-03 – 2027-05-09 | [IDEF](https://www.idef.com.tr/fuar-kunyesi) | Turkey | adjacent |
| 2027-05-04 – 2027-05-06 | [AOC Europe](https://aoceurope.org/) | Portugal | adjacent |
| 2027-05-18 – 2027-05-20 | [FEINDEF](https://www.feindef.com/index.php/en) | Spain | adjacent |
| 2027-05-18 – 2027-05-20 | [DEFEA](https://defea.gr/) | Greece | adjacent |
| 2027-05-20 | [DroneVation & Defence](https://dronevationdefence.com/) | Austria | core |
| 2027-05-25 – 2027-05-27 | [Airspace World](https://airspaceworld.com/plan-your-visit/) | Portugal | adjacent |
| 2027-05-25 – 2027-05-27 | [Expert Security](https://expert-security.com.ua/en/the-exhibition/zvitmainen/reporten-2026.html) | Ukraine | adjacent |
| 2027-05-26 – 2027-05-28 | [IDET](https://www.bvv.cz/en/idet/for-exhibitors) | Czech Republic | adjacent |
| 2027-06-02 – 2027-06-03 | [International Drone Show](https://internationaldroneshow.com/) | Denmark | core |
| 2027-06-08 – 2027-06-09 | [Forum Unbemannte Systeme XII](https://veranstaltungen.dwt-sgw.de/?v=240) | Germany | core |
| 2027-06-14 – 2027-06-20 | [Paris Air Show](https://www.siae.fr/en/) | France | adjacent |
| 2027-06-23 – 2027-06-24 | [GEO Business](https://www.geobusinessshow.com/) | United Kingdom | adjacent |
| 2027-08-25 – 2027-08-27 | [Drone Days](https://drone-days.de/en/) | Germany | core |
| 2027-08-31 – 2027-09-03 | [MSPO](https://www.targikielce.pl/mspo) | Poland | adjacent |
| 2027-09-07 – 2027-09-10 | [DSEI UK](https://dsei-gateway.com/en/our-shows/) | United Kingdom | adjacent |
| 2027-09-20 – 2027-09-21 | [UAV Technology](https://www.smgconferences.com/defence) | United Kingdom | core |
| 2027-09-22 – 2027-09-23 | [Counter UAS Homeland Security Europe](https://www.smgconferences.com/defence) | United Kingdom | core |
| 2027-09-28 – 2027-09-29 | [DroneX — Uncrewed Tech Expo](https://dronexpo.co.uk/) | United Kingdom | core |
| 2027-10-12 – 2027-10-14 | [INTERGEO](https://dvw.de/intergeo/en/) | Germany | adjacent |

## Watchlist

| Series | Finding |
|---|---|
| [UAV Show](https://www.uavshow.com/) | Organiser announces a return in autumn 2027, but exact dates are not published; may fall outside the 12-month window. |
| [Drone Summit](https://dronesummit.lv/) | 2027 date not confirmed in reviewed sources; organiser page blocked retrieval. Swiss drone association states intention to return in 2027. |
| [DRONTEX](https://www.drontex.eu/) | Official page still describes 14–15 October 2026. No next-edition date verified. |
| [Drone Security Expo](https://dronesecurityexpo.pl/) | Official site reports the completed 7–8 October 2026 edition. No next-edition date verified. |
| [UAS Forum Sweden](https://uasforumsweden.se/) | Reviewed organiser pages still describe the 2026 edition. No 2027 date verified. |
| [Inter Drone Expo](https://interdroneexpo.bg/) | 2026 edition is corroborated by Inter Expo Center and Sofia city calendar. No next-edition date verified. |
| [Defense Tech Valley](https://www.brave1.gov.ua/en/investors) | 2026 postponement reported; some directories incorrectly treat it as held. No replacement date or 2027 edition verified. |
| [PARTNER — International Defence Exhibition](https://warsight.com/calendar/partner-belgrade/) | Directories estimate September 2027 but explicitly say unconfirmed. Serbia extends beyond the current 32-country company scope; retained as a European event watch item. |

## Coverage

Confirmed countries: Austria, Belgium, Croatia, Czech Republic, Denmark, Finland, France, Germany, Greece, Italy, Norway, Poland, Portugal, Spain, Sweden, Switzerland, Turkey, Ukraine, United Kingdom.

Company-scope countries without a confirmed record in this pass: Bulgaria, Cyprus, Estonia, Hungary, Ireland, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Romania, Slovakia, Slovenia.

Those countries need further local-language discovery and checks as organisers announce their programmes. No claim of exhaustive country coverage is made.

