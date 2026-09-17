import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../app/logica.js';

/* Las reglas del fichaje se prueban aquí, sin navegador: son funciones puras
   sobre un objeto. Lo que no puede fallar nunca está en estas pruebas. */

const conGente = async (...nombres) => {
  const estado = L.estadoVacio();
  for (const n of nombres) await L.altaTrabajador(estado, n, await L.hashPin('1234'));
  return estado;
};

test('del PIN sólo se guarda una huella, y se comprueba bien', async () => {
  const guardado = await L.hashPin('4821');
  assert.ok(!guardado.includes('4821'), 'el PIN no puede aparecer en claro');
  assert.ok(await L.pinCorrecto('4821', guardado));
  assert.ok(!await L.pinCorrecto('4822', guardado));
  assert.ok(!await L.pinCorrecto('', guardado));
  assert.ok(!await L.pinCorrecto('4821', 'basura'));
});

test('dos huellas del mismo PIN son distintas (sal al azar)', async () => {
  assert.notEqual(await L.hashPin('1111'), await L.hashPin('1111'));
});

test('los PIN al azar no salen adivinables', () => {
  const feos = new Set(['0000', '1234', '1111', '4321']);
  for (let i = 0; i < 200; i++) {
    const pin = L.pinAlAzar();
    assert.match(pin, /^\d{4}$/);
    assert.ok(!feos.has(pin));
  }
});

test('la lista sale en el orden en que se dieron de alta, no alfabético', async () => {
  const estado = await conGente('Salvador', 'Aziz', 'Zakaria');
  assert.deepEqual(L.trabajadoresActivos(estado).map((t) => t.nombre),
                   ['Salvador', 'Aziz', 'Zakaria']);
});

test('fichar cuenta una vez; tocar dos veces no duplica', async () => {
  const estado = await conGente('Paco');
  const [paco] = estado.trabajadores;

  const primero = L.fichar(estado, paco.id);
  assert.equal(primero.repetido, false);

  const segundo = L.fichar(estado, paco.id);
  assert.equal(segundo.repetido, true);
  assert.equal(segundo.hora, primero.hora, 'debe devolver la hora del primero');
  assert.equal(estado.fichajes.length, 1);
});

test('anular no borra el original, y deja volver a fichar', async () => {
  const estado = await conGente('Israel');
  const [israel] = estado.trabajadores;
  const { fichaje } = L.fichar(estado, israel.id);
  const { fecha } = L.local();

  L.anular(estado, fichaje.id, 'fichó su compañero por error');

  assert.equal(estado.fichajes.length, 1, 'el original sigue estando');
  assert.equal(L.fichadosDelDia(estado, fecha)[israel.id], undefined, 'ya no cuenta');
  assert.equal(L.fichar(estado, israel.id).repetido, false, 'puede volver a fichar');
  assert.equal(estado.fichajes.length, 2);
});

test('una anulación sin motivo de verdad se rechaza', async () => {
  const estado = await conGente('Aziz');
  const { fichaje } = L.fichar(estado, estado.trabajadores[0].id);
  assert.throws(() => L.anular(estado, fichaje.id, 'no'), /motivo/);
  assert.throws(() => L.anular(estado, fichaje.id, '   '), /motivo/);
  assert.equal(estado.anulaciones.length, 0);
});

test('un fichaje no se puede anular dos veces', async () => {
  const estado = await conGente('Zakaria');
  const { fichaje } = L.fichar(estado, estado.trabajadores[0].id);
  L.anular(estado, fichaje.id, 'estaba de baja ese día');
  assert.throws(() => L.anular(estado, fichaje.id, 'otra vez por lo mismo'), /ya estaba anulado/);
});

test('cinco PIN fallidos bloquean, y el bloqueo caduca solo', async () => {
  const estado = await conGente('Silvinho');
  const [silvinho] = estado.trabajadores;
  const ahora = Date.now();

  let bloqueado = false;
  for (let i = 0; i < 5; i++) bloqueado = L.apuntarFallo(silvinho, ahora);
  assert.ok(bloqueado);
  assert.ok(L.estaBloqueado(silvinho, ahora));
  assert.ok(!L.estaBloqueado(silvinho, ahora + 61_000), 'al minuto se puede volver a intentar');

  L.limpiarFallos(silvinho);
  assert.ok(!L.estaBloqueado(silvinho, ahora));
});

test('la fecha y la hora son las del taller, no las del reloj de la tablet', () => {
  // 31 de diciembre a las 23:30 UTC = 1 de enero a las 00:30 en España
  assert.deepEqual(L.local(new Date('2026-12-31T23:30:00Z')), { fecha: '2027-01-01', hora: '00:30' });
  // en verano hay dos horas de diferencia
  assert.deepEqual(L.local(new Date('2026-07-15T06:02:00Z')), { fecha: '2026-07-15', hora: '08:02' });
  // y en invierno, una
  assert.deepEqual(L.local(new Date('2026-01-15T07:02:00Z')), { fecha: '2026-01-15', hora: '08:02' });
});

test('el Excel del mes: el anulado no cuenta, pero se ve en el detalle', async () => {
  const estado = await conGente('Paco', 'Aziz');
  const [paco, aziz] = estado.trabajadores;

  const uno = L.fichar(estado, paco.id, new Date('2026-03-02T07:05:00Z'));   // lunes
  L.fichar(estado, aziz.id, new Date('2026-03-02T07:11:00Z'));
  L.fichar(estado, paco.id, new Date('2026-03-03T07:02:00Z'));               // martes
  L.anular(estado, uno.fichaje.id, 'ese día estaba en el médico');

  const [resumen, detalle] = L.hojasDelMes(estado, 2026, 3);

  assert.equal(resumen.filas[0][0], 'Trabajador');
  assert.equal(resumen.filas[0][1], '1 D', 'el 1 de marzo de 2026 es domingo');
  assert.equal(resumen.filas[0][2], '2 L');
  assert.equal(resumen.filas[0].at(-1), 'Días');

  const filaPaco = resumen.filas.find((f) => f[0] === 'Paco');
  assert.equal(filaPaco[2], '', 'el día 2 está anulado: la casilla va vacía');
  assert.equal(filaPaco[3], '08:02', 'el día 3 sí cuenta');
  assert.equal(filaPaco.at(-1), 1, 'sólo un día válido');

  const filaAziz = resumen.filas.find((f) => f[0] === 'Aziz');
  assert.equal(filaAziz[2], '08:11');

  assert.equal(detalle.filas.length, 4, 'las tres filas y la cabecera');
  const anulado = detalle.filas.find((f) => String(f[5]).startsWith('ANULADO'));
  assert.match(anulado[5], /estaba en el médico/, 'el motivo tiene que verse');
  assert.equal(anulado[1], 'lunes');
});

test('quien se da de baja sigue saliendo en el Excel de los meses que fichó', async () => {
  const estado = await conGente('Temporal');
  const [temporal] = estado.trabajadores;
  L.fichar(estado, temporal.id, new Date('2026-05-04T06:00:00Z'));
  temporal.activo = false;

  const [resumen] = L.hojasDelMes(estado, 2026, 5);
  const fila = resumen.filas.find((f) => String(f[0]).startsWith('Temporal'));
  assert.ok(fila, 'tiene que aparecer aunque esté de baja');
  assert.match(fila[0], /\(baja\)/);
  assert.equal(fila.at(-1), 1);
});
