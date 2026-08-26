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
