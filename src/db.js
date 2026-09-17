import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const RUTA_BD = process.env.FICHALBA_BD || join(AQUI, '..', 'datos', 'fichalba.db');
export const ZONA = process.env.FICHALBA_TZ || 'Europe/Madrid';

mkdirSync(dirname(RUTA_BD), { recursive: true });
export const db = new DatabaseSync(RUTA_BD);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(readFileSync(join(AQUI, 'esquema.sql'), 'utf8'));

// ---------------------------------------------------------------- tiempo ---

const FMT_FECHA = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
});
const FMT_HORA = new Intl.DateTimeFormat('es-ES', {
  timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false,
});

/** Fecha y hora del taller a partir de un instante. Todo cálculo usa el UTC. */
export function local(d = new Date()) {
  return { fecha: FMT_FECHA.format(d), hora: FMT_HORA.format(d) };
}

export const ahoraUtc = () => new Date().toISOString();

// ------------------------------------------------------------------ PIN ---

export function hashPin(pin) {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(String(pin), sal, 32).toString('hex')}`;
}

export function pinCorrecto(pin, guardado) {
  const [sal, esperado] = String(guardado).split(':');
  if (!sal || !esperado) return false;
  const calculado = scryptSync(String(pin), sal, 32);
  const referencia = Buffer.from(esperado, 'hex');
  return calculado.length === referencia.length && timingSafeEqual(calculado, referencia);
}

// ---------------------------------------------------------------- config ---

export const leerConfig = (clave) =>
  db.prepare('SELECT valor FROM config WHERE clave = ?').get(clave)?.valor ?? null;

export const guardarConfig = (clave, valor) =>
  db.prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ' +
             'ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').run(clave, valor);

// ----------------------------------------------------------- trabajadores ---

export const trabajadoresActivos = () =>
  db.prepare('SELECT id, nombre FROM trabajador WHERE activo = 1 ORDER BY orden, nombre').all();

export const todosLosTrabajadores = () =>
  db.prepare('SELECT id, nombre, activo, orden FROM trabajador ORDER BY activo DESC, orden, nombre').all();

export const trabajadorPorId = (id) =>
  db.prepare('SELECT * FROM trabajador WHERE id = ?').get(id);

export function altaTrabajador(nombre, pin) {
  // El orden de alta manda: la lista de la tablet sale como la escribió el jefe,
  // no alfabética. Así cada uno encuentra siempre su nombre en el mismo sitio.
  const ultimo = db.prepare('SELECT IFNULL(MAX(orden), 0) AS n FROM trabajador').get().n;
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO trabajador (nombre, pin_hash, orden, creado_utc) VALUES (?, ?, ?, ?)'
  ).run(nombre.trim(), hashPin(pin), ultimo + 1, ahoraUtc());
  return Number(lastInsertRowid);
}

export const cambiarPin = (id, pin) =>
  db.prepare('UPDATE trabajador SET pin_hash = ?, intentos_fallidos = 0, ' +
             'bloqueado_hasta_utc = NULL WHERE id = ?').run(hashPin(pin), id);

export const cambiarActivo = (id, activo) =>
  db.prepare('UPDATE trabajador SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);

export const renombrar = (id, nombre) =>
  db.prepare('UPDATE trabajador SET nombre = ? WHERE id = ?').run(nombre.trim(), id);

// --------------------------------------------------------------- fichajes ---

/** Quién ha fichado hoy: { trabajador_id -> 'HH:MM' } */
export function fichadosDelDia(fecha, tipo = 'ENTRADA') {
  const filas = db.prepare(
    'SELECT trabajador_id, hora_local FROM v_fichaje_vigente WHERE fecha_local = ? AND tipo = ?'
  ).all(fecha, tipo);
  return Object.fromEntries(filas.map((f) => [f.trabajador_id, f.hora_local]));
}

/** Inserta el fichaje. Si ese trabajador ya tiene uno vigente hoy, no duplica. */
export function registrarFichaje(trabajadorId, { tipo = 'ENTRADA', origen = 'TABLET', ip = null } = {}) {
  const instante = new Date();
  const { fecha, hora } = local(instante);

  const previo = db.prepare(
    'SELECT hora_local FROM v_fichaje_vigente WHERE trabajador_id = ? AND fecha_local = ? AND tipo = ?'
  ).get(trabajadorId, fecha, tipo);
  if (previo) return { fecha, hora: previo.hora_local, repetido: true };

  db.prepare(
    'INSERT INTO fichaje (trabajador_id, tipo, instante_utc, fecha_local, hora_local, origen, ip) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(trabajadorId, tipo, instante.toISOString(), fecha, hora, origen, ip);
  return { fecha, hora, repetido: false };
}

export const fichajesDelDia = (fecha) =>
  db.prepare(
    `SELECT f.id, f.trabajador_id, t.nombre, f.tipo, f.hora_local, f.instante_utc, f.origen,
            a.motivo AS anulado_motivo
       FROM fichaje f
       JOIN trabajador t ON t.id = f.trabajador_id
       LEFT JOIN anulacion a ON a.fichaje_id = f.id
      WHERE f.fecha_local = ?
      ORDER BY f.instante_utc`
  ).all(fecha);

export const fichajesEntre = (desde, hasta) =>
  db.prepare(
    `SELECT f.fecha_local, f.hora_local, t.id AS trabajador_id, t.nombre, f.tipo,
            f.instante_utc, f.origen, a.motivo AS anulado_motivo
       FROM fichaje f
       JOIN trabajador t ON t.id = f.trabajador_id
       LEFT JOIN anulacion a ON a.fichaje_id = f.id
      WHERE f.fecha_local BETWEEN ? AND ?
      ORDER BY f.fecha_local, t.nombre, f.instante_utc`
  ).all(desde, hasta);

export const anularFichaje = (fichajeId, motivo) =>
  db.prepare('INSERT INTO anulacion (fichaje_id, motivo, instante_utc) VALUES (?, ?, ?)')
    .run(fichajeId, motivo, ahoraUtc());

// ------------------------------------------------------ control de intentos ---

export function estaBloqueado(trabajador) {
  return trabajador.bloqueado_hasta_utc != null &&
         trabajador.bloqueado_hasta_utc > ahoraUtc();
}

export function apuntarFallo(trabajador, maxIntentos = 5, castigoSegundos = 60) {
  const intentos = trabajador.intentos_fallidos + 1;
  const bloqueo = intentos >= maxIntentos
    ? new Date(Date.now() + castigoSegundos * 1000).toISOString()
    : null;
  db.prepare('UPDATE trabajador SET intentos_fallidos = ?, bloqueado_hasta_utc = ? WHERE id = ?')
    .run(bloqueo ? 0 : intentos, bloqueo, trabajador.id);
  return bloqueo != null;
}

export const limpiarFallos = (id) =>
  db.prepare('UPDATE trabajador SET intentos_fallidos = 0, bloqueado_hasta_utc = NULL WHERE id = ?')
    .run(id);
