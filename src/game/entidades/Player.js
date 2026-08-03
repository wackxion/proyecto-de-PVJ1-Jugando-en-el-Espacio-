/**
 * Jugador - Nave espacial controlada por el jugador
 * Hereda de ObjetoJuego e implementa rotación + dispara + ataque especial
 * 
 * Esta clase maneja toda la lógica de la nave del jugador:
 * - Movimiento y rotación
 * - Disparo de proyectiles
 * - Sistema de ataque especial (ulti)
 * - Gestión de escudos
 * - Efectos visuales
 */
import { GameObject } from './GameObject.js';
import { HitEffect } from '../efectosVisuales/HitEffect.js';
import { CONFIG } from '../../config.js';

export class Jugador extends GameObject {
    /**
     * Constructor del jugador
     * @param {number} x - Posición X inicial donde aparece la nave
     * @param {number} y - Posición Y inicial donde aparece la nave
     * @param {PIXI.Texture} textura - Textura (imagen) de la nave cargada desde assets
     * @param {number} anchoJuego - Ancho del área de juego (en píxeles)
     * @param {number} altoJuego - Alto del área de juego (en píxeles)
     */
    constructor(x, y, textura, anchoJuego = 800, altoJuego = 600) {
        // Llamar al constructor de la clase padre (ObjetoJuego)
        // Esto inicializa propiedades básicas como x, y, activo
        super(x, y);
        
        // Velocidad de movimiento de la nave (en píxeles por segundo)
        this.velocidad = 300;
        
        // Rotación: Ángulo actual de la nave en radianes
        // 0 radianes = apuntando hacia la derecha
this.rotacion = 0;
        
        // Velocidad de rotación (rad/s)
        this.velocidadRotacion = CONFIG.JUGADOR.VELOCIDAD_ROTACION;
        
        // Radio: radio de colisión para detectar choques con asteroides
        // Se usa para calcular si la nave toca un asteroide
        this.radio = CONFIG.JUGADOR.RADIO_COLISION;
        
        // Ancho/Alto Juego: Dimensiones del área de juego
        // Se usan para mantener la nave dentro de la pantalla
        this.anchoJuego = anchoJuego;
        this.altoJuego = altoJuego;
        
        // SISTEMA DE ATAQUE ESPECIAL (ULTI)
        // cargaUlti: carga actual acumulada
        // Se necesita destruir varios asteroides para llenarla
        this.cargaUlti = 0;
        // cargaMaxUlti: carga necesaria para poder usar el ataque especial
        // 500 = más difícil de cargar (antes era 300)
        // Se reduce según las mejoras compradas (indices 10-14 en Game.js)
        this.cargaMaxUlti = CONFIG.ULTI.CARGA_MAXIMA;
        this.cargaMaxUltiBase = CONFIG.ULTI.CARGA_MAXIMA;
        // ultiListo: flag que indica si el ataque está listo
        this.ultiListo = false;
        
        // SISTEMA DE ESCUDOS
        // escudos: Escudos actuales del jugador
        // escudosMax: Máximo de escudos (aumenta con mejoras)
        // Cuando llega a 0, es game over
        this.escudos = CONFIG.ESCUDOS.MAXIMO;
        this.escudosMax = CONFIG.ESCUDOS.MAXIMO;

        // Invulnerabilidad temporal (se usa al REVIVIR con anuncio): mientras dura,
        // recibirDano() se ignora y la nave titila. Ver activarInvulnerabilidad().
        this.invulnerable = false;
        this.temporizadorInvulnerable = 0;

        // SISTEMA DE DISPARO
        // enfriamientoDisparoMax: Tiempo mínimo entre cada disparo (en segundos)
        // Este valor baja cuando agarras power-ups (dispara más rápido)
        this.enfriamientoDisparoMax = CONFIG.DISPARO.ENFRIAMIENTO;
        // enfriamientoDisparoBase: Valor original del enfriamiento para reiniciar
        this.enfriamientoDisparoBase = CONFIG.DISPARO.ENFRIAMIENTO;
        // nivelMejoraVelocidad: Contador de mejoras de velocidad de disparo
        // Se incrementa cada vez que se destruye un asteroide especial
        this.nivelMejoraVelocidad = 0;
        
        // Referencia al juego: Referencia al objeto principal del juego
        // Se usa para crear proyectiles y acceder a otras funciones del juego
        this.juego = null;
        
        // =========================================
        // SOBRECALENTAMIENTO DE ESCUDOS (VIDA)
        // =========================================
        // Este sobrecalentamiento se activa cuando los escudos llegan a 0
        // Es una "segunda oportunidad" - seguís jugando sin escudos pero vulnerable
        // Salís de este estado solo cuando recibís escudos (via Tiempo Fuera o mejoras)
        // sobrecalentado: Flag que indica si está en modo sobrecalentamiento (sin escudos)
        this.sobrecalentado = false;

        // Instancia del sonido de rotura de escudos en bucle (suena mientras sobrecalentado)
        this._loopRotura = null;

        // temporizadorEnfriamiento: Temporizador de enfriamiento (cuenta regresiva)
        this.temporizadorEnfriamiento = 0;
        
        // duracionEnfriamiento: Duración del modo enfriamiento (10 segundos)
        this.duracionEnfriamiento = CONFIG.ESCUDOS.DURACION_SOBRECALENTAMIENTO;
        
        // escudosPreEnfriamiento: Guarda los escudos que tenía al entrar en sobrecalentamiento
        this.escudosPreEnfriamiento = 0;
        
        // PROPULSOR (DASH)
        // enPropulsor: Flag que indica si el propulsor está activo
        this.enPropulsor = false;
        // duracionPropulsor: Duración del dash (0.2 segundos)
        this.duracionPropulsor = CONFIG.PROPULSOR.DURACION;
        // temporizadorPropulsor: Timer para el dash
        this.temporizadorPropulsor = 0;
        // velocidadPropulsor: Velocidad del dash (300px en 0.2s = 1500px/s)
        this.velocidadPropulsor = CONFIG.PROPULSOR.VELOCIDAD;
        
        // SPRITE (IMAGEN)
        // Sprite = Imagen del objeto en el juego
        // Se crea usando la textura proporcionada (assets/nave.png)
        this.imagen = new PIXI.Sprite(textura);
        
        // Ancla: Punto de pivote de la imagen
        // 0.5 = centro de la imagen (la nave rota desde su centro)
        this.imagen.anchor.set(0.5);
        
        // Escalar la nave para que tenga el tamaño correcto
        // Imagen de 322x322px, reducida ~10% (0.25 → 0.225 = ~72px)
        this.imagen.scale.set(0.225);
        
        // Establecer posición inicial
        this.imagen.x = x;
        this.imagen.y = y;
        
        // Width/Height: Ancho y alto del sprite para cálculos de colisión
        // Se obtiene directamente de las dimensiones del sprite
        this.width = this.imagen.width;
        this.height = this.imagen.height;
        
        // DAMAGE EFFECT (Efecto de Daño)
        // Reference al objeto gráficos que muestra la esfera azul cuando te golpean
        this.damageEffect = null;
        // Timer para controlar cuánto dura el efecto de daño
        this.damageEffectTimer = 0;
        
        // EFECTO DE ROTACIÓN
        // Efecto visual azul cuando la nave gira (cada 0.1 segundos)
        this.rotationEffects = []; // Array para guardar todos los efectos
        this.rotationEffectTimer = 0;
        this.rotationEffectCooldown = 0.1; // 0.1 segundo entre efectos
        
        // SISTEMA DE INERCIA (Movimiento tipo tanque)
        // velocidad: Velocidad actual de la nave
        this.velocidad = 0;
        // velocidadMax: Velocidad máxima hacia adelante
        this.velocidadMax = CONFIG.JUGADOR.VELOCIDAD_MAX;
        // aceleracion: Cuánto aumenta la velocidad cuando presionas W
        this.aceleracion = CONFIG.JUGADOR.ACELERACION;
        // friccion: Cuánto disminuye la velocidad cuando sueltas W (0.95 = pierde 5% por frame)
        this.friccion = CONFIG.JUGADOR.FRICCION;
        // direccionMovimiento: Dirección en la que se mueve
        this.direccionMovimiento = this.rotacion;
        
        // =========================================
        // SOBRECALENTAMIENTO DE ACELERACIÓN (W)
        // =========================================
        // Este sobrecalentamiento se activa cuando acelerás con W por 2 segundos seguidos
        // Te impide acelerar por 2.5 segundos, pero seguís jugando normalmente
        // cargaAceleracion: Carga que se llena mientras presionas W (0-100)
        this.cargaAceleracion = 0;
        this.cargaMax = CONFIG.ACELERACION.CARGA_MAXIMA;
        this.velocidadCarga = CONFIG.ACELERACION.VELOCIDAD_CARGA; // 50% por segundo (llena en 2 segundos)
        // sobrecalentadoAceleracion: Flag que indica si está sobrecalentado por usar W demasiado
        this.sobrecalentadoAceleracion = false;
        // temporizadorEnfriamientoAcel: Temporizador de enfriamiento (2.5 segundos)
        this.temporizadorEnfriamientoAcel = 0;
        this.duracionEnfriamientoAcel = CONFIG.ACELERACION.DURACION_ENFRIAMIENTO;
    }
    
