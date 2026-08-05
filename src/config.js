/**
 * config.js - Configuración central de balance del juego
 *
 * Punto único donde se ajustan todos los valores de gameplay (velocidades,
 * daños, cargas, cooldowns, etc.). En vez de buscar los números "mágicos"
 * repartidos por el código, se editan acá y el resto del juego los lee.
 *
 * Tiempos en segundos · distancias y velocidades en píxeles.
 */
export const CONFIG = {

    // === MUNDO / ESCENARIO ===
    MUNDO: {
        ANCHO: 1080,                    // Ancho del área de juego (px)
        ALTO: 720,                      // Alto del área de juego (px)
        TOROIDAL: true,                 // Mundo toroidal: la nave sale por un borde y entra por el opuesto (paso 1: solo nave + cámara)
        MAX_ASTEROIDES: 30,             // Máximo de asteroides en pantalla
        MAX_NAVES_ENEMIGAS: 6,          // Limite de naves enemigas activas para sostener FPS estable
        SPAWN_INTERVALO: 1.5,           // Segundos entre oleadas de asteroides
        SPAWN_INTERVALO_MINIMO: 0.3,    // Intervalo mínimo (dificultad máxima)
        SPAWN_TASA_DISMINUCION: 0.10,   // Cuánto baja el intervalo por oleada
        NAVE_ENEMIGA_INTERVALO: 10,     // Segundos entre naves enemigas
        OLEADA_OBJETIVO: 10,            // Asteroides a destruir para subir de oleada
    },

    // === CÁMARA ===
    CAMARA: {
        // Zoom de la cámara sobre el mundo (escala del contenedor `mundo`).
        // 1 = 1:1 (la nave se ve grande). <1 = ALEJA: se ve más área alrededor y
        // todo el mundo (nave, asteroides, enemigos) se achica proporcional. El
        // HUD, el fondo y las estrellas NO se afectan (son capas aparte del mundo).
        // 0.70 ≈ 43% más de área visible.
        ZOOM: 0.70,
    },

    // === AUTO-APUNTADO (ayuda de puntería en TOUCH y JOYSTICK) ===
    // Imán sutil: cuando ya estás apuntando CERCA de un enemigo (dentro del cono),
    // corrige un poco el ángulo hacia él. SOLO en touch/joystick; con mouse el
    // apuntado queda 100% preciso (no se toca). Subir FUERZA/CONO = más ayuda.
    AUTOAPUNTADO: {
        ACTIVO: true,
        CONO_GRADOS: 20,   // semiángulo: ayuda si el enemigo está a <=20° de tu mira
        FUERZA: 0.6,       // cuánto corrige hacia el enemigo (0 = nada · 1 = apunta exacto)
        RANGO: 600,        // alcance en px (≈ rango de tiro); ignora enemigos más lejos
    },

    // === HUD ===
    HUD: {
        // En celular (dispositivo táctil) el HUD se agranda este factor y, como
        // todos los offsets internos se multiplican por la escala, sus elementos
        // quedan un 25% más grandes Y más separados. En PC (sin táctil) = 1 (igual).
        BOOST_TACTIL: 1.25,
    },

    // === JUGADOR (nave) ===
    JUGADOR: {
        VELOCIDAD_MAX: 300,             // Velocidad máxima de avance (px/s)
        ACELERACION: 400,               // Cuánto sube la velocidad al apretar W (px/s²)
        FRICCION: 0.95,                 // Inercia al soltar W (0.95 = pierde 5% por frame)
        VELOCIDAD_ROTACION: 4,          // Velocidad de giro (rad/s)
        RADIO_COLISION: 32,             // Radio de colisión de la nave (px)
    },

    // === ACELERACIÓN / SOBRECALENTAMIENTO (tecla W) ===
    ACELERACION: {
        CARGA_MAXIMA: 100,              // Carga que llena la barra de sobrecalentamiento
        VELOCIDAD_CARGA: 50,            // % por segundo (50 = llena en 2 s)
        DURACION_ENFRIAMIENTO: 2.5,     // Segundos de enfriamiento tras sobrecargar
    },

    // === ESCUDOS (vida) ===
    ESCUDOS: {
        MAXIMO: 100,                    // Escudos máximos base
        DURACION_SOBRECALENTAMIENTO: 10, // Segundos del estado sin escudos
    },

    // === DISPARO ===
    DISPARO: {
        ENFRIAMIENTO: 0.2,              // Segundos entre disparos (base)
        ENFRIAMIENTO_MINIMO: 0.05,      // Tope inferior del enfriamiento con mejoras
        MULTIPLICADOR_MEJORA: 0.8,      // Cada mejora multiplica el enfriamiento por esto
    },

    // === CONTROLES (mapeo editable) ===
    // Cada acción tiene un `label` (para la UI de Opciones) y una lista de
    // `teclas` (bindings). Un binding puede ser una tecla del teclado
    // ('KeyW', 'Space', 'ArrowUp', ...) o un botón del mouse ('MouseLeft',
    // 'MouseRight'). El GestorEntrada arma el mapa código→acción desde acá, y el
    // jugador puede reasignar cada control desde Opciones (se guarda en
    // localStorage). El APUNTADO con el mouse (posición del cursor) es fijo, no
    // se reasigna. El orden acá define el orden en la pantalla de Controles.
    CONTROLES: {
        avanzar:     { label: 'Acelerar',        teclas: ['MouseRight', 'KeyW', 'ArrowUp'] },
        disparar:    { label: 'Disparar',        teclas: ['MouseLeft', 'Space'] },
        ulti:        { label: 'Ulti',            teclas: ['KeyS', 'ArrowDown'] },
        devorar:     { label: 'Devorador',       teclas: ['KeyE'] },
        cohetes:     { label: 'Cohetes',         teclas: ['KeyQ'] },
        propulsor:   { label: 'Propulsor',       teclas: ['KeyR'] },
        pausa:       { label: 'Pausa / Mejoras', teclas: ['KeyP'] },
        mostrarTop5: { label: 'Ver Top 5',       teclas: ['KeyT'] },
    },

    // === ATAQUE ESPECIAL (ULTI) ===
    ULTI: {
        CARGA_MAXIMA: 500,              // Puntos necesarios para cargar la ulti
        COOLDOWN_TECLA: 0.5,            // Anti-spam de la tecla S (no es la carga)
    },

    // === PROPULSOR (dash, tecla R) ===
    PROPULSOR: {
        DURACION: 0.2,                  // Duración del dash (s)
        VELOCIDAD: 1500,                // Velocidad durante el dash (px/s ≈ 300px en 0.2s)
    },

    // === PROYECTIL DEL JUGADOR ===
    PROYECTIL: {
        VELOCIDAD: 800,                 // px/s
        DANO: 25,                       // Daño que hace a los asteroides
        TIEMPO_DE_VIDA: 0.75,           // Segundos antes de autodestruirse (800×0.75 = 600px de alcance)
    },

    // === PROYECTIL ENEMIGO (teledirigido) ===
    PROYECTIL_ENEMIGO: {
        VELOCIDAD: 400,                 // px/s
        DANO: 25,                       // Daño que hace a los escudos del jugador
        TIEMPO_DE_VIDA: 3,              // Segundos antes de autodestruirse
    },

    // === ASTEROIDES (stats por tipo) ===
    // La clave es el string de tipo usado en el código (this.tamanio).
    // RADIO en px (también define colisión) · VELOCIDAD en px/s.
    ASTEROIDES: {
        small:           { RADIO: 16, ESCALA: 0.16, VELOCIDAD: 150, SALUD: 25,  PUNTOS: 30,  DANO: 10, CARGA_ULTI: 15 },
        medium:          { RADIO: 32, ESCALA: 0.32, VELOCIDAD: 100, SALUD: 50,  PUNTOS: 20,  DANO: 25, CARGA_ULTI: 15 },
        large:           { RADIO: 64, ESCALA: 0.64, VELOCIDAD: 50,  SALUD: 75,  PUNTOS: 10,  DANO: 50, CARGA_ULTI: 15 },
        special:         { RADIO: 48, ESCALA: 0.48, VELOCIDAD: 120, SALUD: 200, PUNTOS: 100, DANO: 0,  CARGA_ULTI: 0 },
        large_rezagado:  { RADIO: 64, ESCALA: 0.64, VELOCIDAD: 60,  SALUD: 75,  PUNTOS: 10,  DANO: 50, CARGA_ULTI: 15 },
        medium_rezagado: { RADIO: 32, ESCALA: 0.32, VELOCIDAD: 80,  SALUD: 50,  PUNTOS: 20,  DANO: 25, CARGA_ULTI: 15 },
        small_rezagado:  { RADIO: 16, ESCALA: 0.16, VELOCIDAD: 120, SALUD: 25,  PUNTOS: 30,  DANO: 10, CARGA_ULTI: 15 },
    },

    // === NAVE ENEMIGA ===
    NAVE_ENEMIGA: {
        SALUD: 25,
        DANO: 25,                       // Daño a los escudos del jugador
        CARGA_ULTI: 30,                 // Carga de ulti que da al destruirla
        VELOCIDAD: 225,                 // px/s
        RADIO_COLISION: 15,
        INTERVALO_DISPARO: 3,           // Segundos entre disparos
    },

    // === HABILIDADES ACTIVAS (Q / E / R) ===
    HABILIDADES: {
        COHETES_COOLDOWN: 5,            // s (tecla Q)
        COHETES_CANTIDAD: 2,            // A cuántos enemigos cercanos apunta
        DEVORADOR_COOLDOWN: 5,          // s (tecla E)
        DEVORADOR_RANGO: 200,           // px de atracción de partículas Boid
        DEVORADOR_VELOCIDAD: 400,       // Velocidad de atracción (px/s)
        PROPULSOR_COOLDOWN: 15,         // s (tecla R)
        TIEMPO_FUERA_REGENERACION: 10,  // Escudos que regenera al terminar
    },

    // === COHETE (habilidad Q - proyectil teledirigido) ===
    COHETE: {
        VELOCIDAD: 400,                 // px/s
        DANO: 999,                      // Destruye cualquier enemigo de un hit
        RADIO: 8,                       // Radio de colisión del cohete (px)
    },

    // === GENERACIÓN DE ENEMIGOS (escalado de dificultad) ===
    GENERACION: {
        VELOCIDAD_AUMENTO_POR_OLEADA: 0.10,  // +10% velocidad por cada 5 oleadas
        VELOCIDAD_AUMENTO_MAXIMO: 0.60,       // Techo del aumento de velocidad (60%)
        NAVE_INTERVALO_BASE: 8,               // Segundos entre naves al inicio
        NAVE_INTERVALO_MINIMO: 5,             // Mínimo tras escalar con oleadas
        COLISION_DANO_LARGE: 50,              // Daño mutuo entre asteroides large al chocar
        COLISION_ENFRIAMIENTO: 0.5,           // Segundos sin volver a colisionar tras impacto

        // --- Asteroide ESPECIAL ---
        MAX_ESPECIALES: 3,                    // Máximo de asteroides especiales en pantalla
        PROB_ESPECIAL: 0.02,                  // Prob. de que un spawn sea especial (2%)
        PROB_ESPECIAL_OLEADA_ALTA: 0.04,      // Sube a 4% desde la oleada de abajo
        OLEADA_PROB_ESPECIAL_ALTA: 10,        // Oleada desde la que el especial sube a 4%

        // --- Distribución de tipos de asteroide ---
        // Cortes ACUMULATIVOS sobre Math.random() (tras descontar el especial):
        // rand < corte → ese tipo, en este orden. El resto (rand >= UMBRAL_MEDIUM)
        // es small. Cambiar acá ajusta la mezcla de tipos que aparecen.
        UMBRALES_TIPO: {
            largeRezagado:  0.18,             // ~16% (rezagados = variantes más lentas)
            mediumRezagado: 0.31,             // ~13%
            smallRezagado:  0.44,             // ~13%
            large:          0.66,             // ~22%
            medium:         0.83,             // ~17%
            // resto → small                  // ~17%
        },
    },

    // === PARTÍCULAS BOID (enjambre) ===
    BOIDS: {
        MAX_PARTICULAS: 100,            // Máximo de partículas en pantalla
        SPAWN_INTERVALO: 7,             // Segundos entre grupos de spawn
        SPAWN_BATCH: 10,                // Partículas por grupo
        RANGO_RESET_ATRACCION: 250,     // px: si la partícula se aleja más, cancela atracción del Devorador
        RANGO_CAPTURA: 30,              // px al jugador para considerarse capturada
        VELOCIDAD_INICIAL_MAX: 150,     // Spread inicial de velocidad (±150 px/s)
        VELOCIDAD_MAX: 180,             // Velocidad máxima de la partícula (px/s)
        FUERZA_SEPARACION: 0.01,        // Peso: alejarse de vecinos
        FUERZA_COHESION: 0.005,         // Peso: ir al centro del grupo
        FUERZA_ALINEACION: 0.01,        // Peso: sincronizar dirección con vecinos
        FUERZA_FUGA: 0.6,               // Peso: huir de la nave del jugador
        RANGO_VISION: 100,              // px para detectar vecinos
        RANGO_FUGA: 200,                // px para detectar la nave y huir
    },

    // === MEJORAS (tienda) ===
    // 8 categorías × 5 niveles = 40 mejoras. Costo en partículas Boid capturadas.
    MEJORAS: {
        COSTOS_PROYECTIL:    [5, 15, 25, 25, 50],    // Daño de proyectil
        COSTOS_ESCUDO:       [50, 50, 50, 50, 50],   // Más escudos
        COSTOS_ULTI:         [50, 50, 50, 50, 50],   // Reducción de carga de ulti
        COSTOS_TIEMPO_FUERA: [30, 35, 40, 45, 100],  // Regeneración en Tiempo Fuera
        COSTOS_ACELERACION:  [10, 20, 30, 40, 50],   // +tiempo de aceleración (W)
        COSTOS_PROPULSOR:    [10, 20, 30, 40, 50],   // -cooldown del propulsor (R)
        COSTOS_DEVORADOR:    [30, 35, 40, 45, 50],   // +rango/velocidad de atracción (E)
        COSTOS_COHETES:      [20, 25, 30, 35, 40],   // +1 cohete por mejora (Q)
        ESCUDO_RESTAURACION: 50,                      // Escudos que restaura al comprar mejora de escudo
    },

    // === AUDIO (volumen 0..1 de cada pista) ===
    // Punto único para ajustar el volumen de cada sonido y música.
    // Lo leen Game._registrarSonidos() (audio in-game) y UIManager (click + música del menú inicial).
    // 0 = mudo · 1 = máximo.
    AUDIO: {
        VOLUMENES: {
            // --- Habilidades del jugador ---
            disparo: 0.5,               // disparar (barra espaciadora)
            ulti: 1.0,                  // ataque especial (S) — al máximo (el mp3 se amplificó +15dB, estaba muy bajo)
            propulsor: 0.6,             // dash (R)
            cohetes: 0.6,               // lanzar cohetes (Q)
            devorador: 0.6,             // atraer partículas (E)

            // --- Estados del jugador ---
            roturaEscudos: 0.5,         // en bucle mientras dura el sobrecalentamiento
            sobrecalentamientoW: 0.5,   // barra W al tope
            recibirImpacto: 0.5,        // te pegan

            // --- Combate ---
            destruccionMeteorito: 0.5,  // destruir asteroide
            destruccionNave: 0.2,      // destruir nave enemiga (y el asteroide especial)
            reboteMeteoritos: 0.4,      // dos asteroides chocan y rebotan (sin destruirse)

            // --- Otros SFX ---
            particulaBoid: 0.45,        // capturar partícula (suena en cada una, con throttle)
            click: 0.5,                 // botones del menú
            mejora: 0.6,                // comprar una mejora (clic en el icono de mejora)
            particulasInsuficientes: 0.5, // intentar comprar sin partículas suficientes

            // --- Música de fondo (en bucle) ---
            musicaMenu: 0.5,            // menú principal
            musicaJuego: 0.3,          // durante la partida
        },
    },
};
