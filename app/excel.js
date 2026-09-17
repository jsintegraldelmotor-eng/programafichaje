/* Genera un .xlsx sin ninguna dependencia y sin Node: esto corre dentro del
   navegador de la tablet. Un xlsx es un ZIP con unos cuantos XML dentro.
   El ZIP se escribe "almacenado" (sin comprimir) para no necesitar zlib:
   un mes de fichajes son unos pocos KB, no merece la pena. */

// ------------------------------------------------------------------- ZIP ---

let TABLA_CRC;
function crc32(datos) {
  if (!TABLA_CRC) {
    TABLA_CRC = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      TABLA_CRC[i] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const bytes = (texto) => new TextEncoder().encode(texto);

function bloque(largo, escribir) {
  const datos = new Uint8Array(largo);
  escribir(new DataView(datos.buffer));
  return datos;
}

function unir(trozos) {
  const total = trozos.reduce((n, t) => n + t.length, 0);
  const salida = new Uint8Array(total);
  let i = 0;
  for (const t of trozos) { salida.set(t, i); i += t.length; }
  return salida;
}

function zip(ficheros) {
  const ahora = new Date();
  const horaDos = (ahora.getHours() << 11) | (ahora.getMinutes() << 5) | (ahora.getSeconds() >> 1);
  const fechaDos = ((ahora.getFullYear() - 1980) << 9) | ((ahora.getMonth() + 1) << 5) | ahora.getDate();

  const cuerpo = [], directorio = [];
  let desplazamiento = 0;

  for (const { nombre, texto } of ficheros) {
    const ruta = bytes(nombre);
    const datos = bytes(texto);
    const crc = crc32(datos);

    const cabecera = bloque(30, (v) => {
      v.setUint32(0, 0x04034b50, true);   // firma
      v.setUint16(4, 20, true);           // versión necesaria
      v.setUint16(6, 0, true);            // banderas
      v.setUint16(8, 0, true);            // método 0: almacenado, sin comprimir
      v.setUint16(10, horaDos, true);
      v.setUint16(12, fechaDos, true);
      v.setUint32(14, crc, true);
      v.setUint32(18, datos.length, true);
      v.setUint32(22, datos.length, true);
      v.setUint16(26, ruta.length, true);
    });
    cuerpo.push(cabecera, ruta, datos);

    directorio.push(bloque(46, (v) => {
      v.setUint32(0, 0x02014b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, 20, true);
      v.setUint16(10, 0, true);
      v.setUint16(12, horaDos, true);
      v.setUint16(14, fechaDos, true);
      v.setUint32(16, crc, true);
      v.setUint32(20, datos.length, true);
      v.setUint32(24, datos.length, true);
      v.setUint16(28, ruta.length, true);
      v.setUint32(42, desplazamiento, true);
    }), ruta);

    desplazamiento += cabecera.length + ruta.length + datos.length;
  }

  const central = unir(directorio);
  const cierre = bloque(22, (v) => {
    v.setUint32(0, 0x06054b50, true);
    v.setUint16(8, ficheros.length, true);
    v.setUint16(10, ficheros.length, true);
    v.setUint32(12, central.length, true);
    v.setUint32(16, desplazamiento, true);
  });

  return unir([...cuerpo, central, cierre]);
}

// ------------------------------------------------------------------- XML ---

const CONTROLES = new RegExp('[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]', 'g');

const esc = (v) => String(v ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;')
  .replace(CONTROLES, '');

/** 1 -> A, 27 -> AA */
function columna(n) {
  let nombre = '';
  while (n > 0) { const r = (n - 1) % 26; nombre = String.fromCharCode(65 + r) + nombre; n = (n - r - 1) / 26; }
  return nombre;
}

function celda(ref, valor, negrita = false) {
  const estilo = negrita ? ' s="1"' : '';
  if (valor === null || valor === undefined || valor === '') return `<c r="${ref}"${estilo}/>`;
  if (typeof valor === 'number' && Number.isFinite(valor)) return `<c r="${ref}"${estilo}><v>${valor}</v></c>`;
  return `<c r="${ref}"${estilo} t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
}

function hoja(filas, anchos = []) {
  const cols = anchos.length
    ? `<cols>${anchos.map((a, i) => `<col min="${i + 1}" max="${i + 1}" width="${a}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const cuerpo = filas.map((fila, f) =>
    `<row r="${f + 1}">${fila.map((v, c) => celda(columna(c + 1) + (f + 1), v, f === 0)).join('')}</row>`
  ).join('');

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '</sheetView></sheetViews>' +
    cols + `<sheetData>${cuerpo}</sheetData></worksheet>`;
}

/**
 * @param {{nombre: string, filas: any[][], anchos?: number[]}[]} hojas
 * @returns {Uint8Array} el .xlsx, listo para descargar
 */
export function libro(hojas) {
  const tipos =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
      'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '</Types>';

  const raiz =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const cuaderno =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    hojas.map((h, i) => `<sheet name="${esc(h.nombre).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    '</sheets></workbook>';

  const enlaces =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    hojas.map((_, i) => `<Relationship Id="rId${i + 1}" ` +
      'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
      `Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
    `<Relationship Id="rId${hojas.length + 1}" ` +
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  const estilos =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  return zip([
    { nombre: '[Content_Types].xml', texto: tipos },
    { nombre: '_rels/.rels', texto: raiz },
    { nombre: 'xl/workbook.xml', texto: cuaderno },
    { nombre: 'xl/_rels/workbook.xml.rels', texto: enlaces },
    { nombre: 'xl/styles.xml', texto: estilos },
    ...hojas.map((h, i) => ({ nombre: `xl/worksheets/sheet${i + 1}.xml`, texto: hoja(h.filas, h.anchos) })),
  ]);
}
