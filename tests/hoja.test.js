import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../app/logica.js';
import * as hoja from '../app/hoja.js';

/* La cola hacia la hoja de cálculo. Lo importante que se comprueba aquí:
   si internet falla, el fichaje NO se pierde, se queda esperando. */

function montaje() {
  const estado = L.estadoVacio();
  estado.config.hojaUrl = 'https://ejemplo/script';
  estado.config.hojaClave = 'taller';
  let guardados = 0;
  return { estado, guardar: () => guardados++, veces: () => guardados };
}

/** Sustituye el fetch del navegador por uno de mentira. */
function fingirFetch(respuesta) {
  const llamadas = [];
  globalThis.fetch = async (url, opciones) => {
    llamadas.push({ url, cuerpo: JSON.parse(opciones.body), tipo: opciones.headers['Content-Type'] });
    if (respuesta instanceof Error) throw respuesta;
    return { json: async () => respuesta };
  };
  return llamadas;
}

const unFichaje = (estado) => {
  L.altaTrabajador(estado, 'Paco', 'x');
  return L.fichar(estado, estado.trabajadores[0].id);
};

test('sin hoja conectada no se encola nada', async () => {
  const { estado, guardar } = montaje();
  estado.config.hojaUrl = null;
  const llamadas = fingirFetch({ ok: true });

  const { fichaje } = unFichaje(estado);
  hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, 'Paco'), guardar);

  assert.equal(hoja.sinEnviar(estado), 0);
  assert.equal(llamadas.length, 0, 'no debe llamar a nadie');
});

test('un fichaje se manda a la hoja y la cola queda vacía', async () => {
  const { estado, guardar } = montaje();
  const llamadas = fingirFetch({ ok: true });

  const { fichaje } = unFichaje(estado);
  hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, 'Paco'), guardar);
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, 'https://ejemplo/script');
  assert.equal(llamadas[0].cuerpo.clave, 'taller');
  assert.equal(llamadas[0].cuerpo.acciones[0].nombre, 'Paco');
  assert.equal(hoja.sinEnviar(estado), 0, 'una vez enviada, fuera de la cola');
});

test('se manda como texto plano: si no, el navegador pide permiso antes y Google no contesta', async () => {
  const { estado, guardar } = montaje();
  const llamadas = fingirFetch({ ok: true });
  const { fichaje } = unFichaje(estado);

  hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, 'Paco'), guardar);
  await new Promise((r) => setTimeout(r, 10));

  assert.match(llamadas[0].tipo, /^text\/plain/);
});

test('si no hay internet, el fichaje se queda en la cola y no se pierde', async () => {
  const { estado, guardar } = montaje();
  fingirFetch(new Error('Failed to fetch'));

  const { fichaje } = unFichaje(estado);
  hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, 'Paco'), guardar);
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(hoja.sinEnviar(estado), 1);
  assert.equal(estado.fichajes.length, 1, 'el fichaje sigue guardado en la tablet');
});

test('si la hoja contesta que no (clave mala), tampoco se pierde', async () => {
  const { estado, guardar } = montaje();
  fingirFetch({ ok: false, error: 'clave incorrecta' });

  const { fichaje } = unFichaje(estado);
  hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, 'Paco'), guardar);
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(hoja.sinEnviar(estado), 1);
});

test('cuando vuelve internet se manda todo lo atrasado de una vez', async () => {
  const { estado, guardar } = montaje();
  fingirFetch(new Error('sin red'));

  L.altaTrabajador(estado, 'Aziz', 'x');
  L.altaTrabajador(estado, 'Israel', 'x');
  for (const t of estado.trabajadores) {
    const { fichaje } = L.fichar(estado, t.id);
    hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, t.nombre), guardar);
  }
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(hoja.sinEnviar(estado), 2);

  const llamadas = fingirFetch({ ok: true });
  const resultado = await hoja.enviar(estado, guardar);

  assert.equal(resultado.enviadas, 2);
  assert.equal(hoja.sinEnviar(estado), 0);
  assert.equal(llamadas.length, 1, 'los atrasados van en un solo envío');
  assert.deepEqual(llamadas[0].cuerpo.acciones.map((a) => a.nombre), ['Aziz', 'Israel']);
});

test('la referencia lleva el identificador de la tablet', async () => {
  const { estado } = montaje();
  const { fichaje } = unFichaje(estado);
  const accion = hoja.accionFichaje(estado, fichaje, 'Paco');

  assert.equal(accion.ref, `${estado.config.tabletaId}-${fichaje.id}`);
  assert.match(estado.config.tabletaId, /^[0-9a-f]{6}$/);

  // Dos instalaciones distintas nunca chocan aunque los números coincidan.
  const otra = L.estadoVacio();
  assert.notEqual(otra.config.tabletaId, estado.config.tabletaId);
});

test('anular manda la marca, no un borrado', async () => {
  const { estado, guardar } = montaje();
  const llamadas = fingirFetch({ ok: true });
  const { fichaje } = unFichaje(estado);

  hoja.apuntar(estado, hoja.accionAnulacion(estado, fichaje.id, 'se equivocó de nombre'), guardar);
  await new Promise((r) => setTimeout(r, 10));

  const accion = llamadas[0].cuerpo.acciones[0];
  assert.equal(accion.tipo, 'anulacion');
  assert.equal(accion.ref, hoja.referencia(estado, fichaje.id));
  assert.equal(accion.motivo, 'se equivocó de nombre');
});

test('probar() avisa si la clave no es la buena', async () => {
  fingirFetch({ ok: false, error: 'clave incorrecta' });
  await assert.rejects(() => hoja.probar('https://ejemplo/script', 'mala'), /clave incorrecta/);

  fingirFetch({ ok: true, mensaje: 'lista' });
  assert.deepEqual(await hoja.probar('https://ejemplo/script', 'buena'), { ok: true, mensaje: 'lista' });
});
