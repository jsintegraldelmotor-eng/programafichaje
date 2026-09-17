-- fichalba — esquema mínimo: fichaje de entrada en la tablet
-- Un fichaje NO se modifica ni se borra nunca. Si está mal, se anula
-- (queda el original + el motivo). Lo impiden disparadores de la propia BD.

CREATE TABLE IF NOT EXISTS trabajador (
  id                   INTEGER PRIMARY KEY,
  nombre               TEXT    NOT NULL,
  pin_hash             TEXT    NOT NULL,
  activo               INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  orden                INTEGER NOT NULL DEFAULT 0,
  intentos_fallidos    INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta_utc  TEXT,
  creado_utc           TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS fichaje (
  id             INTEGER PRIMARY KEY,
  trabajador_id  INTEGER NOT NULL REFERENCES trabajador(id),
  tipo           TEXT    NOT NULL DEFAULT 'ENTRADA' CHECK (tipo IN ('ENTRADA','SALIDA')),
  instante_utc   TEXT    NOT NULL,   -- ISO-8601 UTC: la hora de verdad
  fecha_local    TEXT    NOT NULL,   -- 'YYYY-MM-DD' en Europe/Madrid
  hora_local     TEXT    NOT NULL,   -- 'HH:MM'     en Europe/Madrid
  origen         TEXT    NOT NULL DEFAULT 'TABLET',
  ip             TEXT
);

-- Una entrada vigente por trabajador y día. No se puede imponer con un índice
-- único porque un fichaje anulado deja de contar (y debe poder rehacerse),
-- y el índice no sabe de anulaciones: la comprobación va en registrarFichaje().
CREATE INDEX IF NOT EXISTS ix_fichaje_dia   ON fichaje(trabajador_id, fecha_local, tipo);
CREATE INDEX IF NOT EXISTS ix_fichaje_fecha ON fichaje(fecha_local);

CREATE TRIGGER IF NOT EXISTS fichaje_inalterable_update BEFORE UPDATE ON fichaje
BEGIN SELECT RAISE(ABORT, 'un fichaje no se modifica: anúlalo'); END;

CREATE TRIGGER IF NOT EXISTS fichaje_inalterable_delete BEFORE DELETE ON fichaje
BEGIN SELECT RAISE(ABORT, 'un fichaje no se borra: anúlalo'); END;

CREATE TABLE IF NOT EXISTS anulacion (
  id            INTEGER PRIMARY KEY,
  fichaje_id    INTEGER NOT NULL UNIQUE REFERENCES fichaje(id),
  motivo        TEXT    NOT NULL CHECK (length(trim(motivo)) >= 5),
  instante_utc  TEXT    NOT NULL
);

CREATE TRIGGER IF NOT EXISTS anulacion_inalterable BEFORE UPDATE ON anulacion
BEGIN SELECT RAISE(ABORT, 'una anulacion no se modifica'); END;

-- Los fichajes que cuentan: los que nadie ha anulado.
CREATE VIEW IF NOT EXISTS v_fichaje_vigente AS
SELECT f.* FROM fichaje f
 WHERE NOT EXISTS (SELECT 1 FROM anulacion a WHERE a.fichaje_id = f.id);

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
