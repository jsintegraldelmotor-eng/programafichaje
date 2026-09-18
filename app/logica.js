/* Las reglas del fichaje. Funciones puras sobre un objeto `estado`: aquí no
   se toca ni el navegador, ni la pantalla, ni dónde se guarda nada. Por eso
   se puede probar entero con `npm test` sin abrir un navegador. */

export const ZONA = 'Europe/Madrid';
const MAX_INTENTOS = 5;
const CASTIGO_MS = 60_000;

export const estadoVacio = () => ({
  version: 1,
  config: {
    zona: ZONA,
    pinAdmin: null,
    hojaUrl: null,
    hojaClave: null,
    // Identifica a ESTA instalación. Va en la referencia de cada fila de la
    // hoja, para que si algún día se reinstala la aplicación (y los números
    // vuelven a empezar por 1) la hoja no confunda los nuevos con los viejos.
    tabletaId: idAlAzar(),
  },
  siguienteId: 1,
  trabajadores: [],
  fichajes: [],
  anulaciones: [],
});

// ---------------------------------------------------------------- tiempo ---

const FORMATOS = new Map();
function formato(zona, opciones, idioma = 'es-ES') {
  const clave = idioma + zona + JSON.stringify(opciones);
  if (!FORMATOS.has(clave)) FORMATOS.set(clave, new Intl.DateTimeFormat(idioma, { timeZone: zona, ...opciones }));
  return FORMATOS.get(clave);
}

/** Fecha ('YYYY-MM-DD') y hora ('HH:MM') del taller para un instante dado. */
export function local(instante = new Date(), zona = ZONA) {
  return {
    fecha: formato(zona, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA').format(instante),
    hora: formato(zona, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instante),
  };
}

/** Día de la semana de 'YYYY-MM-DD' (0 domingo), sin líos de zona horaria. */
export const diaSemana = (fecha) => new Date(fecha + 'T12:00:00Z').getUTCDay();

export const dos = (n) => String(n).padStart(2, '0');

const idAlAzar = () =>
  [...crypto.getRandomValues(new Uint8Array(3))].map((n) => n.toString(16).padStart(2, '0')).join('');

// ------------------------------------------------------------------- PIN ---
// PBKDF2 con el crypto del propio navegador. Del PIN sólo se guarda su huella:
// ni el jefe puede leerlos, por eso si se pierde uno se pone otro nuevo.

const ITERACIONES = 100_000;
const hexABytes = (hex) => Uint8Array.from(hex.match(/../g).map((h) => parseInt(h, 16)));
const bytesAHex = (b) => [...b].map((n) => n.toString(16).padStart(2, '0')).join('');

async function derivar(pin, salHex) {
  const clave = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexABytes(salHex), iterations: ITERACIONES, hash: 'SHA-256' }, clave, 256);
  return bytesAHex(new Uint8Array(bits));
}

export async function hashPin(pin) {
  const sal = bytesAHex(crypto.getRandomValues(new Uint8Array(16)));
  return `${sal}:${await derivar(pin, sal)}`;
}

export async function pinCorrecto(pin, guardado) {
  if (typeof guardado !== 'string' || !guardado.includes(':')) return false;
  const [sal, esperado] = guardado.split(':');
  const calculado = await derivar(pin, sal);
  // Comparación de tiempo constante: no se sale antes por fallar la 1ª cifra.
  if (calculado.length !== esperado.length) return false;
  let diferencia = 0;
  for (let i = 0; i < calculado.length; i++) diferencia |= calculado.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diferencia === 0;
}

/** PIN de 4 cifras al azar, saltándose los que se adivinan a la primera. */
export function pinAlAzar(yaUsados = new Set()) {
  const feos = new Set(['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777',
                        '8888', '9999', '1234', '4321', '1212', '0123', '2580']);
  for (;;) {
    const pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, '0');
    if (!feos.has(pin) && !yaUsados.has(pin)) return pin;
  }
}

