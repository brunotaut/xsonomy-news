"""Validate researched event data before importing. No external dependencies."""
import json
from pathlib import Path
from collections import Counter
from zoneinfo import ZoneInfo

p = Path(__file__).with_name('european-events-2026-2027.json')
d = json.loads(p.read_text())
rows = d['events']
assert len({r['slug'] for r in rows}) == len(rows), 'Duplicate event key'
for r in rows:
    assert r['sources'], r['slug']
    assert r['website_url'].startswith('https://'), r['slug']
    if r['timezone']:
        ZoneInfo(r['timezone'])
    if r['publication_status'] == 'ready':
        assert d['window_start'] <= r['start_date'] <= r['end_date'] <= d['window_end'], r['slug']
        assert r['date_status'] == 'confirmed' and r['date_precision'] == 'day', r['slug']
        assert any('dates' in s['supported_fields'] and s['source_type'] in ('organizer', 'institution') for s in r['sources']), r['slug']
    else:
        assert r['start_date'] is None and r['end_date'] is None, r['slug']
    assert (r['ticket_price'] is None) == (r['ticket_currency'] is None)
    assert len({s['url'] for s in r['sources']}) == len(r['sources']), r['slug']
ready = [r for r in rows if r['publication_status'] == 'ready']
assert len(ready) == d['research_run']['confirmed_count']
assert sum(r['publication_status'] == 'watchlist' for r in rows) == d['research_run']['watchlist_count']
assert len({r['country_code'] for r in ready}) == d['research_run']['coverage_notes']['confirmed_country_count']
assert not any('Amsterdam Drone Week' == r['name'] for r in ready)
print(json.dumps({'records': len(rows), 'ready': len(ready), 'countries': len({r['country_code'] for r in ready}), 'by_relevance': dict(Counter(r['relevance_tier'] for r in ready)), 'sources': sum(len(r['sources']) for r in rows)}))
