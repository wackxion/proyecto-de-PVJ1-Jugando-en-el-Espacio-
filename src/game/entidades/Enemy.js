/**
 * Enemigo - Asteroide enemigo (Enemy Asteroid)
 * 
 * Esta clase representa los asteroides que aparecen en el juego.
 * Hereda de ObjetoJuego y viene en 4 tipos diferentes:
 * - SMALL: Pequeño, rápido, va directo a la nave
 * - MEDIUM: Mediano, velocidad media, va directo a la nave
 * - LARGE: Grande, lento, orbita alrededor de la nave
 * - SPECIAL: Grande apariencia, muy rápido, power-up al destruir
 * 
 * Los asteroides LARGE y MEDIUM se rompen en fragmentos más pequeños
 * cuando son destruidos, heredando el movimiento orbital del padre.
 */
import { GameObject } from './GameObject.js';
import { CONFIG } from '../../config.js';

// Enum = tipo de dato que define constantes con nombres descriptivos
// TamanioAsteroide es un objeto con las constantes que representan los tipos de asteroides
export const TamanioAsteroide = {
    PEQUENO: 'small',      // Asteroide pequeño - va directo a la nave
    MEDIANO: 'medium',   // Asteroide mediano - va directo a la nave
    GRANDE: 'large',     // Asteroide grande - orbita alrededor de la nave
    ESPECIAL: 'special',  // Asteroide especial (power-up)
    GRANDE_REZAGADO: 'large_rezagado',   // Asteroide grande rezagado - pasa de largo
    MEDIANO_REZAGADO: 'medium_rezagado', // Asteroide mediano rezagado
    PEQUENO_REZAGADO: 'small_rezagado'    // Asteroide pequeño rezagado
};

export class Enemigo extends GameObject {
    /**
     * Constructor del enemigo (asteroide)
     * 
     * @param {number} x - Posición X inicial del asteroide
     * @param {number} y - Posición Y inicial del asteroide
     * @param {string} tamanio - Tipo de asteroide (PEQUENO, MEDIANO, GRANDE, ESPECIAL)
     * @param {Object} objetivo - El jugador (la nave) - el asteroide lo sigue
     * @param {PIXI.Texture} textura - Textura (imagen) del asteroide
     * @param {Object} velocidadHeredada - Velocidad heredada del padre {x, y}
     * @param {boolean} orbitarObjetivo - true si el asteroide debe orbitar alrededor del jugador
     * @param {number} anchoJuego - Ancho del área de juego
     * @param {number} altoJuego - Alto del área de juego
     */
    constructor(x, y, tamanio = 'large', objetivo = null, textura = null, velocidadHeredada = null, orbitarObjetivo = false, anchoJuego = 800, altoJuego = 600) {
        // Llamar al constructor de ObjetoJuego
        super(x, y);
        
        // Tipo de asteroide
        this.tamanio = tamanio;
        
        // Referencia al jugador (objetivo) - para saber hacia dónde moverse
        this.objetivo = objetivo;
        
        // Guardar la última posición conocida del jugador
        this.ultimaPosicionX = objetivo ? objetivo.x : 0;
        this.ultimaPosicionY = objetivo ? objetivo.y : 0;
        
        // Textura del asteroide
        this.textura = textura;
        
        // debeOrbitar = flag que indica si el asteroide orbita alrededor de la nave
        this.debeOrbitar = orbitarObjetivo;
        
        // Dimensiones del área de juego
        this.anchoJuego = anchoJuego;
        this.altoJuego = altoJuego;
        
        // VelocidadAngular = velocidad de rotación del sprite
        // Se usa para que el asteroide rote visualmente
        // Valor aleatorio entre -1 y 1 (en radianes por segundo)
        this.velocidadAngular = (Math.random() - 0.5) * 2;
        
        // Inicializar propiedades de rezagado (se configuran en _configurarPorTamanio)
        this.esRezagado = false;
        this.direccionX = 0;
        this.direccionY = 0;
        
        // Configurar las propiedades según el tipo de asteroide
        // Esto establece el radio, velocidad, salud, puntos, etc.
        const tieneHerencia = velocidadHeredada !== null;
        this._configurarPorTamanio(tieneHerencia);
        
        // Aplicar velocidad heredada (trayectoria orbital del padre)
        // Se usa cuando un asteroide se rompe y crea fragmentos
        this.vx = velocidadHeredada ? velocidadHeredada.x : 0;
        this.vy = velocidadHeredada ? velocidadHeredada.y : 0;
        
        // tieneTrayectoriaHeredada = flag que indica si el asteroide tiene trayectoria heredada
        this.tieneTrayectoriaHeredada = tieneHerencia;
        
        // temporizadorTrayectoria = cuánto dura la trayectoria heredada del padre.
        // ⚠️ EN SEGUNDOS: se descuenta con `delta` en update(), y `delta` viene en
        // segundos (~0.016). Por eso el valor tiene que ser un TIEMPO en segundos,
        // no un conteo de frames.
        // Bug histórico (arreglado): antes valía 60 pensado como "60 frames ≈ 1s",
        // pero al restarle `delta` (segundos) la herencia duraba ~60 SEGUNDOS → los
        // fragmentos de un asteroide grande quedaban "flotando" sin perseguir a la
        // nave casi un minuto. Ahora dura 1 s real.
        this.temporizadorTrayectoria = tieneHerencia ? 1.0 : 0;
        
        // EnfriamientoColision - evita que los asteroides se queden pegados
        // Después de una colisión, no puede chocar por 0.5 segundos
        this.enfriamientoColision = 0;
        
        // Temporizador de desaceleración (slowdown) cuando recibe daño
        this.slowdownTimer = 0;
        
        // Crear el sprite del asteroide
        this._crearSprite();
        
        // Width y Height = ancho y alto para colisiones
        this.ancho = this.radio * 2;
        this.alto = this.radio * 2;
    }
    
