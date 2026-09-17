/* fichalba — administración. Una sola persona, un solo PIN. */

const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function api(ruta, cuerpo) {
  const res = await fetch(ruta, cuerpo ? {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  } : undefined);
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || 'Error');
  return datos;
}

function aviso(texto, malo = false) {
  const m = $('mensaje');
  m.textContent = texto;
  m.style.color = malo ? 'var(--rojo)' : 'var(--verde)';
  setTimeout(() => { if (m.textContent === texto) m.textContent = ''; }, 4000);
}

// ---------------------------------------------------------------- entrada --

async function entrar() {
  try {
    await api('/api/admin/login', { pin: $('pin-admin').value });
    $('entrada').classList.add('oculto');
    $('panel').classList.remove('oculto');
    arrancarPanel();
  } catch (e) {
    $('error-entrada').textContent = e.message;
  }
}

$('btn-entrar').onclick = entrar;
$('pin-admin').onkeydown = (e) => { if (e.key === 'Enter') entrar(); };

// ------------------------------------------------------------------- día --

async function cargarDia() {
  const { fichajes } = await api(`/api/admin/dia?fecha=${$('fecha-dia').value}`);
  const cuerpo = $('tabla-dia').querySelector('tbody');
  cuerpo.innerHTML = '';
  $('vacio-dia').classList.toggle('oculto', fichajes.length > 0);

  for (const f of fichajes) {
    const fila = document.createElement('tr');
    if (f.anulado_motivo) fila.className = 'anulado';
    fila.innerHTML =
      `<td class="hora">${escapar(f.hora_local)}</td>` +
      `<td>${escapar(f.nombre)}</td>` +
      `<td class="tenue">${escapar(f.tipo.toLowerCase())}</td>` +
      `<td class="motivo tenue">${f.anulado_motivo ? 'anulado: ' + escapar(f.anulado_motivo) : ''}</td>` +
      `<td class="acciones"></td>`;
    if (!f.anulado_motivo) {
      const boton = document.createElement('button');
      boton.className = 'peligro';
      boton.textContent = 'Anular';
      boton.onclick = () => anular(f);
      fila.querySelector('.acciones').append(boton);
    }
    cuerpo.append(fila);
  }
}

async function anular(f) {
  const motivo = prompt(`Anular el fichaje de ${f.nombre} de las ${f.hora_local}.\n\n` +
                        `El fichaje NO se borra: queda registrado junto al motivo.\n\n¿Motivo?`);
  if (motivo == null) return;
  try {
    await api('/api/admin/anular', { fichaje_id: f.id, motivo });
    aviso('Fichaje anulado');
    cargarDia();
  } catch (e) { aviso(e.message, true); }
}

// ---------------------------------------------------------- trabajadores --

async function cargarTrabajadores() {
  const { trabajadores } = await api('/api/admin/trabajadores');
  const cuerpo = $('tabla-trabajadores').querySelector('tbody');
  cuerpo.innerHTML = '';

  for (const t of trabajadores) {
    const fila = document.createElement('tr');
    if (!t.activo) fila.className = 'inactivo';
    fila.innerHTML = `<td>${escapar(t.nombre)}</td>` +
                     `<td class="tenue">${t.activo ? '' : 'de baja'}</td>` +
                     `<td class="acciones"></td>`;
    const acciones = fila.querySelector('.acciones');

    acciones.append(
      boton('Renombrar', async () => {
        const nombre = prompt('Nombre que se ve en la tablet:', t.nombre);
        if (nombre == null || !nombre.trim()) return;
        await accion({ accion: 'renombrar', id: t.id, nombre }, 'Renombrado');
      }),
      boton('Cambiar PIN', async () => {
        const pin = prompt(`Nuevo PIN de 4 cifras para ${t.nombre}:`);
        if (pin == null) return;
        await accion({ accion: 'pin', id: t.id, pin }, 'PIN cambiado');
      }),
      boton(t.activo ? 'Dar de baja' : 'Reingresar', async () => {
        if (t.activo && !confirm(`¿Quitar a ${t.nombre} de la tablet?\n\nSus fichajes se conservan.`)) return;
        await accion({ accion: 'activo', id: t.id, activo: !t.activo }, 'Hecho');
      }, t.activo ? 'peligro' : ''),
    );
    cuerpo.append(fila);
  }
}

function boton(texto, alPulsar, clase = '') {
  const b = document.createElement('button');
  b.textContent = texto; b.className = clase; b.onclick = alPulsar;
  return b;
}

async function accion(cuerpo, exito) {
  try {
    await api('/api/admin/trabajadores', cuerpo);
    aviso(exito);
    cargarTrabajadores();
    cargarDia();
  } catch (e) { aviso(e.message, true); }
}

$('btn-alta').onclick = async () => {
  await accion({ accion: 'alta', nombre: $('nuevo-nombre').value, pin: $('nuevo-pin').value }, 'Dado de alta');
  $('nuevo-nombre').value = ''; $('nuevo-pin').value = '';
};

$('btn-pin-admin').onclick = async () => {
  try {
    await api('/api/admin/pin-admin', { pin: $('pin-nuevo-admin').value });
    $('pin-nuevo-admin').value = '';
    aviso('PIN de administrador cambiado');
  } catch (e) { aviso(e.message, true); }
};

$('btn-excel').onclick = () => {
  location.href = `/api/admin/exportar.xlsx?mes=${$('mes').value}`;
};

$('btn-csv').onclick = () => {
  location.href = `/api/admin/exportar.csv?desde=${$('desde').value}&hasta=${$('hasta').value}`;
};

$('btn-salir').onclick = async () => { await api('/api/admin/salir', {}); location.reload(); };

// --------------------------------------------------------------- arranque --

function arrancarPanel() {
  const hoy = new Date().toLocaleDateString('sv-SE');   // 'YYYY-MM-DD' en hora local
  $('fecha-dia').value = hoy;
  $('mes').value = hoy.slice(0, 7);
  $('desde').value = hoy.slice(0, 8) + '01';
  $('hasta').value = hoy;
  $('fecha-dia').onchange = cargarDia;
  cargarDia();
  cargarTrabajadores();
}

// Si ya hay sesión abierta, entra directo.
fetch('/api/admin/trabajadores').then((r) => {
  if (r.ok) {
    $('entrada').classList.add('oculto');
    $('panel').classList.remove('oculto');
    arrancarPanel();
  }
});
