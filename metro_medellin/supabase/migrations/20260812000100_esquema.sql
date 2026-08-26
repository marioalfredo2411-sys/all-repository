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