    /**
     * Crea el efecto visual de daño
     * Muestra una esfera azul alrededor de la nave cuando recibe un golpe
     * 
     * Esto alerta al jugador que perdió escudos
     */
    _crearEfectoDano() {
        // Si ya existe un efecto anterior, destruirlo primero
        // Esto evita tener múltiples efectos acumulados
        if (this.damageEffect) {
            this.damageEffect.destroy();
        }
        
        // Crear nuevos gráficos para la esfera de daño
        // PIXI.Graphics = objeto para dibujar formas geométricas
        this.damageEffect = new PIXI.Graphics();
        
        // Dibujar un círculo (esfera azul semi-transparente)
        // circle(x, y, radio)
        // radius + 10 = un poco más grande que la nave
        this.damageEffect.circle(0, 0, this.radio + 10);
        
        // fill() = llenar la forma con color
        // color: 0x0044CC (azul Birome)
        // alpha: 0.6 (60% de opacidad = semi-transparente)
        this.damageEffect.fill({ color: 0x0044CC, alpha: 0.6 });
        
        // Posicionar el efecto en el mismo lugar que la nave
        this.damageEffect.x = this.x;
        this.damageEffect.y = this.y;
        
        // Agregar el efecto al stage (pantalla principal del juego)
        // Solo si el juego existe y tiene un stage
        if (this.juego && this.juego.mundo) {
            this.juego.mundo.addChild(this.damageEffect);
        }
        
        // Establecer timer = 0.5 segundos para que desaparezca el efecto
        this.damageEffectTimer = 0.5;
    }
    
