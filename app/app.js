/* La pantalla del fichaje. Todo ocurre dentro de la tablet: no hay servidor
   al que llamar ni ordenador que tenga que estar encendido. */

import * as L from './logica.js';
import * as almacen from './almacen.js';
import { $, escapar, mostrar, leer, reemplazar, guardar, enseñarPines } from './comun.js';
import { abrirJefe } from './jefe.js';
import * as hoja from './hoja.js';

const PLANTILLA_SUGERIDA = ['Salvador', 'Aziz', 'Zakaria', 'Silvinho', 'Israel', 'Paco'];

let elegido = null;
let pin = '';
let ocupado = false;
let temporizador = null;
let volverEn = 0;   // instante en el que toca volver a la lista (0 = ya estamos)
let recargarAlVolver = false;   // hay versión nueva esperando a que nadie fiche

/**
 * Programa la vuelta a la lista. Aparte del temporizador se apunta la HORA,
 * porque un temporizador se puede perder: Android congela la página cuando se
 * apaga la pantalla o se va la aplicación a segundo plano, y entonces el aviso
 * nunca llega y la pantalla se queda clavada. La red de seguridad de abajo mira
 * esa hora y devuelve a la lista igualmente.
 */
function programarVuelta(ms) {
  clearTimeout(temporizador);
  volverEn = Date.now() + ms;
  temporizador = setTimeout(volver, ms);
}

// ------------------------------------------------------------------ reloj --

