/**
 * fichalba — el trozo que vive DENTRO de la hoja de cálculo de Google.
 *
 * Recibe los fichajes que le manda la tablet y va añadiendo filas. No hay
 * ningún servidor de por medio: esto lo ejecuta Google, gratis, dentro de tu
 * propia hoja.
 *
 * Cómo montarlo, paso a paso: ../docs/HOJA-DE-CALCULO.md
 */

// ⬇⬇⬇  CAMBIA ESTO por una palabra tuya, la que sea (sin espacios).
//      Es lo que impide que un desconocido que adivine la dirección
//      escriba fichajes falsos en tu hoja. La misma palabra se pone
//      en la tablet, en la casilla "Clave".
const CLAVE = 'cambia-esta-palabra';

const NOMBRE_HOJA = 'Fichajes';
const CABECERA = ['Fecha', 'Hora', 'Trabajador', 'Estado', 'Ref'];

function doPost(peticion) {
  try {
    const datos = JSON.parse(peticion.postData.contents);

    if (String(datos.clave) !== CLAVE) {
      return responder({ ok: false, error: 'clave incorrecta' });
    }

    const acciones = datos.acciones || [];
    if (acciones.length === 0) return responder({ ok: true, hechas: 0 });

    // Una sola persona toca la hoja a la vez: si llegan dos fichajes en el
    // mismo segundo, uno espera. Sin esto se pisarían las filas.
    const cerrojo = LockService.getScriptLock();
    cerrojo.waitLock(30000);
    try {
      const hoja = dameLaHoja();
      const refs = referenciasQueYaEstan(hoja);
      var hechas = 0;

      for (const accion of acciones) {
        if (accion.tipo === 'fichaje') {
          // Si ya está, no se repite: la tablet puede reintentar sin miedo.
          if (refs[accion.ref]) continue;
          hoja.appendRow([accion.fecha, accion.hora, accion.nombre, 'Válido', accion.ref]);
          refs[accion.ref] = hoja.getLastRow();
          hechas++;
        } else if (accion.tipo === 'anulacion') {
          const fila = refs[accion.ref];
          if (!fila) continue;
          hoja.getRange(fila, 4).setValue('ANULADO — ' + accion.motivo);
          hechas++;
        }
      }
      return responder({ ok: true, hechas: hechas });
    } finally {
      cerrojo.releaseLock();
    }
  } catch (error) {
    return responder({ ok: false, error: String(error) });
  }
}

/** Para poder abrir la dirección en el navegador y ver que está viva. */
function doGet() {
  return responder({ ok: true, mensaje: 'fichalba: la hoja está lista' });
}

function dameLaHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(NOMBRE_HOJA);
    hoja.appendRow(CABECERA);
    hoja.getRange(1, 1, 1, CABECERA.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
    hoja.setColumnWidth(1, 100);
    hoja.setColumnWidth(3, 160);
    hoja.setColumnWidth(4, 300);
  }
  return hoja;
}

/** { referencia: número de fila } de lo que ya está escrito. */
function referenciasQueYaEstan(hoja) {
  const filas = hoja.getLastRow();
  const mapa = {};
  if (filas < 2) return mapa;
  const valores = hoja.getRange(2, 5, filas - 1, 1).getValues();
  for (var i = 0; i < valores.length; i++) {
    if (valores[i][0] !== '') mapa[String(valores[i][0])] = i + 2;
  }
  return mapa;
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
