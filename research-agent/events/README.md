# European UAV & Counter-UAS events

Current scope: future European events from 2 November 2026, **with no upper date cutoff**. Add all relevant future editions found, regardless of year; do not extrapolate dates from annual/biennial cycles. Research checkpoint: 2 November 2026.

## Current result

- **72 records:** 57 events with confirmed dates across 20 countries, plus 15 undated watch items.
- Dated events: 27 core UAV/C-UAS and 30 adjacent defence/aerospace/geospatial events.
- **90 source observations.** Latest confirmed event currently ends 13 September 2029; that is an observed date, not an import limit.
- Added in the open-horizon expansion: 8 dated editions and 7 watch items. Original 49 dated records retained.
- Supabase tables: `ecosystem_events`, `ecosystem_event_sources`, `ecosystem_event_research_runs`. Server-only integration view: `v_ecosystem_events`.
- No website UI has been added. RLS and server-only access remain in force.

This is a researched broad database, not a guarantee that every European event has been identified. Private events, new announcements and local events may be missing. Future dates can change. A watch item has no manufactured start/end date.

## Files and import order

- `european-events.json`: **current combined canonical dataset**, open-ended scope.
- `european-events-2026-2027.json`: preserved initial bounded research checkpoint; historical, not current scope.
- `open-horizon-additions-2026-11-02.json`: the 15 new records and scope change.
- `extend-open-horizon.py`: reproduce the combined dataset.
- `validate-events.py`: validate the current open-ended dataset. No maximum future date check.
- `import-events.sql`: original 49 dated + 8 watch item import.
- `import-open-horizon.sql`: idempotent expansion, updated scope note and open-ended research run.

For a clean database, first apply `db/migrations/20261102_ecosystem_events.sql` and `db/migrations/20261102_events_open_horizon.sql`, then import the original SQL followed by the open-horizon SQL in transactions. For the existing database, the first migration and import are already applied. Both research checkpoints remain in the database: `window_end = NULL` on the current run means no upper cutoff. The historical run retains 1 November 2027 as its original research boundary.

The current migration and expansion import were tested with rollback before the live write. Dates, counts, provenance, stable event IDs and no-duplicate reruns were checked. Anonymous/authenticated clients still have no access.

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

## Source and integration decisions

