import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as bd from './db.js';
import { libroDelMes } from './informe.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const WEB = join(AQUI, '..', 'web');
const PUERTO = Number(process.env.FICHALBA_PUERTO || 3000);
const TRAS_PROXY = process.env.FICHALBA_TRAS_PROXY === '1';

// Si se define, sólo se puede fichar desde estas IPs (el wifi del taller).
// Ej.: FICHALBA_RED="192.168.1.,88.12.34.56"   ← prefijos, separados por comas
const RED = (process.env.FICHALBA_RED || '').split(',').map((s) => s.trim()).filter(Boolean);

// ------------------------------------------------------------- utilidades ---

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const json = (res, codigo, cuerpo, cabeceras = {}) => {
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', ...cabeceras });
  res.end(JSON.stringify(cuerpo));
};

class PeticionMala extends Error {
  constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; }
}

async function leerCuerpo(req, limite = 8192) {
  let datos = '';
  for await (const trozo of req) {
    datos += trozo;
    if (datos.length > limite) throw new PeticionMala(413, 'Petición demasiado grande');
  }
  if (!datos) return {};
  try { return JSON.parse(datos); }
  catch { throw new PeticionMala(400, 'Petición mal formada'); }
}

function ipDe(req) {
  const directa = req.socket.remoteAddress || '';
  if (!TRAS_PROXY) return directa.replace(/^::ffff:/, '');
  const reenviada = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (reenviada || directa).replace(/^::ffff:/, '');
}

const enLaRedDelTaller = (ip) =>
  RED.length === 0 || RED.some((prefijo) => ip.startsWith(prefijo));

