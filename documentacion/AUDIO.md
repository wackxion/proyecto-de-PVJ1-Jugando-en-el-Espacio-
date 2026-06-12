# 🔊 AUDIO - Jugando en el Espacio

Estado y guía del sistema de sonido del juego.

**Última actualización:** 11/06/2026

---

## Sistema de audio

- **`src/systems/SoundManager.js`** → clase `GestorSonido` (HTML5 Audio, sin dependencias).
- Se instancia en `Game.init()` como `this.gestorSonido` y registra los sonidos en `Game._registrarSonidos()`.
- Los archivos de audio van en **`assets/audio/`**.
- Para SFX que se superponen (ej: disparos rápidos) clona el nodo de audio en cada reproducción.
- **Autoplay:** el navegador desbloquea el audio con la primera interacción del usuario (el click en **JUGAR**), antes de que arranque la partida.

### Cómo agregar un sonido nuevo (2 pasos)

1. Poné el archivo en `assets/audio/` (ej: `assets/audio/ulti.mp3`).
2. En `Game._registrarSonidos()` agregá una línea para registrarlo:
   ```js
   this.gestorSonido.cargar('ulti', 'assets/audio/ulti.mp3', 0.7);
   ```
   Y en el evento correspondiente, reproducilo:
   ```js
   if (this.gestorSonido) this.gestorSonido.reproducir('ulti');
   ```

### Convención
- **Formato:** preferentemente `.mp3` u `.ogg` (compatibles con navegador). `.wav` también sirve pero pesa más.
- **Nombres:** en minúscula, sin espacios, descriptivos (`disparo.mp3`, `asteroide_roto.mp3`).
- **Volumen:** cada sonido se registra con un volumen 0..1 (ajustable en la llamada a `cargar`).

> ⚠️ **Licencias:** como el plan es publicar con anuncios (uso comercial), usar solo audio **CC0** o libre para uso comercial. Anotá el origen de cada archivo en `assets/audio/` o un CREDITS.

---

## Checklist de sonidos

Leyenda: ✅ integrado · 🔵 archivo conseguido (falta integrar) · ⬜ falta conseguir

### 🚀 Jugador
- [ ] 🔵 **Disparo** (`Space`) — *sistema conectado, esperando el archivo en `assets/audio/disparo.mp3`*
- [ ] 🔵 **Ulti** (`S`) — archivo conseguido, falta integrar
- [ ] 🔵 **Cohetes** (`Q`) — archivo conseguido, falta integrar
- [ ] 🔵 **Propulsor** (`R`) — archivo conseguido, falta integrar
- [ ] 🔵 **Devorador** (`E`) — archivo conseguido, falta integrar
- [ ] ⬜ Acelerar / motor (`W`)
- [ ] ⬜ Sobrecalentar (`W`)
- [ ] ⬜ Recibir daño
- [ ] ⬜ Escudo roto
- [ ] ⬜ Regenerar escudo (Tiempo Fuera)
- [ ] ⬜ Muerte de la nave

### ☄️ Enemigos / mundo
- [ ] ⬜ Asteroide se rompe
- [ ] ⬜ Disparo enemigo
- [ ] ⬜ Nave enemiga destruida
- [ ] ⬜ Impacto de cohete
- [ ] ⬜ Aparece asteroide especial
- [ ] ⬜ Mini asteroide destruido *(opcional)*

### 🟦 Partículas
- [ ] ⬜ Capturar partícula Boid

### 🖱️ UI / Menús
- [ ] ⬜ Click en botón
- [ ] ⬜ Comprar mejora (éxito)
- [ ] ⬜ Error de compra
- [ ] ⬜ Nueva oleada
- [ ] ⬜ Nuevo récord
- [ ] ⬜ Pausa abrir/cerrar
- [ ] ⬜ Tecla al ingresar nombre *(opcional)*

### 🎵 Música
- [ ] ⬜ Menú principal
- [ ] ⬜ Partida (gameplay)
- [ ] ⬜ Game Over
- [ ] ⬜ Tensión / asteroide especial *(opcional)*

---

## Mapa de eventos → dónde se dispara cada sonido

| Sonido | Archivo / función |
|--------|-------------------|
| Disparo | `Game.crearProyectil()` |
| Ulti | `Game.activarUlti()` |
| Cohetes | `GameSkills.actualizarHabilidadCohetes()` / `crearCohetes()` |
| Propulsor | `GameSkills.actualizarHabilidadPropulsor()` |
| Devorador | `GameSkills.actualizarHabilidadDevorador()` |
| Asteroide roto | `Enemy._romper()` / explosión en `GameProjectiles` |
| Disparo enemigo | `GameEnemies._crearProyectilEnemigo()` |
| Capturar partícula | `GameBoids._capturarParticulaBoid()` |
| Click botón / mejoras / récord | `UIManager.js` / `GameMejoras.js` / `Game.js` (Top 5) |
