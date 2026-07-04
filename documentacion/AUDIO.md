# 🔊 AUDIO - Jugando en el Espacio

Estado y guía del sistema de sonido del juego.

**Última actualización:** 04/07/2026

---

## Sistema de audio

- **`src/systems/SoundManager.js`** → clase `GestorSonido` (HTML5 Audio, sin dependencias).
- Hay **dos** instancias de `GestorSonido`:
  - **`Game.gestorSonido`** → todo el audio in-game (SFX + música de la partida). Se crea en `Game.init()` y registra los sonidos en `Game._registrarSonidos()`.
  - **`UIManager.gestorSonido`** → click de los botones y **música del menú inicial**. El `UIManager` existe antes de que se cree el juego, por eso tiene el suyo (si no, el menú de arranque no podría tener música).
- Los archivos de audio van en **`assets/audio/`**.
- Para SFX que se superponen (ej: disparos rápidos) clona el nodo de audio en cada reproducción.
- **Sonidos en bucle:** `reproducirLoop(clave)` devuelve la instancia y `detener(instancia)` la corta. Se usa para la rotura de escudos y para la música de fondo.
- **Autoplay:** el navegador desbloquea el audio con la **primera interacción** del usuario. Por eso la música del menú inicial arranca en el primer click/gesto (no apenas carga la página), y la de la partida arranca con el click en JUGAR.

### Volúmenes centralizados (config.js)

Todos los volúmenes están en **`src/config.js` → `CONFIG.AUDIO.VOLUMENES`** (0..1). Es el único lugar para ajustarlos: los leen `Game._registrarSonidos()` y `UIManager`. Para cambiar un volumen, editás el número, guardás y recargás (Ctrl+F5).

### Cómo agregar un sonido nuevo (3 pasos)

1. Poné el archivo en `assets/audio/` (ej: `assets/audio/gameover.mp3`).
2. Agregá su volumen en `CONFIG.AUDIO.VOLUMENES` (`src/config.js`).
3. En `Game._registrarSonidos()` registralo y en el evento correspondiente reproducilo:
   ```js
   this.gestorSonido.cargar('gameover', 'assets/audio/gameover.mp3', V.gameover);
   // en el evento:
   if (this.gestorSonido) this.gestorSonido.reproducir('gameover');
   ```

### Convención
- **Formato:** preferentemente `.mp3` u `.ogg`. `.wav` también sirve pero pesa más.
- **Nombres:** descriptivos, preferentemente minúscula sin espacios (`disparo.mp3`). Los espacios y paréntesis también funcionan (`recibir impacto.mp3`, `musica_juego(Cold_Horizon).mp3`): el navegador los codifica en la URL.

> ⚠️ **Licencias:** como el plan es publicar con anuncios (uso comercial), usar solo audio **CC0** o libre para uso comercial. Anotá el origen de cada archivo.

---

## Checklist de sonidos

Leyenda: ✅ integrado · ⬜ falta conseguir

### 🚀 Jugador
- [x] ✅ **Disparo** (`Space`) — `disparo.mp3`
- [x] ✅ **Ulti** (`S`) — `ulti.mp3`
- [x] ✅ **Propulsor** (`R`) — `propulsor.mp3`
- [x] ✅ **Sobrecalentar (`W`)** — `sobrecalentamiento(w).mp3`
- [x] ✅ **Escudo roto** — `rotura de escudos.mp3` *(en bucle hasta regenerar o game over)*
- [x] ✅ **Cohetes** (`Q`) — `cohetes.mp3`
- [x] ✅ **Devorador** (`E`) — `deborador.mp3`
- [x] ✅ **Recibir daño** — `recibir impacto.mp3`
- [ ] ⬜ **Muerte de la nave / Game Over**

### ☄️ Enemigos / mundo
- [x] ✅ **Asteroide se rompe** — `destruccion_meteorito.mp3`
- [x] ✅ **Nave enemiga destruida** — `destruccion_nave.mp3`
- [ ] ⬜ Disparo enemigo *(opcional)*
- [ ] ⬜ Aparece asteroide especial *(opcional)*

### 🟦 Partículas
- [x] ✅ **Capturar partícula Boid** — `particula_boid.mp3` *(con throttle ~90ms para que no se amontone)*

### 🖱️ UI / Menús
- [x] ✅ **Click en botón** — `click.mp3`
- [ ] ⬜ Comprar mejora *(opcional)*
- [ ] ⬜ Nueva oleada / nuevo récord *(opcional)*

### 🎵 Música
- [x] ✅ **Menú principal** — `musica_menu.mp3` *(UIManager, arranca en el primer gesto)*
- [x] ✅ **Partida (gameplay)** — `musica_juego(Cold_Horizon).mp3`
- [ ] ⬜ **Game Over** *(opcional)*

---

## Mapa de eventos → dónde se dispara cada sonido

| Sonido | Función / lugar | Estado |
|--------|-----------------|--------|
| Disparo | `Game.crearProyectil()` | ✅ |
| Ulti | `Game.activarUlti()` | ✅ |
| Propulsor | `GameSkills.actualizarHabilidadPropulsor()` | ✅ |
| Cohetes | `GameSkills.crearCohetes()` | ✅ |
| Devorador | `GameSkills.actualizarHabilidadDevorador()` | ✅ |
| Sobrecalentar (W) | `Player.update()` (transición) | ✅ |
| Escudo roto (bucle) | `Player.recibirDano()` → corta en regeneración / game over | ✅ |
| Recibir daño | `Player.recibirDano()` | ✅ |
| Asteroide roto | `Enemy._romper()` | ✅ |
| Nave enemiga destruida | `EnemyShip.recibirDano()` (muerte) | ✅ |
| Capturar partícula (throttle) | `Game._capturarParticulaBoid()` / `GameBoids` → `Game._sonidoCapturaBoid()` | ✅ |
| Click botón | `UIManager` (botones de menú/modales) | ✅ |
| Música partida | `Game._iniciarMusicaJuego()` (init / reinicio) | ✅ |
| Música menú (inicial) | `UIManager.iniciarMusicaMenu()` (primer gesto, desde `main.js`) | ✅ |
| Música menú (al volver con Escape) | `Game._iniciarMusicaMenu()` (`detenerParaMenu`) | ✅ |
| Game Over | — | ⬜ falta archivo |