    /**
     * Update (Actualización): Se llama cada frame del juego
     * Maneja toda la lógica del jugador: rotación, disparo, ulti, efectos
     * 
     * @param {number} delta - Tiempo transcurrido desde el último frame (en segundos)
     * @param {Object} input - GestorEntrada con el estado de las teclas
     */
    update(delta, input) {
        // Si el jugador no está activo, salir inmediatamente
        if (!this.active) return;

        // Invulnerabilidad temporal (revivir): descontar y titilar la nave.
        if (this.invulnerable) {
            this.temporizadorInvulnerable -= delta;
            if (this.temporizadorInvulnerable <= 0) {
                this.invulnerable = false;
                if (this.imagen) this.imagen.alpha = 1;
            } else if (this.imagen) {
                this.imagen.alpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(performance.now() / 1000 * 18));
            }
        }

// PROPULSOR (DASH) - 300px en 1 segundo
        if (this.enPropulsor) {
            // Reducir temporizador
            this.temporizadorPropulsor -= delta;
            
            // Mover en la dirección que está mirando (no puede girar)
            const direccion = this.getDirection();
            this.x += direccion.x * this.velocidadPropulsor * delta;
            this.y += direccion.y * this.velocidadPropulsor * delta;
            this.imagen.x = this.x;
            this.imagen.y = this.y;
            
            // Si terminó el dash, desactivarlo
            if (this.temporizadorPropulsor <= 0) {
                this.enPropulsor = false;
                this.temporizadorPropulsor = 0;
            }
        }
        
// INERCIA - Movimiento tipo tanque con inercia
        // Intensidad de aceleración 0..1. En táctil sale de cuánto se empuja el
        // joystick; en PC/gamepad es 1 (thrust completo) cuando se presiona avanzar.
        const intensidadAcel = input.intensidadAvance ? input.intensidadAvance() : (input.debeAvanzar(delta) ? 1 : 0);
        const estaPresionandoW = intensidadAcel > 0;
        const estabaAvanzando = this.velocidad > 0;
        
