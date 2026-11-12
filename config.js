/* Configuración de la app pública (Vecino).
   - temaEstado:   la app SOLO se suscribe (lee el estado de los postes que publica la Central).
   - temaReportes: la app SOLO publica (avisos de vecinos hacia la Central). Nunca los lee.
   La Central (carpeta central/, que no se publica) lee este mismo archivo para usar los mismos temas.
   Si cambias un tema, vuelve a publicar esta carpeta y reinicia la Central. */
window.CONFIG = {
  broker: "wss://broker.hivemq.com:8884/mqtt",
  // Alternativas probadas, por si el anterior falla el día de la feria:
  //   "wss://broker.emqx.io:8084/mqtt"
  //   "wss://test.mosquitto.org:8081/mqtt"
  temaEstado: "enigma-postes/5da66c1467e64303ab/estado",
  temaReportes: "enigma-postes/5da66c1467e64303ab/reportes",
  // Si el último dato de la Central es más viejo que esto, el teléfono avisa.
  datoViejoSegundos: 60,
  // Tiempo mínimo entre dos reportes del mismo teléfono.
  esperaReporteSegundos: 20
};
