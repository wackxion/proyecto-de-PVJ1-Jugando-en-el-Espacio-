# Main.js

## Ubicacion

`src/main.js`

## Rol

Punto de entrada del juego. No crea el juego inmediatamente: primero muestra el menu principal con `UIManager` y crea `Game` al tocar JUGAR.

## Flujo

```text
DOMContentLoaded
|-- verificar PIXI
|-- preloadTop5()
|-- new UIManager(...)
|-- mostrarMenuPrincipal()
|-- primer pointerdown -> iniciar musica del menu
`-- JUGAR -> inicializarJuego()
```

## Responsabilidades

- Verificar que PixiJS este disponible.
- Precargar Top 5 en segundo plano.
- Crear `UIManager` con callbacks.
- Manejar JUGAR, TUTORIAL, TOP 5 y CREDITOS.
- Inicializar `Game` bajo demanda.
- Exponer `window.game` para debug.
- Manejar ESC para confirmar volver al menu.
- Manejar boton atras de Android via Capacitor.

## Conexiones

- Importa [[Game-JS]].
- Importa `UIManager.js`.
- Importa [[Top5-JS]].
- Usa Capacitor App si existe en Android.

## Notas

- Si el jugador vuelve al menu con ESC, JUGAR reinicia la partida usando `game.reiniciarDesdeMenu()`.
- El Top 5 del menu usa datos precargados cuando estan disponibles.