const galletas = (req) => Object.fromEntries(
  (req.headers.cookie || '').split(';').map((c) => {
    const i = c.indexOf('=');
    return i < 0 ? ['', ''] : [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
  })
);

// ------------------------------------------------------- sesiones de admin ---

const sesiones = new Map();          // token -> caduca (ms)
const DURACION_SESION = 8 * 60 * 60 * 1000;
const fallosAdmin = new Map();       // ip -> { n, hasta }

function abrirSesion() {
  const token = randomBytes(24).toString('hex');
  sesiones.set(token, Date.now() + DURACION_SESION);
  return token;
}

function esAdmin(req) {
  const token = galletas(req).admin;
  if (!token) return false;
  const caduca = sesiones.get(token);
  if (!caduca || caduca < Date.now()) { sesiones.delete(token); return false; }
  return true;
}

// ------------------------------------------------------------------ rutas ---

async function estatico(res, ruta) {
  const limpia = normalize(ruta).replace(/^(\.\.[/\\])+/, '');
  const fichero = join(WEB, limpia);
  if (!fichero.startsWith(WEB)) return json(res, 403, { error: 'prohibido' });
  try {
    const contenido = await readFile(fichero);
    res.writeHead(200, {
      'content-type': TIPOS[extname(fichero)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(contenido);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('No existe');
  }
}

function estado() {
  const { fecha, hora } = bd.local();
  const fichados = bd.fichadosDelDia(fecha);
  return {
    fecha, hora,
    // El reloj de la tablet se pinta con ESTA hora, no con la del iPad: lo que
    // el trabajador ve y lo que se guarda tienen que ser lo mismo.
    utc: new Date().toISOString(), zona: bd.ZONA,
    trabajadores: bd.trabajadoresActivos().map((t) => ({
      id: t.id, nombre: t.nombre, hora: fichados[t.id] ?? null,
    })),
  };
}

function fichar(req, res, cuerpo) {
  const ip = ipDe(req);
  if (!enLaRedDelTaller(ip)) {
    return json(res, 403, { error: 'Este dispositivo no está en la red del taller.' });
  }
  const trabajador = bd.trabajadorPorId(Number(cuerpo.trabajador_id));
  if (!trabajador || !trabajador.activo) return json(res, 404, { error: 'Trabajador no encontrado.' });

  if (bd.estaBloqueado(trabajador)) {
    return json(res, 429, { error: 'Demasiados intentos. Espera un minuto.' });
  }
  if (!bd.pinCorrecto(cuerpo.pin ?? '', trabajador.pin_hash)) {
    const bloqueado = bd.apuntarFallo(trabajador);
    return json(res, 401, {
      error: bloqueado ? 'PIN incorrecto. Bloqueado un minuto.' : 'PIN incorrecto.',
    });
  }
  bd.limpiarFallos(trabajador.id);

  const { hora, repetido } = bd.registrarFichaje(trabajador.id, { origen: 'TABLET', ip });
  return json(res, 200, { nombre: trabajador.nombre, hora, repetido });
}

function admin(req, res, url, cuerpo) {
  const ruta = url.pathname.slice('/api/admin'.length);

  if (ruta === '/login' && req.method === 'POST') {
    const ip = ipDe(req);
    const castigo = fallosAdmin.get(ip);
    if (castigo && castigo.hasta > Date.now()) {
      return json(res, 429, { error: 'Demasiados intentos. Espera un minuto.' });
    }
    const guardado = bd.leerConfig('pin_admin');
    if (!guardado || !bd.pinCorrecto(cuerpo.pin ?? '', guardado)) {
      const n = (castigo?.n ?? 0) + 1;
      fallosAdmin.set(ip, { n, hasta: n >= 5 ? Date.now() + 60_000 : 0 });
      return json(res, 401, { error: 'PIN incorrecto.' });
    }
    fallosAdmin.delete(ip);
    return json(res, 200, { ok: true }, {
      'set-cookie': `admin=${abrirSesion()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${DURACION_SESION / 1000}`,
    });
  }

  if (!esAdmin(req)) return json(res, 401, { error: 'Necesitas entrar como administrador.' });

  if (ruta === '/salir' && req.method === 'POST') {
    sesiones.delete(galletas(req).admin);
    return json(res, 200, { ok: true }, { 'set-cookie': 'admin=; Path=/; Max-Age=0' });
  }

  if (ruta === '/dia' && req.method === 'GET') {
    const fecha = url.searchParams.get('fecha') || bd.local().fecha;
    return json(res, 200, { fecha, fichajes: bd.fichajesDelDia(fecha) });
  }

  if (ruta === '/exportar.xlsx' && req.method === 'GET') {
    const mes = url.searchParams.get('mes') || bd.local().fecha.slice(0, 7);
    const [anio, numeroMes] = mes.split('-').map(Number);
    if (!anio || !numeroMes || numeroMes < 1 || numeroMes > 12) {
      return json(res, 400, { error: 'Mes no válido.' });
    }
    const { nombre, datos } = libroDelMes(anio, numeroMes);
    res.writeHead(200, {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${nombre}"`,
      'content-length': datos.length,
    });
    return res.end(datos);
  }

  if (ruta === '/exportar.csv' && req.method === 'GET') {
    const hoy = bd.local().fecha;
    const desde = url.searchParams.get('desde') || hoy.slice(0, 8) + '01';
    const hasta = url.searchParams.get('hasta') || hoy;
    const filas = bd.fichajesEntre(desde, hasta);
    const escapar = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = '﻿' + [
      ['Fecha', 'Hora', 'Trabajador', 'Tipo', 'Instante UTC', 'Origen', 'Anulado'].join(';'),
      ...filas.map((f) => [
        f.fecha_local, f.hora_local, f.nombre, f.tipo, f.instante_utc, f.origen,
        f.anulado_motivo ? `ANULADO: ${f.anulado_motivo}` : '',
      ].map(escapar).join(';')),
    ].join('\r\n');
    res.writeHead(200, {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="fichajes_${desde}_${hasta}.csv"`,
    });
    return res.end(csv);
  }

  if (ruta === '/anular' && req.method === 'POST') {
    const motivo = String(cuerpo.motivo ?? '').trim();
    if (motivo.length < 5) return json(res, 400, { error: 'Hace falta un motivo.' });
    try {
      bd.anularFichaje(Number(cuerpo.fichaje_id), motivo);
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 400, { error: String(e.message) });
    }
  }

  if (ruta === '/trabajadores' && req.method === 'GET') {
    return json(res, 200, { trabajadores: bd.todosLosTrabajadores() });
  }

  if (ruta === '/trabajadores' && req.method === 'POST') {
    const { accion, id, nombre, pin } = cuerpo;
    try {
      if (accion === 'alta') {
        if (!nombre?.trim()) return json(res, 400, { error: 'Falta el nombre.' });
        if (!/^\d{4}$/.test(String(pin ?? ''))) return json(res, 400, { error: 'El PIN son 4 cifras.' });
        bd.altaTrabajador(nombre, pin);
      } else if (accion === 'pin') {
        if (!/^\d{4}$/.test(String(pin ?? ''))) return json(res, 400, { error: 'El PIN son 4 cifras.' });
        bd.cambiarPin(Number(id), pin);
      } else if (accion === 'renombrar') {
        bd.renombrar(Number(id), String(nombre ?? ''));
      } else if (accion === 'activo') {
        bd.cambiarActivo(Number(id), Boolean(cuerpo.activo));
      } else {
        return json(res, 400, { error: 'Acción desconocida.' });
      }
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 400, { error: String(e.message) });
    }
  }

  if (ruta === '/pin-admin' && req.method === 'POST') {
    if (!/^\d{4,8}$/.test(String(cuerpo.pin ?? ''))) {
      return json(res, 400, { error: 'El PIN son de 4 a 8 cifras.' });
    }
    bd.guardarConfig('pin_admin', bd.hashPin(cuerpo.pin));
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'No existe' });
}

// --------------------------------------------------------------- servidor ---

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const cuerpo = req.method === 'POST' ? await leerCuerpo(req) : {};
      if (url.pathname === '/api/estado' && req.method === 'GET') return json(res, 200, estado());
      if (url.pathname === '/api/fichar' && req.method === 'POST') return fichar(req, res, cuerpo);
      if (url.pathname.startsWith('/api/admin')) return admin(req, res, url, cuerpo);
      return json(res, 404, { error: 'No existe' });
    }
    if (url.pathname === '/') return estatico(res, 'index.html');
    if (url.pathname === '/admin' || url.pathname === '/admin/') return estatico(res, 'admin/index.html');
    return estatico(res, url.pathname);
  } catch (e) {
    if (res.headersSent) return;
    if (e instanceof PeticionMala) return json(res, e.codigo, { error: e.message });
    console.error('error:', e.message);
    json(res, 500, { error: 'Error del servidor' });
  }
});

servidor.listen(PUERTO, () => {
  console.log(`fichalba escuchando en http://localhost:${PUERTO}`);
  console.log(`  base de datos: ${bd.RUTA_BD}`);
  console.log(`  zona horaria:  ${bd.ZONA}`);
  console.log(`  red del taller: ${RED.length ? RED.join(', ') : 'sin restricción'}`);
  if (!bd.leerConfig('pin_admin')) {
    console.log('  AVISO: no hay PIN de administrador. Créalo con: npm run trabajador -- admin 1234');
  }
});
