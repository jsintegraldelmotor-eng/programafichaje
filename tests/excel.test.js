import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync, crc32 } from 'node:zlib';
import { libro } from '../src/excel.js';

/* El generador de xlsx escribe bytes de un formato ZIP a mano: un fallo aquí
   no se ve hasta que Excel dice "el archivo está dañado". Así que el ZIP se
   vuelve a leer entero y se comprueban tamaños y CRC con el zlib de Node,
   que no sabe nada de nuestro código. */

function abrirZip(buf) {
  const dentro = {};
  let i = 0;
  while (i + 4 <= buf.length && buf.readUInt32LE(i) === 0x04034b50) {
    const metodo = buf.readUInt16LE(i + 8);
    const crcEsperado = buf.readUInt32LE(i + 14);
    const tamComprimido = buf.readUInt32LE(i + 18);
    const tamCrudo = buf.readUInt32LE(i + 22);
    const largoNombre = buf.readUInt16LE(i + 26);
    const largoExtra = buf.readUInt16LE(i + 28);
    const nombre = buf.subarray(i + 30, i + 30 + largoNombre).toString('utf8');
    const inicio = i + 30 + largoNombre + largoExtra;
    const crudo = metodo === 8
      ? inflateRawSync(buf.subarray(inicio, inicio + tamComprimido))
      : buf.subarray(inicio, inicio + tamComprimido);

    assert.equal(crudo.length, tamCrudo, `tamaño mal en ${nombre}`);
    assert.equal(crc32(crudo), crcEsperado, `CRC mal en ${nombre}`);
    dentro[nombre] = crudo.toString('utf8');
    i = inicio + tamComprimido;
  }
  // Y el cierre del ZIP debe estar donde toca y cuadrar el número de ficheros.
  const fin = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(fin > 0, 'falta el cierre del ZIP');
  assert.equal(buf.readUInt16LE(fin + 10), Object.keys(dentro).length);
  return dentro;
}

test('el xlsx es un ZIP válido con las piezas que Excel espera', () => {
  const dentro = abrirZip(libro([{ nombre: 'Hoja', filas: [['a'], ['b']] }]));
  for (const pieza of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml',
                       'xl/_rels/workbook.xml.rels', 'xl/styles.xml',
                       'xl/worksheets/sheet1.xml']) {
    assert.ok(dentro[pieza], `falta ${pieza}`);
  }
});

test('los textos y los números van en celdas distintas', () => {
  const dentro = abrirZip(libro([{ nombre: 'Hoja', filas: [['Trabajador', 'Días'], ['Paco', 12]] }]));
  const hoja = dentro['xl/worksheets/sheet1.xml'];
  assert.match(hoja, /<c r="A2" t="inlineStr"><is><t xml:space="preserve">Paco<\/t><\/is><\/c>/);
  assert.match(hoja, /<c r="B2"><v>12<\/v><\/c>/, 'un número no puede ir como texto');
  assert.match(hoja, /<c r="A1" s="1"/, 'la fila de títulos va en negrita');
});

test('un nombre con & o < no rompe el fichero', () => {
  const dentro = abrirZip(libro([{ nombre: 'Hoja', filas: [['Bar & Talleres <Paco>']] }]));
  assert.match(dentro['xl/worksheets/sheet1.xml'], /Bar &amp; Talleres &lt;Paco&gt;/);
});

test('las columnas pasan de la Z sin equivocarse', () => {
  const fila = Array.from({ length: 30 }, (_, i) => `c${i}`);
  const hoja = abrirZip(libro([{ nombre: 'Hoja', filas: [fila] }]))['xl/worksheets/sheet1.xml'];
  assert.ok(hoja.includes('r="Z1"'), 'falta la columna Z');
  assert.ok(hoja.includes('r="AA1"'), 'después de la Z viene la AA');
  assert.ok(hoja.includes('r="AD1"'), 'falta la última columna');
});

test('varias hojas quedan enlazadas al libro', () => {
  const dentro = abrirZip(libro([
    { nombre: 'Resumen', filas: [['x']] },
    { nombre: 'Detalle', filas: [['y']] },
  ]));
  assert.ok(dentro['xl/worksheets/sheet2.xml']);
  assert.match(dentro['xl/workbook.xml'], /name="Resumen"[^>]*r:id="rId1"/);
  assert.match(dentro['xl/workbook.xml'], /name="Detalle"[^>]*r:id="rId2"/);
  assert.match(dentro['xl/_rels/workbook.xml.rels'], /Id="rId3"[^>]*styles\.xml/);
});
