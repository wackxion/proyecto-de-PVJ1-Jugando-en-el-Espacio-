# 📋 GDD - Historial de Versiones

**Proyecto:** Jugando en el Espacio  
**Versión actual:** v1.8.0 (ACTUAL)  
**Curso:** Programación de Videojuegos 1 - UNAHUR  
**Profesor:** Facundo Saiegh  
**Desarrollador:** Braian Zapater

---

## 📜 Registro de Commits por Versión

### v1.8.0 (ACTUAL) - Sistema de audio + rediseño de Mejoras
> **Sistema de sonido (GestorSonido) con los primeros SFX · Rediseño completo de la ventana de Mejoras · HUD adaptable y arreglos de overlays/pantallas**

| Commit | Descripción |
|--------|-------------|
| `3ba7bcf` | feat: sistema de audio (GestorSonido, HTML5) + sonido de disparo |
| `817c53d` / `6850aba` / `2ba5839` | feat(audio): ulti, propulsor, sobrecalentamiento (W) y rotura de escudos (en bucle) |
| `7c356ab` / `9acdb81` / `5d582ca` / `4a801eb` | feat(mejoras): estados por color (tinta) + iconos + mini-leyenda + tooltips + mensaje de error |
| `ee0920b` | fix(mejoras): la ventana queda siempre por encima del HUD (zIndex) |
| `44d9355` | feat(hud): anclar el HUD a los bordes reales (adaptable a cualquier proporción) |
| `167da08` / `20c5b34` / `b96b8c2` / `9d00eda` | fix(ui): overlays y pantallas (Game Over, Mejoras, Top 5, Créditos, ventana de récord) |
| `8afdf9c` | balance(ulti): más carga de ulti por enemigo (5→15 / 10→30) |
| `4a801eb` | fix: label de velocidad +10%→+5% acorde al efecto real |

### v1.7.x - HUD PixiJS + Refactor config.js
> **Migración completa del HUD de HTML/CSS a PixiJS canvas · Centralización de balance en config.js**

| Commit | Descripción |
|--------|-------------|
| `8440917` | refactor: eliminar código muerto del HUD DOM migrado a PixiHUD (~1238 líneas) (v1.7.32) |
| - | refactor: config.js — punto único para todos los valores de balance (16 secciones, 87 referencias en 14 archivos) |
| - | fix: encoding de Game.js — 410 caracteres españoles corruptos restaurados (mojibake CP850) |
| - | chore: package.json actualizado (nombre, versión 1.7.31, autor, repositorio) |
| `490cfef` | fix: puntuacion font 16px |
| `d6a1c87` | fix: contador boids +30px right |
| `4f501b7` | feat: iconos 70x70 |
| `41c6f55` | feat: UX image 1000x160 |
| `3f8cde8` | fix: tiempo fuera marco 85x73 igual que los demas iconos |
| `8b31d39` | fix: inicializar tiempo.sprites como array vacio (v1.7.30) |
| `e714612` | feat: implementar _actualizarIconoTiempo() con animacion del reloj (v1.7.29) |
| `ffee008` | chore: comentar codigo muerto en 6 _crear* (v1.7.28) |
| `0671648` | fix: contador boids +10px mas a la derecha (v1.7.27) |
| `7bf16bf` | fix: iconos posicionados exactamente en los slots de la imagen UX (v1.7.3) |
| `6ba343a` | fix: 4 iconos invisibles + marco ULTi dimensiones correctas (v1.6.7) |
| `b7507a6` | fix: ULTi marco visible, icon z-ordering, ULTi dynamic border (v1.6.6) |
| `1b537ed` | v1.6.5: Arrange HUD icons in horizontal row with small gaps |
| `742173a` | v1.6.4: Fix HUD icons positioned too low |
| `3d412ea` | v1.6.3: Fix icons behind UX image + Fix freeze on restart |
| `942d4f2` | v1.6.2: Fix PixiHUD icons not visible and game freeze on restart |
| `bef6aa9` | v1.6.0: Fix HUD disappears on game restart (v1.6.1) |

### v1.5.x
> **Sobrecalentamiento, IA enemiga, limpieza de codigo**

