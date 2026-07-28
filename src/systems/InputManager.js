/**
 * GestorEntrada - Sistema de gestión de teclado (Keyboard Manager)
 * 
 * Esta clase maneja toda la entrada del usuario mediante el teclado.
 * Controla qué teclas están presionadas y determina las acciones del jugador.
 * 
 * El mapeo de controles vive en `CONFIG.CONTROLES` (config.js) y es EDITABLE:
 * el jugador puede reasignar cada acción desde Opciones (se guarda en localStorage).
 * Teclado y mouse se unifican como "bindings" (códigos): las teclas usan su
 * `KeyboardEvent.code` ('KeyW', 'Space', ...) y los botones del mouse los códigos
 * 'MouseLeft' / 'MouseRight'. El APUNTADO con el mouse (posición del cursor) es
 * fijo, no reasignable.
 *
 * Controles por defecto:
 * - MOUSE: la nave apunta al cursor (fijo)
 * - Click izquierdo / Espacio: Disparar
 * - Click derecho / W / Flecha Arriba: Acelerar hacia el cursor
 * - S / Flecha Abajo: Ulti · E: Devorador · Q: Cohetes · R: Propulsor
 * - P: Pausa/Mejoras · T: Ver Top 5
 *
 * JOYSTICK / GAMEPAD (Gamepad API, por polling — ver actualizarGamepad()):
 * - Stick IZQUIERDO: apunta la nave (equivale al mouse). El derecho también sirve,
 *   como alternativa, si el izquierdo está en el centro.
 * - RT / A: Acelerar · LT / X: Disparar
 * - B: Ulti · LB: Devorador · RB: Cohetes · Y: Propulsor
 * Convive con teclado y mouse: se usa lo que haya a mano.
 */
import { CONFIG } from '../config.js';

// Clave de localStorage donde se guardan los controles reasignados por el jugador.
const STORAGE_KEY_CONTROLES = 'controlesJEE';

