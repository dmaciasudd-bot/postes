/* Dibuja el mapa esquemático en SVG a partir de DATOS (y del estado en vivo si existe).
   Los colores del terreno salen de variables CSS (--m-...) para tener versión clara y oscura. */
(function () {
  "use strict";
  var AZUL = "#2f6fed";

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function pts(lista) { return lista.map(function (p) { return p[0] + "," + p[1]; }).join(" "); }
  function v(nombre) { return "var(--m-" + nombre + ")"; }

  function casa(x, y) {
    return '<g transform="translate(' + x + "," + y + ')">' +
      '<ellipse cx="1" cy="7" rx="9" ry="2.6" fill="#000" opacity=".16"/>' +
      '<path d="M-6.500,6.500V-1L0,-6.500L6.500,-1V6.500Z" style="fill:' + v("casa") + ";stroke:" + v("casa-borde") + '" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M-8.500,-.2L0,-7.600L8.500,-.2" fill="none" style="stroke:' + v("techo") + '" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="-1.600" y="1.500" width="3.200" height="5" style="fill:' + v("casa-borde") + '" opacity=".75"/></g>';
  }

  function defs(K) {
    return "<defs>" +
      '<pattern id="m-puntos' + K + '" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".9" style="fill:' + v("relieve") + '"/><circle cx="10" cy="11" r=".7" style="fill:' + v("relieve") + '"/></pattern>' +
      '<pattern id="m-arboles' + K + '" width="26" height="24" patternUnits="userSpaceOnUse">' +
      '<g style="fill:' + v("arbol") + '"><path d="M7,2.500l4.500,7h-2.300l3.300,5.500h-11l3.300,-5.500h-2.300z"/><rect x="6.200" y="15" width="1.600" height="2.600"/>' +
      '<g opacity=".7"><path d="M20,14l3.600,5.600h-1.800l2.600,4.400h-8.800l2.600,-4.400h-1.800z"/></g>' +
      '<g opacity=".7"><path d="M20,-10l3.600,5.600h-1.800l2.600,4.400h-8.800l2.600,-4.400h-1.800z"/></g></g></pattern>' +
      '<filter id="m-sombra' + K + '" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.500" stdDeviation="1.600" flood-color="#000" flood-opacity=".4"/></filter>' +
      "</defs>";
  }

  /* opciones: { estado, posteActual (código), ruta, rutaCortada, mostrarAvance } */
  function dibujar(svg, datos, op) {
    op = op || {};
    var K = svg.id ? "-" + svg.id.replace(/[^a-z0-9_-]/gi, "") : "";
    var UI = window.UI, W = datos.sector.ancho, H = datos.sector.alto, h = [defs(K)], i;

    // Terreno con textura suave y curvas de nivel
    h.push('<rect width="' + W + '" height="' + H + '" style="fill:' + v("terreno") + '"/>');
    h.push('<rect width="' + W + '" height="' + H + '" fill="url(#m-puntos' + K + ')"/>');
    for (i = 0; i < 11; i++) {
      var y = -20 + i * 50, d = (i % 2 ? 26 : -22);
      h.push('<path d="M-10,' + y + " C80," + (y - 34 + d) + " 190," + (y + 44) + " " + (W + 10) + "," + (y - 8 + d) + '" fill="none" style="stroke:' + v("relieve") + '" stroke-width="1.100" opacity=".8"/>');
    }

    // Bosque: mancha + árboles estilizados
    var manchas = datos.bosques.map(function (b) { return '<ellipse cx="' + b.cx + '" cy="' + b.cy + '" rx="' + b.rx + '" ry="' + b.ry + '"/>'; }).join("");
    h.push('<g style="fill:' + v("bosque-borde") + '" transform="translate(0,2)">' + manchas + "</g>");
    h.push('<g style="fill:' + v("bosque") + '">' + manchas + "</g>");
    h.push('<g fill="url(#m-arboles' + K + ')">' + manchas + "</g>");
    h.push('<text x="' + datos.etiquetaBosque[0] + '" y="' + datos.etiquetaBosque[1] + '" class="m-zona">BOSQUE</text>');

    // Caminos con borde
    datos.caminos.forEach(function (c) {
      h.push('<polyline points="' + pts(c.puntos) + '" fill="none" style="stroke:' + v("camino-borde") + '" stroke-width="' + (c.ancho + 3.500) + '" stroke-linecap="round" stroke-linejoin="round"/>');
    });
    datos.caminos.forEach(function (c, n) {
      h.push('<polyline points="' + pts(c.puntos) + '" fill="none" style="stroke:' + v("camino") + '" stroke-width="' + c.ancho + '" stroke-linecap="round" stroke-linejoin="round"/>');
      if (n === 0) h.push('<polyline points="' + pts(c.puntos) + '" fill="none" style="stroke:' + v("camino-eje") + '" stroke-width="1.200" stroke-dasharray="6 7" stroke-linejoin="round"/>');
    });
    datos.caminos.forEach(function (c) {
      if (c.nombre && c.etiqueta) {
        h.push('<text x="' + c.etiqueta[0] + '" y="' + c.etiqueta[1] + '" class="m-camino" transform="rotate(' + c.etiqueta[2] + " " + c.etiqueta[0] + " " + c.etiqueta[1] + ')">' + esc(c.nombre) + "</text>");
      }
    });

    datos.casas.forEach(function (c) { h.push(casa(c[0], c[1])); });

    // Tramo por donde ya pasó el fuego: une los postes con fusible quemado, en orden de llegada.
    function posDe(nodo) {
      for (var k = 0; k < datos.postes.length; k++) if (datos.postes[k].nodo === nodo) return [datos.postes[k].x, datos.postes[k].y];
      return null;
    }
    if (op.estado && op.estado.avance) {
      var qm = [], vq = {};
      op.estado.avance.forEach(function (a) {
        var xy = a && a.tipo === "fuego" && !vq[a.nodo] ? posDe(a.nodo) : null;
        if (xy) { vq[a.nodo] = 1; qm.push(xy); }
      });
      if (qm.length > 1) {
        h.push('<polyline points="' + pts(qm) + '" fill="none" stroke="#ff5a1f" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity=".38"/>');
        h.push('<polyline points="' + pts(qm) + '" fill="none" stroke="#7a1d05" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>');
        h.push('<polyline class="m-fuego" points="' + pts(qm) + '" fill="none" stroke="#ffb020" stroke-width="3.500" stroke-dasharray="3 7" stroke-linecap="round" stroke-linejoin="round"/>');
      }
    }
    // Hacia dónde seguiría el fuego (solo la Central lo pide; es una estimación).
    if (op.prediccion) {
      var pa = posDe(op.prediccion.desde);
      var pb = op.prediccion.encuentro ? [datos.puntoEncuentro.x, datos.puntoEncuentro.y] : posDe(op.prediccion.hacia);
      if (pa && pb) {
        var mx = pa[0] + (pb[0] - pa[0]) * 0.55, my = pa[1] + (pb[1] - pa[1]) * 0.55;
        var an = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180 / Math.PI;
        h.push('<polyline class="m-fuego" points="' + pts([pa, pb]) + '" fill="none" stroke="#ff5a1f" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round" opacity=".95"/>');
        h.push('<g transform="translate(' + mx + "," + my + ")\"><g transform=\"rotate(" + an + ')"><path d="M-7,-8L8,0L-7,8Z" fill="#ff5a1f" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></g>' +
          '<text x="13" y="4" class="m-est" style="fill:#ff5a1f">ESTIMACIÓN</text></g>');
      }
    }

    // Ruta cortada (gris) y ruta vigente (azul, guiones que avanzan y flechas)
    if (op.rutaCortada) {
      h.push('<polyline points="' + pts(op.rutaCortada.puntos) + '" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>');
      h.push('<polyline points="' + pts(op.rutaCortada.puntos) + '" fill="none" stroke="#6b7280" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round" stroke-linejoin="round"/>');
      var rc = op.rutaCortada.puntos;
      if (rc.length > 1) {
        h.push('<g transform="translate(' + (rc[0][0] + (rc[1][0] - rc[0][0]) * 0.5) + "," + (rc[0][1] + (rc[1][1] - rc[0][1]) * 0.5) + ')"><circle r="9" fill="#fff" stroke="#e0202c" stroke-width="2.500"/>' +
          '<path d="M-3.500,-3.500L3.500,3.500M3.500,-3.500L-3.500,3.500" stroke="#e0202c" stroke-width="2.600" stroke-linecap="round"/></g>');
      }
    }
    if (op.ruta) {
      var p = op.ruta.puntos;
      h.push('<polyline points="' + pts(p) + '" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" filter="url(#m-sombra' + K + ')"/>');
      h.push('<polyline points="' + pts(p) + '" fill="none" stroke="' + AZUL + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>');
      h.push('<polyline class="m-ruta" points="' + pts(p) + '" fill="none" stroke="#cfe0ff" stroke-width="3" stroke-dasharray="9 11" stroke-linecap="round" stroke-linejoin="round"/>');
      for (i = 0; i < p.length - 1; i++) {
        var dx = p[i + 1][0] - p[i][0], dy = p[i + 1][1] - p[i][1], largo = Math.sqrt(dx * dx + dy * dy);
        if (largo < 44) continue;
        var f = i === 0 ? 0.62 : 0.5; // el primer tramo sale del poste: la flecha se aleja del marcador
        var ang = Math.atan2(dy, dx) * 180 / Math.PI;
        h.push('<g transform="translate(' + (p[i][0] + dx * f) + "," + (p[i][1] + dy * f) + ") rotate(" + ang + ')"><circle r="8" fill="' + AZUL + '" stroke="#fff" stroke-width="2"/>' +
          '<path d="M-2.500,-4L2.500,0L-2.500,4" fill="none" stroke="#fff" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></g>');
      }
    }

    // Punto de encuentro con halo
    var pe = datos.puntoEncuentro;
    h.push('<g transform="translate(' + pe.x + "," + pe.y + ')">' +
      '<circle r="17" fill="' + AZUL + '" opacity=".35" class="m-halo"/>' +
      '<circle r="16" fill="' + AZUL + '" stroke="#fff" stroke-width="3" filter="url(#m-sombra' + K + ')"/>' +
      '<g transform="translate(1.500,0)">' + UI.iconoEnSvg("bandera", 19, "#fff") + "</g>" +
      '<text x="-23" y="-9" text-anchor="end" class="m-etq">PUNTO DE</text><text x="-23" y="3" text-anchor="end" class="m-etq">ENCUENTRO</text></g>');

    // Postes
    datos.postes.forEach(function (po) {
      var cat = op.estado ? window.Logica.categoriaPoste(op.estado, po.nodo) : { clave: po.pasivo ? "pasivo" : "desconocido" };
      var c = UI.CATEGORIAS[cat.clave] || UI.CATEGORIAS.desconocido;
      var etq = cat.etiqueta !== undefined ? cat.etiqueta : c.texto;
      var actual = op.posteActual === po.codigo;
      var g = '<g transform="translate(' + po.x + "," + po.y + ')">';
      if (c.pulso) {
        var colPulso = cat.clave === "fuego" ? "#ff5a1f" : c.color;
        g += '<circle r="14" fill="' + colPulso + '" class="m-pulso"/><circle r="14" fill="' + colPulso + '" class="m-pulso m-pulso2"/>';
      }
      if (actual) g += '<circle r="21" fill="none" stroke="' + AZUL + '" stroke-width="3"/><circle r="21" fill="none" stroke="#fff" stroke-width="1" opacity=".9"/>';
      g += '<circle r="14" fill="' + c.color + '" stroke="' + (cat.clave === "sinsenal" ? "#11151a" : "#fff") + '" stroke-width="' + (cat.clave === "sinsenal" ? 2 : 3) + '"' +
        (cat.clave === "sinsenal" ? ' stroke-dasharray="4 3"' : "") + ' filter="url(#m-sombra' + K + ')"/>';
      g += UI.iconoEnSvg(c.icono, 17, c.tinta);
      // Etiqueta a la izquierda; si la ruta sale hacia la izquierda desde este poste, va a la derecha.
      var der = actual && op.ruta && op.ruta.puntos.length > 1 && op.ruta.puntos[1][0] < po.x;
      var ex = der ? 25 : -21, anc = der ? "start" : "end";
      g += '<text x="' + ex + '" y="' + (etq ? -2 : 4) + '" text-anchor="' + anc + '" class="m-cod">' + esc(po.codigo) + "</text>";
      if (etq) g += '<text x="' + ex + '" y="10" text-anchor="' + anc + '" class="m-est">' + esc(etq) + "</text>";
      if (actual) {
        g += '<g transform="translate(0,-29)" filter="url(#m-sombra' + K + ')"><path d="M-5,6L0,12L5,6Z" fill="' + AZUL + '"/><rect x="-38" y="-11" width="76" height="19" rx="9.500" fill="' + AZUL + '"/>' +
          '<text y="2.500" text-anchor="middle" class="m-aqui">ESTÁS AQUÍ</text></g>';
      }
      if (op.mostrarAvance && op.estado) {
        var orden = 0, visto = {};
        op.estado.avance.forEach(function (a) {
          if (a.tipo === "sinsenal" || visto[a.nodo]) return;
          visto[a.nodo] = 1;
          if (a.nodo === po.nodo) orden = Object.keys(visto).length;
        });
        if (orden) g += '<g transform="translate(17,-17)"><circle r="10.500" fill="#fff" stroke="#0b0d10" stroke-width="2"/><text y="4.300" text-anchor="middle" class="m-orden">' + orden + "º</text></g>";
      }
      g += "</g>";
      h.push(g);
    });

    // Norte y nota
    h.push('<g transform="translate(' + (W - 24) + ',24)"><circle r="13" style="fill:' + v("halo") + ";stroke:" + v("suave") + '" stroke-width="1"/><path d="M0,-9L4,3L0,.8L-4,3Z" style="fill:' + v("texto") + '"/><text y="10.500" text-anchor="middle" class="m-norte">N</text></g>');
    h.push('<text x="8" y="' + (H - 8) + '" class="m-nota">Esquema de ejemplo · sin escala</text>');

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = h.join("");
  }

  window.Mapa = { dibujar: dibujar };
})();
