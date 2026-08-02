# Jugando en el Espacio

## Informacion del proyecto

- Nombre: Jugando en el Espacio
- Version actual del package: v1.47.3
- Curso: Programacion de Videojuegos 1 - UNAHUR
- Profesor: Facundo Saiegh
- Integrante: Braian Zapater
- URL: https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/
- Repositorio: https://github.com/wackxion/proyecto-de-PVJ1-Jugando-en-el-Espacio-

## Descripcion

Juego arcade espacial 2D top-down hecho con PixiJS. El jugador controla una nave, destruye asteroides y naves enemigas, recolecta particulas Boid y mejora sus habilidades durante la partida.

## Estado actual

El proyecto esta jugable y sigue en desarrollo activo. La arquitectura actual ya no es monolitica: `Game.js` coordina el juego y delega en modulos de sistemas, entidades, mecanicas, HUD, audio, tactil y anuncios.

Ver detalle en [[Estado-Actual-v1.47.3]].

## Caracteristicas principales

- Movimiento por apuntado: mouse, joystick o touch.
- Avance/aceleracion con inercia y sobrecalentamiento.
- Disparo principal con proyectiles.
- ULTi como pulso expansivo.
- Habilidades activas: Cohetes, Devorador y Propulsor.
- Habilidad pasiva: Tiempo Fuera.
- Sistema de escudos con estado vulnerable al llegar a 0.
- Mundo con camara, contenedor de mundo y modo toroidal.
- Asteroides normales, rezagados y especiales.
- Naves enemigas con orbita, disparo y variantes visuales.
- Particulas Boid recolectables.
- Sistema de 40 mejoras comprables con particulas.
- HUD en PixiJS con paneles laterales desplegables.
- Menu principal, tutorial, opciones, creditos y Top 5 en DOM.
- Top 5 persistente con Firebase Firestore y respaldo local.
- Audio centralizado.
- Android con Capacitor y revive por AdMob rewarded.

## Codigo fuente relacionado

- [[Main-JS]]
- [[Game-JS]]
- [[InputManager-JS]]
- [[Player-JS]]
- [[HUD-y-Mejoras]]
- [[Audio-y-AdMob]]
- [[Top5-JS]]

## Notas relacionadas

- [[Arquitectura-y-Conexiones]]
- [[Controles-y-Teclas]]
- [[Assets-del-Proyecto]]
- [[Configuracion-y-Balance]]
- [[Tareas-Planificadas-v1.3]]
- [[Tareas-Cumplidas-v1.2]]