function pintarReloj() {
  const zona = leer().config.zona ?? L.ZONA;
  const ahora = new Date();
  $('reloj').textContent = ahora.toLocaleTimeString('es-ES', { timeZone: zona, hour: '2-digit', minute: '2-digit' });
  const fecha = ahora.toLocaleDateString('es-ES', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long' });
  $('fecha').textContent = fecha[0].toUpperCase() + fecha.slice(1);
}

// ------------------------------------------------------------------ lista --

function pintarLista() {
  const estado = leer();
  const { fecha } = L.local(new Date(), estado.config.zona);
  const fichados = L.fichadosDelDia(estado, fecha);
  const gente = L.trabajadoresActivos(estado);

  const rejilla = $('rejilla');
  rejilla.innerHTML = '';
  for (const t of gente) {
    const hora = fichados[t.id] ?? null;
    const boton = document.createElement('button');
    boton.className = 'ficha' + (hora ? ' fichado' : '');
    boton.innerHTML = `<span>${escapar(t.nombre)}</span>` +
      `<span class="estado">${hora ? '✓ ' + hora : 'Toca para fichar'}</span>`;
    boton.onclick = () => pedirPin(t, hora);
    rejilla.append(boton);
  }
  $('resumen').textContent = `${Object.keys(fichados).length} de ${gente.length} han fichado`;
  pintarReloj();
}

// -------------------------------------------------------------------- PIN --

function pedirPin(trabajador, horaPrevia) {
  elegido = trabajador;
  pin = '';
  ocupado = false;
  $('pin-nombre').textContent = trabajador.nombre;
  $('pin-error').innerHTML = '&nbsp;';
  $('pin-instruccion').textContent = horaPrevia ? `Ya fichaste a las ${horaPrevia}` : 'Marca tu PIN';
  pintarPuntos();
  mostrar('pantalla-pin');
  programarVuelta(30_000);
}

function pintarPuntos(mal = false) {
  const puntos = $('puntos');
  puntos.classList.toggle('mal', mal);
  [...puntos.children].forEach((p, i) => p.classList.toggle('lleno', i < pin.length));
}

function tecla(valor) {
  if (ocupado) return;
  programarVuelta(30_000);
  if (valor === 'cancelar') return volver();
  if (valor === 'borrar') { pin = pin.slice(0, -1); return pintarPuntos(); }
  if (pin.length >= 4) return;
  pin += valor;
  pintarPuntos();
  if (pin.length === 4) comprobar();
}

async function comprobar() {
  ocupado = true;
  const estado = leer();
  const trabajador = L.buscarTrabajador(estado, elegido.id);

  if (L.estaBloqueado(trabajador)) return fallo('Demasiados intentos. Espera un minuto.');

  if (!await L.pinCorrecto(pin, trabajador.pinHash)) {
    const bloqueado = L.apuntarFallo(trabajador);
    guardar();
    return fallo(bloqueado ? 'PIN incorrecto. Bloqueado un minuto.' : 'PIN incorrecto.');
  }

  L.limpiarFallos(trabajador);
  const { fichaje, hora, repetido } = L.fichar(estado, trabajador.id);
  guardar();
  // El fichaje ya está a salvo en la tablet; lo de la hoja va aparte y si
  // falla se reintenta solo. Fichar nunca se queda esperando a internet.
  if (!repetido) hoja.apuntar(estado, hoja.accionFichaje(estado, fichaje, trabajador.nombre), guardar);
  confirmar(trabajador.nombre, hora, repetido);
}

function fallo(mensaje) {
  $('pin-error').textContent = mensaje;
  pintarPuntos(true);
  pin = '';
  setTimeout(() => { pintarPuntos(false); ocupado = false; }, 450);
}

// ------------------------------------------------------------ confirmación --

function confirmar(nombre, hora, repetido) {
  $('ok-saludo').textContent = `${saludo()}, ${nombre.split(' ')[0]}`;
  $('ok-hora').textContent = hora;
  $('ok-nota').textContent = repetido ? 'Ya habías fichado hoy a esta hora' : '';
  mostrar('pantalla-ok');
  programarVuelta(4000);
}

function saludo() {
  const h = Number(new Date().toLocaleString('es-ES', {
    timeZone: leer().config.zona ?? L.ZONA, hour: '2-digit', hourCycle: 'h23',
  }));
  if (h < 6) return 'Buenas noches';
  if (h < 14) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

function volver() {
  elegido = null; pin = ''; ocupado = false;
  volverEn = 0;
  clearTimeout(temporizador);
  pintarPuntos();
  pintarLista();
  mostrar('pantalla-lista');
  // Si llegó una versión nueva mientras alguien fichaba, se coge ahora.
  if (recargarAlVolver) location.reload();
}

// --------------------------------------------------------- primer arranque --

async function crearTodo() {
  const nombres = $('nombres').value.split('\n').map((n) => n.trim()).filter(Boolean);
  const pinJefe = $('pin-jefe').value.trim();

  if (nombres.length === 0) return ($('error-config').textContent = 'Pon al menos un nombre.');
  if (!/^\d{4,8}$/.test(pinJefe)) return ($('error-config').textContent = 'Tu PIN son de 4 a 8 cifras.');

  $('btn-crear').disabled = true;
  $('btn-crear').textContent = 'Creando…';
  $('error-config').textContent = '';

  const estado = L.estadoVacio();
  estado.config.pinAdmin = await L.hashPin(pinJefe);

  const usados = new Set();
  const creados = [];
  for (const nombre of nombres) {
    const suPin = L.pinAlAzar(usados);
    usados.add(suPin);
    L.altaTrabajador(estado, nombre, await L.hashPin(suPin));
    creados.push({ nombre, pin: suPin });
  }
  reemplazar(estado);
  guardar();
  almacen.pedirPersistencia();

  $('btn-crear').disabled = false;
  $('btn-crear').textContent = 'Crear';
  enseñarPines(creados, volver);
}

// ----------------------------------------------------------------- arranque --

$('teclado').addEventListener('click', (e) => {
  const boton = e.target.closest('button');
  if (boton) tecla(boton.dataset.t);
});
$('btn-crear').onclick = crearTodo;
$('btn-admin').onclick = () => abrirJefe(volver);

// Tocar la pantalla verde vuelve ya, sin esperar los cuatro segundos.
$('pantalla-ok').onclick = volver;

/* El botón Atrás NO debe sacar de la aplicación: si sale, el anclaje de Android
   no la deja irse de verdad y se queda congelada en su pantalla de arranque
   (el icono, sin nada más).

   Para evitarlo se le pone historial por delante, pero hay un detalle que lo
   cambia todo: Chrome SE SALTA las entradas de historial que una página crea
   sin que el usuario haya tocado nada (lo llama "history manipulation
   intervention"). Ponerlas al arrancar no sirve de nada — Atrás las ignora y
   cierra la aplicación igual.

   Por eso se reponen justo DESPUÉS DE CADA TOQUE en la pantalla: ahí Chrome sí
   las respeta. Y como en esta aplicación no se hace nada sin tocar, el colchón
   está siempre puesto cuando hace falta. */

const COLCHON = 2;
let entradasPuestas = 0;

function ponerHistorial() {
  while (entradasPuestas < COLCHON) {
    history.pushState({ fichalba: true }, '');
    entradasPuestas++;
  }
}

// pointerdown y click: los dos dan "toque reciente del usuario" en Chrome.
document.addEventListener('pointerdown', ponerHistorial, { capture: true });
document.addEventListener('click', ponerHistorial, { capture: true });
ponerHistorial();   // por si acaso, aunque hasta el primer toque no valga

addEventListener('popstate', () => {
  entradasPuestas = Math.max(0, entradasPuestas - 1);
  volver();
  ponerHistorial();
  // Si Atrás llega hasta aquí, lo más seguro para la pantalla es rehacerla
  // entera: una recarga es el repintado más contundente que existe, y no se
  // pierde nada porque los fichajes no viven en la página.
  forzarRepintado();
});

/* Red de seguridad. Si el temporizador se pierde —Atrás, pantalla apagada,
   Android congelando la página en segundo plano— la aplicación se quedaba
   clavada en el check y ya no se podía fichar. Estas dos comprobaciones la
   devuelven a la lista aunque no quede ni un temporizador vivo. */
setInterval(() => { if (volverEn && Date.now() >= volverEn) volver(); }, 1000);
/* Girar la tablet arregla la pantalla congelada. Eso significa que a la página
   no le falta lógica: le falta que alguien la obligue a dibujar otra vez.

   Aquí va el empujón a mano, en dos intensidades. Se usa al volver al frente
   y, sobre todo, en el latido de abajo. */

function forzarRepintado() {
  const cuerpo = document.body;
  cuerpo.style.display = 'none';
  void cuerpo.offsetHeight;      // obliga al navegador a recalcularlo todo
  cuerpo.style.display = '';
}

/* EL LATIDO.

   Cuando alguien le da a Atrás con la aplicación anclada, la pantalla se queda
   congelada y ni el reloj avanza. Girar la tablet la arregla, así que esto
   imita al giro sin esperar a ningún aviso del sistema: no hace falta que
   Chrome nos diga nada, va solo.

   Cada dos segundos se cambia la opacidad una milésima. No se ve, pero obliga
   al sistema a dibujar un fotograma nuevo. Y cada veinte, un empujón más fuerte
   que recalcula el diseño entero, que es lo más parecido a girarla.

   Aviso honesto: esto sólo puede funcionar si la página sigue viva y lo único
   parado es el dibujado. Si Android ha congelado la página del todo, este
   latido tampoco se ejecuta y no hay nada que hacer desde aquí. */

let latidos = 0;
setInterval(() => {
  if (document.hidden) return;
  latidos++;
  document.documentElement.style.opacity = latidos % 2 ? '0.999' : '';
  if (latidos % 10 === 0) {
    document.body.style.minHeight = latidos % 20 === 0 ? '100.01%' : '';
    void document.body.offsetHeight;
  }
}, 2000);

const alVolverAlFrente = () => {
  if (document.hidden) return;
  if (volverEn && Date.now() >= volverEn) volver();
  ponerHistorial();              // por si Atrás gastó alguna estando fuera
  forzarRepintado();
};
document.addEventListener('visibilitychange', alVolverAlFrente);
addEventListener('pageshow', alVolverAlFrente);
addEventListener('focus', alVolverAlFrente);
addEventListener('resize', alVolverAlFrente);

// Ni menú al mantener pulsado, ni zoom con dos dedos: es un quiosco.
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

setInterval(() => {
  if (!$('pantalla-lista').classList.contains('oculto')) pintarLista();
}, 20_000);
setInterval(() => {
  if (!$('pantalla-lista').classList.contains('oculto')) pintarReloj();
}, 1000);

if (!leer().config.pinAdmin) {
  $('nombres').value = PLANTILLA_SUGERIDA.join('\n');
  mostrar('pantalla-config');
} else {
  volver();
}

// Por si quedó algo sin mandar a la hoja (se fue la luz, no había internet...).
hoja.enviar(leer(), guardar);
hoja.reintentarDeVezEnCuando(leer, guardar);

// ------------------------------------------------- actualización sola ----
/* La aplicación vive dentro de la tablet, así que una versión nueva no llega
   sola: hay que ir a buscarla. Esto lo hace al abrir, al volver al frente y
   cada media hora; cuando la encuentra, se recarga ella misma. Antes hacía
   falta abrirla y cerrarla dos veces, y eso en una tablet colgada en la pared
   significaba quedarse con una versión vieja para siempre. */

if ('serviceWorker' in navigator) {
  // Al arrancar, ¿ya había una versión mandando? Si no, es la primera
  // instalación y no hay que recargar nada.
  const yaHabiaVersion = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker
    // updateViaCache 'none': sw.js se pide siempre a internet. Si no, GitHub
    // lo deja guardado diez minutos y la actualización no se entera.
    .register('sw.js', { updateViaCache: 'none' })
    .then((registro) => {
      const buscarVersionNueva = () => registro.update().catch(() => { /* sin red, ya volverá */ });
      buscarVersionNueva();
      setInterval(buscarVersionNueva, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) buscarVersionNueva();
      });
    })
    .catch(() => { /* la primera vez puede no haber red */ });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!yaHabiaVersion) return;
    // Si hay alguien a media faena, se espera a que la pantalla vuelva a la lista.
    if ($('pantalla-lista').classList.contains('oculto')) recargarAlVolver = true;
    else location.reload();
  });
}
