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
