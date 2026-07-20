# SPEC.md - Jugando en el Espacio

## 1. Información del Proyecto

- **Nombre del Juego:** Jugando en el Espacio
- **Versión:** v1.12.0 (ACTUAL)
- **Curso:** Programación de Videojuegos 1 - UNAHUR
- **Profesor:** Facundo Saiegh
- **Integrantes:** Braian Zapater
- **URL del Juego:** https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/

---

## 2. Game Design Document (GDD)

### 2.1 Idea y Mecánicas

**Concepto:** Juego de nave espacial en vista superior (top-down) donde el jugador controla una nave que debe destruir asteroides de diferentes tamaños y naves enemigas.

**Mecánicas Principales (controles actualizados en v1.35.0):**
- **Apuntar** la nave con el **mouse** (la nave mira siempre al cursor)
- **Avanzar / acelerar** con **click derecho** (o W) - inercia + sobrecalentamiento
- **Disparar** con **click izquierdo** (o Espacio) hacia el cursor
- **Ataque especial (Ulti)** - Pulso expansivo que sale de la nave y destruye todo a su paso
- Sistema de **escudos** (porcentaje 0-100%) en lugar de vidas
- Efecto visual de **esfera azul** al recibir daño
- Sistema de **naves enemigas** con IA - aparecen desde el inicio
- Sistema de **asteroides especiales** con comportamiento propio
- Sistema de **Top 5** con Firebase Firestore
- **Campo gravitatorio** de la nave atrae asteroides
- **Iconos visuales** para escudos, ULTi y aceleración (imágenes png)
- **Pantalla de carga** con nave girando al iniciar el juego
- **Menú principal** con fondo espacio2 y 4 botones

---

### 2.2 Naves Enemigas (v1.3.5)

| Característica | Valor |
|--------------|-------|
| HP | 25 |
| Daño al jugador | 25% escudos |
| Velocidad | 225 px/s |
| Aparición | Desde oleada 0, intervalo 8s → 5s |
| Disparo | Cada 3 segundos |
| Movimiento | Orbita al jugador con inercia |
| Proyectiles | Teledirigidos, evitan asteroides |
| Explosión | Verde (0x00FF00) al destruirse |
| Límite en pantalla | 10 máximo |
| Da carga ULTi | 10 al destruirse |

**Sistema de aparición progresiva:**
- Oleadas 0-9: 1 nave, intervalo 8s → 6s
- Oleadas 10-29: 2 naves, intervalo 6s → 5s
- Oleadas 30+: 3 naves, intervalo 5s (mínimo)
- Cada 5 oleadas: +3 naves adicionales (oleadas 5, 10, 15, 20, 25, 30…)

---

### 2.3 Asteroides

#### 2.3.1 Tipos de Asteroides

| Tipo | Radio | Salud | Daño | Puntos | Carga ULTi |
|------|-------|--------|------|--------|-------------|
| SMALL | 16px | 25 HP | 10% | 30 | 5 |
| MEDIUM | 32px | 50 HP | 25% | 20 | 5 |
| LARGE | 64px | 75 HP | 50% | 10 | 5 |
| Rezagados | varies | varies | varies | varies | 5 |
| SPECIAL | 48px | 200 HP | 0% | 100 | 0 |

**Todos los asteroides dan 5 de carga ULTi (excepto SPECIAL que da 0)**

#### 2.3.2 Probabilidad de Special Enemy

| Oleada | Probabilidad |
|--------|--------------|
| 0-9 | 2% |
| 10+ | 4% (el doble) |

#### 2.3.3 Campo Gravitatorio

| Característica | Valor |
|----------------|-------|
| Radio de atracción | 100 px |
| Asteroides afectados | Todos excepto SPECIAL |
| Fuerza | Proporcional a la distancia |

---

### 2.4 Sistema de Oleadas

