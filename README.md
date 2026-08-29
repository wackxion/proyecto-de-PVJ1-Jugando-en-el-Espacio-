# 🎮 Jugando en el Espacio

[![GitHub Pages](https://img.shields.io/badge/Jugar-Aquí-0044CC?style=for-the-badge)](https://wackxion.github.io/proyecto-de-PVJ1-Jugando-en-el-Espacio-/)
[![Versión](https://img.shields.io/badge/Versión-v1.51.10-FFA500?style=for-the-badge)](https://github.com/wackxion/proyecto-de-PVJ1-Jugando-en-el-Espacio-/releases/tag/v1.51.10)

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
- **Sistema de aceleración** - Mantén W para acelerar hasta el tope de velocidad (constante, sin sobrecalentamiento); la mejora de Aceleración sube ese tope
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

### v1.51.9 (Actual)
> **Costos de mejoras unificados: 10 · 20 · 30 · 60 · 100**

- 💰 Las **8 categorías de mejoras** ahora usan la misma progresión de costo: **[10, 20, 30, 60, 100]** partículas (antes cada una tenía su curva). Sube más fuerte en los últimos niveles (`config.js` `MEJORAS`)
- 🤖 Android preparado como `versionCode 29` / `versionName 1.51.9` para regenerar el AAB

### v1.51.8
> **La mejora de ULTI ahora también amplía el radio (+50% con las 5)**

- 💥 Cada mejora de **ULTI**, además de bajar el coste de carga, ahora **amplía el radio** del pulso **+10% por nivel** → con las 5 mejoras el radio crece un **50%** (`Game.aplicarMejoras` guarda `ultiRadioMult`, `UltiEffect` lo aplica al `maxRadius`). Verificado en runtime: radio base 215 → 323 con 5 mejoras (×1.5)
- 📝 Descripción de la mejora en el menú: "− coste · + radio"
- 🤖 Android preparado como `versionCode 28` / `versionName 1.51.8` para regenerar el AAB

### v1.51.7
> **Las naves enemigas giran más suave para apuntar**

- 🎯 El giro con el que la nave encara al jugador para disparar bajó de **8 → 4** (`CONFIG.NAVE_ENEMIGA.FACTOR_GIRO_APUNTADO`): se sentía muy brusco el "snap" al apuntar. Ahora es un giro más parejo, y siguen disparando igual de seguido (verificado: 33 tiros en 6s con 6 naves). Es una palanca configurable
- 🤖 Android preparado como `versionCode 27` / `versionName 1.51.7` para regenerar el AAB

### v1.51.6
> **Fix: animación de destrucción que "a veces" no se veía + limpieza de proyectiles**

- 🎆 **Las explosiones ahora se remapean por el toroide**: antes, si un enemigo (nave o asteroide) moría cerca de la **costura del mundo**, se lo veía cerca tuyo (por el wrap) pero su explosión se creaba en la coord **lógica lejana** → no se veía la animación de destrucción. Ahora `Game._actualizarToroide` también reposiciona los efectos (`efectosImpacto`/`efectosExplosion`, tanto `.imagen` como `.sprite`) → la explosión aparece donde el enemigo se veía. Resuelve el bug "a veces destruyo una nave y no aparece la animación" (y el mismo síntoma en asteroides)
- 🧹 **Limpieza de proyectiles**: se eliminó `GameProjectiles.crearProyectil` (export muerto que ni siquiera importaba la clase `Proyectil` → habría dado ReferenceError; el real es `Game.crearProyectil`), su import, y el `multiplicadorVelocidad` de proyectil (nunca se usaba, no existe mejora de velocidad de disparo). También los params muertos `jugador`/`enemigos` de `EnemyProjectile` (sobra de cuando era teledirigido), el `this.ancho = this.largo` (con `largo` inexistente) y varios comentarios desactualizados (velocidad/vida del proyectil, "teledirigido")
- ✅ Verificado en runtime: efecto lejano (borde opuesto del mundo) se remapea al lado del jugador; proyectiles del jugador (vel 800/daño 25) y enemigos (vel 400/daño 25) siguen andando sin el código muerto
- 🤖 Android preparado como `versionCode 26` / `versionName 1.51.6` para regenerar el AAB

### v1.51.5
> **La detonación por distancia del cohete usa la animación de los proyectiles**

- 🎇 El "blast" cuando un cohete explota por **límite de alcance** (sin pegarle a nada) ahora usa la **misma animación que los proyectiles al colisionar** (`ProyectilExplosion` / `texturaExplosion`) en vez de la explosión roja de asteroide, manteniéndose del tamaño del área. Las explosiones de kills directos (verde nave / roja asteroide) quedan igual (`GameSkills.js`)
- 🔧 `ProyectilExplosion` ahora acepta una escala opcional (default 0.35), para que el cohete la escale al área (verificado: escala 0.516 = 64/124px de la textura)
- 🤖 Android preparado como `versionCode 25` / `versionName 1.51.5` para regenerar el AAB

### v1.51.4
> **Ajuste: alcance del cohete de 1500 → 500px**

- 🎯 `CONFIG.COHETE.DISTANCIA_MAXIMA` bajó de 1500 a **500px** → el cohete explota antes si no llega al blanco (correa más corta, ~1.25s de vuelo)

### v1.51.3
> **Balance: daño del cohete a 200 → el área ya no mata al especial**

- ⚖️ `CONFIG.COHETE.DANO` bajó de 999 a **200**. El impacto **directo** sigue vaporizando cualquier enemigo (usa `destroy()` directo, no el número), pero el **área** —que hace la mitad— ahora hace **100**: mata a todos los normales (chico 25, mediano 50, grande 75, nave 25) pero **deja vivo al asteroide especial** (200 HP). Así el área es de verdad más débil que el impacto directo

### v1.51.2
> **Explosión de área del cohete: animación del tamaño del área + mitad de daño**

- 💥 La explosión por **límite de alcance** (cohete sin impacto directo) ahora tiene la **animación del tamaño del área de daño** (escala derivada de `RADIO_EXPLOSION`) en vez de un tamaño fijo
- ➗ El **daño en área es la MITAD del daño del cohete** (aplicado con `salud`): si es letal destruye al enemigo (con su explosión/puntos/etc.), si no, solo lo lastima. Verificado en runtime: un enemigo tanque recibió exactamente 500 (mitad de 999) y el blast salió con escala 0.25 (`GameSkills.js`)
- 🤖 Android preparado como `versionCode 22` / `versionName 1.51.2` para regenerar el AAB

### v1.51.1
> **Cohetes: límite de alcance con explosión en área (no más "dar la vuelta al toroide")**

- 🎯 **Un cohete que pierde su objetivo ya no vaga para siempre**: antes, si el blanco se destruía antes de que el cohete llegara, el cohete seguía derecho y — como su posición envuelve el toroide (`_actualizarToroide`) — **circulaba el mundo indefinidamente** hasta chocar algo por casualidad (el corte "fuera del mundo" nunca se cumplía por el wrap). Ahora tiene un **límite de alcance** (`CONFIG.COHETE.DISTANCIA_MAXIMA = 1500px`): si no llega al blanco, **explota con daño en área** (radio ≈ diámetro de un asteroide chico, 32px) destruyendo lo que esté cerca (`Cohete.js`, `GameSkills.js`)
- 🧹 De paso se extrajo la lógica de "destruir enemigo por cohete" a un helper reusado por el impacto directo y por la explosión de área (menos duplicación)
- ✅ Verificado en runtime: 198 cohetes con blanco perdido → explotan y desaparecen (0 quedan circulando); 227 explosiones = blasts + kills en área
- 🤖 Android preparado como `versionCode 21` / `versionName 1.51.1` para regenerar el AAB

### v1.51.0
> **IA de naves enemigas: ahora te encaran y disparan + pasadas agresivas**

- 🎯 **Las naves ahora sí te disparan**: antes miraban de costado (tangencial a su órbita, ~96° del jugador) y solo tiraban si estaban apuntándote (±30°) → disparaban muy poco (medido: 5 tiros en 10s con 6 naves). Ahora, cuando les toca disparar, **giran para encararte** y tiran; además el disparo no se pierde si aún no están alineadas (se mantiene pendiente hasta que apuntan). Medido tras el cambio: **44 tiros en 10s** (`EnemyShip.js`, `GameEnemies.js`)
- 💨 **Pasadas agresivas (dive)**: cada 8-16s cada nave hace una pasada más cerca (~150px) durante ~2s y después vuelve a su órbita → movimiento más dinámico, no siempre a media distancia
- 🩹 **Fix de framerate**: la inercia del movimiento de las naves era `0.05` fijo por frame (no multiplicado por `delta`) → respondían más lento a menos FPS (p. ej. en el G04). Ahora es frame-independiente (mismo feel a 60fps, consistente a cualquier framerate)
- ✅ Verificado en runtime: tiros 5→44 en 10s; las naves entran en "dive" ~9% del tiempo (acercándose a ~65px); sin errores de consola
- 🤖 Android preparado como `versionCode 20` / `versionName 1.51.0` para regenerar el AAB

### v1.50.7
> **Animación de destrucción de naves consistente (siempre verde) + doble explosión en choques**

- 🟢 **La nave enemiga ahora explota SIEMPRE con la animación verde** (la común), sin importar cómo la destruyas. Antes, si la matabas con un **cohete** usaba la explosión roja del asteroide; ahora usa la verde igual que al dispararle (`GameSkills.js`)
- 💥 **Choque nave + asteroide → se ven LAS DOS animaciones**: la roja del asteroide (en su posición) y la verde de la nave (en la suya). Antes solo aparecía la del asteroide y la nave desaparecía sin explotar (`GameEnemies.js`)
- ✅ Verificado en runtime: choques nave-asteroide crean explosiones verde+roja emparejadas (58 y 56); cohetes matando naves crean 980 explosiones verdes (antes habrían sido rojas)
- 🤖 Android preparado como `versionCode 19` / `versionName 1.50.7` para regenerar el AAB

### v1.50.6
> **Naves enemigas: coherencia toroidal + limpieza de código**

- 🧭 **#2 Apuntado y disparo consistentes cerca de la costura del toroide**: la nave calculaba el ángulo al jugador por el camino corto (`EnemyShip.direccionDisparo`) pero ese valor **no se usaba** — al crear el proyectil se recalculaba con distancia cruda (sin wrap), así que cerca del borde apuntaba a un lado y disparaba al otro. Ahora el proyectil usa el ángulo toroidal ya calculado (`GameEnemies.js`)
- 🧭 **#3 Colisión nave-asteroide toroidal**: usaba una comprobación euclidiana propia (`EnemyShip.verificarColision`); ahora usa `game._verificarColision` (toroidal), igual que el resto del juego → detecta choques a través de la costura del mundo
- 🧹 **#4 Limpieza**: se eliminó `puedeMoverse` (nunca se ponía en false) y `EnemyShip.verificarColision` (quedó sin uso); se inicializa `disparoCreado` en el constructor; comentario del radio de órbita corregido (300-500px)
- ✅ Verificado en runtime: `direccionDisparo` da el ángulo toroidal correcto (π con nave/jugador en bordes opuestos); las naves siguen disparando y apuntando al jugador (sin regresión); `_verificarColision` detecta el choque nave-asteroide incluso por la costura
- 🤖 Android preparado como `versionCode 18` / `versionName 1.50.6` para regenerar el AAB

### v1.50.5
> **Balance: los asteroides grandes ahora valen más que los chicos**

- 🏆 Se invirtió el puntaje por tamaño (antes iba al revés): **large = 30, medium = 20, small = 10** (y sus variantes rezagado igual). El especial sigue en 100. Romper un large entero (→2 medium→4 small) ahora da 30+40+40 = 110 pts, con el golpe grande valiendo más y los pedazos menos (`config.js`). Decisión del dev

### v1.50.4
> **Pulido de asteroides: rezagados sin homing, fragmentos con velocidad heredada, limpieza**

- 🛸 **Los rezagados ya no son atraídos por la gravedad de la nave**: el campo gravitatorio (dentro de 100px) aplicaba a todos los no-especiales, incluidos los rezagados, que están pensados para "pasar de largo" en línea recta. Ahora se excluyen → cruzan sin desviarse hacia vos (`Enemy.js`)
- 🌀 **Los fragmentos heredan el multiplicador de velocidad del padre** (+10% cada 5 oleadas): antes, al romper un asteroide veloz de oleada alta, sus fragmentos volvían a velocidad base ("frenazo"). Ahora mantienen el ritmo (`Enemy.js`)
- 🧹 Limpieza: se eliminó `esRomptible` (código muerto, nunca se leía) y se corrigió el comentario del multiplicador ("+10% cada 5 oleadas", antes decía "cada 10")
- ✅ Verificado en runtime: un rezagado a 44px del jugador no se desvía (dy=0), un asteroide normal sí es atraído (dy=−2.9, control), y el fragmento de un large con multiplicador 1.6 lo hereda
- 🤖 Android preparado como `versionCode 16` / `versionName 1.50.4` para regenerar el AAB

### v1.50.3
> **Fix: las naves enemigas de la periferia ahora sí disparan (zoom)**

- 🐛 El chequeo de "¿la nave está en pantalla para disparar?" usaba `anchoJuego/altoJuego` (tamaño **sin** zoom), pero con `ZOOM 0.70` la vista real abarca `anchoJuego/ZOOM` (~43% más área). Resultado: naves visibles en la **periferia** de la pantalla **se veían pero no disparaban** (el cuadro cubría solo el ~70% de lo visible). Ahora se compara contra la vista real con zoom (`GameEnemies.js`)
- ✅ Verificado en runtime: 6 naves fijadas en la banda periférica (x≈2618, fuera del cuadro viejo que terminaba en 2450) disparando 723 proyectiles; con el código viejo no habrían disparado
- 🤖 Android preparado como `versionCode 15` / `versionName 1.50.3` para regenerar el AAB

### v1.50.2
> **Fix de lógica de asteroides: persecución y "flotado" tras romperse**

- 🐛 **Los asteroides dejaban de perseguir para siempre tras chocar**: `direccionAlterada` se ponía en `true` al colisionar pero nunca volvía a `false`, así que un asteroide medium/small que chocaba una vez se iba en línea recta y no volvía a apuntar a la nave. Ahora el flag se resetea al terminar el enfriamiento de colisión (~0.5s) → el "empujón" es temporal y el asteroide retoma la persecución (`Enemy.js`)
- 🐛 **Fragmentos que "flotaban" ~1 minuto**: `temporizadorTrayectoria` valía `60` (pensado como frames) pero se descontaba con `delta` en segundos → la trayectoria heredada duraba ~60s en vez de ~1s. Los fragmentos de un asteroide grande quedaban derivando sin perseguir. Corregido a 1s real (`Enemy.js`)
- 💡 Efecto secundario: al no vagar/flotar fuera de vista, mueren más dentro de la pantalla → **se ven mejor sus animaciones de destrucción** (la explosión se dibuja donde está el asteroide)
- 📝 Comentarios agregados en el código explicando ambos procesos (empujón temporal por colisión y trayectoria heredada en segundos)
- ✅ Verificado en runtime: tras chocar, `direccionAlterada` vuelve a `false` al vencer el cooldown; el fragmento nace con timer 1 y suelta la herencia en ~1s
- 🤖 Android preparado como `versionCode 14` / `versionName 1.50.2` para regenerar el AAB

### v1.50.1
> **Ajuste de velocidad base + limpieza de créditos**

- 🐢 Velocidad máxima **base** bajada de **300 → 200 px/s** (`config.js`), para una nave más manejable. Con la mejora de Aceleración (+40/nivel) el tope máximo queda en **400**
- 📝 Créditos: se quitaron los bloques **"Curso"** (Programación de Videojuegos 1 / UNAHUR 2026) y **"Profesor"** (`UIManager.js`)
- 🤖 Android preparado como `versionCode 13` / `versionName 1.50.1` para regenerar el AAB

### v1.50.0
> **Aceleración constante: adiós al sobrecalentamiento; la mejora sube el tope de velocidad**

- 🚀 Se **eliminó el sobrecalentamiento de la aceleración**: antes, mantener W mucho llenaba una barra y la nave dejaba de acelerar y frenaba por 2.5s. Ahora la aceleración es **constante** — mantenés W y la nave sube hasta su tope de velocidad y se queda ahí, sin penalización (`Player.js`)
- ⬆️ La **mejora de Aceleración** ahora sube el **tope de velocidad** en vez de agrandar la barra de sobrecalentamiento: **+40 px/s por nivel** → de 300 a **500** con los 5 niveles (`Game.js`, `config.js` `VELOCIDAD_MAX_POR_MEJORA`)
- 🎯 El **arco curvo alrededor de la nave** se reutilizó: antes marcaba el recalentamiento (se ponía rojo), ahora muestra la **velocidad actual** como fracción del tope (`PixiHUD.js`). Ídem la barra rectangular del HUD
- 🧹 Limpieza: se eliminaron los campos muertos (`cargaAceleracion`, `sobrecalentadoAceleracion`, etc.), el bloque `CONFIG.ACELERACION`, la variable `estabaAvanzando` y la carga del sonido `sobrecalentamientoW` (ya no se usa)
- ✅ Verificado en runtime: manteniendo W la velocidad llega a 300 y **se queda** (antes caía a 0); al soltar frena por inercia; la mejora lleva el tope 300→340→420→500; el arco sigue la velocidad en azul; sin errores de consola
- 🤖 Android preparado como `versionCode 12` / `versionName 1.50.0` para regenerar el AAB

### v1.49.3
> **Fix: el "Volver" del Top 5 ya no queda flotando al revivir**

- 🐛 Si en el Game Over abrías el **TOP 5** y desde ahí tocabas **Revivir (ver anuncio)**, tras el anuncio el botón **Volver** del Top 5 quedaba flotando sobre la partida. Causa: `_limpiarFinJuego()` removía `btn-reiniciar/top5/revivir` por ID pero no el `btn-volver`, y descartaba el array `botonesHTML` sin recorrerlo. Ahora la limpieza remueve el `btn-volver` **y** recorre `botonesHTML` sacando del DOM cualquier botón guardado (`Game.js`). Verificado en runtime reproduciendo el camino Game Over → Top 5 → limpieza
- 🤖 Android preparado como `versionCode 11` / `versionName 1.49.3` para regenerar el AAB

### v1.49.2
> **Auto-apuntado más sutil: punto medio entre asistir y no asistir**

- 🎯 La asistencia de apuntado (touch/joystick) se sentía "pegajosa" y a veces enganchaba al enemigo equivocado. Se afinó a un punto intermedio: `CONO_GRADOS` **20° → 12°** (solo asiste si ya estás bien alineado) y `FUERZA` **0.6 → 0.3** (corrige la mitad de suave). Resultado: apuntado más fluido, sin tirones ni enganches indeseados (`config.js`)
- 🤖 Android preparado como `versionCode 10` / `versionName 1.49.2` para regenerar el AAB

### v1.49.1
> **Inicio más nítido: el juego se acomoda detrás de la pantalla de carga**

- ✨ Los 2 s finales de la pantalla de carga ("LISTO! 100%") ahora dejan correr el juego **detrás** de la carga, para que la cámara, el HUD y el escudo curvo **se acomoden** antes de mostrarse. Se acabó el "parpadeo" con cosas fuera de lugar durante el primer segundo (`UIManager.js`)
- 🧹 Nuevo `Game.prepararInicioLimpio()`: justo antes de revelar, barre todo lo que haya spawneado en esos 2 s (asteroides, naves, especiales, proyectiles, efectos) y **resetea la puntuación a 0** → el arranque queda acomodado **y** limpio, como partida nueva. Mantiene nave, HUD, partículas Boid y estado de cámara
- 🤖 Android preparado como `versionCode 9` / `versionName 1.49.1` para regenerar el AAB

### v1.49.0
> **Tutorial móvil, avisos de ganancias y optimizaciones de juego**

- 📱 Tutorial de 5 páginas ajustado para celular apaisado, con controles adaptados al modo seleccionado y botón real de mejoras
- ✨ Indicadores bajo la nave para puntos y partículas recolectadas, con el nuevo `pboids_Icon.png` y apilado sin superposiciones
- ⚡ Menos asignaciones por frame en Boids, fuerzas calculadas en una pasada y limpieza duplicada de enemigos eliminada
- 🔊 Sonido al destruir naves enemigas contra asteroides y un único efecto de explosión PNG, con fallback procedural si falta la textura
- 🤖 Android preparado como `versionCode 8` / `versionName 1.49.0` para regenerar el AAB

### v1.48.9
> **Mundo toroidal más grande (3× → 5×): explosiones que se veían "sin animación"**

- 🌐 El mundo pasó de **3× a 5×** la pantalla (`Game.js`). Aleja la "costura" del toroide, así los enemigos mueren más adentro de la vista y **se ven sus explosiones** (antes, cerca del borde del mundo, morían off-screen y la explosión no se veía). Verificado: FPS estable (no agrega carga — las entidades están capadas y spawnean relativas a la nave)

### v1.48.8
> **Fix: el sonido de la ULTI se escucha (estaba muy bajo)**

- 🔊 El `ulti.mp3` estaba grabado muy bajo (pico −17,9 dB, casi inaudible). Se **amplificó +15 dB** con ffmpeg (pico −3,3 dB, sin clipear) y su volumen en `config.js` pasó a **1.0**. Ahora la ULTI se escucha clara

### v1.48.7
> **Audio comprimido: música de menú 4,9 MB → 1,8 MB**

- 🎵 **Música re-encodeada** de 256 kbps a **96 kbps estéreo** con ffmpeg: `musica_menu.mp3` 4,9 MB → **1,8 MB** (−62%), `musica_juego` 728 KB → 364 KB. Verificado en runtime: cargan y reproducen bien
- 📉 Con esto, `assets/` completo pasó de **~31 MB → 8 MB** (imágenes + audio)

### v1.48.6
> **Antialias off en celular (ahorra GPU) + limpieza del backlog**

- 🎨 **Antialias condicional**: `Game.init` ahora usa `antialias: !modoTouch` → ON en PC (bordes de vectores suaves), **OFF en celular** para ahorrar fill-rate en la GPU del G04. Impacto visual mínimo (casi todo son sprites)
- 🧹 Limpieza del backlog en `PENDIENTES.md` (entradas ya hechas: ícono/splash, AdMob revive; y la nota del radio de ULTI ya resuelta)

### v1.48.5
> **Fix: el marcador superior (puntos/recursos) volvió a su tamaño**

- 🩹 `puntacion-recursos.png` se había achicado en v1.48.4 al redimensionarlo: el HUD lo dimensiona con coordenadas de su resolución nativa (2172×431). Se restauró a su resolución original y se comprimió **sin redimensionar** (1745 KB → 571 KB). El resto de las imágenes (marcos, chips, íconos, cohete) usan escala adaptativa, así que no se vieron afectadas

### v1.48.4
> **Imágenes comprimidas: assets de ~25 MB → ~5 MB (−80%)**

- 🗜️ **Compresión de las 75 imágenes** con cuantización de paleta + dithering (y redimensionado de las 12 que superaban 1280 px). Ejemplos: portada 3,7 MB → 782 KB, `fondoEspacio3.png` 2 MB → 144 KB, marcos de mejora ~1,7 MB → ~250 KB c/u. **Sin pérdida visual** (verificado en runtime: menú, HUD, ventanas, gameplay) y **mismos nombres de archivo** (cero cambios de código)
- 📉 Menos tiempo de carga, menos RAM y menos memoria de GPU en el celu. Falta el audio (`musica_menu.mp3` 4,9 MB) — pendiente, requiere ffmpeg (ver `documentacion/prompt-optimizar-assets.md`)

### v1.48.3
> **Menos estrellas de fondo + plan de optimización de assets documentado**

- ⭐ **Menos estrellas de fondo** (90 → 40): menos sprites que actualizar/renderizar en el celu
- 📄 **Plan de optimización de assets** documentado (`documentacion/prompt-optimizar-assets.md`): guía completa para comprimir imágenes (~25 MB → ~3-5 MB), re-encodear audio y ajustar antialias en móvil. Anotado también en `PENDIENTES.md` (backlog) el texture atlas y el object pooling como pasos posteriores

### v1.48.2
> **Fix: revivir tras guardar récord + área/animación de la ULTI con el zoom**

- 🏆 **Revivir bloqueado tras guardar un récord**: si moriste con puntuación nueva y guardaste tu nombre en el Top 5, ya **no aparece** el botón "Revivir" (la partida quedó cerrada). Si no guardaste, sigue disponible
- 🎯 **ULTI ajustada al zoom**: el radio de la onda (animación + área de destrucción) ahora contempla el zoom de cámara (`maxRadius / ZOOM`) → cubre la misma proporción de la vista que antes del zoom (se veía y afectaba más chica)

### v1.48.1
> **Rendimiento (caps + grilla de boids), controles por modo y varios fixes**

- ⚡ **Rendimiento**: límite de asteroides (30) y **naves enemigas (6)** activos, para acotar las colisiones O(n²) en partidas largas. Grupo de partículas Boid clampeado a su máximo
- 🐝 **Grilla espacial de Boids**: el sistema de partículas pasó de O(n²) a ~O(n) (cada boid solo mira su celda + las 8 adyacentes en vez de las 100) → ~2,5× más rápido, mismo comportamiento y cantidad
- 🎛️ **Controles por modo**: la ventana de Controles cambia según el modo (mouse/teclado reasignable · joystick muestra el mapeo · touch permite elegir el layout izquierda/derecha)
- ⚙️ **Config de generación editable**: el máximo de especiales, la probabilidad del especial y la distribución de tipos se movieron a `CONFIG.GENERACION`
- 🎯 **Detección de modo táctil mejorada**: usa el tipo de puntero (una laptop táctil ya no cae en modo touch por error)
- ⏳ **Pantalla de carga**: espera 2 s en el 100% y el juego arranca fresco (congelado durante la carga)
- ✨ Se quitó la animación de partículas al girar la nave
- 💥 **Fix**: los asteroides "rezagado" ahora explotan del tamaño correcto (antes usaban un nombre inexistente y salían chicos)

### v1.48.0
> **Zoom de cámara + auto-apuntado (touch/joystick) + fix del HUD de aceleración**

- 🔭 **Zoom de cámara**: la cámara se alejó (`CONFIG.CAMARA.ZOOM = 0.70`) → se ve ~43% más de área alrededor de la nave. Todo el mundo (nave, asteroides, enemigos) se escala proporcional; el HUD, el fondo y las estrellas quedan igual (son capas aparte). Se ajustaron cámara, apuntado con mouse y culling para contemplar el zoom
- 🎯 **Auto-apuntado (ayuda de puntería sutil)**: en **touch y joystick**, cuando apuntás cerca de un enemigo (dentro de un cono) la mira se corrige un poco hacia él. Configurable en `CONFIG.AUTOAPUNTADO` (cono, fuerza, rango, on/off). El mouse queda 100% preciso
- 🛠️ **Fix**: la barra curva de aceleración volvió a su lugar **alrededor de la nave** (con el zoom había quedado desplazada a la esquina); ahora contempla posición y escala del zoom
- Verificado en runtime (navegador) y probado en el Motorola G04

### v1.47.7
> **La música del menú suena apenas abre la app (sin pedir un toque)**

- 🎵 En la **app Android** la música del menú ahora arranca **al instante** al abrir, sin ningún click previo. Se logró habilitando el autoplay del WebView en `MainActivity.java` (`setMediaPlaybackRequiresUserGesture(false)`)
- 🌐 En **web** el navegador bloquea el autoplay con sonido (política del navegador, no se puede evitar): la música arranca **en la primera interacción**, pero **sin ningún prompt** — `iniciarMusicaMenu()` se auto-recupera si el primer intento quedó bloqueado
- 🧹 Se descartó la idea del overlay "tocá para empezar" (no hacía falta pedir el toque)

### v1.47.6
> **Sonidos del asteroide especial (colisión y destrucción)**

- 🔊 **Colisión del asteroide especial**: cuando choca con un asteroide sin destruirse suena el mismo audio de rebote (`revoteEntreMeteoritos.mp3`), compartiendo el throttle de 70 ms
- 💥 **Destrucción del asteroide especial**: usa la **explosión de las naves** (`destruccion_nave.mp3`) en todos los casos — destruido por proyectil, por cohete, por otro asteroide o por una nave
- ♻️ Se refactorizó el sonido de rebote en un helper `_sonarRebote()` reutilizado por asteroides normales y el especial
- Verificado en runtime (navegador) para los cuatro casos

### v1.47.5
> **Sonidos de colisión y de destrucción por cohete**

- 🔊 **Rebote entre asteroides**: cuando dos asteroides chocan sin destruirse suena el nuevo audio de rebote (`revoteEntreMeteoritos.mp3`), con un throttle de 70 ms para que no se sature al haber muchos choques
- 💥 **Choque del jugador**: al chocar contra un asteroide suena la destrucción de meteorito; al chocar contra una nave enemiga suena la explosión de nave
- 🚀 **Cohetes**: cuando un cohete destruye un meteorito suena la destrucción de meteorito, y cuando destruye una nave suena la explosión de nave
- Verificado en runtime (navegador) para los cuatro casos

### v1.47.4
> **Top 5 de Game Over: columnas mejor distribuidas (ya no se enciman)**

- 📊 En el Top 5 del Game Over las columnas (N° / NOMBRE / PUNTOS / OLEADAS) se **separaron** y la fuente se achicó un poco → ya no se superponen los nombres con los puntajes, y "OLEADAS" entra completo en el marco. Verificado en resolución de celular

### v1.47.3
> **AdMob: anuncios en modo real (MODO_PRUEBA=false) para publicar**

### v1.47.2
> **Game Over: el botón "Revivir" quedó fuera del marco, abajo**

- 🔁 El botón **"Revivir (ver anuncio)"** se movió **fuera del marco, centrado y debajo** de Reiniciar / TOP 5 (antes iba en la fila de adentro)

### v1.47.1
> **AdMob: IDs reales de la cuenta del dev (en modo prueba)**

- 🔑 Se pusieron el **App ID** y el **ad unit** reales de la cuenta de AdMob. Siguen mostrándose **anuncios de prueba** (`isTesting` activo) hasta publicar, para no arriesgar la cuenta

### v1.47.0
> **Android: revivir mirando un anuncio (AdMob rewarded)**

- 🎬 En la app, al perder aparece un botón **"Revivir (ver anuncio)"**: mirás un anuncio recompensado y tu nave **vuelve a la vida en la misma partida** (escudo lleno, 2s de invulnerabilidad, limpia enemigos cerca). **Ilimitado** por partida. Por ahora con **anuncios de prueba** de Google (cambiar por los reales al publicar)
- 🖥️ En la web/PC no aparece (no hay anuncios); el juego no cambia

### v1.46.0
> **Android: ícono y splash propios de la app**

- 🚀 La app Android ahora tiene **ícono propio** (la nave sobre fondo espacial, con ícono adaptativo) y **splash** (pantalla de carga), en vez de los default de Capacitor. Generados con `@capacitor/assets` desde las fuentes en `recursos-app/` (script `hacer-icono.mjs`)

### v1.45.1
> **Menú: imagen de portada subida (el título toca el borde superior)**

- 🎮 La imagen del menú se **subió** (`background-position: center 24%`) para que el **título "Jugando en el Espacio" apenas toque el borde superior**

### v1.45.0
> **Táctil: botones de habilidad en la esquina + se iluminan según disponibilidad**

- 📍 Los botones de habilidad (y FUEGO) se movieron **más a la esquina** abajo-derecha, dejando más área de juego libre
- 💡 Los botones ahora se **iluminan cuando la habilidad está disponible** y se **apagan (atenúan)** cuando están en cooldown o sin carga — igual que los iconos del HUD

### v1.44.0
> **Táctil: joystick analógico — la aceleración depende de cuánto empujás**

- 🕹️ En modo Touch, el **joystick ahora acelera por intensidad**: cuánto lo empujás define **qué tan fuerte acelerás** y **cuánto gastás** la carga de sobrecalentamiento (empuje suave = suave y dura más; a fondo = fuerte y se calienta antes). Zona muerta chica: un toque leve solo apunta
- ➖ Se **quitó el botón de Acelerar** (ya no hace falta): quedan 4 botones de habilidad (Ulti, Cohetes, Propulsor, Devorador)
- 🖥️ En **Mouse-teclado y Joystick físico** la aceleración sigue completa (on/off), como siempre

### v1.43.2
> **Táctil: el menú de mejoras se agranda 25% al desplegarse (antes 15%)**

- 🔎 En modo Touch, al abrir el menú de mejoras las columnas ahora crecen **25%** (antes 15%). Verificado que siguen entrando sin encimarse

### v1.43.1
> **HUD táctil: ajustes (columna izq de mejoras, botones espaciados, joystick flotante)**

- 🔧 **Fix columna izquierda de mejoras**: en táctil la columna izquierda no mostraba los chips completos (su placa quedaba fuera de pantalla); ahora despliega bien, igual que la derecha
- ↔️ **Botones de habilidad más separados** (menos encimados) alrededor del FUEGO
- 🕹️ **Joystick flotante**: aparece **donde tocás** la mitad izquierda de la pantalla y desaparece al soltar (antes era fijo)
- 🌫️ Opacidad de los controles táctiles **bajada otro 25%** (más transparentes)

### v1.43.0
> **HUD táctil reacomodado: botones de habilidad junto al FUEGO + mejoras que se despliegan**

- 📱 En **modo Touch**, el HUD lateral (columnas de chips) ahora queda **fuera de pantalla** mientras jugás, y aparecen **5 botones de habilidad agrupados junto al FUEGO** (Acelerar, Ulti, Cohetes, Propulsor, Devorador), cada uno con **su icono**
- ✨ Al **abrir el menú de mejoras**, las columnas **se deslizan hacia adentro y crecen 15%**; el marcador de puntos/partículas de arriba **no se agranda**
- 🖥️ En **Mouse-teclado y Joystick el HUD queda igual que siempre** (todo gateado por el modo de control)

### v1.42.0
> **Game Over y Top 5 de Game Over adaptados a celular**

- 📱 Las ventanas **Game Over** y **Top 5 de Game Over** (dibujadas en PixiJS) ahora se ven bien en el celular: el texto y las columnas se posicionan **proporcionales al marco** (antes "Oleada Alcanzada" pisaba los botones y la columna N° se salía), y los botones HTML (Reiniciar / TOP 5 / Volver) se ubican con la **conversión correcta de coordenadas** del canvas (antes se corrían y el Volver se superponía a la tabla)

### v1.41.6
> **Fix: Controles ahora se achica bien (el botón Volver ya no queda abajo)**

- 🔧 La ventana de **Controles** tenía un `max-height` interno que engañaba al cálculo de escala → el botón **Volver quedaba fuera de pantalla** y no se podía volver. Ahora usa altura natural + escala como las demás y entra completa

### v1.41.5
> **Ventanas que se achican para entrar en el celular (sin scroll)**

- 📱 Las ventanas de **Opciones, Controles, Créditos y Top 5** ahora **se achican (escalan) para entrar completas** en la pantalla del celular, en vez de scrollear. Mantienen sus proporciones y no se corta nada. En pantallas altas (PC) la escala es 1 → quedan igual que antes

### v1.41.4
> **Ventanas adaptadas a celular (scroll) — reemplazado por escala en v1.41.5**

- 📱 (Primer intento) las ventanas scrolleaban si no entraban. Se cambió por el sistema de **escala** en v1.41.5 a pedido

### v1.41.3
> **Mejoras: los iconos titilan cuando hay una mejora disponible**

- ✨ Cuando una mejora se puede comprar, su icono ahora **titila** (pulsa la opacidad) además de brillar, y el **icono de mejoras** de arriba también titila si hay al menos una disponible. Los que no alcanzan quedan atenuados fijos. Ayuda a notar cuándo comprar

### v1.41.2
> **Menú: botones 15% más chicos en celular**

- 📱 En **celular (táctil)** los botones del menú principal van un **15% más chicos** (256→218px). Atado a la detección táctil (no a la altura), porque el celular puede tener el mismo alto que el desktop. En **PC no cambia**

### v1.41.1
> **Android: botón "atrás" = Escape**

- 🔙 En la app Android, el **botón "atrás"** del celular ahora hace lo mismo que **Escape**: con una partida en curso abre (o cierra) la ventana **"¿Volver al menú?"**; en el menú o Game Over, sale de la app. Usa el plugin `@capacitor/app`. En la web de escritorio no cambia nada (Escape sigue por teclado)

### v1.41.0
> **Empaquetado Android con Capacitor (setup)**

- 🤖 Se sumó **Capacitor** (v8.4.2) para empaquetar el juego como **app Android** (`.apk`/`.aab`) sin reescribir nada. Nuevos scripts: `npm run cap:sync` (arma `www/` + sincroniza) y `npm run cap:open` (abre Android Studio)
- 🔒 Config nativa: **orientación horizontal bloqueada** + **modo inmersivo** (oculta las barras de Android → libera el borde de la columna de habilidades)
- 📁 `capacitor.config.json` + `scripts/build-www.mjs` versionados; `www/` y `android/` se generan (ignorados en git). El detalle del proceso queda en un informe interno

### v1.40.6
> **Menú: título del juego completo (imagen anclada arriba)**

- 🎮 El fondo del menú principal ahora se ancla arriba (`background-position: center top`) → el **título "Jugando en el Espacio" se ve completo** y no se recorta en pantallas anchas (celular apaisado). Mejora también en PC

### v1.40.5
> **Mobile: ajustes tras probar en celular real (Motorola G04)**

- 📱 **Iconos de habilidad completos**: en celular las columnas laterales del HUD se separan del borde (margen ~1.4% del ancho) para que los iconos **no se vean cortados** y despeguen de la barra de Android. En PC no cambia (siguen casi al borde)
- 🕹️ **Joystick y FUEGO más grandes**: joystick 130→170px (perilla 60→78, rango 55→72) y botón FUEGO 100→130px, para tocar más cómodo
- ↔️ **Más separación**: joystick y FUEGO movidos a 10% del borde → quedan a ~32px de las columnas (antes ~4px), sin toques accidentales

### v1.40.4
> **Mobile: HUD 25% más grande en celular**

- 📱 En **celular (dispositivo táctil)** el HUD se muestra **25% más grande** (marcadores, iconos de habilidad, barras) y, como todo se escala junto, sus elementos quedan **más separados** — más fácil de ver y tocar. En **PC no cambia nada** (factor 1). Ajustable desde `CONFIG.HUD.BOOST_TACTIL`

### v1.40.3

- 📱 **Menú principal en celular**: los botones (JUGAR, TUTORIAL, TOP 5, OPCIONES, CRÉDITOS) ahora **se achican según la altura de pantalla** para que **entren los 5** en un celular apaisado (antes JUGAR y CRÉDITOS quedaban cortados fuera de pantalla). En desktop no cambia (siguen a 256px)
- 🎮 **Joystick y botón de fuego** movidos **más hacia adentro** de la pantalla (de `4%`/`8%` a `7%`/`11%` del borde), para que no queden pegados al filo

### v1.40.2
> **Táctil: controles un poco más sutiles**

- 🎮 Los **controles táctiles** (joystick + botón de fuego) ahora se ven con **−25% de opacidad**, para que estorben menos la vista del juego

### v1.40.1

- 📲 En celular, si está en **vertical** aparece un aviso **"Girá el dispositivo"** (el juego se juega en horizontal). Solo en dispositivos táctiles (no molesta al desktop). CSS puro con `@media (orientation: portrait) and (pointer: coarse)`

### v1.40.0
> **Modo de control (Mouse y teclado / Joystick / Touch) + táctil por iconos del HUD**

- ⚙️ Nuevo **selector de modo** en Opciones → Controles: **Mouse y teclado / Joystick / Touch** (se guarda). El **teclado funciona siempre**, en cualquier modo. El overlay táctil y el apuntado-por-mouse dependen del modo
- 📱 En táctil: el **joystick solo apunta**; la **aceleración** se activa tocando su icono en el HUD (como las habilidades), y las **mejoras** se abren tocando el **icono de mejoras de arriba**

### v1.39.1
> **Fix táctil: al soltar el joystick la nave conserva la dirección**

- 🕹️ Con los controles táctiles activos se **desactiva el apuntado por mouse** (en táctil los toques emulan `mousemove` y, al soltar el joystick, le robaban la dirección). Ahora al soltar, la nave **queda apuntando a la última dirección**

### v1.39.0
> **Controles táctiles (celular) — paso 1 del roadmap mobile**

- 📱 Overlay en pantalla para jugar en celular: **joystick virtual** (abajo-izq) que **apunta y acelera** la nave, y un **botón de disparo** (abajo-der). Las **habilidades** (Ulti, Devorador, Cohetes, Propulsor) se usan **tocando sus iconos en el HUD** — sin botones aparte. Convive con teclado/mouse/joystick y solo aparece en dispositivos táctiles. Entra por el mismo patrón que el gamepad (no toca la lógica del juego)

### v1.38.1
> **Joystick: apuntar con el stick izquierdo**

- 🕹️ El apuntado pasó al **stick izquierdo** (antes era el derecho). El derecho queda como **alternativa** si el izquierdo está en el centro

### v1.38.0
> **Soporte de joystick / gamepad**

- 🎮 Ahora se puede jugar con **joystick** (Gamepad API): el **stick** apunta la nave, **RT/A** acelera, **LT/X** dispara, **B** Ulti, **LB** Devorador, **RB** Cohetes, **Y** Propulsor. Convive con teclado y mouse (usás lo que tengas a mano), con zona muerta en el stick y detección automática del mando. Tutorial actualizado

### v1.37.5
> **Fix Game Over: reiniciar solo con el botón (no al hacer click afuera)**

- 🐛 Se sacó el "reiniciar al hacer click en cualquier lado" (y con ENTER) en el Game Over: chocaba con la ventana de **nuevo récord** — un click afuera del input reiniciaba el juego por debajo y dejaba la ventana huérfana con los botones flotando. Ahora el reinicio **depende solo del botón Reiniciar**

### v1.37.4
> **Créditos: JANOPRO en beta testers**

- 🙌 Se agregó **JANOPRO** a la sección de beta testers en Créditos (junto a TPC). Cierre del mapa toroidal (pasos 1 + A+B + C + fondo sin costura), probado y aprobado

### v1.37.3
> **Mapa toroidal — fondo y estrellas sin costura (parallax continuo)**

- 🌌 El fondo y las estrellas ahora usan un **acumulador continuo** del movimiento de la nave en vez de la cámara (que **saltaba** al envolver) → al cruzar el borde el parallax scrollea **parejo, sin salto**, con cualquier imagen. Con esto el toroide se ve fluido de punta a punta

### v1.37.2
> **Mapa toroidal — paso C: lógica toroidal + disparos enemigos rectos**

- 🎯 Los **disparos de las naves enemigas ya NO son teledirigidos**: apuntan al jugador al disparar y van **rectos**
- 🌀 La lógica ahora usa el **camino corto** del toroide: puntería/órbita/esquiva de las naves enemigas, atracción y fuga de los **boids** (devorador), homing de los **cohetes** y el spawn. Cerca de la costura todo apunta/persigue/impacta bien (antes iba por el lado largo)

### v1.37.1
> **Mapa toroidal — paso A+B: mundo sin costura + todo envuelve**

- 🌀 Ahora **todas las entidades envuelven** (asteroides, enemigos, naves, proyectiles, boids, cohetes) y se dibujan en su **copia más cercana a la nave** → el mundo se ve **sin costura** (desaparece el salto del borde). El culling y las colisiones usan **distancia toroidal** (no atravesás cosas que se ven pegadas cerca del borde). *Falta el paso C: puntería de enemigos, atracción de boids y cohetes teledirigidos por el camino corto*

### v1.37.0
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
| `aceleracion.png` | Icono de aceleración |
| `cohetes.png` | Icono de habilidad Cohetes |
| `propulsor.png` | Icono de habilidad Propulsor |
| `relog1.png` - `relog6.png` | Animación de Tiempo Fuera |
| `puntuacion2.png` | Decoración UI inferior |
| `botonJuegar.png` / `botonTutorial.png` / `botonTOP5.png` / `botonOpciones.png` / `botonCreditos.png` | Botones del menú principal |
| `botonVolver.png` | Botón Volver (pantallas) |
| `guardadoBoton.png` | Botón guardar record |

### Fondos y Pantallas
| Archivo | Uso |
|---------|-----|
| `jugando en el espacio.png` | Portada/fondo del menú principal |
| `gameOver.png` | Fondo de ventanas (Game Over, Controles, Top 5, Créditos) |
| `guardarPuuntos.png` | Formulario Top 5 |

> **Assets retirados:** los sprites e imágenes viejos que ya no usa el juego se movieron a `assets-no-usados/` (no afectan al build; quedan como referencia).

---

## 📝 Licencia

MIT

