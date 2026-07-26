/**
 * ControlesTactiles - Controles en pantalla para jugar en celular (mobile)
 *
 * Overlay DOM sobre el canvas del juego con:
 *  - Joystick virtual (abajo-izquierda): APUNTA la nave y ACELERA hacia ahí.
 *  - Botones (abajo-derecha): Disparar (grande) + Ulti, Devorador, Cohetes, Propulsor.
 *
 * No toca la lógica del juego: escribe en el GestorEntrada con el mismo patrón
 * que el gamepad — `setTactilApuntado(angulo)` para el apuntado y `setTactilAccion(
 * accion, activo)` para los botones (que se OR-ean en `estaPresionada()`).
 *
 * Solo se muestra en dispositivos táctiles (o forzado, para probar en DevTools).
 */
export class ControlesTactiles {
    /** ¿El dispositivo tiene pantalla táctil? */
    static soportado() {
        return (navigator.maxTouchPoints || 0) > 0 || ('ontouchstart' in window);
    }

    /**
     * @param {HTMLElement} contenedor - dónde montar el overlay (game-container o body)
     * @param {GestorEntrada} input - a quién escribirle las acciones/apuntado
     */
    constructor(contenedor, input) {
        this.input = input;
        this.contenedor = contenedor || document.body;
        this.forzado = false;             // true = mostrar aunque no sea táctil (debug)
        this._jsTouchId = null;           // id del dedo que controla el joystick
        this._listeners = [];             // para limpiar al destruir

        this._crearUI();
        this._vincular();
        this.ocultar();
    }

    /** Construye el overlay y sus controles. @private */
    _crearUI() {
        const overlay = document.createElement('div');
        overlay.id = 'controles-tactiles';
        overlay.style.cssText = `
            position: absolute; inset: 0; z-index: 500;
            pointer-events: none;   /* solo los controles reciben toques */
            touch-action: none; user-select: none; -webkit-user-select: none;
        `;

        // --- Joystick virtual (base + perilla) ---
        const base = document.createElement('div');
        base.style.cssText = `
            position: absolute; left: 4%; bottom: 8%;
            width: 130px; height: 130px; border-radius: 50%;
            background: rgba(0,68,204,0.10); border: 3px solid rgba(0,68,204,0.55);
            box-shadow: 0 0 12px rgba(0,68,204,0.4);
            pointer-events: auto; touch-action: none;
        `;
        const perilla = document.createElement('div');
        perilla.style.cssText = `
            position: absolute; left: 50%; top: 50%;
            width: 60px; height: 60px; border-radius: 50%;
            background: rgba(0,68,204,0.35); border: 2px solid rgba(120,180,255,0.9);
            transform: translate(-50%, -50%); will-change: transform;
        `;
        base.appendChild(perilla);
        overlay.appendChild(base);
        this.base = base; this.perilla = perilla;

        // --- Botón de DISPARO (abajo-derecha) ---
        // Es el ÚNICO botón creado. Las HABILIDADES (Ulti, Devorador, Cohetes,
        // Propulsor) NO tienen botón acá: se usan tocando sus iconos que ya están
        // en el HUD lateral (lo engancha PixiHUD).
        const botonDisparo = this._crearBoton('FUEGO', 'disparar', 100);
        botonDisparo.style.position = 'absolute';
        botonDisparo.style.right = '4%';
        botonDisparo.style.bottom = '8%';
        overlay.appendChild(botonDisparo);

        this.contenedor.appendChild(overlay);
        this.overlay = overlay;
    }

    /**
     * Crea un botón redondo que activa/desactiva una acción mientras se lo mantiene.
     * @private
     */
    _crearBoton(texto, accion, tam) {
        const b = document.createElement('div');
        b.style.cssText = `
            width: ${tam}px; height: ${tam}px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Segoe Script', cursive; font-weight: bold;
            font-size: ${Math.round(tam * 0.22)}px; color: #cfe0ff;
            background: rgba(0,68,204,0.14); border: 3px solid rgba(0,68,204,0.6);
            box-shadow: 0 0 10px rgba(0,68,204,0.35);
            pointer-events: auto; touch-action: none;
        `;
        b.textContent = texto;
        const presionar = (e) => { e.preventDefault(); this.input.setTactilAccion(accion, true);  b.style.background = 'rgba(0,68,204,0.45)'; };
        const soltar    = (e) => { if (e) e.preventDefault(); this.input.setTactilAccion(accion, false); b.style.background = 'rgba(0,68,204,0.14)'; };
        b.addEventListener('touchstart', presionar, { passive: false });
        b.addEventListener('touchend', soltar, { passive: false });
        b.addEventListener('touchcancel', soltar, { passive: false });
        // Fallback con mouse (para probar en DevTools con el cursor)
        b.addEventListener('mousedown', presionar);
        b.addEventListener('mouseup', soltar);
        b.addEventListener('mouseleave', soltar);
        this._listeners.push({ el: b, presionar, soltar });
        return b;
    }