| Commit | Descripción |
|--------|-------------|
| `8f8c8db` | v1.5.2: Ajustes de sobrecarga W (2s aceleracion, 2.5s cooldown), mejorada IA enemigo (100px) |
| `d8c0465` | v1.5.1: Restructuracion de archivos, documentacion organizada, correccion de bugs criticos |
| `b82ba3c` | v1.5.0: Sistema de mejoras expandido (5 secciones, 25 mejoras), tutorial paso a paso |

### v1.5.0
> **Sistema de mejoras expandido, tutorial mejorado, tiempo fuera aumentado**

| Commit | Descripción |
|--------|-------------|
| [latest] | v1.5.0: 5 secciones de mejoras (25 mejoras), tutorial paso a paso, tiempo fuera 25s, debug de mejoras |

### v1.4.6
> **Sistema de Mejoras y mejoras varias**

| Commit | Descripción |
|--------|-------------|
| [latest] | v1.4.6: Sistema de mejoras con ventana, contador de partículas, capture al tocar nave, ULTi achicada |

### v1.4.5
> **SpecialEnemy: movimiento corregido y recycle**

| Commit | Descripción |
|--------|-------------|
| [latest] | v1.4.5: SpecialEnemy movimiento corregido y recycle, fix botones |

### v1.4.4
> **Fix naves enemigas, partículas Boid y Game Over con record**

| Commit | Descripción |
|--------|-------------|
| `b1b4429` | v1.4.4: Fix naves enemigas, partículas Boid y Game Over con record |

### v1.3.5
> **UI mejorada: iconos de habilidades, efectos de escudo**

| Commit | Descripción |
|--------|-------------|
| `fbe7bfb` | v1.3.5 - UI mejorada: iconos de habilidades, efectos de escudo y documentación actualizada |
| `f8aa13b` | Agregado obsidian-desarrollo al gitignore |
| `c8b8112` | v1.3.4 - Iconos UI, botones con imágenes, versión en pantalla, código limpiado |
| `24052fc` | Docs: Actualizado SPEC.md y notas para v1.3 - Movimiento tanque |
| `9ad975d` | Docs: Creados 3 agentes especializados para el proyecto |
| `dad3d39` | Docs: Creada documentación Obsidian y preparada v1.3 |

---

### v1.3.4
> **Iconos UI, botones con imágenes, versión en pantalla**

| Commit | Descripción |
|--------|-------------|
| `2734458` | Docs: Actualizado README.md y SPEC.md para v1.2 |
| `8c5eeed` | Fix: Top 5 posicionado correctamente dentro de la imagen |
| `87dd7e6` | Fix: Botón VOLVER ahora en posición fija |
| `a121bd9` | Fix: Filtrar elementos vacíos/inválidos del Top 5 |
| `c61d30e` | Debug: Más logs para ver estructura de datos |
| `b0a86b0` | Debug: Agregado más logs para ver estructura de datos |
| `1535478` | Fix: Velocidad máxima de asteroides ahora es 60% |
| `a82d8ae` | Fix: Medium y Small ahora son 17% cada uno |
| `940e780` | Feat: Small comunes 26% + Debug Top5 para verificar calificación |
| `d57ecd7` | Fix: Botón VOLVER ahora mantiene el juego en pausa |
| `f3f084b` | Clean: Removida función de desarrollo (tecla L) |
| `7f12526` | Debug: Agregado log de lista en Game.js |
| `0fc3f79` | Fix: Mejorado log para debug de carga de Top 5 |
| `2191c6d` | Fix: Agregado async a _gameLoop para usar await |
| `dc8319f` | Feat: Agregado sistema de pausa (P) y Top 5 (T) |
| `12c1e81` | Fix: Corregido carga de lista desde Firebase |
| `847d7d0` | Fix: Agregado async al handler de ENTER |
| `fcaba12` | Fix: Corregido Firebase SDK (versión compat) y async handlers |
| `a584d75` | Fix: Actualizada configuración de Firebase con nuevo proyecto |
| `0230ab1` | Feat: Sistema Top 5 con Firebase Firestore para guardado permanente |

---

### v1.3.3 - Top 5
> **Sistema de puntuación Top 5**