- The view has no future date ceiling. The future UI may offer date filters, but these must not prevent database collection of later editions.
- Each recurring edition has its own slug and shares a `series_key`. Exact dates require organiser or institutional evidence; directory-only placeholders remain watch items.
- International Security Expo 2027 is now included; its former date-window exclusion remains only in the historical v1 checkpoint.
- INTERGEO 2029 is confirmed for 11–13 September in Hamburg. INTERGEO 2028 remains undated: the later 2026 organiser partnership supersedes the 2024 Frankfurt plan. The old exact dates are retained as superseded evidence, not current dates.
- Future Forces 2028 is announced by the organiser without exact dates. HEMUS, IDEB and SAHA next-edition timing is unverified. C-UAS 2028 directory placeholders are explicitly unconfirmed.
- Amsterdam Drone Week remains excluded because the organiser says it is discontinued. ICUAS/IMAV 2027 and Drone Warfare Summit 2027 remain excluded geographically.
- Broad defence/aerospace/geospatial shows are adjacent; classification does not promise a dedicated UAV track in a future programme.
- Earlier discrepancy resolutions (Dronitaly, EDF, Drone World Expo, DroneTech, Loitering Munitions, BEDEX, FEINDEF, DRONExpo) remain in event notes and sources.
- Co-located programme deduplication remains: UNC + energy programme is one combined record; EU U-space stakeholders meeting is part of EU Drone Summit. EDF and the two DLR challenge stages are separately attendable events.
- No automatic external research schedule is configured.

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
| 2027-03-16 – 2027-03-18 | [Security & Policing](https://www.securityandpolicing.co.uk/visit/apply-to-attend/) | United Kingdom | adjacent |
| 2027-03-16 – 2027-03-18 | [XPONENTIAL Europe](https://www.xponential-europe.com/) | Germany | core |
| 2027-04-06 – 2027-04-08 | [Military Robotics & Autonomous Systems](https://www.smgconferences.com/defence) | United Kingdom | adjacent |
| 2027-04-07 – 2027-04-09 | [Dronitaly](https://www.dronitaly.it/en/) | Italy | core |
| 2027-04-12 – 2027-04-14 | [BEDEX](https://www.bedex.brussels/en/news/10_bedex-2027-save-the-date-12-14th-of-april-2027) | Belgium | adjacent |
| 2027-04-13 – 2027-04-15 | [Counter UAS Technology Europe](https://www.smgconferences.com/defence/uk/conference/counter-uas-europe) | United Kingdom | core |
| 2027-04-14 – 2027-04-17 | [AERO Friedrichshafen](https://www.aero-expo.com/) | Germany | adjacent |
| 2027-04-27 – 2027-04-29 | [ASDA — Adriatic Sea Defense & Aerospace](https://adriaticseadefense.com/home-store-copy-2/) | Croatia | adjacent |
| 2027-04-27 – 2027-04-29 | [Drone Challenge Brunswick](https://www.dlr.de/en/site/drone-challenge-brunswick) | Germany | core |
| 2027-05-03 – 2027-05-09 | [IDEF](https://www.idef.com.tr/fuar-kunyesi) | Turkey | adjacent |
| 2027-05-04 – 2027-05-06 | [AOC Europe](https://aoceurope.org/) | Portugal | adjacent |
| 2027-05-18 – 2027-05-20 | [DEFEA](https://defea.gr/) | Greece | adjacent |
| 2027-05-18 – 2027-05-20 | [FEINDEF](https://www.feindef.com/index.php/en) | Spain | adjacent |
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
| 2027-11-16 – 2027-11-19 | [Milipol Paris](https://milipol.com/en) | France | adjacent |
| 2027-11-24 – 2027-11-25 | [International Security Expo](https://www.nineteengroup.com/events-media/international-security-expo/) | United Kingdom | adjacent |
| 2027-11-29 – 2027-12-02 | [CEAS Aerospace Europe Conference](https://aec2027.dglr.de/) | Germany | adjacent |
| 2028-05-17 – 2028-05-19 | [BSDA — Black Sea Defense & Aerospace](https://www.bsda.ro/) | Romania | adjacent |
| 2028-05-17 – 2028-05-21 | [ILA Berlin](https://ila-berlin.com/en/public-visitors/ila-2028) | Germany | adjacent |
| 2028-06-19 – 2028-06-23 | [Eurosatory](https://www.eurosatory.com/) | France | adjacent |
| 2028-07-17 – 2028-07-21 | [Farnborough International Airshow](https://www.farnboroughairshow.com/) | United Kingdom | adjacent |
| 2029-09-11 – 2029-09-13 | [INTERGEO](https://www.cch.de/en/news-details/article/intergeo-eine-weitere-leitmesse-fuer-hamburg) | Germany | adjacent |

## Watchlist

| Series / edition | Finding |
|---|---|
| [Counter UAS Homeland Security Europe 2028](https://www.showsbee.com/fairs/104095-Counter-UAS-Homeland-Security-Europe-2028.html) | Directory placeholder for 2028 only. No 2028 organiser dates verified; do not reuse 2027 dates. |
| [Counter UAS Technology Europe 2028](https://www.showsbee.com/fairs/96164-Tiny-House-Show-2026.html) | Directory placeholder for 2028 only. No 2028 organiser dates verified; do not reuse 2027 dates. |
| [DRONTEX](https://www.drontex.eu/) | Official page still describes 14–15 October 2026. No next-edition date verified. |
| [Defense Tech Valley](https://www.brave1.gov.ua/en/investors) | 2026 postponement reported; some directories incorrectly treat it as held. No replacement date or 2027 edition verified. |
| [Drone Security Expo](https://dronesecurityexpo.pl/) | Official site reports the completed 7–8 October 2026 edition. No next-edition date verified. |
| [Drone Summit](https://dronesummit.lv/) | 2027 date not confirmed in reviewed sources; organiser page blocked retrieval. Swiss drone association states intention to return in 2027. |
| [Future Forces Exhibition & Forum 2028](https://future-forces-forum.com/events/registration?id=159&isFirstSite=1) | Official registration page says the next edition is in 2028; exact dates not published in reviewed sources. |
| [HEMUS](https://www.hemusbg.org/en) | Organiser page still presents June 2026; directories expect 2028 from the biennial cycle, but exact next-edition dates remain unverified. |
| [IDEB](https://www.eventseye.com/fairs/f-ideb-7605-1.html) | Directory lists an expected 2028 edition; no organiser-confirmed next-edition dates established. |
| [INTERGEO 2028](https://www.cch.de/en/news-details/article/intergeo-eine-weitere-leitmesse-fuer-hamburg) | Organiser confirms the 2028 edition under a new partnership, but dates and venue are not confirmed. The 2024 Frankfurt plan and dates are superseded. |
| [Inter Drone Expo](https://interdroneexpo.bg/) | 2026 edition is corroborated by Inter Expo Center and Sofia city calendar. No next-edition date verified. |
| [PARTNER — International Defence Exhibition](https://warsight.com/calendar/partner-belgrade/) | Directories estimate September 2027 but explicitly say unconfirmed. Serbia extends beyond the current 32-country company scope; retained as a European event watch item. |
| [SAHA EXPO](https://www.sahaexpo.com/en/exhibition-information) | Official site still describes May 2026. Next-edition dates not verified; directory 2028 estimates are not treated as confirmation. |
| [UAS Forum Sweden](https://uasforumsweden.se/) | Reviewed organiser pages still describe the 2026 edition. No 2027 date verified. |
| [UAV Show 2027](https://www.uavshow.com/) | Organiser announces autumn 2027; exact dates not yet published. Retained under the open-ended scope. |
