-- Split the Spotter Global composite product record into its two real radars.
-- Prepared and applied 2026-10-31.
--
-- The defect: one live row, "AX250 · GAX500-3D" (27ac953c-be35-4642-8f7d-67b8b7cc7f94),
-- covered two separate Spotter Global radars AND carried a third spec profile belonging
-- to neither. Those foreign values -- 29 kg, 550 mm dia x 630 mm, 2x 12 W, rotating
-- 30 rpm, 1.0 s revisit, 5 km -- are Robin Radar Systems' IRIS, and are still present
-- (correctly, and labelled) on Robin's own row fed75c9b-fe2e-4bff-a996-058da1bef4c9
-- ("IRIS · ELVIRA"). They were copy-pasted into the Spotter row with the IRIS labels
-- stripped, so the record published another vendor's radar as Spotter's.
--
-- Scope: products (one update, one insert) and one slug_redirects row. Nothing else.
--   * The existing id is PRESERVED and becomes the AX250, the long-standing product.
--   * The GAX500-3D is a new row; it was announced in March 2026 and is a distinct product.
--   * company_id and product_companies are unchanged -- both stay Spotter Global,
--     role manufacturer. The row has no article_products, product_sectors,
--     product_taxonomy, company_sector_products or company_evidence rows to re-point
--     (all verified 0 before applying).
--   * publication_status stays 'live' on both. This is deliberately status-quo
--     preserving: the GAX500-3D content is already published today inside the composite
--     row, so leaving the new row as 'draft' would REMOVE live content rather than keep
--     it. PUBLISH_STATUS itself is untouched (CLAUDE.md rule 4).
--
-- URL impact (CLAUDE.md rule 3). The public product URL is generated from the product
-- NAME, not from products.slug -- see slugify() in the catalogue's generate-supabase.mjs.
-- So the indexed URL /sensors/ax250-gax500-3d/ cannot survive a rename. It is preserved
-- with a slug_redirects row pointing at the AX250, which inherits the record's identity
-- and history. That required a generator fix in the catalogue repo: product redirects
-- were hard-coded to write their stub under /uav/, which would have put this sensor's
-- stub at the wrong path. See the execution report.
--
-- Guarded and idempotent: the update is keyed on the pre-split name, the insert uses
-- ON CONFLICT (id) DO NOTHING, the redirect uses ON CONFLICT (from_slug) DO NOTHING.
-- A rerun changes nothing. Expected: 1 product updated, 1 inserted, 1 product_companies
-- row inserted, 1 redirect inserted.
--
-- Sources are recorded in each row's source_urls. Two fields are deliberately ABSENT
-- from the GAX500-3D because no source states them: Radar · Band (no published
-- frequency) and Radar · Scan type (Spotter does not state whether CH3D has moving
-- parts). Radar · Micro-Doppler is dropped from both: Spotter documents bird/drone
-- discrimination and an object-class list, but never names micro-Doppler as the
-- mechanism. Unknown is left as unknown rather than inferred.

begin;

