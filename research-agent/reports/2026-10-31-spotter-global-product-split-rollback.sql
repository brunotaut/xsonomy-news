-- Rollback for the Spotter Global product split. Restores the exact pre-split row
-- captured before the apply, deletes the GAX500-3D row the split created and removes
-- the redirect. Guarded and idempotent; touches products and slug_redirects only.
--
-- Note: this restores the record EXACTLY as it was, which means it restores the Robin
-- Radar IRIS specs that were wrongly in it. That is the point of a rollback, but if the
-- intent is only to undo the split and not to reinstate the bad data, run section 1 and
-- then correct the specs separately.

begin;

-- 1. Put the composite row back as it stood at 2026-10-22 11:51:41+00.
update products set
  name = 'AX250 · GAX500-3D',
  slug = 'ax250-gax500-3d',
  website = 'https://www.spotterglobal.com/',
  price = 'Quote-based · est. mid five-figures/unit',
  summary = 'DARPA-pedigreed compact surveillance radar specialist. The AX250 creates a full 0–90° vertical × 360° dome from a single 12 lb (5.4 kg) unit, 500 m hemispherical coverage. The new GAX500-3D (2026) introduces Compact Holographic 3D scanning at 18 Hz volumetric refresh — explicitly positioned for swarm response. State Department CJ-classified as commercial, EAR-not-ITAR exportable.',
  description = 'DARPA-pedigreed compact surveillance radar specialist. The AX250 creates a full 0–90° vertical × 360° dome from a single 12 lb (5.4 kg) unit, 500 m hemispherical coverage. The new GAX500-3D (2026) introduces Compact Holographic 3D scanning at 18 Hz volumetric refresh — explicitly positioned for swarm response. State Department CJ-classified as commercial, EAR-not-ITAR exportable.',
  source_urls = array[]::text[],
  specs = '{
    "Subtype": "Active radar",
    "Category": "Active sensors",
    "Form factor": "5.4 kg · 18 Hz",
    "Radar · Use": "Counter-UAS",
    "Radar · Band": "X",
    "Radar · Type": "FMCW",
    "Classification": "EAR (not ITAR); State Dept CJ-classified commercial",
    "Sensor · SWaP": "29 kg; 550 mm dia x 630 mm; 2x 12 W",
    "Sensor modality": "Active 3D solid-state",
    "Notable partners": "Genetec (integration partner); reference customer Orbital ATK; US military/government markets",
    "Radar · Coverage": "360°",
    "Radar · Scan type": "Rotating (mechanical)",
    "Sensor · Mounting": ["Fixed/mast", "Vehicle", "Tripod/portable", "Maritime"],
    "Radar · Weight (kg)": 5.4,
    "Sensor · Price band": "Quote-based",
    "Radar · Architecture": "3D solid-state (Compact Holographic)",
    "Sensor · Output data": ["Position", "Velocity", "Altitude", "Track ID", "Classification"],
    "Radar · Micro-Doppler": "Yes",
    "Sensor · Active/Passive": "Active",
    "Radar · Update/revisit rate": "1.0 s (30 rpm)",
    "Radar · Detection range (km)": 5,
    "Radar · Tx power & licensing": "2x 12 W",
    "Sensor · Detection range (km)": 5,
    "Sensor · Integration interfaces": "Integration-ready API incl. C2"
  }'::jsonb,
  updated_at = now()
where id = '27ac953c-be35-4642-8f7d-67b8b7cc7f94'
  and name is distinct from 'AX250 · GAX500-3D';

-- 2. Remove the new row's ownership link first, then the row itself.
delete from product_companies
 where product_id = '7a4aec82-262b-487f-af69-db12f3f00ec8';

-- 3. Remove the row the split created. Guarded on the exact id and name so it can never
--    delete anything else, and so a rerun is a no-op.
delete from products
 where id = '7a4aec82-262b-487f-af69-db12f3f00ec8'
   and name = 'GAX500-3D';

-- 4. Remove the redirect.
delete from slug_redirects
 where from_slug = 'ax250-gax500-3d' and to_slug = 'ax250' and kind = 'product';

commit;