| Oleada | Intervalo Asteroides | Intervalo Naves | Naves por generación |
|--------|---------------------|-----------------|---------------------|
| 0 | 1.5s | 8s | 1 |
| 1-4 | 1.5s | 7.8s → 7s | 1 |
| **5** | 1.5s | 7s | **4** (1 + 3 extra) |
| 6-9 | 1.5s | 6.8s → 6s | 1 |
| **10** | 1.5s | 6s | **5** (2 + 3 extra) |
| 11-14 | 1.5s | 5.8s → 5.2s | 2 |
| **15** | 1.5s | **5s** (mínimo) | **5** (2 + 3 extra) |
| 16-29 | 1.5s | 5s | 2 |
| **30+** | 1.5s | 5s | **6** (3 + 3 extra) |

---

### 2.5 Sistema de Escudos (v1.3.5)

- Rango: 0% a 100%
- **Sobrecalentamiento:** al llegar a 0%, la barra se pone roja
- **El sobrecalentamiento NO se apaga automáticamente** - solo al recibir escudos
- Special Enemies destruidos dan +20% escudos

---

### 2.6 Sistema ULTi

| Característica | Valor |
|--------------|-------|
| Carga máxima | 500 |
| Asteroide destruido | +5 carga |
| Nave enemiga destruida | +10 carga |
| SPECIAL destruido | +0 carga |

---

### 2.7 Colisiones con Mini Asteroide Especial en Órbita

Cuando un asteroide o nave enemiga colisiona con el mini asteroide en órbita:

| Objeto colisionado | Efecto |
|-------------------|--------|
| Asteroide (cualquiera) | Se destruye, da puntos y carga ULTi |
| Nave enemiga | Se destruye, da 500 puntos y +10 carga ULTi |
| Proyectil aliado | No recibe daño (traspasa) |
| Proyectil enemigo | -25 HP |

---

### 2.8 UI del Juego (v1.7.30 - PixiJS HUD)

El HUD se renderiza completamente en el canvas de PixiJS mediante la clase `PixiHUD.js`.

**Diseño fijo:** Base 1080×720, escalado con `Math.min(w/1080, h/720)`

- **Imagen UX Experimental** - 1000×160px, parte inferior central
- **6 Iconos de habilidades** - 70×70px cada uno, fila horizontal sobre slots de imagen UX:
  - Tiempo Fuera | Cohetes (Q) | Escudo | ULTi | Propulsor (R) | Devorador (E)
- **Barra de aceleración (W)** - 120×18px, detrás de imagen UX (zIndex: -2)
- **Panel de puntuación** - Panel blanco 90×26px, font 16px azul
- **Contador de partículas Boids** - Font 18px blanco con sombra
- **Panel de oleada** - Font 12px blanco, top-left

**Animaciones de iconos:**
- Escudo: 5 sprites, cambia según % de escudos, parpadeo cuando sobrecalentado
- ULTi: 5 sprites, animación cuando está listo, borde dorado pulsante
- Tiempo Fuera: 6 sprites del reloj, parpadeo blanco/gris cuando activo

**Menús (HTML/DOM):** UIManager.js maneja menú principal, tutorial, Top 5 y créditos

**Pantalla de Game Over:**
- Imagen de fondo (gameOver.jpg)
- Titulo GAME OVER
- Puntuación conseguida y oleada alcanzada
- Botones: REINICIAR, TOP 5
- Al volver del Top 5 se preservan los textos (score, oleada)

---

## 3. Changelog v1.3.5**🛡️** - Barra de escudos (azul, roja en sobrecalentamiento)
- **⚡** - Barra de carga ULTi
- **🚀** - Barra de aceleración (W)
- Indicador: `Oleada: X | Faltan: Y | Ast: Zs | Naves: Ws`

---

## 3. Changelog v1.3.5

### Enfoque
**Cambios visuales y UX** - Nueva pantalla de inicio, menú principal y optimizaciones

