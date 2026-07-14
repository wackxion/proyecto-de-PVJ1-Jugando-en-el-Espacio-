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
     * El navegador bloquea el audio hasta la primera interacción del usuario,
     * por eso main.js la dispara en el primer click/gesto sobre la página.
     * (Al volver al menú con Escape, la música la maneja el propio juego.)
     */
    iniciarMusicaMenu() {
        if (!this.gestorSonido || this._musicaMenuLoop) return;
        this._musicaMenuLoop = this.gestorSonido.reproducirLoop('musicaMenu');
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

        container.appendChild(this.crearBotonVolver(() => modal.remove()));

        exterior.appendChild(container);
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
        versionDisplay.textContent = 'v1.12.0';
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
            background: url('assets/jugando en el espacio.png') no-repeat center center;
            background-size: cover;
            z-index: 500;
        `;

        // Botones 20% más chicos que su tamaño natural (320px -> 256px)
        const anchoBoton = 256;

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
            gap: 10px;
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
            b.style.width = anchoBoton + 'px';
            colDerecha.appendChild(b);
        }
        this.mainMenu.appendChild(colDerecha);

        this.container.appendChild(this.mainMenu);
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
                if (callback) callback();
            }, 500);
        } else if (callback) {
            callback();
        }
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
     * las demás ventanas (Créditos / Top 5): caja con fondo gameOver.jpg, texto
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
                    updateProgress(50, 'CARGANDO...');
                }
                
                await callback();
                updateProgress(100, 'LISTO!');
                loadingScreen.style.transition = 'opacity 0.5s ease';
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.remove(), 500);
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
        
        // Contenido de cada paso del tutorial
        const pasos = [
            // Paso 1: Objetivo
            {
                titulo: 'TUTORIAL - OBJETIVO',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">OBJETIVO DEL JUEGO</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 20px; text-align: center; line-height: 1.5;">
                        Tu misión es <strong>destruir asteroides</strong> para obtener partículas BOIDS.<br><br>
                        Usa esas partículas para <strong>mejorar tu nave</strong> y sobrevivir<br>
                        tantas oleadas como puedas.<br><br>
                        Cada vez que tu puntuación sube, aparecen más asteroides.<br>
                        ¡Sobrevive el mayor tiempo posible!
                    </div>
                `
            },
            // Paso 2: Controles
            {
                titulo: 'TUTORIAL - CONTROLES',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">CONTROLES</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 18px; text-align: left; line-height: 1.6; max-width: 500px; margin: 0 auto;">
                        <strong>W</strong> - Avanzar<br>
                        <strong>A / D</strong> - Rotar izquierda/derecha<br>
                        <strong>ESPACIO</strong> - Disparar<br>
                        <strong>Q</strong> - Cohetes (aceleración)<br>
                        <strong>E</strong> - Devorador (atrae partículas)<br>
                        <strong>R</strong> - Propulsor (dash)<br>
                        <strong>P</strong> - Pausar / Abrir MEJORAS<br>
                        <strong>T</strong> - Ver Top 5 (en pausa)<br>
                        <strong>ESC</strong> - Volver al menú principal
                    </div>
                `
            },
            // Paso 3: Sistema de Mejoras
            {
                titulo: 'TUTORIAL - MEJORAS',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">SISTEMA DE MEJORAS</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 16px; text-align: left; line-height: 1.5;">
                        Presiona <strong>P</strong> para abrir el menú de mejoras.<br><br>
                        <strong>AUMENTO DE DAÑO</strong>: +2, +3, +5, +5, +10<br>
                        <strong>AUMENTO DE VELOCIDAD</strong>: +5%, +5%, +10%, +10%, +20%<br>
                        <strong>COSTE DE ULTI</strong>: -50,-50,-50,-50,-50 (de 500 a 250)<br>
                        <strong>AUMENTO DE ESCUDO</strong>: +50,+50,+50,+50,+50 HP<br>
                        <strong>REGENERACIÓN</strong>: +5,+10,+15,+20,+30 tras Tiempo Fuera<br><br>
                        <em style="color: #6688AA;">Paga con partículas del Devorador.</em>
                    </div>
                `
            },
            // Paso 4: Partículas
            {
                titulo: 'TUTORIAL - PARTÍCULAS',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 15px; text-align: center;">PARTÍCULAS BOIDS</div>
                    <div style="text-align: center; margin-bottom: 15px;">
                        <img src="assets/Pboids2.png" style="width: 80px; height: 80px; border: 2px solid #0044CC; border-radius: 10px;">
                    </div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 16px; text-align: left; line-height: 1.5;">
                        Los <strong>asteroides especiales</strong> sueltan partículas BOIDS al destruirse.<br><br>
                        <strong>¿Cómo recolectarlas?</strong><br>
                        - Presiona <strong>E</strong> para activar el Devorador<br>
                        - Las partículas serán atraídas hacia ti<br>
                        - También puedes tocarlas con tu nave<br><br>
                        Las partículas se usan en el menú de mejoras (tecla P).<br><br>
                        <em style="color: #6688AA;">¡Recolecta sabiamente!</em>
                    </div>
                `
            },
            // Paso 5: Sobrecalentamiento
            {
                titulo: 'TUTORIAL - SOBRECALENTAMIENTO',
                contenido: `
                    <div style="color: #FF0000; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">SOBRECALENTAMIENTO</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 16px; text-align: left; line-height: 1.5;">
                        Si tus escudos llegan a <strong>0</strong>, entras en modo<br>
                        <strong>SOBRECALENTAMIENTO</strong>.<br><br>
                        Durante <strong>25 segundos</strong>:<br>
                        - Eres vulnerable<br>
                        - No puedes usar el propulsor (R)<br>
                        - Solo puedes moverte y disparar<br><br>
                        Al terminar, regeneras <strong>10 escudos</strong>.<br>
                        Las mejoras de ESCUDO (+50 HP cada una) aumentan<br>
                        tu vida máxima para que puedas resistir más.<br><br>
                        <em style="color: #6688AA;">¡Mantén tus escudos altos!</em>
                    </div>
                `
            }
        ];
        
        let pasoActual = 0;
        
        // Crear función para mostrar el paso actual
        const mostrarPaso = (indice) => {
            // Limpiar contenido anterior
            container.innerHTML = '';
            
            const paso = pasos[indice];
            
            // Título del paso
            const titulo = document.createElement('div');
            titulo.innerHTML = paso.titulo;
            titulo.style.cssText = `
                color: #0044CC;
                font-family: 'Segoe Script', cursive;
                font-size: 26px;
                font-weight: bold;
                margin-bottom: 15px;
            `;
            container.appendChild(titulo);
            
            // Contenido
            const contenido = document.createElement('div');
            contenido.innerHTML = paso.contenido;
            container.appendChild(contenido);
            
            // Indicador de progreso
            const progreso = document.createElement('div');
            progreso.textContent = `${indice + 1} / ${pasos.length}`;
            progreso.style.cssText = `
                color: #0044CC;
                font-family: 'Arial', sans-serif;
                font-size: 16px;
                margin-top: 15px;
                font-weight: bold;
            `;
            container.appendChild(progreso);
            
            // Contenedor de botones
            const botones = document.createElement('div');
            botones.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
                width: 100%;
            `;
            
            // Botón Anterior con imagen (invisible si es el primer paso)
            const btnAnterior = document.createElement('img');
            btnAnterior.src = 'assets/botonAnterior.png';
            btnAnterior.alt = 'ANTERIOR';
            btnAnterior.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
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
                btnAnterior.addEventListener('click', () => mostrarPaso(indice - 1));
            }
            botones.appendChild(btnAnterior);
            
            // Botón Siguiente / Finalizar con imagen
            const btnSiguiente = document.createElement('img');
            btnSiguiente.src = 'assets/botonSiguiente.png';
            btnSiguiente.alt = indice < pasos.length - 1 ? 'SIGUIENTE' : 'FINALIZAR';
            btnSiguiente.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
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
            border-width: 36px;
            border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
            box-sizing: border-box;
            width: ${Math.min(750, this.width * 0.9)}px;
            height: ${Math.min(700, this.height * 0.9)}px;
            padding: 60px 55px;
        `;
        
        // Mostrar primer paso
        mostrarPaso(0);
        
        modal.appendChild(container);
        this.mainMenu.appendChild(modal);
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
            padding: 70px 50px;
        `;
        
        const titulo = document.createElement('div');
        titulo.textContent = 'CRÉDITOS';
        titulo.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);
        
        const contenido = document.createElement('div');
        contenido.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 18px;
            text-align: center;
            line-height: 1.2;
        `;
        contenido.innerHTML = `
            <div style="margin-bottom: 20px; font-weight: bold;">JUGANDO EN EL ESPACIO</div>
            <div style="font-weight: bold;">Desarrollado por:</div>
            <div>Braian Zapater</div>
            <div style="margin-top: 20px; font-weight: bold;">Curso:</div>
            <div>Programación de Videojuegos 1</div>
            <div>UNAHUR 2026</div>
            <div style="margin-top: 20px; font-weight: bold;">Profesor:</div>
            <div>Facundo Saiegh</div>
            <div style="margin-top: 20px; font-weight: bold;">Tecnologías:</div>
            <div>PixiJS v8 | Firebase Firestore</div>
            <div style="margin-top: 10px; font-weight: bold;">Asistencia IA:</div>
            <div>OpenCode | Claude (Anthropic)</div>
            <div style="margin-top: 20px; font-weight: bold;">Beta tester:</div>
            <div>TPC</div>
        `;
        container.appendChild(contenido);
        container.appendChild(this.crearBotonVolver(() => modal.remove()));
        exterior.appendChild(container);
        modal.appendChild(exterior);
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