-- 1. The surviving row becomes the AX250, with the Robin Radar values removed and the
--    real figures from the AX-250-3D datasheet (SpotterRF, REV011, 01.06.2022).
update products set
  name = 'AX250',
  slug = 'ax250',
  website = 'https://www.spotterglobal.com/drone-detection-ax-series',
  price = 'Quote-based',
  summary = 'Compact 3D rotating counter-UAS radar. A single 5.4 kg (12 lb) head turns at 36.6 rpm to cover 360° horizontally and 0–90° vertically, giving a 500 m-wide hemispherical dome and holding 20 simultaneous tracks. FMCW Doppler in the 10.0–10.5 GHz licensed band, radiating under 100 mW EIRP and powered over Ethernet. The US State Department has issued a Commodity Jurisdiction determination classing it as a commercial product under EAR, not ITAR.',
  description = 'Compact 3D rotating counter-UAS radar. A single 5.4 kg (12 lb) head turns at 36.6 rpm to cover 360° horizontally and 0–90° vertically, giving a 500 m-wide hemispherical dome and holding 20 simultaneous tracks. FMCW Doppler in the 10.0–10.5 GHz licensed band, radiating under 100 mW EIRP and powered over Ethernet. The US State Department has issued a Commodity Jurisdiction determination classing it as a commercial product under EAR, not ITAR.',
  source_urls = array[
    'https://www.spotterglobal.com/drone-detection-ax-series',
    'https://www.scribd.com/document/686994824/AX250-Counter-UAS-Radar-Datasheet-REV011-WEB'
  ],
  specs = jsonb_build_object(
    'Subtype', 'Active radar',
    'Category', 'Active sensors',
    'Form factor', 'Rotating dome head; 69 x 30 x 30 cm with mount',
    'Radar · Use', 'Counter-UAS',
    'Radar · Band', 'X',
    'Radar · Type', 'FMCW',
    'Classification', 'EAR (not ITAR); State Dept CJ-classified commercial',
    'Sensor · SWaP', '5.4 kg radar / 10.4 kg full assembly; 69 x 30 x 30 cm; PoE 802.3at Type 2 Class 4, 27-50 W @ 48 VDC',
    'Sensor modality', 'Active 3D rotating',
    'Notable partners', 'Genetec (integration partner); reference customer Orbital ATK; US military/government markets',
    'Radar · Coverage', '360°',
    'Radar · Scan type', 'Rotating (mechanical)',
    'Sensor · Mounting', jsonb_build_array('Fixed/mast', 'Vehicle', 'Tripod/portable', 'Maritime'),
    'Radar · Weight (kg)', 5.4,
    'Sensor · Price band', 'Quote-based',
    'Radar · Architecture', '3D rotating FMCW Doppler; 220°/s (36.6 rpm); full 360° x 90° hemispherical dome from a single head',
    'Sensor · Output data', jsonb_build_array('Position', 'Velocity', 'Altitude', 'Track ID', 'Classification'),
    'Radar · Frequency (GHz)', '70 MHz channel in the 10.0-10.5 GHz FCC licensed band',
    'Sensor · Active/Passive', 'Active',
    'Radar · Update/revisit rate', '0.667 Hz track update; 8 Hz scan rate',
    'Radar · Detection range (km)', 0.25,
    'Radar · Tx power & licensing', 'Max 1 W; normal <100 mW EIRP, licence-free; CE, CE Class B, RED',
    'Sensor · Detection range (km)', 0.25,
    'Sensor · Environmental rating', 'IP66 mated and unmated, NEMA 6P; -20 to 55 °C',
    'Sensor · Integration interfaces', 'Ethernet Web UI or API; SpotterRF JSON, XML, KML and CoT; passive PoE over IP67 RJ45',
    'Sensor · All-weather / day-night', 'All-weather, day & night',
    'Radar · Range resolution/accuracy', '2.17 m range resolution',
    'Radar · Angular accuracy/resolution', '±3° azimuth / ±3° elevation',
    'Radar · Range vs RCS / target class', '250 m radius (500 m diameter) against a 0.01 m² RCS drone; 20 simultaneous tracks'
  ),
  updated_at = now()
where id = '27ac953c-be35-4642-8f7d-67b8b7cc7f94'
  and name = 'AX250 · GAX500-3D';

