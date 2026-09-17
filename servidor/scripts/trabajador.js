#!/usr/bin/env node
// Gestión desde la consola del servidor. Todo esto también se puede hacer
// desde /admin, pero para el primer arranque hace falta la consola.
import * as bd from '../src/db.js';

const [accion, ...resto] = process.argv.slice(2);

const ayuda = `
  npm run trabajador -- lista
  npm run trabajador -- alta "Nombre Apellido" 1234
  npm run trabajador -- pin <id> 5678
  npm run trabajador -- baja <id>
  npm run trabajador -- reingreso <id>
  npm run trabajador -- admin <pin>        (PIN del administrador, 4-8 cifras)
`;

const pinValido = (p, min = 4, max = 4) =>
  new RegExp(`^\\d{${min},${max}}$`).test(String(p ?? ''));

switch (accion) {
  case 'lista': {
    const filas = bd.todosLosTrabajadores();
    if (!filas.length) console.log('  (todavía no hay nadie dado de alta)');
    for (const t of filas) {
      console.log(`  ${String(t.id).padStart(3)}  ${t.activo ? '  ' : '✗ '}${t.nombre}`);
    }
    break;
  }
  case 'alta': {
    const [nombre, pin] = resto;
    if (!nombre || !pinValido(pin)) { console.error('Uso: alta "Nombre" 1234'); process.exit(1); }
    console.log(`  alta #${bd.altaTrabajador(nombre, pin)}: ${nombre}`);
    break;
  }
  case 'pin': {
    const [id, pin] = resto;
    if (!id || !pinValido(pin)) { console.error('Uso: pin <id> 1234'); process.exit(1); }
    bd.cambiarPin(Number(id), pin);
    console.log('  PIN cambiado');
    break;
  }
  case 'baja':
  case 'reingreso': {
    const [id] = resto;
    if (!id) { console.error(`Uso: ${accion} <id>`); process.exit(1); }
    bd.cambiarActivo(Number(id), accion === 'reingreso');
    console.log(`  hecho (el histórico de fichajes se conserva)`);
    break;
  }
  case 'admin': {
    const [pin] = resto;
    if (!pinValido(pin, 4, 8)) { console.error('Uso: admin <pin de 4 a 8 cifras>'); process.exit(1); }
    bd.guardarConfig('pin_admin', bd.hashPin(pin));
    console.log('  PIN de administrador guardado');
    break;
  }
  default:
    console.log(ayuda);
}
