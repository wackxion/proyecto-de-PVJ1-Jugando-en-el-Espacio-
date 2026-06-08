/**
 * GestorEntrada - Sistema de gestión de teclado (Keyboard Manager)
 * 
 * Esta clase maneja toda la entrada del usuario mediante el teclado.
 * Controla qué teclas están presionadas y determina las acciones del jugador.
 * 
 * Controles del juego:
 * - W / Flecha Arriba: Avanzar (con inercia)
 * - Espacio: Disparar proyectil
 * - S / Flecha Abajo: Ataque especial (Ulti)
 * - A / Flecha Izquierda: Rotar nave hacia la izquierda
 * - D / Flecha Derecha: Rotar nave hacia la derecha
 */
import { CONFIG } from '../config.js';

export class GestorEntrada {
    /**
     * Constructor del GestorEntrada
     * Inicializa el mapa de teclas y los temporizadores
     */
    constructor() {
        // Teclas = Map (diccionario) que guarda el estado de cada tecla
        // true = presionada, false = no presionada
        this.teclas = new Map();
        
        // Flag para habilitar/deshabilitar el input (usado cuando se pide el nombre)
        this.habilitado = true;
        
// MapeoTeclas = mapeo entre códigos de teclas y acciones
        // Convierte el código de la tecla (ej: 'KeyW') en una acción (ej: 'avanzar')
        this.mapeoTeclas = {
            // Teclas para avanzar (W con inercia)
            'KeyW': 'avanzar',           // W
            'ArrowUp': 'avanzar',        // Flecha arriba
            
            // Teclas para disparar (Barra espaciadora)
            'Space': 'disparar',          // Barra espaciadora
            
            // Teclas para ataque especial
            'KeyS': 'ulti',            // S
            'ArrowDown': 'ulti',       // Flecha abajo
            
            // Teclas para rotar izquierda
            'KeyA': 'rotarIzquierda',      // A
            'ArrowLeft': 'rotarIzquierda', // Flecha izquierda
            
            // Teclas para rotar derecha
            'KeyD': 'rotarDerecha',     // D
            'ArrowRight': 'rotarDerecha', // Flecha derecha
            
            // Teclas para devorar partículas Boid
            'KeyE': 'devorar',          // E
            
            // Teclas para cohetes
            'KeyQ': 'cohetes',          // Q
            
            // Teclas para propulsor
            'KeyR': 'propulsor',        // R
            
            // Teclas de control del juego
            'KeyP': 'pausa',               // P - Pausar el juego
            'KeyT': 'mostrarTop5'          // T - Mostrar Top 5 (solo cuando está pausado)
        };
        
        // EnfriamientoDisparo = temporizador entre disparos
        // Evita que el jugador dispare constantemente con una sola tecla
        this.enfriamientoDisparo = 0;
        this.enfriamientoDisparoMax = CONFIG.DISPARO.ENFRIAMIENTO; // 0.2 segundos entre cada disparo
        
        // EnfriamientoUlti = temporizador para el ataque especial
        this.enfriamientoUlti = 0;
        this.enfriamientoUltiMax = CONFIG.ULTI.COOLDOWN_TECLA; // 0.5 segundos de cooldown
        
        // EnfriamientoDevorar = temporizador para el devorador de partículas
        this.enfriamientoDevorar = 0;
        this.enfriamientoDevorarMax = CONFIG.HABILIDADES.DEVORADOR_COOLDOWN; // 5 segundos de cooldown
        
        // EnfriamientoCohetes = temporizador para los cohetes
        this.enfriamientoCohetes = 0;
        this.enfriamientoCohetesMax = CONFIG.HABILIDADES.COHETES_COOLDOWN; // 5 segundos de cooldown
        
        // EnfriamientoPropulsor = temporizador para el propulsor (dash)
        this.enfriamientoPropulsor = 0;
        this.enfriamientoPropulsorMax = CONFIG.HABILIDADES.PROPULSOR_COOLDOWN; // 15 segundos de cooldown
        
        // Vincular los eventos del teclado
        this._vincularEventos();
    }
    