    /**
     * Configura las propiedades del asteroide según su tamaño
     * Se llama en el constructor para establecer:
     * - radio (radio para colisiones)
     * - escala (escala de la imagen)
     * - velocidad (velocidad de movimiento)
     * - salud (puntos de vida)
     * - puntos (puntos que da al destruir)
     * - cargaUlti (carga para el ataque especial)
     * - dano (daño que hace al tocar la nave)
     * - debeOrbitar (si orbita o va directo)
     * - esRomrible (si se puede romper en fragmentos)
     * 
     * @param {boolean} forzarOrbita - Forzar modo órbita (para fragmentos heredados)
     */
    _configurarPorTamanio(forzarOrbita = false) {
        // Stats numéricos centralizados en config.js (sección ASTEROIDES)
        const stats = CONFIG.ASTEROIDES[this.tamanio];
        this.radio = stats.RADIO;
        this.escala = stats.ESCALA;
        this.velocidad = stats.VELOCIDAD;
        this.salud = stats.SALUD;
        this.puntos = stats.PUNTOS;
        this.cargaUlti = stats.CARGA_ULTI;
        this.dano = stats.DANO;
        this.esRomptible = true;

        // Comportamiento de movimiento según el tipo
        this.esRezagado = this.tamanio.endsWith('_rezagado');

        if (this.tamanio === 'large') {
            this.debeOrbitar = true;            // El grande orbita la nave
        } else if (this.tamanio === 'special') {
            this.debeOrbitar = false;
            this.esRezagado = false;
        } else if (this.esRezagado) {
            this.debeOrbitar = false;
            this.direccionX = Math.random() < 0.5 ? 1 : -1;  // Cruza la pantalla en horizontal
            this.direccionY = 0;
        } else {
            this.debeOrbitar = forzarOrbita;    // small/medium: orbitan solo si son fragmentos heredados
        }
    }
    
