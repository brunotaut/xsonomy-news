#!/usr/bin/env python3
"""Turn the European UAV / C-UAS hub research JSON into the five slices the
hub_research_load* SQL functions expect.

    python3 -I research-agent/imports/prepare_uav_hubs.py <payload.json> <countries_en.json> <outdir>

`countries_en.json` is an ISO-code -> English-name map taken from the project's own
`countries` table, so the country names match the rest of the catalogue instead of being
re-translated here:

    select json_object_agg(code, name) from countries;

The script validates rather than cleans. It fails loudly on anything it cannot vouch for:
an unknown enum value, a missing stable id, a coordinate outside the dataset's stated
precision, a non-ASCII authored English field, or a source URL that is not http(s). The
point of a staging layer is that nothing silently improves on the way in.
"""
import json, re, sys, unicodedata
from pathlib import Path

# Vocabularies the staging schema constrains. Kept here so the script fails before the
# database does, with a message naming the record.
EVIDENCE = {'documented', 'historical_evidence', 'location_pending', 'candidate',
            'planned', 'in_development'}
RECORD_UNITS = {'organisation_or_hub', 'site', 'programme'}
LOCATION_KINDS = {'published_campus_or_test_locality', 'flight_test_locality',
                  'research_lab_city', 'simulation_lab_city', 'network_office_city',
                  'operator_contact_city', 'contact_office_city', 'programme_delivery_city'}
PRECISIONS = {'approximate_locality_centroid', 'street_address', 'exact'}
REL_KINDS = {'site_of', 'operated_by', 'shares_geographic_campus', 'relationship_to_resolve'}

errors = []


def fail(record_id, message):
    errors.append(f'{record_id}: {message}')


def name_key(value):
    """The same normalisation investor_name_key() applies in SQL, so a match computed
    here and a match computed there agree."""
    folded = unicodedata.normalize('NFKD', value or '')
    folded = ''.join(c for c in folded if not unicodedata.combining(c))
    folded = folded.lower().replace('&', ' and ')
    return re.sub(r'[^a-z0-9]+', ' ', folded).strip() or None


def web_url(url):
    return isinstance(url, str) and url.startswith(('http://', 'https://'))


