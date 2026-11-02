"""Build the current open-ended dataset from the preserved initial snapshot and additions."""
import json
from pathlib import Path
from collections import Counter
root=Path(__file__).parent
original=json.loads((root/'european-events-2026-2027.json').read_text())
delta=json.loads((root/'open-horizon-additions-2026-11-02.json').read_text())
by_slug={e['slug']:e for e in original['events']}
for e in delta['events']:
    assert e['slug'] not in by_slug, 'Unexpected collision: '+e['slug']
    by_slug[e['slug']]=e
current=original | {'horizon_mode':'open_ended','window_end':None,'events':list(by_slug.values())}
current['events'].sort(key=lambda e:(e['start_date'] or '9999',e['name'],e['edition_year'] or 9999))
for e in current['events']:
    if e['name']=='UAV Show' and e['publication_status']=='watchlist':
        e['research_note_en']='Organiser announces autumn 2027; exact dates not yet published. Retained under the open-ended scope.'
current['exclusions']=[x for x in original['exclusions'] if x['name']!='International Security Expo 2027']
ready=[e for e in current['events'] if e['publication_status']=='ready']
watch=[e for e in current['events'] if e['publication_status']=='watchlist']
current['completeness']='Broad researched database with no future upper cutoff. Includes every relevant future event found in these research passes; completeness across all European events is not guaranteed.'
current['latest_confirmed_event_end']=max(e['end_date'] for e in ready)
current['research_run']={
 'run_key':'europe-events-2026-11-02-open-horizon','checked_at':'2026-11-02','window_start':'2026-11-02','window_end':None,
 'methodology_en':'User removed the upper cutoff. Preserve original 49 dated records and 8 watch items; add 8 source-confirmed later editions and 7 undated future-edition watch items. No future upper date filter. Organiser/institution evidence supports dated entries; directory placeholders stay on watchlist.',
 'limitations_en':current['completeness']+' Far-future dates may change. Unannounced dates remain null. Adjacent event tags do not assert dedicated UAV tracks. No automatic refresh schedule or website UI configured.',
 'confirmed_count':len(ready),'watchlist_count':len(watch),'exclusions':current['exclusions'],
 'coverage_notes':{'horizon_mode':'open_ended','latest_confirmed_event_end':current['latest_confirmed_event_end'],'confirmed_countries':sorted({e['country'] for e in ready}),'confirmed_country_count':len({e['country'] for e in ready}),'core_count':sum(e['relevance_tier']=='core' for e in ready),'adjacent_count':sum(e['relevance_tier']=='adjacent' for e in ready),'additions_dated':8,'additions_watchlist':7,'source_observations':sum(len(e['sources']) for e in current['events'])}}
(root/'european-events.json').write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'total':len(current['events']),'dated':len(ready),'watchlist':len(watch),**current['research_run']['coverage_notes']}))