| Commit | Descripción |
|--------|-------------|
| `02725ff` | Clean: Removidos console.log de debug |
| `9dfa9ea` | Debug: Agregados console.log en _mostrarTop5 para troubleshooting |
| `57ff91c` | Refactor: Estilos predefinidos para PIXI.Text en Game.js |
| `6bdb431` | Fix: Sistema de respaldo en memoria para Top 5 cuando localStorage no funciona |
| `e57fdc0` | Fix: Agregado favicon al proyecto |
| `6a16d35` | Fix: Corregido nombre de asset (nave322.png -> Nave322.png) |
| `2f51026` | Revert "Fix: Corregido nombre de asset de nave (nave322.png -> nave.png)" |
| `0144437` | Fix: Corregido nombre de asset de nave (nave322.png -> nave.png) |
| `a576962` | Docs: Actualizados SPEC.md y README.md con sistema Top 5 y dificultad progresiva |
| `2495d30` | Feat: Sistema Top 5 con localStorage y mejoras de juego |

---

### v1.3.2
> **Naves enemigas desde el inicio + Mejor sistema de escudos**

| Commit | Descripción |
|--------|-------------|
| `86155cb` | Fix: removido limite de asteroides en pantalla y ajustado intervalo de oleadas |
| `8fa1d25` | Feature: Efectos visuales mejorados - rotación de nave, fragmentación de asteroides y colisiones |
| `5ef1381` | Feature: UI mejorada con imágenes, sistema de oleadas por destrucción y Game Over con imagen |
| `3f828aa` | Feature: HitEffect doble tamaño (escala=2) - usado en proyectiles y colisiones de asteroides |
| `cfe7c6d` | Fix: eliminar metodo _moverRezagado duplicado que iba al centro |
| `2bb5c61` | Fix: juego del tamaño de la pantalla |
| `fca3280` | Fix: juego con tamano fijo 800x600 |
| `be3fb30` | Fix: resolution fija a 1 para mantener tamaño normal |
| `7fc3cb6` | Revert "Fix: rezagados sin objetivo (null) para que no vayan a la nave" |
| `475b26c` | Revert "Fix: rezagados tienen direccion correcta (dirX y dirY inicializadas)" |
| `10203e4` | Fix: rezagados tienen direccion correcta (dirX y dirY inicializadas) |
| `c390afb` | Fix: rezagados sin objetivo (null) para que no vayan a la nave |

---

### v1.3.1 - Correcciones de movimiento
> **Órbitas y movimiento de asteroides**

| Commit | Descripción |
|--------|-------------|
| `19c6560` | Fix: corregir error de sintaxis en Enemy.js |
| `ab8ac5b` | Fix: no sobrescribir direccion de rezagados si ya fue asignada |
| `abd4b32` | Fix: rezagados ahora van en línea recta correcta asignada manualmente |
| `864ee8e` | Fix: rezagados aparecen en zonas extremas sin pasar por el centro |
| `3354511` | Fix: rezagados evitan la zona central donde está la nave |
| `1af807b` | Fix: restaurar movimiento orbital del commit c45041b |
| `9b71deb` | Fix: asteroids large se acercan de manera eliptica - reducen distancia gradualmente |
| `893893f` | Fix: restaurar movimientos de asteroids del commit c45041b |
| `055da21` | Fix: corregir error de sintaxis en Game.js |
| `e32d6df` | Fix: rezagados cruzan toda la pantalla - orbitan alrededor de la nave - fragmentos heredan trayectoria |
| `fa870f2` | Fix: asteroids large ahora orbitan - medium y small van directo a nave |
| `4a128a6` | Revert: quitar imagen de fondo de puntuacion |
| `2dc5eff` | Revert: solo rezagados se destruyen al llegar al centro |
| `aeb5125` | Fix: fondo de puntuacion tamano fijo - orbita de asteroids large ahora estable a 180px |
| `764879b` | Fix: ajustar tamano del fondo de puntuacion al texto |
| `2b7f0bc` | Feature: agregar imagen fondo de puntuacion debajo del score |
| `2e58650` | Fix: órbita se acerca gradualmente a la nave - distancia reduce 5px por segundo |
| `92d8ed0` | Feature: agregar movimiento orbital para asteroids grandes - ahora large orbita alrededor de la nave |