// ---------------------------------------------------------- trabajadores ---

export const trabajadoresActivos = (estado) =>
  estado.trabajadores.filter((t) => t.activo).sort((a, b) => a.orden - b.orden);

export const buscarTrabajador = (estado, id) => estado.trabajadores.find((t) => t.id === id);

export function altaTrabajador(estado, nombre, pinHash) {
  const orden = estado.trabajadores.reduce((n, t) => Math.max(n, t.orden), 0) + 1;
  const trabajador = {
    id: estado.siguienteId++, nombre: nombre.trim(), pinHash,
    activo: true, orden, fallos: 0, bloqueadoHasta: null,
  };
  estado.trabajadores.push(trabajador);
  return trabajador;
}

// --------------------------------------------------------------- fichajes ---

const estaAnulado = (estado, fichajeId) => estado.anulaciones.some((a) => a.fichajeId === fichajeId);

/** Los fichajes que cuentan: los que nadie ha anulado. */
export const fichajesVigentes = (estado) => estado.fichajes.filter((f) => !estaAnulado(estado, f.id));

/** { idTrabajador: 'HH:MM' } de quienes han fichado ese día. */
export function fichadosDelDia(estado, fecha, tipo = 'ENTRADA') {
  const salida = {};
  for (const f of fichajesVigentes(estado)) {
    if (f.fecha === fecha && f.tipo === tipo) salida[f.trabajadorId] = f.hora;
  }
  return salida;
}

export const estaBloqueado = (trabajador, ahora = Date.now()) =>
  trabajador.bloqueadoHasta != null && trabajador.bloqueadoHasta > ahora;

/** Apunta un PIN fallido. Devuelve true si eso le acaba de bloquear. */
export function apuntarFallo(trabajador, ahora = Date.now()) {
  const fallos = (trabajador.fallos ?? 0) + 1;
  if (fallos >= MAX_INTENTOS) {
    trabajador.fallos = 0;
    trabajador.bloqueadoHasta = ahora + CASTIGO_MS;
    return true;
  }
  trabajador.fallos = fallos;
  return false;
}

export function limpiarFallos(trabajador) {
  trabajador.fallos = 0;
  trabajador.bloqueadoHasta = null;
}

/**
 * Registra la entrada. Si ya tenía una vigente hoy, no duplica: devuelve la
 * que ya había (el doble toque con guantes es real).
 */
export function fichar(estado, trabajadorId, instante = new Date(), tipo = 'ENTRADA') {
  const { fecha, hora } = local(instante, estado.config.zona);
  const previo = fichajesVigentes(estado).find(
    (f) => f.trabajadorId === trabajadorId && f.fecha === fecha && f.tipo === tipo);
  if (previo) return { fichaje: previo, hora: previo.hora, repetido: true };

  const fichaje = {
    id: estado.siguienteId++, trabajadorId, tipo,
    instanteUtc: instante.toISOString(), fecha, hora,
  };
  estado.fichajes.push(fichaje);
  return { fichaje, hora, repetido: false };
}

/**
 * Anular NO borra: el fichaje original se queda para siempre, y al lado queda
 * quién lo anuló y por qué. Después, esa persona puede volver a fichar ese día.
 */
export function anular(estado, fichajeId, motivo, instante = new Date()) {
  const limpio = String(motivo ?? '').trim();
  if (limpio.length < 5) throw new Error('Hace falta un motivo de verdad.');
  if (!estado.fichajes.some((f) => f.id === fichajeId)) throw new Error('Ese fichaje no existe.');
  if (estaAnulado(estado, fichajeId)) throw new Error('Ese fichaje ya estaba anulado.');
  estado.anulaciones.push({ fichajeId, motivo: limpio, instanteUtc: instante.toISOString() });
}