export class GestorEntrada {
    /**
     * Constructor del GestorEntrada
     * Inicializa el mapa de teclas y los temporizadores
     */
    constructor() {
        // Teclas = Map (diccionario) que guarda el estado de cada ACCIÓN
        // (true = presionada). Sirve para teclado Y mouse: los botones del mouse
        // entran como códigos 'MouseLeft'/'MouseRight', igual que una tecla.
        this.teclas = new Map();

        // Flag para habilitar/deshabilitar el input (usado cuando se pide el nombre)
        this.habilitado = true;

        // Controles editables: se cargan de config.js (CONFIG.CONTROLES) con
        // override de localStorage si el jugador los reasignó. `this.controles`
        // es {accion: {label, teclas:[codigos]}}; `this.mapeoTeclas` es el índice
        // inverso {codigo: accion} que se consulta en cada evento de teclado/mouse.
        // (La carga/guardado son estáticos → la pantalla de Opciones puede editar
        //  los controles aunque todavía no exista una instancia de juego.)
        this.controles = GestorEntrada.cargarControlesConfig();
        this.mapeoTeclas = this._construirMapeo(this.controles);

        // === MOUSE (apuntado) ===
        // La nave APUNTA a la posición del cursor (fijo, NO reasignable). Los
        // BOTONES del mouse son bindings normales (MouseLeft/MouseRight) y entran
        // por el mismo camino que las teclas (this.teclas).
        this.mouseX = 0;                 // posición del cursor en coords del canvas
        this.mouseY = 0;
        this.mouseMovido = false;        // false hasta el primer mousemove (evita apuntar a 0,0)
        this._canvas = null;             // ref al canvas (para pasar coords de pantalla)

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

        // === JOYSTICK / GAMEPAD (Gamepad API) ===
        // Se lee por polling cada frame (actualizarGamepad()), no por eventos.
        // Modelo "igual al mouse": el stick DERECHO apunta la nave y los gatillos/
        // botones disparan y aceleran. Convive con teclado y mouse (se usa lo que
        // haya a mano): las acciones del gamepad se OR-ean en estaPresionada().
        this.gamepadConectado = false;
        this.gamepadAcciones = new Set();   // acciones activas por botones del joystick
        this.gamepadApuntando = false;      // true si el stick derecho está fuera de la zona muerta
        this.gamepadAngulo = 0;             // ángulo de apuntado del stick derecho (rad)
        this.gamepadDeadzone = 0.25;        // zona muerta del stick (evita deriva)
        // Mapeo de botones (layout "standard", tipo Xbox) → acciones del juego.
        // La PAUSA queda fuera a propósito: es un toggle y al mantener el botón
        // se dispararía en cada frame (se puede sumar con detección de flanco).
        this.gamepadBotones = {
            7: 'avanzar',    // RT (gatillo derecho)
            0: 'avanzar',    // A
            6: 'disparar',   // LT (gatillo izquierdo)
            2: 'disparar',   // X
            1: 'ulti',       // B
            5: 'cohetes',    // RB
            4: 'devorar',    // LB
            3: 'propulsor',  // Y
        };

        // === TÁCTIL (mobile) ===
        // Los controles en pantalla (joystick virtual + botones) escriben acá.
        // Mismo patrón que el gamepad: acciones en un Set que se OR-ea en
        // estaPresionada(), y el apuntado como un ángulo con prioridad.
        this.tactilApuntando = false;
        this.tactilAngulo = 0;
        this.tactilIntensidad = 0;   // 0..1: cuánto se empuja el joystick (para acelerar por intensidad)
        this.tactilAcciones = new Set();

        // === MODO DE CONTROL (elegido en Opciones → Controles) ===
        // Determina QUÉ apuntado manda y si se ven los controles táctiles:
        //   'mouseTeclado' → apunta el mouse; sin overlay táctil
        //   'joystick'     → apunta el gamepad; sin overlay táctil (mouse de respaldo)
        //   'touch'        → apunta el joystick virtual; overlay táctil visible; mouse OFF
        // El TECLADO y TODOS los bindings de acciones funcionan SIEMPRE, en cualquier modo.
        this.modoControl = GestorEntrada.cargarModoControl();

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

        // --- Mouse: apuntado y acciones (izq = disparar, der = acelerar) ---
        window.addEventListener('mousemove', (e) => {
            const r = this._rectCanvas();
            this.mouseX = e.clientX - r.left;
            this.mouseY = e.clientY - r.top;
            this.mouseMovido = true;
        });
        window.addEventListener('mousedown', (e) => {
            if (!this.habilitado) return;
            // Los botones del mouse son bindings: se resuelven contra el mismo mapa.
            const accion = this.mapeoTeclas[this._codigoBotonMouse(e.button)];
            if (accion) this.teclas.set(accion, true);
        });
        window.addEventListener('mouseup', (e) => {
            // El mouseup SIEMPRE libera (aunque el input esté deshabilitado) para
            // que no quede una acción "pegada".
            const accion = this.mapeoTeclas[this._codigoBotonMouse(e.button)];
            if (accion) this.teclas.set(accion, false);
        });
        // Evitar el menú contextual del click derecho (se usa para acelerar)
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Rect del canvas para convertir coords de pantalla (clientX/Y) a coords del
     * canvas. Se resuelve perezosamente (el canvas puede no existir al construir).
     * @private
     */
    _rectCanvas() {
        if (!this._canvas) this._canvas = document.querySelector('canvas');
        return this._canvas ? this._canvas.getBoundingClientRect() : { left: 0, top: 0 };
    }

    /**
     * Traduce el número de botón del mouse a un código de binding.
     * @param {number} button - e.button (0=izq, 1=medio, 2=der)
     * @returns {string|null}
     * @private
     */
    _codigoBotonMouse(button) {
        if (button === 0) return 'MouseLeft';
        if (button === 1) return 'MouseMiddle';
        if (button === 2) return 'MouseRight';
        return null;
    }

    // ===================== CONFIG DE CONTROLES (estático) =====================
    // Estos métodos operan sobre CONFIG.CONTROLES + localStorage SIN necesitar una
    // instancia, así la pantalla de Controles (Opciones) funciona en el menú aunque
    // todavía no exista una partida (el GestorEntrada se crea recién al jugar).

    /**
     * Copia profunda de los controles por defecto (CONFIG.CONTROLES).
     * @returns {Object} {accion: {label, teclas:[...]}}
     */
    static defaultControles() {
        const def = {};
        for (const [accion, cfg] of Object.entries(CONFIG.CONTROLES || {})) {
            def[accion] = { label: cfg.label, teclas: [...(cfg.teclas || [])] };
        }
        return def;
    }

    /**
     * Carga los controles: parte de los defaults y pisa las `teclas` de cada
     * acción con lo guardado en localStorage (si el jugador reasignó algo).
     * @returns {Object}
     */
    static cargarControlesConfig() {
        const controles = GestorEntrada.defaultControles();
        try {
            const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY_CONTROLES) || 'null');
            if (guardado && typeof guardado === 'object') {
                for (const accion of Object.keys(controles)) {
                    if (Array.isArray(guardado[accion])) controles[accion].teclas = [...guardado[accion]];
                }
            }
        } catch (e) { /* localStorage no disponible o JSON inválido → defaults */ }
        return controles;
    }

    /** Persiste los controles (solo las teclas) en localStorage. @param {Object} controles */
    static guardarControlesConfig(controles) {
        try {
            const soloTeclas = {};
            for (const [accion, cfg] of Object.entries(controles)) soloTeclas[accion] = cfg.teclas;
            localStorage.setItem(STORAGE_KEY_CONTROLES, JSON.stringify(soloTeclas));
        } catch (e) { /* localStorage no disponible → no persiste, no rompe */ }
    }

    /**
     * Reasigna EN un objeto de controles: el `codigo` pasa a ser el único binding
     * de `accion`, sacándolo de cualquier otra acción (evita conflictos). Guarda.
     * @returns {boolean} true si se reasignó
     */
    static reasignarEn(controles, accion, codigo) {
        if (!controles[accion] || !codigo) return false;
        for (const [otra, cfg] of Object.entries(controles)) {
            if (otra === accion) continue;
            cfg.teclas = cfg.teclas.filter(c => c !== codigo);
        }
        controles[accion].teclas = [codigo];
        GestorEntrada.guardarControlesConfig(controles);
        return true;
    }

    /** Borra el override de localStorage y devuelve los controles por defecto. @returns {Object} */
    static restaurarControlesConfig() {
        try { localStorage.removeItem(STORAGE_KEY_CONTROLES); } catch (e) { /* ignorar */ }
        return GestorEntrada.defaultControles();
    }

    /** Los 3 modos de control disponibles (para la UI de Opciones). */
    static get MODOS() {
        return [
            { id: 'mouseTeclado', label: 'Mouse y teclado' },
            { id: 'joystick',     label: 'Joystick' },
            { id: 'touch',        label: 'Touch' },
        ];
    }

    /**
     * Carga el modo de control guardado. Si no hay, autodetecta: en dispositivo
     * táctil arranca en 'touch', si no en 'mouseTeclado'.
     * @returns {'mouseTeclado'|'joystick'|'touch'}
     */
    static cargarModoControl() {
        let m = null;
        try { m = localStorage.getItem('modoControlJEE'); } catch (e) { /* ignorar */ }
        if (m === 'mouseTeclado' || m === 'joystick' || m === 'touch') return m;
        const esTactil = (navigator.maxTouchPoints || 0) > 0 || ('ontouchstart' in window);
        return esTactil ? 'touch' : 'mouseTeclado';
    }

    /** Guarda el modo de control en localStorage. */
    static guardarModoControl(modo) {
        try { localStorage.setItem('modoControlJEE', modo); } catch (e) { /* ignorar */ }
    }

    /** Cambia el modo de control de esta instancia y lo persiste. */
    setModoControl(modo) {
        this.modoControl = modo;
        GestorEntrada.guardarModoControl(modo);
    }

    // ===================== CONFIG DE CONTROLES (instancia) =====================

    /**
     * Arma el índice inverso {codigo: accion} desde el objeto de controles.
     * @param {Object} controles
     * @returns {Object}
     * @private
     */
    _construirMapeo(controles) {
        const mapa = {};
        for (const [accion, cfg] of Object.entries(controles)) {
            for (const codigo of (cfg.teclas || [])) mapa[codigo] = accion;
        }
        return mapa;
    }

    /**
     * Devuelve el objeto de controles actual (para la pantalla de Opciones).
     * @returns {Object} {accion: {label, teclas:[...]}}
     */
    obtenerControles() {
        return this.controles;
    }

    /**
     * Reasigna un control en esta instancia (guarda + reconstruye el mapa).
     * @returns {boolean} true si se reasignó
     */
    reasignarControl(accion, codigo) {
        if (!GestorEntrada.reasignarEn(this.controles, accion, codigo)) return false;
        this.mapeoTeclas = this._construirMapeo(this.controles);
        this.teclas.clear();   // soltar cualquier acción "pegada" tras el remapeo
        return true;
    }

    /** Restaura los controles por defecto en esta instancia. */
    restaurarControles() {
        this.controles = GestorEntrada.restaurarControlesConfig();
        this.mapeoTeclas = this._construirMapeo(this.controles);
        this.teclas.clear();
    }

    /** Recarga los controles desde localStorage (tras un cambio hecho fuera de esta instancia). */
    recargarControles() {
        this.controles = GestorEntrada.cargarControlesConfig();
        this.mapeoTeclas = this._construirMapeo(this.controles);
        this.teclas.clear();
    }

    // ========================= JOYSTICK / GAMEPAD =========================

    /**
     * Lee el estado del joystick (Gamepad API) y lo vuelca en:
     *  - `gamepadAcciones`: acciones activas por botones (se OR-ean en estaPresionada)
     *  - `gamepadApuntando` / `gamepadAngulo`: apuntado con el stick DERECHO
     *
     * La Gamepad API es por POLLING: hay que llamarlo UNA vez por frame (lo hace el
     * game loop). Se reconstruye el estado desde cero en cada llamada, así soltar un
     * botón lo libera solo y no hace falta manejar eventos de "keyup".
     */
    actualizarGamepad() {
        // Reconstruir el estado del frame desde cero
        this.gamepadAcciones.clear();
        this.gamepadApuntando = false;

        // Si el input está deshabilitado (ej: escribiendo el nombre), ignorar el joystick
        if (!this.habilitado) { this.gamepadConectado = false; return; }

        const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
        let pad = null;
        for (const p of pads) { if (p && p.connected) { pad = p; break; } }
        this.gamepadConectado = !!pad;
        if (!pad) return;

        // --- Botones → acciones (los gatillos son analógicos: .value) ---
        const botones = pad.buttons || [];
        for (const idx in this.gamepadBotones) {
            const b = botones[idx];
            if (b && (b.pressed || b.value > 0.4)) this.gamepadAcciones.add(this.gamepadBotones[idx]);
        }

        // --- Stick → apuntado (dirección analógica) ---
        // El IZQUIERDO (axes 0/1) es el principal: con él apuntás y, apretando el
        // gatillo de acelerar, te movés en esa dirección. El DERECHO (axes 2/3) queda
        // como alternativa por si se prefiere apuntar con ese.
        const ejes = pad.axes || [];
        let ax = ejes[0] || 0, ay = ejes[1] || 0;
        if (Math.hypot(ax, ay) <= this.gamepadDeadzone) {
            ax = ejes[2] || 0; ay = ejes[3] || 0;
        }
        if (Math.hypot(ax, ay) > this.gamepadDeadzone) {
            this.gamepadApuntando = true;
            this.gamepadAngulo = Math.atan2(ay, ax);
        }
        // Si el stick vuelve al centro, la nave conserva el último ángulo (no se resetea).
    }

    /**
     * Nombre legible de un código de binding para mostrar en la UI.
     * @param {string} codigo - 'KeyW', 'Space', 'MouseRight', ...
     * @returns {string}
     */
    static nombreCodigo(codigo) {
        const especiales = {
            MouseLeft: 'Click Izq', MouseRight: 'Click Der', MouseMiddle: 'Click Medio',
            Space: 'Espacio', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
            Escape: 'Esc', Enter: 'Enter', ShiftLeft: 'Shift', ShiftRight: 'Shift',
            ControlLeft: 'Ctrl', ControlRight: 'Ctrl',
        };
        if (especiales[codigo]) return especiales[codigo];
        if (typeof codigo === 'string') {
            if (codigo.startsWith('Key')) return codigo.slice(3);      // KeyW → W
            if (codigo.startsWith('Digit')) return codigo.slice(5);    // Digit1 → 1
        }
        return codigo || '—';
    }
    
    /**
     * Verifica si una tecla específica está presionada
     * 
     * @param {string} accion - Acción a verificar ('disparar', 'ulti', 'rotarIzquierda', 'rotarDerecha')
     * @returns {boolean} - true si la tecla está presionada
     */
    estaPresionada(accion) {
        // Teclado/mouse (teclas) O joystick (gamepadAcciones) O táctil (tactilAcciones):
        // se usa lo que haya a mano. Como todos los debeXxx() consultan este método,
        // las 3 fuentes quedan soportadas en disparo/aceleración/ulti/cohetes/devorador/propulsor.
        return this.teclas.get(accion) === true
            || this.gamepadAcciones.has(accion)
            || this.tactilAcciones.has(accion);
    }

    // ============================= TÁCTIL =============================
    // Los controles en pantalla (joystick virtual + botones) llaman a estos métodos.

    /** Fija el apuntado táctil (ángulo en rad) y la intensidad (0..1) del empuje.
     *  Lo usa el joystick virtual al arrastrar. La intensidad escala la aceleración. */
    setTactilApuntado(angulo, intensidad = 1) { this.tactilApuntando = true; this.tactilAngulo = angulo; this.tactilIntensidad = intensidad; }

    /** Ajusta solo la intensidad del empuje (sin cambiar el ángulo). */
    setTactilIntensidad(v) { this.tactilIntensidad = Math.max(0, Math.min(1, v)); }

    /** Suelta el apuntado táctil (la nave conserva el último ángulo; deja de acelerar). */
    limpiarTactilApuntado() { this.tactilApuntando = false; this.tactilIntensidad = 0; }

    /** Activa/desactiva una acción táctil (botón en pantalla). */
    setTactilAccion(accion, activo) {
        if (activo) this.tactilAcciones.add(accion);
        else this.tactilAcciones.delete(accion);
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
        
        // Si dispara (cualquier binding de 'disparar': Espacio o click izq) Y el enfriamiento llegó a 0
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
        // Avanza con cualquier binding de 'avanzar' (W/Flecha arriba o click der)
        // o, en táctil, empujando el joystick más allá de la zona muerta.
        return this.intensidadAvance() > 0;
    }

    /**
     * Intensidad de aceleración 0..1.
     *  - En TÁCTIL: proporcional a cuánto se empuja el joystick (la fija el
     *    joystick vía `setTactilApuntado`/`setTactilIntensidad`).
     *  - En PC (mouse/teclado) y gamepad: 1 si se presiona 'avanzar', 0 si no
     *    (thrust completo, como siempre).
     */
    intensidadAvance() {
        if (this.modoControl === 'touch' && this.tactilApuntando) {
            return this.tactilIntensidad || 0;
        }
        return this.estaPresionada('avanzar') ? 1 : 0;
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
        // teclas.clear() ya libera todo (teclado y botones del mouse van al mismo Map).
        this.teclas.clear();
        this.gamepadAcciones.clear();   // soltar también las acciones del joystick
        this.tactilAcciones.clear();    // y las táctiles
        this.tactilApuntando = false;
        this.tactilIntensidad = 0;

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
        this.gamepadAcciones.clear();
        this.gamepadApuntando = false;
        this.tactilAcciones.clear();
        this.tactilApuntando = false;
        this.tactilIntensidad = 0;
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