---

### v1.3 - Sistema de Oleadas y Naves Enemigas

| Commit | Descripción |
|--------|-------------|
| `1886454` | Fix: unificar colores del HUD - todo azul #0044CC |
| `8b7d5a1` | Fix: verificar si imagen existe antes de actualizar posicion en Enemy.update |
| `5d76803` | Fix: quitar referencia a _orbitarObjetivo que no existe - simplificar movimiento |
| `3ebf3bc` | Fix: corregir llave extra en Enemy.js |
| `ddfc0fb` | Fix: rezagados ahora van hacia el centro y se destruyen ahí - no cruzan toda la pantalla |
| `c45041b` | Fix: unificar estilo de oleada con score en CSS - quitar limite de maximoEnemigos - rezagados pasan mas cerca del centro |
| `2d80a6d` | Feature: agregar fondo de espacio desde imagen 'fondoEspacio.png' - ahora carga la imagen y la usa como fondo, con fallback de estrellas |

---

### v1.3 - Sistema ULTi y Sobrecalentamiento

| Commit | Descripción |
|--------|-------------|
| `379015b` | Revert: volver probabilidad de rezagados a 35% |
| `ac3cadb` | Fix: ulti no carga cuando se usa - Feature: aumentar aparicion de rezagados de 35% a 50% |
| `d9ce6bd` | Revert "Feature: agregar animacion de explosion con sprite sheet - BurstEffect ahora usa 'animacion de explosion.png' (4 frames, 32x36) en lugar de particulas" |
| `a768dc0` | Revert "Fix: el ulti ya no carga mas cuando se usa - solo da puntos, no carga el ataque especial" |
| `69c8ee5` | Feature: agregar animacion de explosion con sprite sheet - BurstEffect ahora usa 'animacion de explosion.png' (4 frames, 32x36) en lugar de particulas |
| `a633184` | Fix: el ulti ya no carga mas cuando se usa - solo da puntos, no carga el ataque especial |
| `6aa8796` | Feature: agregar barra de carga visual del Ulti - aumentar cargaMaxUlti de 100 a 300 para hacerlo mas dificil, agregar barra visual en HTML/CSS con animacion cuando esta listo |
| `f59b7f5` | Chore: desactivar console.log de debug en Game.js y main.js |
| `999c0bd` | Fix: corregir offsetIndex -> indiceOffset en _crearFragmentoConOffset |
| `7b992bc` | Fix: corregir offsetIndex -> indiceOffset y size -> tamanio en _crearFragmentoRezagado |
| `0d0a5bd` | Fix: corregir this._draw -> this._dibujar en HitEffect update() |
| `682d4a4` | Fix: corregir _draw -> _dibujar en HitEffect y BurstEffect |
| `db10915` | Fix: corregir nombres de propiedades y metodos a espanol - shield->escudos, isOverheated->sobrecalentado, enemies->enemigos, createProjectile->crearProyectil, triggerUlti->activarUlti - corregir carga de assets con PIXI.Assets.init() |
| `953384a` | Fix: usar strings para verificar rezagados en Game.js |
| `b03b826` | Fix: eliminar código duplicado en _romper() |
| `8072e53` | Fix: usar strings simples en lugar de TamanioAsteroide para evitar problemas de importación |
| `e1d1321` | Debug: agregar logs en _generarEnemigo y quitar estilos que rompen el canvas |
| `2511a9a` | Debug: agregar más logs para seguir el flujo |
| `24dc86d` | Fix: crear texturas programáticamente en lugar de cargar archivos |
| `091a3f0` | Debug: agregar logs para carga de assets |
| `483d884` | Debug: agregar logs al inicio del juego |
| `da86ed2` | Debug: agregar logs para ver qué está pasando con la renderización |

---

### v1.2 - Refactor y Nomenclatura Española

