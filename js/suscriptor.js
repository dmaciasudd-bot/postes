/* Conexión en tiempo real de la app pública (Vecino).
   - SOLO se suscribe a CONFIG.temaEstado (estado de los postes).
   - SOLO publica en CONFIG.temaReportes (aviso del vecino a la Central), nunca retenido.
   - No se suscribe a los reportes: este teléfono nunca ve avisos de otras personas.
   Además escucha un BroadcastChannel para que una pestaña del mismo navegador que la Central
   funcione sin internet (demostración en el notebook).
   Nunca lanza errores hacia la interfaz: sin broker, simplemente no hay datos en vivo. */
(function () {
  "use strict";

  /* Tipos de reporte permitidos. No hay texto libre ni datos personales. */
  var TIPOS_REPORTE = ["humo", "fuego", "ayuda", "asalvo"];

  function crear(op) {
    // op: { alEstado(fn obj), alCambiarConexion(fn bool) }
    var cfg = window.CONFIG || {};
    var cliente = null, conectado = false, canal = null;

    function avisar(c) {
      if (c === conectado) return;
      conectado = c;
      try { op.alCambiarConexion && op.alCambiarConexion(c); } catch (e) { /* nada */ }
    }

    function recibirEstado(texto) {
      try {
        var obj = JSON.parse(texto);
        if (window.Logica.estadoValido(obj)) op.alEstado(obj);
      } catch (e) { /* mensaje ajeno o roto: se ignora */ }
    }

    try {
      if ("BroadcastChannel" in window) {
        canal = new BroadcastChannel("postes-alerta:" + (cfg.temaEstado || ""));
        canal.onmessage = function (ev) { if (ev.data && ev.data.tipo === "estado") recibirEstado(ev.data.json); };
        canal.postMessage({ tipo: "pedir" });
      }
    } catch (e) { canal = null; }

    try {
      if (window.mqtt && cfg.broker && cfg.temaEstado) {
        cliente = window.mqtt.connect(cfg.broker, {
          clientId: "vigia_v_" + Math.random().toString(16).slice(2, 10),
          clean: true, keepalive: 30, connectTimeout: 8000, reconnectPeriod: 4000, resubscribe: true
        });
        cliente.on("connect", function () {
          avisar(true);
          cliente.subscribe(cfg.temaEstado, { qos: 1 }, function () { /* nada */ });
        });
        cliente.on("message", function (tema, carga) { if (tema === cfg.temaEstado) recibirEstado(carga.toString()); });
        cliente.on("close", function () { avisar(false); });
        cliente.on("offline", function () { avisar(false); });
        cliente.on("error", function () { /* silencio: se reintenta solo */ });
      }
    } catch (e) { cliente = null; }

    /* Envía un aviso a la Central. Llama a listo(true|false) cuando se sabe si salió. */
    function enviarReporte(codigoPoste, tipo, listo) {
      var terminado = false;
      function fin(ok) { if (!terminado) { terminado = true; try { listo(ok); } catch (e) { /* nada */ } } }
      if (TIPOS_REPORTE.indexOf(tipo) < 0 || !cfg.temaReportes) { fin(false); return; }
      var json = JSON.stringify({
        v: 1, id: Math.random().toString(36).slice(2, 12), ts: Date.now(),
        poste: String(codigoPoste).slice(0, 10), tipo: tipo
      });
      try { if (canal) canal.postMessage({ tipo: "reporte", json: json }); } catch (e) { /* nada */ }
      if (cliente && conectado) {
        try {
          cliente.publish(cfg.temaReportes, json, { qos: 1, retain: false }, function (err) { fin(!err); });
          setTimeout(function () { fin(false); }, 6000);
          return;
        } catch (e) { /* cae abajo */ }
      }
      // Sin broker: solo "sale" si hay una Central en este mismo navegador; no se puede confirmar.
      fin(false);
    }

    return { enviarReporte: enviarReporte, estaConectado: function () { return conectado; } };
  }

  window.Suscriptor = { crear: crear, TIPOS_REPORTE: TIPOS_REPORTE };
})();
