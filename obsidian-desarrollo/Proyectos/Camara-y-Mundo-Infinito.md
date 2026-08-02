# Camara y Mundo Infinito

## Estado

Implementado en la arquitectura actual.

La nota vieja lo marcaba como pendiente. El codigo actual ya tiene contenedor de mundo, camara que sigue al jugador y modo toroidal configurado desde `src/config.js`.

## Implementacion actual

- `Game.init()` crea `this.mundo = new PIXI.Container()`.
- Los objetos del juego viven dentro de `this.mundo`.
- HUD, Top 5, Game Over y overlays viven en `stage`, fuera del mundo.
- `_actualizarCamara(delta)` desplaza el mundo para seguir a la nave.
- `_puntoSpawnFueraDeVista(margen)` genera puntos alrededor de la vista actual de camara.
- `_actualizarToroide()` envuelve posiciones para evitar bordes duros.
- `CONFIG.MUNDO.TOROIDAL = true` activa el comportamiento toroidal.

## Flujo

```text
Jugador se mueve en coordenadas de mundo
-> Game._actualizarCamara()
-> this.mundo.x / this.mundo.y se ajustan
-> HUD queda quieto porque esta fuera de this.mundo
-> _actualizarToroide() envuelve objetos cerca de bordes
```

## Ventajas

- La nave no queda limitada a una pantalla fija.
- Los enemigos aparecen cerca de lo que ve el jugador.
- El HUD se mantiene estable y legible.
- El mundo puede crecer o comportarse como espacio continuo.

## Pendientes posibles

- Revisar comentarios antiguos que hablan de "pantalla" cuando deberian decir "mundo" o "vista".
- Documentar con mas detalle los offsets de camara/look-ahead si se siguen ajustando.
- Verificar todos los efectos visuales nuevos contra coordenadas de mundo antes de agregarlos.

## Notas relacionadas

- [[Arquitectura-y-Conexiones]]
- [[Game-JS]]
- [[Configuracion-y-Balance]]