| Commit | Descripción |
|--------|-------------|
| `cbb3377` | Fix: eliminar código duplicado en Enemy.js |
| `9ea308f` | Fix: renombrar Projectile a Proyectil y actualizar todas sus propiedades |
| `b29a67b` | Fix: usar tamanio en lugar de size en Enemy.js y Game.js |
| `e578b09` | Fix: actualizar referencias de sprite a imagen en todo el código |
| `0a88ff7` | Fix: usar enemigo en lugar de enemy en _generarEnemigo |
| `f5c1b1c` | Fix: renombrar todos los métodos privados a español en todos los archivos |
| `eb48d8f` | Fix: renombrar métodos restantes en Player.js |
| `74844a9` | Fix: usar Enemigo en lugar de Enemy en fragmentos |
| `749d7dd` | Refactor: renombrar todas las clases y variables a camelCase en español |

---

### v1.2 - Spawn Progresivo y UI

| Commit | Descripción |
|--------|-------------|
| `44e9236` | Feat: mostrar mejora de velocidad de disparo (+%) en UI |
| `b82e767` | Feat: spawn progresivo - los meteoritos aparecen cada vez más rápido |
| `4289c06` | Fix: agregar cooldown de colisión para evitar rezagados pegados |
| `c6fcc5c` | Feature: oleadas cada 1 segundo |
| `6d2ce14` | Feature: reducir oleadas a 2s, agregar cleanup de enemigos muy lejos |
| `dda8074` | Feature: oleadas cada 1 segundo |
| `8ab8f8d` | Fix: eliminar código duplicado en método _break() |
| `d90158e` | Fix: fragmentos separados con direcciones diferentes, special verde, rezagados violeta |
| `f9d327c` | Fix: sobrecalentamiento se activa solo cuando escudos llegan a 0, vulnerable por 10seg, al terminar carga escudos a 100% |
| `df14f9e` | Fix: colisiones asteroides rebotan, fragmentos separados al romper, sobrecalentamiento se activa al recibir cualquier daño que baje de 100% |

---

### v1.2 - Sistema de Sobrecalentamiento

| Commit | Descripción |
|--------|-------------|
| `e3bd0b4` | Fix: verificar sprite null al inicio de update para evitar errores |
| `977ea47` | Fix: null check en sprite.rotation para evitar error cuando el sprite ya fue destruido |
| `5690bb4` | Feature: ajustar spawnInterval 2s, maxEnemies 30 |
| `96e248f` | Feature: duplicar aparición de asteroides - spawnInterval 2s->1s, maxEnemies 10->20 |
| `364260c` | Feature: agregar asteroides rezagados - LARGE_REZAGADO, MEDIUM_REZAGADO, SMALL_REZAGADO - pasan de largo, dirección aleatoria, al chocar con otros asteroides cambian dirección, fragmentos con dirección aleatoria |
| `0e9b923` | Feature: agregar sistema de sobrecalentamiento - no muere al recibir daño con 100% escudos, entra en enfriamiento por 10s, si choca pierde enfriamiento, UI en rojo |

---

### v1.1 - Documentación y Mejoras

| Commit | Descripción |
|--------|-------------|
| `0829a4b` | Docs: Documentar todos los archivos restantes con comentarios en español |
| `a28b3f5` | Docs: Documentar Game.js y Enemy.js con comentarios detallados en español |
| `09367c3` | Feature: Agregar escala x2 a la nave y documentar Player.js con comentarios detallados en español |
| `54d2abb` | Docs: Actualizar SPEC.md con todas las características implementadas |
| `6138cad` | Feature: Aumentar tamaño de la nave (radius 32 -> 64) |

---

### v1.1 - Sistema Special y Power-up

| Commit | Descripción |
|--------|-------------|
| `db76d77` | Fix: Especial no hace daño al chocar con la nave |
| `1164067` | Feature: Power-up solo al destruir special, eliminar power-up al tocar |
| `4e8338f` | Fix: Eliminar aumento de tamaño de nave, solo aumenta velocidad de disparo |
| `860bc82` | Feature: Nave más grande (radius 32), asteroides tintados de rojo |
| `c61a2ab` | Fix: Slowdown reducido a 70% (solo 30% de velocidad) |
| `751617f` | Fix: Slowdown ahora es temporal (1 segundo) y no se acumula, resetea el timer si ya estaba activo |
| `9c7931d` | Fix: Cambiar retroceso por reducción de velocidad al recibir impacto de proyectil |
| `9591149` | Fix: Especial no se rompe, solo da power-up al destruirse |
| `365394c` | Fix: Especial ahora tiene apariencia grande (120px) pero comportamiento de small (movimiento directo, speed 120), se rompe en 2 small |
| `ba68470` | Feature: Asteroide especial ahora se rompe en 2 medianos y da power-up |
| `35e14e0` | Feature: Asteroide especial = power-up sin daño, da velocidad al dispara al tocarlo o destruirlo |

