/**
 * UIManager - Gestor de Interfaz de Usuario
 * 
 * Maneja toda la UI del juego:
 * - Menú principal (JUGAR, TUTORIAL, TOP 5, CRÉDITOS)
 * - HUD del juego (barras, score, oleada)
 * - Posicionamiento responsive (se adapta a cualquier pantalla)
 * 
 * v1.4.5
 */
import { GestorSonido } from '../systems/SoundManager.js';
import { CONFIG } from '../config.js';
import { GestorEntrada } from '../systems/InputManager.js';

export class UIManager {
    /**
     * Constructor del UIManager
     * @param {HTMLElement} container - Contenedor principal del juego
     * @param {Object} callbacks - Funciones de callback para los botones
     */
    constructor(container, callbacks = {}) {
        this.container = container;
        
        // Guardar dimensionesresponsive
        this.actualizarDimensiones();
        
        // Callbacks (funciones de los botones del menu)
        this.onJugar = callbacks.onJugar || (() => {});
        this.onTutorial = callbacks.onTutorial || (() => {});
        this.onTop5 = callbacks.onTop5 || (() => {});
        this.onCreditos = callbacks.onCreditos || (() => {});
        this.onVolver = callbacks.onVolver || (() => {});
        
        // Elementos de UI
        this.mainMenu = null;
        this.uiOverlay = null;

        // Gestor de sonido propio para el click de los botones y la música del
        // MENÚ INICIAL. El menú existe antes de que se cree el juego (que tiene su
        // propio GestorSonido para el audio in-game), por eso el UIManager tiene
        // el suyo: así el menú de arranque puede tener música (el juego aún no
        // existe en ese momento).
        this.gestorSonido = new GestorSonido();
        this.gestorSonido.cargar('click', 'assets/audio/click.mp3', CONFIG.AUDIO.VOLUMENES.click);
        this.gestorSonido.cargar('musicaMenu', 'assets/audio/musica_menu.mp3', CONFIG.AUDIO.VOLUMENES.musicaMenu, 'musica');
        this._musicaMenuLoop = null;
        
        // Crear estructura base
        // NOTA: crearEstructuraBase() ya no se usa - el HUD ahora se renderiza con PixiJS (PixiHUD.js)
        // this.crearEstructuraBase();
        
        // listener para cambio de tamano de pantalla
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Reproduce el sonido de click de los botones del menú.
     * (El primer click del usuario desbloquea el audio del navegador.)
     */
    _click() {
        if (this.gestorSonido) this.gestorSonido.reproducir('click');
    }

    /**
     * Arranca la música del MENÚ INICIAL en bucle (si no está sonando ya).
     *
     * Se llama de dos formas (ver main.js): una vez apenas carga la app y otra
     * en la primera interacción. En la app Android el WebView permite autoplay
     * (MainActivity: setMediaPlaybackRequiresUserGesture(false)) → suena de una.
     * En web el navegador bloquea el autoplay: el primer intento queda "pausado",
     * así que este método se auto-recupera (descarta el intento bloqueado y
     * reintenta) cuando lo vuelve a llamar el primer gesto del usuario.
     */
    iniciarMusicaMenu() {
        if (!this.gestorSonido) return;
        // Ya está sonando de verdad: no duplicar.
        if (this._musicaMenuLoop && !this._musicaMenuLoop.paused) return;
        // Intento anterior bloqueado por autoplay (quedó pausado): descartarlo.
        if (this._musicaMenuLoop) {
            this.gestorSonido.detener(this._musicaMenuLoop);
            this._musicaMenuLoop = null;
        }
        this._musicaMenuLoop = this.gestorSonido.reproducirLoop('musicaMenu');
    }

    /** ¿La música del menú está sonando ahora mismo (no pausada)? */
    musicaMenuSonando() {
        return !!(this._musicaMenuLoop && !this._musicaMenuLoop.paused);
    }

    /** Detiene la música del menú inicial (al entrar al juego). */
    detenerMusicaMenu() {
        if (this._musicaMenuLoop) {
            this.gestorSonido.detener(this._musicaMenuLoop);
            this._musicaMenuLoop = null;
        }
    }

    /**
     * Muestra el modal de OPCIONES con dos controles de volumen (música y
     * efectos). Los sliders ajustan los multiplicadores globales de
     * GestorSonido (0..100%), que se aplican a ambos gestores (juego y menú) y
     * se guardan en localStorage. Mismo estilo que las demás ventanas.
     */
    /**
     * Hace usable un modal (Opciones, Controles, Top 5, Créditos) en pantallas
     * BAJAS (celular apaisado, ~720px de alto): si la ventana es más alta o ancha
     * que la pantalla, se **ACHICA** (escala uniforme) para que entre entera, sin
     * scroll ni recortes. Cuando ya entra (PC, pantallas altas) la escala es 1 →
     * queda idéntica a antes. Se re-calcula ante cambios de tamaño de ventana
     * (el listener se auto-remueve cuando el modal se cierra).
     * @param {HTMLElement} modal    - contenedor a pantalla completa
     * @param {HTMLElement} exterior - el marco (border-image) de la ventana
     */
    _hacerModalResponsive(modal, exterior) {
        if (!modal || !exterior) return;
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.overflow = 'hidden';               // sin scroll: se achica para entrar
        exterior.style.flex = '0 0 auto';
        exterior.style.maxWidth = '96vw';
        exterior.style.transformOrigin = 'center center';

        const ajustar = () => {
            // Si el modal ya se cerró, dejar de escuchar el resize.
            if (!document.body.contains(exterior)) { window.removeEventListener('resize', ajustar); return; }
            exterior.style.transform = 'none';         // medir tamaño natural
            const dispH = modal.clientHeight - 14;     // alto disponible (con margen)
            const dispW = modal.clientWidth - 8;       // ancho disponible
            const h = exterior.offsetHeight, w = exterior.offsetWidth;
            const escala = Math.min(1, dispH / h, dispW / w);
            exterior.style.transform = escala < 1 ? `scale(${escala})` : 'none';
        };
        requestAnimationFrame(ajustar);                // medir tras el layout
        window.addEventListener('resize', ajustar);
    }

    mostrarOpciones() {
        const previo = document.getElementById('opciones-modal');
        if (previo) previo.remove();

        const modal = document.createElement('div');
        modal.id = 'opciones-modal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #0D0D1A;
            display: flex; justify-content: center; align-items: center;
            z-index: 620;
        `;

        const exterior = document.createElement('div');
        exterior.style.cssText = `
            border-style: solid;
            border-width: 36px;
            border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
            box-sizing: border-box;
            width: ${Math.min(560, this.width * 0.9)}px;
            display: flex; justify-content: center; align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex; flex-direction: column; align-items: center;
            width: 100%; padding: 60px 50px;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = 'OPCIONES';
        titulo.style.cssText = `
            color: #0044CC; font-family: 'Segoe Script', cursive;
            font-size: 28px; font-weight: bold; margin-bottom: 30px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);

        // Sliders: Música y Efectos
        container.appendChild(this._crearFilaVolumen(
            'Música',
            GestorSonido.getVolumenMusica(),
            (v) => GestorSonido.setVolumenMusica(v)
        ));
        container.appendChild(this._crearFilaVolumen(
            'Efectos',
            GestorSonido.getVolumenSfx(),
            (v) => GestorSonido.setVolumenSfx(v),
            true // reproduce un click de prueba al soltar
        ));

        // Checkbox: mostrar información adicional (panel de oleada + FPS en el HUD)
        let infoAdicionalInicial = false;
        try { infoAdicionalInicial = localStorage.getItem('infoAdicional') === '1'; } catch (e) {}
        container.appendChild(this._crearFilaCheck(
            'Mostrar información adicional',
            infoAdicionalInicial,
            (activo) => { try { localStorage.setItem('infoAdicional', activo ? '1' : '0'); } catch (e) {} }
        ));

        const nota = document.createElement('div');
        nota.textContent = 'Los cambios se guardan automáticamente.';
        nota.style.cssText = `
            color: #0044CC; font-family: 'Segoe Script', cursive;
            font-size: 14px; opacity: 0.75; margin: 4px 0 26px;
        `;
        container.appendChild(nota);

        // Botón para abrir la pantalla de reasignación de controles.
        const btnControles = document.createElement('div');
        btnControles.textContent = 'CONTROLES';
        btnControles.style.cssText = `
            color: #0044CC; font-family: 'Segoe Script', cursive; font-weight: bold;
            font-size: 20px; cursor: pointer; padding: 8px 26px; margin-bottom: 16px;
            border: 2px solid #0044CC; border-radius: 10px; background: rgba(0,68,204,0.08);
            transition: background 0.2s ease, transform 0.2s ease;
        `;
        btnControles.addEventListener('mouseenter', () => { btnControles.style.background = 'rgba(0,68,204,0.20)'; btnControles.style.transform = 'scale(1.05)'; });
        btnControles.addEventListener('mouseleave', () => { btnControles.style.background = 'rgba(0,68,204,0.08)'; btnControles.style.transform = 'scale(1)'; });
        btnControles.addEventListener('click', () => { this._click(); this.mostrarControles(); });
        container.appendChild(btnControles);

        container.appendChild(this.crearBotonVolver(() => modal.remove()));

        exterior.appendChild(container);
        this._hacerModalResponsive(modal, exterior);
        modal.appendChild(exterior);
        this.container.appendChild(modal);
    }

    /**
     * Pantalla de CONTROLES (reasignación de teclas/botones). Lista cada acción con
     * su binding actual y un botón "Reasignar" que captura la próxima tecla o click.
     * Funciona con o sin partida activa (usa los métodos estáticos de GestorEntrada
     * sobre localStorage). Si hay una partida en curso (window.game), le avisa para
     * que recargue los controles al instante.
     */
    mostrarControles() {
        const previo = document.getElementById('controles-modal');
        if (previo) previo.remove();

        const modal = document.createElement('div');
        modal.id = 'controles-modal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #0D0D1A;
            display: flex; justify-content: center; align-items: center;
            z-index: 640;
        `;

        const exterior = document.createElement('div');
        exterior.style.cssText = `
            border-style: solid; border-width: 36px;
            border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
            box-sizing: border-box;
            width: ${Math.min(600, this.width * 0.92)}px;
            display: flex; justify-content: center; align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex; flex-direction: column; align-items: center;
            width: 100%; padding: 40px 44px; box-sizing: border-box;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = 'CONTROLES';
        titulo.style.cssText = `
            color: #0044CC; font-family: 'Segoe Script', cursive;
            font-size: 28px; font-weight: bold; margin-bottom: 6px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);

        const nota = document.createElement('div');
        nota.textContent = 'El teclado funciona siempre. Clic en una acción para reasignarla.';
        nota.style.cssText = `
            color: #0044CC; font-family: 'Arial', sans-serif; font-size: 13px;
            opacity: 0.75; margin-bottom: 14px; text-align: center; max-width: 440px;
        `;
        container.appendChild(nota);

        // --- Selector de MODO de control (Mouse y teclado / Joystick / Touch) ---
        const filaModo = document.createElement('div');
        filaModo.style.cssText = `
            display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
            gap: 8px; margin-bottom: 16px; color: #0044CC; font-family: 'Segoe Script', cursive; font-weight: bold;
        `;
        const lblModo = document.createElement('span');
        lblModo.textContent = 'Modo:';
        lblModo.style.cssText = 'font-size: 18px; margin-right: 4px;';
        filaModo.appendChild(lblModo);

        const btnsModo = [];
        const pintarModo = () => {
            const actual = GestorEntrada.cargarModoControl();
            for (const b of btnsModo) {
                const sel = b.dataset.modo === actual;
                b.style.background = sel ? 'rgba(0,68,204,0.45)' : 'rgba(0,68,204,0.08)';
                b.style.color = sel ? '#ffffff' : '#0044CC';
            }
        };
        for (const { id, label } of GestorEntrada.MODOS) {
            const b = document.createElement('div');
            b.dataset.modo = id;
            b.textContent = label;
            b.style.cssText = `
                cursor: pointer; padding: 6px 14px; font-size: 16px;
                border: 2px solid #0044CC; border-radius: 8px; transition: background 0.15s ease;
            `;
            b.addEventListener('click', () => {
                this._click();
                // Si cambia de modo durante una reasignacion, cancelamos la captura
                // para evitar que la proxima tecla termine guardada por accidente.
                capturando = null;
                // El modo queda guardado para proximas sesiones.
                GestorEntrada.guardarModoControl(id);
                // Si ya existe una partida, tambien actualizamos el input activo.
                if (window.game && window.game.gestorEntrada) window.game.gestorEntrada.setModoControl(id);
                pintarModo();
                // La lista inferior depende del modo: bindings, referencia o touch.
                render();
            });
            btnsModo.push(b);
            filaModo.appendChild(b);
        }
        pintarModo();
        container.appendChild(filaModo);

        // Área scrolleable con la lista de acciones (por si no entran todas).
        const lista = document.createElement('div');
        lista.style.cssText = `
            display: flex; flex-direction: column; width: 100%; max-width: 440px;
            gap: 8px; padding-right: 4px;
        `;
        container.appendChild(lista);

        // Estado de captura: mientras se espera una tecla/click para reasignar.
        let capturando = null;   // { accion, valor } o null
        let tragarClick = false; // tras capturar un botón del mouse, se traga el 'click' que le sigue

        const nombre = (c) => GestorEntrada.nombreCodigo(c);
        // Preferencia propia de controles tactiles. El modo de control dice
        // "uso touch"; este valor define como se acomoda el overlay tactil.
        const touchLayoutKey = 'touchLayoutJEE';
        const touchLayouts = [
            { id: 'clasico', label: 'Clásico', desc: 'Joystick izquierda, botones derecha.' },
            { id: 'invertido', label: 'Invertido', desc: 'Joystick derecha, botones izquierda.' },
        ];
        // Lee el layout guardado. Si localStorage falla o trae un valor viejo,
        // vuelve a "clasico" para mantener una configuracion segura.
        const cargarTouchLayout = () => {
            try {
                const v = localStorage.getItem(touchLayoutKey);
                if (touchLayouts.some(l => l.id === v)) return v;
            } catch (e) {}
            return 'clasico';
        };
        // Guarda el preset tactil y lo aplica al instante si el overlay ya existe.
        const guardarTouchLayout = (id) => {
            try { localStorage.setItem(touchLayoutKey, id); } catch (e) {}
            if (window.game && window.game.controlesTactiles && window.game.controlesTactiles.aplicarPreferencias) {
                window.game.controlesTactiles.aplicarPreferencias();
            }
        };

        // Crea una fila de lectura simple: titulo a la izquierda y detalle a la
        // derecha. Se reutiliza en Joystick y Touch para no duplicar estilos.
        const crearFilaInfo = (titulo, detalle, extra = '') => {
            const fila = document.createElement('div');
            fila.style.cssText = `
                display: flex; align-items: center; justify-content: space-between;
                gap: 12px; padding: 7px 12px; border: 2px solid #0044CC; border-radius: 8px;
                background: rgba(0,68,204,0.06); color: #0044CC;
                font-family: 'Segoe Script', cursive; font-weight: bold; font-size: 18px;
            `;
            const lbl = document.createElement('span');
            lbl.textContent = titulo;
            const valor = document.createElement('span');
            valor.style.cssText = `font-family: 'Arial', sans-serif; font-size: 14px; text-align: right; min-width: 150px;`;
            valor.textContent = detalle;
            fila.appendChild(lbl);
            fila.appendChild(valor);
            if (extra) fila.title = extra;
            return fila;
        };

        // Redibuja la lista según los controles guardados.
        // Modo Mouse y teclado:
        // muestra los bindings configurables y permite reasignar cada accion con
        // la proxima tecla o boton del mouse que presione el jugador.
        const renderMouseTeclado = () => {
            const controles = GestorEntrada.cargarControlesConfig();
            lista.innerHTML = '';
            for (const [accion, cfg] of Object.entries(controles)) {
                const fila = document.createElement('div');
                fila.style.cssText = `
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 12px; padding: 7px 12px; border: 2px solid #0044CC; border-radius: 8px;
                    background: rgba(0,68,204,0.06); cursor: pointer;
                    color: #0044CC; font-family: 'Segoe Script', cursive; font-weight: bold; font-size: 18px;
                `;
                const lbl = document.createElement('span');
                lbl.textContent = cfg.label || accion;

                const valor = document.createElement('span');
                valor.style.cssText = `font-family: 'Arial', sans-serif; font-size: 14px; text-align: right; min-width: 130px;`;
                valor.textContent = (cfg.teclas || []).map(nombre).join('  ·  ') || '—';

                fila.appendChild(lbl);
                fila.appendChild(valor);

                // Al clickear la fila, entra en modo captura para esa acción.
                fila.addEventListener('click', () => {
                    if (capturando) return;
                    this._click();
                    capturando = { accion, valor };
                    valor.textContent = 'Presioná una tecla o click…';
                    fila.style.background = 'rgba(0,68,204,0.22)';
                });
                lista.appendChild(fila);
            }
        };
        let btnRestaurar = null;

        // Modo Joystick:
        // por ahora es una referencia fija del mapeo estandar tipo Xbox. No se
        // reasigna desde aca porque el gamepad se lee por indices de botones.
        const renderJoystick = () => {
            const filas = [
                ['Apuntar', 'Stick izq / der', 'El stick izquierdo apunta; el derecho sirve de respaldo.'],
                ['Acelerar', 'RT / A', 'Gatillo derecho o boton A.'],
                ['Disparar', 'LT / X', 'Gatillo izquierdo o boton X.'],
                ['Ulti', 'B', 'Usa la carga especial cuando esta lista.'],
                ['Devorador', 'LB', 'Atrae particulas Boid cercanas.'],
                ['Cohetes', 'RB', 'Lanza cohetes teledirigidos.'],
                ['Propulsor', 'Y', 'Dash hacia la direccion de la nave.'],
            ];
            for (const [titulo, detalle, extra] of filas) lista.appendChild(crearFilaInfo(titulo, detalle, extra));
        };

        // Modo Touch:
        // muestra presets rapidos de distribucion. Elegir uno lo guarda y mueve
        // los controles tactiles reales si ya hay una partida abierta.
        const renderTouch = () => {
            const actual = cargarTouchLayout();
            for (const layout of touchLayouts) {
                const fila = crearFilaInfo(layout.label, layout.desc);
                fila.style.cursor = 'pointer';
                fila.style.background = layout.id === actual ? 'rgba(0,68,204,0.28)' : 'rgba(0,68,204,0.06)';
                fila.addEventListener('click', () => {
                    this._click();
                    guardarTouchLayout(layout.id);
                    render();
                });
                lista.appendChild(fila);
            }
        };

        // Render central de esta pantalla. Decide que contenido mostrar abajo
        // segun el modo seleccionado y ajusta el boton inferior para ese contexto.
        const render = () => {
            lista.innerHTML = '';
            const modo = GestorEntrada.cargarModoControl();
            nota.textContent = modo === 'mouseTeclado'
                ? 'El teclado funciona siempre. Clic en una accion para reasignarla.'
                : modo === 'joystick'
                    ? 'Referencia del joystick. El mapeo es fijo por ahora.'
                    : 'Elegi el layout tactil. El teclado sigue funcionando como respaldo.';

            if (modo === 'mouseTeclado') renderMouseTeclado();
            else if (modo === 'joystick') renderJoystick();
            else renderTouch();

            if (btnRestaurar) {
                btnRestaurar.style.display = modo === 'joystick' ? 'none' : 'block';
                btnRestaurar.textContent = modo === 'touch' ? 'Restaurar touch' : 'Restaurar por defecto';
            }
        };

        // Captura de la próxima tecla o botón del mouse para la acción elegida.
        const onKey = (e) => {
            if (!capturando) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.code === 'Escape') { capturando = null; render(); return; }  // Escape = cancelar
            GestorEntrada.reasignarEn(GestorEntrada.cargarControlesConfig(), capturando.accion, e.code);
            const acc = capturando.accion; capturando = null;
            if (window.game && window.game.gestorEntrada) window.game.gestorEntrada.recargarControles();
            render();
        };
        const onMouse = (e) => {
            if (!capturando) return;
            e.preventDefault();
            e.stopPropagation();
            const codigo = e.button === 0 ? 'MouseLeft' : e.button === 1 ? 'MouseMiddle' : e.button === 2 ? 'MouseRight' : null;
            if (!codigo) return;
            GestorEntrada.reasignarEn(GestorEntrada.cargarControlesConfig(), capturando.accion, codigo);
            capturando = null;
            tragarClick = true;   // el 'click' que sigue a este mousedown no debe reabrir captura
            if (window.game && window.game.gestorEntrada) window.game.gestorEntrada.recargarControles();
            render();
        };
        // Traga el 'click' inmediatamente posterior a capturar un botón del mouse
        // (si no, tras redibujar la lista podría caer sobre una fila y reabrir captura).
        const onClick = (e) => {
            if (tragarClick) { e.preventDefault(); e.stopPropagation(); tragarClick = false; }
        };
        // `capture:true` para interceptar antes que el juego; se limpian al cerrar.
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('mousedown', onMouse, true);
        window.addEventListener('click', onClick, true);
        modal.addEventListener('contextmenu', (e) => e.preventDefault());

