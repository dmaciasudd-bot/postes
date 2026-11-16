/* Service worker de la app pública (Vecino): guarda TODA la app para que funcione en modo avión.
   Si cambias cualquier archivo, sube el número de VERSION para que los teléfonos se actualicen. */
var VERSION = "vigia-publica-v4";
var ARCHIVOS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "config.js",
  "datos.js",
  "css/estilo.css",
  "js/comun.js",
  "js/ui.js",
  "js/mapa.js",
  "js/suscriptor.js",
  "js/extras.js",
  "js/vecino.js",
  "lib/mqtt.min.js",
  "fonts/inter-latin-wght-normal.woff2",
  "fonts/jetbrains-mono-latin-wght-normal.woff2",
  "icons/logo.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(VERSION).then(function (c) {
      // Uno por uno: si un archivo falla, el resto igual queda guardado.
      return Promise.all(ARCHIVOS.map(function (a) {
        return c.add(new Request(a, { cache: "reload" })).catch(function () { /* se reintenta al usarlo */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Primero el caché (respuesta inmediata, sirve sin señal) y en segundo plano se actualiza. */
self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  ev.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (guardado) {
        var deRed = fetch(req).then(function (resp) {
          if (resp && resp.ok && resp.type === "basic") {
            var limpia = new Request(url.origin + url.pathname);
            cache.put(limpia, resp.clone()).catch(function () { /* nada */ });
          }
          return resp;
        });
        if (guardado) { deRed.catch(function () { /* sin red: ya respondimos del caché */ }); return guardado; }
        return deRed.catch(function () {
          if (req.mode === "navigate") return cache.match("index.html");
          return new Response("", { status: 504, statusText: "Sin conexion" });
        });
      });
    })
  );
});
