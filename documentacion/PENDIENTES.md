# Pendientes - Jugando en el Espacio

**Última actualización:** 07/06/2026  
**Versión:** v1.7.30 (ACTUAL)

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
- Dead code comentado en 6 métodos `_crear*()` (pendiente eliminación)

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
| Eliminar dead code comentado en `_crear*()` | ⏸️ Pendiente | Baja |
| Análisis manual del flujo del código | ⏸️ Pendiente | Media |

---

**Desarrollador:** Braian Zapater  
**Curso:** Programación de Videojuegos 1 - UNAHUR  
**Profesor:** Facundo Saiegh