-- 2. The GAX500-3D as its own record. Announced March 2026; figures from Spotter's
--    CH3D page and launch release, plus independent coverage for weight and dimensions.
insert into products (
  id, slug, company_id, name, category, subcategory, use_class, country,
  summary, description, website, price, specs, publication_status, source_urls
) values (
  '7a4aec82-262b-487f-af69-db12f3f00ec8',
  'gax500-3d',
  'e6eab384-fcd9-44e1-b566-085d61a89243',
  'GAX500-3D',
  'Sensor',
  'Radar',
  'cuas',
  'United States',
  'Compact Holographic 3D (CH3D) counter-UAS radar announced in March 2026 and pitched at drone swarms. It refreshes its whole 90° × 90° volume 18 times a second, updating all 50 tracked targets every 56 ms, and detects a 3 kg drone at 500 m. Under 4 kg and briefcase-sized, radiating 3.2 W EIRP, and integrated through Spotter''s NetworkedIO command-and-control software. Spotter reports it won the SIA 2026 New Product Award for countermeasures to drone and robot threats.',
  'Compact Holographic 3D (CH3D) counter-UAS radar announced in March 2026 and pitched at drone swarms. It refreshes its whole 90° × 90° volume 18 times a second, updating all 50 tracked targets every 56 ms, and detects a 3 kg drone at 500 m. Under 4 kg and briefcase-sized, radiating 3.2 W EIRP, and integrated through Spotter''s NetworkedIO command-and-control software. Spotter reports it won the SIA 2026 New Product Award for countermeasures to drone and robot threats.',
  'https://www.spotterglobal.com/compact-holographic-3d-radar',
  'Quote-based',
  jsonb_build_object(
    'Subtype', 'Active radar',
    'Category', 'Active sensors',
    'Form factor', 'Briefcase-sized panel; 41.5 x 24.6 x 10.7 cm',
    'Radar · Use', 'Counter-UAS',
    'Radar · Type', '3D',
    'Sensor · SWaP', '<4 kg (8.8 lb); 41.45 x 24.61 x 10.74 cm',
    'Sensor modality', 'Active 3D volumetric (Compact Holographic)',
    'Radar · Coverage', '3D',
    'Sensor · Mounting', jsonb_build_array('Fixed/mast', 'Tripod/portable'),
    'Radar · Weight (kg)', 4,
    'Sensor · Price band', 'Quote-based',
    'Radar · Architecture', 'Compact Holographic 3D (CH3D): volumetric "floodlight" illumination rather than an electronically scanned "flashlight" beam, so the radar spends all of its time on target. Spotter claims full-sky scanning up to 32x faster than a conventional ESA.',
    'Sensor · Output data', jsonb_build_array('Position', 'Velocity', 'Altitude', 'Track ID', 'Classification'),
    'Sensor · Active/Passive', 'Active',
    'Radar · Update/revisit rate', '18 Hz full-volume; all tracked targets refreshed every 56 ms',
    'Radar · Detection range (km)', 0.5,
    'Radar · Tx power & licensing', '3.2 W EIRP radiated',
    'Sensor · Detection range (km)', 0.5,
    'Sensor · Integration interfaces', 'Spotter NetworkedIO (NIO) C2, fusing radar AI with video AI; automatic camera cueing',
    'Sensor · All-weather / day-night', 'All-weather, day & night',
    'Radar · Angular accuracy/resolution', '90° x 90° field of view',
    'Radar · Range vs RCS / target class', '500 m against a 3 kg drone; 50 simultaneous targets'
  ),
  'live',
  array[
    'https://www.spotterglobal.com/compact-holographic-3d-radar',
    'https://www.spotterglobal.com/blog/spotter-blog-3/spotter-global-releases-the-fastest-radar-in-the-world-18-hz-powered-by-compact-holographic-3d-ch3d-tm-radar-technology-87',
    'https://thedefensepost.com/2026/05/19/holographic-3d-radar-monitoring/',
    'https://www.unmannedairspace.info/counter-uas-systems-and-policies/spotter-globals-new-radar-detects-50-targets-every-56-milliseconds/'
  ]
) on conflict (id) do nothing;

-- 2b. Ownership is stored twice -- products.company_id and product_companies. The
--     generator reads only the first, but the second is kept consistent so the two
--     never disagree. Same company, same role as the pre-split row.
insert into product_companies (product_id, company_id, role)
values ('7a4aec82-262b-487f-af69-db12f3f00ec8', 'e6eab384-fcd9-44e1-b566-085d61a89243', 'manufacturer')
on conflict do nothing;

-- 3. Keep the indexed URL alive. /sensors/ax250-gax500-3d/ -> /sensors/ax250/.
--    A 1-to-2 split has no single successor; the canonical goes to the AX250 because
--    that row keeps the record's id, history and the bulk of the old page's content.
insert into slug_redirects (from_slug, to_slug, kind)
values ('ax250-gax500-3d', 'ax250', 'product')
on conflict (from_slug) do nothing;

commit;
