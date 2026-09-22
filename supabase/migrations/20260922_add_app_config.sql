-- Server-only config store (e.g. USDA_FDC_API_KEY). RLS is enabled with no
-- policies granted to anon/authenticated, so only the service role key
-- (used exclusively inside Edge Functions, never shipped to the browser)
-- can read or write this table.
create table public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create trigger app_config_set_updated_at
  before update on public.app_config
  for each row execute function public.set_updated_at();