        const cerrar = () => {
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('mousedown', onMouse, true);
            window.removeEventListener('click', onClick, true);
            modal.remove();
        };

        // Botones inferiores: Restaurar por defecto + Volver.
        const botones = document.createElement('div');
        botones.style.cssText = `display: flex; gap: 14px; align-items: center; margin-top: 20px; flex-wrap: wrap; justify-content: center;`;

        btnRestaurar = document.createElement('div');
        btnRestaurar.textContent = 'Restaurar por defecto';
        btnRestaurar.style.cssText = `
            color: #0044CC; font-family: 'Segoe Script', cursive; font-weight: bold; font-size: 17px;
            cursor: pointer; padding: 7px 18px; border: 2px solid #0044CC; border-radius: 8px;
            background: rgba(0,68,204,0.08); transition: background 0.2s ease;
        `;
        btnRestaurar.addEventListener('mouseenter', () => { btnRestaurar.style.background = 'rgba(0,68,204,0.20)'; });
        btnRestaurar.addEventListener('mouseleave', () => { btnRestaurar.style.background = 'rgba(0,68,204,0.08)'; });
        btnRestaurar.addEventListener('click', () => {
            this._click();
            capturando = null;
            if (GestorEntrada.cargarModoControl() === 'touch') {
                guardarTouchLayout('clasico');
            } else {
                GestorEntrada.restaurarControlesConfig();
                if (window.game && window.game.gestorEntrada) window.game.gestorEntrada.recargarControles();
            }
            render();
        });
        botones.appendChild(btnRestaurar);

