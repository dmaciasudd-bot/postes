/* Vista Vecino (teléfono). */
(function () {
  "use strict";
  var L = window.Logica, DATOS = window.DATOS, CFG = window.CONFIG || {}, UI = window.UI;
  var $ = function (id) { return document.getElementById(id); };
  var esc = UI.esc;

  var posteActual = null;   // objeto de DATOS.postes
  var estado = null;        // último estado recibido de la Central (o null)
  var brokerConectado = false;
  var flujoCamara = null, temporizadorQR = null;
  var firmaPintada = "";

  function buscarPoste(codigo) {
    for (var i = 0; i < DATOS.postes.length; i++) if (DATOS.postes[i].codigo === codigo) return DATOS.postes[i];
    return null;
  }
  function enLinea() { return navigator.onLine !== false; }
  function estadoViejo() {
    return !!estado && (Date.now() - (estado.pub || estado.ts)) > (CFG.datoViejoSegundos || 60) * 1000;
  }

  /* ---------- Navegación ---------- */
  function entrar(codigoCrudo, desdeUrl) {
    var codigo = L.normalizarCodigo(codigoCrudo);
    var p = codigo ? buscarPoste(codigo) : null;
    var err = $("error-codigo");
    if (!p) {
      err.innerHTML = UI.icono("info") + "<span>" + (codigo ? "No conozco el poste " + esc(codigo) + ". Revisa el código impreso en el poste."
        : "Escribe los cuatro números del poste. Ejemplo: P-1452.") + "</span>";
      err.hidden = false;
      mostrarEntrada();
      return false;
    }
    err.hidden = true;
    posteActual = p;
    detenerCamara();
    if (!desdeUrl) {
      try { history.pushState({ poste: codigo }, "", "?poste=" + encodeURIComponent(codigo)); } catch (e) { /* file:// */ }
    }
    $("entrada").hidden = true;
    $("poste").hidden = false;
    window.scrollTo(0, 0);
    pintar(true);
    return true;
  }
  function mostrarEntrada() {
    posteActual = null;
    $("poste").hidden = true;
    $("entrada").hidden = false;
    pintar(true);
  }
  function leerUrl() {
    var m = /[?&]poste=([^&#]+)/i.exec(location.search);
    if (m) { var c; try { c = decodeURIComponent(m[1]); } catch (e) { c = m[1]; } entrar(c, true); }
    else mostrarEntrada();
  }

  /* ---------- Pastilla de conexión (se refresca cada segundo) ---------- */
  function pintarPastilla() {
    var clase, html;
    if (!enLinea()) {
      clase = "pastilla off";
      html = UI.icono("sinsenal") + "<span><b>Sin conexión</b> · usando mapa guardado</span>";
    } else if (estado && !estadoViejo()) {
      clase = "pastilla ok";
      html = UI.icono("enlinea") + "<span><b>En línea</b> · actualizado " + UI.hace(estado.pub || estado.ts) + "</span>";
    } else if (estado) {
      clase = "pastilla viejo";
      html = UI.icono("enlinea") + "<span><b>En línea</b> · último dato " + UI.hace(estado.pub || estado.ts) + "</span>";
    } else {
      clase = "pastilla ok";
      html = UI.icono("enlinea") + "<span><b>En línea</b> · " + (brokerConectado ? "esperando a la central" : "sin datos de la central") + "</span>";
    }
    ["pastilla", "pastilla-portada"].forEach(function (id) {
      var el = $(id);
      if (el.className !== clase) el.className = clase;
      if (el.innerHTML !== html) el.innerHTML = html;
    });
  }

  /* ---------- Banda de estado ---------- */
  var HEROES = {
    x: { ico: "ruta", etq: "Ruta guardada en este teléfono", orden: "Sin estado en vivo", grande: false },
    0: { ico: "check", etq: "Estado normal", orden: "Sin alertas en tu sector", det: "No tienes que hacer nada. Revisa abajo tu ruta de evacuación para conocerla.", grande: false },
    1: { ico: "alerta", etq: "Alerta amarilla", orden: "Prepárate para salir", det: "Hay un indicio de fuego cerca. Ten a mano llaves, agua, documentos y mascotas.", grande: true },
    2: { ico: "evacuar", etq: "Alerta roja", orden: "Evacúa ahora hacia el punto de encuentro", det: "Sigue la ruta azul del mapa. No vuelvas por tus cosas.", grande: true },
    3: { ico: "refugio", etq: "Refugio", orden: "No salgas, refúgiate", det: "Ya es tarde para salir por los caminos. Busca refugio ahora.", grande: true },
    fuego: { ico: "llama", etq: "Fuego en este poste", orden: "El fuego está aquí. Aléjate ahora", det: "Sigue la ruta azul del mapa. No te quedes a mirar.", grande: true }
  };

  function pintarHeroe(fuegoAqui) {
    var clave = !estado ? "x" : (fuegoAqui && estado.global < 3 ? "fuego" : String(estado.global));
    var hd = HEROES[clave], caja = $("p-estado");
    var det = hd.det, extra = "";
    if (clave === "x") {
      det = (enLinea() ? "Todavía no llegan datos de la central. " : "No hay conexión. ") +
        "Guíate por las luces y la sirena del poste: verde es normal, amarillo prepárate, rojo evacúa.";
    }
    if (estado && estado.global >= 1) {
      var partes = [];
      if (estado.foco > 0) partes.push("Foco informado en el poste " + esc(L.codigoDe(DATOS, estado.foco)));
      if (estado.alertaDesde) partes.push("alerta desde las " + L.hora(estado.alertaDesde).slice(0, 5));
      if (partes.length) extra = "<small>" + partes.join(" · ") + "</small>";
    }
    caja.setAttribute("data-e", clave);
    caja.className = "heroe" + (hd.grande ? " grande" : "");
    caja.innerHTML = '<div class="heroe-in"><div class="heroe-cab"><span class="heroe-ico">' + UI.icono(hd.ico) + '</span><p class="heroe-etq">' + hd.etq + extra + "</p></div>" +
      '<h2 class="heroe-orden">' + hd.orden + '</h2><p class="heroe-det">' + det + "</p></div>";
    return clave;
  }

  /* ---------- Pintado general ---------- */
  function pintar(forzar) {
    pintarPastilla();
    $("banda-sim").hidden = !(estado && estado.simulacion);
    var oscuro = !!estado && estado.global >= 1 && !!posteActual;
    document.body.setAttribute("data-tema", oscuro ? "oscuro" : "claro");
    $("p-dictar").hidden = !posteActual;
    if (!posteActual) return;

    // Solo se redibuja si cambió algo visible (así no se reinician las animaciones con cada latido).
    var copia = estado ? JSON.stringify(estado, function (k, v) { return k === "pub" ? undefined : v; }) : "";
    var firma = posteActual.codigo + "|" + copia + "|" + enLinea() + "|" + estadoViejo() + "|" + brokerConectado;
    if (!forzar && firma === firmaPintada) return;
    firmaPintada = firma;

    var p = posteActual;
    $("p-codigo").textContent = p.codigo;
    $("p-dictar-cod").textContent = p.codigo;
    $("p-llamar").setAttribute("aria-label", "Llamar al 130 y dictar el poste " + p.codigo);

    var el = L.elegirRuta(p, estado);
    var miPoste = estado ? estado.postes[p.nodo] : null;
    var fuegoAqui = !!estado && ((miPoste && miPoste.fuego) || (estado.global >= 2 && estado.foco === p.nodo));
    pintarHeroe(fuegoAqui);

    // Aviso de dato viejo
    var aviso = $("p-aviso");
    if (estado && (estadoViejo() || !enLinea())) {
      aviso.hidden = false;
      aviso.innerHTML = UI.icono("reloj") + "<span>Último dato de la central: " + L.hora(estado.pub || estado.ts) +
        ". Puede haber cambiado. Guíate también por las luces y la sirena del poste.</span>";
    } else aviso.hidden = true;

    // Mapa
    window.Mapa.dibujar($("mapa"), DATOS, {
      estado: estado, posteActual: p.codigo, ruta: el.ruta,
      rutaCortada: el.esAlternativa ? p.rutaPrincipal : null
    });
    $("leyenda").innerHTML = '<span class="ley"><i class="ley-ruta"></i>Tu ruta</span><span class="ley"><i class="ley-pe">' + UI.icono("bandera") + "</i>Punto de encuentro</span>" +
      (estado ? UI.leyenda(["normal", "preparate", "foco", "fuego", "sinsenal"], { preparate: "Prepárate", foco: "Foco del fuego", fuego: "Fuego llegó aquí" }) : "");

    // Ruta
    var h = "";
    if (estado && estado.global === 3) {
      h += "<h2>" + UI.icono("refugio") + 'Qué hacer ahora</h2><ol class="pasos refugio">' +
        "<li><span>No salgas a los caminos: el fuego puede cortarlos.</span></li>" +
        "<li><span>Entra a la construcción más firme que tengas cerca, o a un lugar despejado y sin vegetación.</span></li>" +
        "<li><span>Cierra puertas y ventanas. Cúbrete nariz y boca con un paño húmedo.</span></li>" +
        "<li><span>Llama al 130 y dicta el código de este poste: " + esc(p.codigo) + ".</span></li></ol>" +
        '<p class="sub" style="margin:16px 0 12px">Solo si todavía puedes salir con seguridad, la ruta es:</p>';
    }
    if (el.esAlternativa) {
      h += '<div class="ruta-alt">' + UI.icono("ruta") + "<span>RUTA ALTERNATIVA<small>La ruta habitual está cortada por el fuego en " +
        el.cortadaEn.map(function (n) { return esc(L.codigoDe(DATOS, n)); }).join(", ") + ".</small></span></div>";
    }
    h += "<h2>" + UI.icono("ruta") + (el.esAlternativa ? "Ruta alternativa" : "Tu ruta de evacuación") + "</h2>";
    if (!el.esAlternativa && el.cortadaEn.length) {
      h += '<p class="aviso grave" style="margin-bottom:12px">' + UI.icono("triangulo") + "<span>Hay peligro informado en esta ruta y no hay otra registrada. Avanza con máximo cuidado o busca refugio.</span></p>";
    }
    if (el.sinSalida) {
      h += '<p class="aviso grave" style="margin-bottom:12px">' + UI.icono("triangulo") + "<span>También hay peligro informado en la ruta alternativa. Evalúa refugiarte y llama al 130.</span></p>";
    }
    h += '<div class="ruta-datos"><div class="dato"><small>Destino</small>' + esc(DATOS.puntoEncuentro.nombre) + "</div>" +
      '<div class="dato"><small>Distancia</small>' + esc(el.ruta.distancia) + "</div>" +
      '<div class="dato"><small>A pie</small>' + esc(el.ruta.tiempo.replace(/\s*a pie/i, "")) + "</div></div>";
    h += '<ol class="pasos">' + el.ruta.pasos.map(function (s) { return "<li><span>" + esc(s) + "</span></li>"; }).join("") + "</ol>";
    $("p-ruta").innerHTML = h;

    // Línea de tiempo
    var cajaT = $("p-tiempo-caja");
    if (estado && estado.eventos.length) {
      cajaT.hidden = false;
      $("p-tiempo").innerHTML = UI.lineaDeTiempo(estado.eventos, 12, L.hora);
    } else cajaT.hidden = true;

    // Pie de conexión
    var pie;
    if (!enLinea()) pie = "Modo sin conexión: mapa, ruta e instrucciones guardados en el teléfono.";
    else if (estado && !estadoViejo()) pie = "Modo en línea: recibiendo el estado de la central" + (estado.simulacion ? " (simulación)" : "") + ".";
    else if (brokerConectado) pie = "Modo en línea: conectado, esperando datos de la central.";
    else pie = "Modo en línea: sin datos de la central por ahora. Se muestra la ruta preestablecida.";
    $("p-conexion").textContent = pie;
  }

  /* ---------- QR ---------- */
  function detenerCamara() {
    if (temporizadorQR) { clearInterval(temporizadorQR); temporizadorQR = null; }
    if (flujoCamara) { try { flujoCamara.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* nada */ } flujoCamara = null; }
    $("zona-qr").hidden = true;
  }
  function escanear() {
    var zona = $("zona-qr"), msg = $("estado-qr"), video = $("camara");
    zona.hidden = false;
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      video.hidden = true;
      msg.textContent = "Este navegador no puede leer QR desde la app. Abre la cámara normal del teléfono y apunta al QR del poste, o escribe el código arriba.";
      return;
    }
    video.hidden = false;
    msg.textContent = "Abriendo cámara…";
    var detector;
    try { detector = new window.BarcodeDetector({ formats: ["qr_code"] }); } catch (e) { msg.textContent = "No se pudo iniciar el lector de QR. Escribe el código."; return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }).then(function (flujo) {
      flujoCamara = flujo;
      video.srcObject = flujo;
      video.play().catch(function () { /* nada */ });
      msg.textContent = "Apunta la cámara al código QR del poste.";
      var ocupado = false;
      temporizadorQR = setInterval(function () {
        if (ocupado || video.readyState < 2) return;
        ocupado = true;
        detector.detect(video).then(function (codigos) {
          ocupado = false;
          for (var i = 0; i < codigos.length; i++) {
            var c = L.codigoDesdeQR(codigos[i].rawValue || "");
            if (c && buscarPoste(c)) { entrar(c); return; }
            if (c) msg.textContent = "Leí " + c + ", pero no es un poste de este sector.";
          }
        }).catch(function () { ocupado = false; });
      }, 300);
    }).catch(function () {
      video.hidden = true;
      msg.textContent = "No se pudo usar la cámara (permiso denegado o sin cámara). Escribe el código del poste.";
    });
  }

  /* ---------- Inicio ---------- */
  $("logo-portada").innerHTML = UI.logo(84, true);
  $("logo-barra").innerHTML = UI.logo(34, true);
  $("ico-entrar").innerHTML = UI.icono("chevron");
  $("ico-qr").innerHTML = UI.icono("qr");
  $("ico-offline").innerHTML = UI.icono("descarga");
  $("ico-cambiar").innerHTML = UI.icono("cambiar");
  $("ico-tel").innerHTML = UI.icono("telefono");
  $("mapa-titulo").innerHTML = UI.icono("poste") + "Mapa del sector";
  $("tiempo-titulo").innerHTML = UI.icono("reloj") + "Qué ha pasado";
  $("reporte-titulo").innerHTML = UI.icono("sirena") + "Avisar a la central";
  Array.prototype.forEach.call(document.querySelectorAll("[data-ico]"), function (el) { el.innerHTML = UI.icono(el.getAttribute("data-ico")); });

  $("lista-postes").innerHTML = DATOS.postes.map(function (p) {
    return '<button class="btn btn-chico" type="button" data-codigo="' + esc(p.codigo) + '">' + esc(p.codigo) + "</button>";
  }).join("");
  $("lista-postes").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-codigo]");
    if (b) entrar(b.getAttribute("data-codigo"));
  });
  $("codigo").addEventListener("input", function () {
    var limpio = this.value.replace(/\D/g, "").slice(0, 4);
    if (limpio !== this.value) this.value = limpio;
    $("error-codigo").hidden = true;
  });
  $("form-codigo").addEventListener("submit", function (ev) { ev.preventDefault(); entrar($("codigo").value); });
  $("btn-qr").addEventListener("click", escanear);
  $("btn-qr-cerrar").addEventListener("click", detenerCamara);
  $("btn-cambiar").addEventListener("click", function () {
    try { history.pushState({}, "", location.pathname); } catch (e) { /* nada */ }
    mostrarEntrada();
  });
  window.addEventListener("popstate", leerUrl);
  window.addEventListener("online", function () { pintar(); });
  window.addEventListener("offline", function () { pintar(); });
  setInterval(pintarPastilla, 1000);
  setInterval(function () { pintar(); }, 10000); // detecta "dato viejo"

  var conexion = window.Suscriptor.crear({
    alEstado: function (e) {
      if (estado && (e.pub || e.ts) < (estado.pub || estado.ts)) return; // mensaje atrasado
      estado = e; pintar();
    },
    alCambiarConexion: function (c) { brokerConectado = c; pintar(); }
  });

  /* ---------- Reportes del vecino a la Central ----------
     Este teléfono solo ENVÍA su aviso. Nunca recibe ni muestra avisos de otras personas. */
  var TEXTOS_REPORTE = { humo: "Veo humo", fuego: "Veo fuego", ayuda: "Necesito ayuda para salir", asalvo: "Llegué al punto de encuentro" };
  var ultimoReporte = 0, enviando = false;
  function mensajeReporte(clase, html) {
    var m = $("reporte-msg");
    m.className = "reporte-msg " + clase;
    m.innerHTML = html;
    m.hidden = false;
  }
  $("p-reporte").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-reporte]");
    if (!b || !posteActual || enviando) return;
    var tipo = b.getAttribute("data-reporte"), codigo = posteActual.codigo;
    var espera = (CFG.esperaReporteSegundos || 20) * 1000 - (Date.now() - ultimoReporte);
    if (espera > 0) {
      mensajeReporte("espera", UI.icono("reloj") + "<span>Espera " + Math.ceil(espera / 1000) + " s para enviar otro aviso.</span>");
      return;
    }
    enviando = true;
    mensajeReporte("espera", UI.icono("reloj") + "<span>Enviando aviso…</span>");
    conexion.enviarReporte(codigo, tipo, function (ok) {
      enviando = false;
      if (ok) {
        ultimoReporte = Date.now();
        mensajeReporte("ok", UI.icono("check") + "<span>Aviso enviado a la central a las " + L.hora(Date.now()).slice(0, 5) + ": «" + TEXTOS_REPORTE[tipo] + "» desde el poste " + esc(codigo) + ".</span>");
      } else {
        mensajeReporte("mal", UI.icono("triangulo") + "<span>No se pudo confirmar el envío. Llama al 130 y dicta el poste " + esc(codigo) + ".</span>");
      }
    });
  });

  leerUrl();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* sin SW: la app igual funciona en línea */ });
  }
})();
