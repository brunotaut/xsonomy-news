# Prepares the European defence investor dataset for import: translates the Ukrainian
# labels, derives English country names from the project's own `countries` table, and
# matches each record against the 200 investors already in the database.
import json, re, sys, unicodedata, pathlib

SRC = pathlib.Path('/Users/nazarbegen/Downloads/european-defence-investors.json')
OUT = pathlib.Path(sys.argv[1])
d = json.loads(SRC.read_text())

# The only Ukrainian strings in the dataset. Official organisation names are never touched.
STATUS_LABEL_EN = {
    'Підтверджена інвестиція': 'Confirmed investment',
    'Підтверджений мандат': 'Confirmed mandate',
    'Суміжний інвестор': 'Adjacent investor',
    'Потребує перевірки': 'Requires verification',
    'Програма / фінансовий інструмент': 'Programme / financial instrument',
}
NOTE_EN = {
 'Знайдені релевантні записи; країна в індексі не замінює перевірки офісу та юридичної особи.':
   'Relevant records found; a country in the index does not substitute for office and legal-entity verification.',
 'HBOR має оборонне кредитування. Приватний місцевий defence VC у цьому пошуку не підтверджений; DOK-ING є компанією, не фондом.':
   'HBOR provides defence lending. No private local defence VC was confirmed in this search; DOK-ING is a company, not a fund.',
 'Окремий пошук не дав достатньо підтверджень локального defence-інвестора. Публікація про Keen на кіпрському сайті не робить Keen кіпрським фондом.':
   'A separate search did not find sufficient confirmation of a local defence investor. An article about Keen on a Cypriot site does not make Keen a Cypriot fund.',
 'Локальний BADideas підтверджений як фонд, але оборонний deal тут не встановлений. Origin — приклад латвійської компанії, яку підтримує Change Ventures; це не доказ латвійського офісу Change.':
   'The local BADideas is confirmed as a fund, but no defence deal is established here. Origin is an example of a Latvian company backed by Change Ventures; that is not evidence of a Latvian office of Change.',
 'Окремий пошук не дав достатньо підтверджень локального defence-інвестора. Не додавати сумнівні багатосекторні сторінки заради точки на карті.':
   'A separate search did not find sufficient confirmation of a local defence investor. Do not add doubtful multi-sector pages for the sake of a dot on the map.',
 'GapMinder — підтверджений generalist. Локальний defence-мандат не встановлений. Bravo Victor не зарахований як румунський фонд лише через румунську інвестицію.':
   'GapMinder is a confirmed generalist. No local defence mandate is established. Bravo Victor is not counted as a Romanian fund merely because of a Romanian investment.',
 'Baryon має підтверджений UAV deal; словацький операційний офіс потребує первинного джерела. Luxembourg registration збережена окремо.':
   'Baryon has a confirmed UAV deal; the Slovak operational office needs a primary source. The Luxembourg registration is recorded separately.',
}
COUNTRY_STATUS_EN = {'identified':'identified','gap':'gap','adjacent':'adjacent',
                     'programme':'programme','partial':'partial'}

# English country names come from the project's own countries table, not from a
# translation of the dataset's Ukrainian labels.
COUNTRY_EN = json.loads(pathlib.Path(sys.argv[2]).read_text())

def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii','ignore').decode()
    s = s.lower().replace('&',' and ')
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return ' '.join(s.split())

MAP_READY_STATUSES = {'deal','mandate'}
records, locations, sources, countries_assoc = [], [], [], []

