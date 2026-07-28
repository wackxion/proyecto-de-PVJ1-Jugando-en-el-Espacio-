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
            opacity: 0.56;          /* opacidad global de los controles tactiles (bajada otro 25%) */
        `;

        // --- Joystick FLOTANTE: aparece DONDE se toca en la zona izquierda ---
        // Zona táctil (transparente) que cubre la mitad-izquierda inferior; al
        // tocarla, la base del joystick aparece en ese punto (ver _vincular).
        const zonaJoy = document.createElement('div');
        zonaJoy.style.cssText = 'position:absolute; left:0; bottom:0; width:45%; height:88%; pointer-events:auto; touch-action:none;';
        overlay.appendChild(zonaJoy);
        this.zonaJoy = zonaJoy;

        const base = document.createElement('div');
        base.style.cssText = `
            position: absolute; left: 0; top: 0; display: none;
            width: 170px; height: 170px; border-radius: 50%;
            background: rgba(0,68,204,0.10); border: 3px solid rgba(0,68,204,0.55);
            box-shadow: 0 0 12px rgba(0,68,204,0.4);
            pointer-events: none; touch-action: none;
        `;
        const perilla = document.createElement('div');
        perilla.style.cssText = `
            position: absolute; left: 50%; top: 50%;
            width: 78px; height: 78px; border-radius: 50%;
            background: rgba(0,68,204,0.35); border: 2px solid rgba(120,180,255,0.9);
            transform: translate(-50%, -50%); will-change: transform;
        `;
        base.appendChild(perilla);
        overlay.appendChild(base);
        this.base = base; this.perilla = perilla;

        // --- Botón de DISPARO (abajo-derecha) ---
        const botonDisparo = this._crearBoton('FUEGO', 'disparar', 130);
        botonDisparo.style.position = 'absolute';
        botonDisparo.style.right = '5%';
        botonDisparo.style.bottom = '7%';
        overlay.appendChild(botonDisparo);

        // --- Botones de HABILIDAD, agrupados alrededor del FUEGO, cada uno con
        // el icono de su habilidad. Reemplazan el tocar-los-iconos-del-HUD (que
        // ahora quedan fuera de pantalla durante el juego). El wrapper se ancla
        // al mismo punto que el FUEGO y cada botón se ubica en un arco a su
        // izquierda/arriba.
        const clusterHab = document.createElement('div');
        clusterHab.style.cssText = 'position:absolute; right:5%; bottom:7%; width:130px; height:130px; pointer-events:none;';
        this._botonesHab = [];   // {el, accion} para iluminar/apagar según disponibilidad
        // NOTA: NO hay botón de Acelerar: la aceleración la maneja el joystick por
        // intensidad (cuánto se empuja = cuánto acelera/gasta). Ver _vincular.
        const habilidades = [
            { icon: 'assets/ultiicon1.png',   accion: 'ulti',      dx: -130, dy: -10 },
            { icon: 'assets/cohetes.png',     accion: 'cohetes',   dx:  -98, dy: -88 },
            { icon: 'assets/propulsor.png',   accion: 'propulsor', dx:  -22, dy:-132 },
            { icon: 'assets/deborador.png',   accion: 'devorar',   dx:   60, dy:-118 },
        ];
        for (const h of habilidades) {
            const bh = this._crearBotonIcono(h.icon, h.accion, 60);
            bh.style.position = 'absolute';
            bh.style.left = '50%';
            bh.style.top = '50%';
            bh.style.transform = `translate(calc(-50% + ${h.dx}px), calc(-50% + ${h.dy}px))`;
            bh.style.transition = 'opacity 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease';
            clusterHab.appendChild(bh);
            this._botonesHab.push({ el: bh, accion: h.accion });
        }
        overlay.appendChild(clusterHab);

        this.contenedor.appendChild(overlay);
        this.overlay = overlay;
    }

    /**
     * Crea un botón redondo de HABILIDAD con el icono correspondiente adentro.
     * Igual que `_crearBoton` pero con imagen en vez de texto.
     * @private
     */
    _crearBotonIcono(iconSrc, accion, tam) {
        const b = document.createElement('div');
        b.style.cssText = `
            width: ${tam}px; height: ${tam}px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,68,204,0.14); border: 3px solid rgba(0,68,204,0.6);
            box-shadow: 0 0 8px rgba(0,68,204,0.3);
            pointer-events: auto; touch-action: none;
        `;
        const img = document.createElement('img');
        img.src = iconSrc;
        img.draggable = false;
        img.style.cssText = `width: ${Math.round(tam * 0.62)}px; height: ${Math.round(tam * 0.62)}px; object-fit: contain; pointer-events: none;`;
        b.appendChild(img);
        const presionar = (e) => { e.preventDefault(); this.input.setTactilAccion(accion, true);  b.style.background = 'rgba(0,68,204,0.45)'; };
        const soltar    = (e) => { if (e) e.preventDefault(); this.input.setTactilAccion(accion, false); b.style.background = 'rgba(0,68,204,0.14)'; };
        b.addEventListener('touchstart', presionar, { passive: false });
        b.addEventListener('touchend', soltar, { passive: false });
        b.addEventListener('touchcancel', soltar, { passive: false });
        b.addEventListener('mousedown', presionar);
        b.addEventListener('mouseup', soltar);
        b.addEventListener('mouseleave', soltar);
        this._listeners.push({ el: b, presionar, soltar });
        return b;
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
        const R = 72;              // radio máximo de la perilla (px)
        const DEADZONE = 14;       // zona muerta (px) para no apuntar con toques mínimos
        const ACCEL_INICIO = 28;   // a partir de acá empieza a acelerar (zona muerta de aceleración)

        const centro = () => {
            const r = this.base.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };
        // Ubica la base del joystick centrada en (px,py) y la muestra (flotante).
        const mostrarEn = (px, py) => {
            const o = this.overlay.getBoundingClientRect();
            const half = 85;   // mitad de la base (170px)
            this.base.style.left = (px - o.left - half) + 'px';
            this.base.style.top = (py - o.top - half) + 'px';
            this.base.style.display = 'block';
        };
        const mover = (px, py) => {
            const c = centro();
            let dx = px - c.x, dy = py - c.y;
            const mag = Math.hypot(dx, dy);
            if (mag > R) { dx = dx / mag * R; dy = dy / mag * R; }
            this.perilla.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            // Intensidad de aceleración: 0 hasta ACCEL_INICIO (empuje leve = solo
            // apunta), sube a 1 al empujar hasta el máximo (R). Así, cuánto empujás
            // = cuánto acelerás y cuánto gastás la carga.
            const intensidad = Math.max(0, Math.min(1, (mag - ACCEL_INICIO) / (R - ACCEL_INICIO)));
            if (mag > DEADZONE) {
                this.input.setTactilApuntado(Math.atan2(dy, dx), intensidad);
            } else {
                this.input.setTactilIntensidad(0);   // zona muerta: apunta al último ángulo, sin acelerar
            }
        };
        const soltar = () => {
            this.perilla.style.transform = 'translate(-50%, -50%)';
            this.base.style.display = 'none';   // el joystick flotante desaparece al soltar
            this.input.limpiarTactilApuntado();
        };

        // --- Touch: el joystick aparece donde se toca la zona izquierda ---
        const onStart = (e) => {
            e.preventDefault();
            if (this._jsTouchId !== null) return;
            const t = e.changedTouches[0];
            this._jsTouchId = t.identifier;
            mostrarEn(t.clientX, t.clientY);
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
        this.zonaJoy.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);

        // --- Fallback con mouse (para probar en DevTools con el cursor) ---
        let mouseAbajo = false;
        const mDown = (e) => { mouseAbajo = true; mostrarEn(e.clientX, e.clientY); mover(e.clientX, e.clientY); };
        const mMove = (e) => { if (mouseAbajo) mover(e.clientX, e.clientY); };
        const mUp = () => { if (mouseAbajo) { mouseAbajo = false; soltar(); } };
        this.zonaJoy.addEventListener('mousedown', mDown);
        window.addEventListener('mousemove', mMove);
        window.addEventListener('mouseup', mUp);

        this._winListeners = [
            ['touchmove', onMove], ['touchend', onEnd], ['touchcancel', onEnd],
            ['mousemove', mMove], ['mouseup', mUp],
        ];
    }

    /**
     * Ilumina los botones de habilidad DISPONIBLES y apaga (atenúa) los que están
     * en cooldown o sin carga. Lo llama el game loop cada frame en modo touch.
     * Misma disponibilidad que el HUD: cohetes/propulsor/devorador con cooldown en
     * 0, ulti cuando está cargado (jugador.ultiListo).
     * @param {Game} game
     */
    actualizarDisponibilidad(game) {
        if (!this._botonesHab || !game) return;
        const ge = game.gestorEntrada, j = game.jugador;
        const disp = {
            ulti:      !!(j && j.ultiListo),
            cohetes:   !!(ge && (ge.enfriamientoCohetes  || 0) <= 0),
            propulsor: !!(ge && (ge.enfriamientoPropulsor || 0) <= 0),
            devorar:   !!(ge && (ge.enfriamientoDevorar   || 0) <= 0),
        };
        for (const b of this._botonesHab) {
            const ok = disp[b.accion];
            if (b._ok === ok) continue;   // solo actualizar si cambió
            b._ok = ok;
            b.el.style.opacity = ok ? '1' : '0.33';
            b.el.style.filter = ok ? 'none' : 'grayscale(0.55)';
            b.el.style.boxShadow = ok ? '0 0 12px rgba(120,180,255,0.85)' : '0 0 6px rgba(0,68,204,0.25)';
        }
    }

    /** Muestra el overlay. La decisión de mostrarlo (modo 'touch') la toma el Game. */
    mostrar() {
        if (this.overlay) this.overlay.style.display = 'block';
    }

    /** Oculta el overlay y suelta cualquier acción/apuntado táctil pegado. */
    ocultar() {
        if (this.overlay) this.overlay.style.display = 'none';
        if (this.input) {
            this.input.limpiarTactilApuntado();
            this.input.tactilAcciones.clear();
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
