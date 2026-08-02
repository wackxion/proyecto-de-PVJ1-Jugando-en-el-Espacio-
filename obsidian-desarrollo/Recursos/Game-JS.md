# Game.js

## Ubicacion

`src/game/sistemas/Game.js`

## Rol

Clase principal del juego. Coordina PixiJS, mundo, camara, jugador, entidades, sistemas, HUD, sonido, Top 5, controles tactiles y anuncios.

## Responsabilidades

- Crear la app PixiJS.
- Crear `this.mundo`, contenedor donde viven los objetos de gameplay.
- Inicializar `GestorEntrada`, `ControlesTactiles`, `Anuncios` y `GestorSonido`.
- Cargar recursos visuales y fallback textures.
- Crear fondo, estrellas y jugador.
- Inicializar `PixiHUD`.
- Ejecutar el game loop.
- Delegar actualizaciones a modulos de sistemas.
- Manejar pausa, Game Over, Top 5 y revive.
- Mantener camara y mundo toroidal.

## Modulos importados

| Modulo | Uso |
|---|---|
| `GameProjectiles.js` | Crear/actualizar proyectiles y procesar colisiones |
| `GameEnemies.js` | Generar enemigos/naves y procesar colisiones |
| `GameSkills.js` | Cohetes, Devorador y Propulsor |
| `GameEffects.js` | ULTi y efectos |
| `GameBoids.js` | Particulas Boid |
| `GameMejoras.js` | Inicializar mejoras/costos |
| `PixiHUD.js` | HUD in-game |

## Variables clave

| Variable | Uso |
|---|---|
| `jugador` | Instancia de [[Player-JS]] |
| `gestorEntrada` | Instancia de [[InputManager-JS]] |
| `gestorSonido` | Audio/SFX |
| `anuncios` | AdMob rewarded |
| `mundo` | Contenedor de gameplay |
| `pixiHUD` | HUD Pixi |
| `top5` | Sistema de puntuaciones |
| `enemigos` | Asteroides |
| `enemigosNaves` | Naves enemigas |
| `enemigosSpeciales` | SpecialEnemy |
| `proyectiles` | Disparos del jugador |
| `proyectilesEnemigos` | Disparos enemigos |
| `particulasBoid` | Recursos recolectables |
| `mejoras` | 40 mejoras comprables |

## Estados

- `ejecutando`
- `pausado`
- `mostrandoVentanaMejoras`
- `mostrandoTop5EnPausa`
- `enGameOver`
- `esperandoNombreTop5`

## Funciones propias importantes

- `init(container)`
- `_cargarRecursos()`
- `_crearFondo()`
- `_crearJugador()`
- `_gameLoop(ticker)`
- `_actualizarCamara(delta)`
- `_actualizarToroide()`
- `_puntoSpawnFueraDeVista(margen)`
- `alternarMejoras()`
- `gameOver()`
- `revivir()`
- `_limpiarCercaAlRevivir(radio)`
- `_mostrarTop5()`

## Notas

- El HUD del juego no se actualiza por DOM; lo hace [[HUD-y-Mejoras]].
- La ventana vieja de mejoras esta deshabilitada; la compra vive en los paneles laterales del HUD.
- El boton Revivir se crea solo si `Anuncios.disponible()` devuelve true.