### Agregado
- **Pantalla de carga** al iniciar el juego
  - Fondo negro (#0D0D1A)
  - Nave girando en el centro (animación CSS)
  - Texto "CARGANDO..." en azul
  - Transición suave al iniciar
  
- **Menú principal** (pantalla de inicio)
  - Fondo: imagen fondoEspacio2.png
  - Botones: Jugar, Tutorial, Top 5, Créditos (uno debajo del otro)
  - Estilos con gradiente azul y bordes redondeados
  - Efectos hover en botones (escala y brillo)
  
- **Botón JUGAR**
  - Muestra pantalla de carga con nave girando
  - Inicializa el juego solo al hacer click (carga bajo demanda)
  
- **Botón TUTORIAL**
  - Imagen tutorial.png + controles en modal
  - Texto: "W: Avanzar | ESPACIO: Disparar | A/D: Rotar | S: ULTi"
  - Modal con botón VOLVER
  
- **Botón TOP 5**
  - Imagen gameOver.jpg como fondo
  - Datos precargados al iniciar el menú (más rápido)
  - Tabla con N°, NOMBRE, PUNTOS, OLEADAS
  - Todo en azul y negrita
  - Botón VOLVER
  
- **Botón CRÉDITOS**
  - Imagen gameOver.jpg como fondo
  - Información del juego y desarrollador
  - Todo en azul y negrita
  - Botón VOLVER
  
- **Efecto hover** en botón de guardar record (escala + brillo)
- **Mini tutorial** del juego desactivado (ahora en menú)

### Nuevos elementos en la UI del juego

- **Imagen UX Experimental** en parte inferior central (debajo de todo)
- **Barra de aceleración** adicional debajo de la imagen UX
- **Panel de puntuación** en parte inferior izquierda
- **Icono de ESCUDO** con marco sobre imagen UX
  - Cambio de imagen según % de escudos (1, 2, 3)
  - Animación en bucle (4-5) cuando está sobrecalentado
  - Marco con brillo de impacto al recibir daño
  - Marco rojo con animación cuando se rompe

- **Icono de ULTi** con marco sobre imagen UX
  - Cambio de imagen según % de carga (1-5)
  - Animación en bucle (3-4-5) cuando está listo (100%)
  - Marco con brillo azul cuando ULTi está lista

- **Panel superior simplificado** (solo información de oleada)
  - Solo muestra: Oleada, Faltan, Ast, Naves
  - Estilo: blanco, Arial 12px, esquina superior izquierda

### Modificado
- Código optimizado: funciones reutilizables (crearBotonMenu, crearBotonVolver)
- Sistema de precarga del Top 5 en segundo plano
- HTML limpiado (mini tutorial comentado)

---

## 4. Changelog v1.3.4

### Agregado
- Iconos visuales para UI: `escudo1.png`, `ultiicon1.png`, `aceleracion1.png`
- Botón Top 5 con imagen (`top5Boton.png`)
- Botón Guardar con imagen (`guardadoBoton.png`)
- Imagen de fondo para Top 5 (`guardarPuuntos.png`)
- Versión del juego en pantalla (v1.3.4)

### Modificado
- Código CSS limpiado (eliminados duplicados)
- Posiciones de botones de Game Over ajustadas
- Imagen de Game Over más grande (90% altura)
- HTML limpiado y organizado

### Temporalmente comentado (para pruebas)
- UX Experimental (imagen inferior)

---

## 5. Changelog v1.3.8 (COMPLETADO)

### Modificado

#### Asteroides Especiales (SpecialEnemy.js)
- **HP**: Reducido de 200 a 100
- **Dirección**: Ahora va hacia la posición inicial del jugador cuando fue generado (NO persigue)
- **Al destruirlo**: Se convierte en mini y orbita alrededor de la nave
- **YA NO da bonus**: Al destruirlo ya no otorga +20% escudos ni +20% velocidad de disparo
- **Dato importante**: `direccionInicialX` e `direccionInicialY` son datos que NO cambian

#### Partículas Boid
- **Texturas**: Pboids1.png a Pboids4.png (animación 1,2,3,4,3,2,1)
- **Tamaño**: 15x15 píxeles
- **Sin brillo**: Eliminado el efecto de parpadeo

#### UI/UX
- **Contador de PBOids**: bottom 3.2vmin, left 71.5%
- **Tutorial**: Actualizado con todas las teclas (W, ESPACIO, A/D, S, Q, E, R)
- **Créditos**: Agregado "Asistencia IA: OpenCode"
- **Marco ULTI**: Corregido doble borde
- **Reinicio**: Los cooldowns se resetean al morir y reiniciar

---

## 6. Changelog v1.3.7 (COMPLETADO)

### Agregado

#### Sistema de Habilidades Activas

| Habilidad | Tecla | Cooldown | Descripción |
|-----------|-------|----------|--------------|
| **Cohetes** | Q | 5 segundos | Lanza 2 cohetes teledirigidos hacia los 2 enemigos más cercanos |
| **Propulsor** | R | 15 segundos | Dash: avanza 300px en 0.2s (no puede girar durante el dash) |

#### Habilidad Pasiva - Tiempo Fuera
- **Activación**: Automáticamente después de 10 segundos en sobrecalentamiento
- **Efecto**: Regenera 10% de escudos y sale del sobrecalentamiento
- **Animación del reloj**: relog1→2→3→4→5→6→6(girado360°)→repetir (0.3s por frame)
- Cambios visuales: parpadeo blanco/azul durante sobrecalentamiento, azul fijo después de activar

#### Archivos Nuevos
- **Cohete.js**: Cohetes teledirigidos con seguimiento hacia objetivos

### Modificado

#### InputManager.js
- Agregada tecla Q → 'cohetes' (cooldown 5s)
- Agregada tecla R → 'propulsor' (cooldown 15s)
- Funciones: `debeUsarCohetes()`, `debeUsarPropulsor()`, `obtenerCooldownCohetes()`, `obtenerCooldownPropulsor()`

#### Player.js
- Agregado sistema de propulsor (dash)
- Variables: `enPropulsor`, `duracionPropulsor: 0.2`, `velocidadPropulsor: 1500`
- Método `activarPropulsor()`, no se puede rotar durante el dash

#### UIManager.js
- Iconos de Cohetes y Propulsor con marcos que cambian de color
- Icono de Tiempo Fuera con animación del reloj

#### Game.js
- Lógica de cohetes, propulsor y animación del reloj

### Assets Agregados
- `relog1-6.png`, `propulsor.png`, `cohetes.png`

---

## 6. Changelog v1.3.6 (COMPLETADO)

### Agregado
- **Partículas Boid** - Sistema de partículas con comportamiento de enjambre
  - Tamaño: 5x5 píxeles
  - Comportamiento: Separación, Cohesión, Alineación
  - Huyen de la nave (fuerza: 0.6, rango: 200px)
  - 10 iniciales, máximo 100, aparecen en grupos de 10 cada 3s
  - Efecto de brillar (blanco ↔ cyan)
  - Contador en barra superior (PBOids: X)
  
- **Habilidad Devorador (Tecla E)**
  - Cooldown: 5 segundos
  - Atrae partículas dentro de 200px hacia la nave
  - Partículas ignoran todo y van directo a la nave
  - Efecto visual de succión (SuccionEffect.js)
  - Marco cambia de color: rojo activo, rojo oscuro cooldown, azul listo
  - Contador de partículas capturadas al lado del icono

### Modificado
- **Partículas**: Ahora spawn desde los 4 bordes, no todas juntas
- **InputManager**: Agregada tecla E para devorador

---

## 6. Changelog v1.3.5

### Agregado
- **Rediseño de UI** - Nueva interfaz inferior con imagen UX Experimental
- **Iconos dinámicos** - Escudo y ULTi cambian según porcentaje
- **Barra de aceleración** adicional debajo de imagen UX
- **Panel de puntuación** en parte inferior izquierda
- **Menú principal** - Nuevo sistema de menús (INICIO, TOP 5, CRÉDITOS)
- **Efectos hover** en botones

### Modificado
- **Controles** - Ahora en menú (no en pantalla de juego)
- **HTML/CSS** - Estructura reorganizada para nueva UI
- **Indicador de oleada** - Muestra intervalos de spawn

---

## 7. Changelog v1.3.3

### Agregado
- Campo gravitatorio de la nave (100px)
- Puntos y carga ULTi al destruir asteroides con mini asteroide en órbita
- Especial Enemy doble (4%) desde oleada 10
- Naves enemigas: 2 desde oleada 10, 3 desde oleada 30

### Modificado
- Todos los asteroides dan 5 de carga ULTi (antes variaba)
- Intervalo de naves: 25s → 5s (antes 20s → 5s)

---

## 8. Changelog v1.4.0

### Agregado
- **Módulos JavaScript** - Código refactorizado en 5 archivos separados:
  - `GameProjectiles.js` - Proyectiles y colisiones
  - `GameEnemies.js` - Enemigos, naves, generación
  - `GameSkills.js` - Habilidades Q, E, R, Tiempo Fuera pasiva
  - `GameEffects.js` - Efectos Ulti, explosiones
  - `GameBoids.js` - Partículas Boid

### Modificado
- **Game.js** reducido de 3654 a 2887 líneas (-767 líneas, ~21%)
- **Top5.js** - Silenciados errores de permisos Firebase
- Corregidos bugs en colisiones con SpecialEnemy
- Mini asteroides en órbita: no colisionan con proyectiles aliados
- Mini asteroides en órbita: colisionan con otros asteroides (reciben/dañan 20 HP)
- Eliminado: `_generarEnemigo`, `_crearNaveEnemiga`, `_crearProyectilEnemigo` (no usados)
- Eliminado: `_crearParticulasBoid`, `_crearParticulaBoidFuera`, `_capturarParticulaBoid` (wrappers sin uso)
- Eliminado (v1.7.32): HUD DOM muerto — `_actualizarUI()`, `crearHUD()`/`destruirHUD()`, funciones `actualizarUIMarco*`/`actualizarTiempoFuera`/`activarDevorador`/`activarPropulsor` de GameSkills, y reglas CSS sin uso (~1238 líneas). El HUD in-game es 100% PixiHUD.js

### Técnológico
- Funciones exportadas desde módulos para uso en game loop
- Código legacy eliminado del game loop principal

---

## 9. Changelog v1.4.2

### Agregado
- Contenedor de habilidades en UI (flexbox) para mejor organización de iconos

### Modificado
- **Sistema de sobrecalentamiento**: Ya no termina el juego al entrar en sobrecalentamiento. Ahora el jugador puede seguir jugando sin escudos. Solo muere si recibe daño mientras ya está en sobrecalentamiento.
- **SpecialEnemy**:
  - Colisión con proyectil aliado: -10 HP → si llega a 0, se convierte en mini y orbita
  - Colisión con asteroide: Rebota y actualiza dirección hacia posición guardada del jugador
  - Mini SpecialEnemy (en órbita): -10 HP en colisiones con proyectiles enemigos, jugador y asteroides
- **Tiempo Fuera**: Animación de palpitar ahora es blanca (#FFFFFF/#AAAAAA) en vez de naranja
- **Top5**: Forzado uso de Firebase (deshabilitado fallback a localStorage)
- **Firebase**: Corregida configuración de storageBucket (.appspot.com)

### Técnico
- Reglas de Firestore actualizadas para permitir lectura/escritura pública
- Módulos JavaScript: GameProjectiles, GameEnemies, GameSkills, GameEffects, GameBoids

---

## 10. Changelog v1.4.3

### Modificado
- **BoidParticle**:
  - Tamaño: 10x10 px (era 7x7)
  - Rango visión: 100 px (era 50)
  - Eliminado efecto de brillo
  - Ahora usa textura Pboids2.png (no cuadrado blanco)
- **Partículas Boid**:
  - Creación a 100px fuera de la pantalla
  - Contenedor puesto detrás de la UI
- **Mini SpecialEnemy**:
  - Daño reducido de 25 a 10 HP en colisiones

---

## 11. Changelog v1.4.4

### Modificado
- **Naves Enemigas**:
  - Intervalo de aparición reducido de 25s a 8s (desde oleada 0)
  - Parámetros del constructor corregidos (orden: x, y, textura, jugador, enemigos, ancho, alto)
  - Agregada verificación de colisión con proyectiles en GameProjectiles.js
- **Partículas Boid**:
  - Eliminados límites de rebote en bordes (pueden entrar y salir libremente)
  - Sistema de Reciclaje: si pasan más de 5s fuera de la pantalla, se reposicionan en un borde en vez de destruirse
  - Intervalo de creación: cada 7 segundos (era 10s)
  - Cantidad por creación: 10 partículas
  - Máximo: 100 partículas
- **Habilidad Cohete (Q)**:
  - Ahora puede dañar SpecialEnemy grandes (no los mini en órbita)
  - Excluye mini especiales (enOrbita = true) de objetivos cercanos
- **SpecialEnemy**:
  - Daño de proyectiles corregido: ahora recibe 25 HP (era 10 hardcodeado)
- **Game Over + Record**:
  - Si hay record, los botones Reiniciar/Top5 no se crean hasta guardar el nombre
  - Posición de botones guardada para recrearse correctamente después de guardar nombre
  - Botones ahora se limpian por ID (fix para botones duplicados al reiniciar)

### v1.4.5 (Actual)
> **SpecialEnemy: movimiento corregido y recycle**

- **SpecialEnemy**:
  - Movimiento corregido: ahora guarda la posición del jugador al crearse y se mueve en esa dirección (pasa de largo como proyectil)
  - Recycle: cuando sale 200px de la pantalla, reaparece en un borde aleatorio con nueva dirección hacia el centro

### Bug Fixes
- Corregido orden de parámetros en generarNaveEnemiga
- Agregada colisión proyectil-nave enemiga en GameProjectiles.js
- Fix de reinicio automático al guardar nombre en Top5
- Fix de botones que no se eliminaban al reiniciar (ahora se limpian por ID)

---

## 12. Changelog v1.4.6 (Actual)

### Agregado

#### Sistema de Mejoras (GameMejoras.js)
- Nuevo módulo `GameMejoras.js` para gestionar la ventana de mejoras
- Ventana de mejoras con:
  - Título "MEJORAS" centrado arriba
  - Imagen de proyectil + precio al lado
  - 5 barras de mejoras (+1, +3, +5, +5, +10) con animación al comprar
  - Contador de partículas boids (imagen Pboids2 + número azul)
  - Fondo más pequeño (60% de la pantalla)
- Precio se actualiza SOLO cuando se compra exitosamente
- Las mejoras se reinician al reiniciar el juego

#### Captura de Partículas
- Las partículas ahora se capturan al tocar la nave directamente (antes solo con Devorador)
- Contador del Devorador muestra las partículas **recolectadas** (no las existentes en pantalla)

### Modificado

#### Partículas Boid
- **Eliminado**: Ya no empiezan con 10 partículas al iniciar/reiniciar el juego
- El jugador empieza con 0 partículas y se generan durante el juego

#### ULTi
- Radio reducido de 30% a 18% de la diagonal de la pantalla
- Para 1920x1080: ~661px → ~397px

#### Ventana de Mejoras
- Fondo achicado de 80% a 60%
- Título movido a posición y=220
- Contador de partículas subido dentro del fondo
- Precio movido al lado derecho del proyectil

### Bug Fixes
- Fix: Al reiniciar, ahora se pueden comprar mejoras (eventos de click funcionan correctamente)
- Fix: Contador de partículas muestra recolectadas, no existentes
- Fix: Precio no se actualizaba cuando no se podía comprar (ahora sí funciona)
- Limpieza: Código antiguo de mejoras eliminado de Game.js

---

*Documento actualizado para v1.4.6*


