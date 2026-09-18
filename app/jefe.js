/* La pantalla del jefe: ver el día, sacar el Excel y gestionar la gente.
   Se entra con el PIN de jefe, que no sabe nadie más. */

import * as L from './logica.js';
import * as almacen from './almacen.js';
import { libro } from './excel.js';
import { $, escapar, mostrar, leer, guardar, enseñarPines } from './comun.js';
import * as hoja from './hoja.js';

const TIPO_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
let volverAFichar = () => {};

function aviso(texto, malo = false) {
  const m = $('mensaje');
  m.textContent = texto;
  m.style.color = malo ? 'var(--rojo)' : 'var(--verde)';
  setTimeout(() => { if (m.textContent === texto) m.textContent = ''; }, 4000);
}

// ------------------------------------------------------------------ entrar --

export async function abrirJefe(alVolver) {
  volverAFichar = alVolver;
  const pin = prompt('PIN de jefe:');
  if (pin == null) return;
  if (!await L.pinCorrecto(pin, leer().config.pinAdmin)) return alert('PIN incorrecto.');

  const hoy = L.local(new Date(), leer().config.zona).fecha;
  $('fecha-dia').value = hoy;
  $('mes').value = hoy.slice(0, 7);
  pintarDia();
  pintarTrabajadores();
  pintarHoja();
  mostrar('pantalla-jefe');
}

// --------------------------------------------------------------------- día --

function pintarDia() {
  const fichajes = L.fichajesDelDia(leer(), $('fecha-dia').value);
  const cuerpo = $('tabla-dia').querySelector('tbody');
  cuerpo.innerHTML = '';
  $('vacio-dia').classList.toggle('oculto', fichajes.length > 0);

  for (const f of fichajes) {
    const fila = document.createElement('tr');
    if (f.anulacion) fila.className = 'anulado';
    fila.innerHTML =
      `<td class="hora">${escapar(f.hora)}</td>` +
      `<td>${escapar(f.nombre)}</td>` +
      `<td class="motivo tenue">${f.anulacion ? 'anulado: ' + escapar(f.anulacion.motivo) : ''}</td>` +
      '<td class="acciones"></td>';
    if (!f.anulacion) {
      const boton = document.createElement('button');
      boton.className = 'peligro';
      boton.textContent = 'Anular';
      boton.onclick = () => anular(f);
      fila.querySelector('.acciones').append(boton);
    }
    cuerpo.append(fila);
  }
}

function anular(f) {
  const motivo = prompt(`Anular el fichaje de ${f.nombre} de las ${f.hora}.\n\n` +
                        'El fichaje no se borra: queda guardado junto al motivo.\n\n¿Motivo?');
  if (motivo == null) return;
  try {
    const estado = leer();
    L.anular(estado, f.id, motivo);
    guardar();
    hoja.apuntar(estado, hoja.accionAnulacion(estado, f.id, motivo.trim()), guardar);
    pintarDia();
    aviso('Fichaje anulado');
  } catch (e) { aviso(e.message, true); }
}

// ------------------------------------------------------------ trabajadores --

function boton(texto, alPulsar, clase = '') {
  const b = document.createElement('button');
  b.textContent = texto; b.className = clase; b.onclick = alPulsar;
  return b;
}

function pintarTrabajadores() {
  const estado = leer();
  const cuerpo = $('tabla-trabajadores').querySelector('tbody');
  cuerpo.innerHTML = '';

  for (const t of [...estado.trabajadores].sort((a, b) => b.activo - a.activo || a.orden - b.orden)) {
    const fila = document.createElement('tr');
    if (!t.activo) fila.className = 'inactivo';
    fila.innerHTML = `<td>${escapar(t.nombre)}</td>` +
                     `<td class="tenue">${t.activo ? '' : 'de baja'}</td>` +
                     '<td class="acciones"></td>';
    fila.querySelector('.acciones').append(
      boton('Renombrar', () => {
        const nombre = prompt('Nombre que se ve en la tablet:', t.nombre);
        if (!nombre?.trim()) return;
        t.nombre = nombre.trim();
        guardar(); pintarTrabajadores(); aviso('Renombrado');
      }),
      boton('Nuevo PIN', async () => {
        if (!confirm(`¿Darle un PIN nuevo a ${t.nombre}?`)) return;
        const suPin = L.pinAlAzar();
        t.pinHash = await L.hashPin(suPin);
        L.limpiarFallos(t);
        guardar();
        enseñarPines([{ nombre: t.nombre, pin: suPin }], () => { pintarTrabajadores(); mostrar('pantalla-jefe'); });
      }),
      boton(t.activo ? 'Dar de baja' : 'Reingresar', () => {
        if (t.activo && !confirm(`¿Quitar a ${t.nombre} de la tablet?\n\nSus fichajes se conservan.`)) return;
        t.activo = !t.activo;
        guardar(); pintarTrabajadores(); aviso('Hecho');
      }, t.activo ? 'peligro' : ''),
    );
    cuerpo.append(fila);
  }
}