        // Si está sobrecalentado
        if (this.sobrecalentadoAceleracion) {
            // Enfriar siempre (aunque siga apretando W)
            this.temporizadorEnfriamientoAcel -= delta;
            this.cargaAceleracion = Math.max(this.cargaAceleracion - this.velocidadCarga * delta, 0);
            
            if (this.temporizadorEnfriamientoAcel <= 0) {
                this.sobrecalentadoAceleracion = false;
                this.cargaAceleracion = 0;
                this.temporizadorEnfriamientoAcel = this.duracionEnfriamientoAcel;
            }
            
            // Frenar
            this.velocidad *= this.friccion;
            if (this.velocidad < 1) this.velocidad = 0;
        } 
        // Si presiona W y no está sobrecalentado
        else if (estaPresionandoW) {
            // Actualizar dirección de movimiento continuamente para permitir giro mientras acelera
            this.direccionMovimiento = this.rotacion;
            
            // Escaladas por intensidad: empujar más = acelerar más fuerte Y gastar
            // (llenar la barra de sobrecalentamiento) más rápido. En PC intensidad=1.
            this.cargaAceleracion = Math.min(this.cargaAceleracion + this.velocidadCarga * intensidadAcel * delta, this.cargaMax);
            this.velocidad = Math.min(this.velocidad + this.aceleracion * intensidadAcel * delta, this.velocidadMax);
            
            if (this.cargaAceleracion >= this.cargaMax) {
                // Sonido solo en la transición (no cada frame mientras está lleno)
                if (!this.sobrecalentadoAceleracion && this.juego && this.juego.gestorSonido) {
                    this.juego.gestorSonido.reproducir('sobrecalentamientoW');
                }
                this.sobrecalentadoAceleracion = true;
                this.temporizadorEnfriamientoAcel = this.duracionEnfriamientoAcel;
            }
        } 
        // Normal - no presiona W
        else {
            this.velocidad *= this.friccion;
            if (this.velocidad < 1) this.velocidad = 0;
            this.cargaAceleracion = Math.max(this.cargaAceleracion - this.velocidadCarga * delta, 0);
        }
        
        // Movimiento
        
        // Movimiento con inercia - siempre se mueve si tiene velocidad
        if (this.velocidad !== 0) {
            this.x += Math.cos(this.direccionMovimiento) * this.velocidad * delta;
            this.y += Math.sin(this.direccionMovimiento) * this.velocidad * delta;
            this.imagen.x = this.x;
            this.imagen.y = this.y;
        }
        
        // APUNTADO CON EL MOUSE - la nave mira siempre al cursor (NO durante el dash).
        // Se calcula el ángulo desde la nave EN PANTALLA (su pos de mundo desplazada
        // por la cámara) hacia el cursor, así el apuntado es exacto con cámara/zoom/shake.
        const rotacionPrevia = this.rotacion;
        if (!this.enPropulsor && input.tactilApuntando) {
            // TÁCTIL: el joystick virtual da una DIRECCIÓN directa (máxima prioridad).
            // Con una ayuda de auto-apuntado sutil (imán hacia el enemigo del cono).
            this.rotacion = this._aplicarAutoApuntado(input.tactilAngulo);
            this.imagen.rotation = this.rotacion;
        } else if (!this.enPropulsor && input.gamepadApuntando) {
            // JOYSTICK: el stick da una DIRECCIÓN analógica directa (con auto-apuntado).
            // Tiene prioridad sobre el mouse mientras se lo esté empujando.
            this.rotacion = this._aplicarAutoApuntado(input.gamepadAngulo);
            this.imagen.rotation = this.rotacion;
        } else if (!this.enPropulsor && input.mouseMovido && input.modoControl !== 'touch' && this.juego && this.juego.mundo) {
            // Apuntado con el mouse (NO en modo 'touch': ahí manda el joystick virtual
            // y al soltarlo la nave conserva su ángulo, sin que el mouse se lo robe).
            // Pos de la nave en pantalla: coords de mundo escaladas por el zoom
            // (mundo.scale) + la traslación de la cámara (mundo.x/y).
            const z = this.juego.mundo.scale.x || 1;
            const sx = this.x * z + this.juego.mundo.x;   // pos de la nave en pantalla (X)
            const sy = this.y * z + this.juego.mundo.y;   // pos de la nave en pantalla (Y)
            this.rotacion = Math.atan2(input.mouseY - sy, input.mouseX - sx);
            this.imagen.rotation = this.rotacion;
        }

