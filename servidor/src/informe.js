/* El libro de Excel del mes: una hoja para ver de un vistazo y otra con el
   detalle de cada fichaje, incluidos los anulados. */

import { libro } from './excel.js';
import * as bd from './db.js';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const INICIAL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const dos = (n) => String(n).padStart(2, '0');

/** Día de la semana de una fecha 'YYYY-MM-DD', sin líos de zona horaria. */
const diaSemana = (fecha) => new Date(fecha + 'T12:00:00Z').getUTCDay();

/**
 * @returns {{ nombre: string, datos: Buffer }} nombre de fichero y contenido
 */
export function libroDelMes(anio, mes) {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const desde = `${anio}-${dos(mes)}-01`;
  const hasta = `${anio}-${dos(mes)}-${dos(ultimoDia)}`;
  const fichajes = bd.fichajesEntre(desde, hasta);

  // Todos los que fichan hoy, más cualquiera que fichase ese mes aunque ya esté de baja.
  const gente = new Map(bd.todosLosTrabajadores()
    .filter((t) => t.activo)
    .map((t) => [t.id, t.nombre]));
  for (const f of fichajes) if (!gente.has(f.trabajador_id)) gente.set(f.trabajador_id, f.nombre + ' (baja)');

  // ------------------------------------------------------------- resumen --
  const cabecera = ['Trabajador'];
  for (let d = 1; d <= ultimoDia; d++) {
    cabecera.push(`${d} ${INICIAL[diaSemana(`${anio}-${dos(mes)}-${dos(d)}`)]}`);
  }
  cabecera.push('Días');

  const resumen = [cabecera];
  for (const [id, nombre] of gente) {
    const fila = [nombre];
    let dias = 0;
    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = `${anio}-${dos(mes)}-${dos(d)}`;
      const suyo = fichajes.find((f) =>
        f.trabajador_id === id && f.fecha_local === fecha &&
        f.tipo === 'ENTRADA' && !f.anulado_motivo);
      fila.push(suyo ? suyo.hora_local : '');
      if (suyo) dias++;
    }
    fila.push(dias);
    resumen.push(fila);
  }

  // ------------------------------------------------------------- detalle --
  const detalle = [['Fecha', 'Día', 'Hora', 'Trabajador', 'Tipo', 'Estado', 'Origen']];
  for (const f of fichajes) {
    detalle.push([
      f.fecha_local,
      DIAS[diaSemana(f.fecha_local)],
      f.hora_local,
      f.nombre,
      f.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
      f.anulado_motivo ? `ANULADO — ${f.anulado_motivo}` : 'Válido',
      f.origen === 'TABLET' ? 'Tablet' : f.origen,
    ]);
  }

  const datos = libro([
    {
      nombre: `Resumen ${MESES[mes - 1]} ${anio}`.slice(0, 31),
      anchos: [24, ...Array(ultimoDia).fill(6), 7],
      filas: resumen,
    },
    {
      nombre: 'Fichajes uno a uno',
      anchos: [12, 11, 8, 24, 10, 42, 9],
      filas: detalle,
    },
  ]);

  return { nombre: `fichajes_${anio}_${dos(mes)}.xlsx`, datos };
}
