-- ═══════════════════════════════════════════════════════════════════════════
-- Correcciones de ubicación propuestas desde la app
--
-- La app tiene un botón «¿Ubicación incorrecta?» que hasta ahora solo escribía
-- en el localStorage del propio teléfono: la corrección mejoraba la app de esa
-- persona y no llegaba a nadie más. Esta tabla es la bandeja de entrada.
--
-- Es la ÚNICA tabla donde `anon` puede escribir, y solo INSERT: nadie puede
-- leer, modificar ni borrar propuestas ajenas. Las coordenadas oficiales viven
-- en MetroMed_estaciones y solo cambian cuando alguien revisa y aplica.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public."MetroMed_correcciones" (
  id             uuid primary key default gen_random_uuid(),
  estacion_id    text not null references public."MetroMed_estaciones" (id)
                   on update cascade on delete cascade,

  lat            double precision not null check (lat between 6.05 and 6.45),
  lng            double precision not null check (lng between -75.75 and -75.40),

  -- Posición que tenía la estación cuando se propuso el cambio, para poder
  -- juzgar la propuesta más tarde aunque la oficial ya se haya movido.
  lat_anterior   double precision,
  lng_anterior   double precision,
  distancia_m    integer,

  metodo         text check (metodo in ('gps', 'mapa')),
  nota           text check (nota is null or length(nota) <= 500),

  creado_en      timestamptz not null default now(),

  -- Revisión: las rellena quien la aprueba o la descarta.
  estado         text not null default 'pendiente'
                   check (estado in ('pendiente', 'aplicada', 'descartada')),
  revisada_en    timestamptz,
  revisada_nota  text
);

create index if not exists "MetroMed_correcciones_pendientes_idx"
  on public."MetroMed_correcciones" (estado, creado_en desc);
create index if not exists "MetroMed_correcciones_estacion_idx"
  on public."MetroMed_correcciones" (estacion_id);


-- ── Límite de disparate ────────────────────────────────────────────────────
-- Cualquiera puede insertar, así que se acota cuánto puede alejarse una
-- propuesta de la posición registrada. 3 km cubre de sobra un error real de
-- geolocalización e impide que alguien mueva una estación a otro municipio.
create or replace function public."MetroMed_validar_correccion"()
returns trigger
language plpgsql
as $$
declare
  actual record;
  metros numeric;
begin
  select lat, lng into actual
  from public."MetroMed_estaciones" where id = new.estacion_id;

  metros := 2 * 6371000 * asin(sqrt(
    power(sin(radians(new.lat - actual.lat) / 2), 2) +
    cos(radians(actual.lat)) * cos(radians(new.lat)) *
    power(sin(radians(new.lng - actual.lng) / 2), 2)
  ));

  if metros > 3000 then
    raise exception 'La corrección está a % m de la posición registrada; el máximo es 3000 m',
      round(metros);
  end if;

  -- Se guardan calculados para que revisar no exija recalcular nada.
  new.lat_anterior := actual.lat;
  new.lng_anterior := actual.lng;
  new.distancia_m  := round(metros);
  return new;
end;
$$;

drop trigger if exists "MetroMed_correcciones_validar" on public."MetroMed_correcciones";
create trigger "MetroMed_correcciones_validar"
  before insert on public."MetroMed_correcciones"
  for each row execute function public."MetroMed_validar_correccion"();


-- ── Vista de revisión ──────────────────────────────────────────────────────
-- Lo que se mira en Studio para decidir. Agrupa por estación y ordena por
-- cuántas personas han propuesto algo parecido: si tres coinciden, es fiable.
create or replace view public."MetroMed_v_correcciones_pendientes" as
select
  c.estacion_id,
  e.nombre                          as estacion,
  e.verificado                      as estacion_verificada,
  count(*)                          as propuestas,
  round(avg(c.lat)::numeric, 5)     as lat_propuesta,
  round(avg(c.lng)::numeric, 5)     as lng_propuesta,
  round(avg(c.distancia_m))         as distancia_media_m,
  round(stddev_pop(c.distancia_m))  as dispersion_m,
  max(c.creado_en)                  as ultima
from public."MetroMed_correcciones" c
join public."MetroMed_estaciones" e on e.id = c.estacion_id
where c.estado = 'pendiente'
group by c.estacion_id, e.nombre, e.verificado
order by count(*) desc, max(c.creado_en) desc;


-- ── Permisos ───────────────────────────────────────────────────────────────
alter table public."MetroMed_correcciones" enable row level security;

grant insert on public."MetroMed_correcciones" to anon, authenticated;
grant select, update, delete on public."MetroMed_correcciones" to authenticated;
grant select on public."MetroMed_v_correcciones_pendientes" to authenticated;

-- anon solo puede depositar. No puede ver lo que hay dentro.
drop policy if exists "MetroMed_correcciones_insertar" on public."MetroMed_correcciones";
create policy "MetroMed_correcciones_insertar"
  on public."MetroMed_correcciones" for insert
  to anon, authenticated with check (estado = 'pendiente');

drop policy if exists "MetroMed_correcciones_revisar" on public."MetroMed_correcciones";
create policy "MetroMed_correcciones_revisar"
  on public."MetroMed_correcciones" for all
  to authenticated using (true) with check (true);

alter view public."MetroMed_v_correcciones_pendientes" set (security_invoker = on);

comment on table public."MetroMed_correcciones" is
  'Bandeja de entrada de correcciones de ubicación enviadas desde la app. '
  'Única tabla escribible por anon, y solo INSERT.';
