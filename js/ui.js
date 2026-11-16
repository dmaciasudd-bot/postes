/* Piezas de interfaz compartidas por las dos vistas: íconos SVG, logo, línea de tiempo, textos de tiempo.
   Solo presentación: no hay lógica de estados aquí. */
(function () {
  "use strict";

  /* Íconos propios, caja de 24x24. t = trazos (stroke), r = rellenos (fill). */
  var ICONOS = {
    check: { t: ["M5 12.5l4.5 4.5L19 7.5"] },
    alerta: { t: ["M12 5v9", "M12 18.6v.2"] },
    triangulo: { t: ["M12 3.8L21.5 20H2.5Z", "M12 10v4.5", "M12 17.4v.2"] },
    evacuar: { t: ["M4 12h15", "M13 6l6 6-6 6"] },
    refugio: { t: ["M3.5 11.5L12 4l8.5 7.5", "M6 10v9.5h12V10", "M10 19.5v-5h4v5"] },
    llama: { r: ["M12.4 2.5c.5 3 2.4 4.700 4 6.700 1.300 1.600 2.200 3.400 2.200 5.400a6.600 6.600 0 0 1-13.200 0c0-1.800.7-3.400 1.900-4.700.3 1.200.9 2 1.900 2.400-.4-3.500.6-7 3.200-9.800z"] },
    sinsenal: { t: ["M12 18.6v.2", "M8.800 15.200a4.600 4.600 0 0 1 6.400 0", "M5.800 12.200a8.800 8.800 0 0 1 12.400 0", "M3.500 3.500l17 17"] },
    enlinea: { t: ["M12 18.6v.2", "M8.800 15.200a4.600 4.600 0 0 1 6.400 0", "M5.800 12.200a8.800 8.800 0 0 1 12.400 0", "M2.800 9.200a13 13 0 0 1 18.400 0"] },
    telefono: { r: ["M6.600 3h3.100l1.700 4.600-2.300 1.700a12.500 12.500 0 0 0 5.900 5.900l1.700-2.300 4.600 1.700v3.100a2.300 2.300 0 0 1-2.500 2.300A17.800 17.800 0 0 1 4.300 5.500 2.300 2.300 0 0 1 6.600 3z"] },
    qr: { t: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h2.500v2.500H14z", "M20 14v.1", "M17.500 20H20v-2.500", "M14 20v.1"] },
    reloj: { t: ["M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17z", "M12 7.500V12l3 2"] },
    sirena: { t: ["M4 9.500v5h3.500l4.500 4v-13l-4.500 4z", "M15.500 9a4.500 4.500 0 0 1 0 6", "M18.200 6.500a8 8 0 0 1 0 11"] },
    usb: { t: ["M9 3v5", "M15 3v5", "M6.500 8h11v4a5.500 5.500 0 0 1-11 0z", "M12 17.500V21"] },
    boton: { t: ["M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17z"], r: ["M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7z"] },
    humo: { t: ["M7 18.500h9.500a4 4 0 0 0 .6-7.950A5.500 5.500 0 0 0 6.600 9.900 4.300 4.300 0 0 0 7 18.500z"] },
    bandera: { t: ["M6.500 21V4"], r: ["M6.500 4.500h11l-2.700 3.700 2.700 3.800h-11z"] },
    poste: { t: ["M12 10.500V20", "M8.500 20.500h7"], r: ["M12 3.500a3.300 3.300 0 1 0 0 6.600 3.300 3.300 0 0 0 0-6.600z"] },
    camara: { t: ["M4 8h3.500L9 5.500h6L16.500 8H20v11H4z", "M12 10.500a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"] },
    chevron: { t: ["M9 5l7 7-7 7"] },
    cambiar: { t: ["M4 8h14", "M14.500 4.500L18 8l-3.500 3.500", "M20 16H6", "M9.500 12.500L6 16l3.500 3.500"] },
    info: { t: ["M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17z", "M12 11v5.500", "M12 7.600v.2"] },
    ruta: { t: ["M6 20.500V17a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4V4.500", "M14.500 7.500L18 4l3.500 3.500"], r: ["M6 18.200a2.200 2.200 0 1 0 0 4.400 2.200 2.200 0 0 0 0-4.400z"] },
    x: { t: ["M6 6l12 12", "M18 6L6 18"] },
    descarga: { t: ["M12 4v11", "M7.500 11l4.500 4.500 4.500-4.500", "M5 20h14"] },
    borrar: { t: ["M4.500 7h15", "M9.500 7V4.500h5V7", "M6.500 7l1 13h9l1-13"] },
    antena: { t: ["M12 12.500V21", "M8.500 21h7", "M8.300 6.800a5 5 0 0 0 0 6.400", "M15.700 6.800a5 5 0 0 1 0 6.400", "M5.200 4.500a9 9 0 0 0 0 11", "M18.800 4.500a9 9 0 0 1 0 11"], r: ["M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"] },
    globo: { t: ["M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17z", "M3.500 12h17", "M12 3.500c2.600 2.400 3.900 5.200 3.900 8.500s-1.300 6.100-3.900 8.500c-2.600-2.400-3.900-5.200-3.900-8.500s1.300-6.100 3.900-8.500z"] },
    celular: { t: ["M8.500 3h7A1.500 1.500 0 0 1 17 4.500v15a1.500 1.500 0 0 1-1.500 1.500h-7A1.500 1.500 0 0 1 7 19.500v-15A1.500 1.500 0 0 1 8.500 3z", "M11 18h2"] },
    notebook: { t: ["M5.500 5.500h13V15h-13z", "M3 18.500h18"] },
    play: { r: ["M8 5.500v13l11-6.500z"] },
    parar: { r: ["M7 7h10v10H7z"] },
    pantalla: { t: ["M3.500 5h17v11h-17z", "M9 20h6", "M12 16v4"] },
    imprimir: { t: ["M7 8.500V4h10v4.500", "M7 17H4.500V9.500h15V17H17", "M7 14h10v6H7z"] },
    copiar: { t: ["M9 9h10v11H9z", "M5 15V4h10"] },
    mochila: { t: ["M8.500 7V5.500a3.500 3.500 0 0 1 7 0V7", "M6 9.500A2.500 2.500 0 0 1 8.500 7h7A2.500 2.500 0 0 1 18 9.500V20H6z", "M9.500 13h5v3h-5z"] },
    voz: { t: ["M4 9.500v5h3.500l4.500 4v-13l-4.500 4z", "M15.500 9a4.500 4.500 0 0 1 0 6"] },
    contraste: { t: ["M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17z"], r: ["M12 3.500a8.500 8.500 0 0 1 0 17z"] },
    letra: { t: ["M3.500 19l5-13 5 13", "M5.300 14.500h6.400", "M15 19l3-7.500 3 7.500", "M16 16.500h4"] },
    persona: { r: ["M12 4a3.200 3.200 0 1 0 0 6.400A3.200 3.200 0 0 0 12 4z"], t: ["M5.500 20a6.500 6.500 0 0 1 13 0"] },
    vibrar: { t: ["M8.500 4h7v16h-7z", "M4.500 8.500v7", "M19.500 8.500v7"] },
    lista: { t: ["M4 6.500l1.500 1.500L8 5.500", "M11 7h9", "M4 12.500l1.500 1.500L8 11.500", "M11 13h9", "M4 18.500l1.500 1.500L8 17.500", "M11 19h9"] },
    cronometro: { t: ["M12 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M12 10.500V14l2 1.500", "M10 3.500h4"] },
    ajustes: { t: ["M4 7h9", "M17 7h3", "M4 17h3", "M11 17h9"], r: ["M15 4.800a2.200 2.200 0 1 0 0 4.400 2.200 2.200 0 0 0 0-4.400z", "M9 14.800a2.200 2.200 0 1 0 0 4.400 2.200 2.200 0 0 0 0-4.400z"] }
  };

  function cuerpo(nombre) {
    var ic = ICONOS[nombre] || ICONOS.info, h = "";
    (ic.r || []).forEach(function (d) { h += '<path d="' + d + '" fill="currentColor" stroke="none"/>'; });
    (ic.t || []).forEach(function (d) { h += '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'; });
    return h;
  }
  /* Ícono para HTML */
  function icono(nombre, clase) {
    return '<svg class="ico' + (clase ? " " + clase : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + cuerpo(nombre) + "</svg>";
  }
  /* Ícono para incrustar dentro de otro SVG (centrado en 0,0) */
  function iconoEnSvg(nombre, tam, color) {
    var e = tam / 24;
    return '<g transform="scale(' + e + ') translate(-12,-12)" style="color:' + color + '">' + cuerpo(nombre) + "</g>";
  }

  /* Logo: un poste con ondas de señal. */
  function logo(tam, conFondo) {
    return '<svg class="logo" width="' + tam + '" height="' + tam + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      (conFondo ? '<rect width="48" height="48" rx="11" fill="#0f1317"/>' : "") +
      '<path d="M24 23.500V39" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M17.500 40h13" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="24" cy="16" r="5" fill="#4d8dff"/>' +
      '<g fill="none" stroke="#4d8dff" stroke-width="3" stroke-linecap="round">' +
      '<path d="M31.660 9.570a10 10 0 0 1 0 12.860"/><path d="M16.340 9.570a10 10 0 0 0 0 12.860"/>' +
      '<g opacity=".55"><path d="M36.260 5.720a16 16 0 0 1 0 20.560"/><path d="M11.740 5.720a16 16 0 0 0 0 20.560"/></g></g></svg>';
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* "hace 3 s", "hace 2 min" */
  function hace(ts) {
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 90) return "hace " + s + " s";
    var m = Math.round(s / 60);
    if (m < 90) return "hace " + m + " min";
    return "hace " + Math.round(m / 60) + " h";
  }
  /* 03:27 o 1:03:27 */
  function cronometro(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    function dd(n) { return (n < 10 ? "0" : "") + n; }
    return (h ? h + ":" : "") + dd(m) + ":" + dd(x);
  }

  /* Tipo visual de un evento de la línea de tiempo (se deduce del texto y del nivel). */
  function tipoEvento(e) {
    if (e.clase) return { clase: e.clase, icono: e.icono || "info" };
    var t = e.texto || "";
    if (/FUEGO LLEG/i.test(t)) return { clase: "ev-fuego", icono: "llama" };
    if (/^Aviso de vecino/i.test(t)) return { clase: "ev-ambar", icono: "boton" };
    if (/^Humo detectado/i.test(t)) return { clase: e.nivel >= 2 ? "ev-rojo" : "ev-ambar", icono: "humo" };
    if (/^Prueba de sirena/i.test(t)) return { clase: "ev-gris", icono: "sirena" };
    if (/^SOS/i.test(t)) return { clase: "ev-rojo", icono: "boton" };
    if (/SIN SEÑAL/i.test(t)) return { clase: "ev-gris", icono: "sinsenal" };
    if (/volvió a tener señal/i.test(t)) return { clase: "ev-verde", icono: "enlinea" };
    var ic = /^ORDEN/i.test(t) ? "sirena" : "poste";
    return { clase: ["ev-verde", "ev-ambar", "ev-rojo", "ev-morado"][e.nivel | 0] || "ev-gris", icono: ic };
  }
  function lineaDeTiempo(eventos, max, hora) {
    return eventos.slice(0, max).map(function (e) {
      var t = tipoEvento(e), txt = String(e.texto), corte = txt.indexOf(" — ");
      var principal = corte > 0 ? txt.slice(0, corte) : txt, extra = corte > 0 ? txt.slice(corte + 3) : "";
      return '<li class="ev ' + t.clase + (e.sim ? " ev-simulado" : "") + '"><span class="ev-ico">' + icono(t.icono) + '</span><span class="ev-txt">' + (e.sim ? '<i class="ev-sim">SIM</i>' : "") + esc(principal) +
        (extra ? '<small>' + esc(extra) + "</small>" : "") + '</span><time>' + hora(e.ts) + "</time></li>";
    }).join("");
  }

  /* Aspecto de cada categoría de poste (clave viene de Logica.categoriaPoste). */
  var CATEGORIAS = {
    normal: { color: "#0b8043", tinta: "#fff", icono: "check", texto: "NORMAL", pulso: false },
    preparate: { color: "#ffb400", tinta: "#16130a", icono: "alerta", texto: "PREPÁRATE", pulso: true },
    foco: { color: "#e0202c", tinta: "#fff", icono: "triangulo", texto: "FOCO", pulso: true },
    ruta: { color: "#0b8043", tinta: "#fff", icono: "evacuar", texto: "RUTA SEGURA", pulso: true },
    evacuar: { color: "#e0202c", tinta: "#fff", icono: "evacuar", texto: "EVACUAR", pulso: true },
    refugio: { color: "#7c3aed", tinta: "#fff", icono: "refugio", texto: "REFUGIO", pulso: true },
    fuego: { color: "#0b0d10", tinta: "#ff7a1a", icono: "llama", texto: "FUEGO AQUÍ", pulso: true },
    sinsenal: { color: "#e6e9ee", tinta: "#11151a", icono: "sinsenal", texto: "SIN SEÑAL", pulso: false },
    pasivo: { color: "#64748b", tinta: "#fff", icono: "qr", texto: "SOLO QR", pulso: false },
    desconocido: { color: "#334155", tinta: "#fff", icono: "poste", texto: "", pulso: false }
  };

  function leyenda(claves, extra) {
    return claves.map(function (k) {
      var c = CATEGORIAS[k];
      return '<span class="ley"><i class="ley-punto' + (k === "sinsenal" ? " punteado" : "") + '" style="background:' + c.color + ";color:" + c.tinta + '">' +
        icono(c.icono) + "</i>" + esc(extra && extra[k] ? extra[k] : c.texto.charAt(0) + c.texto.slice(1).toLowerCase()) + "</span>";
    }).join("");
  }

  window.UI = {
    icono: icono, iconoEnSvg: iconoEnSvg, logo: logo, esc: esc, hace: hace, cronometro: cronometro,
    lineaDeTiempo: lineaDeTiempo, CATEGORIAS: CATEGORIAS, leyenda: leyenda
  };
})();
