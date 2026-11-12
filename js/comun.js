/* Funciones comunes a las dos vistas: cómo se pinta un poste, elección de ruta,
   códigos de poste y validación del estado recibido.
   Aquí NO hay lector del puerto serie ni nada que genere o publique estados. */
(function (global) {
  "use strict";

  var NOMBRES = ["NORMAL", "PREPARATE", "EVACUAR", "REFUGIO"];
  var NOMBRES_BONITOS = ["NORMAL", "PREPÁRATE", "EVACUAR", "REFUGIO"];

  function codigoDe(datos, nodo) {
    for (var i = 0; i < datos.postes.length; i++) if (datos.postes[i].nodo === nodo) return datos.postes[i].codigo;
    return "nodo " + nodo;
  }

  /* ---------- Presentación ---------- */

  /* Cómo se pinta un poste. Siempre texto + ícono además del color. */
  function categoriaPoste(estado, nodo) {
    var p = estado && estado.postes ? estado.postes[nodo] : null;
    if (!p) return { clave: "desconocido", texto: "", icono: "" };
    if (p.pasivo) return { clave: "pasivo", texto: "SOLO QR", icono: "QR" };
    if (p.fuego) return { clave: "fuego", texto: "FUEGO LLEGÓ AQUÍ", icono: "🔥" };
    if (p.sinSenal) return { clave: "sinsenal", texto: "SIN SEÑAL", icono: "✕" };
    if (p.estado === 3) return { clave: "refugio", texto: "REFUGIO", icono: "R" };
    if (p.estado === 2) {
      return estado.foco === nodo
        ? { clave: "foco", texto: "ROJO · FOCO", icono: "▲" }
        : { clave: "ruta", texto: "EVACUAR · RUTA", icono: "➜" };
    }
    if (p.estado === 1) return { clave: "preparate", texto: "AMARILLO", icono: "!" };
    return { clave: "normal", texto: "VERDE", icono: "✓" };
  }

  /* ¿Hay peligro en este nodo como para no pasar por ahí? */
  function nodoPeligroso(estado, nodo) {
    var p = estado.postes[nodo];
    if (!p) return false;
    if (p.fuego) return true;
    if (estado.global >= 2 && estado.foco === nodo) return true;
    if (estado.global >= 1 && p.sinSenal) return true;
    return false;
  }

  /* Elige la ruta para un poste. Sin estado en vivo => siempre la principal. */
  function elegirRuta(poste, estado) {
    var r = { ruta: poste.rutaPrincipal, esAlternativa: false, cortadaEn: [], sinSalida: false };
    if (!estado || !estado.postes) return r;
    var cortes = poste.rutaPrincipal.pasaPor.filter(function (n) { return nodoPeligroso(estado, n); });
    if (!cortes.length) return r;
    r.cortadaEn = cortes;
    if (!poste.rutaAlternativa) return r;
    var cortesAlt = poste.rutaAlternativa.pasaPor.filter(function (n) { return nodoPeligroso(estado, n); });
    r.ruta = poste.rutaAlternativa;
    r.esAlternativa = true;
    r.sinSalida = cortesAlt.length > 0;
    return r;
  }

  function normalizarCodigo(texto) {
    if (!texto) return "";
    var t = String(texto).toUpperCase().replace(/[^A-Z0-9]/g, "");
    var m = /^P?(\d{1,6})$/.exec(t);
    return m ? "P-" + m[1] : "";
  }

  /* Saca el código de un texto de QR: URL con ?poste=... o el código directo. */
  function codigoDesdeQR(texto) {
    if (!texto) return "";
    var m = /[?&]poste=([^&#]+)/i.exec(texto);
    if (m) { try { return normalizarCodigo(decodeURIComponent(m[1])); } catch (e) { return normalizarCodigo(m[1]); } }
    return normalizarCodigo(texto.trim());
  }

  function hora(ts) {
    var d = new Date(ts);
    function dd(n) { return (n < 10 ? "0" : "") + n; }
    return dd(d.getHours()) + ":" + dd(d.getMinutes()) + ":" + dd(d.getSeconds());
  }

  /* Valida un estado recibido por la red antes de usarlo. */
  function estadoValido(e) {
    return !!e && typeof e === "object" && e.v === 1 && typeof e.ts === "number" &&
      typeof e.global === "number" && e.global >= 0 && e.global <= 3 &&
      e.postes && typeof e.postes === "object" && Array.isArray(e.eventos) && Array.isArray(e.avance);
  }

  var Logica = {
    NOMBRES: NOMBRES, NOMBRES_BONITOS: NOMBRES_BONITOS,
    categoriaPoste: categoriaPoste, elegirRuta: elegirRuta, nodoPeligroso: nodoPeligroso,
    normalizarCodigo: normalizarCodigo, codigoDesdeQR: codigoDesdeQR, codigoDe: codigoDe,
    hora: hora, estadoValido: estadoValido
  };
  global.Logica = Logica;
  if (typeof module !== "undefined" && module.exports) module.exports = Logica;
})(typeof self !== "undefined" ? self : globalThis);
