# Tareas Cumplidas

## Base v1.0 a v1.3

- Juego base con PixiJS.
- Nave del jugador, asteroides, proyectiles y colisiones.
- Sistema de escudos.
- Ataque especial ULTi.
- Sistema de oleadas.
- Naves enemigas con IA, orbita y disparo.
- Asteroides especiales.
- Top 5 con Firebase Firestore.
- Menu principal, tutorial, creditos y pantallas de Game Over.

## Evolucion v1.4 a v1.7

- Refactor modular de `Game.js` hacia sistemas:
  - `GameProjectiles.js`
  - `GameEnemies.js`
  - `GameSkills.js`
  - `GameEffects.js`
  - `GameBoids.js`
  - `GameMejoras.js`
- Particulas Boid.
- Habilidades Q/E/R:
  - Cohetes.
  - Devorador.
  - Propulsor.
- Pasiva Tiempo Fuera.
- HUD migrado a PixiJS.
- Limpieza de HUD DOM viejo.
- `src/config.js` como fuente central de balance.
- PixiJS local en `libs/pixi.min.js`.

## Evolucion posterior

- Sistema de 40 mejoras en paneles laterales.
- Marcos de mejora por tier.
- Iconos iluminados segun disponibilidad.
- Audio completo: SFX y musica.
- Opciones de volumen.
- Info adicional opcional con FPS.
- Controles reasignables.
- Soporte para mouse, teclado, joystick/gamepad y touch.
- Joystick tactil flotante con intensidad analogica.
- Camara siguiendo al jugador.
- Mundo toroidal.
- Menu principal con arte de portada.
- Game Over y Top 5 adaptados a mobile.
- Android con Capacitor.
- Icono y splash propios.
- Revivir mirando anuncio recompensado en Android.

## Version actual documentada

Ver [[Estado-Actual-v1.47.3]] para el estado actualizado.

## Notas relacionadas

- [[Jugando-en-el-Espacio]]
- [[Arquitectura-y-Conexiones]]
- [[HUD-y-Mejoras]]
- [[Audio-y-AdMob]]