    /** Vincula el joystick (touch/mouse). @private */
    _vincular() {
        const R = 55;              // radio máximo de la perilla (px)
        const DEADZONE = 14;       // zona muerta (px) para no apuntar/acelerar con toques mínimos

        const centro = () => {
            const r = this.base.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };
        const mover = (px, py) => {
            const c = centro();
            let dx = px - c.x, dy = py - c.y;
            const mag = Math.hypot(dx, dy);
            if (mag > R) { dx = dx / mag * R; dy = dy / mag * R; }
            this.perilla.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            if (mag > DEADZONE) {
                this.input.setTactilApuntado(Math.atan2(dy, dx));   // apuntar
                this.input.setTactilAccion('avanzar', true);         // y acelerar hacia ahí
            } else {
                this.input.setTactilAccion('avanzar', false);
            }
        };
        const soltar = () => {
            this.perilla.style.transform = 'translate(-50%, -50%)';
            this.input.limpiarTactilApuntado();
            this.input.setTactilAccion('avanzar', false);
        };

        // --- Touch (multitouch: seguimos el dedo que empezó en la base) ---
        const onStart = (e) => {
            e.preventDefault();
            if (this._jsTouchId !== null) return;
            const t = e.changedTouches[0];
            this._jsTouchId = t.identifier;
            mover(t.clientX, t.clientY);
        };
        const onMove = (e) => {
            if (this._jsTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this._jsTouchId) { e.preventDefault(); mover(t.clientX, t.clientY); break; }
            }
        };
        const onEnd = (e) => {
            if (this._jsTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this._jsTouchId) { this._jsTouchId = null; soltar(); break; }
            }
        };
        this.base.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);

        // --- Fallback con mouse (para probar en DevTools con el cursor) ---
        let mouseAbajo = false;
        const mDown = (e) => { mouseAbajo = true; mover(e.clientX, e.clientY); };
        const mMove = (e) => { if (mouseAbajo) mover(e.clientX, e.clientY); };
        const mUp = () => { if (mouseAbajo) { mouseAbajo = false; soltar(); } };
        this.base.addEventListener('mousedown', mDown);
        window.addEventListener('mousemove', mMove);
        window.addEventListener('mouseup', mUp);

        this._winListeners = [
            ['touchmove', onMove], ['touchend', onEnd], ['touchcancel', onEnd],
            ['mousemove', mMove], ['mouseup', mUp],
        ];
    }

    /** Muestra el overlay (solo si es táctil, o si forzar=true). */
    mostrar(forzar = false) {
        if (forzar) this.forzado = true;
        if (!(this.forzado || ControlesTactiles.soportado())) return;
        if (this.overlay) this.overlay.style.display = 'block';
        // Con los controles táctiles activos, el apuntado es SOLO por joystick
        // (se desactiva el mouse, que en táctil se emula y robaría la dirección).
        if (this.input) this.input.controlTactilActivo = true;
    }

    /** Oculta el overlay y suelta cualquier acción táctil pegada. */
    ocultar() {
        if (this.overlay) this.overlay.style.display = 'none';
        if (this.input) {
            this.input.limpiarTactilApuntado();
            this.input.tactilAcciones.clear();
            this.input.controlTactilActivo = false;   // reactivar apuntado por mouse
        }
        this._jsTouchId = null;
        if (this.perilla) this.perilla.style.transform = 'translate(-50%, -50%)';
    }

    /** Muestra u oculta según el estado del juego (jugando y no pausado/game over). */
    setVisible(visible) { visible ? this.mostrar() : this.ocultar(); }

    /** Limpia listeners y saca el overlay del DOM. */
    destruir() {
        for (const [ev, fn] of (this._winListeners || [])) window.removeEventListener(ev, fn);
        if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
    }
}