    /**
     * Vincula los eventos del teclado
     * Se llama en el constructor para empezar a detectar teclas
     */
    _vincularEventos() {
        // Evento cuando se presiona una tecla
        window.addEventListener('keydown', (e) => {
            // Si el input está deshabilitado (ej: pidiendo nombre), ignorar teclas del juego
            if (!this.habilitado) return;
            
            // Obtener la acción correspondiente a esta tecla
            const accion = this.mapeoTeclas[e.code];
            
            // Si hay una acción mapeada, marcar como presionada
            if (accion) {
                this.teclas.set(accion, true);
                
                // preventDefault = evitar que la tecla haga su función por defecto
                // (ej: que la flecha abajo no baje el scroll de la página)
                e.preventDefault();
            }
        });
        
        // Evento cuando se suelta una tecla
        window.addEventListener('keyup', (e) => {
            // Si el input está deshabilitado, ignorar teclas del juego
            if (!this.habilitado) return;
            
            const accion = this.mapeoTeclas[e.code];
            
            if (accion) {
                this.teclas.set(accion, false);
                e.preventDefault();
            }
        });
    }
    
    /**
     * Verifica si una tecla específica está presionada
     * 
     * @param {string} accion - Acción a verificar ('disparar', 'ulti', 'rotarIzquierda', 'rotarDerecha')
     * @returns {boolean} - true si la tecla está presionada
     */
    estaPresionada(accion) {
        return this.teclas.get(accion) === true;
    }
    
    /**
     * Obtiene la dirección de rotación
     * Se usa para rotar la nave
     * 
     * @returns {number} 
     * -1 = rotar a la izquierda
     *  1 = rotar a la derecha
     *  0 = no rotar
     */
    obtenerRotacion() {
        let rotacion = 0;
        
        // Si está presionada la tecla de rotación izquierda, restar 1
        if (this.estaPresionada('rotarIzquierda')) rotacion -= 1;
        
        // Si está presionada la tecla de rotación derecha, sumar 1
        if (this.estaPresionada('rotarDerecha')) rotacion += 1;
        
        return rotacion;
    }
    
    /**
     * Verifica si se debe disparar
     * Considera el enfriamiento (tiempo entre disparos)
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     * @returns {boolean} - true si debe disparar
     */
    debeDisparar(delta) {
        // Reducir el temporizador de enfriamiento
        this.enfriamientoDisparo -= delta;
        
        // Si la tecla de disparar está presionada Y el enfriamiento llegó a 0
        if (this.estaPresionada('disparar') && this.enfriamientoDisparo <= 0) {
            // Reiniciar el enfriamiento al valor máximo
            this.enfriamientoDisparo = this.enfriamientoDisparoMax;
            
            // Permitir disparar
            return true;
        }
        
        // No disparar
        return false;
    }
    
    /**
     * Verifica si se debe avanzar (tecla W)
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     * @returns {boolean} - true si debe avanzar
     */
    debeAvanzar(delta) {
        return this.estaPresionada('avanzar');
    }
    
    /**
     * Establece un nuevo enfriamiento para disparos
     * Se usa cuando el jugador agarra un power-up (especial)
     * 
     * @param {number} enfriamiento - Nuevo tiempo entre disparos (segundos)
     */
    configurarEnfriamientoDisparo(enfriamiento) {
        this.enfriamientoDisparoMax = enfriamiento;
    }
    
    /**
     * Verifica si se debe usar el ataque especial (Ulti)
     * Considera el enfriamiento
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     * @returns {boolean} - true si debe usar el ulti
     */
    debeUsarUlti(delta) {
        // Reducir el temporizador
        this.enfriamientoUlti -= delta;
        
        // Si la tecla de ulti está presionada Y el cooldown llegó a 0
        if (this.estaPresionada('ulti') && this.enfriamientoUlti <= 0) {
            // Reiniciar el enfriamiento
            this.enfriamientoUlti = this.enfriamientoUltiMax;
            
            // Permitir usar ulti
            return true;
        }
        
        return false;
    }
    