/** Los fichajes de un día, anulados incluidos, para la pantalla del jefe. */
export function fichajesDelDia(estado, fecha) {
  return estado.fichajes
    .filter((f) => f.fecha === fecha)
    .sort((a, b) => a.instanteUtc.localeCompare(b.instanteUtc))
    .map((f) => ({
      ...f,
      nombre: buscarTrabajador(estado, f.trabajadorId)?.nombre ?? '(borrado)',
      anulacion: estado.anulaciones.find((a) => a.fichajeId === f.id) ?? null,
    }));
}

// ----------------------------------------------------------------- Excel ---

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const INICIAL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Las dos hojas del libro del mes, listas para `libro()`. */
export function hojasDelMes(estado, anio, mes) {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const prefijo = `${anio}-${dos(mes)}-`;
  const delMes = estado.fichajes.filter((f) => f.fecha.startsWith(prefijo));

  // Los que fichan hoy, más cualquiera que fichase ese mes aunque esté de baja.
  const gente = new Map(trabajadoresActivos(estado).map((t) => [t.id, t.nombre]));
  for (const f of delMes) {
    if (!gente.has(f.trabajadorId)) {
      gente.set(f.trabajadorId, (buscarTrabajador(estado, f.trabajadorId)?.nombre ?? '?') + ' (baja)');
    }
  }

  const cabecera = ['Trabajador'];
  for (let d = 1; d <= ultimoDia; d++) cabecera.push(`${d} ${INICIAL[diaSemana(prefijo + dos(d))]}`);
  cabecera.push('Días');

  const resumen = [cabecera];
  for (const [id, nombre] of gente) {
    const fila = [nombre];
    let dias = 0;
    for (let d = 1; d <= ultimoDia; d++) {
      const suyo = delMes.find((f) => f.trabajadorId === id && f.fecha === prefijo + dos(d) &&
                                      f.tipo === 'ENTRADA' && !estaAnulado(estado, f.id));
      fila.push(suyo ? suyo.hora : '');
      if (suyo) dias++;
    }
    fila.push(dias);
    resumen.push(fila);
  }

  const detalle = [['Fecha', 'Día', 'Hora', 'Trabajador', 'Tipo', 'Estado']];
  for (const f of [...delMes].sort((a, b) => a.instanteUtc.localeCompare(b.instanteUtc))) {
    const anulacion = estado.anulaciones.find((a) => a.fichajeId === f.id);
    detalle.push([
      f.fecha, DIAS[diaSemana(f.fecha)], f.hora,
      buscarTrabajador(estado, f.trabajadorId)?.nombre ?? '(borrado)',
      f.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
      anulacion ? `ANULADO — ${anulacion.motivo}` : 'Válido',
    ]);
  }

  return [
    { nombre: `Resumen ${MESES[mes - 1]} ${anio}`.slice(0, 31),
      anchos: [24, ...Array(ultimoDia).fill(6), 7], filas: resumen },
    { nombre: 'Fichajes uno a uno', anchos: [12, 11, 8, 24, 10, 44], filas: detalle },
  ];
}

/** Una sola hoja con TODOS los fichajes que haya, para guardar el histórico. */
export function hojasDeTodo(estado) {
  const filas = [['Fecha', 'Día', 'Hora', 'Trabajador', 'Tipo', 'Estado']];
  for (const f of [...estado.fichajes].sort((a, b) => a.instanteUtc.localeCompare(b.instanteUtc))) {
    const anulacion = estado.anulaciones.find((a) => a.fichajeId === f.id);
    filas.push([
      f.fecha, DIAS[diaSemana(f.fecha)], f.hora,
      buscarTrabajador(estado, f.trabajadorId)?.nombre ?? '(borrado)',
      f.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
      anulacion ? `ANULADO — ${anulacion.motivo}` : 'Válido',
    ]);
  }
  return [{ nombre: 'Todos los fichajes', anchos: [12, 11, 8, 24, 10, 44], filas }];
}
