-- Research can be open-ended. Historical fixed-window runs retain their end dates.
alter table public.ecosystem_event_research_runs alter column window_end drop not null;
comment on column public.ecosystem_event_research_runs.window_end is 'Null means open-ended discovery with no future upper cutoff. A non-null date describes a historical bounded research run.';