    /**
     * Crea el sprite (imagen visual) del asteroide
     * Usa la textura proporcionada o crea uno con Graphics si no hay
     */
    _crearSprite() {
        // Si hay una textura proporcionada
        if (this.textura !== null) {
            // Crear sprite con la textura
            this.imagen = new PIXI.Sprite(this.textura);
            
            // Establecer ancla en el centro
            this.imagen.anchor.set(0.5);
            
            // Aplicar escala según el tamaño
            this.imagen.scale.set(this.escala);
            
            // NOTA: Colores de asteroides desactivados
            // if (this.tamanio === 'special') {
            //     this.imagen.tint = 0x00CC44;
            // } else if (this.esRezagado) {
            //     this.imagen.tint = 0x8800CC;
            // } else {
            //     this.imagen.tint = 0xCC0000;
            // }
            
        } else {
            // Determinar color según el tipo
            // NOTA: Colores de asteroides desactivados - todos usan el color original de la imagen
            let color = 0xFFFFFF; // Color blanco (sin tinte)
            // if (this.tamanio === 'special') {
            //     color = 0x00CC44;
            // } else if (this.esRezagado) {
            //     color = 0x8800CC;
            // } else {
            //     color = 0xCC0000;
            // }
            
            this.graphics = new PIXI.Graphics();
            
            // Dibujar círculo base
            this.graphics.circle(0, 0, this.radio);
            this.graphics.fill(color);
            
            // Agregar detalles (cráteres) para hacerlo más interesante
            const craterCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < craterCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * (this.radio * 0.5);
                const craterRadius = this.radio * 0.2;
                
                this.graphics.circle(
                    Math.cos(angle) * dist,
                    Math.sin(angle) * dist,
                    craterRadius
                );
                // Color más oscuro que el base
                if (this.tamanio === 'special') {
                    this.graphics.fill({ color: 0x008833 });
                } else if (this.esRezagado) {
                    this.graphics.fill({ color: 0x550088 });
                } else {
                    this.graphics.fill({ color: 0x990000 });
                }
            }
            
            this.imagen = this.graphics;
        }
        
