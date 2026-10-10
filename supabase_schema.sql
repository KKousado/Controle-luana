-- ==============================================================================
-- SCRIPT SQL: CONTROLE FINANCEIRO "DOCES DA LUANA"
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. TABELA DE CATEGORIAS
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('entrada','saida')),
  cor text,
  icone text,
  created_at timestamptz default now()
);

-- 2. TABELA DE LANÇAMENTOS
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  valor numeric(12,2) not null check (valor > 0),
  data date not null default current_date,
  vencimento date,                    -- para contas a pagar/receber
  descricao text,
  origem text not null,               -- de onde veio a entrada / para onde foi o gasto
  categoria_id uuid references public.categorias(id) on delete set null,
  forma_pagamento text check (forma_pagamento in ('pix','dinheiro','debito','credito','transferencia')),
  status text not null default 'pago' check (status in ('pago','pendente')),
  recorrente boolean not null default false,
  observacao text,
  created_at timestamptz default now()
);

-- 3. TABELA DE METAS
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mes date not null,                  -- sempre o dia 1 do mês
  meta_faturamento numeric(12,2),
  limite_gastos numeric(12,2),
  unique (user_id, mes)
);

-- 4. TABELA DE PRODUTOS
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  custo_ingredientes numeric(12,2) not null default 0,
  preco_venda numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

-- 5. TABELA DE TAXAS POR ORIGEM
create table if not exists public.taxas_origem (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  origem text not null,
  percentual numeric(5,2) not null default 0,
  unique (user_id, origem)
);

-- 6. ÍNDICES DE PERFORMANCE
create index if not exists idx_lanc_user_data on public.lancamentos (user_id, data desc);
create index if not exists idx_lanc_user_status_venc on public.lancamentos (user_id, status, vencimento);
create index if not exists idx_lanc_user_origem on public.lancamentos (user_id, origem);
create index if not exists idx_cat_user on public.categorias (user_id);

-- 7. ROW LEVEL SECURITY (RLS) - LUANA ACESSA APENAS SEUS PRÓPRIOS DADOS
do $$
declare t text;
begin
  foreach t in array array['categorias','lancamentos','metas','produtos','taxas_origem'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s_own" on public.%1$I', t);
    execute format('create policy "%1$s_own" on public.%1$I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- 8. FUNÇÃO: INICIALIZAR CATEGORIAS PADRÃO
create or replace function public.garantir_categorias_padrao() returns void
language plpgsql security invoker as $$
begin
  if exists (select 1 from public.categorias where user_id = auth.uid()) then return; end if;
  insert into public.categorias (nome, tipo, cor, icone) values
    ('Vendas no balcão','entrada','#34C759','store'),
    ('Encomendas','entrada','#30B0C7','cake'),
    ('Delivery / apps','entrada','#FF9500','bike'),
    ('Eventos e revenda','entrada','#AF52DE','party-popper'),
    ('Ingredientes','saida','#FF3B30','wheat'),
    ('Embalagens','saida','#FF9500','package'),
    ('Gás / Energia','saida','#FFCC00','flame'),
    ('Delivery / Frete','saida','#5AC8FA','truck'),
    ('Marketing','saida','#AF52DE','megaphone'),
    ('Equipamentos','saida','#8E8E93','cooking-pot'),
    ('Taxas de cartão/app','saida','#FF2D55','credit-card'),
    ('Pessoal','saida','#007AFF','users'),
    ('Aluguel','saida','#A2845E','home'),
    ('Impostos','saida','#636366','landmark'),
    ('Outros','saida','#C7C7CC','ellipsis');
end $$;

-- 9. FUNÇÃO: RESUMO DO PERÍODO
create or replace function public.resumo_periodo(p_inicio date, p_fim date)
returns table(entradas numeric, saidas numeric, saldo numeric)
language sql stable security invoker as $$
  select
    coalesce(sum(valor) filter (where tipo='entrada'), 0),
    coalesce(sum(valor) filter (where tipo='saida'), 0),
    coalesce(sum(valor) filter (where tipo='entrada'), 0) - coalesce(sum(valor) filter (where tipo='saida'), 0)
  from public.lancamentos
  where data between p_inicio and p_fim and status = 'pago';
$$;

-- 10. FUNÇÃO: GASTOS POR CATEGORIA
create or replace function public.gastos_por_categoria(p_inicio date, p_fim date)
returns table(categoria_id uuid, nome text, cor text, icone text, total numeric, percentual numeric)
language plpgsql stable security invoker as $$
declare
  v_total_saidas numeric;
begin
  select coalesce(sum(valor), 0) into v_total_saidas
  from public.lancamentos
  where data between p_inicio and p_fim and status = 'pago' and tipo = 'saida';

  return query
  select
    c.id as categoria_id,
    coalesce(c.nome, 'Sem categoria') as nome,
    coalesce(c.cor, '#8E8E93') as cor,
    coalesce(c.icone, 'tag') as icone,
    coalesce(sum(l.valor), 0) as total,
    case when v_total_saidas > 0 then round((coalesce(sum(l.valor), 0) / v_total_saidas) * 100, 2) else 0 end as percentual
  from public.lancamentos l
  left join public.categorias c on l.categoria_id = c.id
  where l.data between p_inicio and p_fim and l.status = 'pago' and l.tipo = 'saida'
  group by c.id, c.nome, c.cor, c.icone
  order by total desc;
end;
$$;

-- 11. FUNÇÃO: TOP ORIGENS DE GASTOS
create or replace function public.top_origens_gastos(p_inicio date, p_fim date, p_limite int default 5)
returns table(origem text, total numeric)
language sql stable security invoker as $$
  select
    origem,
    coalesce(sum(valor), 0) as total
  from public.lancamentos
  where data between p_inicio and p_fim and status = 'pago' and tipo = 'saida'
  group by origem
  order by total desc
  limit p_limite;
$$;

-- 12. FUNÇÃO: ENTRADAS POR ORIGEM
create or replace function public.entradas_por_origem(p_inicio date, p_fim date)
returns table(origem text, total numeric, percentual numeric)
language plpgsql stable security invoker as $$
declare
  v_total_entradas numeric;
begin
  select coalesce(sum(valor), 0) into v_total_entradas
  from public.lancamentos
  where data between p_inicio and p_fim and status = 'pago' and tipo = 'entrada';

  return query
  select
    l.origem,
    coalesce(sum(l.valor), 0) as total,
    case when v_total_entradas > 0 then round((coalesce(sum(l.valor), 0) / v_total_entradas) * 100, 2) else 0 end as percentual
  from public.lancamentos l
  where l.data between p_inicio and p_fim and l.status = 'pago' and l.tipo = 'entrada'
  group by l.origem
  order by total desc;
end;
$$;

-- 13. FUNÇÃO: SÉRIE TEMPORAL DIÁRIA
create or replace function public.serie_diaria(p_inicio date, p_fim date)
returns table(data date, entradas numeric, saidas numeric, saldo numeric)
language sql stable security invoker as $$
  with dias as (
    select generate_series(p_inicio, p_fim, '1 day'::interval)::date as d
  )
  select
    dias.d as data,
    coalesce(sum(l.valor) filter (where l.tipo = 'entrada'), 0) as entradas,
    coalesce(sum(l.valor) filter (where l.tipo = 'saida'), 0) as saidas,
    coalesce(sum(l.valor) filter (where l.tipo = 'entrada'), 0) - coalesce(sum(l.valor) filter (where l.tipo = 'saida'), 0) as saldo
  from dias
  left join public.lancamentos l on l.data = dias.d and l.status = 'pago'
  group by dias.d
  order by dias.d asc;
$$;
