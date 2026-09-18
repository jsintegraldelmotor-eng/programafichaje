/* Escribir en la hoja de cálculo de Google, sola y en el momento.

   Cada fichaje se manda a un pequeño programa que vive dentro de la propia
   hoja (Apps Script) y que añade la fila. No hay servidor nuestro en medio.

   Si en ese momento no hay internet, el fichaje se queda en una cola dentro
   de la tablet y se manda solo cuando vuelva. El fichaje NUNCA depende de
   esto: primero se guarda en la tablet, y luego se intenta enviar.

   Se manda como texto plano a propósito: así el navegador no hace la petición
   de permiso previa (preflight), que Apps Script no sabe contestar. */

const REINTENTO_MS = 2 * 60 * 1000;
let enviando = false;

const cola = (estado) => (estado.pendientes ??= []);

export const configurada = (estado) => Boolean(estado.config.hojaUrl);

export const sinEnviar = (estado) => cola(estado).length;

/** Apunta una acción para la hoja y trata de mandarla ya. */
export function apuntar(estado, accion, guardar) {
  if (!configurada(estado)) return;
  cola(estado).push(accion);
  guardar();
  enviar(estado, guardar);
}

/**
 * Vacía la cola contra la hoja. Como cada acción lleva su referencia, si algo
 * se manda dos veces la hoja lo ignora: mejor repetir que perder.
 * @returns {Promise<{enviadas: number, error: string|null}>}
 */
export async function enviar(estado, guardar) {
  if (enviando || !configurada(estado) || cola(estado).length === 0) {
    return { enviadas: 0, error: null };
  }
  enviando = true;
  const lote = cola(estado).slice(0, 50);

  try {
    const respuesta = await fetch(estado.config.hojaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: estado.config.hojaClave ?? '', acciones: lote }),
      redirect: 'follow',
    });
    const datos = await respuesta.json();
    if (!datos.ok) throw new Error(datos.error || 'la hoja ha dicho que no');

    estado.pendientes = cola(estado).slice(lote.length);
    guardar();
    return { enviadas: lote.length, error: null };
  } catch (e) {
    // Se queda en la cola y se reintenta: no se pierde nada.
    return { enviadas: 0, error: e.message };
  } finally {
    enviando = false;
  }
}

/** Comprueba que la dirección y la clave son las buenas, sin escribir nada. */
export async function probar(url, clave) {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ clave, acciones: [] }),
    redirect: 'follow',
  });
  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.error || 'la hoja ha dicho que no');
  return datos;
}

/** La referencia que identifica la fila en la hoja: tablet + número. */
export const referencia = (estado, fichajeId) =>
  `${estado.config.tabletaId ?? 'x'}-${fichajeId}`;

export const accionFichaje = (estado, fichaje, nombre) => ({
  tipo: 'fichaje',
  ref: referencia(estado, fichaje.id),
  fecha: fichaje.fecha,
  hora: fichaje.hora,
  nombre,
});

export const accionAnulacion = (estado, fichajeId, motivo) => ({
  tipo: 'anulacion',
  ref: referencia(estado, fichajeId),
  motivo,
});

/** Reintenta cada dos minutos por si volvió la conexión. */
export function reintentarDeVezEnCuando(leer, guardar) {
  setInterval(() => enviar(leer(), guardar), REINTENTO_MS);
  addEventListener('online', () => enviar(leer(), guardar));
}
