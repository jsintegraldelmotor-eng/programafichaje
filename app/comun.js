/* Lo que comparten la pantalla de fichar y la del jefe: el estado cargado,
   cómo se guarda, y cuatro ayudas de pantalla. Vive aparte para que ninguna
   de las dos tenga que importar a la otra. */

import * as almacen from './almacen.js';

export const $ = (id) => document.getElementById(id);

export const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const PANTALLAS = ['pantalla-config', 'pantalla-pines', 'pantalla-lista',
                   'pantalla-pin', 'pantalla-ok', 'pantalla-jefe'];

export function mostrar(cual) {
  for (const p of PANTALLAS) $(p).classList.toggle('oculto', p !== cual);
}

// El estado vive aquí dentro y se toca con estas tres funciones, para que no
// haya dos copias distintas dando vueltas por la aplicación.
let estado = almacen.cargar();

export const leer = () => estado;
export const reemplazar = (nuevo) => { estado = nuevo; };
export const guardar = () => almacen.guardar(estado);

/** Los PIN se enseñan UNA vez: de ellos sólo se guarda una huella cifrada. */
export function enseñarPines(creados, alTerminar) {
  $('tabla-pines').innerHTML = creados
    .map((c) => `<tr><td>${escapar(c.nombre)}</td><td>${c.pin}</td></tr>`).join('');
  $('btn-pines-listo').onclick = alTerminar;
  mostrar('pantalla-pines');
}
