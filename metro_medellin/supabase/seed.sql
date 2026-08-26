-- Generado por scripts/build-sql.mjs · NO EDITAR A MANO.
-- Fuente: data/*.json · Regenerar con: npm run db:sql
--
-- Solo DATOS. El esquema está en supabase/migrations/.
-- Para instalar todo de una vez en una base vacía: supabase/instalar.sql
--
-- Re-ejecutable: cada INSERT lleva ON CONFLICT DO UPDATE.

begin;
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
