-- ============================================================================
--  fichalba — esquema inicial (fase 1: jornada)
--  SQLite 3.40+
--
--  REGLA DE ORO: las tablas `marcaje` y `correccion` son APPEND-ONLY.
--  Sólo se insertan filas. Nunca se modifican ni se borran: hay disparadores
--  que lo impiden a nivel de base de datos, no sólo en el código.
--  Todo instante se guarda en UTC, en ISO-8601 ('2026-09-11T12:03:45.000Z').
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- control ---

CREATE TABLE migracion (
  version       INTEGER PRIMARY KEY,
  nombre        TEXT NOT NULL,
  aplicada_utc  TEXT NOT NULL
);

CREATE TABLE config (
  clave            TEXT PRIMARY KEY,
  valor            TEXT NOT NULL,
  actualizado_utc  TEXT NOT NULL
);

-- --------------------------------------------------------------- personas ---

CREATE TABLE trabajador (
  id                   INTEGER PRIMARY KEY,
  nombre               TEXT NOT NULL,
  apellidos            TEXT NOT NULL,
  nif                  TEXT,                    -- lo pide el informe para la Inspección
  email                TEXT,
  rol                  TEXT NOT NULL DEFAULT 'OPERARIO'
                          CHECK (rol IN ('OPERARIO','ADMIN')),
  ficha                INTEGER NOT NULL DEFAULT 1 CHECK (ficha IN (0,1)),
  pin_hash             TEXT NOT NULL,           -- argon2id
  pin_actualizado_utc  TEXT NOT NULL,
  intentos_fallidos    INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta_utc  TEXT,
  alta_utc             TEXT NOT NULL,
  baja_utc             TEXT,                    -- NULL = en plantilla
  creado_utc           TEXT NOT NULL,
  actualizado_utc      TEXT NOT NULL
);

CREATE UNIQUE INDEX ix_trabajador_nif ON trabajador(nif) WHERE nif IS NOT NULL;
CREATE INDEX ix_trabajador_activo ON trabajador(baja_utc);

-- Un trabajador de baja NO se borra: sus marcajes deben conservarse 4 años.

CREATE TABLE dispositivo (
  id              INTEGER PRIMARY KEY,
  trabajador_id   INTEGER REFERENCES trabajador(id),  -- NULL = tablet compartida
  tipo            TEXT NOT NULL CHECK (tipo IN ('MOVIL','TABLET')),
  nombre          TEXT NOT NULL,                      -- "Móvil de Javi", "Tablet taller"
  token_hash      TEXT NOT NULL UNIQUE,
  alta_utc        TEXT NOT NULL,
  ultimo_uso_utc  TEXT,
  revocado_utc    TEXT,
  CHECK (tipo <> 'MOVIL' OR trabajador_id IS NOT NULL)
);

CREATE TABLE sesion (
  id              INTEGER PRIMARY KEY,
  token_hash      TEXT NOT NULL UNIQUE,
  trabajador_id   INTEGER NOT NULL REFERENCES trabajador(id),
  dispositivo_id  INTEGER REFERENCES dispositivo(id),
  creada_utc      TEXT NOT NULL,
  expira_utc      TEXT NOT NULL,
  revocada_utc    TEXT
);

CREATE INDEX ix_sesion_trabajador ON sesion(trabajador_id);

-- ------------------------------------------------------------------- red ---
-- Presencia por wifi del taller: se compara la IP pública de la petición.

CREATE TABLE red_permitida (
  id           INTEGER PRIMARY KEY,
  descripcion  TEXT NOT NULL,          -- "Fibra del taller"
  cidr         TEXT NOT NULL,          -- "88.12.34.56/32", "2a02:9130::/48"
  activo       INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  creada_utc   TEXT NOT NULL,
  creada_por   INTEGER REFERENCES trabajador(id)
);

-- --------------------------------------------------------------- MARCAJE ---
-- El corazón del sistema. Un marcaje es un HECHO ocurrido, no un estado.
-- Nunca se corrige: se añade una fila en `correccion` que lo anula o sustituye.

