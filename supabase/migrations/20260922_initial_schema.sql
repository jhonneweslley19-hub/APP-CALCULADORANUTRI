-- Ingredients: nutrient values per 100g/100ml
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  energia_kcal numeric not null default 0,
  carboidratos_g numeric not null default 0,
  acucares_totais_g numeric not null default 0,
  acucares_adicionados_g numeric not null default 0,
  proteinas_g numeric not null default 0,
  gorduras_totais_g numeric not null default 0,
  gorduras_saturadas_g numeric not null default 0,
  gorduras_trans_g numeric not null default 0,
  gorduras_mono_g numeric not null default 0,
  gorduras_poly_g numeric not null default 0,
  omega6_g numeric not null default 0,
  omega3_g numeric not null default 0,
  colesterol_mg numeric not null default 0,
  fibra_g numeric not null default 0,
  sodio_mg numeric not null default 0,
  origem text not null default 'manual' check (origem in ('manual', 'usda')),
  usda_fdc_id bigint,
  usda_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingredients_nome_idx on public.ingredients using gin (to_tsvector('simple', nome));

-- Products: a formulation/recipe that will get a nutrition label
create table public.products (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  producao_total_g numeric not null default 0,
  embalagem_g numeric,
  rendimento_embalagens numeric,
  porcao_g numeric not null default 0,
  porcao_medida_caseira text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product ingredients: recipe line items
create table public.product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantidade_g numeric not null default 0,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_ingredients_product_id_idx on public.product_ingredients(product_id);
create index product_ingredients_ingredient_id_idx on public.product_ingredients(ingredient_id);

-- USDA search log/cache (mirrors the original spreadsheet's USDA_LOGS tab)
create table public.usda_search_logs (
  id uuid primary key default gen_random_uuid(),
  termo_original text not null,
  termo_traduzido text,
  fdc_id bigint,
  description text,
  nutrients_json jsonb,
  status text,
  created_at timestamptz not null default now()
);

-- updated_at maintenance
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- RLS: no auth yet (personal single-tenant use). Enable RLS with an open
-- policy for the anon role so the schema is ready to be tightened later
-- once authentication is introduced, instead of bypassing RLS entirely.
alter table public.ingredients enable row level security;
alter table public.products enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.usda_search_logs enable row level security;

create policy "anon full access" on public.ingredients for all to anon using (true) with check (true);
create policy "anon full access" on public.products for all to anon using (true) with check (true);
create policy "anon full access" on public.product_ingredients for all to anon using (true) with check (true);
create policy "anon full access" on public.usda_search_logs for all to anon using (true) with check (true);
