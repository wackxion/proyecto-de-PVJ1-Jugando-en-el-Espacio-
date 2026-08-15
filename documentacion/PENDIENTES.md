# Pendientes - Jugando en el Espacio

**Última actualización:** 10/08/2026<br>
**Versión:** v1.51.6 (ACTUAL)

---

## 🎯 OBJETIVO EN CURSO: llevar el juego a CELULAR (sin romper la versión de compu)

> **Doble requisito, aplica a TODO cambio mobile de acá en adelante:**
> 1. Que el juego **funcione y se vea bien en celular** (táctil, apaisado).
> 2. Que **se mantenga el modelo de PC** (mouse + teclado + joystick) intacto — cada ajuste mobile debe verificarse también en desktop para no romperlo.
>
> **Dispositivo de referencia del dev:** **Motorola G04** (Android). El dev pasará los detalles/specs completos más adelante para afinar targets de dedo, resolución y rendimiento sobre ese equipo real. Hasta tener esos datos, se prueba con tamaños de celular apaisado genéricos en DevTools (ej. ~780×360).
>
> **Estado del roadmap mobile** (ver `AppBusiness.md`): paso 1 (layout/orientación web) prácticamente cerrado; paso 2 (táctil) hecho y en pulido; falta paso 3 (**Capacitor** → Android/AAB) que ya requiere el entorno del dev.

---

## 📋 Pendiente / Backlog (para más adelante)

> **Estado mobile (05/08/2026):** la app está en **prueba cerrada "Alpha"** de Google Play. ✅ Ícono/splash propios · ✅ AdMob (revive con anuncio) · ✅ política de privacidad. Corre en el **Motorola G04** (Capacitor, landscape, controles táctiles maduros). **🎯 HITO (03/08/2026):** el dev ya consiguió los **12+ testers** y **arrancaron los 14 días** de verificación de prueba activa (termina aprox. el **17/08/2026**). El próximo `.aab` queda preparado como **versionCode 19 / versionName 1.50.7**, con `www` y Android sincronizados. **Falta para producción:** completar esos 14 días manteniendo ≥12 testers y la pista activa (subir updates NO reinicia el contador). Detalle en `documentacion/appAndroidGDD.md` (local) y en la memoria de setup Android.

- **✅ IA / MOVIMIENTO de las naves enemigas — HECHO (v1.51.0)**: se resolvió el problema principal (casi no disparaban: apuntaban de costado y perdían el tiro). Ahora encaran al jugador cuando les toca disparar y no pierden el tiro; hacen pasadas agresivas (dive) cada tanto; y se arregló la inercia frame-dependiente. Si al probar en el G04 se sienten **demasiado activas** (disparan mucho), la palanca directa es subir `CONFIG.NAVE_ENEMIGA.INTERVALO_DISPARO` (hoy 3s). Otras ideas futuras si se quiere más profundidad: que huyan/cambien cuando tienen poca vida, o que varíen el sentido de la órbita entre naves.