CREATE TABLE marcaje (
  id              INTEGER PRIMARY KEY,

  -- UUID generado en el dispositivo. Hace idempotente la cola offline:
  -- si el móvil reintenta el envío, el segundo choca contra este UNIQUE.
  id_cliente      TEXT NOT NULL UNIQUE,

  trabajador_id   INTEGER NOT NULL REFERENCES trabajador(id),
  tipo            TEXT NOT NULL
                     CHECK (tipo IN ('ENTRADA','SALIDA','PAUSA_INICIO','PAUSA_FIN')),

  instante_utc    TEXT NOT NULL,   -- canónico: todo cálculo se hace sobre este
  instante_local  TEXT NOT NULL,   -- congelado con su huso: '2026-09-11T14:03:45+02:00'
  fecha_jornada   TEXT NOT NULL,   -- 'YYYY-MM-DD': día al que se imputa (ver MODELO-DATOS §5)

  origen          TEXT NOT NULL CHECK (origen IN ('MOVIL','TABLET','CORRECCION')),
  dispositivo_id  INTEGER REFERENCES dispositivo(id),

  red             TEXT NOT NULL CHECK (red IN ('TALLER','FUERA','DESCONOCIDA')),

  -- De quién es el reloj que marcó la hora. SERVIDOR siempre que haya conexión;
  -- DISPOSITIVO sólo en fichajes que estuvieron en la cola offline.
  reloj           TEXT NOT NULL CHECK (reloj IN ('SERVIDOR','DISPOSITIVO')),
  registrado_utc  TEXT NOT NULL,   -- cuándo llegó al servidor

  autor_id        INTEGER REFERENCES trabajador(id),  -- el admin, si origen='CORRECCION'

  -- Cadena de integridad (ver MODELO-DATOS §7)
  hash_anterior   TEXT NOT NULL,
  hash            TEXT NOT NULL UNIQUE,

  CHECK ( (origen = 'CORRECCION') = (autor_id IS NOT NULL) )
);

CREATE INDEX ix_marcaje_trabajador_fecha ON marcaje(trabajador_id, fecha_jornada);
CREATE INDEX ix_marcaje_fecha           ON marcaje(fecha_jornada);
CREATE INDEX ix_marcaje_instante        ON marcaje(instante_utc);

CREATE TRIGGER marcaje_inalterable_update BEFORE UPDATE ON marcaje
BEGIN
  SELECT RAISE(ABORT, 'marcaje es inalterable: usa una correccion');
END;

CREATE TRIGGER marcaje_inalterable_delete BEFORE DELETE ON marcaje
BEGIN
  SELECT RAISE(ABORT, 'marcaje es inalterable: no se borra');
END;

-- Evidencia técnica del fichaje. Va APARTE y NO entra en la cadena de hashes,
-- precisamente para poder purgarla (la IP es dato personal: minimización RGPD)
-- sin romper la integridad del registro legal.
CREATE TABLE marcaje_red (
  marcaje_id   INTEGER PRIMARY KEY REFERENCES marcaje(id),
  ip_origen    TEXT,
  user_agent   TEXT,
  purgado_utc  TEXT
);

-- ------------------------------------------------------------ CORRECCION ---
-- Tampoco se modifica ni se borra. Corregir dos veces = dos filas encadenadas.

CREATE TABLE correccion (
  id                   INTEGER PRIMARY KEY,
  tipo                 TEXT NOT NULL CHECK (tipo IN ('ALTA','MODIFICACION','ANULACION')),

  marcaje_afectado_id  INTEGER REFERENCES marcaje(id),  -- el original, que sigue ahí
  marcaje_nuevo_id     INTEGER REFERENCES marcaje(id),  -- el que lo sustituye

  motivo               TEXT NOT NULL,
  autor_id             INTEGER NOT NULL REFERENCES trabajador(id),
  instante_utc         TEXT NOT NULL,

  hash_anterior        TEXT NOT NULL,
  hash                 TEXT NOT NULL UNIQUE,

  CHECK (length(trim(motivo)) >= 10),        -- "error" no es un motivo
  CHECK (
       (tipo = 'ALTA'         AND marcaje_afectado_id IS NULL     AND marcaje_nuevo_id IS NOT NULL)
    OR (tipo = 'MODIFICACION' AND marcaje_afectado_id IS NOT NULL AND marcaje_nuevo_id IS NOT NULL)
    OR (tipo = 'ANULACION'    AND marcaje_afectado_id IS NOT NULL AND marcaje_nuevo_id IS NULL)
  )
);

-- Un marcaje sólo puede ser corregido una vez; lo siguiente corrige al sustituto.
CREATE UNIQUE INDEX ix_correccion_afectado
  ON correccion(marcaje_afectado_id) WHERE marcaje_afectado_id IS NOT NULL;
CREATE UNIQUE INDEX ix_correccion_nuevo
  ON correccion(marcaje_nuevo_id) WHERE marcaje_nuevo_id IS NOT NULL;

CREATE TRIGGER correccion_inalterable_update BEFORE UPDATE ON correccion
BEGIN
  SELECT RAISE(ABORT, 'correccion es inalterable');
END;

CREATE TRIGGER correccion_inalterable_delete BEFORE DELETE ON correccion
BEGIN
  SELECT RAISE(ABORT, 'correccion es inalterable');
END;

-- Los marcajes que cuentan hoy: los que nadie ha anulado ni sustituido.
-- El histórico completo sigue en `marcaje`, intacto.
CREATE VIEW v_marcaje_vigente AS
SELECT m.*
  FROM marcaje m
 WHERE NOT EXISTS (
   SELECT 1 FROM correccion c WHERE c.marcaje_afectado_id = m.id
 );

