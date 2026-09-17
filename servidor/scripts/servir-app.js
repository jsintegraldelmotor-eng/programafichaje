#!/usr/bin/env node
/* Sólo para probar la aplicación en el ordenador antes de subirla:
   levanta app/ en http://localhost:4200. En el taller NO hace falta nada de
   esto — la tablet abre la dirección de internet y se acabó. */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app');
const PUERTO = Number(process.env.PUERTO || 4200);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const ruta = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const fichero = join(APP, ruta === '/' ? 'index.html' : ruta);
  if (!fichero.startsWith(APP)) { res.writeHead(403); return res.end(); }
  try {
    const contenido = await readFile(fichero);
    res.writeHead(200, { 'content-type': TIPOS[extname(fichero)] || 'application/octet-stream',
                         'cache-control': 'no-cache' });
    res.end(contenido);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('No existe');
  }
}).listen(PUERTO, () => console.log(`app en http://localhost:${PUERTO}`));