---

### v1.1 - Mejoras de Jugabilidad

| Commit | Descripción |
|--------|-------------|
| `a72b541` | Feature: Aumentar tamaño base de la nave (radius 20 -> 28) |
| `75c56c0` | Feature: Agregar retroceso al recibir impacto, efecto visual de hit, asteroid special más rápido (50) y más daño (90%), nave crece al destruir special |
| `5531f64` | Fix: fragmentos de medianos solo heredan órbita si el padre orbitaba |
| `ca8ec9a` | Feature: Fragmentos heredan órbita del padre - dirección orbital + shouldOrbit forzado |
| `775bb5d` | Docs: Actualizar comentarios - fragmentos heredan trayectoria orbital |
| `2bea933` | Feature: Fragmentos heredan trayectoria orbital (curvatura) con timer de transición |
| `53c5721` | Feature: Fragmentos heredan trayectoria hacia la nave en lugar de velocidad del padre |
| `617bbed` | Feature: Duplicar tamaño de asteroides (small, medium, large) manteniendo special igual |

---

### v1.0.9 - Sistema de Fragmentación

| Commit | Descripción |
|--------|-------------|
| `33c0bfd` | Fix: Eliminar herencia de impulso/velocidad - fragmentos ahora orbitan directamente |
| `3c3a5fe` | Fix: Eliminar código duplicado en Enemy.js |
| `957d0c8` | Fix: Fragmentos de asteroides ahora heredan movimiento orbital del padre |
| `cbc4d06` | Fix: Fragmentos de asteroides heredan dirección del padre - fragmentos continúan en la misma dirección antes de dirigirse a la nave |
| `ddb90f9` | Fix: Fragmentos ahora se mueven concéntricamente hacia la nave, no orbitan |
| `50f4506` | Feature: Fragmentos de asteroides ahora mantienen movimiento orbital, agregado método _orbitTargetDirect |
| `d449f39` | Fix: Asteroides heredan movimiento orbital al romperse - ahora usa interpolación suave de órbita con velocidad heredada |
| `86b6673` | Fix: Verificar textura en Enemy.js (usar !== null en lugar de verificación de verdad) |
| `bac3302` | Fix: Corregir llave extra de cierre en Enemy.js |
| `f6d6a99` | Fix: Corregir error de sintaxis en Enemy.js (llave extra de cierre) |
| `5ebd9f5` | Feature: Actualizar título en index.html a 'Jugando en el Espacio' |

---

### v1.0.8 - Efectos Visuales

| Commit | Descripción |
|--------|-------------|
| `2c27a5e` | Feature: Agregar efecto visual de explosión cuando se destruye asteroide especial, y resetear velocidad de disparo al reiniciar |
| `17b1139` | Fix: Aumentar velocidad de disparo cuando se destruye asteroide especial |
| `489f384` | Feature: Agregar porcentajes de daño de asteroides, tipo boss especial, y actualizar SPEC.md |
| `6b7a0fe` | Fix: Pantalla de Game Over no se borra al reiniciar |
| `e7dffd6` | Docs: Actualizar README con nombre del juego 'Jugando en el Espacio' y agregar enlace destacado al juego |
| `ded0165` | Feature: Agregar botón de reiniciar y mejor pantalla de Game Over con clic para reiniciar |
| `33c863c` | Feature: Agregar mejoras visuales - proyectiles de línea, efecto de esfera de daño, sistema de escudo, y efecto de anillo expansivo del ULTi |

---

### v1.0.7 - README y Descripción

