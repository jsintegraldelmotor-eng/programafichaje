/* Guarda la aplicación dentro de la tablet: después de abrirla una vez,
   funciona para siempre aunque no haya wifi ni cobertura. */

const VERSION = 'fichalba-v11';
const FICHEROS = [
  './', 'index.html', 'estilos.css', 'manifest.webmanifest',
  'app.js', 'comun.js', 'jefe.js', 'logica.js', 'almacen.js', 'excel.js', 'hoja.js',
  'version.js',
  'iconos/icono-192.png', 'iconos/icono-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHEROS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((guardado) => guardado || fetch(e.request).catch(() => {
      // Sin red y sin copia: si es una navegación, se abre la aplicación igual.
      if (e.request.mode === 'navigate') return caches.match('index.html');
      throw new Error('sin conexión');
    }))
  );
});
