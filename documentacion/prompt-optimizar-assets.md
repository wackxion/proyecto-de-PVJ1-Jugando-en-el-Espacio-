# Prompt — Optimizar el peso de los assets (para el celular)

> Copiá y pegá esto a una IA (Claude Code u otra) para que ejecute la optimización.
> Es autocontenido: incluye contexto, objetivo, pasos, verificación y convenciones.

---

## Contexto del proyecto

- Juego 2D arcade top-down "Jugando en el Espacio", hecho en **PixiJS v8** SIN bundler
  (ES modules servidos con `serve .`). Empaquetado a **Android con Capacitor**.
- Se prueba en un **Motorola G04** (gama baja, Android 14) → poca RAM/GPU.
- El juego carga **~25 MB de assets**, la mayoría PNG y MP3 **muy sobredimensionados**
  → golpea el **tiempo de carga**, la **RAM** (texturas decodificadas) y la **memoria de GPU**.
- Los assets están en `assets/` (imágenes) y `assets/audio/` (sonidos). El código los
  referencia por **nombre de archivo** (ej. `assets/fondoEspacio3.png`, `PIXI.Assets.load(...)`).

## Objetivo

Bajar el peso total de assets de **~25 MB a ~3-5 MB**, SIN cambiar código ni nombres de
archivo y SIN pérdida visual/auditiva perceptible.

## Tarea 1 — Imágenes (MAYOR impacto, cero riesgo)

PNG más pesados hoy (referencia): `jugando en el espacio.png` (3,7 MB), `fondoEspacio3.png`
(2 MB), `marcos2/3/4/5mejora.png` (~1,7 MB c/u ≈ 7 MB juntos), `puntacion-recursos.png`
(1,7 MB), `cohetes.png` (1,9 MB), y varios más de 0,5–1,5 MB.

Pasos:
1. Para cada PNG, comparar su **resolución real** con el tamaño al que se muestra en pantalla.
   Redimensionar los que estén mucho más grandes de lo necesario (un ícono de HUD no necesita
   1000 px). Ojo con las hojas de animación (explosiones, `relog1-6`, `ultiicon1-5`, `escudo1-5`,
   `pboids`) — mantener consistencia de tamaño dentro de cada set.
2. Comprimir **todos** los PNG con **pngquant** (o TinyPNG) — compresión con pérdida
   imperceptible, típicamente 70-90% más chico.
3. **MANTENER exactamente los mismos nombres de archivo y ruta** (para no tocar código).
4. NO tocar los PNG que ya son chicos.

Verificar: correr el juego en el navegador (`serve .`) y confirmar que TODAS las pantallas
(menú, HUD, mejoras, Game Over, tutorial, Top 5) se ven igual, sin sprites rotos/faltantes
(revisar la consola por errores 404).

## Tarea 2 — Audio (separable)

- `assets/audio/musica_menu.mp3` pesa **4,9 MB**; `musica_juego(Cold_Horizon).mp3` 727 KB.
- Re-encodear a **~96-128 kbps**, mono si es aceptable
  (ej. `ffmpeg -i in.mp3 -b:a 96k -ac 1 out.mp3`). La de menú debería bajar a ~1 MB.
- Mantener nombres. Verificar que suenen bien y que no haya cortes.

## Tarea 3 — Antialias en móvil (separable, código)

- En `src/game/sistemas/Game.js` (~línea 238) la app PixiJS usa `antialias: true`.
  El AA cuesta fill-rate en la GPU del G04.
- Cambiar a `antialias: false` cuando el modo de control es táctil (o directamente `false`).
  Dejar `resolution: 1` como está.

## Restricciones / convenciones del proyecto (IMPORTANTE)

- **Verificar SIEMPRE en runtime** (navegador), no solo con `node --check`.
- **No romper el modelo de PC** (mouse + teclado + joystick).
- **Paleta**: solo tonos de tinta de birome (verde/azul/rojo/negro sobre papel blanco) en el
  arte in-game — al comprimir/editar imágenes, no alterar los colores.
- `www/` y `android/` están en `.gitignore` (generados). `documentacion/AppBusiness.md` y
  `documentacion/appAndroidGDD.md` también → **NUNCA commitear** esos.
- Flujo para llevar al celular: `npm run cap:sync` + Run ▶ en Android Studio.
- Al terminar: **bump de versión** (`package.json` + badge del `README.md` + changelog),
  commit + push, y `npm run cap:sync` para el build de Android. Para subir a Play: subir el
  `versionCode` en `android/app/build.gradle` (único e incremental) y generar el `.aab` firmado.

## Resultado esperado

- Peso total de assets **< 5 MB**.
- El juego se ve y suena **igual**.
- **Carga más rápido** y usa **menos RAM/GPU** en el G04.