for r in d['investors']:
    rid = r['id']
    label = r['evidence_status_label']
    if label not in STATUS_LABEL_EN:
        raise SystemExit(f'untranslated evidence label: {label!r}')
    ld = r.get('legal_domicile') or {}
    # Validation for map candidates: a city-level place with coordinates, an evidence URL,
    # a retrieval date, and an evidence status that is a deal or a stated mandate.
    locs = r['office_locations']
    blockers = []
    if not locs: blockers.append('no published office or contact city')
    if not any(l.get('latitude') is not None and l.get('longitude') is not None for l in locs):
        blockers.append('no coordinates')
    if not r['sources']: blockers.append('no evidence URL')
    if not r.get('verified_as_of'): blockers.append('no review date')
    if r['evidence_status'] not in MAP_READY_STATUSES:
        blockers.append(f"evidence status '{r['evidence_status']}' is not a deal or a stated mandate")
    if not (r.get('name') or '').strip(): blockers.append('no name')

    records.append({
        'research_id': rid, 'slug': rid, 'name': r['name'],
        'entity_type': r['entity_type'], 'evidence_status': r['evidence_status'],
        'evidence_status_label_en': STATUS_LABEL_EN[label],
        'evidence_basis': r['evidence_basis'],
        'priority_for_uav_review': r['priority_for_uav_review'],
        'stages': r['stages'], 'focus': r['focus'],
        'selected_portfolio': r['selected_portfolio'],
        'investment_geography': r['investment_geography'],
        'ticket': r['ticket'], 'fund_size': r['fund_size'],
        'legal_domicile_country': ld.get('country'),
        'legal_domicile_precision': ld.get('precision'),
        'legal_domicile_note': ld.get('note'),
        'research_note': r['research_note'],
        'missing_fields': r['missing_fields'],
        'verified_as_of': r['verified_as_of'],
        'map_ready': r['map_ready'],
        'map_blockers': blockers,
        'match_key': norm(r['name']),
    })
    for c in r['country_associations']:
        countries_assoc.append({'research_id': rid, 'country': c,
                                'meaning': r['country_association_meaning']})
    for i, l in enumerate(locs):
        locations.append({'research_id': rid, 'ord': i, 'city': l['city'], 'country': l['country'],
                          'latitude': l['latitude'], 'longitude': l['longitude'],
                          'location_kind': l['location_kind'], 'precision': l['precision'],
                          'source_url': l['source']['url'], 'source_ref': l['source'].get('ref'),
                          'source_title': l['source'].get('title'),
                          'source_accessed_at': l['source'].get('accessed_at')})
    for s in r['sources']:
        sources.append({'research_id': rid, 'url': s['url'], 'ref': s.get('ref'),
                        'title': s.get('title'), 'accessed_at': s.get('accessed_at')})

country_reviews = []
for c in d['countries']:
    if c['note'] not in NOTE_EN: raise SystemExit(f"untranslated country note: {c['note']!r}")
    if c['country'] not in COUNTRY_EN: raise SystemExit(f"no English name for {c['country']}")
    country_reviews.append({'country': c['country'], 'name_en': COUNTRY_EN[c['country']],
        'status': COUNTRY_STATUS_EN[c['status']], 'note_en': NOTE_EN[c['note']],
        'reviewed_at': c['reviewed_at'], 'record_count': len(c['record_ids'])})

payload = {'dataset': d['title'], 'version': d['version'], 'as_of': d['as_of'],
           'records': records, 'locations': locations, 'sources': sources,
           'country_associations': countries_assoc, 'country_reviews': country_reviews}
OUT.write_text(json.dumps(payload, ensure_ascii=False))

ok = [r for r in records if r['map_ready'] and not r['map_blockers']]
bad = [r for r in records if r['map_ready'] and r['map_blockers']]
extra = [r for r in records if not r['map_ready'] and not r['map_blockers']]
print(f"records {len(records)}  locations {len(locations)}  sources {len(sources)}  "
      f"country_assoc {len(countries_assoc)}  country_reviews {len(country_reviews)}")
print(f"slug collisions: {len(records)-len({r['slug'] for r in records})}")
print(f"map_ready {sum(1 for r in records if r['map_ready'])}  -> validated {len(ok)}  blocked {len(bad)}")
for r in bad: print('   BLOCKED', r['research_id'], r['map_blockers'])
print(f"not flagged map_ready but passes validation: {len(extra)} -> {[r['research_id'] for r in extra]}")