- **Lógica de naves enemigas — revisión de COHERENCIA COMPLETA** (#1 en v1.50.3; #2,#3,#4 en v1.50.6). Solo quedan observaciones de diseño (no bugs, no requieren acción salvo que se quieran cambiar): las naves no escalan velocidad con la oleada (fijas 225, suben en cantidad); y si al disparar no están apuntando al jugador (±30°) pierden ese tiro y esperan el próximo ciclo.

- **HUD — rediseño visual (opcional, para más adelante)**: el reacomodo táctil ya se hizo (v1.43.0–v1.45.0). Si se quiere un rediseño visual más profundo (colores, marcos, tipografía del HUD de mejoras y del HUD común), queda anotado. HUD in-game 100% PixiJS (`PixiHUD.js`), base 1080×720, celular usa `CONFIG.HUD.BOOST_TACTIL` (1.25). Mantener el modelo de PC intacto.

- **Rendimiento del HUD PixiJS (pendiente, prioridad MEDIA)**: evitar recrear funciones, textos y geometría en cada frame cuando los valores no cambiaron. Cachear `infoAdicional`, actualizar los diagnósticos a menor frecuencia y redibujar barras, precios, niveles e iconos solamente cuando cambie su estado. Mantener por separado las animaciones que sí necesitan avanzar cada frame.

- **Pool de canales para efectos de sonido (pendiente, prioridad MEDIA)**: `SoundManager` clona actualmente un `HTMLAudioElement` en cada reproducción. Evaluar un pool fijo de 4–8 canales por efecto frecuente (especialmente disparo, impacto y destrucción), o Web Audio con buffers decodificados, para reducir asignaciones y pausas de memoria en Android.

- **Joystick — Opción B (twin-stick, alternativa al modelo actual)**: stick izq **mueve** la nave / stick der **apunta y dispara**. Se siente muy bien con mando, pero **cambia el modelo de movimiento** (la nave se movería hacia el stick izq, no hacia donde apunta) → más trabajo e inconsistente con teclado/mouse. La Opción A ya está hecha (v1.38.0); esto es solo si se quiere el feel puro twin-stick.
- **Pausa con el joystick**: hoy la pausa quedó fuera del mapeo del mando porque es un *toggle* y al mantener el botón se dispararía en cada frame. Se puede sumar con **detección de flanco** (solo al presionar, no al mantener).

- **Destrucciones "sin animación" fuera de vista + costura del toroide (Opción A en v1.48.9; ✅ CAUSA RAÍZ ARREGLADA en v1.51.6)**. **Resuelto (v1.51.6):** el problema era que las explosiones NO se remapeaban por el toroide (`Game._actualizarToroide` no incluía `efectosImpacto`/`efectosExplosion`), así que un enemigo que moría cerca de la costura se veía cerca (por el wrap) pero su explosión se creaba en la coord lógica lejana → off-screen. Ahora los efectos también se remapean (`.imagen` y `.sprite`). La Opción B (ghost render completo) ya no hace falta para esto. Contexto histórico del síntoma: asteroides/naves que "se destruyen sin la animación de explosión", sobre todo **disparando cerca del borde**. Diagnóstico (verificado en runtime): **NO es que falte crear la animación** — se probó ULTI con 25 asteroides pegados → 26 destruidos = 26 explosiones creadas, y las explosiones tienen `cullable=false` (siempre se renderizan). Lo que pasa: la explosión se dibuja **donde estaba el enemigo**; si el enemigo muere **fuera de la vista** (proyectil que sale de cuadro, asteroides que chocan entre sí off-screen, o al otro lado de la **costura del toroide** que no tiene render "fantasma"), la explosión también ocurre off-screen y no se ve. El zoom 0.70 (aplicado en v1.48.0) no lo causó, solo lo hizo más notorio (se ve más área). 
  - ✅ **Opción A — HECHA (v1.48.9):** el mundo se agrandó de **3× a 5×** la pantalla (`Game.js`). Aleja la costura y los enemigos mueren más adentro de la vista → se ven sus explosiones. Verificado: FPS estable (no agrega carga). Si aún se ve algún caso raro cerca del borde, se puede subir a 6× o encarar la Opción B.
  - **Opción B (mejora futura, más trabajo):** renderizado "fantasma" en la costura — dibujar copias de las entidades cerca de los bordes del mundo para que la costura sea invisible y todo (incluidas explosiones) se vea donde corresponde. Es lo "correcto" para un toroide pero toca el render de cada entidad.
  - Nota extra: el **radio de la ULTI** ya se ajustó al zoom (`/CONFIG.CAMARA.ZOOM`) en v1.48.2. **Falta** afinar el **límite de culling** de `actualizarEnemigos` (`hypot(anchoJuego,altoJuego)*1.4`), que todavía no contempla el zoom. El cálculo duplicado de limpieza se eliminó en v1.49.0 y hoy el límite queda por encima de la vista visible, así que es una mejora menor.

- **AdMob `app-ads.txt` (NO URGENTE — anotado el 03/08/2026)**.
  - **Qué es y para qué:** archivo de texto estándar (IAB) que declara **qué redes de anuncios están autorizadas a vender el inventario publicitario de la app**. Es **anti-fraude**: evita que un tercero se haga pasar por la app y "revenda" tu inventario. Protege los **ingresos por anuncios** cuando la app tiene tráfico real.
  - **Por qué NO es urgente:** NO es obligatorio — los anuncios (rewarded de revivir) funcionan igual sin esto. AdMob mismo avisa que con pocas solicitudes de anuncios (como en prueba cerrada) el estado ni aparece. Conviene recién cuando la app esté publicada de verdad y genere ingresos.
  - **Contenido del archivo** (una sola línea; el publisher ID sale de `ca-app-pub-8065871181264852`):
    `google.com, pub-8065871181264852, DIRECT, f08c47fec0942fa0`
    (`f08c47fec0942fa0` = ID de certificación de Google, fijo).
  - **Proceso para configurarlo:**
    1. AdMob busca el archivo en la **RAÍZ del dominio** del "sitio web de desarrollador" declarado en la ficha de Play. El del proyecto es GitHub Pages: el juego vive en `wackxion.github.io/proyecto-de-PVJ1-.../`, pero AdMob lo buscaría en `wackxion.github.io/app-ads.txt` (raíz, NO la subcarpeta del repo).
    2. Como es un "project site", para hostear en la raíz hay que crear un repo especial llamado **`wackxion.github.io`** (user/organization Pages) y poner ahí el `app-ads.txt`. Alternativa: usar un dominio propio.
    3. Verificar en Play Console que el campo "Sitio web" de la ficha apunte a ese dominio.
    4. En AdMob → app-ads.txt → "Configurar" → esperar a que AdMob rastree y valide (puede tardar días).
  - Confirmar el `pub-ID` real antes de subirlo. Ver también `documentacion/appAndroidGDD.md` (local) para IDs de AdMob.

- **Optimización de carga / memoria en el celu (anotado el 03/08/2026)**. El juego carga **~25 MB** de assets, la mayoría **muy sobredimensionados** — golpea tiempo de carga, RAM y memoria de GPU en el G04. (Aclaración: agrandar el mundo toroidal NO agrega carga — las entidades están capadas independientemente del tamaño del mundo.)
  1. ✅ **HECHO (v1.48.4) — Comprimir/redimensionar imágenes**: las 75 PNG se comprimieron con `sharp` (cuantización de paleta + dithering; redimensionadas las 12 que superaban 1280 px). Resultado: **25 MB → 4,9 MB (−80%)**, sin pérdida visual (verificado en runtime), mismos nombres. Si se agregan imágenes nuevas, volver a correr una compresión equivalente antes de publicar.
  2. ✅ **HECHO (v1.48.7) — Re-encodear audio**: `musica_menu.mp3` estaba a 256 kbps (2:36) → re-encodeada a **96 kbps estéreo** con ffmpeg (`ffmpeg-static`, instalado `--no-save`): 4,9 MB → **1,8 MB** (−62%). `musica_juego` 728 → 364 KB. Verificado: cargan y reproducen bien. Total `assets/`: ~31 MB → **8 MB**. Si el dev quiere aún más liviano, se puede bajar a 64 kbps o mono (probar calidad).
  3. ✅ **HECHO (v1.48.6) — `antialias: false` en celular**: en `Game.init` el AA ahora es `!modoTouch` → ON en PC (bordes de vectores suaves), OFF en touch (ahorra fill-rate en la GPU del G04). Casi todo el arte son sprites, así que el impacto visual en móvil es mínimo.
  4. **Texture atlas / spritesheet (esfuerzo ALTO, evaluar después de #1)**: juntar los ~40 sprites individuales en un atlas para reducir "draw calls" (cambiar de textura es caro en GPU móvil). Requiere empaquetar (TexturePacker o script), generar el JSON, y **cambiar toda la carga en `Game._cargarRecursos`** + verificar que cada sprite renderice (varios son animaciones: explosiones, relog, ultiicon, escudo, pboids). Riesgo medio-alto (si se rompe un frame, el sprite desaparece). **Nota:** con `resolution: 1` y ~340 sprites, el G04 probablemente está más limitado por fill-rate/RAM (imágenes pesadas) que por draw calls → el atlas rinde MENOS que comprimir imágenes (#1). Hacerlo solo si después de #1/#2/#3 sigue haciendo falta.
  5. **Object pooling (esfuerzo MEDIO-ALTO, riesgo MEDIO — evaluar si hace falta)**: reusar objetos de mucho churn en vez de crear/destruir para reducir pausas de GC (stutter). Estado: la infra está a MEDIAS — `Projectile` y `BoidParticle` tienen `destroyAndRelease(pool)` pero **no se usa** (llaman a `destroy()` pelado, sin pool manager). Lo pendiente: (a) crear los pool managers; (b) agregar un `reset(...)` a `Projectile` para reusar el sprite (hoy el constructor hace `new PIXI.Sprite` cada vez) y que `destroy()` no destruya el sprite; (c) cablear los ~8 sitios de creación/destrucción de proyectiles; (d) para efectos es más grande: `HitEffect`/`AsteroidExplosion`/`ProyectilExplosion` se crean en **~34 lugares** (GameEnemies 12, GameProjectiles 10, UltiEffect 7, GameEffects 3, GameSkills 1, Player 1). Riesgo típico: objeto reusado con estado viejo → glitches (balas/explosiones fantasma). **Beneficio modesto** (churn de ~5 proyectiles/seg + efectos) y el juego ya no anda trabado → hacerlo solo si tras #1/#2/#3 todavía hay stutter perceptible en el G04.

---

## ✅ Completado v1.50.0 - Aceleración constante (sin sobrecalentamiento)

- **Se eliminó el sobrecalentamiento de la aceleración (tecla W).** Antes, mantener W llenaba una barra (`cargaAceleracion`) y al toparse la nave dejaba de acelerar y frenaba por 2.5s. Ahora la aceleración es **constante**: se mantiene W y la nave sube hasta `velocidadMax` y se queda ahí, sin penalización; al soltar frena por inercia (`Player.js`).
- **La mejora de Aceleración ahora sube el TOPE de velocidad** en vez de agrandar la barra: **+40 px/s por nivel** (`CONFIG.JUGADOR.VELOCIDAD_MAX_POR_MEJORA`), de 300 a **500** con los 5 niveles (`Game.aplicarMejoras`).
- **HUD reutilizado:** el arco curvo alrededor de la nave y la barra rectangular (que marcaban el recalentamiento en rojo) ahora muestran la **velocidad actual** como fracción del tope, siempre azul (`PixiHUD.js`).
- **Limpieza de código muerto:** se eliminaron los campos `cargaAceleracion`, `sobrecalentadoAceleracion`, `cargaMax`, `velocidadCarga`, `temporizadorEnfriamientoAcel`/`duracionEnfriamientoAcel`, el bloque `CONFIG.ACELERACION`, la variable `estabaAvanzando` y la carga del sonido `sobrecalentamientoW` (ya no se reproduce). Neto: −35 líneas.
- **Verificado en runtime:** manteniendo W la velocidad llega a 300 y se queda (antes caía a 0); al soltar frena; la mejora lleva el tope 300→340→420→500; el arco sigue la velocidad en azul; sin errores de consola. Android: `versionCode 12` / `1.50.0`.

## ✅ Completado v1.49.3 - Fix: el "Volver" del Top 5 no queda flotando al revivir

- Si en el Game Over se abría el **TOP 5** y desde ahí se tocaba **Revivir (ver anuncio)**, tras el anuncio el botón **Volver** del Top 5 quedaba flotando sobre la partida. Causa: `_limpiarFinJuego()` removía `btn-reiniciar/top5/revivir` por ID pero NO el `btn-volver`, y descartaba `botonesHTML` sin recorrerlo. Ahora la limpieza remueve `btn-volver` por ID **y** recorre `botonesHTML` sacando del DOM cualquier botón guardado (`Game.js`). Verificado en runtime reproduciendo Game Over → Top 5 → limpieza. Android: `versionCode 11` / `1.49.3`.

## ✅ Completado v1.49.2 - Auto-apuntado más sutil (touch/joystick)

- La asistencia de apuntado se sentía "pegajosa" y a veces enganchaba al enemigo equivocado. Se afinó a un punto intermedio: `CONFIG.AUTOAPUNTADO` **CONO_GRADOS 20°→12°** (solo asiste si ya estás bien alineado) y **FUERZA 0.6→0.3** (corrige la mitad de suave). El mouse sigue 100% preciso. Probado en el G04. Android: `versionCode 10` / `1.49.2`.

## ✅ Completado v1.49.1 - Inicio más nítido (el juego se acomoda detrás de la carga)

- Los 2s finales de la pantalla de carga ("LISTO! 100%") ya no **congelan** el juego: lo dejan correr **detrás** de la carga para que cámara, HUD y escudo curvo se acomoden antes de mostrarse → se acabó el parpadeo con cosas "fuera de lugar" en el primer segundo (`UIManager.js`). Nuevo `Game.prepararInicioLimpio()`: justo antes de revelar, barre lo que haya spawneado en esos 2s (asteroides, naves, especiales, proyectiles, efectos) y resetea la puntuación a 0 → arranque acomodado **y** limpio. Mantiene nave, HUD, boids y cámara. Android: `versionCode 9` / `1.49.1`.

## ✅ Completado v1.49.0 - Tutorial móvil, indicadores y rendimiento

- **Tutorial adaptable:** mantiene sus 5 páginas, entra en celulares apaisados y permite desplazamiento interno cuando falta altura. La página de controles muestra únicamente el modo elegido (mouse/teclado reasignable, joystick o touch con layout clásico/invertido). La página de mejoras usa el botón real de mejoras en lugar de indicar la tecla `P`.
- **Avisos bajo la nave:** al sumar puntaje aparece `+N Puntos`; las partículas recolectadas se agrupan y muestran `+N` con `assets/pboids_Icon.png`. Usan Comic Sans a 12 px, color azul claro, sin borde ni negrita y se apilan verticalmente para no superponerse.
- **Boids optimizados:** grilla con claves numéricas, celdas reutilizadas, fuerzas calculadas en una sola pasada y comparaciones con distancia al cuadrado. Reduce arreglos, objetos temporales y raíces cuadradas durante cada frame.
- **Limpieza de enemigos:** el límite de distancia se calcula una vez por actualización, se eliminó el segundo recorrido duplicado y se limpian referencias de naves ya destruidas en partidas largas.
- **Correcciones de destrucción:** las naves enemigas destruidas al chocar con asteroides reproducen su sonido; los asteroides usan la explosión PNG y reservan las partículas procedurales como fallback cuando falta la textura.
- **Versión y Android:** la versión visible del menú y la firma de créditos salen de `CONFIG.APP.VERSION`. Release preparada como `v1.49.0`, `versionCode 8`, con `www` y assets Android sincronizados para regenerar el AAB.
- **Pendientes conservados:** optimización de actualizaciones del HUD PixiJS y pool de canales de audio.

## ✅ Completado v1.48.9 - Mundo toroidal 3× → 5×

- `Game.js`: `mundoAncho/Alto = width/height * 5` (antes `* 3`). Aleja la costura del toroide → los enemigos mueren más adentro de la vista y se ven sus explosiones (arregla el grueso de las "destrucciones sin animación" cerca de los bordes). Verificado: FPS estable (no agrega carga; entidades capadas y spawn relativo a la nave). Queda opcional la Opción B (render "fantasma").

## ✅ Completado v1.48.8 - Sonido de la ULTI amplificado

- `ulti.mp3` estaba a −17,9 dB de pico (casi inaudible) → amplificado +15 dB con ffmpeg (pico −3,3 dB, sin clipear) + volumen en `config.js` 0.9 → 1.0. Verificado: suena al activar la ULTI.

## ✅ Completado v1.48.7 - Audio comprimido (música de menú 4,9 → 1,8 MB)

- `musica_menu.mp3` (256 kbps, 2:36) y `musica_juego` re-encodeadas a **96 kbps estéreo** con ffmpeg (`ffmpeg-static`, instalado con `--no-save` → no toca `package.json`). Menú: 4,9 MB → 1,8 MB (−62%); juego: 728 → 364 KB. Mismos nombres, `-map_metadata -1`. Verificado en runtime: cargan (readyState≥2), reproducen y avanzan bien, duración correcta (156 s).
- Con esto + las imágenes (v1.48.4/.5), `assets/` pasó de **~31 MB → 8 MB**.

## ✅ Completado v1.48.6 - Antialias off en celular + limpieza backlog

- `Game.init`: `antialias: !modoTouch` (ON en PC, OFF en touch → ahorra fill-rate en el G04; impacto visual mínimo porque casi todo son sprites).
- Limpieza del backlog: sacadas las entradas ya hechas (ícono/splash, AdMob revive) y actualizada la nota del radio de ULTI (resuelto en v1.48.2). Estado mobile del backlog puesto al día (prueba cerrada Alpha).

## ✅ Completado v1.48.5 - Fix marcador de puntos

- `puntacion-recursos.png` se había achicado en v1.48.4 al redimensionarlo (el HUD lo posiciona con coords de su resolución nativa 2172×431). Restaurado + comprimido SIN resize (1745 KB → 571 KB). El resto de assets usa escala adaptativa, así que no se vieron afectados.

## ✅ Completado v1.48.4 - Imágenes comprimidas (25 MB → 5 MB)

- Las 75 PNG de `assets/` se comprimieron con `sharp`: cuantización de paleta (`palette:true`, quality 90) + dithering (evita bandeo) + `compressionLevel 9`, y **resize a máx 1280 px** de las 12 que lo superaban (marcos de mejora 2300px, portada, fondos, etc.). Total **25 MB → 4,9 MB (−80%)**.
- **Sin pérdida visual** — verificado en runtime: portada del menú, marco de ventanas (`gameOver.png`, quedó opaco sin alpha pero renderiza bien), HUD, íconos, asteroides y fondo. Todos los PNG cargan 200 OK, sin 404s. FPS 60.
- **Mismos nombres de archivo** → cero cambios de código.
- **Falta el audio** (`musica_menu.mp3` 4,9 MB) — necesita ffmpeg (no instalado). Queda en el backlog / `documentacion/prompt-optimizar-assets.md`.

## ✅ Completado v1.48.3 - Menos estrellas + plan de optimización

- Estrellas de fondo 90 → 40. Nuevo doc `documentacion/prompt-optimizar-assets.md` (prompt para IA) y anotados en backlog los pasos #1-5 de optimización.

## ✅ Completado v1.48.2 - Fix revivir tras récord + ULTI con el zoom

Dos bugs reportados por el dev el 03/08/2026 (rendimiento ya OK en el G04).

- **Revivir bloqueado tras guardar un récord** (`Game._crearBotonesGameOverHTML`, `Game.js:1560`): `hayRevivir` ahora también exige `!this.nombreIngresado`. Al guardar el nombre del récord (`agregarEntrada` → `nombreIngresado = true`), la pantalla de Game Over se recrea SIN el botón Revivir. El flag se resetea al reiniciar partida (`Game.js:1743`), así que en la próxima partida vuelve a estar disponible. Verificado: sin récord → aparece; con récord → no aparece.
- **ULTI ajustada al zoom** (`UltiEffect.js`, constructor): `maxRadius` ahora se divide por `CONFIG.CAMARA.ZOOM`. El aro se dibuja en `game.mundo` (escalado ×0.70), así que sin esto la animación y el área de destrucción cubrían menos vista. Verificado: `maxRadius` pasó de 176 → 252 (×1.43). Pendiente menor: la ULTI usa distancia euclidiana, no toroidal (ver backlog del toroide).

## ✅ Completado v1.48.1 - Rendimiento, controles por modo y varios fixes

Tanda de rendimiento + varios (rendimiento confirmado bien en el G04 el 03/08/2026).

- **Rendimiento — caps de entidades**: `generarEnemigo` respeta `CONFIG.MUNDO.MAX_ASTEROIDES` (30) y `generarNaveEnemiga` un nuevo `MAX_NAVES_ENEMIGAS` (6); fragmentos y mini-especiales también respetan el tope. Acota las colisiones O(n²) en partidas largas. Boids: el grupo de spawn se clampea a `MAX_PARTICULAS`.
- **Rendimiento — grilla espacial de Boids** (`GameBoids.actualizarParticulasBoid`): se agrupan las partículas en celdas del tamaño del rango de visión y cada boid solo mira su celda + las 8 adyacentes (en vez de las 100) → O(n²) a ~O(n), ~2,5× más rápido, comportamiento idéntico. Helpers `_construirGrillaBoids` / `_vecinosCercanosBoids`.
- **Detección de modo táctil mejorada** (`GestorEntrada.cargarModoControl`): usa `matchMedia('(pointer: coarse)')` + `(any-pointer: fine)` para no meter en modo touch a una laptop táctil con mouse.
- **Config de generación editable**: `MAX_ESPECIALES`, `PROB_ESPECIAL` / `_OLEADA_ALTA`, `OLEADA_PROB_ESPECIAL_ALTA` y `UMBRALES_TIPO` migrados de hardcode a `CONFIG.GENERACION`.
- **Pantalla de carga** (`UIManager.mostrarPantallaCarga`): espera 2 s en el 100% y **congela el juego** durante la carga para que arranque fresco.
- **Sin partículas al girar** (`Player.js`): se desactivó la creación del efecto de rotación azul al girar la nave.
- **Fix explosión de asteroides "rezagado"**: usaban `rezagado1/2/3` (nombres inexistentes) → explotaban chicos y soltaban 1 partícula. Corregido a `large/medium/small_rezagado` en `GameProjectiles`, `GameEffects` y `GameEnemies`.
- **Barra de carga real + fix duplicación uiManager** (`Game.init` acepta `onProgress`/`uiManager`).
- **Controles por modo** (`UIManager.mostrarControles`): la ventana ahora cambia el contenido según el modo elegido. Mouse y teclado mantiene la reasignación actual; Joystick muestra una referencia fija del mapeo del gamepad; Touch muestra presets de layout táctil.
- **Preset táctil clásico/invertido** (`TouchControls.aplicarPreferencias`): el menú permite elegir joystick a la izquierda con botones a la derecha, o joystick a la derecha con botones a la izquierda. La preferencia queda guardada en `localStorage` (`touchLayoutJEE`) y se aplica al empezar una partida.
- **Comentarios agregados en español**: se documentó la lógica nueva para que sea más fácil retomar después.
- **Verificado**: `node --check src/ui/UIManager.js`, `node --check src/systems/TouchControls.js`, `npm run build` y prueba en navegador local. Sin errores; el cambio de modo funciona y el layout táctil invertido se aplica en partida.

---

## ✅ Completado v1.48.0 - Zoom de cámara + auto-apuntado + fix HUD

Tanda de ajuste del "feel" mobile (probada en el G04). El dev confirmó los valores.

- **Zoom de cámara** (`CONFIG.CAMARA.ZOOM = 0.70`): se escala el contenedor `mundo` en `Game.js` (2 puntos de creación). Se ajustaron: matemática de cámara (centrado `-camX*Z`, vista `sw/Z × sh/Z`), apuntado con mouse (`Player.js`: `x*Z + mundo.x`) y culling (`_puntoSpawnFueraDeVista`). Fondo/estrellas/HUD son capas aparte → no se afectan. **Pendiente si se quiere afinar:** el radio de la ULTI y el límite de culling aún usan `anchoJuego` sin `/Z` (ver backlog del toroide).
- **Fix HUD de aceleración**: la barra curva (`contenedorEscudo`, `PixiHUD._actualizarEscudoCurvo`) seguía a la nave con `mundo.x + jugador.x` (1:1) → con el zoom quedó en la esquina. Ahora usa `mundo.x + jugador.x*Z` y `cont.scale = Z` → vuelve a estar pegada a la nave.
- **Auto-apuntado** (`CONFIG.AUTOAPUNTADO`, `Player._aplicarAutoApuntado`): imán sutil SOLO en touch/joystick. Busca el enemigo más alineado con tu mira dentro de un cono (`CONO_GRADOS`) y a `RANGO`, y corrige el ángulo `FUERZA` hacia él (mezcla estable, no lock-on). Ignora especiales en órbita. Mouse no se toca. Valores confirmados por el dev: cono 20°, fuerza 0.6 ("casi no se nota, se siente bien"). Verificado en runtime.
- **`window.uiManager`** expuesto (como `window.game`) para debug.

## ✅ Completado v1.47.7 - La música del menú suena apenas abre la app

El dev quería que la música sonara **apenas entra**, sin pedir un click. Se descartó la idea previa de un overlay "TOCÁ PARA EMPEZAR".

- **Realidad técnica**: los navegadores (y el WebView de Android por defecto) bloquean el autoplay de audio hasta un gesto del usuario. En **web pura no se puede** evitar; en la **app nativa sí**.
- **`android/app/src/main/java/.../MainActivity.java`** (⚠️ `android/` está gitignored → re-aplicar si se regenera): se agregó `permitirAutoplayAudio()` con `getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false)` en `onCreate`. Con eso la música suena al instante al abrir la app.
- **`src/main.js`**: intenta `iniciarMusicaMenu()` apenas carga (funciona en Android) + fallback SILENCIOSO (sin overlay) que la arranca en la primera interacción para la web, y se auto-remueve al empezar a sonar. Se expuso `window.uiManager` (igual que `window.game`).
- **`src/ui/UIManager.js`**: `iniciarMusicaMenu()` ahora se auto-recupera (si el navegador bloqueó el primer intento, el loop queda pausado → lo descarta y reintenta en el gesto). Nuevo helper `musicaMenuSonando()`.
- Verificado en runtime: sin overlay, la música arranca sola (en este navegador el autoplay está permitido) y avanza en loop.

## ✅ Completado v1.47.6 - Sonidos del asteroide especial

El dev pidió que el asteroide especial también tuviera audio de colisión y destrucción. Para la destrucción se decidió **reutilizar la explosión de las naves** (`destruccion_nave.mp3`) en vez de sumar un audio nuevo.

- **Colisión** especial↔asteroide (sin destruirse): suena `reboteMeteoritos` (el mismo del rebote entre asteroides). Se refactorizó el throttle de 70 ms en un helper `_sonarRebote(game)` en `GameEnemies.js`, reutilizado por asteroides normales y el especial.
- **Destrucción** del especial → `destruccionNave` en los 4 caminos:
  - `GameProjectiles.js`: especial grande destruido por proyectil.
  - `GameEnemies.js` (`limpiarEnemigosLejanos`): mini especial destruido por asteroide. *(Ojo: la colisión mini-especial↔asteroide vive en `limpiarEnemigosLejanos`, no en `procesarColisionesEnemigos`.)*
  - `GameEnemies.js` (`procesarColisionesJugador`): mini especial destruido por nave.
  - `GameSkills.js` (`actualizarCohetes`): especial destruido por cohete (nave y especial comparten `destruccionNave`).
- No hizo falta archivo de audio nuevo ni volumen nuevo en `config.js`.
- Verificado en runtime (navegador, import dinámico + spy) los 4 casos.

## ✅ Completado v1.47.5 - Sonidos de colisión y de destrucción por cohete

Se completó el audio de las colisiones que faltaban. El dev sumó un audio nuevo para el rebote entre asteroides (`assets/audio/revoteEntreMeteoritos.mp3`).

- **`config.js`**: nuevo volumen `reboteMeteoritos: 0.4` en `CONFIG.AUDIO.VOLUMENES`.
- **`Game.js`**: carga del sonido `reboteMeteoritos` en el `gestorSonido`.
- **`GameEnemies.js`**:
  - `procesarColisionesEnemigos`: cuando dos asteroides **rebotan sin destruirse** suena `reboteMeteoritos`, con **throttle de 70 ms** (`game._ultimoReboteSonido`) para no saturar con muchos choques simultáneos.
  - `procesarColisionesJugador`: al chocar el jugador contra un **asteroide** suena `destruccionMeteorito`; contra una **nave** suena `destruccionNave` (además del `recibirImpacto` del jugador).
- **`GameSkills.js`** (`actualizarCohetes`): cuando un **cohete** impacta, suena `destruccionNave` si el objetivo era una nave, o `destruccionMeteorito` si era asteroide/especial.
- Verificado en runtime (navegador, import dinámico + spy sobre `gestorSonido.reproducir`): los 4 casos disparan el sonido correcto; el rebote respeta el throttle y no suena la destrucción.

## ✅ Completado v1.41.6 - Fix Controles: el botón Volver ya no queda abajo

- **Bug en el celu real**: en Controles no se podía volver — el botón Volver quedaba fuera de pantalla abajo. Causa: el marco tenía `max-height: min(680, height*0.92)` + la lista `overflow-y:auto` + container `overflow:hidden`. El `max-height` clampeaba `exterior.offsetHeight`, así el helper de escala creía que "entraba" (escala 1) pero el contenido real desbordaba el marco y el Volver quedaba abajo, oculto.
- **Fix** (`mostrarControles`): se quitaron `max-height` del exterior, `overflow:hidden` del container y `overflow-y:auto; min-height:0` de la lista → Controles ahora tiene altura natural y el helper `_hacerModalResponsive` lo **escala entero** (Volver incluido) para que entre. Verificado a 1600×600: escala 0.745, marco 586px entra (7–593), Volver visible dentro.

## ✅ Completado v1.47.0 - Android: revivir con anuncio recompensado (AdMob, paso 4)

Primer paso de monetización (`AppBusiness.md` paso 4). Decisiones del dev: **rewarded para revivir**, **ilimitado** por partida, al revivir **escudo lleno + 2s invulnerable + limpia enemigos cerca**. Construido con **IDs de PRUEBA de Google** (cambiar por reales al publicar).

- **`src/systems/Anuncios.js`** (nuevo): wrapper de `@capacitor-community/admob` v8. `disponible()` (false en web), `inicializar()`, `mostrarRewarded(onReward)` (escucha `onRewardedVideoAdReward`/`onRewardedVideoAdDismissed`, precarga el próximo). Ad unit de prueba `ca-app-pub-3940256099942544/5224354917`. Accede al plugin vía `window.Capacitor.Plugins.AdMob` (proyecto sin bundler).
- **Player**: `invulnerable` + `temporizadorInvulnerable`, `activarInvulnerabilidad(seg)`, `recibirDano` ignora daño si invulnerable, `update` descuenta y hace titilar la nave.
- **Game**: `revivir()` (limpia UI de Game Over sin resetear, restaura jugador con escudo lleno + 2s invuln, `_limpiarCercaAlRevivir(340)` que quita proyectiles enemigos + enemigos cercanos, reanuda `ejecutando`). `this.anuncios` creado en `init`. Botón **"Revivir (ver anuncio)"** en `_crearBotonesGameOverHTML` (solo si `anuncios.disponible()`; layout de 3 botones con AdMob, 2 sin) → `mostrarRewarded(() => revivir())`.
- **AndroidManifest**: App ID de prueba de AdMob (ver `appAndroidGDD.md`). **Fix proguard del plugin** (`node_modules/.../admob/android/build.gradle` → `proguard-android-optimize.txt`, AGP 9; se pierde con `npm install`).
- Verificado en runtime (web): revivir restaura escudo/invuln/HUD y reanuda; botón NO aparece en web; invulnerabilidad bloquea daño y se apaga a los 2s. Sin errores. Compila e **instalado en el G04** (con anuncios de prueba).
- ✅ **v1.47.1**: el dev creó la cuenta de AdMob y se pusieron los **IDs reales** (App ID `ca-app-pub-8065871181264852~9559851274` en el manifest; ad unit `…/9966477167` en `Anuncios.js`). Siguen en **modo prueba** (`isTesting=true`) → anuncios de test hasta publicar. Al PUBLICAR: poner `isTesting`/`initializeForTesting` en false.
- **PENDIENTE**: probar el flujo del anuncio real en el G04; **política de privacidad** publicada (obligatoria por AdMob); **Play Store** (paso 5: cuenta dev $25, ficha, build firmado `.aab`).

---

## ✅ Completado v1.46.0 - Android: ícono y splash propios

- **Ícono + splash de la app** (aprobado por el dev): la nave (`assets/Nave322.png`) centrada sobre un fondo espacial (degradado radial azul→oscuro). Fuentes en **`recursos-app/`** (versionadas): `icon-only.png` (legacy), `icon-foreground.png` (nave sola, para el adaptativo) + `icon-background.png` (fondo), `splash.png`/`splash-dark.png`. Script `recursos-app/hacer-icono.mjs` (usa `sharp`) las genera desde la nave.
- **Generación Android**: `npx @capacitor/assets generate --android --assetPath recursos-app` → 74 recursos (mipmaps por densidad + ícono adaptativo `anydpi-v26` + splash) escritos en `android/…/res/` (ignorado en git; **regenerar** con ese comando si se recrea `android/`). Verificado que la edición nativa `screenOrientation="sensorLandscape"` del manifest sobrevivió.
- `sharp` y `@capacitor/assets` quedan en `devDependencies`. Instalado en el G04 (ícono nuevo en el cajón de apps). Con esto, del roadmap para publicar quedan **AdMob** (paso 4) y **Play Store** (paso 5).

---

## ✅ Completado v1.45.1 - Menú: imagen de portada subida

- **Imagen del menú subida** (`UIManager.mostrarMenuPrincipal`): `background-position` de `center top` → **`center 24%`** (pedido del dev con captura) para que el **título "Jugando en el Espacio" quede pegado al borde superior**. Verificado en runtime a 1600×720: el título "Jugando" queda apenas tocando el borde de arriba, los 5 botones completos.

---

## ✅ Completado v1.45.0 - Táctil: botones a la esquina + iluminación por disponibilidad

- **Botones más a la esquina** (`TouchControls._crearUI`): FUEGO y el cluster de habilidades pasaron de `right:10%/bottom:11%` a **`right:5%/bottom:7%`** → más área de juego libre. Verificado: gaps 80px(der)/50px(abajo).
- **Iluminación por disponibilidad** (`TouchControls.actualizarDisponibilidad` + llamada en `Game._gameLoop`): cada frame en modo touch, los botones se **encienden** (opacity 1 + glow) si la habilidad está disponible y se **apagan** (opacity 0.33 + grayscale) si no. Misma lógica que el HUD: cohetes/propulsor/devorador con `enfriamientoX <= 0`, ulti con `jugador.ultiListo`. Solo actualiza el estilo si cambió el estado (barato). Verificado: ulti listo → encendido, cohetes en cooldown → apagado.

---

## ✅ Completado v1.44.0 - Táctil: joystick analógico (aceleración por intensidad)

Se acopló el movimiento con la aceleración en táctil (pedido del dev): **cuánto se empuja el joystick = cuánto se acelera y cuánto se gasta la carga**. Decisiones tomadas con el dev: se **quita el botón Acelerar** y hay **zona muerta chica** (empuje leve solo apunta). Solo Touch; PC/gamepad = thrust completo (on/off) como siempre.

- **InputManager**: nuevo `tactilIntensidad` (0..1). `setTactilApuntado(angulo, intensidad)` + `setTactilIntensidad(v)`. Nuevo `intensidadAvance()` → en táctil devuelve `tactilIntensidad` (si `tactilApuntando`), en PC/gamepad `1` si se presiona 'avanzar' si no `0`. `debeAvanzar` ahora = `intensidadAvance() > 0`. Reset de intensidad en `limpiar/reiniciar/deshabilitar`.
- **TouchControls**: el joystick calcula la intensidad con `(mag - ACCEL_INICIO)/(R - ACCEL_INICIO)` clamp 0..1 (ACCEL_INICIO=28, R=72) → zona muerta de aceleración; la pasa por `setTactilApuntado(ang, intensidad)`. Dentro de la zona muerta de apuntado usa `setTactilIntensidad(0)` (apunta al último ángulo sin acelerar). **Se quitó el botón de Acelerar** (quedan 4 botones de habilidad).
- **Player** (`update`): `intensidadAcel = input.intensidadAvance()`; el thrust y el llenado de la barra de sobrecalentamiento se **escalan por la intensidad** (`aceleracion * intensidadAcel * delta`, `velocidadCarga * intensidadAcel * delta`).
- Verificado (llamando `player.update` directo): intensidad 1 → vel +120 / carga +15; 0.5 → +60 / +7.5 (mitad exacta); 0 → no acelera. **PC (mouseTeclado) idéntico a antes** (intensidad 1 → +120/+15). Sin errores.
- ✅ Instalado en el G04 (junto con v1.45.0/v1.45.1) el 28/07/2026. A probar el feel en el celu real.

---

## ✅ Completado v1.43.2 - Táctil: mejoras se agrandan 25% al desplegarse

- **Despliegue de mejoras +25%** (`PixiHUD._aplicarDespliegue`, rama touch): el factor de agrandado pasó de `0.15` a `0.25` (`esc = _escala * (1 + 0.25*p)`). Verificado a 772px de ancho (peor caso): columnas IZQ 12–246 y DER 526–760, **ambas dentro y sin encimarse** (gap 280px); en el G04 (1600) sobra lugar.

---

## ✅ Completado v1.43.1 - HUD táctil: ajustes tras probar en el G04

Correcciones pedidas por el dev con capturas anotadas (28/07/2026):

- **Fix columna IZQUIERDA de mejoras** (`PixiHUD._aplicarDespliegue`, rama touch): la columna izq no mostraba los chips (su placa está a la IZQUIERDA del icono y quedaba fuera de pantalla al posicionarla pegada al borde). Se corrigió el desplegado a `margen + (marcoAncho-marcoQ)*esc` (revelar la placa, igual que en PC). Verificado: IZQ 12–227 y DER 545–760, **ambas dentro de pantalla** (antes IZQ salía a x=-139).
- **Botones de habilidad más separados** (`TouchControls._crearUI`): arco más amplio (offsets nuevos) y tamaño 60px → distancia mínima entre botones ~68px (antes se encimaban). Verificado.
- **Joystick FLOTANTE** (`TouchControls`, `zonaJoy` + `_vincular` reescrito): la base ya no es fija; hay una **zona táctil transparente en la mitad-izquierda inferior** y el joystick **aparece donde se toca** (base `display:none` por defecto → se muestra centrada en el punto tocado con `mostrarEn`), y desaparece al soltar. Verificado: toque en (200,400) → base aparece exactamente ahí; al soltar → oculta.
- **Opacidad −25%** (`TouchControls` overlay): `0.75 → 0.56`.
- Sin errores. Instalado en el G04.

---

## ✅ Completado v1.43.0 - HUD táctil reacomodado (botones de habilidad + mejoras que se despliegan)

Reacomodo del HUD **solo para modo Touch** (pedido 28/07/2026, con mockup aprobado por el dev). En Mouse-teclado y Joystick el HUD queda **idéntico** (todo gateado por `modoControl === 'touch'`).

### Proceso / decisiones
1. Se mostró un **mockup interactivo** (dos estados: jugando ↔ mejoras) para confirmar el concepto antes de tocar código. El dev lo corrigió con dibujos: botones agrupados junto al FUEGO con su icono, y el marcador de arriba (puntos/partículas) que **NO** se agranda.

### Qué se implementó
- **Botones de habilidad táctiles** (`TouchControls._crearUI` + nuevo `_crearBotonIcono`): 5 botones redondos **agrupados en arco alrededor del FUEGO**, cada uno con el **icono de su habilidad** (`aceleracion.png`→`avanzar`, `ultiicon1.png`→`ulti`, `cohetes.png`→`cohetes`, `propulsor.png`→`propulsor`, `deborador.png`→`devorar`). Llaman a `setTactilAccion(accion, …)` igual que FUEGO. Reemplazan el tocar-los-iconos-del-HUD (que ahora quedan fuera de pantalla en juego).
- **Columnas del HUD fuera de pantalla en juego + despliegue con +15%** (`PixiHUD._aplicarDespliegue`, rama nueva para touch): durante el juego (`_despliegueProgreso = 0`) las columnas quedan **fuera de pantalla** (izq a `-anchoChip`, der a `w`); al abrir mejoras (`p → 1`) **entran** y la escala pasa de `_escala` a `_escala × 1.15` (interpolado con `p`). El **marcador superior (`contenedorTop`) no se toca** → no se agranda. Se guardó `this._altoColumna` en `_calcularEscala` para recentrar verticalmente al escalar.
- El **icono de mejoras de arriba** (`_upgradeSprite`) sigue abriendo/cerrando el panel (ya andaba).

### Verificado en runtime (modo touch autodetectado)
- Jugando: columnas fuera (izq x<0, der x≥w), 5 botones con icono presentes, marcador top en escala base.
- Mejoras abierto: columnas **dentro de pantalla**, escala `_escala×1.15` (`columnasX1_15: true`), marcador top **sin agrandar** (misma escala base).
- **PC (mouseTeclado)**: el cuadrado queda en el borde (x≈margen) y escala normal → comportamiento de siempre. Sin errores de consola. Instalado en el G04.

---

## ✅ Completado v1.42.0 - Game Over y Top 5 de Game Over adaptados a celular

Fix de las ventanas PixiJS de Game Over (vistas rotas en el G04). Causa raíz: en el celu la **resolución del canvas** (`anchoJuego×altoJuego`, que sigue al viewport CSS) es más chica que en PC → el marco (`gameOver.png`) se achica pero las posiciones fijas en px no → todo se salía/superponía.

- **Texto de Game Over** (`Game.gameOver`): `titleText`/`scoreText`/`waveText` ahora usan Y **proporcional a la altura del marco** (`gameOverSprite.height * 0.30/0.03/0.15`) en vez de offsets fijos (+70/+10/+60) → "Oleada Alcanzada" ya no pisa los botones.
- **Botones HTML** (`_crearBotonesGameOverHTML` + nuevo helper `_mapaCanvas`): Reiniciar/TOP 5 se ubican con **conversión coords-juego→pantalla** (`_mapaCanvas` calcula escala + offset de letterbox del canvas con `object-fit:contain`) y ancho proporcional al marco. Antes mezclaban `left` en coords de juego con `top` escalado → se corrían en el celu.
- **Top 5 de Game Over** (`Game._mostrarTop5`): columnas del encabezado y filas ahora **proporcionales a `imagenAncho`** (`±0.258/0.143/0.072/0.229`) → la columna N° no se sale. El botón **Volver** se centra abajo con `_mapaCanvas` → no se superpone a la tabla.
- Verificado en runtime a 1600×720 (idéntico a antes, gap wave→botón 32px) y simulando el device a **900×420** (columnas dentro del marco ✓, Volver debajo de las filas y dentro del marco ✓). Sin errores. Instalado en el G04.
- ✅ **Confirmado por el dev en el G04 real (28/07/2026): "ya se ve bien".** Con esto, todas las ventanas (DOM y PixiJS) quedan adaptadas a celular.

---

## ✅ Completado v1.41.5 - Ventanas se achican para entrar en el celular (sin scroll)

- **Cambio de scroll → escala** (`UIManager._hacerModalResponsive`): al dev **no le gustó el scroll** (v1.41.4). Ahora, si la ventana (Opciones/Controles/Créditos/Top 5) es más alta o ancha que la pantalla, el marco se **escala** con `transform: scale(min(1, dispH/h, dispW/w))` y `transform-origin: center` → entra completa, proporciones intactas, sin recortes ni scroll. El modal usa `overflow: hidden` + `justify-content: center`. Se recalcula en `requestAnimationFrame` (tras el layout) y ante `resize` (el listener se auto-remueve cuando el modal se cierra).
- **PC intacto**: cuando entra, `escala = 1` (`transform: none`). Verificado en runtime: a 1600×540 Top 5 escala 0.866 y entra (título+Volver visibles, sin scroll); a 1600×720 escala 1 (sin cambios).
- **Nota rAF**: el ajuste se aplica 1 frame después de abrir (rAF); en el dispositivo real (visible) dispara bien. En testing headless con el pane oculto el rAF no corre → se probó disparando `resize` a mano.

---

## ✅ Completado v1.41.4 - Ventanas adaptadas a celular (scroll, REEMPLAZADO por v1.41.5)

- **Modales responsive** (`UIManager._hacerModalResponsive` + llamada en `mostrarOpciones`, `mostrarControles`, `mostrarTop5`, `mostrarCreditos`): en el G04 (1600×720) las ventanas eran más altas que la pantalla y, al estar centradas con `align-items:center`, se **cortaban arriba y abajo** sin poder scrollear (título y botón Volver fuera de vista). El helper cambia el modal a `flex-direction:column; justify-content:flex-start; overflow-y:auto` y le pone al marco `margin: auto 0; flex: 0 0 auto` → **centra cuando entra** (PC igual que antes) y **scrollea cuando no** (celu) sin cortar nada.
- Verificado en runtime a 1600×720 (táctil): las 4 ventanas entran con título y Volver visibles (Opciones 660px, Controles 662px con lista scrolleable, Créditos 678px, Top 5 673px). PC sin cambios (centrado por `margin:auto`). Sin errores.
- **Nota**: en el celu real el contenido puede ser un poco más alto (fuente de fallback distinta a la de PC), pero el `overflow-y:auto` garantiza que todo sea alcanzable con scroll. **Pendiente instalar en el G04** (se desconectó por batería baja durante la prueba; el APK compila OK).

---

## ✅ Completado v1.41.3 - Mejoras: iconos titilan cuando hay una disponible

- **Titileo de iconos de mejora disponible** (`PixiHUD._actualizarPreciosMejora`): además del brillo (`alpha = 1`), cuando una mejora es comprable su `upgradeSprite` ahora **pulsa** con `pulsoMejora = 0.55 + 0.45*(0.5+0.5*sin(now/1000*8))` (~1.3 Hz, rango 0.55–1.0). El icono de mejoras del marcador superior (`_upgradeSprite`) titila igual si hay **al menos una** comprable. Los NO comprables quedan fijos en `alpha = 0.4` (sin titilar).
- Verificado en runtime: comprable → alpha oscila 0.55↔0.99 (`pulsa: true`, en rango); no comprable → 0.4 fijo; sin errores.
- **Pendiente a pedido del dev (más adelante)**: (1) rediseño visual del **menú/sistema de mejoras** (que se vea mejor); (2) **aceleración con el joystick por intensidad** — cuánto se empuja el stick define qué tan fuerte acelera y cuánto gasta. Ambos anotados, NO implementar aún.

---

## ✅ Completado v1.41.2 - Menú: botones 15% más chicos en celular

- **Botones del menú −15% en táctil** (`UIManager.mostrarMenuPrincipal`): se agregó `factorCel = esTactil ? 0.85 : 1` (detección `navigator.maxTouchPoints > 0 || 'ontouchstart'`) y el ancho pasó a `min(anchoBoton*factorCel px, 46*factorCel vh)`. Se ata a **táctil, NO a la altura**, porque el G04 tiene el mismo alto que el desktop (720px) y un cambio por `vh` no los distinguiría. En **PC (factor 1) queda idéntico** (`min(256px, 46vh)`). Verificado en runtime a 1600×720 táctil: botones a **218px** (= 256×0.85), los 5 visibles.

---

## ✅ Completado v1.41.1 - Android: botón "atrás" = Escape

- **Botón atrás de Android = Escape** (`src/main.js` + plugin `@capacitor/app`): se agregó un listener `App.addListener('backButton', …)` que replica el comportamiento de Escape. Con partida en curso (o el modal ya abierto) dispara un `KeyboardEvent('keydown', {key:'Escape'})` sobre `window` → reutiliza el handler existente que abre/cierra la ventana **"¿Volver al menú?"**. En el menú o Game Over llama `App.exitApp()` (comportamiento estándar del botón atrás).
- Guardado con `if (window.Capacitor && …)` → en la **web de escritorio no se ejecuta** (Capacitor no existe), Escape sigue por teclado. **Modelo de PC intacto** (verificado en runtime: `window.Capacitor` undefined, juego carga, sin errores).
- Requirió `npm install @capacitor/app` (v8.1.1) + `npm run cap:sync` (registra el plugin nativo) + reinstalar en el G04.

---

## ✅ Completado v1.41.0 - Empaquetado Android con Capacitor (setup, paso 3)

Setup del **paso 3 del roadmap mobile** (`AppBusiness.md`). Detalle completo en `documentacion/appAndroidGDD.md` (informe interno, no versionado).

- **Capacitor 8.4.2** instalado (`@capacitor/core`, `cli`, `android`) → quedan en `dependencies`.
- **`capacitor.config.json`** (versionado): `appId = com.wackxion.jugandoenelespacio`, `appName = "Jugando en el Espacio"`, `webDir = "www"`, fondo `#0D0D1A`.
- **`scripts/build-www.mjs`** (versionado): arma `www/` copiando solo `index.html`, `assets/`, `css/`, `libs/`, `src/` (no `node_modules`/docs). Scripts npm: `cap:www`, `cap:sync`, `cap:open`.
- **`android/`** generado con `npx cap add android` (proyecto nativo). **Ediciones nativas** aplicadas: orientación `sensorLandscape` en `AndroidManifest.xml` y **modo inmersivo** (barras ocultas) en `MainActivity.java` — documentadas en el informe para re-aplicar si se regenera.
- **git**: `www/` y `android/` **ignorados** (generados); se versionan `capacitor.config.json`, `scripts/`, `package.json`, `package-lock.json`. El informe `appAndroidGDD.md` también ignorado.
- Verificado: `npx cap sync` copia bien `www → android`; `npx cap doctor` → "Android looking great! 👌".
- **PENDIENTE (lo hace el dev en Android Studio)**: abrir con `npm run cap:open`, correr en emulador o en el **Motorola G04** real (Run ▶), probar controles táctiles a pantalla completa, y más adelante generar el `.aab` firmado. Íconos/splash propios + AdMob (paso 4) + requisitos Play Store (paso 5) quedan pendientes.

---

## ✅ Completado v1.40.6 - Menú: título del juego completo

- **Imagen del menú anclada arriba** (`UIManager.mostrarMenuPrincipal`): el fondo pasa de `background-position: center center` a **`center top`**. Con `background-size: cover` en pantallas muy anchas (celular apaisado 1600×720) el centrado recortaba ~219px de arriba → el título **"Jugando en el Espacio"** quedaba cortado. Al anclar arriba, el título se ve completo (se recorta el borde inferior de la ilustración, que es espacio/asteroides). Verificado en runtime a 1600×720 (título completo) y 1280×720 (título completo + nave bien encuadrada). Mejora pareja en celular y PC.

---

## ✅ Completado v1.40.5 - Mobile: ajustes tras probar en el Motorola G04 real

Primera pasada con **captura del G04 real** (1600×720 landscape). Diagnóstico medido en runtime a ese tamaño (con el boost 1.25 activo) y correcciones:

- **Iconos cortados en los bordes** (`PixiHUD._calcularEscala`): las columnas laterales tenían `margenLat = 2` → el cuadrado quedaba a 2px del filo (izq x2–108, der x1492–1598) y se veía "colgando"; la derecha además pisaba la barra de navegación de Android. Fix: en boost táctil `margenLat = max(12, w*0.014)` (~22px en 1600) → cuadrados a **22px de cada borde**. **En PC (boost 1) sigue en 2** (sin cambios).
- **Joystick y FUEGO chicos y pegados a las columnas** (`TouchControls.js`): estaban a **4px** de las columnas y medían 130/100px. Fix: joystick **130→170px** (perilla 60→78, `R` de la perilla 55→72), botón FUEGO **100→130px**, y ambos movidos de `7%` a **`10%`** del borde → quedan a **~32px** de las columnas (medido). Solo afecta al overlay táctil (no se ve en PC).
- Verificado en runtime a 1600×720 (táctil, boost activo): columnas a 22px del borde, joystick 170px a x160–330, FUEGO 130px a x1310–1440, gap de 32px a cada columna; forzando `boost = 1` (PC) → escala 1.0 y margenLat 2 (regresión OK); sin errores de consola.
- **Sigue pendiente para Capacitor**: la **barra de navegación de Android** (□ ○ ◁) en el borde derecho aún queda cerca de la columna der (en 1600 el cuadrado llega a x1578). Se resuelve solo al empaquetar con **modo inmersivo / pantalla completa** (paso 3); en el navegador es inevitable. Si en el G04 el boost 1.25 se ve muy grande, bajar `CONFIG.HUD.BOOST_TACTIL`.

---

## ✅ Completado v1.40.4 - Mobile: HUD 25% más grande en celular

- **HUD más grande en táctil** (`PixiHUD._calcularEscala` + `config.js` → `CONFIG.HUD.BOOST_TACTIL = 1.25`): en dispositivo táctil (celular) la escala del HUD se multiplica por **1.25**. Como cada grupo del HUD se dibuja en la base 1080×720 y **todos** sus offsets internos se multiplican por `_escala`, subir el factor agranda los elementos **y** separa sus contenidos un 25% (lo que pidió el dev: "más grande y con más separación"). No toca el zoom del mundo del juego.
  - Detección táctil idéntica al `InputManager` (`navigator.maxTouchPoints > 0 || 'ontouchstart' in window`), computada una vez en el constructor (`this._hudBoost`). En **PC el factor es 1** → el HUD queda idéntico (modelo de compu intacto).
  - Verificado en runtime (el pane reporta táctil): `hudBoost = 1.25`, `escala = base × 1.25` (0.725 → 0.9063); forzando `boost = 1` la escala vuelve a la base 0.725 (regresión PC OK); grupos dentro de pantalla (los rectángulos de mejora recogidos quedan fuera a propósito hasta desplegarse); sin errores de consola.
  - **Pendiente de afinar en el Motorola G04 real**: en 1600×720 el boost da escala 1.25; el HUD crece hacia el centro (más superposición con el área de juego). Si molesta, bajar `BOOST_TACTIL` (ej. 1.15) — es un solo número.

---

## ✅ Completado v1.40.3 - Mobile: menú visible en celular + controles táctiles reubicados

- **Menú principal cortado en celular apaisado** (`UIManager.mostrarMenuPrincipal`): los 5 botones (JUGAR, TUTORIAL, TOP 5, OPCIONES, CRÉDITOS) eran de ancho fijo (256px). En un celular apaisado (ej. 780×360) la columna medía **519px** contra **360px** de alto → centrada, dejaba **JUGAR y CRÉDITOS cortados fuera de pantalla**. Fix: el ancho pasa a `min(256px, 46vh)` y el `gap` a `1.4vh`, así los botones se **achican según la altura** y entran los 5. Verificado en runtime: 780×360 → los 5 visibles (antes 3); desktop 1280×720 → sigue en 256px, sin cambios (mantiene el modelo de PC).
- **Controles táctiles hacia adentro** (`TouchControls.js`): joystick (abajo-izq) y botón de FUEGO (abajo-der) se movieron del borde de `4%`/`8%` a **`7%`/`11%`**, para que no queden pegados al filo de la pantalla.

---

## ✅ Completado v1.40.2 - Táctil: −25% de opacidad

- **Controles táctiles más sutiles** (`TouchControls.js`): se le puso `opacity: 0.75` al overlay `#controles-tactiles` (envuelve joystick + botón de fuego) → **−25% de opacidad global** parejo (base, perilla, botón y su feedback al presionar), sin tocar cada color por separado. Verificado en runtime (`getComputedStyle` del overlay = `0.75`). Es un solo número, fácil de reajustar con feedback del celular real.

---

## ✅ Completado v1.40.1 - Mobile: aviso de orientación (girá el dispositivo)

- **Overlay "Girá el dispositivo"** (`index.html` + `css/style.css`): `#rotar-dispositivo` (icono 📱 que rota + texto). Oculto por defecto; se muestra **solo en táctil y en vertical** vía `@media (orientation: portrait) and (pointer: coarse)` → no afecta al desktop (aunque se achique la ventana). CSS puro, sin JS. Cubre todo (z-index 99999) y tapa el juego mientras esté en vertical.
- Verificado en runtime: en 375×812 táctil se muestra (`display: flex`, media matchea); al rotar a horizontal desaparece (`display: none`); en desktop no aparece (pointer: fine). Paso 1 del roadmap mobile: **bloqueo de orientación (web)** hecho — falta el `screenOrientation` nativo al empaquetar con Capacitor.

---

## ✅ Completado v1.40.0 - Modo de control + táctil por iconos del HUD

- **Selector de modo de control** (Opciones → Controles): 3 opciones **Mouse y teclado / Joystick / Touch** (`GestorEntrada.MODOS`, `cargarModoControl`/`guardarModoControl` en `localStorage['modoControlJEE']`, `setModoControl`). Autodetecta: en dispositivo táctil arranca en 'touch', si no 'mouseTeclado'. El **teclado y todos los bindings funcionan SIEMPRE**, en cualquier modo. El modo solo decide: qué apuntado manda y si se ve el overlay táctil.
  - `Player.update`: el apuntado por mouse ahora se activa solo si `modoControl !== 'touch'` (antes era `controlTactilActivo`, que se eliminó).
  - `Game._gameLoop`: el overlay táctil se muestra solo si `modoControl === 'touch'` (y jugando, no en pausa/game over).
  - UI: fila "Modo:" con 3 botones que resaltan el actual y persisten al tocarlos; avisan al juego en curso (`window.game.gestorEntrada.setModoControl`).
- **Aceleración por icono** (táctil): el joystick virtual **solo apunta** (se quitó la auto-aceleración). La aceleración se activa tocando el **icono de Aceleración** del HUD — se sumó la sección 20 al mapa de iconos activables (`PixiHUD._dibujarCuadrante`): `20 → 'avanzar'`.
- **Mejoras por el icono de arriba** (táctil/click): el icono de mejoras del marcador superior (`_upgradeSprite`) se hizo interactivo → al tocarlo llama `Game.alternarMejoras()` (nuevo método, mismo efecto que la tecla P: pausa + despliega el panel).
- Verificado en runtime: modo inicial autodetectado ('touch'), icono Aceleración toca→'avanzar', icono Mejoras toca→abre panel, selector cambia y persiste el modo, overlay solo en 'touch'. Sin errores.

---

## ✅ Completado v1.39.1 - Fix táctil: soltar el joystick conserva la dirección

- **Bug**: al soltar el joystick virtual, `tactilApuntando` pasa a false y el **apuntado por mouse** tomaba el control — y en táctil los toques emulan `mousemove` (`mouseMovido`/`mouseX/Y` quedan seteados), así que la nave "saltaba" al último punto tocado en vez de conservar la dirección del joystick.
- **Fix**: nuevo flag `GestorEntrada.controlTactilActivo` (lo prende `ControlesTactiles.mostrar()` y lo apaga `ocultar()`). La rama de apuntado por mouse en `Player.update` ahora exige `!input.controlTactilActivo` → con los táctiles activos el apuntado es **solo por joystick**; al soltar, la nave conserva su ángulo. En desktop (sin táctiles) el mouse sigue apuntando igual.
- Verificado: joystick a 45° → 0.785; soltar + mouse "movido" a otro lado → conserva 0.785; ocultar controles → el mouse vuelve a apuntar. Sin errores.

---

## ✅ Completado v1.39.0 - Controles táctiles (celular)

- **Nuevo módulo** `systems/TouchControls.js` (`ControlesTactiles`): overlay DOM sobre el canvas con **joystick virtual** (base + perilla, abajo-izq) y **un solo botón: FUEGO** (abajo-der). Maneja touch (multitouch por identifier de dedo) y tiene fallback de mouse para probar en DevTools.
- **Habilidades desde el HUD** (`PixiHUD._dibujarCuadrante`): en vez de botones táctiles aparte, los **iconos de las habilidades activables** que ya están en el HUD lateral (Ulti, Devorador, Cohetes, Propulsor) se hicieron **interactivos** (`eventMode='static'`): al tocarlos (pointerdown/up) llaman `gestorEntrada.setTactilAccion(accion, …)`. Mapeo por `mejoraSeccion`: 10→ulti, 25→propulsor, 30→devorar, 35→cohetes. Sirve en táctil y también con click en desktop.
- **Modelo**: el joystick **apunta la nave Y acelera** hacia ahí (un pulgar hace las dos cosas — coincide con el modelo mouse/gamepad de "acelerás hacia donde apuntás"), con zona muerta de 14px. Los botones activan/desactivan su acción mientras se los mantiene.
- **Cómo encaja (mismo patrón que el gamepad, sin tocar la lógica)**: el joystick llama `input.setTactilApuntado(angulo)` / `limpiarTactilApuntado()`, y los botones `input.setTactilAccion(accion, activo)`. Las acciones van a `tactilAcciones` (Set) que se **OR-ea en `estaPresionada()`** → todos los `debeXxx()` soportan táctil solos. El apuntado expone `tactilApuntando`/`tactilAngulo`, que `Player.update` usa con **prioridad** (táctil > joystick > mouse).
- **Integración** (`Game`): se crea en `init` (`new ControlesTactiles(document.body, gestorEntrada)`), se muestra solo en dispositivos táctiles (o forzado para debug), visible **solo mientras se juega** (el game loop hace `setVisible(!pausado && !enGameOver)`; `gameOver()` los oculta).
- Verificado en runtime (con fallback de mouse): overlay renderiza **solo joystick + FUEGO**, arrastrar el joystick apunta (−0.792) **y acelera** y la nave rota ahí, botón FUEGO dispara al presionar/soltar, y **tocar los 4 iconos del HUD** activa su habilidad (ulti→ulti, devorador→devorar, cohetes→cohetes, propulsor→propulsor). Sin errores.

---

## ✅ Completado v1.38.1 - Joystick: apuntar con el stick izquierdo

- **Cambio de stick** (`GestorEntrada.actualizarGamepad`): el apuntado pasó al **stick IZQUIERDO** (`axes[0]/[1]`) a pedido del dev. El **derecho** (`axes[2]/[3]`) queda como **alternativa**: solo se usa si el izquierdo está dentro de la zona muerta. Así se apunta y se avanza (con el gatillo) con el mismo pulgar.
- Verificado con la Gamepad API mockeada: izq a 45° → apunta 0.785 y la nave rota ahí; con el izq en centro y el der a −90° → apunta −1.571 (alternativa OK); ambos en centro → no apunta. Tutorial actualizado ("Stick izq: apuntar").

---

## ✅ Completado v1.38.0 - Soporte de joystick / gamepad (Opción A)

- **Gamepad API por polling** (`GestorEntrada.actualizarGamepad()`, llamado 1 vez por frame desde `Game._gameLoop`): reconstruye el estado del mando en cada frame (así soltar un botón lo libera solo, sin manejar eventos de "keyup").
- **Mapeo (layout "standard", tipo Xbox)** — mantiene el modelo actual (apuntás y acelerás *hacia* donde apuntás):
  - **Stick derecho** (`axes[2]/[3]`) → apunta la nave (equivale al mouse). Con **zona muerta** de 0.25 para que no derive. Si el stick vuelve al centro, la nave conserva el último ángulo.
  - **RT (7) / A (0)** → acelerar · **LT (6) / X (2)** → disparar
  - **B (1)** → Ulti · **LB (4)** → Devorador · **RB (5)** → Cohetes · **Y (3)** → Propulsor
- **Cómo encaja (clave)**: las acciones del mando van a un `Set` (`gamepadAcciones`) que se **OR-ea en `estaPresionada()`** → como todos los `debeXxx()` consultan ese método, el joystick quedó soportado en disparo/aceleración/ulti/cohetes/devorador/propulsor **sin tocar esos métodos**. El apuntado analógico expone `gamepadApuntando` + `gamepadAngulo`, y `Player.update` los usa con prioridad sobre el mouse.
- **Convive con teclado y mouse**: se usa lo que haya a mano; sin mando conectado no cambia nada.
- Verificado en runtime con la Gamepad API **mockeada**: botones → acciones (RT/X/B), stick der apunta a 45° y la nave rota exactamente ahí, zona muerta OK (no apunta con el stick apenas movido), disparo OK, y sin mando → sin acciones y el mouse sigue mandando. Sin errores. Tutorial actualizado con la fila **JOYSTICK**.

---

## ✅ Completado v1.37.5 - Fix Game Over: reiniciar solo con el botón

- **Bug**: en el Game Over había un "reiniciar al hacer click en cualquier lado" (`stage.on('pointerdown', …)`) + ENTER global. Con la ventana de **NUEVO RÉCORD** abierta, un click/ENTER fuera del input de nombre reiniciaba el juego **por debajo** mientras se ingresaba el nombre → la ventana de récord quedaba huérfana y los botones de Game Over flotando (sistema viejo).
- **Fix** (`Game.gameOver`): se quitaron los dos handlers globales (stage `pointerdown` y window `keydown` ENTER). El reinicio ahora **depende solo del botón Reiniciar** (`btnReiniciar.onclick` ya llamaba a `_limpiarFinJuego()` + `_reiniciarJuego()` por su cuenta). Predecible y sin cruces con el input del récord.
- Verificado en runtime: en Game Over `listeners_pointerdown: 0` (no reinicia por click), y el botón reinicia (`enGameOver: true → false`). Sin errores.

---

## ✅ Completado v1.37.4 - JANOPRO en beta testers + cierre del toroide

- **Créditos** (`UIManager.mostrarCreditos`): se agregó **JANOPRO** a los beta testers (junto a TPC; título a plural "Beta testers").
- **Mapa toroidal cerrado**: los pasos 1 (nave+cámara), A+B (entidades sin costura), C (lógica toroidal + disparos rectos) y el fondo/estrellas continuo fueron **probados y aprobados** por el dev → se **pushean** todos.

---

## ✅ Completado v1.37.3 - Mapa toroidal: fondo/estrellas sin costura

> ✅ Probado y aprobado — **pusheado** con v1.37.4.

- **Parallax continuo** (`Game._actualizarCamara` + `_actualizarEstrellas`): el fondo (`fondoParallax`) y las estrellas se calculaban desde `camX/camY`, que **salta ~mundo entero** cuando la nave envuelve su posición → el fondo/estrellas pegaban un salto en el cruce. Ahora se usa un **acumulador continuo** `_shipContX/_shipContY` (suma el delta de la nave "por el camino corto", que ya se calcula para el look-ahead) y de ahí `_bgX/_bgY` (= acumulador + look-ahead − media pantalla). El parallax usa `_bgX/_bgY` en vez de `camX/camY` → **nunca salta**, con cualquier imagen (no depende de que el fondo sea simétrico/tileable). En modo no toroidal se sigue usando `camX/camY` (cámara clampeada). Se resetean los acumuladores en setup/reinicio.
- Verificado: en el cruce `camX` salta −2318 pero `_bgX` cambia solo +15.5 (el movimiento real) → continuo. Sin errores.
- **Con esto el toroide se ve fluido de punta a punta.** Ya no queda salto visual al cruzar.

---

## ✅ Completado v1.37.2 - Mapa toroidal (paso C: lógica toroidal + disparos rectos)

> ✅ Probado y aprobado — **pusheado** con v1.37.4.

- **Disparos enemigos rectos** (`EnemyProjectile`): se sacó la teledirección y el evita-asteroides. La nave apunta al jugador al disparar y el proyectil viaja en línea recta (verificado: dirección constante, se mueve exactamente en el ángulo de disparo).
- **Naves enemigas** (`EnemyShip`): puntería, destino de órbita y esquiva de asteroides usan la posición del jugador/asteroide por el **camino corto** del toroide (helper `_wrap` inline con `this.anchoJuego/altoJuego`).
- **Boids** (`BoidParticle`, `GameBoids`, `GameSkills`): fuga de la nave (`calcularFuga`), captura (`puedeSerCapturada`), reset/reciclado de atracción y la **atracción del devorador** usan distancia/delta toroidal (`distanciaToroidal` / `_wrapDelta` guardado por el flag).
- **Cohetes** (`Cohete`): homing y colisión toroidales (se le pasa `mundoAncho/Alto` al crearlo en `GameSkills`). Verificado: cerca de un borde apunta por el lado corto (π), no el largo.
- **Spawn** (`verificarPosicionLibre`): distancia toroidal (no spawnea encima del jugador vía wrap).
- **Colisiones y culling**: ya eran toroidales desde A+B (`_verificarColision`, `limpiarEnemigosLejanos`).
- **Nota**: el "salto" visual que queda al cruzar el borde es del **fondo + estrellas** (manejados por `camX`, que salta al envolver la nave), NO de las entidades. Es un tema aparte pendiente (hacer que el fondo/estrellas también envuelvan continuo); la imagen de fondo la ajusta el dev.

---

## ✅ Completado v1.37.1 - Mapa toroidal (paso A+B: sin costura + todo envuelve)

> ✅ Probado y aprobado — **pusheado** con v1.37.4.

- **Helpers** (`Game`): `_wrapDelta(d, size)` (delta por el camino corto), `distanciaToroidal(ax,ay,bx,by)` (distancia toroidal, o euclidiana si el flag está off).
- **A + B centralizado** (`Game._actualizarToroide`, llamado al final del loop tras mover/generar): por cada entidad (asteroides, especiales, naves, proyectiles, proyectiles enemigos, boids, cohetes) **(B)** envuelve `x/y` módulo mundo y **(A)** ubica el sprite en la copia más cercana a la nave (`imagen = nave + wrapDelta(e - nave)`) → sin costura. La nave ya envolvía (v1.37.0); su sprite queda en el centro y el resto se dibuja alrededor.
- **Culling toroidal** (`GameEnemies`: asteroides, naves, `limpiarEnemigosLejanos`): usa `distanciaToroidal` para no borrar enemigos que están cerca por el wrap.
- **Spawn** (`Game._puntoSpawnFueraDeVista`): en toroidal no clampea (deja que el paso toroidal envuelva), así aparecen fuera de vista aunque la nave esté en un borde del mundo.
- **Colisiones toroidales** (`Game._verificarColision`): mínimo necesario de C traído para que sea jugable — sin esto, cerca del borde atravesarías cosas que se ven pegadas. Casi todas las colisiones pasan por acá.
- Verificado: asteroide en `x≈W` renderiza a la izquierda de la nave (copia cercana), posición envuelta a `[0,W)`, distancia/colisión toroidales OK, juego a 60 FPS sin errores.
- **PENDIENTE (paso C, lo que falta):** que la **lógica de comportamiento** use el camino corto — puntería de naves enemigas, atracción del **devorador** (boids), **cohetes teledirigidos**. También: los **efectos** (explosiones) todavía no se dibujan envueltos (son breves), y los asteroides **rezagados** ya no se auto-borran en el borde (envuelven).

---

## ✅ Completado v1.37.0 - Mapa toroidal (paso 1: nave + cámara)

> Nota: v1.37.0 fue el primer paso del toroide; probado y aprobado, pusheado con v1.37.4.

- **Flag** (`config.js` → `CONFIG.MUNDO.TOROIDAL = true`): activa el mundo toroidal (wrap-around).
- **Nave** (`Player._mantenerEnPantalla`): en modo toroidal, en vez de clampear, **envuelve** la posición módulo el tamaño del mundo (sale por un borde, entra por el opuesto), en X e Y. Verificado: cruzar der→x=8, izq→W-8, abajo→y=8.
- **Cámara** (`Game._actualizarCamara`): en modo toroidal **no clampea** (sigue a la nave aunque cruce el borde, así queda centrada al envolver). El look-ahead calcula el delta de posición por el **camino corto** (si la nave envolvió, corrige el salto de ~mundo entero) para no dispararse en el cruce. Verificado: camX sin clamp (−375), nave centrada (mundoX 376), lookX ~5.5 (no 110), sin errores.
- **PENDIENTE (próximos pasos si gusta el feeling):**
  - Render **sin costura**: hoy en el cruce hay un "salto" visual de asteroides/fondo (fantasmas del lado opuesto sin dibujar todavía).
  - **Distancia toroidal** en la lógica: IA de enemigos, boids, cohetes teledirigidos, colisiones y auto-borrado. Hoy los enemigos/asteroides/boids NO envuelven (siguen en `[0, mundo]`).

---

## ✅ Completado v1.36.2 - Botón "Volver" otro 25% más chico

- **Tamaño del botón Volver** (`UIManager.crearBotonVolver`): `width` 240px → **180px** (−25% otra vez, natural 320px). Verificado en runtime (renderW 180).

---

## ✅ Completado v1.36.1 - Botón "Volver" más chico

- **Tamaño del botón Volver** (`UIManager.crearBotonVolver`): se le puso `width: 240px; height: auto` (antes usaba el natural del PNG, 320×120) → **−25%** (240×90). Afecta a todas las ventanas que lo usan (Opciones, Controles, Top 5, Créditos). Verificado en runtime (renderW 240).

---

## ✅ Completado v1.36.0 - Controles configurables (config + remapeo en Opciones)

- **Archivo de config** (`config.js` → `CONFIG.CONTROLES`): cada acción tiene `{label, teclas:[codigos]}`. Los códigos son teclas (`KeyW`, `Space`, `ArrowUp`, ...) o botones del mouse (`MouseLeft`, `MouseRight`). Editar un control = cambiar una línea.
- **InputManager refactorizado** (`systems/InputManager.js`):
  - El `mapeoTeclas` se construye desde `CONFIG.CONTROLES` con override de `localStorage` (`controlesJEE`). Se sacó el diccionario hardcodeado y los booleanos `mouseIzquierdo/mouseDerecho`: los botones del mouse ahora son bindings normales (`MouseLeft/MouseRight`) que entran al mismo `Map` de teclas → `debeDisparar`/`debeAvanzar` solo consultan `estaPresionada`.
  - Métodos **estáticos** (funcionan sin instancia, para la UI del menú): `defaultControles`, `cargarControlesConfig`, `guardarControlesConfig`, `reasignarEn`, `restaurarControlesConfig`, `nombreCodigo`. Wrappers de instancia: `obtenerControles`, `reasignarControl`, `restaurarControles`, `recargarControles`. El apuntado con el mouse (posición del cursor) sigue fijo.
- **Pantalla CONTROLES en Opciones** (`UIManager.mostrarControles` + botón en `mostrarOpciones`): lista cada acción con sus bindings (vía `nombreCodigo`); al hacer clic en una acción entra en captura y toma la próxima tecla/click (Escape cancela); resuelve conflictos (saca el código de otra acción); botón **Restaurar por defecto**; guarda en localStorage y, si hay partida en curso, avisa al `gestorEntrada` para que recargue al instante. Funciona en el menú aunque todavía no exista una partida (usa los estáticos).
- Verificado en runtime: mapeo desde config OK, disparo/acelerar por el camino unificado, reasignar (Ulti→M, guardado) y restaurar (vuelve a S·↓, limpia localStorage), sin errores.

---

## ✅ Completado v1.35.3 - Botones del tutorial anclados + docs

- **Botones del tutorial** (`UIManager.mostrarTutorial`): el contenedor tiene alto fijo (700px) con `justify-content: center`, así que el bloque completo (contenido + progreso + botones) se centraba y **los botones Anterior/Siguiente cambiaban de altura según el contenido de cada página** (y podían superponerse en las páginas cargadas). Fix: el `contenido` ahora es `flex: 1 1 0; min-height: 0; overflow-y: auto` con centrado interno → empuja progreso y botones **siempre al fondo** (misma ubicación en las 5 páginas) y, si una página tuviera demasiado contenido, scrollea en su área en vez de solaparse. Verificado en runtime (páginas 1/3/5: botones a la misma altura, sin overlap).
- **Documentación**: `SPEC.md` § Mecánicas Principales actualizado a los controles de mouse (apuntar con mouse, click der acelera, click izq dispara). `GDD.md` se dejó como está (es changelog histórico de commits).

---

## ✅ Completado v1.35.2 - Disparo: +velocidad, -alcance

- **Balance del proyectil** (`config.js` → `PROYECTIL`): `VELOCIDAD` 600 → **800 px/s** y `TIEMPO_DE_VIDA` 2 → **0.75 s**. Alcance = 800 × 0.75 = **600 px** (mitad de los 1200 previos). Verificado en runtime.

---

## ✅ Completado v1.35.1 - Fix: efecto de giro detrás de la nave

- **Z-order del efecto de giro** (`Player._crearEfectoRotacion`): el efecto azul se dibujaba ENCIMA de la nave. Causa: `mundo.sortableChildren = true` ordena por `zIndex` e ignora el índice de `addChildAt(1)`; el efecto y la nave tenían `zIndex 0` y, al agregarse el efecto después, quedaba arriba. Fix: `hit.sprite.zIndex = -1` + `addChild` → siempre detrás de la nave (zIndex 0). Verificado en runtime (efectoZIndex −1 < naveZIndex 0, nave sin blob encima).

---

## ✅ Completado v1.35.0 - Control con apuntado al mouse

- **Nuevo esquema de control** (mouse):
  - `InputManager`: se agregó tracking del mouse (`mouseX/Y` en coords del canvas vía `_rectCanvas`, `mouseMovido`, `mouseIzquierdo`, `mouseDerecho`) con listeners `mousemove`/`mousedown`/`mouseup` y `contextmenu` (preventDefault, para que el click derecho no abra el menú). `debeDisparar` ahora acepta **click izquierdo** o Espacio; `debeAvanzar` acepta **click derecho** o W. `reiniciar`/`deshabilitar` sueltan los botones.
  - `Player.update`: la rotación por A/D se reemplazó por **apuntado al mouse** — `rotacion = atan2(mouseY - naveEnPantallaY, mouseX - naveEnPantallaX)`, usando la pos de la nave en pantalla (`this.x + juego.mundo.x`) para que sea exacto con cámara/shake. El efecto de giro azul ahora se dispara cuando cambia el ángulo (umbral 0.05 rad). No apunta durante el dash (propulsor).
  - Consistencia: como los proyectiles y el thrust usan `this.rotacion`, disparás y acelerás **hacia el cursor**.
  - Tutorial (`UIManager.filasControles`) actualizado: MOUSE / CLICK IZQ / CLICK DER / W-ESPACIO (alternativo).
- Verificado en runtime: apuntado coincide con `atan2` (2.952 ≈ 2.953), thrust sube la velocidad (23→103 con click der), disparo crea proyectil (0→1 con click izq), sin errores. A/D quedaron sin uso (mapeados pero ignorados).

---

## ✅ Completado v1.34.5 - Chips de mejora de la columna derecha en espejo

- **Placa espejada en la derecha** (`PixiHUD._dibujarChipMejoras`): el marco ya estaba espejado entre columnas, pero la placa (pips + precio + botón de compra) se dibujaba igual en las dos → en la izquierda el botón quedaba pegado al icono y en la derecha en el borde de afuera (asimétrico). Ahora se espeja el contenido de la placa en la columna DERECHA (`espejarPlaca = !espejo`, con `fracX(f) = 1 - f`): imagen de la placa con `scale.x` negativa (origen +imgW), y pips/botón/precio con la frac X invertida. El icono de la habilidad NO se movió. Verificado en runtime: tooltip OK, compra OK (pips llenan en orden espejado), sin errores.

---

## ✅ Completado v1.34.4 - Fuente del tooltip: Comic Sans MS

- **Cambio de fuente** (`PixiHUD._crearTooltipMejora`): título, descripción y precio del tooltip pasan de `'Segoe Script, cursive'` a `"'Comic Sans MS', 'Comic Sans', cursive"`. Solo afecta al tooltip de mejora (el resto del HUD/menús sigue en Segoe Script/Arial). Verificado en runtime.

---

## ✅ Completado v1.34.3 - Tooltip se refresca al comprar

- **Refresco inmediato** (`PixiHUD._comprarMejoraCuadrante`): tras una compra `'ok'`, si el tooltip está visible se vuelve a llamar `_mostrarTooltipMejora(g)` para recalcular pips (nivel), precio del próximo nivel y color (bajó el saldo). Antes el tooltip quedaba con la info vieja hasta sacar y volver a poner el cursor. Verificado en runtime: precio 5→15, nivel 0→1, saldo descontado, sin re-hover.

---

## ✅ Completado v1.34.2 - Colores del precio del tooltip

- **Recoloreado del precio** (`PixiHUD._mostrarTooltipMejora`): se sacaron el verde y el rojo. Ahora: **azul claro pastel** (`0x6FA8DC`) = se puede comprar, **negro** (`0x1A1A1A`) = no alcanza, **azul** (`0x0B2E6B`, el del título) = MAX/completo. Más acorde a la paleta de tinta (azul/negro sobre papel). Verificado en runtime los tres estados.

---

## ✅ Completado v1.34.1 - Tooltip de mejora mejorado

- **Rediseño del globo** (`PixiHUD._crearTooltipMejora` / `_mostrarTooltipMejora`): además del nombre + descripción, ahora muestra:
  - **Nivel como pips**: 5 puntitos (círculos) que se llenan de azul según los niveles comprados (antes era texto "Nivel n/5").
  - **Precio coloreado por disponibilidad**: verde (`0x0A7D2C`) si `particulasCapturadas >= precio`, rojo (`0xCC0000`) si no alcanza, o **MAX** en azul (`0x0B2E6B`) si la sección está completa.
  - **Flecha** (triángulo) que apunta al icono del chip (a la derecha si el tooltip está a la izquierda del icono y viceversa), dibujada solapando el borde de la caja para que no quede costura.
  - **Línea separadora** bajo el título.
  - El tooltip ahora reúne `{ c, bg, titulo, desc, pips[5], precio }`; la fila inferior es pips (izq) + precio (der, ancla derecha).
- Verificado en runtime con hover real: estados verde/rojo/MAX correctos, pips reflejan el nivel, se muestra/oculta bien, sin errores en consola.

---

## ✅ Completado v1.34.0 - Tooltip en los chips de mejora del HUD

- **Globo de ayuda al pasar el cursor** (`PixiHUD`): al hacer hover sobre el icono de una mejora (`upgradeSprite`) aparece un tooltip con el **nombre**, **qué hace**, el **nivel actual (n/5)** y el **costo del próximo nivel** (o **MAX** si está completa). Se oculta al sacar el cursor (`pointerover`/`pointerout`).
  - Nuevos métodos: `_crearTooltipMejora()` (lo agrega el creador en `_inicializar`, último → encima de todo, en `this.container` = espacio de pantalla escala 1), `_infoMejora(seccion)` (mapa sección→[nombre, descripción]), `_mostrarTooltipMejora(g)` (arma texto + caja auto-ajustada + posiciona junto al icono usando `getGlobalPosition`; columna derecha → a la izquierda del icono y viceversa, con clamp a pantalla) y `_ocultarTooltipMejora()`.
  - Estilo tinta de birome sobre papel: fondo papel (`0xFBF7EC`), borde y título azul (`0x0B2E6B`), descripción negra, fuente `Segoe Script`.
  - El tooltip viejo vivía en `GameMejoras.js` y se había borrado en la limpieza (v1.32.1); este es el reemplazo para el HUD nuevo de chips.
  - Verificado en runtime: texto correcto por sección, posición por columna, se muestra/oculta bien, sin errores en consola.

---

## ✅ Completado v1.33.2 - Naves del menú: pasean y se esquivan

- **Animación del menú rehecha** (`UIManager._animarNavesMenu`): antes las enemigas ORBITABAN a la aliada y un empuje de separación las hacía amontonar/chocar. Ahora las 4 naves (1 aliada Nave322 + 3 enemigas enimigo1) **pasean de forma independiente** (rumbo y velocidad propios → recorridos distintos) y se **esquivan** con steering (giran hacia el lado opuesto cuando otra entra en un radio de 95px) → se evitan antes de tocarse, sin choques. Siguen respetando el borde de la zona de botones y los bordes de la pantalla. Verificado: distancia mínima entre naves ~69px (no se chocan), nunca entran en los botones, y cada una recorre distinto.

---

## ✅ Completado v1.33.1 - Estrellas que titilan

- **Campo de estrellas con titileo** (`Game._crearEstrellas`, `_actualizarEstrellas`, `_crearTexturaPuntoEstrella`): se reemplazó el `TilingSprite` estático de estrellas por **90 estrellas individuales** (sprites), cada una con su fase y velocidad de titileo. El brillo oscila con `sin²` (pasa más tiempo apagada) y cuando baja de 0.03 la estrella se pone `visible=false` (no se ve). Mantienen el parallax (factor 0.85) con wrap por módulo para cubrir siempre la pantalla. Verificado: los brillos cambian de forma independiente y varias quedan apagadas.

---

## ✅ Completado v1.33.0 - Pulido de cámara + naves del menú acomodadas

### Cámara (`Game._actualizarCamara`, ahora recibe `delta`)
- **Screen shake** (`Game.sacudirCamara(magnitud, duracion)`): agrega un offset aleatorio que decae al `mundo`. Se dispara al **recibir daño** (`Player.recibirDano`, magnitud 7) y al lanzar la **Ulti** (`Game.activarUlti`, magnitud 14).
- **Look-ahead**: la cámara se adelanta hacia donde se mueve la nave. La velocidad se estima por delta de posición (independiente del modelo interno) y el offset se suaviza (lerp).
- **Parallax** (`Game._crearFondo` reescrito): en vez de un mosaico pegado al mundo, dos `TilingSprite` **fijos a la pantalla** (debajo del mundo) cuyo `tilePosition` se desplaza a una fracción de la cámara (fondo 0.5×, estrellas 0.85× vía textura generada en `_crearTexturaEstrellas`) → sensación de profundidad. Verificado: las capas se mueven más lento que el mundo.
- **Escudo curvo** (`PixiHUD._actualizarEscudoCurvo`): ahora usa `mundo.x + jugador.x` (posición real en pantalla), así sigue a la nave incluyendo el shake y el look-ahead.

### Naves decorativas del menú (`UIManager._animarNavesMenu`)
- **Fuera de la zona de botones**: se mide el borde izquierdo de la columna de botones y las naves se mantienen a la izquierda de él (la aliada gira hacia el centro del área jugable, las enemigas se clampean).
- **Sin superponerse**: pase de separación que empuja las naves que quedan demasiado cerca (la aliada tiene prioridad). Verificado: distancia mínima ~60px, nunca entran en los botones.

---

## ✅ Completado v1.32.1 - Limpieza de código muerto (~1925 líneas)

Limpieza sin cambios de comportamiento (verificada en runtime: game loop, spawn, colisiones, compra de mejoras, pausa y captura de partículas siguen andando; ~0.31 ms/frame bajo carga pesada; sin errores de consola).

- **`Game.js` 3252 → 2066 líneas**: se borraron métodos duplicados que ya vivían en los módulos `sistemas/` y no tenían ninguna llamada: `_procesarColisionesProyectiles`, `_procesarColisionesJugador`, `_procesarColisionesEnemigos`, `_destruirYFragmentar`, `_generarEnemigo`, `_crearParticulaBoidCercaDe`, `_verificarPosicionLibre`, `_encontrarEnemigosCercanos`, `_capturarParticulaBoid`, `_verificarColisionesParticula`, `_mantenerParticulaEnPantalla`. Se conservaron los vivos intercalados (`_sonidoCapturaBoid`, `_verificarColision`, `gameOver`, etc.).
- **`GameMejoras.js` 685 → 37 líneas**: se eliminó la ventana de mejoras vieja (modal centrado, deshabilitada desde que existen los chips del HUD): `crearVentanaMejoras`, `comprarMejora`, `actualizarUIMejoras`, `limpiarVentanaMejoras` y sus helpers. Quedó solo `inicializarMejoras` (lo único que se usa).
- **`ObjectPool.js` eliminado** (91 líneas, sin uso) + se quitaron `this.poolProyectiles`/`poolParticulasBoid` (siempre en null) y el import.
- **15 logs de debug comentados** (`//(...)`) borrados de Game.js.

---

## ✅ Completado v1.32.0 - Cámara/mundo grande + naves decorativas en el menú

### Cámara + mundo explorable (Game.js y sistemas)
- **Contenedor `this.mundo`** (creado en `init`, tamaño `mundoAncho/Alto = pantalla × 3`): todos los objetos del juego (fondo, nave, enemigos, partículas, proyectiles, cohetes, efectos) se renderizan dentro de él. El HUD (`PixiHUD`) y los overlays (Game Over, Top 5, mejoras) quedan en el `stage`, fijos a la pantalla.
- **Cámara** (`Game._actualizarCamara`): cada frame desplaza `this.mundo` para centrar la nave, clampeando a los bordes del mundo. La nave se mueve con **límites del mundo** (`_crearJugador` la crea en el centro del mundo con `mundoAncho/Alto`).
- **Fondo**: cubre todo el mundo (mosaico) y se movió a `this.mundo`; se desactivó el auto-scroll (la cámara da el movimiento).
- **Spawn relativo a la cámara** (`Game._puntoSpawnFueraDeVista`): asteroides, naves, especiales y partículas aparecen justo afuera de lo que ve la cámara (alrededor de la nave), no en una esquina fija.
- **Culling por distancia a la nave** (`GameEnemies`): enemigos/naves/partículas se eliminan/reciclan según la distancia al jugador, no contra los bordes de pantalla. Las naves disparan cuando están dentro de la vista de la cámara.
- **Reinicio** (`_reiniciarJuego`): `stage.removeChildren()` sacaba el mundo; ahora se recrea `this.mundo` y se resetea la cámara.

### Fixes de coordenadas (todo lo que "desaparecía")
- **Entidades con el tamaño del MUNDO**: `Proyectil`, `EnemyProjectile`, `Enemigo`, `EnemyShip`, `SpecialEnemy` reciben `mundoAncho/Alto`; así su auto-eliminación/reciclado interno usa el mundo, no la pantalla (sino se borraban apenas creados en coords de mundo).
- **Disparos del jugador**: además del check interno, `GameProjectiles.actualizarProyectilesJugador` los eliminaba fuera de **pantalla** → ahora usa el mundo.
- **Cohetes** (`GameSkills.actualizarCohetes`): se autoeliminaban fuera de pantalla (nacen en la nave, en coords de mundo) → se borraban en el 1er frame (sonaba pero no se veían ni impactaban). Ahora usan los límites del mundo.
- **Efectos del jugador** (`Player.js`): el efecto de impacto/escudo (`damageEffect`) y la partícula de rotación (`_crearEfectoRotacion`) se agregaban al `stage` con coords de mundo (descolocados) → ahora al `mundo`.
- **Escudo curvo del HUD** (`PixiHUD._actualizarEscudoCurvo`): vive en el stage (pantalla) pero seguía a la nave por coords de mundo → se convierte restando el offset de cámara.

### Decoración del menú principal (UIManager)
- **`_animarNavesMenu`**: una nave aliada (`Nave322.png`) "pasea" por el menú (deriva suave, gira despacio hacia el centro cerca de los bordes) y 3 naves enemigas (`enimigo1.png`, tamaño similar a la aliada) la **orbitan con recorridos distintos** (radio y velocidad angular propios, sentidos alternos), girando gradualmente (curvas naturales). Viven en una capa `pointer-events:none` detrás de los botones. La rotación usa el rumbo directo (el arte apunta a la derecha). Al darle JUGAR (`ocultarMenuPrincipal`) se cancela el `requestAnimationFrame` y desaparecen con el menú.

Verificado en runtime: nave centrada por la cámara, enemigos spawnean cerca, disparos/cohetes visibles e impactando, escudo en su lugar, reinicio OK, y las naves del menú con recorridos distintos que se limpian al jugar.

---

## ✅ Completado v1.31.0 - Asteroides sueltan partículas + botones del tutorial

- **Asteroides sueltan partículas al destruirse** (nuevo `GameBoids.soltarParticulasEn(game, x, y, cantidad)`; llamado desde `GameProjectiles.procesarColisionesProyectiles`): al destruir un asteroide normal con un proyectil, salen partículas Boid **en su posición** con velocidad al azar (large/rezagado1 → 3, medium/rezagado2 → 2, resto → 1). Respeta `BOIDS.MAX_PARTICULAS`. Antes el texto del tutorial decía que los asteroides soltaban partículas pero no lo hacían; ahora sí. Verificado: destruir un medium spawnea 2 partículas en (x,y) del asteroide.
- **Botones del tutorial** (`UIManager.mostrarTutorial`): Anterior/Siguiente no reproducían sonido → se les agregó `this._click()` (igual que los demás botones). Además se achicaron a `width:150px` (antes ~330px) para entrar mejor en el marco. Verificado: click → 1 reproducción de audio; ancho 150px.

---

## ✅ Completado v1.30.0 - Tutorial refrescado con íconos + contenido corregido

Enfoque "A" (refresco visual del modal de 5 pasos, `UIManager.mostrarTutorial`):

- **Contenido corregido** (estaba desactualizado tras los cambios de mejoras):
  - **Controles**: se corrigió "Q - Cohetes (aceleración)" → "Q — Cohetes teledirigidos" (aceleración es W). Cada tecla se muestra como badge y las habilidades (Q/E/R) llevan su ícono real.
  - **Mejoras**: se quitó la vieja "AUMENTO DE VELOCIDAD" y se listan las **8 habilidades** en una grilla de 2 columnas, cada una con su ícono (`proyectil1`, `escudo1`, `ultiicon1`, `tiempo fuera`, `aceleracion`, `propulsor`, `deborador`, `cohetes`) y su efecto.
  - **Sobrecalentamiento**: "25 segundos" → "10 segundos" (según `CONFIG.ESCUDOS.DURACION_SOBRECALENTAMIENTO`).
  - **Objetivo/Partículas**: reescritos más cortos + íconos (asteroide, Pboids, nave).
- Se quitó el título redundante del paso (`paso.titulo`): cada `contenido` ya trae su propio título, y el doble título se cortaba arriba en el marco fijo.
- Verificado en runtime: los íconos cargan en cada paso; Controles y Mejoras entran sin cortarse; sin errores de consola.

---

## ✅ Completado v1.29.0 - Créditos con Diseño Artístico + precio "MAX"

- **Créditos** (`UIManager.mostrarCreditos`): se agregó la sección **"Diseño Artístico"** con Braian Zapater, Copilot y Chat GPT. Para que siguiera entrando bien en el marco, se compactó el contenido (fuente 18→16, márgenes de sección 20→10, padding 70→40, título 28→26). Verificado: la ventana pasó de ~750px a **731px** de alto (entra igual/mejor que antes; en viewport 820 queda centrada).
- **Precio "MAX"** (`PixiHUD._refrescarPrecio`): cuando una sección está maximizada (`_precioMejora` devuelve null), el rectángulo de precio muestra **"MAX"** en vez de quedar vacío. Verificado: maximizar Proyectil (5 niveles) → precio "MAX"; una sección sin maximizar sigue mostrando el número.

---

## ✅ Completado v1.28.0 - Barra de aceleración escala con mejoras + pips más resaltados

- **Barra de aceleración** (`PixiHUD._actualizarBarraAceleracion` y `_dibujarBarraEscudo`): calculaban el llenado con `cargaAceleracion / 100` fijo, pero la mejora de Aceleración sube `jugador.cargaMax` (hasta 300). La barra se llenaba al 100% con carga 100 aunque faltara mucho para sobrecalentar. Ahora usa `cargaAceleracion / (jugador.cargaMax || 100)`, así se ajusta al máximo actual. Verificado: cargaMax 300, carga 150 → 50%.
- **Pips más resaltados** (`PixiHUD._pintarPip`): el chip prendido pasa de blanco a `alpha 0.6` → **blanco pleno `alpha 1` y 1.2× de tamaño**; el apagado queda negro `alpha 0.45`. Verificado: pip prendido width 13.3 / alpha 1, apagado 11 / alpha 0.45.

---

## ✅ Completado v1.27.0 - Precios de mejoras nuevos + fix vida no se resetea

- **Precios** (`config.js`): Aceleración `[10,20,30,40,50]`, Propulsor `[10,20,30,40,50]`, Cohetes `[20,25,30,35,40]`, Devorador `[30,35,40,45,50]`.
- **Bug: comprar cualquier mejora reseteaba la vida al máximo.** `Game.aplicarMejoras` (que corre en cada compra) hacía `jugador.escudos = escudosMax`, curando al full con cualquier mejora. Ahora solo actualiza el máximo y clampea (`escudos = min(escudos, escudosMax)`). La cura al comprar la **mejora de escudo** se movió a `comprarMejoraSeccion` (solo sección 5, +`ESCUDO_RESTAURACION` = 50).
- Verificado en runtime: con vida en 40, comprar Aceleración/Cohetes deja la vida en 40; comprar Escudo la sube a 90 (+50) y el máximo a 150.

---

## ✅ Completado v1.26.0 - Mejoras para Aceleración, Propulsor, Devorador y Cohetes

Se agregaron las 4 secciones de mejora que faltaban (el sistema pasa de 4 a **8 secciones × 5 = 40 mejoras**). La UI del HUD ya era genérica: alcanzó con asignar `mejoraSeccion` a los cuadrantes y sumarlos al loop de refresco.

- **Índices**: 20-24 Aceleración, 25-29 Propulsor, 30-34 Devorador, 35-39 Cohetes (`GameMejoras.inicializarMejoras` → `Array(40)`; costos en `CONFIG.MEJORAS.COSTOS_*`).
- **Efectos** (`Game.aplicarMejoras`, leídos por las habilidades):
  - **Aceleración**: `jugador.cargaMax = 100 + 40·nivel` (más tiempo antes de sobrecalentar; hasta 300 = 3×). Lee `Player`.
  - **Propulsor**: `gestorEntrada.enfriamientoPropulsorMax = max(3, 15 − 2·nivel)` (−2 s por mejora).
  - **Devorador**: `game.mejoraDevoradorMult = 1 + 0.4·nivel` (hasta ×3 = +200%). Escala `DEVORADOR_RANGO` y `DEVORADOR_VELOCIDAD` en `GameSkills` y `RANGO_RESET_ATRACCION` en `GameBoids` (sino el reseteo cancelaba la atracción de largo alcance).
  - **Cohetes**: `game.mejoraCohetesExtra = nivel` (+1 objetivo/cohete por mejora). Lo suma `GameSkills` a `COHETES_CANTIDAD`.
- **HUD** (`PixiHUD._posicionarIconosLaterales` + `_actualizarPreciosMejora`): `this.nuevo`=20, `this.propul`=25, `this.deborador`=30, `this.cohetes`=35, y los 4 sumados al loop de precios/pips/iluminación.
- **Costos elegidos** (no venían en la consigna): Aceleración [30,40,50,60,80], Propulsor [40,50,60,70,90], Devorador [40,50,60,70,90], Cohetes [50,60,70,80,100].
- Verificado en runtime: `mejoras.length=40`; comprar las 5 de cada sección da los efectos (cargaMax 100→300, propulsor 15→5, devMult 1→3, cohetesExtra 0→5); el panel muestra chips/precio/upgrade en los 8 cuadrantes y la compra prende pips + descuenta partículas.

---

## ✅ Completado v1.25.0 - Fix: contador de partículas se actualiza al comprar mejora

- **Bug**: al comprar una mejora, el contador de partículas del HUD (`contadorDevoradorText`) no bajaba hasta salir del panel de compra. Causa: el panel de mejoras pausa el juego, y `_actualizarContadorDevorador()` corre en el loop `actualizar()` del HUD, que no se ejecuta durante la pausa. El precio bajaba (`comprarMejoraSeccion`) pero el texto quedaba congelado.
- **Fix** (`PixiHUD._comprarMejoraCuadrante`): tras una compra 'ok' se llama `_actualizarContadorDevorador()` de inmediato (además de `_actualizarPreciosMejora()`), así el contador refleja el saldo al instante aunque el juego esté pausado.
- Verificado en runtime: 500 → comprar (costo 5) → el HUD muestra "495" sin salir del panel.

---

## ✅ Completado v1.24.0 - Proyectil del jugador a la mitad de tamaño

- **Proyectil más chico** (`Projectile.js`): `escala` 0.175 → 0.0875 y `radio` (colisión) 6 → 3. Se redujo tanto el tamaño visual como el hitbox para que queden emparejados. Verificado en runtime: con la textura real (364×200) el sprite pasa de ~64×35px a ~32×18px.

---

## ✅ Completado v1.23.0 - Variantes de nave enemiga (spray aleatorio)

- **5 sprites de nave enemiga** (`assets/enimigo1-4.png` + `assets/enemigo5.png`): al generar una nave (`GameEnemies.generarNaveEnemiga`) se elige una textura al azar del array `game.texturasNaveEnemiga` (cargado en `Game._cargarRecursos`). Fallback a `texturaNaveEnemiga` si el array no está.
- `EnemyShip` usa escala uniforme (0.3) y radio de colisión fijo, así que las variantes no se deforman y el gameplay es consistente aunque tengan tamaños ligeramente distintos.
- Verificado en runtime: 12 naves generadas usan varias texturas distintas al azar; sin errores.

---

## ✅ Completado v1.22.0 - Contador de FPS + opción "Mostrar información adicional"

- **Contador de FPS** (`PixiHUD._crearPanelFPS`, `_actualizarPanelFPS`): nuevo texto arriba-derecha con la misma fuente (Arial 12, blanco) que el panel de oleada de arriba-izquierda. Se ancla al borde derecho (`anchor.x = 1`) dentro de un nuevo `contenedorSuperiorDer` posicionado en `_calcularEscala`. Usa `app.ticker.FPS`.
- **Opción "Mostrar información adicional"** (`UIManager.mostrarOpciones` + nuevo `_crearFilaCheck`): casilla en el menú de Opciones que muestra/oculta el conjunto de info (panel de oleada arriba-izquierda + FPS arriba-derecha). El estado se guarda en `localStorage` (clave `infoAdicional`) y el HUD lo lee cada frame en `_actualizarInfoAdicional`. **Por defecto está oculto** (opt-in): antes el panel de oleada se veía siempre; ahora hay que activarlo desde Opciones.
- Verificado en runtime: con la casilla activa se ven "Oleada: … | Faltan: …" (izq) y "FPS: 60" (der); al desactivar se ocultan ambos.

---

## ✅ Completado v1.21.0 - Top 5 de Game Over: marco más grande, Volver no tapa nombres

- **Ventana de Top 5 al perder** (`Game._mostrarTop5`): el botón Volver tapaba las últimas filas/nombres. Se agrandó el marco (`maxWidth` 0.5→0.6, `maxHeight` 0.5→0.62 del canvas) y se redujo un poco el espaciado de filas (`imagenAlto * 0.10` → `0.085`), de modo que las 5 filas terminan más arriba y el botón Volver queda debajo con separación.
- Verificado en 1280×720 con 5 nombres reales: la fila 5 termina en ~y447 y el botón arranca en ~y470 (23px de aire); ningún nombre queda tapado.

---

## ✅ Completado v1.20.0 - Top 5 de Game Over: título proporcional al marco

- **Ventana de Top 5 al perder** (`Game._mostrarTop5`, PixiJS): el encabezado (N°/NOMBRE/PUNTOS/OLEADAS) y las filas se posicionaban con offsets en píxeles absolutos (`imageTop + 30`, filas cada 38px), pero el marco (`gameOver.png`) escala con el tamaño de ventana. Al maximizar, el marco crecía pero el encabezado quedaba pegado arriba (sobre el borde decorativo, ~8% del marco).
- **Fix**: posiciones proporcionales a `imagenAlto` — encabezado a `imagenAlto * 0.17`, primeras filas a `+0.11`, espaciado `0.10`. Así el título baja con el marco y queda con aire arriba en cualquier resolución. Verificado en 1280×720: encabezado al 17% del marco (antes 8%), filas hasta 68%, botón Volver al ~78%, sin solaparse.

---

## ✅ Completado v1.19.0 - JUGAR arriba de la columna de botones

- **Botón JUGAR** (`UIManager.mostrarMenuPrincipal`): se quita el bloque flotante separado y JUGAR pasa a ser el primer botón de la columna derecha (arriba de Tutorial), como estaba originalmente pero dentro de la columna lateral. Los 5 botones quedan apilados: Jugar, Tutorial, Top 5, Opciones, Créditos.

---

## ✅ Completado v1.18.0 - Ajuste fino del layout del menú

- **Botón JUGAR** (`UIManager.mostrarMenuPrincipal`): movido de debajo de la nave (`top: 73%`) a debajo del título "Jugando en el Espacio" de la imagen (`top: 25%`).
- **Columna derecha de botones**: más pegada al borde derecho (`right: 4%` → `right: 1.5%`).

---

## ✅ Completado v1.17.0 - Nuevo fondo de menú, layout de botones y Top 5 reajustado

- **Fondo del menú principal** (`UIManager.mostrarMenuPrincipal`): pasa de `fondoEspacio2.png` a la ilustración `assets/jugando en el espacio.png` (nave + título + asteroides).
- **Layout de botones del menú**: el menú deja de ser una columna centrada. Ahora el botón **JUGAR** va debajo de la nave (centrado horizontal, `top: 73%`, envuelto en un div para que el hover no pise el centrado) y los otros cuatro (Tutorial, Top 5, Opciones, Créditos) van en una columna a la derecha (`right: 4%`, centrada vertical) con menos separación (`gap: 10px`, antes 20px).
- **Botones 20% más chicos**: ancho fijo de 256px (natural 320px).
- **Ventana Top 5** (`UIManager.mostrarTop5`): el título quedaba muy pegado arriba; se subió el `padding-top` del contenido de 70px a 100px (y se bajó el inferior a 60px) para darle más aire arriba.
- Verificado en runtime (el menú y el Top 5 se ven correctos; sin errores de consola).

---

## ✅ Completado v1.16.0 - Ventana de nuevo récord con el marco de las demás ventanas

- **Ventana de ingreso de nombre (nuevo récord) rehecha** (`Game.js`, en `gameOver()`): antes flotaba una imagen `guardarPuuntos.png` con el formulario encima. Ahora el formulario vive dentro del mismo marco `gameOver.png` (border-image 9-slice) y fondo oscuro `rgba(13,13,26,0.9)` que usan Opciones / Top 5 / Créditos / "¿Volver al menú?".
- **Estructura**: overlay a pantalla completa → marco (`border-image`) → contenido en columna con título `¡NUEVO RÉCORD!`, subtítulo `Ingresa tu nombre:`, input y botón de guardar.
- **Input**: borde azul `#0044CC`, `outline:none` (se quitó el anillo de foco naranja del navegador que rompía la paleta), esquinas suaves y fondo blanco tenue para legibilidad.
- Se eliminó la imagen `guardarPuuntos.png` como fondo; `this.bgImageRecord` queda en `null` (la limpieza existente lo tolera). Verificado en runtime: la ventana aparece con el marco correcto y el guardado cierra el formulario y restaura los botones de Game Over.

---

## ✅ Completado v1.15.0 - Explosiones dedicadas por entidad (asteroide rojo / nave verde)

- **Explosión de asteroide (roja)** y **explosión de nave enemiga (verde)** con arte propio de 4 frames (`assets/esplocionRojo1-4.png`, `assets/esplocionVerde1-4.png`), cargadas en `Game._cargarRecursos` como `texturaExplosionAsteroide` y `texturaExplosionNave`. Antes TODAS las destrucciones usaban `texturaAsteroidExplosion` (`explocionAsteroides1-5.png`) tintada por entidad (azul=especial, verde=nave, sin tinte=asteroide).
- **Reemplazo en todos los sitios de destrucción**: se cambió la textura (y se quitó el tinte verde `0x00FF00`, ya innecesario porque el arte ya es verde) en `Game.js`, `GameEnemies.js`, `GameEffects.js`, `GameProjectiles.js`, `GameSkills.js` (cohete: rojo salvo si el objetivo es especial) y `UltiEffect.js`.
- **El asteroide especial conserva su explosión azul** (`texturaAsteroidExplosion` + tinte `0x0000FF`), ya que no se creó arte dedicado para él.
- Verificado en runtime: al destruir un asteroide sale la explosión roja (frame 299px) y al destruir una nave la verde (frame 285px, sin tinte), ambas por las rutas reales de colisión.

---

## ✅ Completado v1.14.0 - Ventanas con marco gameOver.png + fixes de botones y cohete

- **Nuevo marco decorativo en las ventanas** (`UIManager.js`, `Game.js`, `assets/gameOver.png`): Game Over (PixiJS), Opciones, Top 5, Créditos y "¿Volver al menú?" usan `gameOver.png` como marco. Las ventanas DOM usan `border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch` (9-slice: esquinas fijas, bordes estirados) en vez de `background-size:100% 100%`, que deformaba el marco (el aspecto del modal ≠ aspecto de la imagen). El Game Over de PixiJS usa un Sprite con escala uniforme (mantiene proporción).
- **Botones acomodados dentro del marco**: en Game Over los botones (Reiniciar / Top 5) se achicaron a 145px y se centraron en `±90px`, y se subieron a `btnY = yCentro + ancho*0.32` para quedar dentro del interior blanco (antes se superponían y pisaban el borde). En "¿Volver al menú?" (`mostrarConfirmacionSalir`) los botones-imagen (490×120 / 450×120) se achicaron a `height:44px; width:auto` para entrar en el interior (~388px) lado a lado.
- **HUD circular oculto en Game Over** (`Game.gameOver`, `_reiniciarJuego`): el escudo curvo (zIndex del HUD > sprite de Game Over) aparecía por encima de la ventana. Se oculta todo el `pixiHUD.container` durante el Game Over y se restaura al reiniciar.
- **Fix cohete vs asteroide especial** (`GameSkills.js`): al destruir un asteroide especial con el cohete solo se destruía, sin disparar su efecto. Ahora, si el objetivo del cohete es un especial (no en órbita), se genera el mini-asteroide especial en órbita (130px del jugador) igual que con la colisión normal.

---

## ✅ Completado v1.13.0 - Marcos por nivel de mejora + sonidos de compra

- **Marco por tier de mejora** (`PixiHUD._marcoTexturaTier`, `_actualizarMarco`; assets `marcos1..5mejora.png`): el marco de cada habilidad cambia según cuántas mejoras compraste. `marco = max(1, nivel)`, o sea 0-1 mejoras → marco 1, 2 → marco 2, ..., 5 → marco 5 (la 1ª mejora NO cambia el marco, recién la 2ª). Cada marco tiene dims algo distintas, así que se escala (no uniforme) para renderizar siempre al mismo tamaño y quedar alineado con el panel de chips. Las habilidades sin mejora usan siempre el marco 1.
- **Sonidos de compra** (`config.js` → `AUDIO.VOLUMENES.mejora`/`particulasInsuficientes`; `Game._registrarSonidos`, `Game.comprarMejoraSeccion`): al comprar una mejora suena `mejora.mp3`; al intentar comprar sin partículas suficientes suena `particulasInsuficientes.mp3`.

---

## ✅ Completado v1.12.0 - Botones con imágenes PNG

- **Todos los botones del juego migrados de CSS a imágenes PNG**: eliminados `<button>` con gradientes CSS; ahora cada botón usa un `<img>` con su asset correspondiente. Fallback a CSS si la imagen no carga.
- **11 assets nuevos** en `assets/`: `botonJuegar.png`, `botonTutorial.png`, `botonTOP5.png`, `botonOpciones.png`, `botonCreditos.png`, `botonVolver.png`, `botonAnterior.png`, `botonSiguiente.png`, `botonSeguirJugando.png`, `botonVolverAlMenu.png`, `botonReiniciar.png`.
- **UIManager.js**: `crearBotonMenu()` acepta 3er parámetro `imagenSrc`; `crearBotonVolver()` usa `botonVolver.png`; `_crearBotonConfirm()` acepta `imagenSrc` para botones de pausa.
- **Game.js**: Game Over usa `botonReiniciar.png` y `botonTOP5.png`; Top 5 usa `botonVolver.png`. Proporción unificada a 175px de ancho para todos los botones.
- **Tutorial**: botones ANTERIOR/SIGUIENTE migrados a `botonAnterior.png`/`botonSiguiente.png`.
- **Hover consistente**: todos los botones usan `scale(1.1)` + `brightness(1.3)` + `drop-shadow` en hover.

---

## ✅ Completado v1.11.0 - Compra de mejoras desde HUD + iluminación de iconos

- **Compra de mejoras desde los paneles laterales**: clic en el icono de mejora (upgreate) de una habilidad compra el próximo nivel con partículas Boid y **prende el chip** correspondiente. Chips = niveles comprados.
- **Iconos que se iluminan**: las habilidades encienden su icono cuando están disponibles (cohetes/propulsor/devorador sin cooldown, ulti cargada, aceleración no sobrecalentada); los iconos de mejora se iluminan cuando tenés partículas suficientes para comprar.
- **Nueva placa de chips** (`chipDeMejora.png`) encajada al interior del marco; marcos 10% más grandes (70→85px).
- **Quitada la mejora "velocidad de proyectil"** (ahora 4 líneas de mejora: daño, escudo, ulti, tiempo fuera; 20 mejoras en vez de 25).
- **Fixes al reiniciar**: los cooldowns de habilidades se resetean y el stage vuelve a ser interactivo (antes, tras un game over, no se podían comprar mejoras ni quedaban iconos atenuados).
- **Ventana de Mejoras vieja deshabilitada**; el sistema vive en los paneles laterales.

- **Habilidades a columnas laterales** (`_posicionarIconosLaterales`, `_dibujarCuadrante`): los 8 cuadrantes se anclan a los bordes izquierdo/derecho usando el marco `marcos1mejora.png` (el cuadrado del icono queda pegado al borde y el rectángulo del marco sale de pantalla). Izquierda: Tiempo Fuera, Escudo, Proyectil. Derecha: Aceleración (nuevo), Propulsor, Cohetes, Devorador, Ulti.
- **Escudo curvo** (`_crearEscudoCurvo`, `_dibujarBarraEscudo`): 3 barras curvas dibujadas con `.arc().stroke()` (API nativa v8) que siguen a la nave dentro del escudo: aceleración, escudos y el temporizador de Tiempo Fuera. Color sólido `#173B75` (rojo `#002766` al sobrecalentar), 50% de opacidad en reposo y 100% en uso/activa.
- **Marcador superior** (`_crearPanelPuntuacion`, `puntacion-recursos.png` + `upgreate.png`): puntos y recursos en blanco, centrado arriba.
- **Panel de mejoras — chips** (`_dibujarChipMejoras`, `chips de mejora2.png`): al pausar con `P`, las columnas se **despliegan** hacia el centro (`actualizarDespliegue`, con lerp) revelando el rectángulo del marco con la placa de chips. Detrás de cada chip hueco hay un **pip** (cuadrado) que se prende **negro→blanco** al clickear (`eventMode='none'` en la placa para que el click la atraviese). Verificado por lectura de píxeles: prendido `(255,255,255)`, apagado `(0,0,0)`. **Falta** enganchar el pip a la compra real (`comprarMejora`).
- **Iconos nuevos** (`_crearPlaceholders`, `_cargarIconoLateral`): aceleración (`aceleracion.png`, cuadrante arriba-derecha) y proyectil (`proyectil1.png`, abajo-izquierda, temporal). Los iconos ahora **encajan preservando su proporción** (antes se forzaban a cuadrado y se deformaban).
- **Ventana de Mejoras vieja DESHABILITADA** (`Game.js`, handler de `P`): ya no se llama `crearVentanaMejoras`/`limpiarVentanaMejoras`; solo se alterna `mostrandoVentanaMejoras` para desplegar/recoger los paneles. Sin acceso a compra hasta enganchar los pips. Para reactivarla: volver a llamar esas funciones en el handler.
- **Nave 10% más chica** (`Player.js`).

---

## ✅ Completado v1.9.2 - Sistema de audio completo + volúmenes en config

- **SFX conectados** (`Game.js`, `Player.js`, `Enemy.js`, `EnemyShip.js`, `GameSkills.js`, `GameBoids.js`, `UIManager.js`): devorador (E), cohetes (Q), destrucción de asteroide (`Enemy._romper`), destrucción de nave enemiga (`EnemyShip.recibirDano`), recibir impacto (`Player.recibirDano`), captura de partícula Boid (con throttle ~90ms), y click de botones del menú.
- **Música de fondo (en bucle)**: partida (arranca al iniciar/reiniciar) y menú. La del **menú inicial** la maneja `UIManager` (que existe antes que el juego) y arranca en el **primer gesto** del usuario (autoplay del navegador); al volver al menú con Escape la maneja el propio juego. Coordinadas para no solaparse.
- **Volúmenes centralizados** en `src/config.js` → `CONFIG.AUDIO.VOLUMENES`: único lugar para ajustar el volumen de cada pista (lo leen `Game._registrarSonidos()` y `UIManager`). Ver `documentacion/AUDIO.md`.
- Falta solo el archivo de **game over**.

---

## ✅ Completado v1.9.1 - PixiJS local (sin CDN) + sprite del cohete

- **PixiJS vendorizado** (`libs/pixi.min.js`, `index.html`): el juego cargaba PixiJS desde el CDN de jsdelivr; si el CDN fallaba/estaba bloqueado, `main.js` mostraba "PixiJS no está cargado" y el juego (y el sitio en vivo) no arrancaba. Ahora PixiJS v8.19.0 vive en el proyecto y se carga local → sin dependencia del CDN, funciona offline.
- **Sprite real del cohete** (`Game.js`, `Cohete.js`, `assets/cohetes -habilidad.png`): el proyectil de la habilidad Cohetes (Q) usaba un rectángulo rojo procedural; ahora usa la imagen. Fix de orden: la carga se hacía en `_cargarRecursos()` (antes de crear el fallback en `init()`), por lo que el fallback pisaba la imagen; se movió después del fallback. El sprite se dimensiona manteniendo la proporción real (30×10) en vez de forzar 16×8.

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
| **Revisar / mejorar el HUD** (`PixiHUD.js`) — próximo paso, entre otras cosas | 🔜 Próximo | Alta |
| Conseguir e integrar el sonido de **game over** | ⏸️ Pendiente | Baja |
| Análisis manual del flujo del código | ⏸️ Pendiente | Media |
| Eliminar dead code comentado en `_crear*()` de PixiHUD.js | ✅ Hecho | Baja |

---

**Desarrollador:** Braian Zapater  
**Curso:** Programación de Videojuegos 1 - UNAHUR  
**Profesor:** Facundo Saiegh