    /**
     * Verifica si se debe usar el devorador (E)
     * Considera el cooldown de 5 segundos
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     * @returns {boolean} - true si debe usar el devorador
     */
    debeUsarDevorar(delta) {
        // PRIMERO verificar si se puede usar (si el cooldown está en 0)
        if (this.estaPresionada('devorar') && this.enfriamientoDevorar <= 0) {
            // Activar - establecer cooldown a 5 segundos
            this.enfriamientoDevorar = this.enfriamientoDevorarMax;
            return true;
        }
        
        // LUEGO decrementar el cooldown si está activo
        if (this.enfriamientoDevorar > 0) {
            this.enfriamientoDevorar -= delta;
            if (this.enfriamientoDevorar < 0) this.enfriamientoDevorar = 0;
        }
        
        return false;
    }
    
    /**
     * Obtiene el tiempo restante de cooldown del devorador
     * @returns {number} Tiempo restante en segundos
     */
    obtenerCooldownDevorar() {
        return Math.max(0, this.enfriamientoDevorar);
    }
    
    /**
     * Limpia todas las teclas y resetea cooldowns
     * Se llama al reiniciar el juego para evitar teclas "atascadas"
     */
    reiniciar() {
        this.teclas.clear();
        
        // Resetear cooldowns de habilidades
        this.enfriamientoCohetes = 0;
        this.enfriamientoDevorar = 0;
        this.enfriamientoPropulsor = 0;
    }
    
    /**
     * Deshabilita el input del teclado
     * Se usa cuando se muestra un input HTML (ej: pedir nombre para Top 5)
     */
    deshabilitar() {
        this.habilitado = false;
        this.teclas.clear();
    }
    
    /**
     * Habilita el input del teclado
     */
    habilitar() {
        this.habilitado = true;
    }
    
    /**
     * Verifica si se debe pausar el juego (tecla P)
     * @returns {boolean} true si se presionó P
     */
    debePausar() {
        return this.estaPresionada('pausa');
    }
    
    /**
     * Verifica si se debe mostrar el Top 5 (tecla T)
     * Solo funciona cuando el juego está pausado
     * @returns {boolean} true si se presionó T
     */
    debeMostrarTop5() {
        return this.estaPresionada('mostrarTop5');
    }
    
    /**
     * Verifica si se deben lanzar cohetes (tecla Q)
     * @param {number} delta - Tiempo transcurrido
     * @returns {boolean} true si debe lanzar cohetes
     */
    debeUsarCohetes(delta) {
        // Siempre decrementar el cooldown
        if (this.enfriamientoCohetes > 0) {
            this.enfriamientoCohetes -= delta;
            if (this.enfriamientoCohetes < 0) this.enfriamientoCohetes = 0;
        }
        
        // Si la tecla de cohetes está presionada Y el cooldown llegó a 0
        if (this.estaPresionada('cohetes') && this.enfriamientoCohetes <= 0) {
            // Reiniciar el enfriamiento
            this.enfriamientoCohetes = this.enfriamientoCohetesMax;
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtiene el tiempo restante de cooldown de los cohetes
     * @returns {number} Tiempo restante
     */
    obtenerCooldownCohetes() {
        return Math.max(0, this.enfriamientoCohetes);
    }
    
    /**
     * Verifica si se debe usar el propulsor (tecla R)
     * @param {number} delta - Tiempo transcurrido
     * @returns {boolean} true si debe usar el propulsor
     */
    debeUsarPropulsor(delta) {
        // Siempre decrementar el cooldown
        if (this.enfriamientoPropulsor > 0) {
            this.enfriamientoPropulsor -= delta;
            if (this.enfriamientoPropulsor < 0) this.enfriamientoPropulsor = 0;
        }
        
        // Si la tecla de propulsor está presionada Y el cooldown llegó a 0
        if (this.estaPresionada('propulsor') && this.enfriamientoPropulsor <= 0) {
            this.enfriamientoPropulsor = this.enfriamientoPropulsorMax;
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtiene el tiempo restante de cooldown del propulsor
     * @returns {number} Tiempo restante
     */
    obtenerCooldownPropulsor() {
        return Math.max(0, this.enfriamientoPropulsor);
    }
}
