-- ═══════════════════════════════════════════════════════════════════════════
-- METRO DE MEDELLÍN · instalación completa de la base de datos
--
-- Generado por scripts/build-sql.mjs · NO EDITAR A MANO.
-- Regenerar con: npm run db:sql
--
-- Crea el esquema entero y lo carga con los datos. Pensado para pegarlo en
-- Supabase → SQL Editor, sin necesidad de instalar la CLI. También sirve en
-- cualquier PostgreSQL 15+ (los roles anon/authenticated se crean si faltan).
--
--    70 estaciones (55 con coordenada verificada en OpenStreetMap)
--    12 líneas
--    23 servicios confirmados
--
-- SE PUEDE EJECUTAR VARIAS VECES: crea lo que falte y actualiza los datos.
-- No borra nada salvo los recorridos de línea y las co-ubicaciones, que se
-- reconstruyen enteros para que no queden restos de una versión anterior.
--
-- ── Empezar de cero ────────────────────────────────────────────────────────
-- Este archivo NO altera tablas que ya existan con otra forma. Si vienes de
-- una versión anterior del esquema y quieres reinstalar desde cero, ejecuta
-- antes esto (BORRA TODOS LOS DATOS):
--
--   drop table if exists
--     public."MetroMed_estacion_servicio", public."MetroMed_estaciones_colocadas",
--     public."MetroMed_linea_estacion", public."MetroMed_tarifas_especiales",
--     public."MetroMed_tarifas_civica", public."MetroMed_estaciones",
--     public."MetroMed_lineas", public."MetroMed_servicios",
--     public."MetroMed_categorias_servicio" cascade;
--   drop type if exists
--     public."MetroMed_tipo_linea", public."MetroMed_estado_linea",
--     public."MetroMed_modelo_tarifa", public."MetroMed_tipo_transferencia" cascade;
--
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ migrations/20260812000100_esquema.sql
-- ╚══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Metro de Medellín · esquema base
--
-- Modelo relacional del sistema integrado. Refleja data/*.json, que sigue
-- siendo lo que se empaqueta en la app: Supabase es el backend de EDICIÓN
-- (Studio como panel de administración, varias personas documentando
-- estaciones), no el origen en tiempo de ejecución. La app es offline-first;
-- no puede depender de la red para saber dónde está una estación.
--
-- Flujo:  Supabase → npm run data:pull → data/*.json → npm run build → apps
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tipos ──────────────────────────────────────────────────────────────────
-- `create type` no admite IF NOT EXISTS, así que se comprueba a mano: este
-- archivo tiene que poder ejecutarse dos veces sin romperse (lo concatena
-- supabase/instalar.sql).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'MetroMed_tipo_linea'
                 and typnamespace = 'public'::regnamespace) then
    create type public."MetroMed_tipo_linea" as enum ('metro', 'cable', 'tranvia', 'bus');
  end if;

  if not exists (select 1 from pg_type where typname = 'MetroMed_estado_linea'
                 and typnamespace = 'public'::regnamespace) then
    create type public."MetroMed_estado_linea" as enum ('operativa', 'en_construccion', 'suspendida');
  end if;

  if not exists (select 1 from pg_type where typname = 'MetroMed_modelo_tarifa'
                 and typnamespace = 'public'::regnamespace) then
    create type public."MetroMed_modelo_tarifa" as enum ('integrada', 'especial');
  end if;

  -- Cómo se pasa de una línea a otra en la estación.
  --   directa  → dentro del área paga, sin volver a validar
  --   peatonal → hay que salir y caminar hasta la otra estación
  if not exists (select 1 from pg_type where typname = 'MetroMed_tipo_transferencia'
                 and typnamespace = 'public'::regnamespace) then
    create type public."MetroMed_tipo_transferencia" as enum ('directa', 'peatonal');
  end if;
end;
$$;


-- ── Catálogo de servicios ──────────────────────────────────────────────────
create table if not exists public."MetroMed_categorias_servicio" (
  clave     text primary key,
  etiqueta  text not null,
  icono     text not null,
  orden     smallint not null unique
);

create table if not exists public."MetroMed_servicios" (
  clave        text primary key,
  etiqueta     text not null,
  icono        text not null,
  categoria    text not null references public."MetroMed_categorias_servicio" (clave)
                 on update cascade on delete restrict,
  descripcion  text
);

create index if not exists "MetroMed_servicios_categoria_idx" on public."MetroMed_servicios" (categoria);


-- ── Líneas ─────────────────────────────────────────────────────────────────
create table if not exists public."MetroMed_lineas" (
  id                   text primary key,          -- 'A', 'K', '1'
  nombre               text not null unique,      -- 'Línea A'
  color                text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  tipo                 public."MetroMed_tipo_linea" not null,
  tramo                text not null,
  estado               public."MetroMed_estado_linea" not null default 'operativa',
  bicicleta_permitida  boolean not null,
  tarifa               public."MetroMed_modelo_tarifa" not null default 'integrada',
  -- {"lunesASabado":{"apertura":"04:30","cierre":"23:00"},
  --  "domingosYFestivos":{...},"noOpera":["martes"],"nota":null}
  horario              jsonb,
  orden                smallint not null,         -- orden en la leyenda

  -- Una línea en servicio tiene que tener horario; una en obra puede no tenerlo.
  constraint horario_si_operativa
    check (estado <> 'operativa' or horario is not null),

  -- Si hay horario, con la forma esperada por la app.
  constraint horario_bien_formado check (
    horario is null or (
      horario ? 'lunesASabado' and horario ? 'domingosYFestivos'
      and horario #>> '{lunesASabado,apertura}' ~ '^\d{2}:\d{2}$'
      and horario #>> '{lunesASabado,cierre}'   ~ '^\d{2}:\d{2}$'
      and horario #>> '{domingosYFestivos,apertura}' ~ '^\d{2}:\d{2}$'
      and horario #>> '{domingosYFestivos,cierre}'   ~ '^\d{2}:\d{2}$'
    )
  )
);


-- ── Estaciones ─────────────────────────────────────────────────────────────
-- UNA fila por estación física. San Antonio aparece una vez, no tres.
create table if not exists public."MetroMed_estaciones" (
  id                  text primary key check (id ~ '^[a-z0-9-]+$'),
  nombre              text not null,
  lat                 double precision not null check (lat between 6.05 and 6.45),
  lng                 double precision not null check (lng between -75.75 and -75.40),
  municipio           text not null default 'Medellín',
  estructura          text,
  direccion           text,

  -- Transferencia declarada en la estación. NULL = no hay o no se sabe;
  -- la app además deriva transbordos de la topología (ver v_estaciones).
  transferencia       public."MetroMed_tipo_transferencia",
  transferencia_nota  text,

  -- Integración con buses que no se deduce de las líneas del sistema.
  integracion_buses   boolean,

  notas               text,
  verificado          boolean not null default false,
  fuente              text,
  actualizado         date,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  -- Marcar algo como verificado sin decir con qué fuente no vale.
  constraint verificado_exige_fuente
    check (not verificado or fuente is not null),
  constraint nota_exige_transferencia
    check (transferencia_nota is null or transferencia is not null)
);

create index if not exists "MetroMed_estaciones_municipio_idx" on public."MetroMed_estaciones" (municipio);
create index if not exists "MetroMed_estaciones_verificado_idx" on public."MetroMed_estaciones" (verificado);


-- ── Estación ↔ línea ───────────────────────────────────────────────────────
-- `orden` es la posición en el recorrido: de aquí sale el trazado del mapa.
create table if not exists public."MetroMed_linea_estacion" (
  linea_id     text not null references public."MetroMed_lineas" (id)
                 on update cascade on delete cascade,
  estacion_id  text not null references public."MetroMed_estaciones" (id)
                 on update cascade on delete cascade,
  orden        smallint not null,
  primary key (linea_id, estacion_id),

  -- Dos estaciones no pueden ocupar la misma posición en una línea.
  -- DEFERRABLE para poder reordenar dentro de una transacción.
  constraint "MetroMed_linea_estacion_orden_unico" unique (linea_id, orden)
    deferrable initially deferred
);

create index if not exists "MetroMed_linea_estacion_estacion_idx" on public."MetroMed_linea_estacion" (estacion_id);


-- ── Estaciones co-ubicadas ─────────────────────────────────────────────────
-- Nombres distintos, mismo sitio: p. ej. una parada de Metroplús pegada a una
-- estación del metro. La relación es simétrica y un trigger la mantiene así en
-- ambos sentidos.
--
-- Ahora mismo está vacía: los dos pares del dataset original resultaron ser un
-- artefacto de unas coordenadas equivocadas (ver data/README.md). Se conserva
-- porque los casos reales existen y hay que poder registrarlos.
create table if not exists public."MetroMed_estaciones_colocadas" (
  estacion_id      text not null references public."MetroMed_estaciones" (id)
                     on update cascade on delete cascade,
  colocada_con_id  text not null references public."MetroMed_estaciones" (id)
                     on update cascade on delete cascade,
  distancia_m      numeric(6, 1),
  primary key (estacion_id, colocada_con_id),
  constraint no_consigo_misma check (estacion_id <> colocada_con_id)
);


-- ── Servicios por estación ─────────────────────────────────────────────────
-- LA AUSENCIA DE FILA SIGNIFICA "SIN VERIFICAR".
-- Por eso `disponible` es NOT NULL: solo se guarda lo que se sabe, y false
-- significa "se comprobó que no lo tiene", no "no tenemos ni idea". Esa
-- distinción es la que evita que la app le diga a alguien en silla de ruedas
-- que una estación tiene ascensor sin que nadie lo haya comprobado.
create table if not exists public."MetroMed_estacion_servicio" (
  estacion_id  text not null references public."MetroMed_estaciones" (id)
                 on update cascade on delete cascade,
  servicio     text not null references public."MetroMed_servicios" (clave)
                 on update cascade on delete cascade,
  disponible   boolean not null,
  fuente       text,
  actualizado  date,
  primary key (estacion_id, servicio)
);

-- Para "¿qué estaciones tienen ascensor?" sin recorrer la tabla entera.
create index if not exists "MetroMed_estacion_servicio_servicio_idx"
  on public."MetroMed_estacion_servicio" (servicio, disponible);


-- ── Tarifas ────────────────────────────────────────────────────────────────
create table if not exists public."MetroMed_tarifas_civica" (
  id                 text primary key,
  etiqueta           text not null,
  integraciones_1_4  integer not null check (integraciones_1_4 > 0),
  integraciones_5_7  integer not null check (integraciones_5_7 > 0),
  vigencia           text not null,
  orden              smallint not null,
  constraint tramo_largo_no_mas_barato
    check (integraciones_5_7 >= integraciones_1_4)
);

create table if not exists public."MetroMed_tarifas_especiales" (
  id        text primary key,
  linea_id  text references public."MetroMed_lineas" (id) on update cascade on delete set null,
  etiqueta  text not null,
  valor     integer not null check (valor > 0),
  nota      text,
  vigencia  text not null,
  orden     smallint not null
);


-- ── Auditoría mínima ───────────────────────────────────────────────────────
create or replace function public."MetroMed_tocar_actualizado_en"()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists "MetroMed_estaciones_actualizado_en" on public."MetroMed_estaciones";
create trigger "MetroMed_estaciones_actualizado_en"
  before update on public."MetroMed_estaciones"
  for each row execute function public."MetroMed_tocar_actualizado_en"();


-- ── Simetría de co-ubicación ───────────────────────────────────────────────
-- Insertar A→B crea B→A solo. Evita el error de tener la relación a medias,
-- que en el dataset JSON había que validar a mano.
create or replace function public."MetroMed_reflejar_colocacion"()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public."MetroMed_estaciones_colocadas" (estacion_id, colocada_con_id, distancia_m)
    values (new.colocada_con_id, new.estacion_id, new.distancia_m)
    on conflict do nothing;
    return new;
  else
    delete from public."MetroMed_estaciones_colocadas"
    where estacion_id = old.colocada_con_id and colocada_con_id = old.estacion_id;
    return old;
  end if;
end;
$$;

drop trigger if exists "MetroMed_estaciones_colocadas_simetria_ins" on public."MetroMed_estaciones_colocadas";
create trigger "MetroMed_estaciones_colocadas_simetria_ins"
  after insert on public."MetroMed_estaciones_colocadas"
  for each row execute function public."MetroMed_reflejar_colocacion"();

drop trigger if exists "MetroMed_estaciones_colocadas_simetria_del" on public."MetroMed_estaciones_colocadas";
create trigger "MetroMed_estaciones_colocadas_simetria_del"
  after delete on public."MetroMed_estaciones_colocadas"
  for each row execute function public."MetroMed_reflejar_colocacion"();


comment on table public."MetroMed_estacion_servicio" is
  'Servicio por estación. La ausencia de fila significa "sin verificar"; '
  'disponible=false significa "se comprobó que no lo tiene".';
comment on table public."MetroMed_linea_estacion" is
  'Relación estación↔línea. `orden` define el recorrido y de ahí sale el trazado del mapa.';
comment on column public."MetroMed_estaciones".lat is
  'Validada contra la longitud publicada de la línea. No sobrescribir con fuentes sin contrastar.';

-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ migrations/20260812000200_vistas.sql
-- ╚══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Vistas y función de exportación
--
-- `exportar_dataset()` devuelve el JSON con exactamente la forma de data/*.json,
-- para que `npm run data:pull` sea una sola llamada RPC sin lógica duplicada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Estaciones con los campos derivados ────────────────────────────────────
-- `lineas` y `transbordo` no se guardan: se calculan. Antes eran un flag
-- escrito a mano en cada registro y se desincronizaba al tocar una línea.
create or replace view public."MetroMed_v_estaciones" as
select
  e.id,
  e.nombre,
  e.lat,
  e.lng,
  e.municipio,
  e.estructura,
  e.direccion,
  e.transferencia,
  e.transferencia_nota,
  e.integracion_buses,
  e.notas,
  e.verificado,
  e.fuente,
  e.actualizado,

  coalesce(l.lineas, array[]::text[])  as lineas,
  coalesce(c.colocadas, array[]::text[]) as colocada_con,

  -- Sirve más de una línea, o está pegada a otra estación, o tiene
  -- integración de buses declarada.
  (coalesce(array_length(l.lineas, 1), 0) > 1
    or coalesce(array_length(c.colocadas, 1), 0) > 0
    or e.integracion_buses is true) as transbordo,

  coalesce(s.servicios, '{}'::jsonb) as servicios
from public."MetroMed_estaciones" e

left join lateral (
  select array_agg(li.nombre order by li.orden) as lineas
  from public."MetroMed_linea_estacion" le
  join public."MetroMed_lineas" li on li.id = le.linea_id
  where le.estacion_id = e.id
) l on true

left join lateral (
  select array_agg(ec.colocada_con_id order by ec.colocada_con_id) as colocadas
  from public."MetroMed_estaciones_colocadas" ec
  where ec.estacion_id = e.id
) c on true

left join lateral (
  select jsonb_object_agg(es.servicio, es.disponible) as servicios
  from public."MetroMed_estacion_servicio" es
  where es.estacion_id = e.id
) s on true;


-- ── Líneas con su recorrido ────────────────────────────────────────────────
create or replace view public."MetroMed_v_lineas" as
select
  li.id,
  li.nombre,
  li.color,
  li.tipo,
  li.tramo,
  li.estado,
  li.bicicleta_permitida,
  li.tarifa,
  li.horario,
  li.orden,
  coalesce(
    (select array_agg(le.estacion_id order by le.orden)
     from public."MetroMed_linea_estacion" le where le.linea_id = li.id),
    array[]::text[]
  ) as estaciones
from public."MetroMed_lineas" li;


-- ── Cobertura ──────────────────────────────────────────────────────────────
-- Equivale a `npm run data:report`, pero consultable desde Studio.
create or replace view public."MetroMed_v_cobertura" as
select
  (select count(*) from public."MetroMed_estaciones")                    as estaciones,
  (select count(*) from public."MetroMed_lineas")                        as lineas,
  (select count(distinct estacion_id)
     from public."MetroMed_estacion_servicio")                           as con_servicios,
  (select count(*) from public."MetroMed_estaciones" where verificado)   as verificadas,
  (select count(*) from public."MetroMed_estaciones" where direccion is not null) as con_direccion;

create or replace view public."MetroMed_v_cobertura_servicio" as
select
  s.clave,
  s.etiqueta,
  s.categoria,
  count(es.estacion_id)                                     as declarados,
  count(*) filter (where es.disponible)                     as la_tienen,
  (select count(*) from public."MetroMed_estaciones")                  as total_estaciones
from public."MetroMed_servicios" s
left join public."MetroMed_estacion_servicio" es on es.servicio = s.clave
group by s.clave, s.etiqueta, s.categoria;


-- ── Exportación completa ───────────────────────────────────────────────────
-- Devuelve las cuatro secciones con los mismos nombres de campo que usan los
-- archivos de data/, para que el script de pull no tenga que renombrar nada.
create or replace function public."MetroMed_exportar_dataset"()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'lineas', (
      select coalesce(jsonb_agg(x order by x_orden), '[]'::jsonb)
      from (
        select
          v.orden as x_orden,
          jsonb_build_object(
            'id', v.id,
            'nombre', v.nombre,
            'color', v.color,
            'tipo', v.tipo,
            'tramo', v.tramo,
            'estado', replace(v.estado::text, 'en_construccion', 'en construcción'),
            'bicicletaPermitida', v.bicicleta_permitida,
            'tarifa', v.tarifa,
            'horario', v.horario,
            'estaciones', to_jsonb(v.estaciones)
          ) as x
        from public."MetroMed_v_lineas" v
      ) t
    ),

    'estaciones', (
      select coalesce(jsonb_agg(x order by x_id), '[]'::jsonb)
      from (
        select
          v.id as x_id,
          jsonb_build_object(
            'id', v.id,
            'nombre', v.nombre,
            'coordenadas', jsonb_build_object('lat', v.lat, 'lng', v.lng),
            'municipio', v.municipio,
            'estructura', v.estructura,
            'direccion', v.direccion,
            'colocadaCon', to_jsonb(v.colocada_con),
            'integracionBuses', v.integracion_buses,
            'servicios', v.servicios,
            'transferencia', case
              when v.transferencia is null then null
              else jsonb_build_object('tipo', v.transferencia, 'nota', v.transferencia_nota)
            end,
            'horarioEspecial', null,
            'notas', v.notas,
            'verificado', v.verificado,
            'fuente', v.fuente,
            'actualizado', v.actualizado
          ) as x
        from public."MetroMed_v_estaciones" v
      ) t
    ),

    'servicios', jsonb_build_object(
      'categorias', (
        select coalesce(jsonb_object_agg(c.clave, jsonb_build_object(
          'etiqueta', c.etiqueta, 'icono', c.icono, 'orden', c.orden
        )), '{}'::jsonb)
        from public."MetroMed_categorias_servicio" c
      ),
      'servicios', (
        select coalesce(jsonb_object_agg(s.clave, jsonb_build_object(
          'etiqueta', s.etiqueta, 'icono', s.icono,
          'categoria', s.categoria, 'descripcion', s.descripcion
        )), '{}'::jsonb)
        from public."MetroMed_servicios" s
      )
    ),

    'tarifas', jsonb_build_object(
      'civica', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', t.id, 'etiqueta', t.etiqueta,
          'integraciones1a4', t.integraciones_1_4,
          'integraciones5a7', t.integraciones_5_7
        ) order by t.orden), '[]'::jsonb)
        from public."MetroMed_tarifas_civica" t
      ),
      'especiales', (
        select coalesce(jsonb_object_agg(e.clave, e.cuerpo), '{}'::jsonb)
        from (
          select
            'cableArvi'::text as clave,
            jsonb_build_object(
              'linea', max(te.linea_id),
              'etiqueta', 'Cable Arví (Línea L)',
              'nota', max(te.nota),
              'tarifas', jsonb_agg(jsonb_build_object(
                'id', te.id, 'etiqueta', te.etiqueta, 'valor', te.valor
              ) order by te.orden)
            ) as cuerpo
          from public."MetroMed_tarifas_especiales" te
          having count(*) > 0
        ) e
      ),
      'vigencia', (select max(vigencia) from public."MetroMed_tarifas_civica")
    )
  );
$$;

comment on function public."MetroMed_exportar_dataset"() is
  'Dataset completo con la forma de data/*.json. Lo consume npm run data:pull.';

-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ migrations/20260812000300_rls.sql
-- ╚══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
--
-- Los datos son información de transporte público: lectura abierta.
-- La escritura exige sesión autenticada — la clave anon va dentro de la app
-- y cualquiera puede extraerla del bundle, así que no puede dar permiso de
-- escritura a nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Privilegios de tabla ───────────────────────────────────────────────────
-- RLS filtra FILAS, pero no concede acceso a la tabla: sin GRANT, anon recibe
-- "permission denied" antes de que se evalúe ninguna política. Un proyecto
-- Supabase nuevo ya trae estos permisos por defecto, pero declararlos aquí
-- hace que la migración funcione sobre cualquier PostgreSQL y sobreviva a que
-- alguien toque los privilegios por defecto.
-- Un proyecto Supabase ya trae estos roles; un PostgreSQL normal no. Se crean
-- si faltan para que supabase/instalar.sql funcione también fuera de Supabase.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end;
$$;

grant usage on schema public to anon, authenticated;

-- Los permisos se conceden tabla por tabla, NUNCA con "all tables in schema
-- public": este esquema puede convivir con otras tablas del mismo proyecto y
-- un grant global les daría lectura anónima sin querer. Por la misma razón no
-- se tocan los privilegios por defecto: una tabla futura debe conceder los
-- suyos explícitamente.
do $$
declare t text;
begin
  foreach t in array array[
    'MetroMed_categorias_servicio', 'MetroMed_servicios', 'MetroMed_lineas', 'MetroMed_estaciones',
    'MetroMed_linea_estacion', 'MetroMed_estaciones_colocadas', 'MetroMed_estacion_servicio',
    'MetroMed_tarifas_civica', 'MetroMed_tarifas_especiales'
  ] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;

  -- Las vistas se leen con los permisos de quien consulta (security_invoker),
  -- pero aun así necesitan su propio grant de lectura.
  foreach t in array array[
    'MetroMed_v_estaciones', 'MetroMed_v_lineas', 'MetroMed_v_cobertura', 'MetroMed_v_cobertura_servicio'
  ] loop
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end;
$$;


-- ── Activación de RLS ──────────────────────────────────────────────────────
alter table public."MetroMed_categorias_servicio"  enable row level security;
alter table public."MetroMed_servicios"            enable row level security;
alter table public."MetroMed_lineas"               enable row level security;
alter table public."MetroMed_estaciones"           enable row level security;
alter table public."MetroMed_linea_estacion"       enable row level security;
alter table public."MetroMed_estaciones_colocadas" enable row level security;
alter table public."MetroMed_estacion_servicio"    enable row level security;
alter table public."MetroMed_tarifas_civica"       enable row level security;
alter table public."MetroMed_tarifas_especiales"   enable row level security;

-- ── Políticas ──────────────────────────────────────────────────────────────
-- Se borran antes de crearse para que el archivo sea re-ejecutable.
do $$
declare t text;
begin
  foreach t in array array[
    'MetroMed_categorias_servicio', 'MetroMed_servicios', 'MetroMed_lineas', 'MetroMed_estaciones',
    'MetroMed_linea_estacion', 'MetroMed_estaciones_colocadas', 'MetroMed_estacion_servicio',
    'MetroMed_tarifas_civica', 'MetroMed_tarifas_especiales'
  ] loop
    -- Lectura pública
    execute format('drop policy if exists %I on public.%I', 'lectura_publica_' || t, t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      'lectura_publica_' || t, t
    );

    -- Escritura solo con sesión autenticada
    execute format('drop policy if exists %I on public.%I', 'escritura_autenticada_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      'escritura_autenticada_' || t, t
    );
  end loop;
end;
$$;

-- La función de exportación es SECURITY INVOKER: al llamarla con la clave
-- anon se aplican las políticas de lectura de arriba, no más.
grant execute on function public."MetroMed_exportar_dataset"() to anon, authenticated;

-- Las vistas heredan RLS de sus tablas (security_invoker), no hace falta
-- política propia. Se declara explícito porque en PostgreSQL 14 y anteriores
-- el comportamiento por defecto era el contrario.
alter view public."MetroMed_v_estaciones"          set (security_invoker = on);
alter view public."MetroMed_v_lineas"              set (security_invoker = on);
alter view public."MetroMed_v_cobertura"           set (security_invoker = on);
alter view public."MetroMed_v_cobertura_servicio"  set (security_invoker = on);

-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ migrations/20260814000400_correcciones.sql
-- ╚══════════════════════════════════════════════════════════════════════════

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


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ DATOS
-- ╚══════════════════════════════════════════════════════════════════════════

set constraints all deferred;

-- ──────────────────────────────────────────────────────────────────────────
-- Categorías de servicio
-- ──────────────────────────────────────────────────────────────────────────
insert into public."MetroMed_categorias_servicio" (clave, etiqueta, icono, orden) values
  ('accesibilidad', 'Accesibilidad', '♿', 1),
  ('atencion', 'Atención al usuario', '🎫', 2),
  ('comercioYCultura', 'Comercio y cultura', '🛍️', 5),
  ('comodidad', 'Comodidades', '🚻', 3),
  ('movilidad', 'Movilidad e integración', '🚲', 4)
on conflict (clave) do update set
  etiqueta = excluded.etiqueta, icono = excluded.icono, orden = excluded.orden;

-- ──────────────────────────────────────────────────────────────────────────
-- Catálogo de servicios (32)
-- ──────────────────────────────────────────────────────────────────────────
insert into public."MetroMed_servicios" (clave, etiqueta, icono, categoria, descripcion) values
  ('accesoSillaRuedas', 'Acceso en silla de ruedas', '♿', 'accesibilidad', 'Recorrido completo de calle a tren sin escalones.'),
  ('anuncioSonoro', 'Anuncios sonoros', '🔊', 'accesibilidad', 'Información de llegada y destino por audio.'),
  ('ascensor', 'Ascensor', '🛗', 'accesibilidad', 'Ascensor para acceder a la plataforma.'),
  ('banoAccesible', 'Baño accesible', '🚾', 'accesibilidad', 'Baño adaptado para personas con movilidad reducida.'),
  ('banos', 'Baños', '🚻', 'comodidad', 'Servicios sanitarios para usuarios.'),
  ('bebedero', 'Bebedero', '🚰', 'comodidad', 'Punto de agua potable.'),
  ('bibliometro', 'Bibliometro', '📚', 'comercioYCultura', 'Punto de préstamo de libros del Metro.'),
  ('cajeroAutomatico', 'Cajero automático', '🏦', 'comodidad', 'Cajero bancario dentro de la estación.'),
  ('casilleros', 'Casilleros', '🔐', 'comodidad', 'Lockers para guardar pertenencias.'),
  ('comercio', 'Comercio', '🛍️', 'comercioYCultura', 'Locales comerciales dentro de la estación.'),
  ('culturaMetro', 'Cultura Metro', '🎨', 'comercioYCultura', 'Obra de arte, mural o espacio de exposición.'),
  ('encicla', 'EnCicla', '🚴', 'movilidad', 'Estación del sistema de bicicletas públicas del AMVA.'),
  ('escaleraElectrica', 'Escalera eléctrica', '🪜', 'accesibilidad', 'Escaleras eléctricas entre el nivel de calle y la plataforma.'),
  ('objetosPerdidos', 'Objetos perdidos', '🧳', 'atencion', 'Punto de recepción y entrega de objetos olvidados.'),
  ('parqueaderoBicicletas', 'Cicloparqueadero', '🚲', 'movilidad', 'Parqueadero de bicicletas para usuarios.'),
  ('parqueaderoVehiculos', 'Parqueadero de vehículos', '🅿️', 'movilidad', 'Parqueadero de carros o motos asociado a la estación.'),
  ('pisoPodotactil', 'Piso podotáctil', '⠿', 'accesibilidad', 'Guía táctil en el piso para personas con discapacidad visual.'),
  ('primerosAuxilios', 'Primeros auxilios', '🚑', 'atencion', 'Puesto de atención en salud.'),
  ('puntoAtencionCliente', 'PAC', '🛎️', 'atencion', 'Punto de Atención al Cliente: trámites de Cívica, PQRS y atención presencial.'),
  ('puntoCivica', 'Punto Cívica', '💳', 'atencion', 'Expedición y personalización de la tarjeta Cívica.'),
  ('puntoInformacion', 'Punto de información', 'ℹ️', 'atencion', 'Orientación de viaje. Más básico que un PAC; una estación puede tener uno sin el otro.'),
  ('rampaAcceso', 'Rampa de acceso', '📐', 'accesibilidad', 'Rampa de pendiente accesible desde la calle.'),
  ('recargaAutomatica', 'Recarga automática', '🏧', 'atencion', 'Máquina de autorrecarga de la tarjeta Cívica.'),
  ('rutasAlimentadoras', 'Rutas alimentadoras', '🚌', 'movilidad', 'Buses alimentadores integrados con la tarifa del sistema.'),
  ('rutasIntegradas', 'Rutas integradas', '🔀', 'movilidad', 'Rutas de bus con integración tarifaria en la estación.'),
  ('senalizacionBraille', 'Señalización en braille', '⠃', 'accesibilidad', 'Información en braille en accesos, ascensores o barandas.'),
  ('taquilla', 'Taquilla', '🎫', 'atencion', 'Venta y recarga de tiquetes con personal.'),
  ('torniqueteAccesible', 'Torniquete amplio', '🚪', 'accesibilidad', 'Paso ancho para sillas de ruedas, coches o equipaje.'),
  ('vending', 'Máquinas dispensadoras', '🥤', 'comercioYCultura', 'Vending de alimentos o bebidas.'),
  ('wifi', 'WiFi', '📶', 'comodidad', 'Red inalámbrica pública en la estación.'),
  ('zonaEspera', 'Zona de espera', '🪑', 'comodidad', 'Sillas o área cubierta de espera.'),
  ('zonaTaxis', 'Zona de taxis', '🚕', 'movilidad', 'Bahía de taxis en el acceso.')
on conflict (clave) do update set
  etiqueta = excluded.etiqueta, icono = excluded.icono, categoria = excluded.categoria, descripcion = excluded.descripcion;

-- ──────────────────────────────────────────────────────────────────────────
-- Estaciones (70)
-- ──────────────────────────────────────────────────────────────────────────
insert into public."MetroMed_estaciones" (id, nombre, lat, lng, municipio, estructura, direccion, transferencia, transferencia_nota, integracion_buses, notas, verificado, fuente, actualizado) values
  ('acevedo', 'Acevedo', 6.2999, -75.55865, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Acevedo), 2026-08-12', '2026-08-12'),
  ('aguacatala', 'Aguacatala', 6.194, -75.58178, 'Medellín', null, null, null, null, true, null, true, 'OpenStreetMap (Aguacatala), 2026-08-12', '2026-08-12'),
  ('alejandro-echavarria', 'Alejandro Echavarría', 6.2366, -75.5428, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('alpujarra', 'Alpujarra', 6.24293, -75.57142, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Alpujarra), 2026-08-12', '2026-08-12'),
  ('andalucia', 'Andalucía', 6.29633, -75.55187, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Andalucía), 2026-08-12', '2026-08-12'),
  ('arvi', 'Arví', 6.28134, -75.50301, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Arví), 2026-08-12', '2026-08-12'),
  ('ayura', 'Ayurá', 6.18616, -75.58606, 'Envigado', null, null, null, null, null, null, true, 'OpenStreetMap (Estación del Metro Ayurá), 2026-08-12', '2026-08-12'),
  ('bello', 'Bello', 6.33009, -75.55364, 'Bello', null, null, null, null, null, null, true, 'OpenStreetMap (Bello), 2026-08-12', '2026-08-12'),
  ('berlin', 'Berlín', 6.28288, -75.55291, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Berlín), 2026-08-12', '2026-08-12'),
  ('bicentenario', 'Bicentenario', 6.2453, -75.56375, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('buenos-aires', 'Buenos Aires', 6.244, -75.557, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('calasanz', 'Calasanz', 6.2515, -75.5935, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('caribe', 'Caribe', 6.27832, -75.56941, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Caribe), 2026-08-12', '2026-08-12'),
  ('catedral', 'Catedral', 6.25289, -75.56256, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Catedral), 2026-08-12', '2026-08-12'),
  ('chagualo', 'Chagualo', 6.26073, -75.56915, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Chagualo), 2026-08-12', '2026-08-12'),
  ('cisneros', 'Cisneros', 6.24903, -75.57511, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Cisneros), 2026-08-12', '2026-08-12'),
  ('ciudadela-universitaria', 'Ciudadela Universitaria', 6.2705, -75.579, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('cordoba', 'Córdoba', 6.284, -75.5635, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('doce-de-octubre', 'Doce de Octubre', 6.30424, -75.57604, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Doce de Octubre), 2026-08-12', '2026-08-12'),
  ('el-pinal', 'El Pinal', 6.24529, -75.54455, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (El Pinal), 2026-08-12', '2026-08-12'),
  ('el-progreso', 'El Progreso', 6.30598, -75.58222, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (El Progreso), 2026-08-12', '2026-08-12'),
  ('envigado', 'Envigado', 6.17472, -75.59706, 'Envigado', null, null, null, null, null, null, true, 'OpenStreetMap (Estación del Metro Envigado), 2026-08-12', '2026-08-12'),
  ('estadio', 'Estadio', 6.25335, -75.58823, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Estadio), 2026-08-12', '2026-08-12'),
  ('exposiciones', 'Exposiciones', 6.23842, -75.57317, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Exposiciones), 2026-08-12', '2026-08-12'),
  ('facultad-de-minas', 'Facultad de Minas', 6.264, -75.5835, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('floresta', 'Floresta', 6.2587, -75.59774, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Floresta), 2026-08-12', '2026-08-12'),
  ('gardel', 'Gardel', 6.26767, -75.55501, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Gardel), 2026-08-12', '2026-08-12'),
  ('hospital', 'Hospital', 6.26388, -75.56337, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Hospital), 2026-08-12', '2026-08-12'),
  ('industriales', 'Industriales', 6.23004, -75.57563, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Industriales), 2026-08-12', '2026-08-12'),
  ('integracion', 'Integración', 6.25221, -75.56851, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('integracion-floresta', 'Integración Floresta', 6.248, -75.599, 'Medellín', null, null, null, null, true, null, false, 'integracionBuses heredado del dataset original de index.html; sin fuente documentada', null),
  ('itagui', 'Itagüí', 6.163, -75.60659, 'Itagüí', null, null, null, null, null, null, true, 'OpenStreetMap (Estación del Metro Itagüí), 2026-08-12', '2026-08-12'),
  ('juan-xxiii', 'Juan XXIII', 6.26565, -75.61369, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Juan XXIII), 2026-08-12', '2026-08-12'),
  ('la-aurora', 'La Aurora', 6.28113, -75.61418, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (La Aurora), 2026-08-12', '2026-08-12'),
  ('la-estrella', 'La Estrella', 6.15278, -75.62633, 'La Estrella', null, null, null, null, null, null, true, 'OpenStreetMap (Estación de Metro de la Estrella), 2026-08-12', '2026-08-12'),
  ('la-palma', 'La Palma', 6.23114, -75.60102, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (La Palma), 2026-08-12', '2026-08-12'),
  ('la-playa', 'La Playa', 6.24956, -75.56449, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (La Playa), 2026-08-12', '2026-08-12'),
  ('las-esmeraldas', 'Las Esmeraldas', 6.27837, -75.55315, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Las Esmeraldas), 2026-08-12', '2026-08-12'),
  ('las-torres', 'Las Torres', 6.2366, -75.53636, 'Medellín', null, null, null, null, null, 'En el dataset original figuraba como «Las Esperanzas»; OSM y el trazado de la línea confirman «Las Torres».', true, 'OpenStreetMap (Las Torres), 2026-08-12', '2026-08-12'),
  ('los-colores', 'Los Colores', 6.257, -75.589, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('los-pinos', 'Los Pinos', 6.244, -75.6045, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('loyola', 'Loyola', 6.2386, -75.5468, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('madera', 'Madera', 6.31586, -75.5553, 'Bello', null, null, null, null, null, null, true, 'OpenStreetMap (Madera), 2026-08-12', '2026-08-12'),
  ('manrique', 'Manrique', 6.27324, -75.55405, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Manrique), 2026-08-12', '2026-08-12'),
  ('minorista', 'Minorista', 6.25613, -75.57317, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Minorista), 2026-08-12', '2026-08-12'),
  ('miraflores', 'Miraflores', 6.24188, -75.54921, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Miraflores), 2026-08-12', '2026-08-12'),
  ('niquia', 'Niquía', 6.33785, -75.54426, 'Bello', null, null, null, null, null, null, true, 'OpenStreetMap (Niquía), 2026-08-12', '2026-08-12'),
  ('oriente', 'Oriente', 6.23329, -75.54008, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Oriente), 2026-08-12', '2026-08-12'),
  ('palos-verdes', 'Palos Verdes', 6.26205, -75.55589, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Palos Verdes), 2026-08-12', '2026-08-12'),
  ('parque-aranjuez', 'Parque Aranjuez', 6.28521, -75.55661, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Parque de Aranjuez), 2026-08-12', '2026-08-12'),
  ('parque-berrio', 'Parque Berrío', 6.2505, -75.56821, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Parque Berrío), 2026-08-12', '2026-08-12'),
  ('pilarica', 'Pilarica', 6.277, -75.5725, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('poblado', 'Poblado', 6.21198, -75.57812, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Poblado), 2026-08-12', '2026-08-12'),
  ('popular', 'Popular', 6.29516, -75.5481, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Popular), 2026-08-12', '2026-08-12'),
  ('prado', 'Prado', 6.25684, -75.56616, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Prado), 2026-08-12', '2026-08-12'),
  ('ruta-n-u-de-a', 'Ruta N · U. de A.', 6.27, -75.5655, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('sabaneta', 'Sabaneta', 6.15774, -75.61614, 'Sabaneta', null, null, null, null, null, null, true, 'OpenStreetMap (Sabaneta), 2026-08-12', '2026-08-12'),
  ('san-antonio', 'San Antonio', 6.24717, -75.56968, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (San Antonio), 2026-08-12', '2026-08-12'),
  ('san-javier', 'San Javier', 6.25686, -75.61382, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (San Javier), 2026-08-12', '2026-08-12'),
  ('san-jose', 'San José', 6.24711, -75.56614, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (San José), 2026-08-12', '2026-08-12'),
  ('santa-lucia', 'Santa Lucía', 6.25808, -75.60375, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Santa Lucía), 2026-08-12', '2026-08-12'),
  ('santo-domingo', 'Santo Domingo', 6.29296, -75.54181, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Santo Domingo), 2026-08-12', '2026-08-12'),
  ('suramericana', 'Suramericana', 6.25297, -75.58293, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Suramericana), 2026-08-12', '2026-08-12'),
  ('trece-de-noviembre', 'Trece de Noviembre', 6.24766, -75.54137, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Trece de Noviembre), 2026-08-12', '2026-08-12'),
  ('tricentenario', 'Tricentenario', 6.29031, -75.56471, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Tricentenario), 2026-08-12', '2026-08-12'),
  ('u-de-m', 'U. de M.', 6.23076, -75.60902, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Universidad de Medellín), 2026-08-12', '2026-08-12'),
  ('universal', 'Universal', 6.281, -75.5638, 'Medellín', null, null, null, null, null, null, false, null, null),
  ('universidad', 'Universidad', 6.26941, -75.5658, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Universidad), 2026-08-12', '2026-08-12'),
  ('vallejuelos', 'Vallejuelos', 6.2754, -75.61394, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Vallejuelos), 2026-08-12', '2026-08-12'),
  ('villa-sierra', 'Villa Sierra', 6.23487, -75.52871, 'Medellín', null, null, null, null, null, null, true, 'OpenStreetMap (Villa Sierra), 2026-08-12', '2026-08-12')
on conflict (id) do update set
  nombre = excluded.nombre, lat = excluded.lat, lng = excluded.lng, municipio = excluded.municipio, estructura = excluded.estructura, direccion = excluded.direccion, transferencia = excluded.transferencia, transferencia_nota = excluded.transferencia_nota, integracion_buses = excluded.integracion_buses, notas = excluded.notas, verificado = excluded.verificado, fuente = excluded.fuente, actualizado = excluded.actualizado;

-- ──────────────────────────────────────────────────────────────────────────
-- Líneas (12)
-- ──────────────────────────────────────────────────────────────────────────
insert into public."MetroMed_lineas" (id, nombre, color, tipo, tramo, estado, bicicleta_permitida, tarifa, horario, orden) values
  ('A', 'Línea A', '#1e4fa0', 'metro'::public."MetroMed_tipo_linea", 'Niquía ↔ La Estrella', 'operativa'::public."MetroMed_estado_linea", true, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"05:00"}}'::jsonb, 1),
  ('B', 'Línea B', '#f07830', 'metro'::public."MetroMed_tipo_linea", 'San Antonio ↔ San Javier', 'operativa'::public."MetroMed_estado_linea", true, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"05:00"}}'::jsonb, 2),
  ('H', 'Línea H', '#c8387a', 'cable'::public."MetroMed_tipo_linea", 'Oriente ↔ Villa Sierra', 'operativa'::public."MetroMed_estado_linea", true, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"09:00"}}'::jsonb, 3),
  ('J', 'Línea J', '#c8a020', 'cable'::public."MetroMed_tipo_linea", 'San Javier ↔ La Aurora', 'operativa'::public."MetroMed_estado_linea", true, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"09:00"}}'::jsonb, 4),
  ('K', 'Línea K', '#5aaa28', 'cable'::public."MetroMed_tipo_linea", 'Acevedo ↔ Santo Domingo', 'operativa'::public."MetroMed_estado_linea", true, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"08:30"}}'::jsonb, 5),
  ('L', 'Línea L', '#8a7828', 'cable'::public."MetroMed_tipo_linea", 'Santo Domingo ↔ Arví', 'operativa'::public."MetroMed_estado_linea", false, 'especial'::public."MetroMed_modelo_tarifa", '{"nota":"Servicio turístico al Parque Arví.","noOpera":["martes"],"lunesASabado":{"cierre":"18:00","apertura":"09:00"},"domingosYFestivos":{"cierre":"18:00","apertura":"08:30"}}'::jsonb, 6),
  ('M', 'Línea M', '#282870', 'cable'::public."MetroMed_tipo_linea", 'Miraflores ↔ Trece de Noviembre', 'operativa'::public."MetroMed_estado_linea", true, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"09:00"}}'::jsonb, 7),
  ('P', 'Línea P', '#d01818', 'cable'::public."MetroMed_tipo_linea", 'Acevedo ↔ El Progreso', 'en_construccion'::public."MetroMed_estado_linea", false, 'integrada'::public."MetroMed_modelo_tarifa", null, 8),
  ('T', 'Línea T', '#1e8040', 'tranvia'::public."MetroMed_tipo_linea", 'San Antonio ↔ Oriente', 'operativa'::public."MetroMed_estado_linea", false, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"05:00"}}'::jsonb, 9),
  ('O', 'Línea O', '#28b4d0', 'tranvia'::public."MetroMed_tipo_linea", 'Caribe ↔ La Palma (Av. 80)', 'operativa'::public."MetroMed_estado_linea", false, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"05:00"}}'::jsonb, 10),
  ('1', 'Línea 1', '#287888', 'bus'::public."MetroMed_tipo_linea", 'U. de M. ↔ Parque Aranjuez (Av. del Ferrocarril)', 'operativa'::public."MetroMed_estado_linea", false, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"05:00"}}'::jsonb, 11),
  ('2', 'Línea 2', '#50c0c0', 'bus'::public."MetroMed_tipo_linea", 'U. de M. ↔ Parque Aranjuez (Av. Oriental)', 'operativa'::public."MetroMed_estado_linea", false, 'integrada'::public."MetroMed_modelo_tarifa", '{"nota":null,"noOpera":[],"lunesASabado":{"cierre":"23:00","apertura":"04:30"},"domingosYFestivos":{"cierre":"22:00","apertura":"05:00"}}'::jsonb, 12)
on conflict (id) do update set
  nombre = excluded.nombre, color = excluded.color, tipo = excluded.tipo, tramo = excluded.tramo, estado = excluded.estado, bicicleta_permitida = excluded.bicicleta_permitida, tarifa = excluded.tarifa, horario = excluded.horario, orden = excluded.orden;

-- ──────────────────────────────────────────────────────────────────────────
-- Recorrido de cada línea (define el trazado del mapa)
-- ──────────────────────────────────────────────────────────────────────────
delete from public."MetroMed_linea_estacion";
insert into public."MetroMed_linea_estacion" (linea_id, estacion_id, orden) values
  ('A', 'niquia', 1),
  ('A', 'bello', 2),
  ('A', 'madera', 3),
  ('A', 'acevedo', 4),
  ('A', 'tricentenario', 5),
  ('A', 'caribe', 6),
  ('A', 'universidad', 7),
  ('A', 'hospital', 8),
  ('A', 'prado', 9),
  ('A', 'parque-berrio', 10),
  ('A', 'san-antonio', 11),
  ('A', 'alpujarra', 12),
  ('A', 'exposiciones', 13),
  ('A', 'industriales', 14),
  ('A', 'poblado', 15),
  ('A', 'aguacatala', 16),
  ('A', 'ayura', 17),
  ('A', 'envigado', 18),
  ('A', 'itagui', 19),
  ('A', 'sabaneta', 20),
  ('A', 'la-estrella', 21),
  ('B', 'san-antonio', 1),
  ('B', 'cisneros', 2),
  ('B', 'suramericana', 3),
  ('B', 'estadio', 4),
  ('B', 'floresta', 5),
  ('B', 'santa-lucia', 6),
  ('B', 'san-javier', 7),
  ('H', 'oriente', 1),
  ('H', 'las-torres', 2),
  ('H', 'villa-sierra', 3),
  ('J', 'san-javier', 1),
  ('J', 'juan-xxiii', 2),
  ('J', 'vallejuelos', 3),
  ('J', 'la-aurora', 4),
  ('K', 'acevedo', 1),
  ('K', 'andalucia', 2),
  ('K', 'popular', 3),
  ('K', 'santo-domingo', 4),
  ('L', 'santo-domingo', 1),
  ('L', 'arvi', 2),
  ('M', 'miraflores', 1),
  ('M', 'el-pinal', 2),
  ('M', 'trece-de-noviembre', 3),
  ('P', 'acevedo', 1),
  ('P', 'doce-de-octubre', 2),
  ('P', 'el-progreso', 3),
  ('T', 'san-antonio', 1),
  ('T', 'bicentenario', 2),
  ('T', 'buenos-aires', 3),
  ('T', 'miraflores', 4),
  ('T', 'loyola', 5),
  ('T', 'alejandro-echavarria', 6),
  ('T', 'oriente', 7),
  ('O', 'caribe', 1),
  ('O', 'cordoba', 2),
  ('O', 'pilarica', 3),
  ('O', 'ciudadela-universitaria', 4),
  ('O', 'facultad-de-minas', 5),
  ('O', 'los-colores', 6),
  ('O', 'calasanz', 7),
  ('O', 'integracion-floresta', 8),
  ('O', 'los-pinos', 9),
  ('O', 'santa-lucia', 10),
  ('O', 'la-palma', 11),
  ('1', 'u-de-m', 1),
  ('1', 'integracion', 2),
  ('1', 'chagualo', 3),
  ('1', 'ruta-n-u-de-a', 4),
  ('1', 'universal', 5),
  ('1', 'parque-aranjuez', 6),
  ('2', 'u-de-m', 1),
  ('2', 'san-jose', 2),
  ('2', 'la-playa', 3),
  ('2', 'catedral', 4),
  ('2', 'minorista', 5),
  ('2', 'berlin', 6),
  ('2', 'las-esmeraldas', 7),
  ('2', 'manrique', 8),
  ('2', 'gardel', 9),
  ('2', 'palos-verdes', 10),
  ('2', 'parque-aranjuez', 11)
on conflict (linea_id, estacion_id) do update set
  orden = excluded.orden;

-- ──────────────────────────────────────────────────────────────────────────
-- Estaciones co-ubicadas
-- ──────────────────────────────────────────────────────────────────────────
delete from public."MetroMed_estaciones_colocadas";
-- Ninguna: los pares del dataset original resultaron ser un artefacto de
-- coordenadas equivocadas (ver data/README.md).

-- ──────────────────────────────────────────────────────────────────────────
-- Servicios confirmados (23) — la ausencia de fila significa "sin verificar"
-- ──────────────────────────────────────────────────────────────────────────
insert into public."MetroMed_estacion_servicio" (estacion_id, servicio, disponible, fuente, actualizado) values
  ('aguacatala', 'parqueaderoBicicletas', true, 'OpenStreetMap (Aguacatala), 2026-08-12', '2026-08-12'),
  ('alpujarra', 'encicla', true, 'OpenStreetMap (Alpujarra), 2026-08-12', '2026-08-12'),
  ('andalucia', 'parqueaderoBicicletas', true, 'OpenStreetMap (Andalucía), 2026-08-12', '2026-08-12'),
  ('arvi', 'parqueaderoBicicletas', true, 'OpenStreetMap (Arví), 2026-08-12', '2026-08-12'),
  ('chagualo', 'encicla', true, 'OpenStreetMap (Chagualo), 2026-08-12', '2026-08-12'),
  ('cisneros', 'encicla', true, 'OpenStreetMap (Cisneros), 2026-08-12', '2026-08-12'),
  ('envigado', 'encicla', true, 'OpenStreetMap (Estación del Metro Envigado), 2026-08-12', '2026-08-12'),
  ('estadio', 'encicla', true, 'OpenStreetMap (Estadio), 2026-08-12', '2026-08-12'),
  ('estadio', 'parqueaderoBicicletas', true, 'OpenStreetMap (Estadio), 2026-08-12', '2026-08-12'),
  ('exposiciones', 'encicla', true, 'OpenStreetMap (Exposiciones), 2026-08-12', '2026-08-12'),
  ('floresta', 'encicla', true, 'OpenStreetMap (Floresta), 2026-08-12', '2026-08-12'),
  ('industriales', 'encicla', true, 'OpenStreetMap (Industriales), 2026-08-12', '2026-08-12'),
  ('industriales', 'parqueaderoBicicletas', true, 'OpenStreetMap (Industriales), 2026-08-12', '2026-08-12'),
  ('itagui', 'parqueaderoBicicletas', true, 'OpenStreetMap (Estación del Metro Itagüí), 2026-08-12', '2026-08-12'),
  ('la-playa', 'encicla', true, 'OpenStreetMap (La Playa), 2026-08-12', '2026-08-12'),
  ('niquia', 'parqueaderoBicicletas', true, 'OpenStreetMap (Niquía), 2026-08-12', '2026-08-12'),
  ('parque-berrio', 'encicla', true, 'OpenStreetMap (Parque Berrío), 2026-08-12', '2026-08-12'),
  ('san-antonio', 'encicla', true, 'OpenStreetMap (San Antonio), 2026-08-12', '2026-08-12'),
  ('suramericana', 'encicla', true, 'OpenStreetMap (Suramericana), 2026-08-12', '2026-08-12'),
  ('suramericana', 'parqueaderoBicicletas', true, 'OpenStreetMap (Suramericana), 2026-08-12', '2026-08-12'),
  ('u-de-m', 'parqueaderoBicicletas', true, 'OpenStreetMap (Universidad de Medellín), 2026-08-12', '2026-08-12'),
  ('universidad', 'encicla', true, 'OpenStreetMap (Universidad), 2026-08-12', '2026-08-12'),
  ('universidad', 'parqueaderoBicicletas', true, 'OpenStreetMap (Universidad), 2026-08-12', '2026-08-12')
on conflict (estacion_id, servicio) do update set
  disponible = excluded.disponible, fuente = excluded.fuente, actualizado = excluded.actualizado;

-- ──────────────────────────────────────────────────────────────────────────
-- Tarifas (vigencia 2026)
-- ──────────────────────────────────────────────────────────────────────────
insert into public."MetroMed_tarifas_civica" (id, etiqueta, integraciones_1_4, integraciones_5_7, vigencia, orden) values
  ('frecuente', 'Frecuente', 3820, 4570, '2026', 1),
  ('adultoMayor', 'Adulto mayor', 3330, 4080, '2026', 2),
  ('estudiantil', 'Estudiantil', 1600, 2350, '2026', 3),
  ('pcd', 'Persona con discapacidad', 2720, 3470, '2026', 4),
  ('alPortador', 'Al portador / Eventual', 4400, 5150, '2026', 5)
on conflict (id) do update set
  etiqueta = excluded.etiqueta, integraciones_1_4 = excluded.integraciones_1_4, integraciones_5_7 = excluded.integraciones_5_7, vigencia = excluded.vigencia, orden = excluded.orden;
insert into public."MetroMed_tarifas_especiales" (id, linea_id, etiqueta, valor, nota, vigencia, orden) values
  ('estratos123Amva', 'L', 'Estratos 1, 2 y 3 del AMVA', 3900, 'Tarifa independiente: no está incluida en la integración del sistema.', '2026', 1),
  ('nacionales', 'L', 'Nacionales / Cívica personalizada', 11900, 'Tarifa independiente: no está incluida en la integración del sistema.', '2026', 2),
  ('extranjeros', 'L', 'Extranjeros / Al portador', 26700, 'Tarifa independiente: no está incluida en la integración del sistema.', '2026', 3)
on conflict (id) do update set
  linea_id = excluded.linea_id, etiqueta = excluded.etiqueta, valor = excluded.valor, nota = excluded.nota, vigencia = excluded.vigencia, orden = excluded.orden;

commit;


-- ── Comprobación ───────────────────────────────────────────────────────────
-- Debe devolver: 70 estaciones · 12 líneas · 23 servicios
select
  (select count(*) from public."MetroMed_estaciones")        as estaciones,
  (select count(*) from public."MetroMed_lineas")            as lineas,
  (select count(*) from public."MetroMed_estacion_servicio") as servicios_confirmados,
  (select count(*) from public."MetroMed_estaciones" where verificado) as verificadas;
