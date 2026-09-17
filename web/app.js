/* fichalba — pantalla de la tablet. Tres estados: lista → PIN → confirmación. */

const $ = (id) => document.getElementById(id);
const pantallas = ['pantalla-lista', 'pantalla-pin', 'pantalla-ok'];

let elegido = null;          // trabajador seleccionado
let pin = '';
let desfase = 0;             // servidor − tablet, en milisegundos
let zona = 'Europe/Madrid';  // la del servidor
let bloqueado = false;       // mientras se envía, no se aceptan más toques
let temporizador = null;

function mostrar(cual) {
  for (const p of pantallas) $(p).classList.toggle('oculto', p !== cual);
}

// ------------------------------------------------------------------ reloj --

/** La hora del taller, aunque el reloj de la tablet esté mal puesto. */
const ahoraDelTaller = () => new Date(Date.now() + desfase);

function pintarReloj() {
  const ahora = ahoraDelTaller();
  $('reloj').textContent = ahora.toLocaleTimeString('es-ES', {
    timeZone: zona, hour: '2-digit', minute: '2-digit',
  });
  const fecha = ahora.toLocaleDateString('es-ES', {
    timeZone: zona, weekday: 'long', day: 'numeric', month: 'long',
  });
  $('fecha').textContent = fecha[0].toUpperCase() + fecha.slice(1);
}

// ------------------------------------------------------------------ lista --

async function cargarLista() {
  try {
    const res = await fetch('/api/estado');
    if (!res.ok) throw new Error('sin respuesta');
    const datos = await res.json();
    if (datos.utc) desfase = Date.parse(datos.utc) - Date.now();
    if (datos.zona) zona = datos.zona;
    pintarReloj();
    pintarLista(datos.trabajadores);
    $('aviso-red').classList.add('oculto');
  } catch {
    $('aviso-red').textContent = 'Sin conexión con el servidor';
    $('aviso-red').classList.remove('oculto');
  }
}

function pintarLista(trabajadores) {
  const rejilla = $('rejilla');
  rejilla.innerHTML = '';
  for (const t of trabajadores) {
    const boton = document.createElement('button');
    boton.className = 'ficha' + (t.hora ? ' fichado' : '');
    boton.innerHTML =
      `<span>${escapar(t.nombre)}</span>` +
      `<span class="estado">${t.hora ? '✓ ' + t.hora : 'Toca para fichar'}</span>`;
    boton.onclick = () => pedirPin(t);
    rejilla.append(boton);
  }
  const dentro = trabajadores.filter((t) => t.hora).length;
  $('resumen').textContent = `${dentro} de ${trabajadores.length} han fichado`;
}

const escapar = (s) => s.replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// -------------------------------------------------------------------- PIN --

function pedirPin(trabajador) {
  elegido = trabajador;
  pin = '';
  bloqueado = false;
  $('pin-nombre').textContent = trabajador.nombre;
  $('pin-error').innerHTML = '&nbsp;';
  $('pin-instruccion').textContent = trabajador.hora
    ? `Ya fichaste a las ${trabajador.hora}` : 'Marca tu PIN';
  pintarPuntos();
  mostrar('pantalla-pin');
  // Si se queda ahí plantado, vuelve solo a la lista.
  reprogramar(() => volver(), 30_000);
}

function pintarPuntos(mal = false) {
  const puntos = $('puntos');
  puntos.classList.toggle('mal', mal);
  [...puntos.children].forEach((p, i) => p.classList.toggle('lleno', i < pin.length));
}

function tecla(valor) {
  if (bloqueado) return;
  reprogramar(() => volver(), 30_000);
  if (valor === 'cancelar') return volver();
  if (valor === 'borrar') { pin = pin.slice(0, -1); return pintarPuntos(); }
  if (pin.length >= 4) return;
  pin += valor;
  pintarPuntos();
  if (pin.length === 4) enviar();
}

async function enviar() {
  bloqueado = true;
  try {
    const res = await fetch('/api/fichar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ trabajador_id: elegido.id, pin }),
    });
    const datos = await res.json();
    if (!res.ok) return fallo(datos.error || 'No se ha podido fichar');
    confirmar(datos);
  } catch {
    fallo('Sin conexión. Avisa al jefe.');
  }
}

function fallo(mensaje) {
  $('pin-error').textContent = mensaje;
  pintarPuntos(true);
  pin = '';
  setTimeout(() => { pintarPuntos(false); bloqueado = false; }, 450);
}

// ----------------------------------------------------------- confirmación --

function confirmar({ nombre, hora, repetido }) {
  $('ok-saludo').textContent = `${saludo()}, ${nombre.split(' ')[0]}`;
  $('ok-hora').textContent = hora;
  $('ok-nota').textContent = repetido ? 'Ya habías fichado hoy a esta hora' : '';
  mostrar('pantalla-ok');
  cargarLista();
  reprogramar(() => volver(), 4000);
}

function saludo() {
  // hourCycle h23 y no hour12:false: en es-ES, medianoche se escribe '24' y no '00'.
  const h = Number(ahoraDelTaller().toLocaleString('es-ES', {
    timeZone: zona, hour: '2-digit', hourCycle: 'h23',
  }));
  if (h < 6) return 'Buenas noches';
  if (h < 14) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

function volver() {
  elegido = null; pin = ''; bloqueado = false;
  pintarPuntos();
  mostrar('pantalla-lista');
  cargarLista();
}

function reprogramar(fn, ms) {
  clearTimeout(temporizador);
  temporizador = setTimeout(fn, ms);
}

// --------------------------------------------------------------- arranque --

$('teclado').addEventListener('click', (e) => {
  const boton = e.target.closest('button');
  if (boton) tecla(boton.dataset.t);
});

// Nada de menú contextual ni de zoom con doble toque.
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

pintarReloj();
setInterval(pintarReloj, 1000);
cargarLista();
setInterval(() => { if (!$('pantalla-lista').classList.contains('oculto')) cargarLista(); }, 30_000);
