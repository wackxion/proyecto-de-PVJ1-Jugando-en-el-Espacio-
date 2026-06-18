# 🔊 AUDIO - Jugando en el Espacio

Estado y guía del sistema de sonido del juego.

**Última actualización:** 17/06/2026

---

## Sistema de audio

- **`src/systems/SoundManager.js`** → clase `GestorSonido` (HTML5 Audio, sin dependencias).
- Se instancia en `Game.init()` como `this.gestorSonido` y registra los sonidos en `Game._registrarSonidos()`.
- Los archivos de audio van en **`assets/audio/`**.
- Para SFX que se superponen (ej: disparos rápidos) clona el nodo de audio en cada reproducción.
- **Sonidos en bucle:** `reproducirLoop(clave)` devuelve la instancia y `detener(instancia)` la corta. Se usa para la rotura de escudos (suena mientras el jugador está sobrecalentado).
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
- **Nombres:** descriptivos. Preferentemente minúscula sin espacios (`disparo.mp3`), aunque los espacios y paréntesis también funcionan (`rotura de escudos.mp3`, el navegador los codifica en la URL).
- **Volumen:** cada sonido se registra con un volumen 0..1 (ajustable en la llamada a `cargar`).

> ⚠️ **Licencias:** como el plan es publicar con anuncios (uso comercial), usar solo audio **CC0** o libre para uso comercial. Anotá el origen de cada archivo en `assets/audio/` o un CREDITS.

---

## Checklist de sonidos

Leyenda: ✅ integrado · 🔵 archivo conseguido (falta integrar) · ⬜ falta conseguir

### 🚀 Jugador
- [x] ✅ **Disparo** (`Space`) — `disparo.mp3`
- [x] ✅ **Ulti** (`S`) — `ulti.mp3`
- [x] ✅ **Propulsor** (`R`) — `propulsor.mp3`
- [x] ✅ **Sobrecalentar (`W`)** — `sobrecalentamiento(w).mp3`
- [x] ✅ **Escudo roto** — `rotura de escudos.mp3` *(en bucle hasta regenerar o game over)*
- [ ] ⬜ **Cohetes** (`Q`) — *placeholder listo en código, falta el archivo*
- [ ] ⬜ **Devorador** (`E`) — *placeholder listo en código, falta el archivo*
- [ ] ⬜ Acelerar / motor (`W`)
- [ ] ⬜ Recibir daño
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

| Sonido | Archivo / función | Estado |
|--------|-------------------|--------|
| Disparo | `Game.crearProyectil()` | ✅ |
| Ulti | `Game.activarUlti()` | ✅ |
| Propulsor | `GameSkills.actualizarHabilidadPropulsor()` | ✅ |
| Sobrecalentar (W) | `Player.update()` (transición `sobrecalentadoAceleracion`) | ✅ |
| Escudo roto (bucle) | `Player.recibirDano()` (inicio) → corta en `Player.agregarEscudos()` y `Game.gameOver()` | ✅ |
| Cohetes | `GameSkills.actualizarHabilidadCohetes()` / `crearCohetes()` | ⬜ |
| Devorador | `GameSkills.actualizarHabilidadDevorador()` | ⬜ |
| Asteroide roto | `Enemy._romper()` / explosión en `GameProjectiles` | ⬜ |
| Disparo enemigo | `GameEnemies._crearProyectilEnemigo()` | ⬜ |
| Capturar partícula | `GameBoids._capturarParticulaBoid()` | ⬜ |
| Comprar mejora / error | `GameMejoras.comprarMejora()` | ⬜ |
| Click botón / récord | `UIManager.js` / `Game.js` (Top 5) | ⬜ |