def authored_english(record_id, field, value):
    """Authored public copy must be English. Source titles are exempt -- they are evidence
    metadata and keep their original spelling. This catches a label that slipped through
    untranslated rather than attempting to translate it."""
    if value is None:
        return
    suspicious = [c for c in value if ord(c) > 0x024F]
    if suspicious:
        fail(record_id, f'{field} contains non-Latin characters {suspicious[:4]!r}; '
                        'authored public copy must be English')


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    payload = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    countries_en = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
    outdir = Path(sys.argv[3])
    outdir.mkdir(parents=True, exist_ok=True)

    dataset = f"{payload['title']} {payload['version']}"
    hubs, locations, sources, relationships, reviews = [], [], [], [], []
    seen_research_ids, seen_location_refs = set(), set()

    for h in payload['hubs']:
        rid = h.get('research_id')
        if not rid:
            fail('<unknown>', 'missing research_id')
            continue
        if rid in seen_research_ids:
            fail(rid, 'duplicate research_id in the payload')
        seen_research_ids.add(rid)

        if h.get('evidence_status') not in EVIDENCE:
            fail(rid, f"unknown evidence_status {h.get('evidence_status')!r}")
        if h.get('record_unit', 'organisation_or_hub') not in RECORD_UNITS:
            fail(rid, f"unknown record_unit {h.get('record_unit')!r}")
        if not h.get('name'):
            fail(rid, 'missing name')
        if not h.get('country'):
            fail(rid, 'missing country')

        for field in ('summary_en', 'research_note_en', 'access_model'):
            authored_english(rid, field, h.get(field))

        # The dataset's country_name is cross-checked against the catalogue's own name so
        # the two cannot drift; the catalogue's wins.
        catalogue_name = countries_en.get(h['country'])
        if catalogue_name is None:
            fail(rid, f"country {h['country']!r} is not in the catalogue's countries table")

        hubs.append({
            'research_id': rid,
            'slug': rid,                      # research_id is already a stable slug
            'name': h['name'],
            'country': h['country'],
            'country_name': catalogue_name or h.get('country_name'),
            'locality_text': h.get('locality_text'),
            'hub_type': h.get('hub_type'),
            'record_unit': h.get('record_unit', 'organisation_or_hub'),
            'evidence_status': h.get('evidence_status'),
            'technology_focus': h.get('technology_focus') or [],
            'summary_en': h.get('summary_en'),
            'research_note_en': h.get('research_note_en'),
            'operational_status': h.get('operational_status'),
            'access_model': h.get('access_model'),
            'bvlos_status': h.get('bvlos_status'),
            'cuas_evidence': h.get('cuas_evidence'),
            'reviewed_at': h.get('reviewed_at'),
            'map_candidate': bool(h.get('map_candidate')),
            'match_key': name_key(h['name']) if h.get('name') else None,
        })

        for s in h.get('sources') or []:
            if not web_url(s.get('url')):
                fail(rid, f"source url {s.get('url')!r} is not http(s)")
                continue
            sources.append({'research_id': rid, 'location_ref': None, 'ref': s.get('ref'),
                            'url': s['url'], 'title_original': s.get('title_original'),
                            'accessed_at': s.get('accessed_at')})

        for loc in h.get('locations') or []:
            ref = loc.get('id')
            if not ref:
                fail(rid, 'a location has no stable id')
                continue
            if ref in seen_location_refs:
                fail(rid, f'duplicate location id {ref}')
            seen_location_refs.add(ref)
            if loc.get('location_kind') not in LOCATION_KINDS:
                fail(rid, f"unknown location_kind {loc.get('location_kind')!r} on {ref}")
            if loc.get('precision') not in PRECISIONS:
                fail(rid, f"unknown precision {loc.get('precision')!r} on {ref}")
            lat, lon = loc.get('latitude'), loc.get('longitude')
            if not (isinstance(lat, (int, float)) and isinstance(lon, (int, float))):
                fail(rid, f'location {ref} has no numeric coordinate pair')
            elif not (-90 <= lat <= 90 and -180 <= lon <= 180):
                fail(rid, f'location {ref} coordinate out of range')
            # The dataset states centroids are rounded to about two decimals. A longer
            # fraction would imply facility-level precision the research does not have.
            elif loc.get('precision') == 'approximate_locality_centroid':
                for value, axis in ((lat, 'latitude'), (lon, 'longitude')):
                    if len(str(float(value)).split('.')[-1].rstrip('0')) > 2:
                        fail(rid, f'location {ref} {axis} {value} is more precise than '
                                  'an approximate locality centroid')
            locations.append({
                'research_id': rid, 'location_ref': ref, 'locality': loc.get('locality'),
                'country': loc.get('country'), 'latitude': lat, 'longitude': lon,
                'location_kind': loc.get('location_kind'),
                'precision': loc.get('precision'),
                'coordinate_basis': loc.get('coordinate_basis'),
            })
            for s in loc.get('sources') or []:
                if not web_url(s.get('url')):
                    fail(rid, f"location source url {s.get('url')!r} is not http(s)")
                    continue
                sources.append({'research_id': rid, 'location_ref': ref, 'ref': s.get('ref'),
                                'url': s['url'], 'title_original': s.get('title_original'),
                                'accessed_at': s.get('accessed_at')})

    for r in payload.get('relationships') or []:
        if r.get('kind') not in REL_KINDS:
            fail(r.get('from_id', '<rel>'), f"unknown relationship kind {r.get('kind')!r}")
        for side in ('from_id', 'to_id'):
            if r.get(side) not in seen_research_ids:
                fail(r.get('from_id', '<rel>'), f'{side} {r.get(side)!r} is not a record in this payload')
        relationships.append({'from_id': r.get('from_id'), 'to_id': r.get('to_id'),
                              'kind': r.get('kind'), 'note_en': r.get('note_en')})

    for c in payload.get('countries') or []:
        catalogue_name = countries_en.get(c['country'])
        if catalogue_name is None:
            fail(c['country'], "country is not in the catalogue's countries table")
        authored_english(c['country'], 'note_en', c.get('note_en'))
        reviews.append({'country': c['country'], 'name_en': catalogue_name or c.get('name_en'),
                        'research_records': c.get('record_count', 0),
                        'map_candidates': c.get('map_candidate_count', 0),
                        'review_note_en': c.get('note_en'),
                        'reviewed_at': c.get('reviewed_at')})
        for rid in c.get('record_ids') or []:
            if rid not in seen_research_ids:
                fail(c['country'], f'country review references unknown record {rid!r}')

    if errors:
        print(f'{len(errors)} validation error(s):', file=sys.stderr)
        for e in errors:
            print(f'  - {e}', file=sys.stderr)
        sys.exit(1)

    for name, rows in (('hubs', hubs), ('locations', locations), ('sources', sources),
                       ('relationships', relationships), ('country_reviews', reviews)):
        (outdir / f'{name}.json').write_text(json.dumps(rows, ensure_ascii=False), encoding='utf-8')

    unique_urls = {s['url'] for s in sources}
    print(f'dataset           : {dataset}')
    print(f'hubs              : {len(hubs)}')
    print(f'  organisations   : {sum(1 for h in hubs if h["record_unit"] == "organisation_or_hub")}')
    print(f'  sites           : {sum(1 for h in hubs if h["record_unit"] == "site")}')
    print(f'  programmes      : {sum(1 for h in hubs if h["record_unit"] == "programme")}')
    print(f'  map_candidate   : {sum(1 for h in hubs if h["map_candidate"])}')
    print(f'locations         : {len(locations)}')
    print(f'sources           : {len(sources)} ({len(unique_urls)} unique urls)')
    print(f'relationships     : {len(relationships)}')
    print(f'country reviews   : {len(reviews)}')
    print(f'-> {outdir}')


if __name__ == '__main__':
    main()
