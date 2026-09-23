/* Dónde se guarda todo: en la propia tablet, en el almacén del navegador.
   No hay servidor, ni ordenador encendido, ni nada que mantener.

   El botón de Excel es la forma de sacar la información de aquí. Una página
   web no puede tener un fichero Excel abierto y escribir en él sola —eso no
   existe en Android—, así que los fichajes se guardan dentro y el Excel se
   descarga cuando se quiera, con todo lo que haya hasta ese momento. */

import { estadoVacio } from './logica.js';

const CLAVE = 'fichalba.estado.v1';
const CLAVE_ANTERIOR = 'fichalba.estado.anterior';

export function cargar() {
  for (const clave of [CLAVE, CLAVE_ANTERIOR]) {
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) continue;
      const estado = JSON.parse(crudo);
      if (estado && Array.isArray(estado.fichajes)) return estado;
    } catch { /* si el principal está roto, se intenta con el de antes */ }
  }
  return estadoVacio();
}

export function guardar(estado) {
  const anterior = localStorage.getItem(CLAVE);
  localStorage.setItem(CLAVE, JSON.stringify(estado));
  // Se conserva la versión de antes por si una escritura se corta a medias.
  if (anterior) localStorage.setItem(CLAVE_ANTERIOR, anterior);
}

/** Le pide al navegador que no borre esto si la tablet se queda sin espacio. */
export async function pedirPersistencia() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* da igual: es una mejora, no un requisito */ }
  return false;
}

/** Lanza la descarga de un fichero desde la propia página. */
export function descargar(nombre, datos, tipo) {
  const url = URL.createObjectURL(new Blob([datos], { type: tipo }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ----------------------------------------------- pasar a otro aparato ---

/* Todo vive dentro del aparato, así que mudarse a otro (de la tablet al
   ordenador, por ejemplo) es sacar un fichero de uno y meterlo en el otro.
   Se lleva los nombres, los PIN, los fichajes y la hoja de cálculo. */

export const nombreDelTraspaso = () =>
  `fichalba_traspaso_${new Date().toISOString().slice(0, 10)}.json`;

export const prepararTraspaso = (estado) => JSON.stringify(estado, null, 1);

/**
 * Lee el fichero del otro aparato. Comprueba que es lo que dice ser y le da
 * un identificador de aparato NUEVO: así, si el viejo se quedara encendido y
 * fichara alguien, las filas de los dos no se pisarían en la hoja de cálculo.
 * Lo que ya estuviera en cola conserva su referencia de origen, para que no
 * se duplique nada de lo que ya se mandó.
 */
export function leerTraspaso(texto, nuevoId) {
  let estado;
  try {
    estado = JSON.parse(texto);
  } catch {
    throw new Error('Ese fichero no es un traspaso de fichalba.');
  }
  if (!estado || typeof estado !== 'object') throw new Error('Ese fichero no es un traspaso de fichalba.');
  for (const campo of ['trabajadores', 'fichajes', 'anulaciones']) {
    if (!Array.isArray(estado[campo])) throw new Error('Ese fichero no es un traspaso de fichalba.');
  }
  if (!estado.config?.pinAdmin) throw new Error('Ese fichero no trae el PIN de jefe: está incompleto.');

  estado.config.tabletaId = nuevoId;
  estado.pendientes = Array.isArray(estado.pendientes) ? estado.pendientes : [];
  estado.siguienteId = estado.siguienteId ?? Math.max(
    0, ...estado.fichajes.map((f) => f.id), ...estado.trabajadores.map((t) => t.id)) + 1;
  return estado;
}