        // Establecer posición inicial
        this.imagen.x = this.x;
        this.imagen.y = this.y;
    }
    
    /**
     * Rompe el asteroide en fragmentos más pequeños
     * Se llama cuando la salud llega a 0
     * 
     * - LARGE → 2 MEDIUM
     * - MEDIUM → 2 SMALL
     * - SPECIAL → no suelta fragmentos
     * 
     * Los fragmentos heredan la trayectoria orbital del padre
     * 
     * @returns {Array} - Array con los nuevos Enemy creados
     */
    _romper() {
        // Sonido de destrucción de asteroide (objetivo = jugador -> juego -> gestorSonido)
        if (this.objetivo && this.objetivo.juego && this.objetivo.juego.gestorSonido) {
            this.objetivo.juego.gestorSonido.reproducir('destruccionMeteorito');
        }

        // Destruir el asteroide actual
        this.destroy();

        // Array para almacenar los nuevos fragmentos
        const newAsteroids = [];
        
        // Si es LARGE, crear 2 MEDIUM
        if (this.tamanio === 'large') {
            newAsteroids.push(
                this._crearFragmentoConOffset('medium', 0),
                this._crearFragmentoConOffset('medium', 1)
            );
        } 
        // Si es MEDIUM, crear 2 SMALL
        else if (this.tamanio === 'medium') {
            newAsteroids.push(
                this._crearFragmentoConOffset('small', 0),
                this._crearFragmentoConOffset('small', 1)
            );
        }
        // Si es LARGE_REZAGADO, crear 2 MEDIUM_REZAGADO
        else if (this.tamanio === 'large_rezagado') {
            newAsteroids.push(
                this._crearFragmentoRezagado('medium_rezagado', 0),
                this._crearFragmentoRezagado('medium_rezagado', 1)
            );
        }
        // Si es MEDIUM_REZAGADO, crear 2 SMALL_REZAGADO
        else if (this.tamanio === 'medium_rezagado') {
            newAsteroids.push(
                this._crearFragmentoRezagado('small_rezagado', 0),
                this._crearFragmentoRezagado('small_rezagado', 1)
            );
        }
        
        return newAsteroids;
    }
    
    /**
     * Crea un fragmento con posición separada y dirección única
     * 
     * @param {string} size - Tamaño del fragmento
     * @param {number} offsetIndex - Índice para calcular offset (0 o 1)
     * @returns {Enemy} - Nuevo asteroide
     */
    _crearFragmentoConOffset(tamanio, indiceOffset) {
        // Offset para separar los fragmentos
        const baseOffset = 60;
        const offsetX = indiceOffset === 0 ? -baseOffset : baseOffset;
        const offsetY = (Math.random() - 0.5) * baseOffset;
        
        // Calcular trayectoria única para cada fragmento
        // Si el padre orbitaba, usar esa trayectoria
        let trajectory = null;
        let inheritOrbit = false;
        
        if (this.debeOrbitar) {
            trajectory = this._calcularTrayectoria();
            inheritOrbit = true;
            
            // Modificar ligeramente la trayectoria para que no sea idéntica
            if (trajectory) {
                trajectory.x += (Math.random() - 0.5) * 20;
                trajectory.y += (Math.random() - 0.5) * 20;
            }
        }
        
        // Crear el fragmento con posición desplazada
        const fragment = new Enemigo(
            this.x + offsetX, 
            this.y + offsetY, 
            tamanio, 
            this.objetivo, 
            this.textura, 
            trajectory, 
            inheritOrbit, 
            this.anchoJuego, 
            this.altoJuego
        );
        
        return fragment;
    }
    
    /**
     * Crea un fragmento rezagado con dirección aleatoria
     * 
     * @param {string} size - Tamaño del fragmento
     * @param {number} offsetIndex - Índice para calcular offset (0 o 1)
     * @returns {Enemy} - Nuevo asteroide rezagado
     */
    _crearFragmentoRezagado(tamanio, indiceOffset = 0) {
        // Dirección aleatoria para el fragmento
        const directionX = Math.random() < 0.5 ? 1 : -1;
        const directionY = 0;
        
        // Calcular offset para que los fragmentos aparezcan separados
        const baseOffset = 50; // distancia mínima entre fragmentos
        const offsetX = indiceOffset === 0 ? -baseOffset : baseOffset;
        
        // Crear el fragmento con posición desplazada
        const fragment = new Enemigo(
            this.x + offsetX, 
            this.y, 
            tamanio, 
            this.objetivo, 
            this.textura, 
            null, 
            false, 
            this.anchoJuego, 
            this.altoJuego
        );
        
        // Asignar dirección rezagada
        fragment.esRezagado = true;
        fragment.direccionX = directionX;
        fragment.direccionY = directionY;
        
        return fragment;
    }
    
    /**
     * Calcula la trayectoria orbital hacia la nave
     * Se usa para que los fragmentos hereden el movimiento del padre
     * 
     * Calcula una velocidad perpendicular a la dirección hacia la nave
     * + un poco de aproximación hacia la nave
     * 
     * @returns {Object} - Velocidad {x, y} en dirección orbital
     */
    _calcularTrayectoria() {
        // Si no hay objetivo (jugador), retornar velocidad cero
        if (!this.objetivo) return { x: 0, y: 0 };
        
        // Calcular distancia al jugador
        const dx = this.objetivo.x - this.x;
        const dy = this.objetivo.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Velocidad base para la trayectoria
            const speed = 60;
            
            // Dirección perpendicular (para órbita)
            // -dy/dx rota 90 grados, creando movimiento circular
            const orbitX = -dy / dist;
            const orbitY = dx / dist;
            
            // Factor de aproximación (10% - orbitan más, se acercan menos)
            const approachFactor = 0.1;
            
            // Retornar velocidad combinada
            return {
                x: orbitX * speed + (dx / dist) * speed * approachFactor,
                y: orbitY * speed + (dy / dist) * speed * approachFactor
            };
        }
        
        return { x: 0, y: 0 };
    }
    
    /**
     * Update (Actualización): Se llama cada frame
     * Maneja el movimiento del asteroide
     * 
     * @param {number} delta - Tiempo transcurrido desde el último frame (en segundos)
     */
    update(delta) {
        // Si el asteroide no está activo o no tiene sprite, salir
        if (!this.active || !this.imagen) return;
        
        // Reducir el cooldown de colisión.
        // Además, cuando ese enfriamiento se agota, reseteamos `direccionAlterada`:
        // el cambio de dirección al chocar es un EMPUJÓN TEMPORAL (dura lo que dura
        // el cooldown, ~0.5s). Al terminar, el asteroide vuelve a perseguir a la nave.
        // Bug histórico (arreglado): antes `direccionAlterada` no se reseteaba nunca,
        // así que un medium/small que chocaba UNA vez se iba en línea recta PARA
        // SIEMPRE y no volvía a apuntar a la nave (en oleadas altas, con muchos
        // choques, casi todos terminaban vagando → el juego se hacía más fácil).
        if (this.enfriamientoColision > 0) {
            this.enfriamientoColision -= delta;
            if (this.enfriamientoColision <= 0) {
                this.direccionAlterada = false;   // fin del empujón → re-persigue a la nave
            }
        }
        
        // === TRAYECTORIA HEREDADA ===
        // Si tiene trayectoria heredada del padre, aplicarla primero
        if (this.tieneTrayectoriaHeredada && this.temporizadorTrayectoria > 0) {
            this.x += this.vx * delta;
            this.y += this.vy * delta;
            
            // Reducir el timer
            this.temporizadorTrayectoria -= delta;
            
            // Cuando el timer termina, transición al movimiento normal
            if (this.temporizadorTrayectoria <= 0) {
                this.tieneTrayectoriaHeredada = false;
            }
        }
        // === MOVIMIENTO NORMAL ===
        else if (this.objetivo) {
            // Si hay slowdown activo, mover más lento (30% de velocidad)
            // Multiplicar por el multiplicador de velocidad (aumenta cada 10 oleadas)
            let velocidadActual = this.velocidad * (this.multiplicadorVelocidad || 1);
            if (this.slowdownTimer > 0) {
                velocidadActual *= 0.3;
                this.slowdownTimer -= delta;
            }
            
            // Si es rezagado, moverse hacia el centro y destruirse
            if (this.esRezagado) {
                this._moverRezagado(delta, velocidadActual);
            }
            // Si no es rezagado, verificar si debe orbitar (solo large)
            else if (this.debeOrbitar) {
                this._orbitarAlrededor(delta, velocidadActual);
            }
            // asteroids normales (medium, small) van directo a la nave
            else {
                this._moverConcéntrico(delta, velocidadActual);
            }
            
            // === CAMPO GRAVITATORIO DE LA NAVE ===
            // Si está dentro de 100px del jugador, atraer hacia él
            // NO aplica para especiales ni mini asteroides en órbita
            if (this.objetivo && this.tamanio !== 'special') {
                const dx = this.objetivo.x - this.x;
                const dy = this.objetivo.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Radio de atracción: 100px
                if (dist < 100 && dist > 0) {
                    // Fuerza proporcional a la distancia (más fuerte cuanto más cerca)
                    const fuerza = (100 - dist) / 100 * 0.5; // 0 a 0.5
                    
                    // Aplicar fuerza de atracción
                    this.x += (dx / dist) * fuerza * velocidadActual * delta;
                    this.y += (dy / dist) * fuerza * velocidadActual * delta;
                }
            }
        }
        
        // Si ya no está activo o no tiene imagen, salir
        if (!this.active || !this.imagen) return;
        
        // Actualizar posición del sprite
        this.imagen.x = this.x;
        this.imagen.y = this.y;
        
        // Verificar si está fuera de los bordes (para rezagados)
        this._verificarLimites();
        
        // Rotar el sprite para efecto visual
        if (this.imagen) {
            this.imagen.rotation += this.velocidadAngular * delta;
        }
    }
    
    /**
     * Movimiento rezagado
     * El asteroide aparece desde fuera, pasa por la pantalla y sale por el otro lado
     * No va directo a la nave, sigue una línea recta
     * Se destruye cuando sale de la pantalla
     * 
     * @param {number} delta - Tiempo transcurrido
     * @param {number} velocidad - Velocidad actual
     */
    _moverRezagado(delta, velocidad) {
        // Mover en la dirección asignada (línea recta a través de la pantalla)
        this.x += this.direccionX * velocidad * delta;
        this.y += this.direccionY * velocidad * delta;
    }
    
    /**
     * Verifica si el asteroide está fuera de los bordes
     * Para rezagados: los destruye cuando salen de la pantalla
     */
    _verificarLimites() {
        if (this.esRezagado) {
            const margin = this.radio + 50;
            
            // Si está fuera de los bordes, destruir
            if (this.x < -margin || this.x > this.anchoJuego + margin ||
                this.y < -margin || this.y > this.altoJuego + margin) {
                this.destroy();
            }
        }
    }
    
    /**
     * Alterar dirección al chocar con otro asteroide (un "empujón" por el impacto).
     * Se llama desde GameEnemies.procesarColisionesEnemigos al detectar la colisión.
     *
     * El efecto es TEMPORAL: marca `direccionAlterada = true` y elige una dirección
     * recta al azar. En update(), cuando se agota `enfriamientoColision` (~0.5s), el
     * flag se vuelve a poner en false y el asteroide retoma la persecución normal.
     * (Solo afecta a medium/small, que usan `_moverConcéntrico`; large orbita y los
     * rezagados siguen su línea, así que a ellos el flag no los cambia de modo.)
     */
    alterDirection() {
        // Marcar que la dirección fue alterada (se resetea al terminar el cooldown)
        this.direccionAlterada = true;
        
        // Nueva dirección aleatoria
        // puede ser horizontal, vertical, o diagonal
        const rand = Math.random();
        
        if (rand < 0.33) {
            // Horizontal
            this.direccionX = Math.random() < 0.5 ? 1 : -1;
            this.direccionY = 0;
        } else if (rand < 0.66) {
            // Vertical
            this.direccionX = 0;
            this.direccionY = Math.random() < 0.5 ? 1 : -1;
        } else {
            // Diagonal
            this.direccionX = Math.random() < 0.5 ? 1 : -1;
            this.direccionY = Math.random() < 0.5 ? 1 : -1;
        }
    }
    
    /**
     * Movimiento concéntrico
     * El asteroide se mueve directamente hacia la nave (línea recta)
     * Si su dirección fue alterada por una colisión, usa esa dirección por un tiempo
     * 
     * @param {number} delta - Tiempo transcurrido
     * @param {number} speed - Velocidad actual (puede ser reducida por slowdown)
     */
    _moverConcéntrico(delta, velocidad) {
        // Si la dirección fue alterada por colisión, moverse en esa dirección
        if (this.direccionAlterada) {
            this.x += this.direccionX * velocidad * delta;
            this.y += this.direccionY * velocidad * delta;
            return;
        }
        
        // Movimiento normal hacia la nave
        const dx = this.objetivo.x - this.x;
        const dy = this.objetivo.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Calcular vector unitario hacia la nave
            this.vx = (dx / dist) * velocidad;
            this.vy = (dy / dist) * velocidad;
            
            // Mover el asteroide
            this.x += this.vx * delta;
            this.y += this.vy * delta;
        }
    }
    
    /**
     * Movimiento orbital
     * El asteroide orbita alrededor de la nave (movimiento circular)
     * Se acerca un poco mientras orbita
     * 
     * @param {number} delta - Tiempo transcurrido
     * @param {number} velocidad - Velocidad actual
     */
    _orbitarAlrededor(delta, velocidad) {
        const dx = this.objetivo.x - this.x;
        const dy = this.objetivo.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Dirección perpendicular para órbita (movimiento circular)
            const orbitX = -dy / dist;
            const orbitY = dx / dist;
            
            // Velocidad orbital
            this.vx = orbitX * velocidad;
            this.vy = orbitY * velocidad;
            
            // Mover en dirección perpendicular (órbita)
            this.x += this.vx * delta;
            this.y += this.vy * delta;
            
            // También acercarse un poco a la nave (30% de la velocidad)
            // Esto hace que se acerque gradualmente de manera elíptica
            this.x += (dx / dist) * (velocidad * 0.3) * delta;
            this.y += (dy / dist) * (velocidad * 0.3) * delta;
        }
    }
    
    /**
     * Recibe daño del proyectil
     * Reduce la salud del asteroide y verifica si se destruye
     * 
     * @param {number} dano - Cantidad de daño a recibir
     * @returns {Array} - Nuevos asteroides generados (si se rompe)
     */
    recibirDano(dano) {
        // Reducir salud
        this.salud -= dano;
        
        // Si no se destruye, activar desaceleración temporal
        if (this.salud > 0) {
            this._activarRalentizacion();
        }
        
        // Si la salud llegó a 0, destruir y crear fragmentos
        if (this.salud <= 0) {
            return this._romper();
        }
        
        // Si no se destruyó, retornar array vacío
        return [];
    }
    
    /**
     * Activa la desaceleración temporal
     * Se llama cuando un asteroide recibe daño pero no se destruye
     * Hace que el asteroide se mueva más lento por 1 segundo
     */
    _activarRalentizacion() {
        // Establecer timer a 1 segundo
        // Si ya estaba activo, se resetea (no se acumula)
        this.slowdownTimer = 1.0;
    }
    
    /**
     * Renderiza el enemigo en el contenedor
     * Agrega el sprite al stage (pantalla principal)
     * 
     * @param {PIXI.Container} container - Contenedor donde agregar el sprite
     */
    render(container) {
        // Solo agregar si el sprite existe y no está ya en un contenedor
        if (this.imagen && !this.imagen.parent) {
            container.addChild(this.imagen);
        }
    }
}