async function alta() {
  const nombre = $('nuevo-nombre').value.trim();
  if (!nombre) return aviso('Falta el nombre.', true);
  const suPin = L.pinAlAzar();
  L.altaTrabajador(leer(), nombre, await L.hashPin(suPin));
  guardar();
  $('nuevo-nombre').value = '';
  pintarTrabajadores();
  enseñarPines([{ nombre, pin: suPin }], () => mostrar('pantalla-jefe'));
}

// ------------------------------------------------------------------- Excel --

function descargarMes() {
  const [anio, mes] = ($('mes').value || '').split('-').map(Number);
  if (!anio || !mes) return aviso('Elige un mes.', true);
  almacen.descargar(`fichajes_${anio}_${L.dos(mes)}.xlsx`,
                    libro(L.hojasDelMes(leer(), anio, mes)), TIPO_EXCEL);
  aviso('Excel descargado');
}

function descargarTodo() {
  const estado = leer();
  if (estado.fichajes.length === 0) return aviso('Todavía no hay ningún fichaje.', true);
  almacen.descargar(`fichajes_todo_${L.local().fecha}.xlsx`, libro(L.hojasDeTodo(estado)), TIPO_EXCEL);
  aviso('Excel descargado');
}

// ------------------------------------------------------- hoja de cálculo --

function pintarHoja() {
  const estado = leer();
  $('hoja-url').value = estado.config.hojaUrl ?? '';
  $('hoja-clave').value = estado.config.hojaClave ?? '';

  const pendientes = hoja.sinEnviar(estado);
  $('hoja-estado').textContent = !hoja.configurada(estado)
    ? 'Sin conectar: los fichajes se guardan sólo en la tablet.'
    : pendientes === 0
      ? '✓ Conectada y al día.'
      : `${pendientes} fichaje${pendientes === 1 ? '' : 's'} sin enviar a la hoja.`;
  $('btn-hoja-enviar').classList.toggle('oculto', pendientes === 0);
}

async function guardarHoja() {
  const estado = leer();
  const url = $('hoja-url').value.trim();
  const clave = $('hoja-clave').value.trim();

  if (!url) {
    estado.config.hojaUrl = null;
    guardar(); pintarHoja();
    return aviso('Hoja desconectada');
  }
  $('btn-hoja-guardar').disabled = true;
  try {
    await hoja.probar(url, clave);
    estado.config.hojaUrl = url;
    estado.config.hojaClave = clave;
    guardar();
    aviso('Hoja conectada');
    await hoja.enviar(estado, guardar);
  } catch (e) {
    aviso('No se ha podido hablar con la hoja: ' + e.message, true);
  } finally {
    $('btn-hoja-guardar').disabled = false;
    pintarHoja();
  }
}

// ---------------------------------------------------------------- arranque --

$('fecha-dia').onchange = pintarDia;
$('btn-excel').onclick = descargarMes;
$('btn-excel-todo').onclick = descargarTodo;
$('btn-alta').onclick = alta;
$('btn-cerrar-jefe').onclick = () => volverAFichar();

$('btn-hoja-guardar').onclick = guardarHoja;
$('btn-hoja-enviar').onclick = async () => {
  const { enviadas, error } = await hoja.enviar(leer(), guardar);
  aviso(error ? 'Sigue sin poder enviarse: ' + error : `Enviados ${enviadas}`, Boolean(error));
  pintarHoja();
};

$('btn-pin-jefe').onclick = async () => {
  const nuevo = $('pin-jefe-nuevo').value.trim();
  if (!/^\d{4,8}$/.test(nuevo)) return aviso('Son de 4 a 8 cifras.', true);
  leer().config.pinAdmin = await L.hashPin(nuevo);
  guardar();
  $('pin-jefe-nuevo').value = '';
  aviso('PIN de jefe cambiado');
};
