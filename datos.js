/* DATOS DEL SECTOR (editar aquí).
   Todo es un EJEMPLO para la demostración: no son rutas oficiales ni
   geografía real. El mapa es un dibujo de 360 x 460 unidades:
   x crece hacia la derecha, y crece hacia abajo.

   Para cada poste:
     nodo    = número que usa la placa (1, 2, 3...)
     codigo  = lo que está impreso en el poste y en el QR
     pasivo  = true si el poste solo tiene QR (sin electrónica)
     rutaPrincipal / rutaAlternativa:
       puntos   = por dónde pasa la línea de la ruta en el mapa
       pasaPor  = nodos de OTROS postes por los que pasa la ruta
                  (si el fuego está en uno de ellos, la ruta se considera cortada)
       nombre   = nombre corto de la ruta ("camino bajo")
       distancia, tiempo, pasos = textos que ve el vecino
*/
window.DATOS = {
  sector: { nombre: "Sector de ejemplo", ancho: 360, alto: 460 },

  puntoEncuentro: { nombre: "Cancha del sector", x: 292, y: 404 },

  /* Orden de los postes a lo largo del camino principal, desde el más lejano
     hasta el más cercano al punto de encuentro. Sirve para leer hacia dónde avanza el fuego. */
  linea: [3, 2, 1],

  postes: [
    {
      nodo: 1, codigo: "P-1451", x: 222, y: 292, pasivo: false,
      rutaPrincipal: {
        nombre: "camino principal",
        puntos: [[222, 292], [292, 404]],
        pasaPor: [],
        distancia: "300 m", tiempo: "4 min a pie",
        pasos: [
          "Dale la espalda al bosque y toma el camino principal hacia abajo.",
          "Camina unos 300 metros sin desviarte.",
          "Llega a la cancha del sector (punto de encuentro) y espera instrucciones."
        ]
      },
      rutaAlternativa: null
    },
    {
      nodo: 2, codigo: "P-1452", x: 152, y: 196, pasivo: false,
      rutaPrincipal: {
        nombre: "camino principal",
        puntos: [[152, 196], [222, 292], [292, 404]],
        pasaPor: [1],
        distancia: "600 m", tiempo: "8 min a pie",
        pasos: [
          "Toma el camino principal hacia abajo, en dirección al poste P-1451.",
          "Pasa el poste P-1451 sin detenerte (el bosque queda a tu izquierda).",
          "Sigue 300 metros más hasta la cancha del sector (punto de encuentro)."
        ]
      },
      rutaAlternativa: {
        nombre: "camino bajo",
        puntos: [[152, 196], [100, 206], [47, 205], [44, 290], [90, 380], [180, 424], [292, 404]],
        pasaPor: [],
        distancia: "1,1 km", tiempo: "15 min a pie",
        pasos: [
          "NO bajes por el camino principal: el fuego está en esa dirección.",
          "Toma el pasaje hacia el lado contrario al bosque hasta el camino bajo.",
          "En el camino bajo dobla a la izquierda y síguelo hasta el final.",
          "Llega a la cancha del sector (punto de encuentro) por el lado de abajo."
        ]
      }
    },
    {
      nodo: 3, codigo: "P-1453", x: 88, y: 100, pasivo: true,
      rutaPrincipal: {
        nombre: "camino principal",
        puntos: [[88, 100], [152, 196], [222, 292], [292, 404]],
        pasaPor: [2, 1],
        distancia: "900 m", tiempo: "12 min a pie",
        pasos: [
          "Toma el camino principal hacia abajo, en dirección al poste P-1452.",
          "Pasa los postes P-1452 y P-1451 sin detenerte.",
          "Sigue hasta la cancha del sector (punto de encuentro)."
        ]
      },
      rutaAlternativa: {
        nombre: "camino bajo",
        puntos: [[88, 100], [48, 180], [44, 290], [90, 380], [180, 424], [292, 404]],
        pasaPor: [],
        distancia: "1,2 km", tiempo: "17 min a pie",
        pasos: [
          "NO bajes por el camino principal: el fuego está en esa dirección.",
          "Toma el camino bajo, que sale desde este poste alejándose del bosque.",
          "Sigue el camino bajo hasta el final, sin entrar a los pasajes.",
          "Llega a la cancha del sector (punto de encuentro) por el lado de abajo."
        ]
      }
    }
  ],

  /* Dibujo del mapa */
  caminos: [
    { nombre: "Camino principal", etiqueta: [130, 141, 56], ancho: 13,
      puntos: [[52, 46], [88, 100], [152, 196], [222, 292], [292, 404], [330, 452]] },
    { nombre: "Camino bajo", etiqueta: [30, 262, -88], ancho: 9,
      puntos: [[88, 100], [48, 180], [44, 290], [90, 380], [180, 424], [292, 404]] },
    { nombre: "", ancho: 7,
      puntos: [[152, 196], [100, 206], [47, 205]] }
  ],
  casas: [[30, 132], [120, 78], [152, 118], [210, 176], [84, 244], [84, 300], [16, 238], [180, 322], [140, 392], [236, 376]],
  bosques: [
    { cx: 300, cy: 150, rx: 78, ry: 92 },
    { cx: 318, cy: 268, rx: 54, ry: 60 },
    { cx: 232, cy: 60, rx: 70, ry: 50 }
  ],
  etiquetaBosque: [296, 170]
};
