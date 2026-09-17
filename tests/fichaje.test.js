import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Base de datos de usar y tirar, antes de cargar el módulo.
const carpeta = mkdtempSync(join(tmpdir(), 'fichalba-'));
process.env.FICHALBA_BD = join(carpeta, 'prueba.db');
process.env.FICHALBA_TZ = 'Europe/Madrid';
const bd = await import('../src/db.js');
process.on('exit', () => rmSync(carpeta, { recursive: true, force: true }));

test('el PIN se guarda cifrado y se comprueba bien', () => {
  const guardado = bd.hashPin('1234');
  assert.ok(!guardado.includes('1234'), 'el PIN no puede aparecer en claro');
  assert.ok(bd.pinCorrecto('1234', guardado));
  assert.ok(!bd.pinCorrecto('1235', guardado));
  assert.ok(!bd.pinCorrecto('', guardado));
});

test('dos hashes del mismo PIN son distintos (sal aleatoria)', () => {
  assert.notEqual(bd.hashPin('1111'), bd.hashPin('1111'));
});

test('fichar una vez cuenta; tocar dos veces no duplica', () => {
  const id = bd.altaTrabajador('Ana Prueba', '1111');
  const primero = bd.registrarFichaje(id);
  assert.equal(primero.repetido, false);

  const segundo = bd.registrarFichaje(id);
  assert.equal(segundo.repetido, true);
  assert.equal(segundo.hora, primero.hora, 'debe devolver la hora del primero');

  const { fecha } = bd.local();
  assert.equal(Object.keys(bd.fichadosDelDia(fecha)).length, 1);
});

test('un fichaje no se puede modificar ni borrar', () => {
  const id = bd.altaTrabajador('Luis Prueba', '2222');
  bd.registrarFichaje(id);
  const fila = bd.db.prepare('SELECT id FROM fichaje WHERE trabajador_id = ?').get(id);

  assert.throws(() => bd.db.prepare('UPDATE fichaje SET hora_local = ? WHERE id = ?').run('06:00', fila.id),
    /no se modifica/);
  assert.throws(() => bd.db.prepare('DELETE FROM fichaje WHERE id = ?').run(fila.id),
    /no se borra/);
});

test('anular deja el original y permite volver a fichar', () => {
  const id = bd.altaTrabajador('Rosa Prueba', '3333');
  bd.registrarFichaje(id);
  const { fecha } = bd.local();
  const fila = bd.db.prepare('SELECT id FROM fichaje WHERE trabajador_id = ?').get(id);

  bd.anularFichaje(fila.id, 'se equivocó de nombre');

  // el original sigue en la tabla...
  assert.equal(bd.db.prepare('SELECT count(*) c FROM fichaje WHERE trabajador_id = ?').get(id).c, 1);
  // ...pero ya no cuenta
  assert.equal(bd.fichadosDelDia(fecha)[id], undefined);
  // y puede volver a fichar
  assert.equal(bd.registrarFichaje(id).repetido, false);
  assert.equal(bd.db.prepare('SELECT count(*) c FROM fichaje WHERE trabajador_id = ?').get(id).c, 2);
});

test('una anulación sin motivo de verdad se rechaza', () => {
  const id = bd.altaTrabajador('Pedro Prueba', '4444');
  bd.registrarFichaje(id);
  const fila = bd.db.prepare('SELECT id FROM fichaje WHERE trabajador_id = ?').get(id);
  assert.throws(() => bd.anularFichaje(fila.id, 'no'), /CHECK/);
});

test('cinco PINs fallidos bloquean, y el bloqueo caduca solo', () => {
  const id = bd.altaTrabajador('Marta Prueba', '5555');
  let bloqueado = false;
  for (let i = 0; i < 5; i++) bloqueado = bd.apuntarFallo(bd.trabajadorPorId(id));
  assert.ok(bloqueado);
  assert.ok(bd.estaBloqueado(bd.trabajadorPorId(id)));

  bd.limpiarFallos(id);
  assert.ok(!bd.estaBloqueado(bd.trabajadorPorId(id)));
});

test('la fecha y la hora se calculan en la zona del taller, no en UTC', () => {
  // 31 de diciembre a las 23:30 UTC = 1 de enero a las 00:30 en Madrid
  const nocheVieja = new Date('2026-12-31T23:30:00Z');
  assert.deepEqual(bd.local(nocheVieja), { fecha: '2027-01-01', hora: '00:30' });
  // verano: dos horas de diferencia
  assert.deepEqual(bd.local(new Date('2026-07-15T06:02:00Z')), { fecha: '2026-07-15', hora: '08:02' });
});
