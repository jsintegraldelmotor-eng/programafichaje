#!/usr/bin/env node
/* Copia de seguridad de la base de datos, en caliente: no hace falta parar el
   programa ni echar a nadie. Funciona igual en Windows, Mac y Linux.

     npm run copia                       -> a la carpeta copias/
     npm run copia -- "D:\\Drive\\taller"  -> donde tú digas (un pendrive, Drive...) */

import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, RUTA_BD } from '../src/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = process.argv[2] || join(AQUI, '..', 'copias');
const DIAS_QUE_SE_GUARDAN = 60;

mkdirSync(DESTINO, { recursive: true });

const fecha = new Date().toISOString().slice(0, 10);
const destino = join(DESTINO, `fichalba_${fecha}.db`);

// VACUUM INTO hace una copia consistente aunque haya alguien fichando ahora mismo.
db.exec(`VACUUM INTO '${destino.replaceAll("'", "''")}'`);
console.log(`  copia hecha: ${destino} (${(statSync(destino).size / 1024).toFixed(0)} KB)`);
console.log(`  original:    ${RUTA_BD}`);

// Se limpian las diarias viejas. OJO: esto NO sustituye a guardar una copia de
// cada año en otro sitio — los fichajes hay que conservarlos CUATRO AÑOS.
const limite = Date.now() - DIAS_QUE_SE_GUARDAN * 86400_000;
let borradas = 0;
for (const f of readdirSync(DESTINO)) {
  if (!/^fichalba_\d{4}-\d{2}-\d{2}\.db$/.test(f)) continue;
  const ruta = join(DESTINO, f);
  if (statSync(ruta).mtimeMs < limite) { unlinkSync(ruta); borradas++; }
}
if (borradas) console.log(`  (borradas ${borradas} copias de más de ${DIAS_QUE_SE_GUARDAN} días)`);
