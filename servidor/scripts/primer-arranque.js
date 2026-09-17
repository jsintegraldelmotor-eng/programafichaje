#!/usr/bin/env node
/* Deja la base de datos lista el primer día: el PIN del administrador y el
   alta de la plantilla, cada uno con su PIN al azar.

   Los PIN se enseñan UNA sola vez, aquí. En la base de datos sólo queda su
   huella cifrada, así que no hay forma de recuperarlos: si se pierde uno, el
   administrador le pone otro desde /admin. Apúntalos antes de cerrar esto. */

import { randomInt } from 'node:crypto';
import * as bd from '../src/db.js';

const PLANTILLA = ['Salvador', 'Aziz', 'Zakaria', 'Silvinho', 'Israel', 'Paco'];

/** PIN de 4 cifras, sin los que se adivinan a la primera. */
function pinAlAzar(yaUsados) {
  const feos = new Set(['0000', '1111', '2222', '3333', '4444', '5555', '6666',
                        '7777', '8888', '9999', '1234', '4321', '1212', '0123']);
  for (;;) {
    const pin = String(randomInt(0, 10000)).padStart(4, '0');
    if (!feos.has(pin) && !yaUsados.has(pin)) return pin;
  }
}

if (bd.todosLosTrabajadores().length > 0) {
  console.error('\n  Ya hay trabajadores dados de alta. Este script es sólo para el primer día.');
  console.error('  Para añadir a alguien más: npm run trabajador -- alta "Nombre" 1234\n');
  process.exit(1);
}

const usados = new Set();
const pinAdmin = String(randomInt(0, 1000000)).padStart(6, '0');
bd.guardarConfig('pin_admin', bd.hashPin(pinAdmin));

const altas = PLANTILLA.map((nombre) => {
  const pin = pinAlAzar(usados);
  usados.add(pin);
  bd.altaTrabajador(nombre, pin);
  return { nombre, pin };
});

const linea = '  ' + '─'.repeat(46);
console.log(`
  APÚNTATE ESTO AHORA. No se vuelve a enseñar.
${linea}`);
for (const { nombre, pin } of altas) {
  console.log(`    ${nombre.padEnd(14)}  ${pin}`);
}
console.log(`${linea}
    ADMINISTRADOR   ${pinAdmin}   <- el tuyo, para /admin
${linea}

  Los nombres salen en la tablet en este mismo orden.
  Para añadir a quien falta:  npm run trabajador -- alta "Nombre" 1234
  o desde /admin, que además deja renombrar y cambiar PIN.
`);
