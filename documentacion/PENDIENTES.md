# Pendientes - Jugando en el Espacio

**Última actualización:** 13/07/2026  
**Versión:** v1.27.0 (ACTUAL)

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
