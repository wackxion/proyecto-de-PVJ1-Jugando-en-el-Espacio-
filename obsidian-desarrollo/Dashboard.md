# Dashboard - Jugando en el Espacio

> Proyecto de Programacion de Videojuegos 1 - UNAHUR

## Estado del proyecto

| Campo | Valor |
|---|---|
| Version del package | v1.47.3 |
| Estado | Jugable / en desarrollo activo |
| Motor | PixiJS v8 local en `libs/pixi.min.js` |
| Plataforma web | GitHub Pages |
| Plataforma mobile | Android con Capacitor |
| Backend | Firebase Firestore para Top 5 |

## Notas principales

- [[Jugando-en-el-Espacio]] - Resumen general del juego.
- [[Estado-Actual-v1.47.3]] - Estado actualizado de la version actual.
- [[Arquitectura-y-Conexiones]] - Mapa de modulos y flujo de ejecucion.
- [[Controles-y-Teclas]] - Controles de teclado, mouse, joystick y touch.
- [[HUD-y-Mejoras]] - HUD PixiJS, paneles laterales y sistema de mejoras.
- [[Audio-y-AdMob]] - Sonido, musica y revive con anuncio recompensado.
- [[Assets-del-Proyecto]] - Imagenes, audio y recursos usados.
- [[Configuracion-y-Balance]] - Valores centrales en `src/config.js`.
- [[GameProjectiles]] - Proyectiles y colisiones de disparos.
- [[GameEnemies]] - Spawns, enemigos y colisiones con jugador.
- [[GameSkills]] - Cohetes, Devorador y Propulsor.
- [[GameBoids]] - Particulas Boid.
- [[GameEffects]] - ULTi y efectos visuales.
- [[GameMejoras]] - Inicializacion de mejoras.
- [[TouchControls-JS]] - Overlay tactil para celular.
- [[SoundManager-JS]] - Gestor de audio.
- [[Anuncios-JS]] - Wrapper de AdMob rewarded.
- [[Revision-Sistema-Colisiones]] - Auditoria de colisiones y riesgos.
- [[Revision-Animaciones-y-Efectos]] - Auditoria de animaciones y respuesta visual.
- [[Revision-Enemigos-Naves-Asteroides-y-Boids]] - Movimiento e IA de enemigos y particulas.
- [[Tareas-Planificadas-v1.3]] - Roadmap actual y pendientes.
- [[Tareas-Cumplidas-v1.2]] - Historial de avances importantes.
- [[Solicitud-Cambios-Controles-y-Caracteres]] - Pedido de mejora para controles y limpieza de caracteres.

## Estructura del vault

```text
obsidian-desarrollo/
|-- Dashboard.md
|-- Proyectos/
|   |-- Jugando-en-el-Espacio.md
|   |-- Estado-Actual-v1.47.3.md
|   |-- Camara-y-Mundo-Infinito.md
|   |-- Solicitud-Cambios-Controles-y-Caracteres.md
|   |-- Revision-Sistema-Colisiones.md
|   |-- Revision-Animaciones-y-Efectos.md
|   |-- Revision-Enemigos-Naves-Asteroides-y-Boids.md
|   |-- Tareas-Planificadas-v1.3.md
|   `-- Tareas-Cumplidas-v1.2.md
|-- Desarrollo/
|   `-- Arquitectura-y-Conexiones.md
`-- Recursos/
    |-- Assets-del-Proyecto.md
    |-- Controles-y-Teclas.md
    |-- Configuracion-y-Balance.md
    |-- HUD-y-Mejoras.md
    |-- Audio-y-AdMob.md
    |-- Game-JS.md
    |-- GameProjectiles.md
    |-- GameEnemies.md
    |-- GameSkills.md
    |-- GameBoids.md
    |-- GameEffects.md
    |-- GameMejoras.md
    |-- TouchControls-JS.md
    |-- SoundManager-JS.md
    |-- Anuncios-JS.md
    |-- Player-JS.md
    |-- Enemy-JS.md
    |-- EnemyShip-JS.md
    |-- EnemyProjectile-JS.md
    |-- Projectile-JS.md
    |-- SpecialEnemy-JS.md
    |-- Top5-JS.md
    |-- InputManager-JS.md
    `-- Main-JS.md
```

## Links utiles

- GitHub: https://github.com/wackxion/proyecto-de-PVJ1-Jugando-en-el-Espacio-
- Juego: https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/
- PixiJS: https://pixijs.com/8.x/guides/components

## Lectura recomendada

1. Empezar por [[Estado-Actual-v1.47.3]].
2. Seguir con [[Arquitectura-y-Conexiones]].
3. Para tocar gameplay, revisar [[Configuracion-y-Balance]] antes del codigo.
4. Para UI o mobile, revisar [[HUD-y-Mejoras]], [[Controles-y-Teclas]] y [[Audio-y-AdMob]].