        botones.appendChild(this.crearBotonVolver(cerrar));
        container.appendChild(botones);

        render();

        exterior.appendChild(container);
        this._hacerModalResponsive(modal, exterior);
        modal.appendChild(exterior);
        this.container.appendChild(modal);
    }

    /**
     * Crea una fila de control de volumen: etiqueta + porcentaje + slider.
     * @param {string} etiqueta     - Nombre visible (ej: 'Música')
     * @param {number} valorInicial - Valor actual 0..1
     * @param {Function} onCambio   - Callback con el nuevo valor 0..1
     * @param {boolean} feedbackSfx - Si true, reproduce un click al soltar (para oír el nivel)
     * @returns {HTMLElement}
     */
    _crearFilaVolumen(etiqueta, valorInicial, onCambio, feedbackSfx = false) {
        const fila = document.createElement('div');
        fila.style.cssText = `display: flex; flex-direction: column; width: 100%; max-width: 360px; margin-bottom: 22px;`;

        const cabecera = document.createElement('div');
        cabecera.style.cssText = `
            display: flex; justify-content: space-between; align-items: baseline;
            color: #0044CC; font-family: 'Segoe Script', cursive; font-weight: bold;
            font-size: 20px; margin-bottom: 6px;
        `;
        const lbl = document.createElement('span');
        lbl.textContent = etiqueta;
        const val = document.createElement('span');
        val.textContent = Math.round(valorInicial * 100) + '%';
        val.style.cssText = `font-size: 18px;`;
        cabecera.appendChild(lbl);
        cabecera.appendChild(val);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.step = '1';
        slider.value = String(Math.round(valorInicial * 100));
        slider.style.cssText = `width: 100%; cursor: pointer; accent-color: #0044CC;`;

        slider.addEventListener('input', () => {
            const pct = parseInt(slider.value, 10);
            val.textContent = pct + '%';
            onCambio(pct / 100);
        });
        if (feedbackSfx) {
            // Al soltar, un click de prueba para escuchar el nivel de efectos
            slider.addEventListener('change', () => this._click());
        }

        fila.appendChild(cabecera);
        fila.appendChild(slider);
        return fila;
    }

    /**
     * Crea una fila con un checkbox: etiqueta + casilla. Mismo estilo tinta azul
     * que los controles de volumen. Al hacer click en toda la fila alterna.
     * @param {string} etiqueta     - Texto visible
     * @param {boolean} valorInicial - Estado inicial del checkbox
     * @param {Function} onCambio    - Callback con el nuevo estado (boolean)
     * @returns {HTMLElement}
     */
    _crearFilaCheck(etiqueta, valorInicial, onCambio) {
        const fila = document.createElement('div');
        fila.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            width: 100%; max-width: 360px; margin-bottom: 22px; cursor: pointer;
            color: #0044CC; font-family: 'Segoe Script', cursive; font-weight: bold;
            font-size: 20px;
        `;

        const lbl = document.createElement('span');
        lbl.textContent = etiqueta;

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = !!valorInicial;
        check.style.cssText = `width: 22px; height: 22px; cursor: pointer; accent-color: #0044CC; flex: 0 0 auto;`;

        check.addEventListener('change', () => { this._click(); onCambio(check.checked); });
        // Click en cualquier parte de la fila alterna la casilla
        fila.addEventListener('click', (e) => {
            if (e.target !== check) {
                check.checked = !check.checked;
                check.dispatchEvent(new Event('change'));
            }
        });

        fila.appendChild(lbl);
        fila.appendChild(check);
        return fila;
    }

    /**
     * Actualiza las dimensiones de la pantalla
     * Se llama en constructor y en evento resize
     */
    actualizarDimensiones() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
    
    /**
     * Crea la estructura base de UI en el DOM
     * NOTA: Los estilos CSS del HUD ya no se usan - el HUD ahora se renderiza con PixiJS
     * (ver src/game/ui/PixiHUD.js)
     */
    crearEstructuraBase() {
        // NOTA: Estilos CSS del HUD eliminados - migrados a PixiJS

        // UI Overlay (capa de UI sobre el juego) - ESTE SE MANTIENE
        this.uiOverlay = document.createElement('div');
        this.uiOverlay.id = 'ui-overlay';
        this.uiOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        this.container.appendChild(this.uiOverlay);
        
        // Versión (esquina inferior derecha)
        const versionDisplay = document.createElement('div');
        versionDisplay.id = 'version-display';
        versionDisplay.textContent = `v${CONFIG.APP.VERSION}`;
        versionDisplay.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 15px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: white;
            opacity: 0.7;
            z-index: 200;
        `;
        this.container.appendChild(versionDisplay);
    }
    
    /**
     * Muestra el menú principal
     */
    mostrarMenuPrincipal() {
        // Crear contenedor del menú
        this.mainMenu = document.createElement('div');
        this.mainMenu.id = 'main-menu';
        this.mainMenu.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('assets/jugando en el espacio.png') no-repeat center 24%;
            background-size: cover;
            z-index: 500;
        `;

        // Botones 20% más chicos que su tamaño natural (320px -> 256px)
        const anchoBoton = 256;
        // En celular (dispositivo táctil) los botones van un 15% más chicos que en
        // PC. Se ata a la detección táctil (no a la altura) porque el celular puede
        // tener el mismo alto que el desktop (ej. G04 = 720px). PC no cambia.
        const esTactilMenu = (navigator.maxTouchPoints || 0) > 0 || ('ontouchstart' in window);
        const factorCel = esTactilMenu ? 0.85 : 1;
        const anchoBotonPx = Math.round(anchoBoton * factorCel);
        const anchoBotonVh = Math.round(46 * factorCel);

        // --- Botones en columna a la derecha, JUGAR arriba de todos, más juntos ---
        const colDerecha = document.createElement('div');
        colDerecha.style.cssText = `
            position: absolute;
            right: 1.5%;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.4vh;
        `;
        const items = [
            ['JUGAR', () => this.onJugar(), 'assets/botonJuegar.png'],
            ['TUTORIAL', () => this.onTutorial(), 'assets/botonTutorial.png'],
            ['TOP 5', () => this.onTop5(), 'assets/botonTOP5.png'],
            ['OPCIONES', () => this.mostrarOpciones(), 'assets/botonOpciones.png'],
            ['CRÉDITOS', () => this.onCreditos(), 'assets/botonCreditos.png'],
        ];
        for (const [txt, acc, img] of items) {
            const b = this.crearBotonMenu(txt, acc, img);
            // Ancho fijo en desktop, pero en pantallas bajas (celular apaisado) se
            // achica segun la altura para que ENTREN los 5 botones sin cortarse.
            // En celular, además, un 15% más chico (factorCel).
            b.style.width = `min(${anchoBotonPx}px, ${anchoBotonVh}vh)`;
            colDerecha.appendChild(b);
        }
        this.mainMenu.appendChild(colDerecha);

        this.container.appendChild(this.mainMenu);

        // Decoración: nave aliada paseando + naves enemigas siguiéndola
        this._animarNavesMenu();
    }

    /**
     * Oculta el menú principal con animación
     */
    ocultarMenuPrincipal(callback) {
        if (this.mainMenu) {
            this.mainMenu.style.transition = 'opacity 0.5s ease';
            this.mainMenu.style.opacity = '0';
            setTimeout(() => {
                this.mainMenu.remove();
                this.mainMenu = null;
                // Detener la animación de las naves del menú
                if (this._menuShipsRaf) { cancelAnimationFrame(this._menuShipsRaf); this._menuShipsRaf = null; }
                if (callback) callback();
            }, 500);
        } else if (callback) {
            callback();
        }
    }

    /**
     * Decoración del menú principal: crea una nave aliada que "pasea" por la
     * pantalla (rebotando suave en los bordes) y varias naves enemigas que la
     * persiguen. Viven en una capa detrás de los botones (no bloquea clicks) y
     * se limpian solas al ocultarse el menú (al darle JUGAR).
     * @private
     */
    _animarNavesMenu() {
        if (!this.mainMenu) return;
        if (this._menuShipsRaf) cancelAnimationFrame(this._menuShipsRaf);

        // Capa detrás de los botones; no intercepta clicks
        const capa = document.createElement('div');
        capa.style.cssText = 'position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0;';
        this.mainMenu.insertBefore(capa, this.mainMenu.firstChild);

        const crearNave = (src, size) => {
            const el = document.createElement('img');
            el.src = src;
            el.style.cssText = `position:absolute; left:0; top:0; width:${size}px; height:auto; will-change:transform; filter: drop-shadow(0 0 10px rgba(140,190,255,0.85)) drop-shadow(0 0 3px rgba(0,0,0,0.6));`;
            capa.appendChild(el);
            return el;
        };

        const W = () => window.innerWidth;
        const H = () => window.innerHeight;
        const margin = 80;

        // El arte de las naves apunta a la DERECHA → la rotación es el rumbo (sin offset).
        const colocar = (n) => {
            n.el.style.transform = `translate(${n.x}px, ${n.y}px) translate(-50%, -50%) rotate(${n.ang}rad)`;
        };
        const normAng = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
        const girarHacia = (actual, objetivo, maxPaso) => {
            const d = normAng(objetivo - actual);
            return (Math.abs(d) <= maxPaso) ? objetivo : actual + Math.sign(d) * maxPaso;
        };

        // Borde izquierdo de la columna de botones: las naves no entran ahí.
        const botones = [...this.mainMenu.querySelectorAll('img')].filter(i => (i.src || '').includes('boton'));
        let zonaBotonesLeft = W() * 0.72;
        if (botones.length) {
            const lefts = botones.map(b => b.getBoundingClientRect().left).filter(x => x > 1);
            if (lefts.length) zonaBotonesLeft = Math.min(...lefts);
        }
        const areaDer = zonaBotonesLeft - 40;

        // Todas las naves PASEAN de forma independiente (cada una su rumbo y
        // velocidad → recorridos distintos) y se ESQUIVAN entre sí (giran para
        // evitarse ANTES de tocarse), así no se chocan. La aliada usa Nave322 y
        // las 3 enemigas enimigo1 (ambas apuntan a la derecha).
        const naves = [];
        const nuevaNave = (src, size, vel) => {
            naves.push({
                el: crearNave(src, size), vel, ang: Math.random() * Math.PI * 2,
                x: 60 + Math.random() * Math.max(60, areaDer - 120),
                y: 60 + Math.random() * Math.max(60, H() - 120)
            });
        };
        nuevaNave('assets/Nave322.png', 72, 92);   // aliada
        nuevaNave('assets/enimigo1.png', 68, 84);  // enemigas (velocidades distintas)
        nuevaNave('assets/enimigo1.png', 68, 100);
        nuevaNave('assets/enimigo1.png', 68, 74);
        naves.forEach(colocar);

        const AVOID_R = 95;   // radio a partir del cual una nave esquiva a otra
        let last = performance.now();

        const loop = (now) => {
            if (!capa.isConnected) { this._menuShipsRaf = null; return; } // el menú se fue
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const h = H();
            const limDer = zonaBotonesLeft - 40;
            const cx = limDer / 2, cy = h / 2;

            for (const n of naves) {
                // 1) Esquiva: si hay otra nave cerca, girar hacia el lado opuesto.
                let ax = 0, ay = 0;
                for (const o of naves) {
                    if (o === n) continue;
                    const dx = n.x - o.x, dy = n.y - o.y;
                    const d = Math.hypot(dx, dy);
                    if (d < AVOID_R && d > 0.001) { ax += (dx / d) * (AVOID_R - d); ay += (dy / d) * (AVOID_R - d); }
                }
                if (ax !== 0 || ay !== 0) {
                    n.ang = girarHacia(n.ang, Math.atan2(ay, ax), dt * 4);              // esquivar
                } else if (n.x < margin || n.x > limDer - margin || n.y < margin || n.y > h - margin) {
                    n.ang = girarHacia(n.ang, Math.atan2(cy - n.y, cx - n.x), dt * 2.5); // volver al centro
                } else {
                    n.ang += (Math.random() - 0.5) * dt * 1.6;                          // paseo (deriva suave)
                }
                n.x += Math.cos(n.ang) * n.vel * dt;
                n.y += Math.sin(n.ang) * n.vel * dt;
                n.x = Math.max(25, Math.min(limDer, n.x));
                n.y = Math.max(25, Math.min(h - 25, n.y));
                colocar(n);
            }

            this._menuShipsRaf = requestAnimationFrame(loop);
        };
        this._menuShipsRaf = requestAnimationFrame(loop);
    }
    
    /**
     * Crea un botón del menú con imagen
     * @param {string} texto - Texto del botón (fallback si no hay imagen)
     * @param {Function} accion - Función al hacer click
     * @param {string} [imagenSrc] - Ruta de la imagen del botón
     * @returns {HTMLElement}
     */
    crearBotonMenu(texto, accion, imagenSrc) {
        let boton;
        if (imagenSrc) {
            boton = document.createElement('img');
            boton.src = imagenSrc;
            boton.alt = texto;
            boton.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
            `;
        } else {
            boton = document.createElement('button');
            boton.textContent = texto;
            boton.style.cssText = `
                width: 200px;
                padding: 15px 30px;
                font-size: 22px;
                font-family: 'Segoe Script', cursive;
                font-weight: bold;
                color: white;
                background: linear-gradient(180deg, #0066FF 0%, #0044CC 100%);
                border: 3px solid white;
                border-radius: 15px;
                cursor: pointer;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                box-shadow: 0 4px 15px rgba(0, 68, 204, 0.5);
                transition: all 0.3s ease;
            `;
        }
        
        boton.addEventListener('mouseenter', () => {
            boton.style.transform = 'scale(1.1)';
            boton.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
        });
        
        boton.addEventListener('mouseleave', () => {
            boton.style.transform = 'scale(1)';
            boton.style.filter = 'none';
        });
        
        boton.addEventListener('click', () => { this._click(); accion(); });
        return boton;
    }
    
    /**
     * Crea botón VOLVER reutilizable con imagen
     * @param {Function} onClick - Función al hacer click
     * @returns {HTMLElement}
     */
    crearBotonVolver(onClick) {
        const boton = document.createElement('img');
        boton.src = 'assets/botonVolver.png';
        boton.alt = 'VOLVER';
        boton.style.cssText = `
            cursor: pointer;
            transition: all 0.3s ease;
            display: block;
            width: 180px;   /* natural 320px → −25% (240) → −25% otra vez (180) */
            height: auto;
        `;
        
        boton.addEventListener('mouseenter', () => {
            boton.style.transform = 'scale(1.1)';
            boton.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
        });
        
        boton.addEventListener('mouseleave', () => {
            boton.style.transform = 'scale(1)';
            boton.style.filter = 'none';
        });
        
        boton.addEventListener('click', () => { this._click(); onClick(); });
        return boton;
    }

    /**
     * Crea un botón para los modales de confirmación con imagen.
     * @param {string} texto - Texto del botón (fallback)
     * @param {Function} onClick - Acción al hacer click
     * @param {string} [imagenSrc] - Ruta de la imagen del botón
     * @returns {HTMLElement}
     */
    _crearBotonConfirm(texto, onClick, imagenSrc) {
        let boton;
        if (imagenSrc) {
            boton = document.createElement('img');
            boton.src = imagenSrc;
            boton.alt = texto;
            boton.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
            `;
        } else {
            boton = document.createElement('button');
            boton.textContent = texto;
            boton.style.cssText = `
                padding: 12px 26px;
                font-size: 18px;
                font-family: 'Segoe Script', cursive;
                font-weight: bold;
                color: white;
                background: #0044CC;
                border: 2px solid white;
                border-radius: 10px;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
                transition: all 0.3s ease;
            `;
        }
        boton.addEventListener('mouseenter', () => {
            boton.style.transform = 'scale(1.1)';
            boton.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
        });
        boton.addEventListener('mouseleave', () => {
            boton.style.transform = 'scale(1)';
            boton.style.filter = 'none';
        });
        boton.addEventListener('click', () => { this._click(); onClick(); });
        return boton;
    }

    /**
     * Muestra un modal de confirmación para volver al menú principal.
     * Se invoca al presionar Escape durante la partida. Usa el mismo estilo que
     * las demás ventanas (Créditos / Top 5): caja con fondo gameOver.png, texto
     * en tinta azul y tipografía Segoe Script.
     *
     * Se cuelga de `this.container` (NO de `this.mainMenu`, que es null mientras
     * se está jugando). El llamador es responsable de remover el modal devuelto.
     *
     * @param {Function} onConfirmar - Se llama si el usuario elige volver al menú
     * @param {Function} onCancelar - Se llama si el usuario elige seguir jugando
     * @returns {HTMLElement} El nodo del modal (para poder cerrarlo desde afuera)
     */
    mostrarConfirmacionSalir(onConfirmar, onCancelar) {
        // Evitar duplicados si quedó uno abierto
        const previo = document.getElementById('confirmar-salir');
        if (previo) previo.remove();

        const modal = document.createElement('div');
        modal.id = 'confirmar-salir';
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(13, 13, 26, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 700;
        `;

        const exterior = document.createElement('div');
        exterior.style.cssText = `
            border-style: solid;
            border-width: 36px;
            border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
            box-sizing: border-box;
            width: ${Math.min(560, this.width * 0.9)}px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 60px 50px;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = '¿VOLVER AL MENÚ?';
        titulo.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 18px;
            text-shadow: 0 0 10px #0044CC;
            text-align: center;
        `;

        const texto = document.createElement('div');
        texto.textContent = 'Vas a perder el progreso de esta partida.';
        texto.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 17px;
            text-align: center;
            margin-bottom: 28px;
        `;

        const fila = document.createElement('div');
        fila.style.cssText = `
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            justify-content: center;
        `;

        // Seguir jugando (cancelar) y volver al menú con imágenes
        const btnSeguir = this._crearBotonConfirm('SEGUIR JUGANDO', () => {
            if (onCancelar) onCancelar();
        }, 'assets/botonSeguirJugando.png');
        const btnVolver = this._crearBotonConfirm('VOLVER AL MENÚ', () => {
            if (onConfirmar) onConfirmar();
        }, 'assets/botonVolverAlMenu.png');

        // Los PNG de estos botones son grandes (490×120 / 450×120) y se salían del
        // marco. Los achicamos por alto (width auto) para que entren dentro.
        for (const b of [btnSeguir, btnVolver]) { b.style.height = '44px'; b.style.width = 'auto'; }

        fila.appendChild(btnSeguir);
        fila.appendChild(btnVolver);

        container.appendChild(titulo);
        container.appendChild(texto);
        container.appendChild(fila);
        exterior.appendChild(container);
        modal.appendChild(exterior);
        this.container.appendChild(modal);

        return modal;
    }

    /**
     * Muestra pantalla de carga
     * @param {Function} callback - Función a ejecutar después
     */
    mostrarPantallaCarga(callback, onProgress) {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #0D0D1A;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const shipContainer = document.createElement('div');
        shipContainer.id = 'loading-ship';
        shipContainer.innerHTML = '<img src="assets/Nave322.png" alt="Nave">';
        shipContainer.style.cssText = `
            width: 80px;
            height: 80px;
            animation: spin 1s linear infinite;
        `;
        
        const loadingText = document.createElement('div');
        loadingText.textContent = 'CARGANDO...';
        loadingText.id = 'loading-text';
        loadingText.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 24px;
            margin-top: 20px;
            text-shadow: 0 0 10px #0044CC;
        `;
        
        // Barra de progreso
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = `
            width: 200px;
            height: 20px;
            border: 3px solid #0044CC;
            border-radius: 10px;
            margin-top: 15px;
            overflow: hidden;
            box-shadow: 0 0 10px #0044CC;
        `;
        
        const progressBarFill = document.createElement('div');
        progressBarFill.id = 'loading-progress-fill';
        progressBarFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #0044CC, #0088FF);
            transition: width 0.2s ease;
        `;
        
        const progressPercent = document.createElement('div');
        progressPercent.id = 'loading-progress-percent';
        progressPercent.textContent = '0%';
        progressPercent.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 16px;
            margin-top: 5px;
        `;
        
        // CSS para animación
        if (!document.getElementById('loading-style')) {
            const style = document.createElement('style');
            style.id = 'loading-style';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                #loading-ship img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transform-origin: center center;
                }
                .loading-spin {
                    animation: spin 1s linear infinite;
                    transform-origin: center center;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Agregar barra al contenedor
        progressBarContainer.appendChild(progressBarFill);
        loadingScreen.appendChild(shipContainer);
        loadingScreen.appendChild(loadingText);
        loadingScreen.appendChild(progressBarContainer);
        loadingScreen.appendChild(progressPercent);
        this.container.appendChild(loadingScreen);
        
        // Función para actualizar progreso
        const updateProgress = (percent, texto) => {
            progressBarFill.style.width = percent + '%';
            progressPercent.textContent = Math.round(percent) + '%';
            if (texto) {
                loadingText.textContent = texto;
            }
        };
        
        setTimeout(async () => {
            try {
                // Si hay callback de progreso, pasarlo
                if (onProgress) {
                    onProgress(updateProgress);
                } else {
                    // Simular progreso si no hay callback
                    updateProgress(10, 'CARGANDO...');
                }
                
                await callback(updateProgress);
                updateProgress(100, 'LISTO!');
                const juego = (typeof window !== 'undefined') ? window.game : null;
                // NO congelamos el juego: dejamos que corra estos 2 s DETRÁS de la
                // pantalla de carga para que la cámara, el HUD y el escudo se
                // acomoden. Así el primer frame visible ya está en su lugar (inicio
                // nítido, sin cosas "fuera de lugar" durante el primer segundo).
                await new Promise((resolve) => setTimeout(resolve, 2000));
                // Barrer lo que haya spawneado en esos 2 s → arranque acomodado Y
                // limpio (mantiene nave, HUD, boids y estado de cámara).
                if (juego && typeof juego.prepararInicioLimpio === 'function') {
                    juego.prepararInicioLimpio();
                }
                loadingScreen.style.transition = 'opacity 0.5s ease';
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            } catch (error) {
                loadingScreen.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error: ${error.message}</p>`;
            }
        }, 100);
    }
    
    /**
     * Muestra modal de Tutorial con navegación paso a paso
     */
    mostrarTutorial() {
        const modal = document.createElement('div');
        modal.id = 'tutorial-modal';
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0D0D1A;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 600;
        `;

        // En celular apaisado hay muy poca altura: compactamos borde, texto,
        // espacios e imagenes para que el tutorial sea legible sin tapar botones.
        const esCompacto = this.height <= 430 || this.width <= 850;
        const marcoBorde = esCompacto ? 24 : 36;
        const paddingMarco = esCompacto ? '14px 18px' : '60px 55px';
        const anchoMarco = Math.min(esCompacto ? 760 : 750, this.width * (esCompacto ? 0.96 : 0.9));
        const altoMarco = Math.min(esCompacto ? 340 : 700, this.height * (esCompacto ? 0.94 : 0.9));
        const tituloSize = esCompacto ? 21 : 30;
        const cuerpoSize = esCompacto ? 13 : 17;
        const cuerpoGrandeSize = esCompacto ? 14 : 18;
        const notaSize = esCompacto ? 12 : 15;
        const iconoGrande = esCompacto ? 46 : 68;
        const iconoBoid = esCompacto ? 52 : 76;
        const anchoBoton = esCompacto ? 112 : 150;
        const margenTitulo = esCompacto ? 8 : 16;
        const justificarContenido = esCompacto ? 'flex-start' : 'center';

        // Estilos y filas reutilizables (con los iconos reales de las habilidades)
        const KEY = `display:inline-block;min-width:${esCompacto ? 24 : 30}px;text-align:center;padding:${esCompacto ? '2px 6px' : '3px 9px'};border:2px solid #0044CC;border-radius:6px;font-weight:bold;font-family:Arial,sans-serif;background:rgba(0,68,204,0.10);`;
        const ICON = `width:${esCompacto ? 18 : 24}px;height:${esCompacto ? 18 : 24}px;object-fit:contain;vertical-align:middle;margin-right:${esCompacto ? 5 : 7}px;`;

        // La pagina de controles usa el modo elegido en Opciones. Para mouse y
        // teclado tambien lee las asignaciones guardadas, asi el tutorial refleja
        // cualquier tecla que el jugador haya personalizado.
        const modoControl = GestorEntrada.cargarModoControl();
        const nombreModoControl = GestorEntrada.MODOS.find(m => m.id === modoControl)?.label || 'Mouse y teclado';
        const iconosAccion = {
            ulti: 'assets/ultiicon1.png',
            devorar: 'assets/deborador.png',
            cohetes: 'assets/cohetes.png',
            propulsor: 'assets/propulsor.png',
        };

        const controlesMouseTeclado = () => {
            const controles = GestorEntrada.cargarControlesConfig();
            const filas = [['MOUSE', null, 'Apuntar la nave hacia el cursor']];
            for (const [accion, cfg] of Object.entries(controles)) {
                const teclas = (cfg.teclas || []).map(GestorEntrada.nombreCodigo).join(' / ') || 'SIN ASIGNAR';
                filas.push([teclas, iconosAccion[accion] || null, cfg.label || accion]);
            }
            filas.push(['ESC', null, 'Volver al menú']);
            return filas;
        };

        const controlesJoystick = [
            ['STICK', null, 'Apuntar la nave (izquierdo o derecho)'],
            ['RT / A', null, 'Acelerar'],
            ['LT / X', null, 'Disparar'],
            ['B', 'assets/ultiicon1.png', 'Ulti'],
            ['LB', 'assets/deborador.png', 'Devorador'],
            ['RB', 'assets/cohetes.png', 'Cohetes teledirigidos'],
            ['Y', 'assets/propulsor.png', 'Propulsor'],
        ];

        let touchLayout = 'clasico';
        try { touchLayout = localStorage.getItem('touchLayoutJEE') || 'clasico'; } catch (e) {}
        const controlesTouch = [
            ['LAYOUT', null, touchLayout === 'invertido' ? 'Invertido: joystick derecha' : 'Clásico: joystick izquierda'],
            ['JOYSTICK', null, 'Apuntar y acelerar según la intensidad'],
            ['FUEGO', null, 'Disparar'],
            ['BOTÓN', 'assets/ultiicon1.png', 'Ulti'],
            ['BOTÓN', 'assets/deborador.png', 'Devorador'],
            ['BOTÓN', 'assets/cohetes.png', 'Cohetes teledirigidos'],
            ['BOTÓN', 'assets/propulsor.png', 'Propulsor'],
            ['MEJORAS', 'assets/upgreate.png', 'Abrir la ventana de mejoras'],
        ];

        const controlesDelModo = modoControl === 'joystick'
            ? controlesJoystick
            : modoControl === 'touch'
                ? controlesTouch
                : controlesMouseTeclado();

        // Filas de controles: [tecla o boton] + (icono opcional) + descripcion.
        const filasControles = controlesDelModo.map(([k, ic, d]) =>
            `<span style="${KEY}">${k}</span>` +
            `<span style="text-align:left;">${ic ? `<img src="${ic}" style="${ICON}">` : ''}${d}</span>`
        ).join('');

        // Filas de mejoras: [icono] nombre - efecto (las 8 habilidades)
        const filasMejoras = [
            ['assets/proyectil1.png', 'Daño', '+ daño por disparo'],
            ['assets/escudo1.png', 'Escudo', '+50 HP máx c/u'],
            ['assets/ultiicon1.png', 'Ulti', '− coste de carga'],
            ['assets/tiempo fuera.png', 'Tiempo Fuera', '+ regeneración'],
            ['assets/aceleracion.png', 'Aceleración', '+ tiempo de acel.'],
            ['assets/propulsor.png', 'Propulsor', '− cooldown (−2s c/u)'],
            ['assets/deborador.png', 'Devorador', '+ rango/velocidad'],
            ['assets/cohetes.png', 'Cohetes', '+1 cohete c/u'],
        ].map(([ic, n, e]) =>
            `<div style="display:flex;align-items:center;gap:${esCompacto ? 6 : 8}px;text-align:left;">` +
            `<img src="${ic}" style="width:${esCompacto ? 22 : 28}px;height:${esCompacto ? 22 : 28}px;object-fit:contain;flex:0 0 auto;">` +
            `<span><strong>${n}</strong> — ${e}</span></div>`
        ).join('');

        // Contenido de cada paso del tutorial
        const pasos = [
            {
                contenido: `
                    <div style="color:#0044CC;font-family:'Segoe Script',cursive;font-size:${tituloSize}px;font-weight:bold;margin-bottom:${margenTitulo}px;text-align:center;">OBJETIVO DEL JUEGO</div>
                    <div style="display:flex;justify-content:center;align-items:center;gap:${esCompacto ? 14 : 22}px;margin-bottom:${esCompacto ? 8 : 16}px;">
                        <img src="assets/asteroide250.png" style="width:${iconoGrande}px;height:${iconoGrande}px;object-fit:contain;">
                        <img src="assets/Pboids2.png" style="width:${iconoGrande}px;height:${iconoGrande}px;object-fit:contain;">
                        <img src="assets/Nave322.png" style="width:${iconoGrande}px;height:${iconoGrande}px;object-fit:contain;">
                    </div>
                    <div style="color:#0044CC;font-family:'Arial',sans-serif;font-size:${cuerpoGrandeSize}px;text-align:center;line-height:${esCompacto ? 1.32 : 1.5};">
                        Destruí <strong>asteroides</strong> para soltar <strong>partículas BOIDS</strong>, recolectalas y usalas para <strong>mejorar tu nave</strong>.<br><br>
                        Cuanto más avanzás, más enemigos aparecen. ¡Sobreviví la mayor cantidad de oleadas posible!
                    </div>
                `
            },
            {
                contenido: `
                    <div style="color:#0044CC;font-family:'Segoe Script',cursive;font-size:${tituloSize}px;font-weight:bold;margin-bottom:${esCompacto ? 8 : 18}px;text-align:center;">CONTROLES</div>
                    <div style="color:#0044CC;font-family:'Arial',sans-serif;font-size:${notaSize}px;font-weight:bold;text-align:center;margin-bottom:${esCompacto ? 6 : 12}px;">${nombreModoControl}</div>
                    <div style="display:grid;grid-template-columns:auto 1fr;gap:${esCompacto ? '5px 9px' : '9px 16px'};align-items:center;color:#0044CC;font-family:'Arial',sans-serif;font-size:${cuerpoSize}px;max-width:${esCompacto ? 610 : 430}px;margin:0 auto;">
                        ${filasControles}
                    </div>
                `
            },
            {
                contenido: `
                    <div style="color:#0044CC;font-family:'Segoe Script',cursive;font-size:${tituloSize}px;font-weight:bold;margin-bottom:${esCompacto ? 5 : 8}px;text-align:center;">MEJORAS</div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:${esCompacto ? 6 : 9}px;color:#0044CC;font-family:'Arial',sans-serif;font-size:${notaSize}px;text-align:center;margin-bottom:${esCompacto ? 8 : 16}px;">
                        <span>Presioná</span>
                        <img src="assets/upgreate.png" alt="Mejoras" style="width:${esCompacto ? 25 : 34}px;height:${esCompacto ? 25 : 34}px;object-fit:contain;flex:0 0 auto;">
                        <span>para abrir la ventana de mejoras y comprarlas según la habilidad que quieras mejorar.</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:${esCompacto ? '7px 14px' : '12px 22px'};color:#0044CC;font-family:'Arial',sans-serif;font-size:${notaSize}px;max-width:${esCompacto ? 610 : 520}px;margin:0 auto;">
                        ${filasMejoras}
                    </div>
                `
            },
            {
                contenido: `
                    <div style="color:#0044CC;font-family:'Segoe Script',cursive;font-size:${tituloSize}px;font-weight:bold;margin-bottom:${esCompacto ? 7 : 12}px;text-align:center;">PARTÍCULAS BOIDS</div>
                    <div style="text-align:center;margin-bottom:${esCompacto ? 7 : 14}px;">
                        <img src="assets/Pboids2.png" style="width:${iconoBoid}px;height:${iconoBoid}px;object-fit:contain;">
                    </div>
                    <div style="color:#0044CC;font-family:'Arial',sans-serif;font-size:${cuerpoSize}px;text-align:center;line-height:${esCompacto ? 1.35 : 1.5};">
                        Al destruir enemigos aparecen <strong>partículas BOIDS</strong>.<br>
                        Activá el <strong>Devorador (E)</strong> para atraerlas, o tocálas con la nave.<br><br>
                        Son la <strong>moneda</strong> que usás para comprar mejoras.
                    </div>
                `
            },
            {
                contenido: `
                    <div style="color:#CC0000;font-family:'Segoe Script',cursive;font-size:${tituloSize}px;font-weight:bold;margin-bottom:${margenTitulo}px;text-align:center;">SOBRECALENTAMIENTO</div>
                    <div style="color:#0044CC;font-family:'Arial',sans-serif;font-size:${cuerpoSize}px;text-align:center;line-height:${esCompacto ? 1.38 : 1.55};">
                        Si tus escudos llegan a <strong>0</strong> entrás en <strong style="color:#CC0000;">sobrecalentamiento</strong> por <strong>10 segundos</strong>: quedás vulnerable (sin escudos).<br><br>
                        Al terminar recuperás algo de escudos. Las mejoras de <strong>Escudo</strong> (+50 HP c/u) suben tu vida máxima para aguantar más.
                    </div>
                `
            }
        ];

        // Crear funcion para mostrar el paso actual
        const mostrarPaso = (indice) => {
            // Limpiar contenido anterior
            container.innerHTML = '';

            const paso = pasos[indice];

            // El contenido scrollea por dentro si una pantalla baja no alcanza.
            // Progreso y botones quedan fuera de ese scroll para poder navegar siempre.
            const contenido = document.createElement('div');
            contenido.innerHTML = paso.contenido;
            contenido.style.cssText = `
                flex: 1 1 0;
                min-height: 0;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                justify-content: ${justificarContenido};
                align-items: center;
                width: 100%;
                box-sizing: border-box;
                padding-right: ${esCompacto ? 2 : 4}px;
            `;
            container.appendChild(contenido);

            // Indicador de progreso
            const progreso = document.createElement('div');
            progreso.textContent = `${indice + 1} / ${pasos.length}`;
            progreso.style.cssText = `
                color: #0044CC;
                font-family: 'Arial', sans-serif;
                font-size: ${esCompacto ? 12 : 16}px;
                margin-top: ${esCompacto ? 6 : 15}px;
                font-weight: bold;
                flex: 0 0 auto;
            `;
            container.appendChild(progreso);

            // Contenedor de botones
            const botones = document.createElement('div');
            botones.style.cssText = `
                display: flex;
                justify-content: center;
                gap: ${esCompacto ? 10 : 15}px;
                margin-top: ${esCompacto ? 8 : 20}px;
                width: 100%;
                flex: 0 0 auto;
            `;

            // Boton Anterior con imagen (invisible si es el primer paso)
            const btnAnterior = document.createElement('img');
            btnAnterior.src = 'assets/botonAnterior.png';
            btnAnterior.alt = 'ANTERIOR';
            btnAnterior.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
                width: ${anchoBoton}px;
                height: auto;
                visibility: ${indice > 0 ? 'visible' : 'hidden'};
            `;
            btnAnterior.addEventListener('mouseenter', () => {
                btnAnterior.style.transform = 'scale(1.1)';
                btnAnterior.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
            });
            btnAnterior.addEventListener('mouseleave', () => {
                btnAnterior.style.transform = 'scale(1)';
                btnAnterior.style.filter = 'none';
            });
            if (indice > 0) {
                btnAnterior.addEventListener('click', () => { this._click(); mostrarPaso(indice - 1); });
            }
            botones.appendChild(btnAnterior);

            // Boton Siguiente / Finalizar con imagen
            const btnSiguiente = document.createElement('img');
            btnSiguiente.src = 'assets/botonSiguiente.png';
            btnSiguiente.alt = indice < pasos.length - 1 ? 'SIGUIENTE' : 'FINALIZAR';
            btnSiguiente.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
                width: ${anchoBoton}px;
                height: auto;
            `;
            btnSiguiente.addEventListener('mouseenter', () => {
                btnSiguiente.style.transform = 'scale(1.1)';
                btnSiguiente.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
            });
            btnSiguiente.addEventListener('mouseleave', () => {
                btnSiguiente.style.transform = 'scale(1)';
                btnSiguiente.style.filter = 'none';
            });
            btnSiguiente.addEventListener('click', () => {
                this._click();
                if (indice < pasos.length - 1) {
                    mostrarPaso(indice + 1);
                } else {
                    modal.remove();
                }
            });
            botones.appendChild(btnSiguiente);

            container.appendChild(botones);
        };

        // Crear contenedor
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-style: solid;
            border-width: ${marcoBorde}px;
            border-image: url('assets/gameOver.png') 100 fill / ${marcoBorde}px / 0 stretch;
            box-sizing: border-box;
            width: ${anchoMarco}px;
            height: ${altoMarco}px;
            padding: ${paddingMarco};
        `;

        // Mostrar primer paso
        mostrarPaso(0);

        modal.appendChild(container);
        this.mainMenu.appendChild(modal);
        this._hacerModalResponsive(modal, container);
    }
    
/**
     * Muestra modal de Top 5
     * @param {Array|null|undefined} puntuaciones - Lista de puntuaciones (null = cargando)
     */
    mostrarTop5(puntuaciones) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0D0D1A;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 600;
        `;
        
        const exterior = document.createElement('div');
        exterior.style.cssText = `
            border-style: solid;
            border-width: 36px;
            border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
            box-sizing: border-box;
            width: ${Math.min(560, this.width * 0.9)}px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 100px 40px 60px 40px;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = 'TOP 5';
        titulo.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 24px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);
        
        // Headers
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            width: ${Math.min(400, this.width * 0.6)}px;
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 0 20px;
        `;
        header.innerHTML = `
            <span style="width: 50px; text-align: center;">N°</span>
            <span style="width: 100px; text-align: center;">NOMBRE</span>
            <span style="width: 100px; text-align: center;">PUNTOS</span>
            <span style="width: 80px; text-align: center;">OLEADAS</span>
        `;
        container.appendChild(header);
        
        // Lista container
        const lista = document.createElement('div');
        lista.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 20px;
            font-weight: bold;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
            min-height: 150px;
        `;
        container.appendChild(lista);
        
        // Botón volver (se guarda referencia para mostrar después si está cargando)
        const btnVolver = this.crearBotonVolver(() => {
            // Detener polling si existe
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            modal.remove();
        });
        
        // Función para mostrar la lista
        const mostrarLista = (data) => {
            lista.innerHTML = '';
            btnVolver.style.display = 'flex';
            
            if (data && data.length > 0) {
                data.forEach((p, i) => {
                    const fila = document.createElement('div');
                    fila.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        width: ${Math.min(400, this.width * 0.6)}px;
                        padding: 5px 20px;
                    `;
                    fila.innerHTML = `
                        <span style="width: 50px; text-align: center; color: #0044CC; font-weight: bold;">${i + 1}</span>
                        <span style="width: 100px; text-align: center; color: #0044CC; font-weight: bold;">${p.nombre}</span>
                        <span style="width: 100px; text-align: center; color: #0044CC; font-weight: bold;">${p.puntuacion}</span>
                        <span style="width: 80px; text-align: center; color: #0044CC; font-weight: bold;">${p.oleada}</span>
                    `;
                    lista.appendChild(fila);
                });
            } else {
                lista.innerHTML = '<div style="text-align: center; color: #0044CC; font-weight: bold; margin-top: 30px;">¡Aún no hay puntuaciones!</div>';
            }
        };
        
        //Función para mostrar pantalla de carga
        const mostrarCarga = () => {
            // Asegurar que CSS de spin existe
            if (!document.getElementById('spin-animation-style')) {
                const spinStyle = document.createElement('style');
                spinStyle.id = 'spin-animation-style';
                spinStyle.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
                document.head.appendChild(spinStyle);
            }
            
            lista.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 30px;">
                    <img src="assets/Nave322.png" style="width: 60px; height: 60px; animation: spin 1s linear infinite; transform-origin: center center;">
                    <div style="color: #0044CC; font-size: 18px; text-shadow: 0 0 10px #0044CC;">CARGANDO...</div>
                </div>
            `;
            btnVolver.style.display = 'flex';
        };
        
        // Ocultar botón volver inicialmente (se muestra junto con contenido)
        btnVolver.style.display = 'none';
        container.appendChild(btnVolver);
        exterior.appendChild(container);
        this._hacerModalResponsive(modal, exterior);
        modal.appendChild(exterior);
        this.mainMenu.appendChild(modal);
        
// Variable para polling
        let pollingInterval = null;
        let datosCargados = false;
        
        // Función para obtener datos frescos
        const refreshDataCallback = async () => {
            if (datosCargados) return;
            
            try {
                // Importar Top5 y obtener datos frescos
                const { Top5 } = await import('../game/mecanicas/Top5.js');
                const top5Instance = new Top5();
                const nuevosDatos = await top5Instance.obtenerLista();
                
                datosCargados = true;
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
                
                mostrarLista(nuevosDatos);
            } catch (e) {
                console.log('Error cargando Top 5:', e);
            }
        };
        
        // Verificar estado inicial de los datos
        if (puntuaciones === null || puntuaciones === undefined) {
            // Está cargando - mostrar pantalla de carga
            mostrarCarga();
            
            // Iniciar polling para obtener datos cuando estén listos
            pollingInterval = setInterval(async () => {
                await refreshDataCallback();
            }, 500); // Verificar cada 500ms
            
            // También ejecutar inmediatamente
            refreshDataCallback();
        } else {
            // Datos ya disponibles
            datosCargados = true;
            mostrarLista(puntuaciones);
}
    }
    
    /**
     * Muestra modal de Créditos
     */
    mostrarCreditos() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0D0D1A;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 600;
        `;
        
        const exterior = document.createElement('div');
        exterior.style.cssText = `
            border-style: solid;
            border-width: 36px;
            border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
            box-sizing: border-box;
            width: ${Math.min(640, this.width * 0.9)}px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 40px 50px;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = 'CRÉDITOS';
        titulo.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 16px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);

        const contenido = document.createElement('div');
        contenido.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 16px;
            text-align: center;
            line-height: 1.15;
        `;
        contenido.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold;">JUGANDO EN EL ESPACIO</div>
            <div style="font-weight: bold;">Desarrollado por:</div>
            <div>Braian Zapater</div>
            <div style="margin-top: 10px; font-weight: bold;">Diseño Artístico:</div>
            <div>Braian Zapater</div>
            <div>Copilot</div>
            <div>Chat GPT</div>
            <div style="margin-top: 10px; font-weight: bold;">Curso:</div>
            <div>Programación de Videojuegos 1</div>
            <div>UNAHUR 2026</div>
            <div style="margin-top: 10px; font-weight: bold;">Profesor:</div>
            <div>Facundo Saiegh</div>
            <div style="margin-top: 10px; font-weight: bold;">Tecnologías:</div>
            <div>PixiJS v8 | Firebase Firestore</div>
            <div style="margin-top: 10px; font-weight: bold;">Asistencia IA:</div>
            <div>OpenCode | Claude (Anthropic)</div>
            <div style="margin-top: 10px; font-weight: bold;">Beta testers:</div>
            <div>TPC | JANOPRO</div>
        `;
        container.appendChild(contenido);
        container.appendChild(this.crearBotonVolver(() => modal.remove()));
        exterior.appendChild(container);

        // Firma de versión: queda anclada a la pantalla y no se achica junto al
        // marco, para que siga siendo legible en celulares con poca altura.
        const firmaVersion = document.createElement('div');
        firmaVersion.id = 'creditos-version';
        firmaVersion.textContent = `Versión v${CONFIG.APP.VERSION}`;
        firmaVersion.style.cssText = `
            position: absolute;
            right: max(14px, env(safe-area-inset-right));
            bottom: max(10px, env(safe-area-inset-bottom));
            color: rgba(255, 255, 255, 0.72);
            font-family: 'Segoe Script', cursive;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
        `;

        this._hacerModalResponsive(modal, exterior);
        modal.appendChild(exterior);
        modal.appendChild(firmaVersion);
        this.mainMenu.appendChild(modal);
    }
    
    /**
     * Actualiza la versión mostrada
     * @param {string} version 
     */
    setVersion(version) {
        const versionDisplay = document.getElementById('version-display');
        if (versionDisplay) {
            versionDisplay.textContent = version;
        }
    }
    
    /**
     * Maneja el redimensionamiento de ventana
     */
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        // Los elementos con % se ajustan automáticamente
    }
    
    /**
     * Limpia toda la UI del contenedor
     */
    destruir() {
        if (this.uiOverlay) {
            this.uiOverlay.remove();
        }
        if (this.mainMenu) {
            this.mainMenu.remove();
        }
        window.removeEventListener('resize', this.onResize);
    }
    
}