-- ------------------------------------------------------------ INCIDENCIA ---
-- Gestión interna, no registro legal: ésta sí se modifica con total libertad.

CREATE TABLE incidencia (
  id             INTEGER PRIMARY KEY,
  trabajador_id  INTEGER NOT NULL REFERENCES trabajador(id),
  fecha_jornada  TEXT NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN (
                    'SIN_SALIDA',          -- se fue sin fichar la salida
                    'PAUSA_ABIERTA',       -- salió a comer y no volvió a fichar
                    'FUERA_DE_RED',        -- fichó desde fuera del wifi del taller
                    'OFFLINE',             -- subido desde la cola, hora del dispositivo
                    'SECUENCIA_INVALIDA',  -- dos entradas seguidas, salida sin entrada...
                    'JORNADA_LARGA'        -- supera el máximo configurado
                 )),
  detalle        TEXT,
  marcaje_id     INTEGER REFERENCES marcaje(id),
  estado         TEXT NOT NULL DEFAULT 'ABIERTA'
                    CHECK (estado IN ('ABIERTA','RESUELTA','DESCARTADA')),
  creada_utc     TEXT NOT NULL,
  resuelta_utc   TEXT,
  resuelta_por   INTEGER REFERENCES trabajador(id),
  resolucion     TEXT,
  correccion_id  INTEGER REFERENCES correccion(id)
);

CREATE UNIQUE INDEX ix_incidencia_unica
  ON incidencia(trabajador_id, fecha_jornada, tipo, IFNULL(marcaje_id, 0));
CREATE INDEX ix_incidencia_abierta ON incidencia(estado, fecha_jornada);

-- -------------------------------------------------------------- INFORMES ---
-- Cada generación queda archivada: el PDF que se entregó es reproducible y
-- su hash demuestra que es el mismo que se entregó.

CREATE TABLE informe_mensual (
  id                    INTEGER PRIMARY KEY,
  trabajador_id         INTEGER NOT NULL REFERENCES trabajador(id),
  anio                  INTEGER NOT NULL,
  mes                   INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  minutos_trabajados    INTEGER NOT NULL,
  minutos_pausa         INTEGER NOT NULL,
  dias_trabajados       INTEGER NOT NULL,
  incidencias_abiertas  INTEGER NOT NULL DEFAULT 0,
  generado_utc          TEXT NOT NULL,
  generado_por          INTEGER NOT NULL REFERENCES trabajador(id),
  ruta_pdf              TEXT NOT NULL,
  hash_pdf              TEXT NOT NULL,
  entregado_utc         TEXT,
  entregado_nota        TEXT
);

CREATE INDEX ix_informe_periodo ON informe_mensual(anio, mes, trabajador_id);

-- ------------------------------------------------------------- AUDITORIA ---
-- Quién entró, quién corrigió, quién exportó. Lo pide el RGPD y salva discusiones.

CREATE TABLE auditoria (
  id            INTEGER PRIMARY KEY,
  instante_utc  TEXT NOT NULL,
  actor_id      INTEGER REFERENCES trabajador(id),
  accion        TEXT NOT NULL,   -- LOGIN_OK, LOGIN_FALLIDO, FICHAJE, CORRECCION,
                                 -- INFORME, EXPORTACION, ALTA_TRABAJADOR, BAJA_TRABAJADOR...
  objeto        TEXT,
  objeto_id     INTEGER,
  detalle       TEXT,            -- JSON
  ip            TEXT
);

CREATE INDEX ix_auditoria_instante ON auditoria(instante_utc);

CREATE TRIGGER auditoria_inalterable_update BEFORE UPDATE ON auditoria
BEGIN
  SELECT RAISE(ABORT, 'auditoria es inalterable');
END;

-- ---------------------------------------------------------------- SEMILLA ---

INSERT INTO config (clave, valor, actualizado_utc) VALUES
  ('empresa_nombre',      'JS Integral del Motor',   '1970-01-01T00:00:00.000Z'),
  ('empresa_cif',         '',                        '1970-01-01T00:00:00.000Z'),
  ('zona_horaria',        'Europe/Madrid',           '1970-01-01T00:00:00.000Z'),
  ('jornada_max_horas',   '12',                      '1970-01-01T00:00:00.000Z'),
  ('retencion_anios',     '4',                       '1970-01-01T00:00:00.000Z'),
  ('purga_ip_dias',       '365',                     '1970-01-01T00:00:00.000Z'),
  ('exigir_red_taller',   'aviso',                   '1970-01-01T00:00:00.000Z');
  -- exigir_red_taller: 'aviso' = se registra igual y se marca incidencia (recomendado).
  --                    'bloquear' = no deja fichar fuera del wifi. Ver MODELO-DATOS §6.

INSERT INTO migracion (version, nombre, aplicada_utc)
VALUES (1, '001_inicial', '1970-01-01T00:00:00.000Z');