| Commit | Descripción |
|--------|-------------|
| `cc14462` | Docs: Actualizar README con descripción del juego, controles e instrucciones |
| `3a972f7` | Feature: Implementar juego completo con controles de rotación, asteroides, proyectiles y soporte de pantalla completa |
| `1d69755` | Docs: Actualizar integrante del equipo y requisitos del proyecto |
| `2c4884a` | Fix: Corregir escritura de README |

---

### v1.0.6 - Primer Commit Funcional

| Commit | Descripción |
|--------|-------------|
| `f910fca` | Commit inicial del proyecto |

---

## 📜 Versiones Anteriores

### v1.3.8
> **Sistema de habilidades, partículas Boid, SpecialEnemy corregido**

| Commit | Descripción |
|--------|-------------|
| `0d97133` | v1.3.8: Sistema de habilidades (Q,E,R), partículas Boid con animaciones, SpecialEnemy corregido, UI actualizada |

---

### v1.3.7
> **Habilidades activas (Cohetes, Propulsor, Devorador), Tiempo Fuera pasivo**

| Commit | Descripción |
|--------|-------------|
| - | Sistema de Cohetes (Q): 2 cohetes teledirigidos, 5s cooldown |
| - | Sistema de Propulsor (R): Dash 300px en 0.2s, 15s cooldown |
| - | Sistema de Devorador (E): Atrae partículas Boid, 5s cooldown |
| - | Habilidad pasiva Tiempo Fuera: Regenera 10% escudos después de 10s en sobrecalentamiento |
| - | Animación del reloj para Tiempo Fuera (relog1-6.png) |
| - | Cooldowns se resetean al morir y reiniciar |

---

### v1.3.6
> **Partículas Boid y Habilidad Devorador**

| Commit | Descripción |
|--------|-------------|
| - | Partículas Boid con comportamiento de enjambre |
| - | Habilidad Devorador (E): Atrae partículas dentro de 200px |
| - | Contador de partículas Boids capturadas |
| - | Efecto visual de succión (SuccionEffect.js) |

---

## 📊 Resumen de Versiones

| Versión | Commits | Características Principales |
|---------|---------|----------------------------|
| v1.7.x | ~40 | HUD PixiJS completo, iconos 70x70, UX 1000x160, animacion tiempo fuera, config.js centralizado |
| v1.5.x | ~5 | Sobrecalentamiento W, IA enemiga, limpieza codigo, refactor balance |
| v1.3.8 | 1 | Sistema de habilidades, particulas Boid, SpecialEnemy |
| v1.3.7 | ~10 | Habilidades Q, E, R, Tiempo Fuera pasivo, animacion reloj |
| v1.3.6 | ~8 | Partículas Boid, Devorador, efectos visuales |
| v1.3.5 | 6 | UI mejorada, iconos de habilidades, efectos de escudo |
| v1.3.4 | ~18 | Top 5 con Firebase, pausa, botones con imágenes |
| v1.3.3 | ~14 | Sistema Top 5 (localStorage + Firebase) |
| v1.3.2 | ~20 | Naves enemigas desde inicio, mejor sistema de escudos |
| v1.3.1 | ~15 | Órbitas de asteroides, movimiento mejorado |
| v1.3 | ~25 | Sistema de oleadas, ULTi, sobrecalentamiento |
| v1.2 | ~25 | Refactor a español, spawn progresivo |
| v1.1 | ~25 | Special enemies, power-ups, fragmentación |
| v1.0.9 | ~15 | Fragmentos de asteroides con órbitas |
| v1.0.8 | ~10 | Efectos visuales, efectos de partículas |
| v1.0.7 | ~5 | README, controls, game description |
| v1.0.6 | 1 | Commit inicial |

---

## 🎯 Versiones Completadas

**v1.8.0:** ✅ Sistema de audio (5 SFX) + rediseño de Mejoras + HUD adaptable + balance ulti
**v1.7.32:** ✅ Limpieza de código muerto del HUD DOM (~1238 líneas, HUD 100% PixiJS)
**v1.7.31:** ✅ Refactor balance config.js, fix encoding Game.js
**v1.7.30:** ✅ HUD PixiJS completo con animaciones
**v1.5.2:** ✅ Sobrecalentamiento W, IA enemiga
**v1.5.0:** ✅ Sistema de mejoras expandido

---

**Última actualización:** 17/06/2026