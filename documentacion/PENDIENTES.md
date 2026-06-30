# Pendientes - Jugando en el Espacio

**Última actualización:** 21/06/2026  
**Versión:** v1.9.0 (ACTUAL)

---

## ✅ Completado v1.9.0 - Menú de pausa con Escape + créditos + limpieza del HUD

- **Menú de confirmación con Escape** (`main.js`, `UIManager.js`, `Game.js`): al presionar `ESC` durante la partida se pausa el juego y aparece un modal ("¿VOLVER AL MENÚ?") con el mismo estilo que las demás ventanas (caja `gameOver.jpg`, tinta azul, `Segoe Script`). Opciones: **SEGUIR JUGANDO** (reanuda) o **VOLVER AL MENÚ** (detiene la partida → menú principal). `ESC` de nuevo cierra. Solo se abre durante el juego activo (no en pausa de Mejoras ni en Game Over). JUGAR reinicia una partida limpia vía `Game.reiniciarDesdeMenu()`. Control agregado al tutorial in-game.
- **Créditos actualizados** (`UIManager.js`): Claude (Anthropic) en Asistencia IA + nuevo apartado Beta tester (TPC).
- **PixiHUD.js documentado**: JSDoc detallado en cada función y limpieza de los comentarios muertos de la migración HTML→PixiJS (sin cambios de comportamiento).

---

## ✅ Completado v1.8.0 - Sistema de audio + rediseño de Mejoras

- **Sistema de audio** (`src/systems/SoundManager.js`, clase `GestorSonido`): HTML5 Audio sin dependencias, registro en `Game._registrarSonidos()`, soporte de bucle (`reproducirLoop`/`detener`). Ver `documentacion/AUDIO.md`. SFX conectados: disparo, ulti, propulsor, sobrecalentamiento (W), rotura de escudos (en bucle hasta regenerar o game over).
- **Rediseño de la ventana de Mejoras** (`GameMejoras.js`): estados por color en tinta (comprada azul pastel + ✓ / disponible / sin partículas tenue / error rojo), iconos de categoría en vez de títulos de texto, mini-leyenda explicativa, tooltips por mejora (qué hace + costo/estado), mensaje de error debajo de la leyenda, y la ventana siempre por encima del HUD (zIndex).
- **HUD adaptable**: `PixiHUD` anclado a los bordes reales (se adapta a cualquier proporción de pantalla, no solo 3:2).
- **Arreglos de overlays/pantallas**: Game Over y Mejoras sin elementos superpuestos (bugs de doble escala), papel de Top 5/Créditos envuelve el contenido, modales opacos (el menú ya no se ve por detrás), ventana de récord sin "GAME OVER" pisándose con el input.
- **Balance**: más carga de ulti por enemigo (asteroides 5→15, nave 10→30). Fix del label de velocidad (+10%→+5%, acorde al efecto real).

---

## ✅ Completado v1.7.32 - Limpieza de código muerto del HUD DOM

Tras la migración a PixiJS, el HUD HTML quedó inalcanzable: `UIManager.crearHUD()` devuelve `{}`, así que todas las refs DOM (`marcoTiempoUX`, `iconoEscudoUX`, `contadorDevoradorUX`, etc.) eran `undefined` y el código que dependía de ellas nunca se ejecutaba. Eliminado (~1238 líneas):

- **Game.js**: `_actualizarUI()` completo + sus 10 llamadas, campos UI muertos del constructor, asignaciones `hud.xxx` en `_configurarUI`, y bloques guardados por refs `undefined`.
- **GameSkills.js**: `actualizarTiempoFuera`, `actualizarUIMarco{Cohetes,Devorador,Propulsor}`, `activarDevorador`, `activarPropulsor`, orquestador `actualizarHabilidades` + todos sus call sites (incl. la llamada del game loop).
- **UIManager.js**: bloque comentado de ~558 líneas en `crearHUD()`, más `crearHUD()` y `destruirHUD()`.
- **GameBoids.js / GameMejoras.js**: bloques `if (game.contadorDevoradorUX)` muertos.
- **css/style.css**: reglas sin uso (`#tutorial-icon`, `#ship-icon`, `#controls`, `#*-ux-frame`, keyframes `palpitar-*`).

La pasiva Tiempo Fuera (incl. regeneración de escudos) la maneja `PixiHUD._actualizarIconoTiempo()`. Verificado en navegador (serve + preview): sin errores de consola, HUD/habilidades/Tiempo Fuera/captura de partículas funcionando.

---

## ✅ Completado v1.7.x - Migración HUD HTML → PixiJS

### Resumen
Migración completa del HUD de HTML/CSS a PixiJS canvas. Todos los elementos del HUD se renderizan directamente en el canvas, eliminando la dependencia del DOM para la interfaz de juego.

