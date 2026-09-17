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
