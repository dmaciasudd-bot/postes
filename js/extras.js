/* Extras de la vista Vecino que funcionan sin conexión:
   - Accesibilidad: leer la orden en voz alta, vibrar al subir la alerta, texto grande, alto contraste.
   - Preparación: mochila de emergencia y plan de la casa (solo casillas; no se escribe ni se envía nada).
   - Qué significa cada luz y sonido del poste.
   Todo se guarda solo en este teléfono (localStorage). */
(function () {
  "use strict";
  var UI = window.UI, esc = UI.esc;
  var CLAVE_AJ = "vigia-ajustes-v1", CLAVE_PREP = "vigia-preparacion-v1";

  function leer(clave, defecto) { try { var v = JSON.parse(localStorage.getItem(clave)); return v && typeof v === "object" ? v : defecto; } catch (e) { return defecto; } }
  function escribir(clave, v) { try { localStorage.setItem(clave, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: funciona igual, no recuerda */ } }

  /* ---------- Ajustes ---------- */
  var aj = leer(CLAVE_AJ, {});
  var AJUSTES = [
    { k: "voz", ico: "voz", t: "Leer las alertas en voz alta", d: "Cuando cambie el nivel, el teléfono lee la orden.", defecto: false },
    { k: "vibrar", ico: "vibrar", t: "Vibrar cuando suba la alerta", d: "No todos los teléfonos lo permiten.", defecto: true },
    { k: "grande", ico: "letra", t: "Texto más grande", d: "Agranda la orden, la ruta y los botones.", defecto: false },
    { k: "contraste", ico: "contraste", t: "Alto contraste", d: "Fondo negro, texto blanco y bordes marcados.", defecto: false }
  ];
  function vale(k) { for (var i = 0; i < AJUSTES.length; i++) if (AJUSTES[i].k === k) return aj[k] === undefined ? AJUSTES[i].defecto : !!aj[k]; return false; }
  function aplicar() {
    document.body.classList.toggle("texto-grande", vale("grande"));
    document.body.classList.toggle("alto-contraste", vale("contraste"));
  }

  /* ---------- Voz y vibración ---------- */
  var hayVoz = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  function hablar(texto) {
    if (!hayVoz || !texto) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(texto);
      var voces = window.speechSynthesis.getVoices() || [], v = null;
      ["es-CL", "es-419", "es-US", "es-MX", "es"].some(function (pref) {
        for (var i = 0; i < voces.length; i++) if (voces[i].lang && voces[i].lang.replace("_", "-").indexOf(pref) === 0) { v = voces[i]; return true; }
        return false;
      });
      if (v) u.voice = v;
      u.lang = v ? v.lang : "es-CL"; u.rate = 0.95;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function callar() { try { if (hayVoz) window.speechSynthesis.cancel(); } catch (e) { /* nada */ } }
  function vibrar(patron) { try { if (navigator.vibrate) return navigator.vibrate(patron); } catch (e) { /* nada */ } return false; }

  /* La vista avisa aquí cada vez que pinta la orden. Solo reacciona cuando el nivel SUBE. */
  var ultimoPeso = null;
  function alCambiarOrden(peso, textoVoz) {
    var subio = ultimoPeso !== null && peso > ultimoPeso;
    var bajo = ultimoPeso !== null && peso < ultimoPeso && peso === 0;
    ultimoPeso = peso;
    if (subio) {
      if (vale("vibrar")) vibrar(peso >= 2 ? [400, 150, 400, 150, 400, 150, 800] : [300, 200, 300]);
      if (vale("voz")) hablar(textoVoz);
    } else if (bajo && vale("voz")) hablar(textoVoz);
  }

  function pintarAjustes() {
    var caja = document.getElementById("aj-lista");
    if (!caja) return;
    caja.innerHTML = AJUSTES.map(function (a) {
      var on = vale(a.k), sinSoporte = (a.k === "voz" && !hayVoz) || (a.k === "vibrar" && !navigator.vibrate);
      return '<button class="ajuste" type="button" role="switch" aria-checked="' + on + '" data-ajuste="' + a.k + '"' + (sinSoporte ? " disabled" : "") + ">" +
        '<span class="ajuste-ico">' + UI.icono(a.ico) + "</span><span><b>" + esc(a.t) + "</b><small>" + esc(sinSoporte ? "Este teléfono o navegador no lo permite." : a.d) + "</small></span>" +
        '<i class="interruptor" aria-hidden="true"></i></button>';
    }).join("");
  }

  /* ---------- Preparación ---------- */
  var LISTAS = [
    { id: "mochila", ico: "mochila", titulo: "Mochila de emergencia", bajada: "Déjala lista cerca de la puerta. Marca lo que ya tienes.",
      items: ["Agua y algo de comida", "Remedios y recetas", "Documentos y algo de efectivo", "Linterna y pilas", "Radio a pilas",
        "Cargador o batería para el teléfono", "Mascarillas y ropa de algodón de manga larga", "Llaves, y correa o jaula para tus mascotas"] },
    { id: "plan", ico: "refugio", titulo: "Plan de mi casa", bajada: "Conversa esto con tu familia antes de la temporada de incendios.",
      items: ["Todos conocemos el punto de encuentro", "Sabemos quién ayuda a niños, adultos mayores y a quien le cuesta caminar",
        "Tenemos un contacto fuera del sector para avisar que estamos bien", "Sabemos cortar el gas y la luz antes de salir",
        "Conocemos la ruta principal y la alternativa de nuestro poste"] }
  ];
  var LUCES = [
    { c: "v", t: "Verde fijo", d: "Normal. No pasa nada." },
    { c: "a", t: "Amarillo parpadeando y pitido", d: "Prepárate para salir." },
    { c: "r", t: "Sirena y rojo rápido", d: "El fuego está cerca de ESE poste. Aléjate de él." },
    { c: "vp", t: "Sirena y verde parpadeando", d: "Ese poste está en la ruta segura. Camina hacia él." },
    { c: "ra", t: "Rojo y amarillo fijos, tono largo", d: "Ya no salgas. Refúgiate." },
    { c: "p", t: "Las tres luces en ronda, 4 segundos", d: "Es una prueba. No es una alerta." }
  ];
  var prep = leer(CLAVE_PREP, {});

  function pintarPreparacion() {
    var caja = document.getElementById("p-preparacion");
    if (!caja) return;
    var abiertos = {};
    Array.prototype.forEach.call(caja.querySelectorAll("details[open]"), function (d) { abiertos[d.id] = 1; });
    caja.innerHTML = LISTAS.map(function (l) {
      var marcados = prep[l.id] || {}, n = l.items.filter(function (x, i) { return marcados[i]; }).length;
      return '<details class="tarjeta prep" id="prep-' + l.id + '"' + (abiertos["prep-" + l.id] ? " open" : "") + "><summary>" + UI.icono(l.ico) + "<span><b>" + esc(l.titulo) + "</b><small>" +
        (n === l.items.length ? "Todo listo" : n + " de " + l.items.length + " listos") + '</small></span><i class="prep-barra"><i style="width:' + Math.round(n / l.items.length * 100) + '%"></i></i></summary>' +
        '<p class="sub">' + esc(l.bajada) + '</p><ul class="casillas">' + l.items.map(function (t, i) {
          return '<li><label><input type="checkbox" data-lista="' + l.id + '" data-i="' + i + '"' + (marcados[i] ? " checked" : "") + "><span>" + esc(t) + "</span></label></li>";
        }).join("") + "</ul></details>";
    }).join("") +
      '<details class="tarjeta prep" id="prep-luces"' + (abiertos["prep-luces"] ? " open" : "") + "><summary>" + UI.icono("poste") + "<span><b>Qué significa cada luz del poste</b><small>Luces y sonidos, sin mirar el teléfono</small></span></summary>" +
      '<ul class="luces">' + LUCES.map(function (x) {
        return '<li><i class="luz-p l-' + x.c + '" aria-hidden="true"><i></i><i></i><i></i></i><span><b>' + esc(x.t) + "</b><small>" + esc(x.d) + "</small></span></li>";
      }).join("") + "</ul></details>";
  }

  document.addEventListener("change", function (ev) {
    var c = ev.target;
    if (!c || !c.getAttribute || !c.getAttribute("data-lista")) return;
    var id = c.getAttribute("data-lista");
    prep[id] = prep[id] || {};
    prep[id][c.getAttribute("data-i")] = !!c.checked;
    escribir(CLAVE_PREP, prep);
    pintarPreparacion();
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("[data-ajuste]") : null;
    if (!b || b.disabled) return;
    var k = b.getAttribute("data-ajuste");
    aj[k] = !vale(k);
    escribir(CLAVE_AJ, aj);
    aplicar(); pintarAjustes();
    if (k === "voz" && aj[k]) hablar("Lectura en voz alta activada.");
    if (k === "vibrar" && aj[k]) vibrar(200);
  });

  aplicar();
  window.Extras = { hablar: hablar, callar: callar, hayVoz: hayVoz, alCambiarOrden: alCambiarOrden, pintarAjustes: pintarAjustes, pintarPreparacion: pintarPreparacion, vale: vale };
})();
