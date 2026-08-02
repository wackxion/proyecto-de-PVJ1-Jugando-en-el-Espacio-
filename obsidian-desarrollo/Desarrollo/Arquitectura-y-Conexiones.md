# Arquitectura y Conexiones

## Arquitectura general actual

```text
src/
|-- main.js
|-- config.js
|-- ui/
|   `-- UIManager.js
|-- systems/
|   |-- InputManager.js
|   |-- TouchControls.js
|   |-- SoundManager.js
|   `-- Anuncios.js
`-- game/
    |-- sistemas/
    |   |-- Game.js
    |   |-- GameBoids.js
    |   |-- GameEffects.js
    |   |-- GameEnemies.js
    |   |-- GameMejoras.js
    |   |-- GameProjectiles.js
    |   `-- GameSkills.js
    |-- entidades/
    |   |-- GameObject.js
    |   |-- Player.js
    |   |-- Enemy.js
    |   |-- EnemyShip.js
    |   |-- EnemyProjectile.js
    |   |-- Projectile.js
    |   `-- SpecialEnemy.js
    |-- mecanicas/
    |   |-- Cohete.js
    |   `-- Top5.js
    |-- efectosVisuales/
    |   |-- AsteroidExplosion.js
    |   |-- BoidParticle.js
    |   |-- BurstEffect.js
    |   |-- HitEffect.js
    |   |-- ProyectilExplosion.js
    |   |-- SuccionEffect.js
    |   `-- UltiEffect.js
    `-- ui/
        `-- PixiHUD.js
```

## Flujo de inicializacion

1. [[Main-JS]] espera `DOMContentLoaded`.
2. Crea `UIManager` y muestra menu principal.
3. Precarga Top 5 en segundo plano.
4. Al tocar JUGAR llama a `inicializarJuego()`.
5. `Game.init()` crea la app PixiJS, el contenedor `mundo`, input, touch, anuncios y sonido.
6. `Game._cargarRecursos()` carga texturas.
7. `Game._crearFondo()` crea fondo/estrellas.
8. `Game._crearJugador()` crea `Jugador`.
9. Se inicializa [[HUD-y-Mejoras]] con `PixiHUD`.
10. Arranca el ticker con `_gameLoop()`.

## Game loop actual

```text
Game._gameLoop()
|-- gestorEntrada.actualizarGamepad()
|-- alternar pausa/mejoras con P
|-- PixiHUD.actualizarDespliegue()
|-- TouchControls visible segun modo
|-- jugador.update()
|-- _actualizarCamara()
|-- actualizarHabilidadDevorador()
|-- actualizarHabilidadCohetes()
|-- actualizarHabilidadPropulsor()
|-- actualizarSistemaBoid()
|-- actualizarProyectilesJugador()
|-- actualizarProyectilesEnemigos()
|-- actualizarEnemigos()
|-- actualizarNavesEnemigasCompleto()
|-- limpiarEnemigosLejanos()
|-- actualizarUlti()
|-- actualizarEfectosImpacto()
|-- procesarColisionesProyectiles()
|-- procesarColisionesJugador()
|-- procesarColisionesEnemigos()
|-- actualizarGeneracion()
|-- _actualizarToroide()
`-- PixiHUD.actualizar()
```

## Separacion de responsabilidades

| Archivo | Rol |
|---|---|
| `src/main.js` | Menu inicial, arranque del juego y Escape/Android back |
| `src/config.js` | Balance central, controles, costos, audio |
| `src/game/sistemas/Game.js` | Orquestador principal del juego |
| [[GameProjectiles]] | Proyectiles y colisiones asociadas |
| [[GameEnemies]] | Generacion, IA y colisiones de enemigos |
| [[GameSkills]] | Cohetes, Devorador y Propulsor |
| [[GameEffects]] | ULTi y efectos de impacto/destruccion |
| [[GameBoids]] | Particulas Boid |
| [[GameMejoras]] | Inicializacion de mejoras y costos |
| `PixiHUD.js` | HUD in-game y compra de mejoras |
| `UIManager.js` | UI DOM fuera del juego |
| `InputManager.js` | Teclado, mouse, gamepad y bindings |
| `TouchControls.js` | Overlay tactil |
| `SoundManager.js` | Audio HTML5 |
| `Anuncios.js` | AdMob rewarded para revivir |

## Conexiones principales

- [[Game-JS]] importa entidades, sistemas, mecanicas, HUD, input, audio y anuncios.
- [[Player-JS]] recibe input y llama a `game.crearProyectil()` y `game.activarUlti()`.
- [[InputManager-JS]] lee `CONFIG.CONTROLES` y expone acciones (`disparar`, `avanzar`, etc.).
- [[HUD-y-Mejoras]] lee estado de `Game`, compra mejoras y actualiza iconos.
- [[Top5-JS]] guarda/lee puntuaciones desde Firebase y localStorage.
- [[Audio-y-AdMob]] se conecta desde `Game.js` y `Anuncios.js`.

## Estados importantes

- `ejecutando`: el ticker esta activo.
- `pausado`: pausa general y panel de mejoras.
- `mostrandoVentanaMejoras`: despliega columnas del HUD.
- `mostrandoTop5EnPausa`: Top 5 abierto desde partida.
- `enGameOver`: partida terminada.
- `esperandoNombreTop5`: bloquea botones mientras se ingresa nombre.

## Mundo y camara

La partida vive dentro de `this.mundo`, un `PIXI.Container`. El HUD y overlays quedan fuera, directamente en `stage`, para que no se muevan con la camara.

La nave se mueve en coordenadas de mundo. La camara desplaza `this.mundo` para seguirla y `_actualizarToroide()` permite que la nave y entidades envuelvan bordes cuando `CONFIG.MUNDO.TOROIDAL` esta activo.