        // EFECTO DE ROTACIÓN - efecto azul cuando la nave cambia de orientación.
        // Con el apuntado al mouse, "girar" = que el ángulo cambie de un frame a otro.
        let difRot = this.rotacion - rotacionPrevia;
        while (difRot > Math.PI) difRot -= 2 * Math.PI;    // normalizar a [-PI, PI]
        while (difRot < -Math.PI) difRot += 2 * Math.PI;
        const estaGirando = !this.enPropulsor && Math.abs(difRot) > 0.05;
        if (estaGirando) {
            this.rotationEffectTimer -= delta;
            if (this.rotationEffectTimer <= 0) {
                this._crearEfectoRotacion(difRot > 0 ? 1 : -1);
                this.rotationEffectTimer = this.rotationEffectCooldown;
            }
        } else {
            this._destruirEfectoRotacion();
            this.rotationEffectTimer = 0;
        }
        
        // DISPARO
        // Verificar si se debe disparar (tecla presionada + enfriamiento cumplido)
        if (input.debeDisparar(delta)) {
            this._disparar();
        }
        
        // ATAQUE ESPECIAL (ULTI)
        // Verificar si se debe usar el ulti (tecla + carga completa)
        if (input.debeUsarUlti(delta) && this.ultiListo) {
            this._usarUlti();
        }
        
        // Actualizar efecto de daño (esfera azul que se desvanece)
        this._actualizarEfectoDano(delta);
        
        // Actualizar efecto de rotación (círculo azul que aparece al girar)
        this._actualizarEfectoRotacion(delta);
        
        // Actualizar temporizador de sobrecalentamiento
        this._actualizarSobrecalentamiento(delta);
        