### Arquitectura
- **PixiHUD.js**: Clase que renderiza todo el HUD en el canvas de PixiJS
- **UIManager.js**: Mantenido para menús, tutorial, Top 5 y créditos (elementos HTML fuera del canvas)
- **Escalado fijo**: HUD diseñado para base 1080×720, escalado con `Math.min(w/1080, h/720)`

### Elementos del HUD (PixiJS)

| Elemento | Tamaño | Posición |
|----------|--------|----------|
| Imagen UX | 1000×160 | Bottom center, anchor (0.5, 1) |
| Iconos (6) | 70×70 | Fila horizontal sobre slots de imagen UX |
| Barra W | 120×18 | Detrás de imagen UX (zIndex: -2) |
| Puntuación | Panel 90×26, font 16px | Posición ajustada |
| Contador Boids | Font 18px | Derecha del devorador |
| Panel Oleada | Font 12px | Top-left |

### Iconos (orden izq→der)
1. **Tiempo Fuera** - Animación del reloj (relog1-6) cuando sobrecalentado
2. **Cohetes (Q)** - Textura cohetes.png
3. **Escudo** - 5 sprites (escudo1-5), cambia según % de escudos
4. **ULTi** - 5 sprites (ultiicon1-5), animación cuando está listo
5. **Propulsor (R)** - Textura propulsor.png
6. **Devorador (E)** - Textura deborador.png

### Animaciones Implementadas
- **Escudo**: Cambia sprite según % (1-3), parpadeo 4-5 cuando sobrecalentado, borde rojo
- **ULTi**: Cambia sprite según carga (1-5), parpadeo 3-4-5 cuando listo, borde dorado pulsante
- **Tiempo Fuera**: Cicla relog1-6, frame 7 = relog6 rotado π, parpadeo blanco/gris
- **Todos**: Borde azul normal (0x0044CC)

### Fixes Importantes
- `removeFromStage()` → `removeFromParent()` (PixiJS v8)
- Guardar referencia `hudContainer` antes de `stage.removeChildren()` para reinicio
- `requestAnimationFrame()` para diferir inicialización (asegurar canvas con dimensiones)
- `sortableChildren = true` + `zIndex` para ordering de capas
- Dead code comentado en 6 métodos `_crear*()` de **PixiHUD.js** (✅ eliminado: ahora cada función tiene JSDoc detallado y los comentarios obsoletos de la migración HTML→PixiJS fueron limpiados — distinto del HUD DOM ya limpiado en v1.7.32)

---

## ✅ Completado v1.5.2

### Sistema de Sobrecargado (Aceleración W)

| Parámetro | Valor Anterior | Valor Nuevo |
|-----------|----------------|--------------|
| Tiempo de aceleración continua | 1 segundo | 2 segundos |
| Enfriamiento después de sobrecarga | 3 segundos | 2.5 segundos |

### IA de Naves Enemigas

- Radio de detección de asteroides aumentado de 60px a 100px

### Mejoras

- Corregido precio de mejoras: ahora muestra el siguiente disponible, no siempre el primero
- Agregado control para evitar mensajes duplicados al intentar comprar sin saldo

---

## ✅ Completado v1.5.0

### Corrección de Errores Críticos

| Problema | Solución |
|----------|----------|
| Game.js corrupto con BOM | Restaurado desde git, eliminados caracteres BOM |
| Errores "Cannot read properties of undefined" | Agregados checks defensivos en arrays vacíos en GameBoids.js, GameProjectiles.js, GameEnemies.js, GameEffects.js, GameSkills.js |

### Cambios de Gameplay

| Cambio | Descripción |
|--------|-------------|
| **Nave puede rotar acelerando** | Removido bloqueo de dirección al presionar W |
| **Fricción reducida** | Cambiada de 0.85 a 0.95 para mayor sensación inercial |
| **Mini especiales pasan proyectiles** | Los mini especiales en órbita no son golpeados por disparos del jugador |
| **Mini especiales colisionan con enemigos** | Los mini especiales en órbita dañan a las naves enemigas |
| **Reinicio completo del juego** | Al perder todas las vidas: resetea cohetes[], bonificaciones, estados de pausa y UI |

### Limpieza de Código

- Eliminados todos los console.log comentados de Game.js y Top5.js
- Eliminada función debug `_mostrarDebugMejoras` de GameMejoras.js
- Mantenido solo console.error legítimo para manejo de errores en runtime

---

## 📋 Pendientes (Por Hacer)

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Eliminar dead code comentado en `_crear*()` de PixiHUD.js | ✅ Hecho | Baja |
| Análisis manual del flujo del código | ⏸️ Pendiente | Media |

---

**Desarrollador:** Braian Zapater  
**Curso:** Programación de Videojuegos 1 - UNAHUR  
**Profesor:** Facundo Saiegh
