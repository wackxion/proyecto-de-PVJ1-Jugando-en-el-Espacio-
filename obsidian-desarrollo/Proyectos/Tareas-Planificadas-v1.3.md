# Roadmap y Pendientes

> Esta nota reemplaza la lista vieja v1.3 como tablero actual del proyecto.

## Estado general

La base jugable esta completa. El trabajo actual parece concentrarse en pulido mobile, UI/HUD, balance, publicacion Android y limpieza de documentacion/codigo.

## Pendientes de documentacion

- [x] Limpiar caracteres corruptos en `obsidian-desarrollo`.
- [x] Actualizar rutas de arquitectura a la estructura modular actual.
- [x] Agregar notas nuevas para v1.47.3, HUD/mejoras, config y Android/AdMob.
- [ ] Revisar `README.md`: el badge visible dice v1.47.2 mientras `package.json` dice v1.47.3.
- [ ] Revisar comentarios del codigo con caracteres corruptos si se quiere dejar todo consistente.
- [ ] Actualizar `documentacion/SPEC.md` para que deje de cerrar como v1.4.6.
- [ ] Implementar [[Solicitud-Cambios-Controles-y-Caracteres]].
- [ ] Revisar e implementar recomendaciones de [[Revision-Sistema-Colisiones]].
- [ ] Revisar e implementar recomendaciones de [[Revision-Animaciones-y-Efectos]].
- [ ] Revisar e implementar recomendaciones de [[Revision-Enemigos-Naves-Asteroides-y-Boids]].

## Pendientes tecnicos sugeridos

- [ ] Confirmar si `MODO_PRUEBA = false` en `src/systems/Anuncios.js` es intencional para publicacion.
- [ ] Auditar textos visibles en UI para detectar caracteres corruptos en archivos JS.
- [ ] Revisar que el modo touch no tape elementos clave en pantallas chicas.
- [ ] Probar revive AdMob en build Android real.
- [ ] Probar Top 5 con Firebase cuando no hay conexion y cuando no hay permisos.
- [ ] Revisar balance de `CONFIG` tras las ultimas mejoras.

## Pendientes de gameplay posibles

- [ ] Ajustar dificultad de naves enemigas en oleadas altas.
- [ ] Revisar cantidad maxima de asteroides vs rendimiento mobile.
- [ ] Corregir duracion de trayectoria heredada en fragmentos de asteroide.
- [ ] Agregar vuelta al movimiento normal despues de `direccionAlterada`.
- [ ] Revisar flocking toroidal completo en particulas Boid.
- [ ] Evaluar feedback visual para mundo toroidal.
- [ ] Mejorar claridad de compra de mejoras cuando faltan particulas.
- [ ] Agregar QA manual por modo de control: mouse/teclado, joystick, touch.

## Notas relacionadas

- [[Estado-Actual-v1.47.3]]
- [[Arquitectura-y-Conexiones]]
- [[HUD-y-Mejoras]]
- [[Audio-y-AdMob]]
- [[Configuracion-y-Balance]]