        // Mantener la nave dentro de los límites de la pantalla
        this._mantenerEnPantalla();
    }
    
    /**
     * Actualiza el temporizador de sobrecalentamiento
     * Cuando el timer llega a 0, el estado de sobrecalentamiento termina
     * pero los escudos NO se recuperan automáticamente
     * 
     * @param {number} delta - Tiempo transcurrido
     */
    _actualizarSobrecalentamiento(delta) {
        // El temporizador de 10 segundos ya no apaga automáticamente el sobrecalentamiento
        // El sobrecalentamiento SOLO se desactiva cuando el jugador recibe escudos (via agregarEscudos)
        
        // Reducir el timer si es mayor a 0
        if (this.sobrecalentado && this.temporizadorEnfriamiento > 0) {
            this.temporizadorEnfriamiento -= delta;
            
            // El timer llegó a 0, pero el sobrecalentamiento sigue activo
            // No se apaga automáticamente - solo se apaga al recibir escudos
            if (this.temporizadorEnfriamiento <= 0) {
                this.temporizadorEnfriamiento = 0;
                // NO se apaga el sobrecalentado - stays true hasta recibir escudos
            }
        }
    }
    
    /**
     * Actualiza el efecto de daño (esfera azul)
     * Reduce su opacidad hasta que desaparece
     * 
     * @param {number} delta - Tiempo transcurrido
     */
    _actualizarEfectoDano(delta) {
        // Si el timer es mayor a 0, el efecto está activo
        if (this.damageEffectTimer > 0) {
            // Reducir el timer
            this.damageEffectTimer -= delta;
            
            // Actualizar posición del efecto para que siga a la nave
            if (this.damageEffect) {
                this.damageEffect.x = this.x;
                this.damageEffect.y = this.y;
                
                // Reducir opacidad (alpha) mientras desaparece
                // alpha = tiempo restante / tiempo total
                const alpha = this.damageEffectTimer / 0.5;
                this.damageEffect.alpha = alpha;
            }
            
            // Cuando el timer llega a 0, destruir el efecto
            if (this.damageEffectTimer <= 0 && this.damageEffect) {
                this.damageEffect.destroy();
                this.damageEffect = null;
            }
        }
    }
    
    /**
     * Crea un proyectil en la dirección que apunta la nave
     * Llama al método del juego para crear el proyectil
     */
    _disparar() {
        if (this.juego) {
            // Pasar posición actual y rotación (dirección)
            this.juego.crearProyectil(
                this.x, 
                this.y, 
                this.rotacion
            );
        }
    }
    
    /**
     * Activa el ataque especial (Ulti)
     * Destruye todos los asteroides en pantalla y reinicia la carga
     */
    _usarUlti() {
        if (this.juego) {
            // Llamar al método del juego que ejecuta el ulti
            this.juego.activarUlti();
            
            // Reiniciar la carga del ulti
            this.cargaUlti = 0;
            this.ultiListo = false;
        }
    }
    
    /**
     * Agrega carga al ataque especial
     * Se llama cuando se destruye un asteroide
     * 
     * @param {number} cantidad - Cantidad de carga a agregar (puntos)
     */
    agregarCargaUlti(cantidad) {
        // Sumar la carga pero no pasar del máximo (100)
        this.cargaUlti = Math.min(this.cargaMaxUlti, this.cargaUlti + cantidad);
        
        // Si alcanza la carga máxima, marcar como listo
        if (this.cargaUlti >= this.cargaMaxUlti) {
            this.ultiListo = true;
        }
    }
    
    /**
     * Aumenta la velocidad de disparo
     * Se llama cuando se destruye un asteroide especial (power-up)
     * 
     * Reduce el tiempo entre disparos (enfriamiento)
     */
    aumentarVelocidadDisparo() {
        // Reducir el enfriamiento multiplicándolo por 0.8 (80%)
        // Ejemplo: 0.2s -> 0.16s -> 0.128s (más disparos por segundo)
        // Math.max(0.05, ...) = no dejar que baje de 0.05 segundos
        this.enfriamientoDisparoMax = Math.max(CONFIG.DISPARO.ENFRIAMIENTO_MINIMO, this.enfriamientoDisparoMax * CONFIG.DISPARO.MULTIPLICADOR_MEJORA);
        
        // Incrementar contador de mejoras
        this.nivelMejoraVelocidad++;
        
        // Actualizar también en el GestorEntrada
        // Esto asegura que el juego respete el nuevo enfriamiento
        if (this.juego && this.juego.gestorEntrada) {
            this.juego.gestorEntrada.configurarEnfriamientoDisparo(this.enfriamientoDisparoMax);
        }
    }
    
    /**
     * Agrega escudos al jugador
     * También desactiva el sobrecalentamiento si recibe escudos
     * 
     * @param {number} cantidad - Cantidad de escudos a agregar
     */
    agregarEscudos(cantidad) {
        // Agregar escudos (máximo 100%)
        this.escudos = Math.min(this.escudosMax, this.escudos + cantidad);
        
        // Si estaba en sobrecalentamiento y ahora tiene escudos, salir del sobrecalentamiento
        if (this.sobrecalentado && this.escudos > 0) {
            this.sobrecalentado = false;
            this.temporizadorEnfriamiento = 0;
            // Cortar el bucle de rotura de escudos
            if (this.juego && this.juego.gestorSonido) {
                this.juego.gestorSonido.detener(this._loopRotura);
                this._loopRotura = null;
            }
        }
    }
    
    /**
     * Reinicia la velocidad de disparo al valor original
     * Se llama al iniciar un nuevo juego
     */
    reiniciarVelocidadDisparo() {
        this.enfriamientoDisparoMax = this.enfriamientoDisparoBase;
        this.nivelMejoraVelocidad = 0;
        
        // Actualizar en GestorEntrada
        if (this.juego && this.juego.gestorEntrada) {
            this.juego.gestorEntrada.configurarEnfriamientoDisparo(this.enfriamientoDisparoMax);
        }
    }
    
    /**
     * Retorna el porcentaje de mejora de velocidad de disparo
     * Se calcula basado en el nivel actual vs nivel base
     * 
     * @returns {number} Porcentaje de mejora (0 = sin mejora, 100 = máximo)
     */
    obtenerPorcentajeMejoraVelocidad() {
        // Cada nivel de mejora representa ~20% de velocidad extra
        // Máximo 5 niveles = 100%
        const percentage = Math.min(100, this.nivelMejoraVelocidad * 20);
        return percentage;
    }
    
    /**
     * Recibe daño cuando un asteroide choca con la nave
     * Maneja el sistema de sobrecalentamiento (enfriamiento)
     * 
     * @param {number} dano - Porcentaje de escudos a perder
     */
    /**
     * Activa invulnerabilidad temporal (segundos). Mientras dura, `recibirDano`
     * se ignora y la nave titila. Se usa al REVIVIR.
     * @param {number} segundos
     */
    activarInvulnerabilidad(segundos) {
        this.invulnerable = true;
        this.temporizadorInvulnerable = segundos;
    }

    recibirDano(dano) {
        // Invulnerable (ej. recién revivido): ignorar el daño.
        if (this.invulnerable) return;
        // Si no está en sobrecalentamiento
        if (!this.sobrecalentado) {
            // Reducir escudos
            this.escudos = Math.max(0, this.escudos - dano);

            // Sonido de impacto recibido
            if (this.juego && this.juego.gestorSonido) {
                this.juego.gestorSonido.reproducir('recibirImpacto');
            }

            // Sacudida de cámara al recibir un impacto
            if (this.juego && this.juego.sacudirCamara) this.juego.sacudirCamara(7, 0.25);

            // Crear efecto visual de daño
            this._crearEfectoDano();
            
            // Si los escudos llegaron a 0, entrar en modo sobrecalentamiento
            if (this.escudos <= 0) {
                // Guardar que entró en sobrecalentamiento desde 0
                this.escudosPreEnfriamiento = 0;
                this.sobrecalentado = true;
                this.temporizadorEnfriamiento = this.duracionEnfriamiento;
                // Sonido de rotura de escudos EN BUCLE (hasta regenerar o game over)
                if (this.juego && this.juego.gestorSonido) {
                    this.juego.gestorSonido.detener(this._loopRotura);
                    this._loopRotura = this.juego.gestorSonido.reproducirLoop('roturaEscudos');
                }
            }
        } else {
            // Si está en sobrecalentamiento y recibe otro golpe, MUERE
            this.escudos = 0;
            this.juego.gameOver();
            return;
        }
        
        // Verificar si los escudos llegaron a 0 (solo si no está en sobrecalentamiento)
        if (!this.sobrecalentado && this.escudos <= 0) {
            this.juego.gameOver();
        }
    }
    
    /**
     * Crea efecto visual cuando se pierde el sobrecalentamiento
     */
    _crearEfectoPerdidaEnfriamiento() {
        if (this.damageEffect) {
            this.damageEffect.destroy();
        }
        
        this.damageEffect = new PIXI.Graphics();
        
        // Círculo rojo para indicar que perdió el enfriamiento
        this.damageEffect.circle(0, 0, this.radio + 15);
        this.damageEffect.fill({ color: 0xFF0000, alpha: 0.7 });
        
        this.damageEffect.x = this.x;
        this.damageEffect.y = this.y;
        
        if (this.juego && this.juego.mundo) {
            this.juego.mundo.addChild(this.damageEffect);
        }
        
        this.damageEffectTimer = 0.5;
    }
    
    /**
     * Crea efecto visual de rotación
     * Crea efecto de rotación usando HitEffect (como proyectil chocando)
     */
    _crearEfectoRotacion(direccionRotacion) {
        // Crear HitEffect en el CENTRO de la nave (sin offset)
        // Usar tipo 'rotation' para mayor dispersión
        const hit = new HitEffect(this.x, this.y, 'rotation', 1.7);
        
        // El efecto va DEBAJO de la nave. Como el mundo usa sortableChildren (ordena
        // por zIndex, ignora el índice de addChildAt), hay que darle un zIndex menor
        // al de la nave (0); si no, al agregarse después quedaba DIBUJADO ENCIMA.
        if (hit.sprite && this.juego && this.juego.mundo) {
            hit.sprite.zIndex = -1;
            this.juego.mundo.addChild(hit.sprite);
        }
        
        // Guardar en el array
        this.rotationEffects.push({ effect: hit, offsetX: 0 });
    }
    
    /**
     * Destruye todos los efectos de rotación
     */
    _destruirEfectoRotacion() {
        for (const rot of this.rotationEffects) {
            if (rot.effect) {
                rot.effect.destroy();
            }
        }
        this.rotationEffects = [];
    }
    
    /**
     * Actualiza los efectos de rotación
     */
    _actualizarEfectoRotacion(delta) {
        // Actualizar cada efecto
        for (let i = this.rotationEffects.length - 1; i >= 0; i--) {
            const rot = this.rotationEffects[i];
            
            if (rot.effect) {
                rot.effect.update(delta);
                
                // Actualizar posición
                if (rot.effect.sprite) {
                    rot.effect.sprite.x = this.x + rot.offsetX;
                    rot.effect.sprite.y = this.y;
                }
                
                // Si terminó, destruir y remover
                if (!rot.effect.active) {
                    rot.effect.destroy();
                    this.rotationEffects.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Mantiene al jugador dentro de los límites del juego
     * Evita que la nave se salga de la pantalla
     */
    _mantenerEnPantalla() {
        const W = this.anchoJuego, H = this.altoJuego;

        if (CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL) {
            // Mundo TOROIDAL: la nave envuelve (sale por un borde y entra por el
            // opuesto). Se envuelve la posición módulo el tamaño del mundo.
            if (this.x < 0) this.x += W; else if (this.x >= W) this.x -= W;
            if (this.y < 0) this.y += H; else if (this.y >= H) this.y -= H;
        } else {
            // Modo clásico: la nave queda "agarrada" dentro de los bordes.
            const halfWidth = this.width / 2, halfHeight = this.height / 2;
            this.x = Math.max(halfWidth, Math.min(W - halfWidth, this.x));
            this.y = Math.max(halfHeight, Math.min(H - halfHeight, this.y));
        }

        // Actualizar posición del sprite para que coincida
        this.imagen.x = this.x;
        this.imagen.y = this.y;
    }
    
    /**
     * Obtiene la dirección que apunta la nave
     * Útil para calcular hacia dónde van los proyectiles
     * 
     * @returns {Object} - Vector {x, y} representando la dirección
     * x = coseno del ángulo, y = seno del ángulo
     */
    getDirection() {
        return {
            x: Math.cos(this.rotacion),
            y: Math.sin(this.rotacion)
        };
    }

    /**
     * Auto-apuntado (ayuda de puntería, SOLO touch/joystick). Devuelve el ángulo
     * corregido: si hay un enemigo dentro del CONO alrededor de `anguloBase` y a
     * RANGO, mezcla el ángulo un poco hacia él (FUERZA). Si no, devuelve el crudo.
     * Usa distancia en línea recta (lo que ves en pantalla) y elige el enemigo
     * MÁS ALINEADO con tu mira (menor diferencia angular). @private
     * @param {number} anguloBase - ángulo crudo del stick/joystick (rad)
     * @returns {number} ángulo corregido (rad)
     */
    _aplicarAutoApuntado(anguloBase) {
        const cfg = CONFIG.AUTOAPUNTADO;
        if (!cfg || !cfg.ACTIVO || !this.juego) return anguloBase;

        const conoRad = (cfg.CONO_GRADOS * Math.PI) / 180;
        const rango2 = cfg.RANGO * cfg.RANGO;

        let mejorAng = null;
        let mejorDif = conoRad;   // solo enemigos dentro del cono

        const considerar = (lista) => {
            if (!lista) return;
            for (const e of lista) {
                // Ignorar inactivos y los mini-especiales en órbita (no se les dispara).
                if (!e || !e.active || e.enOrbita) continue;
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist2 = dx * dx + dy * dy;
                if (dist2 > rango2 || dist2 < 1) continue;
                const ang = Math.atan2(dy, dx);
                // Diferencia angular por el camino corto → [-PI, PI].
                const dif = Math.abs(Math.atan2(Math.sin(ang - anguloBase), Math.cos(ang - anguloBase)));
                if (dif < mejorDif) {
                    mejorDif = dif;
                    mejorAng = ang;
                }
            }
        };
        considerar(this.juego.enemigos);
        considerar(this.juego.enemigosNaves);
        considerar(this.juego.enemigosSpeciales);

        if (mejorAng === null) return anguloBase;

        // Corrección PARCIAL hacia el objetivo. Como `anguloBase` es el crudo del
        // stick cada frame, esto es una mezcla ESTABLE (no un lock-on que converge).
        const dif = Math.atan2(Math.sin(mejorAng - anguloBase), Math.cos(mejorAng - anguloBase));
        return anguloBase + dif * cfg.FUERZA;
    }
    
    /**
     * Activa el propulsor (dash)
     * La nave avanza 300px en 1 segundo en la dirección que está mirando
     * No puede girar durante el dash
     */
    activarPropulsor() {
        if (!this.active) return;
        
        // Activar el propulsor
        this.enPropulsor = true;
        this.temporizadorPropulsor = this.duracionPropulsor;
    }
    
    /**
     * Destruye el jugador y libera recursos de memoria
     * Se llama cuando termina el juego
     */
    destroy() {
        // Llamar al destroy de la clase padre
        super.destroy();
        
        // Destruir el efecto de daño si existe
        if (this.damageEffect) {
            this.damageEffect.destroy();
            this.damageEffect = null;
        }
    }
}
