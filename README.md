# 🎮 Jugando en el Espacio

[![GitHub Pages](https://img.shields.io/badge/Jugar-Aquí-0044CC?style=for-the-badge)](https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/)
[![Versión](https://img.shields.io/badge/Versión-v1.37.0-FFA500?style=for-the-badge)](https://github.com/wackxion/proyecto-de-PVJ1-Jugando-en-el-Espacio-/releases/tag/v1.37.0)

---

**¡Juega ahora!** 👉 [https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/](https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/)

---

Este proyecto forma parte de la cursada de **Programación de Videojuegos 1** en la **Universidad Nacional de Hurlingham (UNAHUR)**, dictada por el profesor **Facundo Saiegh**.

## 👥 Integrantes
- Braian Zapater [@bra_wack](https://github.com/bra_wack)

---

## 🎮 Descripción del Juego

**Jugando en el Espacio** es un juego de nave espacial en vista superior (top-down) donde el jugador controla una nave que debe destruir asteroides y naves enemigas.

### Mecánicas del Juego (v1.5.0)
- **Movimiento tipo tanque** - La nave rota (A/D) y avanza (W) con inercia
- **Sistema de aceleración** - Mantén W para acelerar (1s), luego sobrecalentamiento (3s)
- **Disparar** proyectiles (Espacio) hacia la dirección que apunta la nave
- **Ataque especial (Ulti)** - Pulso expansivo que destruye todo a su paso (radio 18% diagonal)
- Los asteroides vienen en **4 tamaños** (grande, mediano, pequeño, especial)
- Los asteroides grandes **orbitan** alrededor de la nave
- Al destruir asteroides grandes/medianos, se rompen en fragmentos más pequeños
- Sistema de **escudos** (porcentaje 0-100%)
- **Sistema de Sobrecalentamiento** - 25 segundos de vulnerabilidad (no puedes usar propulsor)
- **Sistema de Tiempo Fuera** - Al sobrecalentarse, regeneras escudos después de 25s
- **Sistema de oleadas** - Cada 10 asteroides destruidos avanza la oleada
- **Naves enemigas** - Aparecen desde el inicio (intervalo 8s), cada 5 oleadas aparece un grupo extra
- **Asteroides especiales** - Aparece 2%, tiene comportamiento propio, 100 HP
- **Sistema Top 5** - Guarda puntuaciones en la nube (Firebase)
- **Partículas Boid** - Partículas que aparecen al destruir asteroides especiales, se capturan con E o tocando la nave

### Sistema de Mejoras (v1.5.0)
Presiona **P** para acceder al menú de mejoras. Usa partículas recolectadas para comprar:
| Mejora | Efecto |
|--------|--------|
| AUMENTO DE DAÑO | +2, +3, +5, +5, +10 daño por proyectil |
| AUMENTO DE VELOCIDAD | +5%, +5%, +10%, +10%, +20% velocidad de proyectil |
| COSTE DE ULTI | -50,-50,-50,-50,-50 (reduce de 500 a 250) |
| AUMENTO DE ESCUDO | +50,+50,+50,+50,+50 HP (aumenta vida máxima) |
| AUMENTO DE REGENERACIÓN | +5,+10,+15,+20,+30 escudos tras Tiempo Fuera |

### Habilidades
| Tecla | Habilidad | Cooldown |
|-------|-----------|----------|
| Q | Cohetes - Lanza 2 cohetes hacia enemigos cercanos | 5 seg |
| E | Devorador - Atrae partículas Boid dentro de 200px | 5 seg |
| R | Propulsor - Dash de 300px | 15 seg |
| S | ULTi - Pulso expansivo | - |

---

## 🎨 Estética

### Paleta de Colores (Estilo Birome)
| Color | Hex | Uso |
|-------|-----|-----|
| Negro Espacial | `#0D0D1A` | Fondo del juego |
| Birome Azul | `#0044CC` | Nave, proyectiles, UI, efecto de daño |
| Birome Rojo | `#CC0000` | Asteroides, sobrecalentamiento |
| Verde Explosión | `#00FF00` | Naves enemigas destruidas |
| Blanco Estelar | `#FFFFFF` | Estrellas |

### Fuente
- Estilo manuscrito (Segoe Script, Lucida Handwriting, Bradley Hand)

---

## 🕹️ Controles

| Tecla | Acción |
|-------|--------|
| W / Flecha ↑ | Avanzar (con inercia) |
| Barra espaciadora | Disparar proyectil |
| S / Flecha ↓ | Activar ataque especial (Ulti) |
| A / Flecha ← | Rotar nave a la izquierda |
| D / Flecha → | Rotar nave a la derecha |
| Q | Cohetes (2 hacia enemigos cercanos) |
| E | Devorador (atrae partículas Boid) |
| R | Propulsor (dash de 300px) |
| ENTER / Click | Reiniciar (en Game Over) |
| P | Pausar/Abrir ventana de mejoras |
| T | Ver Top 5 durante el juego |
| ESC | Volver al menú principal (con confirmación) |

---

## 🛠️ Tecnologías

- **Lenguaje:** JavaScript (ES6+)
- **Motor:** [PixiJS v8](https://pixijs.com/) para renderizado 2D — vendorizado en `libs/pixi.min.js` (no depende de CDN)
- **Backend:** Firebase Firestore para Top 5 persistente
- **Servidor:** Node.js con `serve`

---

## 📋 Características del Juego

### Tipos de Asteroides
| Tipo | Tamaño Visual | Radio Colisión | HP | Daño | Comportamiento | Puntos |
|------|---------------|----------------|-----|------|----------------|--------|
| SMALL | 32x32 | 16px | 25 HP | 10% | Va directo a la nave | 30 |
| MEDIUM | 64x64 | 32px | 50 HP | 25% | Va directo a la nave | 20 |
| LARGE | 128x128 | 64px | 75 HP | 50% | Orbita alrededor de la nave | 10 |
| SPECIAL | 96x96 | 48px | 200 HP | 0% | Power-up al destruir (orbita) | 100 |

### Sistema de Naves Enemigas (v1.3.2)
- Aparecen desde el **inicio del juego** (oleada 0)
- Intervalo: 8s → 5s (se reduce con las oleadas)
- **Cada 5 oleadas**: aparecen **4 naves** (1 normal + 3 extra)
- HP: 25, Velocidad: 225 px/s
- Disparan cada 3 segundos
- Esquivan asteroides
- Dan +10 carga de ULTi al destruirse
- Explosión **VERDE** al destruirse

### Sistema de Escudos (v1.3.2)
- Los escudos van de 0% a 100%
- Al llegar a 0%, entra en **sobrecalentamiento** (barra roja)
- **NO se apaga automáticamente después de 10 segundos**
- **Solo se apaga cuando el jugador recibe escudos** 

### Sistema de Oleadas
| Oleada | Intervalo Naves | Naves por oleada |
|--------|----------------|-----------------|
| 0-4 | 8s → 7s | 1 nave |
| **5** | 5s | **4 naves** |
| 6-9 | 5s | 1 nave |
| **10** | 5s | **4 naves** |

### Campo Gravitatorio de la Nave
- **Radio de atracción:** 100px
- **Asteroides afectados:** SMALL, MEDIUM, LARGE, Rezagados
- **NO afectados:** SPECIAL, Mini asteroides en órbita
- Los asteroides son atraídos hacia la nave cuando entran en este radio

### Sistema Top 5
- Las mejores 5 puntuaciones se guardan automáticamente en la nube (Firebase Firestore)
- Puntuación 0 **NO** califica para el Top 5
- No permite entradas duplicadas
- Al hacer nuevo record, se solicita nombre (máx 8 caracteres, solo letras y números)
- Muestra: N° | NOMBRE | PUNTOS | OLEADAS

---

## 🚀 Cómo Ejecutar

### Para desarrollo local:
```bash
# Instalar servidor
npm install -g serve

# Ejecutar
npm start
# o
serve .
```

---

## 📁 Estructura del Proyecto

```
├── index.html                   # Página principal
├── package.json                 # Configuración npm
├── libs/
│   └── pixi.min.js              # PixiJS v8 vendorizado (sin dependencia de CDN)
├── documentacion/
│   ├── GDD.md                   # Historial de versiones y commits
│   ├── SPEC.md                  # Especificaciones del juego
│   └── PENDIENTES.md            # Tareas pendientes y roadmap
├── assets/                      # Sprites, imágenes y fondos
└── src/
    ├── config.js                # ⚙️ Configuración central de balance (velocidades, daños, cooldowns…)
    ├── main.js                  # Punto de entrada
    ├── ui/
    │   └── UIManager.js         # Menú principal, tutorial, Top 5 y créditos (HTML/DOM)
    ├── systems/
    │   └── InputManager.js      # Gestión de teclado (clase: GestorEntrada)
    └── game/
        ├── ui/
        │   └── PixiHUD.js       # HUD renderizado en canvas PixiJS
        ├── sistemas/
        │   ├── Game.js          # Clase principal del juego (game loop, estado)
        │   ├── GameBoids.js     # Módulo: partículas Boid (spawn, reciclaje)
        │   ├── GameEffects.js   # Módulo: efectos visuales y ULTi
        │   ├── GameEnemies.js   # Módulo: generación, IA y colisiones de enemigos
        │   ├── GameMejoras.js   # Módulo: tienda de mejoras (tecla P)
        │   ├── GameProjectiles.js # Módulo: proyectiles y colisiones
        │   ├── GameSkills.js    # Módulo: habilidades Q/E/R y Tiempo Fuera
        │   └── ObjectPool.js    # Pool de objetos (optimización de memoria)
        ├── entidades/
        │   ├── GameObject.js    # Clase base de todas las entidades
        │   ├── Player.js        # Nave del jugador (clase: Jugador)
        │   ├── Enemy.js         # Asteroides (clase: Enemigo, 7 tipos)
        │   ├── EnemyShip.js     # Naves enemigas con IA
        │   ├── SpecialEnemy.js  # Asteroide especial (orbita al destruirse)
        │   ├── Projectile.js    # Proyectiles aliados (clase: Proyectil)
        │   └── EnemyProjectile.js # Proyectiles enemigos teledirigidos
        ├── efectosVisuales/
        │   ├── BoidParticle.js      # Partículas Boid (enjambre con IA)
        │   ├── AsteroidExplosion.js # Explosión al destruir asteroide
        │   ├── ProyectilExplosion.js# Explosión al destruir proyectil
        │   ├── HitEffect.js         # Efecto de impacto (partículas)
        │   ├── BurstEffect.js       # Explosión de power-up
        │   ├── UltiEffect.js        # Aro expansivo del ULTi
        │   └── SuccionEffect.js     # Efecto visual del Devorador
        └── mecanicas/
            ├── Cohete.js   # Proyectil teledirigido (habilidad Q)
            └── Top5.js     # Sistema de puntuación Top 5 (Firebase Firestore)
```

---

## 🏗️ Estructura de Clases y Herencia

### Jerarquía de Clases

```
GameObject (CLASE BASE - entidades/GameObject.js)
│
├── entidades/ (Clases del juego)
│   │
│   ├── Jugador (Player.js) - extends GameObject
│   │   │
│   │   ├── _crearEfectoDano() → HitEffect
│   │   ├── _crearEfectoRotacion() → HitEffect
│   │   ├── _crearEfectoPerdidaEnfriamiento()
│   │   └── Sub-clases internas:
│   │       └── HitEffect (efecto visual)
│   │
│   ├── Proyectil (Projectile.js) - extends GameObject
│   │   └── Propiedades:
│   │       ├── velocidad: 600 px/s (modificable)
│   │       ├── dano: 25 (aumentable)
│   │       └── tiempoDeVida: 2s
│   │
│   ├── Enemigo (Enemy.js) - extends GameObject
│   │   │
│   │   ├── Tipos (constantes TamanioAsteroide):
│   │   │   ├── PEQUENO: 'small'
│   │   │   ├── MEDIANO: 'medium'
│   │   │   ├── GRANDE: 'large'
│   │   │   ├── ESPECIAL: 'special'
│   │   │   ├── GRANDE_REZAGADO: 'large_rezagado'
│   │   │   ├── MEDIANO_REZAGADO: 'medium_rezagado'
│   │   │   └── PEQUENO_REZAGADO: 'small_rezagado'
│   │   │
│   │   ├── Métodos de movimiento:
│   │   │   ├── _moverConcéntrico() → Va directo a la nave
│   │   │   ├── _orbitarAlrededor() → Orbita alrededor del jugador
│   │   │   └── _moverRezagado() → Pasa de largo
│   │   │
│   │   └── Sub-clases internas:
│   │       └── _romper() → Devuelve fragmentos (nuevos Enemigo)
│   │
│   ├── EnemyShip (EnemyShip.js) - extends GameObject
│   │   └── Propiedades:
│   │       ├── velocidad: 225 px/s
│   │       ├── salud: 25
│   │       └── dano: 25
│   │
│   ├── EnemyProjectile (EnemyProjectile.js) - extends GameObject
│   │   └── Propiedades:
│   │       ├── velocidad: 400 px/s
│   │       └── dano: 25
│   │
│   ├── SpecialEnemy (SpecialEnemy.js) - extends GameObject
│   │   └── Propiedades:
│   │       ├── velocidad: 80 px/s
│   │       ├── salud: 300
│   │       ├── cargaUlti: 20
│   │       └── tiene mini-naves orbitando
│   │
│   └── GameObject (clase base)
│
├── efectosVisuales/ (Efectos y partículas)
│   │
│   ├── BoidParticle.js - extends GameObject
│   │   └── Algoritmo Boids (cohesión, alineación, separación, fuga)
│   │
│   ├── HitEffect.js - extends GameObject
│   │   └── Efecto de impacto (5 partículas, 0.3s)
│   │
│   ├── BurstEffect.js - extends GameObject
│   │   └── Explosión de power-up (20 partículas, 0.5s)
│   │
│   ├── UltiEffect.js - extends GameObject
│   │   └── Aro expansivo (800 px/s, destruye todo)
│   │
│   ├── ProyectilExplosion.js - extends GameObject
│   │   └── Explosión al destruir proyectil enemigo
│   │
│   ├── AsteroidExplosion.js - extends GameObject
│   │   └── Explosión al destruir asteroide
│   │
│   └── SuccionEffect.js - extends GameObject
│       └── Efecto del Devorador (aro rojo, 300px radio)
│
└── mecanicas/
    │
    ├── Cohete.js - extends GameObject
    │   └── Proyectil teledirigido (busca objetivo, velocidad 400, dano 999)
    │
    └── Top5.js (SIN HERENCIA - clase independiente)
        └── Sistema de puntuación (Firebase Firestore)
```
---

### Resumen: Qué llama a qué

```
main.js
    │
    └──► Game.init()
          │
          ├──► Game._crearJugador() → new Jugador()
          │
          └──► GAME LOOP (60 FPS)
               │
               ├──► Jugador.update() → Player.js
               │     ├── _disparar() → Game.crearProyectil() → new Proyectil()
               │     └── _usarUlti() → Game.activarUlti() → new UltiEffect()
               │
               ├──► GameSkills.js
               │     ├── actualizarHabilidadCohetes() → crearCohetes() → new Cohete()
               │     ├── actualizarHabilidadDevorador() → new SuccionEffect()
               │     └── actualizarHabilidadPropulsor() → Jugador.activarPropulsor()
               │
               ├──► PixiHUD._actualizarIconoTiempo() (pasiva Tiempo Fuera → Jugador.agregarEscudos())
               │
               ├──► GameBoids.js
               │     └── crearParticulasIniciales() → new BoidParticle()
               │
               ├──► GameProjectiles.js
               │     └── procesarColisiones() → Enemigo.recibirDano() → _romper()
               │
               ├──► GameEnemies.js
               │     ├── generarEnemigo() → new Enemigo()
               │     ├── generarNaveEnemiga() → new EnemyShip()
               │     └── procesarColisionesJugador() → Jugador.recibirDano()
               │
               └──► GameEffects.js
                    └── activarUlti() → new UltiEffect()
```

---

## 🔗 Recursos Útiles

- [PixiJS Documentación](https://pixijs.com/8.x/guides/components)

---

## 📜 Historial de Versiones

### v1.37.0 (Actual)
> **Mapa toroidal — paso 1: la nave y la cámara envuelven**

- 🌀 Con `CONFIG.MUNDO.TOROIDAL` la nave **sale por un borde y entra por el opuesto** (mundo mismo tamaño, sensación de infinito). La cámara la sigue sin clamp y queda centrada al cruzar; el look-ahead no se dispara en el wrap. *Paso 1: solo nave + cámara — los enemigos/asteroides/boids y el render sin costura vienen después*

### v1.36.2
> **Botón "Volver" otro 25% más chico**

- 🔎 El botón **Volver** bajó de 240px a **180px** de ancho (−25% otra vez; queda parejo con el botón CONTROLES)

### v1.36.1
> **Botón "Volver" 25% más chico**

- 🔎 El botón **Volver** de todas las ventanas (Opciones, Controles, Top 5, Créditos) pasó de 320px a **240px** de ancho (−25%)

### v1.36.0
> **Controles configurables: archivo de config + remapeo desde Opciones**

- ⚙️ Los controles ahora viven en `CONFIG.CONTROLES` (config.js) — editar un control es cambiar una línea. Teclado y mouse unificados como *bindings*
- 🎛️ Nuevo apartado **CONTROLES** en Opciones: cada acción se puede **reasignar** (clic en la acción → apretás una tecla o botón), se **guarda** entre partidas (localStorage) y hay **Restaurar por defecto**. El apuntado con el mouse queda fijo

### v1.35.3
> **Botones del tutorial anclados abajo (misma posición, sin superponerse)**

- 🧩 En el tutorial, los botones **Anterior/Siguiente** ahora quedan **anclados al fondo** de la ventana en las 5 páginas (antes flotaban según cuánto contenido tenía cada página) y ya no se superponen con el contenido. SPEC.md actualizado con los controles de mouse

### v1.35.2
> **Disparo más rápido y con la mitad de alcance**

- 🔫 El proyectil del jugador ahora va a **800 px/s** (antes 600) y dura **0.75 s** (antes 2 s) → alcance **600 px** (la mitad de los 1200 anteriores)

### v1.35.1
> **Fix: el efecto de giro ya no se dibuja encima de la nave**

- 🐛 El efecto azul de giro quedaba **sobre** la nave (el `mundo` ordena por `zIndex`, no por índice de inserción). Ahora tiene `zIndex −1` → se dibuja **detrás** de la nave

### v1.35.0
> **Nuevo control: apuntado con el mouse (click der acelera, click izq dispara)**

- 🖱️ La nave ahora **apunta al cursor del mouse**; **click derecho** acelera (avanza hacia el cursor) y **click izquierdo** dispara. W/Espacio siguen andando como respaldo; A/D ya no rotan. Tutorial de controles actualizado

### v1.34.5
> **Chips de mejora de la columna derecha en espejo**

- 🔁 La placa de mejoras de la **columna derecha** ahora se dibuja en **espejo** de la izquierda (pips + precio + botón de compra): el botón de compra queda **pegado al icono** en las dos columnas. El icono de la habilidad no se movió

### v1.34.4
> **Fuente del tooltip: Comic Sans MS**

- 🔤 El texto del tooltip de mejora (título, descripción y precio) ahora usa **Comic Sans MS** en vez de Segoe Script

### v1.34.3
> **El tooltip se actualiza al instante al comprar**

- 🔄 Al comprar una mejora con el cursor sobre el chip, el tooltip ahora refresca **al toque** los pips, el precio del próximo nivel y su color (antes había que sacar y volver a poner el cursor)

### v1.34.2
> **Colores del precio del tooltip: paleta de tinta azul/negro**

- 🎨 El precio en el tooltip ahora usa **azul claro pastel** cuando se puede comprar, **negro** cuando no alcanza y el **azul** de siempre para **MAX** (se sacaron el verde y el rojo)

### v1.34.1
> **Tooltip de mejora mejorado (pips, precio por color, flecha)**

- 🎨 El tooltip de la mejora ahora muestra el **nivel como pips** (5 puntitos que se llenan), el **precio coloreado** según si te alcanza o no —o **MAX** si está completa—, una **flecha** que apunta al chip y un **separador** bajo el título

### v1.34.0
> **Tooltip en los chips de mejora del HUD**

- 💬 Al pasar el cursor sobre el icono de una mejora en el HUD aparece un globo con su **nombre, qué hace, el nivel actual (n/5) y el costo del próximo** (o **MAX** si está completa); estilo tinta de birome sobre papel

### v1.33.2
> **Naves del menú: pasean y se esquivan (ya no se chocan)**

- 🛸 Las 4 naves del menú ahora pasean independientes (cada una su recorrido) y se **esquivan** entre sí girando antes de tocarse; ya no se amontonan/chocan

### v1.33.1
> **Estrellas que titilan (se prenden y apagan)**

- ✨ La capa de estrellas ahora son estrellas individuales que titilan cada una a su ritmo; al apagarse dejan de verse

### v1.33.0
> **Pulido de cámara (shake + parallax + look-ahead) + naves del menú acomodadas**

- 💥 **Screen shake**: la cámara tiembla al recibir un impacto y (más fuerte) al lanzar la Ulti
- 🌌 **Parallax**: fondo en dos capas fijas a la pantalla que scrollean más lento que el mundo → profundidad
- 👀 **Look-ahead**: la cámara se adelanta un poco hacia donde se mueve la nave
- 🚀 **Menú**: las naves decorativas ya no se superponen ni pasan por la zona de los botones

### v1.32.1
> **Limpieza de código muerto (~1925 líneas) — sin cambios de comportamiento**

- 🧹 `Game.js` 3252 → 2066 líneas: se eliminaron sistemas duplicados sin usar (colisiones, spawn y partículas viejas, ya migrados a los módulos `sistemas/`)
- 🧹 `GameMejoras.js` 685 → 37 líneas: se quitó la ventana de mejoras vieja (deshabilitada; reemplazada por los chips del HUD)
- 🧹 Eliminado `ObjectPool.js` (sin uso), pools y 15 logs comentados
- ✅ Verificado en runtime: rendimiento ~0.31 ms/frame bajo carga pesada; todo funciona igual

### v1.32.0
> **Cámara que sigue la nave + mundo grande explorable + naves decorativas en el menú**

- 🎥 **Cámara + mundo 3× la pantalla**: la nave se mueve libre por un mapa más grande y la cámara la sigue (centrada); el HUD y las ventanas quedan fijos
- 🌌 Todo el juego (nave, enemigos, partículas, disparos, cohetes, efectos) vive en un contenedor "mundo" que la cámara desplaza; spawn y limpieza de enemigos **relativos a la cámara** (aparecen alrededor de la nave)
- 🐛 Fixes de coordenadas: disparos, cohetes y el efecto de escudo ya no desaparecían; las entidades usan los límites del **mundo** (no de la pantalla)
- 🚀 **Menú principal**: una nave aliada pasea y naves enemigas la orbitan con recorridos distintos; desaparecen al darle JUGAR

### v1.31.0
> **Asteroides sueltan partículas al destruirse + botones del tutorial**

- ✨ Al destruir un asteroide ahora **salen partículas BOIDS** en su posición (1/2/3 según tamaño), listas para recolectar con el Devorador
- 🔊 Los botones del tutorial (Anterior/Siguiente) ahora suenan al clickear y se achicaron para entrar mejor en el marco

### v1.30.0
> **Tutorial actualizado con íconos + contenido corregido**

- 🎮 Controles con badges de teclas + íconos reales de cada habilidad (fix: "Q → Cohetes", antes decía "aceleración")
- ⬆️ Paso de Mejoras rehecho: las 8 habilidades con su ícono y efecto (se quitó la vieja "velocidad"; se agregaron Aceleración, Propulsor, Devorador, Cohetes)
- 🔧 Sobrecalentamiento: 10 s (antes decía 25)

### v1.29.0
> **Créditos: sección Diseño Artístico + precio de mejora "MAX" al maximizar**

- 🎨 Créditos: nueva sección "Diseño Artístico" (Braian Zapater, Copilot, Chat GPT); se compactó el texto para que entre bien en el marco
- 🔼 El precio de una mejora ahora muestra "MAX" cuando la sección está al máximo (antes quedaba vacío)

### v1.28.0
> **Barra de aceleración escala con las mejoras + pips más resaltados**

- ⚡ La barra de aceleración ahora se llena según el máximo actual (que sube con las mejoras), no sobre 100 fijo
- ⬜ Los chips prendidos (pips) ahora son blanco pleno y un poco más grandes para que resalten

### v1.27.0
> **Ajuste de precios de mejoras + fix: comprar ya no resetea la vida**

- 💲 Precios: Aceleración y Propulsor [10,20,30,40,50]; Cohetes [20,25,30,35,40]; Devorador [30,35,40,45,50]
- 🐛 Comprar una mejora ya no restaura la vida al máximo (solo la mejora de Escudo cura, +50)

### v1.26.0
> **Mejoras para las 4 habilidades restantes (Aceleración, Propulsor, Devorador, Cohetes)**

- 🚀 **Aceleración**: 5 mejoras, cada una +tiempo de aceleración (más capacidad de la barra de sobrecalentamiento)
- 💨 **Propulsor**: 5 mejoras, cada una −2 s de cooldown (15 s → 5 s)
- 🌀 **Devorador**: 5 mejoras, +40% de rango y velocidad de atracción cada una (hasta +200%)
- 🔥 **Cohetes**: 5 mejoras, +1 cohete por mejora (2 → 7)
- Ahora las 8 habilidades tienen su panel de chips/compra en el HUD (40 mejoras en total)

### v1.25.0
> **Fix: el contador de partículas se actualiza al comprar una mejora**

- 🐛 Antes el contador de partículas solo se refrescaba al salir de la compra (el panel pausa el juego y el HUD no corría); ahora baja al instante al comprar

### v1.24.0
> **Proyectil del jugador a la mitad de tamaño**

- 🔹 El proyectil se redujo a la mitad (visual y hitbox): escala 0.175 → 0.0875, radio 6 → 3

### v1.23.0
> **Variantes de nave enemiga (spray aleatorio)**

- 👾 Cada nave enemiga generada elige al azar entre 5 sprites (`enimigo1-4` + `enemigo5`), dando variedad visual a los enemigos

### v1.22.0
> **Contador de FPS + opción "Mostrar información adicional"**

- 🖥️ Nuevo contador de **FPS** arriba-derecha (misma fuente y color blanco que el panel de datos de arriba-izquierda)
- ⚙️ En **Opciones**, casilla "Mostrar información adicional" que muestra/oculta ese conjunto (panel de oleada + FPS). Se guarda en `localStorage`; por defecto **oculto** (opt-in)

### v1.21.0
> **Top 5 de Game Over: marco más grande, el botón Volver ya no tapa nombres**

- 📋 Se agrandó el marco del Top 5 (al perder) y se subieron las filas, así el botón **Volver** queda debajo de las 5 filas sin tapar ningún nombre

### v1.20.0
> **Top 5 de Game Over: título/tabla ya no queda pegado arriba al maximizar**

- 📋 En la ventana de Top 5 que aparece al perder (PixiJS), el encabezado y las filas ahora se posicionan **proporcional al tamaño del marco** en vez de en píxeles fijos, así al maximizar la ventana el título no queda pegado al borde superior

### v1.19.0
> **JUGAR arriba de la columna de botones**

- 🎮 El botón **JUGAR** vuelve a estar arriba de todos, como primer botón de la columna (Jugar, Tutorial, Top 5, Opciones, Créditos)

### v1.18.0
> **Ajuste fino del menú**

- 🎮 Botón **JUGAR** movido debajo del título "Jugando en el Espacio" (parte superior)
- ➡️ Botones de la derecha más pegados al borde derecho

### v1.17.0
> **Nuevo fondo de menú + layout de botones + Top 5 reajustado**

- 🖼️ Fondo del menú principal = ilustración `jugando en el espacio.png`
- 🎮 Botón **JUGAR** debajo de la nave; el resto (Tutorial / Top 5 / Opciones / Créditos) en columna a la derecha, más juntos
- 📏 Botones del menú 20% más chicos (320 → 256px)
- 📋 Ventana **Top 5**: el título ya no queda tan pegado arriba (más espacio superior)

### v1.16.0
> **Ventana de "¡NUEVO RÉCORD!" con el marco de las demás ventanas**

- 🖼️ La ventana para ingresar el nombre al hacer un récord ahora usa el marco `gameOver.png` (border-image) y el fondo oscuro, igual que Opciones / Top 5 / Créditos
- ✏️ Título + subtítulo en tinta azul, campo de texto con borde azul (sin el anillo naranja de foco) y botón de guardar dentro del marco

### v1.15.0
> **Explosiones dedicadas: asteroides (rojo) y naves enemigas (verde)**

- 💥 **Explosión roja** de 4 frames (`esplocionRojo1-4.png`) para la destrucción de asteroides
- 🟢 **Explosión verde** de 4 frames (`esplocionVerde1-4.png`) para la destrucción de naves enemigas (antes era la de asteroide tintada de verde)
- 🎨 Cada explosión usa su propio arte de tinta según el color de la entidad; el asteroide especial conserva su explosión azul

### v1.14.0
> **Ventanas con marco `gameOver.png` + fixes de botones y cohete**

- 🖼️ **Nuevo marco de ventanas**: Game Over, Opciones, Top 5, Créditos y "¿Volver al menú?" usan `gameOver.png` como marco decorativo (vía `border-image`, sin deformar)
- 🎯 **Botones acomodados dentro del marco**: Game Over y la ventana de salir dejaron de superponerse/salirse del borde
- 🛡️ **HUD circular oculto en Game Over**: el escudo curvo ya no aparece por encima de la ventana
- 💥 **Fix cohete vs asteroide especial**: al destruirlo con el cohete ahora sí dispara su efecto (mini-asteroide en órbita)

### v1.13.0
> **Marcos por nivel de mejora + sonidos de compra**

- 🖼️ **Marco que sube de tier**: el marco de cada habilidad cambia según cuántas mejoras compraste (5 marcos). La 1ª mejora no cambia el marco, recién la 2ª (`marco = max(1, nivel)`)
- 🔊 **Sonidos de mejora**: al comprar suena `mejora.mp3`; al intentar sin partículas suficientes suena `particulasInsuficientes.mp3`

### v1.12.0
> **Botones del menú y ventanas con imágenes PNG (estilo tinta)**

- 🎨 Menú, tutorial, Game Over y Top 5 usan botones-imagen (JUGAR, TUTORIAL, VOLVER, etc.)
- ⚖️ Ajustes de tamaño de proyectiles y de la fuente de precios en los marcos

### v1.11.0
> **Sistema de mejoras funcional (compra desde el HUD) + iluminación de iconos**

- 🛒 **Compra de mejoras desde los paneles laterales**: clic en el icono de mejora (upgreate) de una habilidad compra el próximo nivel con partículas Boid y **prende el chip** correspondiente. Chips = niveles comprados
- 💡 **Iconos que se iluminan**: las habilidades encienden su icono cuando están disponibles (cohetes/propulsor/devorador sin cooldown, ulti cargada, aceleración no sobrecalentada); los iconos de mejora se iluminan cuando tenés partículas suficientes para comprar (y el del marcador superior avisa si hay algo comprable)
- 🖼️ **Nueva placa de chips** (`chipDeMejora.png`) encajada al interior del marco; marcos 10% más grandes
- 🗑️ **Quitada la mejora "velocidad de proyectil"** (ahora 4 líneas de mejora: daño, escudo, ulti, tiempo fuera)
- 🐛 **Fixes al reiniciar**: los cooldowns de habilidades se resetean y el stage vuelve a ser interactivo (antes, tras un game over, no se podían comprar mejoras ni quedaban iconos atenuados)
- 🚫 Ventana de Mejoras vieja (centrada) deshabilitada; el sistema vive en los paneles laterales

### v1.10.0
> **Rediseño del HUD: habilidades en paneles laterales + escudo curvo + panel de mejoras (chips)**

- 🧭 **Habilidades a los laterales**: los cuadrantes se movieron a dos columnas en los bordes (izquierda: Tiempo Fuera, Escudo, Proyectil; derecha: Aceleración, Propulsor, Cohetes, Devorador, Ulti), con el marco `marcos1mejora.png` (cuadrado del icono pegado al borde y el rectángulo fuera de pantalla)
- 🛡️ **Escudo curvo**: 3 barras curvas que siguen a la nave dentro del escudo (aceleración, escudos y Tiempo Fuera), color sólido `#173B75`, 50% de opacidad en reposo y 100% en uso
- 🎛️ **Marcador superior** (`puntacion-recursos.png`): puntos y recursos en blanco + icono de mejora
- 🔩 **Panel de mejoras (chips)**: al pausar con `P` las columnas se despliegan hacia el centro y aparece la placa `chips de mejora2.png`; detrás de cada chip hay un pip que se prende (negro→blanco) al clickear. La compra real se engancha más adelante
- 🖼️ **Iconos nuevos**: aceleración (arriba-derecha) y proyectil (abajo-izquierda, temporal); los iconos ahora encajan preservando su proporción (no se deforman)
- ⚠️ **Ventana de Mejoras vieja deshabilitada temporalmente**: sin acceso a compra hasta enganchar los pips
- 🚀 Nave 10% más chica

### v1.9.2
> **Sistema de audio completo (SFX + música) con volúmenes centralizados**

- 🔊 **SFX conectados**: devorador (E), cohetes (Q), destrucción de asteroide y de nave enemiga, recibir impacto, captura de partícula Boid (con throttle) y click de botones del menú
- 🎵 **Música de fondo en bucle**: menú (arranca en el primer gesto, por la política de autoplay del navegador) y partida; coordinadas para no solaparse
- 🎛️ **Volúmenes centralizados** en `src/config.js` → `CONFIG.AUDIO.VOLUMENES`: un solo lugar para ajustar cada pista (detalle en `documentacion/AUDIO.md`)

### v1.9.1
> **PixiJS local (sin CDN) + sprite real del cohete**

- 🧩 **PixiJS vendorizado** (`libs/pixi.min.js`): el juego ya no depende del CDN de jsdelivr. Antes, si el CDN fallaba o estaba bloqueado, PixiJS quedaba sin cargar y el juego (y el sitio en vivo) mostraba "PixiJS no está cargado". Ahora carga desde el proyecto y funciona offline
- 🚀 **Sprite real del cohete** (`assets/cohetes -habilidad.png`): el proyectil de la habilidad Cohetes (Q) usaba un rectángulo rojo; ahora usa una imagen, dimensionada manteniendo su proporción (sin deformarse)

### v1.9.0
> **Menú de pausa con Escape + créditos actualizados + limpieza del HUD**

- ⏸️ **Menú de confirmación con Escape**: durante la partida, `ESC` pausa el juego y abre una ventana (mismo estilo que las demás) para **volver al menú principal** o seguir jugando. JUGAR reinicia una partida limpia
- 🙌 **Créditos actualizados**: Claude (Anthropic) en Asistencia IA y nuevo apartado Beta tester (TPC)
- 🧹 **PixiHUD.js documentado**: JSDoc detallado en cada función y limpieza de los comentarios muertos de la migración HTML→PixiJS (sin cambios de comportamiento)

### v1.8.0
> **Sistema de audio + rediseño de la ventana de Mejoras**

- 🔊 **Sistema de audio** (`GestorSonido`, HTML5 sin dependencias): SFX conectados de disparo, ulti, propulsor, sobrecalentamiento (W) y rotura de escudos (en bucle hasta regenerar o game over). Detalle en `documentacion/AUDIO.md`
- 🎨 **Ventana de Mejoras rediseñada**: estados por color en tinta (comprada/disponible/sin partículas/error), iconos en vez de títulos, mini-leyenda, tooltips por mejora, y siempre por encima del HUD
- 📐 **HUD adaptable**: anclado a los bordes reales, se adapta a cualquier proporción de pantalla
- 🛠️ **Arreglos**: Game Over y Mejoras sin elementos superpuestos, papel de Top 5/Créditos que envuelve el contenido, modales opacos, ventana de récord prolija
- ⚖️ **Balance**: más carga de ulti por enemigo; fix del label de velocidad (+10%→+5%)

### v1.7.32
> **Limpieza de código muerto del HUD DOM**

- Eliminado el HUD DOM obsoleto (~1238 líneas): el HUD in-game ya se renderiza 100% con PixiJS (`PixiHUD.js`)
- `Game.js`: removidos `_actualizarUI()` y sus 10 llamadas, campos UI muertos y bloques guardados por refs DOM `undefined`
- `GameSkills.js`: removidas `actualizarTiempoFuera`, `actualizarUIMarco*`, `activarDevorador/Propulsor` y el orquestador `actualizarHabilidades` (la pasiva Tiempo Fuera la maneja `PixiHUD._actualizarIconoTiempo()`)
- `UIManager.js`: removido el bloque comentado de ~558 líneas de `crearHUD()` y el no-op `destruirHUD()`
- `css/style.css`: removidas reglas sin uso (`#tutorial-icon`, `#ship-icon`, `#controls`, `#*-ux-frame`, keyframes)
- Verificado en navegador: sin errores, HUD/habilidades/Tiempo Fuera/captura de partículas funcionando

### v1.7.31
> **Refactor de balance — config.js centralizado**

- Nuevo `src/config.js`: punto único para ajustar balance (velocidades, daños, cooldowns, costos de mejoras)
- 14 archivos leen sus constantes de config — ningún número "mágico" suelto en el código
- Encoding de `Game.js` reparado: 410 caracteres españoles corruptos restaurados
- `package.json` actualizado con nombre, versión, autor y repositorio correctos
- Sobrecalentamiento W ajustado: 2s de aceleración + 2.5s de enfriamiento

### v1.4.6
> **Sistema de Mejoras y mejoras varias**

**Sistema de Mejoras:**
- Nuevo módulo `GameMejoras.js` para gestionar ventana de mejoras
- Ventana con título, proyectil + precio, 5 barras de mejoras con animación
- Contador de partículas boids con imagen Pboids2
- Mensajes de error al intentar comprar sin saldo

**Captura de Partículas:**
- Las partículas ahora se capturan al tocar la nave directamente
- Contador del Devorador muestra partículas **recolectadas**

**Otros cambios:**
- Partículas Boid ya no empiezan con 10 al iniciar
- ULTi reducida de 30% a 18% de la diagonal
- Ventana de mejoras mejorada (título, precio, contador)
- Fix de click en barras después de reiniciar

### v1.3.5
> **Pantalla de inicio y menú principal** - Nueva experiencia de usuario

#### Nuevas Características

**Pantalla de carga:**
- Fondo negro con nave girando en el centro
- Texto "CARGANDO..." en azul
- Transición suave al iniciar el juego

**Menú principal (pantalla de inicio):**
- Fondo: imagen fondoEspacio2.png
- Botones: Jugar, Tutorial, Top 5, Créditos
- Estilos con gradiente azul y bordes redondeados
- Efectos hover en botones (escala y brillo)
- El menú se muestra SIN cargar el juego
- El botón JUGAR inicia la carga bajo demanda

**Botón TUTORIAL:**
- Imagen tutorial.png + controles en modal
- Modal con botón VOLVER
- Fondo oscuro (rgba 0,0,0,0.9)

**Botón TOP 5:**
- Imagen gameOver.jpg como fondo
- Fondo oscuro (rgba 0,0,0,0.9)
- Datos precargados al iniciar (más rápido)
- Pantalla de carga con nave girando mientras carga
- Polling para actualizar cuando datos listos
- Tabla con N°, NOMBRE, PUNTOS, OLEADAS
- Todo en azul y negrita

**Botón CRÉDITOS:**
- Imagen gameOver.jpg como fondo
- Fondo oscuro (rgba 0,0,0,0.9)
- Información del juego y desarrollador
- Todo en azul y negrita

**Top 5 desde Game Over:**
- Imagen gameOver.jpg como fondo (era puntuacion2.png)

**Otros cambios:**
- Efecto hover en botón de guardar record
- Mini tutorial del juego desactivado
- Código optimizado con funciones reutilizables

**Nueva UI en la parte inferior del juego:**
- Imagen UX Experimental en parte inferior central
- Barra de aceleración adicional debajo de la imagen UX
- Panel de puntuación en parte inferior izquierda
- Icono de ESCUDO sobre imagen UX con marco
  - Cambio de imagen según % de escudos (escudo1, escudo2, escudo3)
  - Animación en bucle (escudo4-escudo5) cuando está sobrecalentado
  - Marco con brillo de impacto al recibir daño
  - Marco rojo con animación cuando se rompe el escudo
- Icono de ULTI sobre imagen UX con marco
  - Cambio de imagen según % de carga (ultiicon1-5)
  - Animación en bucle (ultiicon3-4-5) cuando está listo (100%)
  - Marco con brillo azul cuando ULTi está lista
- Panel superior simplificado (solo información de oleada)
  - Muestra: Oleada, Faltan, Ast, Naves
- Estilo blanco, Arial 12px

---

### v1.3.4
> **Iconos UI, botones con imágenes, versión en pantalla**

#### Nuevas Características
- Iconos visuales para UI: `escudo1.png`, `ultiicon1.png`, `aceleracion1.png`
- Botón Top 5 con imagen (`top5Boton.png`)
- Botón Guardar con imagen (`guardadoBoton.png`)
- Imagen de fondo para Top 5 (`guardarPuuntos.png`)
- Versión del juego en pantalla (v1.3.4)

#### Modificaciones
- Código CSS limpiado (eliminados duplicados)
- Posiciones de botones de Game Over ajustadas
- Imagen de Game Over más grande (90% altura)
- HTML limpiado y organizado

---

### v1.3.2
> **Naves enemigas desde el inicio + Mejor sistema de escudos**

#### Nuevas Características
- **Naves enemigas desde el inicio:**
  - Aparecen desde oleada 0 (antes era desde oleada 5)
  - Intervalo progresivo: 20s → 5s
  - Cada 5 oleadas: 4 naves (1 normal + 3 extra)
  - Explosión VERDE al destruir

- **Sistema de escudos mejorado:**
  - El sobrecalentamiento NO se apaga automáticamente después de 10 segundos
  - Solo se apaga cuando el jugador recibe escudos (Special Enemy)

- **Top 5 mejorado:**
  - Puntuación 0 no califica
  - Sin duplicados

#### Correcciones
- Botón VOLVER del Top 5 funciona desde pausa
- Botones REINICIAR/TOP5 no funcionan mientras se escribe nombre
- Sobrecalentamiento cuenta mientras está pausado

---

### v1.3.1
- Límites en pantalla
- Colisiones entre asteroides grandes
- Verificación de posición libre antes de spawnear
- Radio de órbita aumentado 30%
- UI con emojis

### v1.3
- Sistema de oleadas
- Naves enemigas con IA
- Special Enemies con transformación en órbita

---

## 🎨 Referencia de Sprites y Assets

### Personajes y Naves
| Archivo | Uso |
|---------|-----|
| `nave.png` | Nave del jugador |
| `naveEnemiga.png` | Naves enemigas |

### Asteroides
| Archivo | Uso |
|---------|-----|
| `asteroide.png` | Asteroides (SMALL, MEDIUM, LARGE) |
| `especial.png` | Asteroide especial (SpecialEnemy) |

### Proyectiles y Efectos
| Archivo | Uso |
|---------|-----|
| `proyectil.png` | Proyectiles del jugador |
| `proyectilEnemigo.png` | Proyectiles de naves enemigas |
| `cohete.png` | Cohetes de habilidad Q |
| `Pboids2.png` | Partículas Boid |

### UI e Iconos
| Archivo | Uso |
|---------|-----|
| `escudo1.png` / `escudo2.png` / `escudo3.png` | Iconos de escudo (según %) |
| `ultiicon1.png` - `ultiicon5.png` | Iconos de ULTi (según %) |
| `aceleracion1.png` | Icono de aceleración |
| `cohetes.png` | Icono de habilidad Cohetes |
| `propulsor.png` | Icono de habilidad Propulsor |
| `relog1.png` - `relog6.png` | Animación de Tiempo Fuera |
| `puntuacion2.png` | Decoración UI inferior |
| `top5Boton.png` | Botón Top 5 |
| `guardadoBoton.png` | Botón guardar record |

### Fondos y Pantallas
| Archivo | Uso |
|---------|-----|
| `fondoEspacio2.png` | Menú principal |
| `gameOver.jpg` | Pantalla de Game Over |
| `guardarPuuntos.png` | Formulario Top 5 |
| `tutorial.png` | Imagen de tutorial |

---

## 📝 Licencia

MIT

