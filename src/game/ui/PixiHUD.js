/**
 * PixiHUD - Réplica exacta del HUD HTML en PixiJS
 *
 * Esta clase reemplaza completamente el HUD HTML que está en UIManager.js.
 * Renderiza todos los elementos del HUD directamente en el canvas de PixiJS,
 * manteniendo la misma apariencia visual que la versión HTML.
 *
 * Migración completa desde HTML a PixiJS (v1.6.0).
 * Réplica 1:1 de los elementos definidos en UIManager.js (line 1049-1599).
 *
 * Elementos del HUD (orden de creación según HTML):
 * 1. #left-panel        - Info de oleada (top-left)
 * 2. #cohetes-ux-frame  - Cohetes (Q)
 * 3. #tiempo-ux-frame   - Tiempo Fuera
 * 4. #escudo-ux-frame   - Escudo
 * 5. #ulti-ux-frame     - ULTi
 * 6. #propul-ux-frame   - Propulsor (R)
 * 7. #deborador-ux-frame - Devorador (E)
 * 8. #contador-devorador - Contador de partículas
 * 9. #ux-experimental   - Imagen de fondo del HUD
 * 10. #aceleracion-ux-container - Barra de aceleración (W)
 * 11. #score-panel      - Panel de puntuación
 *
 * FIXED PIXEL LAYOUT for 1080×720 base resolution.
 * The HUD container is scaled to fit the actual screen using:
 *   scale = Math.min(actualWidth / 1080, actualHeight / 720)
 */

export class PixiHUD {
    /**
     * Constructor del HUD
     * @param {PIXI.Application} app - Aplicación PixiJS
     * @param {Game} game - Referencia al juego principal
     */
    constructor(app, game) {
        this.app = app;
        this.game = game;

        // Contenedor principal del HUD
        this.container = new PIXI.Container();
        this.container.zIndex = 1000;
        this.container.sortableChildren = true; // Permitir ordenar hijos por zIndex
        this.app.stage.addChild(this.container);

        // Habilitar sorting por zIndex en el stage también
        this.app.stage.sortableChildren = true;

        // =========================================
        // REFERENCIAS A ELEMENTOS DEL HUD
        // =========================================

        // 1. Panel de oleada
        this.oleadaText = null;

        // 2-7. Marcos e iconos de habilidades
        this.cohetes = { marco: null, fondo: null, icono: null };
        this.tiempo = { marco: null, fondo: null, icono: null, sprites: [] };
        this.escudo = { marco: null, fondo: null, icono: null, sprites: [] };
        this.ulti = { marco: null, fondo: null, icono: null, sprites: [] };
        this.propul = { marco: null, fondo: null, icono: null };
        this.deborador = { marco: null, fondo: null, icono: null };

        // 8. Contador del devorador
        this.contadorDevoradorText = null;

        // 9. Imagen UX
        this.uxImage = null;

        // 10. Barra de aceleración (W)
        this.barraAceleracionBg = null;
        this.barraAceleracionFill = null;

        // 11. Puntuación
        this.puntuacionText = null;
        this.scorePanel = null;

        // Estado
        this._escudosAnterior = 100;
        this.inicializado = false;

        // DIFERIR inicialización al próximo frame para asegurar que el canvas
        // tenga dimensiones válidas. Si screen.width/height son 0 al momento
        // de crear el HUD (típico durante la inicialización), todos los
        // elementos quedarían con tamaño 0 y serían invisibles.
        requestAnimationFrame(() => {
            this._calcularEscala();
            this._inicializar();
        });
    }

    /**
     * Calcula la escala del contenedor HUD para la resolución base 1080×720.
     * Escala uniforme (min) y centrado horizontal si el aspecto difiere.
     * @private
     */
    _calcularEscala() {
        const w = this.app.screen.width || window.innerWidth || 1080;
        const h = this.app.screen.height || window.innerHeight || 720;
        this._escala = Math.min(w / 1080, h / 720);
        this.container.scale.set(this._escala);
        // Center horizontally if aspect ratio differs
        this.container.x = (w - 1080 * this._escala) / 2;
    }

    /**
     * Inicializa todos los elementos del HUD en el mismo orden que el HTML
     * Cada llamada está envuelta en try-catch para que un fallo en un
     * elemento no impida la creación de los demás.
     * @private
     */
    _inicializar() {
        const creadores = [
            ['_crearPanelOleada', () => this._crearPanelOleada()],
            ['_crearImagenUX', () => this._crearImagenUX()],
            ['_crearCohetes', () => this._crearCohetes()],
            ['_crearTiempoFuera', () => this._crearTiempoFuera()],
            ['_crearEscudo', () => this._crearEscudo()],
            ['_crearUlti', () => this._crearUlti()],
            ['_crearPropulsor', () => this._crearPropulsor()],
            ['_crearDevorador', () => this._crearDevorador()],
            ['_crearContadorDevorador', () => this._crearContadorDevorador()],
            ['_crearBarraAceleracion', () => this._crearBarraAceleracion()],
            ['_crearPanelPuntuacion', () => this._crearPanelPuntuacion()],
        ];

        for (const [nombre, fn] of creadores) {
            try {
                fn();
            } catch (e) {
                console.error(`[PixiHUD] Error creando ${nombre}:`, e);
            }
        }

        // Re-posicionar los 6 iconos en una fila horizontal centrada
        try {
            this._posicionarIconosEnFila();
        } catch (e) {
            console.error('[PixiHUD] Error posicionando iconos en fila:', e);
        }

        this.inicializado = true;
    }

    /**
     * Re-inicializa el HUD destruyendo los elementos actuales y creándolos de nuevo.
     * Se usa después de un restart del juego o cuando cambia el tamaño de pantalla.
     * @public
     */
    reinicializar() {
        // Destruir elementos actuales si existen
        if (this.container) {
            try {
                this.container.removeChildren();
            } catch (e) {
                // Si los hijos ya fueron destruidos, continuar
            }
        }

        // Resetear referencias
        this.oleadaText = null;
        this.cohetes = { marco: null, fondo: null, icono: null };
        this.tiempo = { marco: null, fondo: null, icono: null, sprites: [] };
        this.escudo = { marco: null, fondo: null, icono: null, sprites: [] };
        this.ulti = { marco: null, fondo: null, icono: null, sprites: [] };
        this.propul = { marco: null, fondo: null, icono: null };
        this.deborador = { marco: null, fondo: null, icono: null };
        this.contadorDevoradorText = null;
        this.uxImage = null;
        this.barraAceleracionBg = null;
        this.barraAceleracionFill = null;
        this.puntuacionText = null;
        this.scorePanel = null;
        this._escudosAnterior = 100;
        this.inicializado = false;

        // Re-calcular escala y crear elementos
        this._calcularEscala();
        this._inicializar();
    }

    // ========================================================================
    // 1. PANEL DE OLEADA (top-left)
    // ========================================================================

    _crearPanelOleada() {
        // HTML: position: absolute; top: 10px; left: 15px; padding: 5px;
        // #wave: color: white; font-family: Arial; font-size: 12px;

        this.oleadaText = new PIXI.Text('Oleada: 1', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,  // CSS original: 12px
            fill: 0xFFFFFF
        });
        this.oleadaText.x = 15;  // left: 15px
        this.oleadaText.y = 10;  // top: 10px
        this.container.addChild(this.oleadaText);
    }

    // ========================================================================
    // 9. IMAGEN UX EXPERIMENTAL (bottom center background)
    // ========================================================================

    _crearImagenUX() {
        // HTML: position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
        // width: min(2000, width * 0.8)px; height: height * 0.2px;

        this._cargarTexturaUX();
    }

    async _cargarTexturaUX() {
        try {
            const tex = await PIXI.Assets.load('assets/uxExperimental2.png');
            this.uxImage = new PIXI.Sprite(tex);
            // Fixed dimensions for 1080×720 base: width=864 (80% of 1080), height=144 (20% of 720)
            this.uxImage.width = 1000;
            this.uxImage.height = 160;
            this.uxImage.anchor.set(0.5, 1); // Para usar bottom: 0 con translateX(-50%)
            this.uxImage.x = 540;  // center: 1080 / 2
            this.uxImage.y = 720;  // bottom: 0
            this.uxImage.zIndex = -1; // Detrás de todos los iconos del HUD
            this.container.addChild(this.uxImage);
        } catch (e) {
            // Si falla, no hacer nada
        }
    }

    // ========================================================================
    // 2. ICONO DE COHETES (Q)
    // ========================================================================

    _crearCohetes() {
        // HTML marco: position: absolute; bottom: 2.3vmin; left: 48.9%;
        //           transform: translateX(-200%); border: 4px solid #0044CC;
        // HTML fondo: width: 9.9vmin; height: 7.9vmin; background: white;
        //           border: 5px solid #0044CC;
        // HTML icono: width: 8vmin; height: auto;

        // const tamanoMarco = this._v(10);  // border -- NO USADO
        const anchoFondo = 77;  // ≈ 9.9vmin at 720
        const altoFondo = 57;   // ≈ 7.9vmin at 720
        const anchoIcono = 55;  // ≈ 8vmin at 720
        // const bottom = this._v(2.3);        // OVERRIDDEN por _posicionarIconosEnFila()
        // const leftPorcentaje = 48.9;         // OVERRIDDEN
        // const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        // const xIzquierda = xCentro - this._v(20); // translateX(-200%) = 2 * 10vmin
        // const altoTotal = altoFondo + 8; // Alto del marco completo
        // const yBottom = this.app.screen.height - bottom - altoTotal; // bottom del CSS = borde inferior del marco

        // Marco exterior
        this.cohetes.marco = new PIXI.Graphics();
        this.cohetes.marco.lineStyle(4, 0x0044CC, 1);
        this.cohetes.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        // this.cohetes.marco.x = xIzquierda;
        // this.cohetes.marco.y = yBottom;
        this.container.addChild(this.cohetes.marco);

        // Fondo blanco con borde azul
        this.cohetes.fondo = new PIXI.Graphics();
        this.cohetes.fondo.beginFill(0xFFFFFF);
        this.cohetes.fondo.lineStyle(5, 0x0044CC, 1);
        this.cohetes.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.cohetes.fondo.endFill();
        // this.cohetes.fondo.x = xIzquierda + 4;
        // this.cohetes.fondo.y = yBottom + 4;
        this.container.addChild(this.cohetes.fondo);

        // Icono
        this.cohetes.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.cohetes.icono.anchor.set(0.5);
        // this.cohetes.icono.x = xIzquierda + (anchoFondo + 8) / 2;
        // this.cohetes.icono.y = yBottom + (altoTotal) / 2;
        this.cohetes.icono.width = anchoIcono;
        this.container.addChild(this.cohetes.icono);
        this._cargarTexturaIcono('cohetes', 'assets/cohetes.png', this.cohetes.icono, anchoIcono, null);
    }

    // ========================================================================
    // 3. ICONO DE TIEMPO FUERA
    // ========================================================================

    _crearTiempoFuera() {
        // HTML marco: position: absolute; bottom: 2.3vmin; left: 44%;
        //           transform: translateX(-300%); border: 5px solid #0044CC;
        // HTML fondo: width: 9.9vmin; height: 7.9vmin; background: white;
        // HTML icono: width: 5vmin; height: auto;

        const anchoFondo = 77;  // ≈ 9.9vmin at 720
        const altoFondo = 57;   // ≈ 7.9vmin at 720
        const anchoIcono = 55;  // default (overridden by _posicionarIconosEnFila)
        // const bottom = this._v(2.3);
        // const leftPorcentaje = 44;
        // const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        // const xIzquierda = xCentro - this._v(30); // translateX(-300%) = 3 * 10vmin
        // const altoTotal = altoFondo + 10;
        // const yBottom = this.app.screen.height - bottom - altoTotal;

        // Marco exterior
        this.tiempo.marco = new PIXI.Graphics();
        this.tiempo.marco.lineStyle(5, 0x0044CC, 1);
        this.tiempo.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        // this.tiempo.marco.x = xIzquierda;
        // this.tiempo.marco.y = yBottom;
        this.container.addChild(this.tiempo.marco);

        // Fondo blanco con borde azul
        this.tiempo.fondo = new PIXI.Graphics();
        this.tiempo.fondo.beginFill(0xFFFFFF);
        this.tiempo.fondo.lineStyle(5, 0x0044CC, 1);
        this.tiempo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.tiempo.fondo.endFill();
        // this.tiempo.fondo.x = xIzquierda + 5;
        // this.tiempo.fondo.y = yBottom + 5;
        this.container.addChild(this.tiempo.fondo);

        // Icono
        this.tiempo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.tiempo.icono.anchor.set(0.5);
        // this.tiempo.icono.x = xIzquierda + (anchoFondo + 10) / 2;
        // this.tiempo.icono.y = yBottom + altoTotal / 2;
        this.tiempo.icono.width = anchoIcono;
        this.container.addChild(this.tiempo.icono);
        // Cargar textura original y guardar referencia para restaurar cuando no esté activo
        this._cargarTexturaTiempoOriginal(anchoIcono);

        // Cargar sprites del reloj para animación (relog1-6, frame 7 = relog6 rotado)
        this._cargarSpritesTiempo();
    }

    /**
     * Carga la textura original de tiempo fuera.png y la guarda como referencia estática.
     * @param {number} ancho - Ancho del icono
     */
    async _cargarTexturaTiempoOriginal(ancho) {
        try {
            const tex = await PIXI.Assets.load('assets/tiempo fuera.png');
            if (tex && this.tiempo.icono) {
                this.tiempo.icono.texture = tex;
                this._texturaIconoTiempo = tex;
            }
        } catch (e) {
            this._texturaIconoTiempo = PIXI.Texture.WHITE;
        }
    }

    /**
     * Carga los 6 sprites del reloj para la animación de Tiempo Fuera.
     * Frame 7 se genera aplicando rotación π al sprite relog6.
     */
    async _cargarSpritesTiempo() {
        for (let i = 1; i <= 6; i++) {
            try {
                const tex = await PIXI.Assets.load(`assets/relog${i}.png`);
                this.tiempo.sprites.push(tex);
            } catch (e) {
                this.tiempo.sprites.push(PIXI.Texture.WHITE);
            }
        }
    }

    // ========================================================================
    // 4. ICONO DE ESCUDO
    // ========================================================================

    _crearEscudo() {
        // HTML marco: position: absolute; bottom: 5.1vmin; left: 49%;
        //           transform: translateX(-200%); border: 5px solid #0044CC;
        // HTML fondo: width: 9.9vmin; height: 7.9vmin; background: white;
        // HTML icono: width: 8vmin; height: 6vmin;

        const anchoFondo = 77;  // ≈ 9.9vmin at 720
        const altoFondo = 57;   // ≈ 7.9vmin at 720
        const anchoIcono = 55;  // ≈ 8vmin at 720
        const altoIcono = 41;   // ≈ 6vmin at 720
        // const bottom = this._v(5.1);
        // const leftPorcentaje = 49;
        // const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        // const xIzquierda = xCentro - this._v(20); // translateX(-200%) = 2 * 10vmin
        // const altoTotal = altoFondo + 10;
        // const yBottom = this.app.screen.height - bottom - altoTotal;

        // Marco exterior
        this.escudo.marco = new PIXI.Graphics();
        this.escudo.marco.lineStyle(5, 0x0044CC, 1);
        this.escudo.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        // this.escudo.marco.x = xIzquierda;
        // this.escudo.marco.y = yBottom;
        this.container.addChild(this.escudo.marco);

        // Fondo blanco con borde azul
        this.escudo.fondo = new PIXI.Graphics();
        this.escudo.fondo.beginFill(0xFFFFFF);
        this.escudo.fondo.lineStyle(5, 0x0044CC, 1);
        this.escudo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.escudo.fondo.endFill();
        // this.escudo.fondo.x = xIzquierda + 5;
        // this.escudo.fondo.y = yBottom + 5;
        this.container.addChild(this.escudo.fondo);

        // Icono (sprite que cambiará de textura)
        this.escudo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.escudo.icono.anchor.set(0.5);
        // this.escudo.icono.x = xIzquierda + (anchoFondo + 10) / 2;
        // this.escudo.icono.y = yBottom + altoTotal / 2;
        this.escudo.icono.width = anchoIcono;
        this.escudo.icono.height = altoIcono;
        this.container.addChild(this.escudo.icono);

        // Cargar 5 sprites del escudo
        this._cargarSpritesEscudo();
    }

    async _cargarSpritesEscudo() {
        for (let i = 1; i <= 5; i++) {
            try {
                const tex = await PIXI.Assets.load(`assets/escudo${i}.png`);
                this.escudo.sprites.push(tex);
            } catch (e) {
                this.escudo.sprites.push(PIXI.Texture.WHITE);
            }
        }
    }

    // ========================================================================
    // 5. ICONO DE ULTI
    // ========================================================================

    _crearUlti() {
        // HTML marco: position: absolute; bottom: 1.7vmin; left: 46.8%;
        //           transform: translateX(100%); width: 9.9vmin; height: 7.9vmin;
        // HTML fondo: width: 9vmin; height: 7vmin; background: white; border: none;
        // HTML icono: width: 6vmin; height: 7vmin;

        const anchoFondo = 77;  // ≈ 9.9vmin at 720
        const altoFondo = 57;   // ≈ 7.9vmin at 720
        const anchoIcono = 41;  // ≈ 6vmin at 720
        const altoIcono = 49;   // ≈ 7vmin at 720
        // const bottom = this._v(1.7);
        // const leftPorcentaje = 46.8;
        // const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        // const xIzquierda = xCentro + this._v(10); // translateX(100%) = 1 * 10vmin
        // const altoTotal = altoFondo + 10; // Alto del marco completo
        // const yBottom = this.app.screen.height - bottom - altoTotal;

        // Marco exterior (con borde visible como los demás iconos)
        this.ulti.marco = new PIXI.Graphics();
        this.ulti.marco.lineStyle(5, 0x0044CC, 1);
        this.ulti.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        // this.ulti.marco.x = xIzquierda;
        // this.ulti.marco.y = yBottom;
        this.container.addChild(this.ulti.marco);

        // Fondo blanco
        this.ulti.fondo = new PIXI.Graphics();
        this.ulti.fondo.beginFill(0xFFFFFF);
        this.ulti.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.ulti.fondo.endFill();
        // this.ulti.fondo.x = xIzquierda + 5; // 5 = borde del marco
        // this.ulti.fondo.y = yBottom + 5; // 5 = borde del marco
        this.container.addChild(this.ulti.fondo);

        // Icono
        this.ulti.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.ulti.icono.anchor.set(0.5);
        // this.ulti.icono.x = xIzquierda + (anchoFondo + 10) / 2;
        // this.ulti.icono.y = yBottom + altoTotal / 2;
        this.ulti.icono.width = anchoIcono;
        this.ulti.icono.height = altoIcono;
        this.container.addChild(this.ulti.icono);

        // Cargar 5 sprites de ULTi
        this._cargarSpritesUlti();
    }

    async _cargarSpritesUlti() {
        for (let i = 1; i <= 5; i++) {
            try {
                const tex = await PIXI.Assets.load(`assets/ultiicon${i}.png`);
                this.ulti.sprites.push(tex);
            } catch (e) {
                this.ulti.sprites.push(PIXI.Texture.WHITE);
            }
        }
    }

    // ========================================================================
    // 6. ICONO DE PROPULSOR (R)
    // ========================================================================

    _crearPropulsor() {
        // HTML marco: position: absolute; bottom: 2vmin; left: 48.9%;
        //           transform: translateX(200%); border: 4px solid #0044CC;
        // HTML fondo: width: 9.7vmin; height: 7.9vmin; background: white;
        // HTML icono: width: 8vmin; height: auto;

        const anchoFondo = 75;  // ≈ 9.7vmin at 720
        const altoFondo = 57;   // ≈ 7.9vmin at 720
        const anchoIcono = 55;  // ≈ 8vmin at 720
        // const bottom = this._v(2);
        // const leftPorcentaje = 48.9;
        // const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        // const xIzquierda = xCentro + this._v(20); // translateX(200%) = 2 * 10vmin
        // const altoTotal = altoFondo + 8;
        // const yBottom = this.app.screen.height - bottom - altoTotal;

        // Marco exterior
        this.propul.marco = new PIXI.Graphics();
        this.propul.marco.lineStyle(4, 0x0044CC, 1);
        this.propul.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        // this.propul.marco.x = xIzquierda;
        // this.propul.marco.y = yBottom;
        this.container.addChild(this.propul.marco);

        // Fondo blanco
        this.propul.fondo = new PIXI.Graphics();
        this.propul.fondo.beginFill(0xFFFFFF);
        this.propul.fondo.lineStyle(5, 0x0044CC, 1);
        this.propul.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.propul.fondo.endFill();
        // this.propul.fondo.x = xIzquierda + 4;
        // this.propul.fondo.y = yBottom + 4;
        this.container.addChild(this.propul.fondo);

        // Icono
        this.propul.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.propul.icono.anchor.set(0.5);
        // this.propul.icono.x = xIzquierda + (anchoFondo + 8) / 2;
        // this.propul.icono.y = yBottom + altoTotal / 2;
        this.propul.icono.width = anchoIcono;
        this.container.addChild(this.propul.icono);
        this._cargarTexturaIcono('propul', 'assets/propulsor.png', this.propul.icono, anchoIcono, null);
    }

    // ========================================================================
    // 7. ICONO DE DEBORADOR (E)
    // ========================================================================

    _crearDevorador() {
        // HTML marco: position: absolute; bottom: 1.9vmin; left: 50%;
        //           transform: translateX(300%); border: 4px solid #0044CC;
        // HTML fondo: width: 9.9vmin; height: 7.9vmin; background: white;
        // HTML icono: width: 8vmin; height: auto.

        const anchoFondo = 77;  // ≈ 9.9vmin at 720
        const altoFondo = 57;   // ≈ 7.9vmin at 720
        const anchoIcono = 55;  // ≈ 8vmin at 720
        // const bottom = this._v(1.9);
        // const leftPorcentaje = 50;
        // const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        // const xIzquierda = xCentro + this._v(30); // translateX(300%) = 3 * 10vmin
        // const altoTotal = altoFondo + 8;
        // const yBottom = this.app.screen.height - bottom - altoTotal;

        // Marco exterior
        this.deborador.marco = new PIXI.Graphics();
        this.deborador.marco.lineStyle(4, 0x0044CC, 1);
        this.deborador.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        // this.deborador.marco.x = xIzquierda;
        // this.deborador.marco.y = yBottom;
        this.container.addChild(this.deborador.marco);

        // Fondo blanco
        this.deborador.fondo = new PIXI.Graphics();
        this.deborador.fondo.beginFill(0xFFFFFF);
        this.deborador.fondo.lineStyle(5, 0x0044CC, 1);
        this.deborador.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.deborador.fondo.endFill();
        // this.deborador.fondo.x = xIzquierda + 4;
        // this.deborador.fondo.y = yBottom + 4;
        this.container.addChild(this.deborador.fondo);

        // Icono
        this.deborador.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.deborador.icono.anchor.set(0.5);
        // this.deborador.icono.x = xIzquierda + (anchoFondo + 8) / 2;
        // this.deborador.icono.y = yBottom + altoTotal / 2;
        this.deborador.icono.width = anchoIcono;
        this.container.addChild(this.deborador.icono);
        this._cargarTexturaIcono('deborador', 'assets/deborador.png', this.deborador.icono, anchoIcono, null);
    }

    // ========================================================================
    // 8. CONTADOR DEL DEBORADOR
    // ========================================================================

    _crearContadorDevorador() {
        // HTML: position: absolute; bottom: 3.2vmin; left: 70.5%;
        //      color: white; font-size: 2.5vmin; font-weight: bold;
        //      text-shadow: 2px 2px 4px #000000;

        this.contadorDevoradorText = new PIXI.Text('0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 18,  // ≈ 2.5vmin at 720
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 2,
            dropShadowBlur: 4
        });
        // x: (70.5/100)*1080 + 20 = 781
        this.contadorDevoradorText.x = 781;
        // y: 720 - 23 - textHeight (bottom: 3.2vmin ≈ 23px at 720)
        this.contadorDevoradorText.y = 720 - 23 - this.contadorDevoradorText.height;
        this.container.addChild(this.contadorDevoradorText);
    }

    // ========================================================================
    // 10. BARRA DE ACELERACIÓN (W)
    // ========================================================================

    _crearBarraAceleracion() {
        // Fixed for 1080×720 base
        const ancho = 120;
        const alto = 18;  // ≈ 2.5vmin at 720
        // x: 540 - 60 - 10 = 470 (centered, offset -10px)
        const x = 470;
        // y: 720 - 18 - 86 - 11 = 605 (-11px up total)
        const y = 605;

        // Fondo (borde azul + relleno blanco) - detrás de la imagen UX
        this.barraAceleracionBg = new PIXI.Graphics();
        this.barraAceleracionBg.beginFill(0xFFFFFF);
        this.barraAceleracionBg.lineStyle(2, 0x0044CC, 1);
        this.barraAceleracionBg.drawRect(0, 0, ancho, alto);
        this.barraAceleracionBg.endFill();
        this.barraAceleracionBg.x = x;
        this.barraAceleracionBg.y = y;
        this.barraAceleracionBg.zIndex = -2;
        this.container.addChild(this.barraAceleracionBg);

        // Relleno (azul) - detrás de la imagen UX
        this.barraAceleracionFill = new PIXI.Graphics();
        this.barraAceleracionFill.beginFill(0x0044CC);
        this.barraAceleracionFill.drawRect(0, 0, 0, alto);
        this.barraAceleracionFill.endFill();
        this.barraAceleracionFill.x = x;
        this.barraAceleracionFill.y = y;
        this.barraAceleracionFill.zIndex = -2;
        this.container.addChild(this.barraAceleracionFill);

        this._anchoBarraAceleracion = ancho;
        this._altoBarraAceleracion = alto;
    }

    // ========================================================================
    // 11. PANEL DE PUNTUACIÓN
    // ========================================================================

    _crearPanelPuntuacion() {
        this.puntuacionText = new PIXI.Text('0', {
            fontFamily: 'Segoe Script, cursive',
            fontSize: 18,
            fill: 0x0044CC,
            fontWeight: 'bold'
        });

        // Fixed for 1080×720 base
        // White panel: 100×26
        // x: (41.7/100)*1080 - 52 = 398
        // y: 720 - 84 - 26 = 610 (bottom: 11.6vmin ≈ 84px)
        const scoreBgX = 383;  // -5px left
        const scoreBgY = 603;
        const textX = (41.7 / 100) * 1080 - 17;  // -5px left
        const textY = 720 - 91;

        // Fondo blanco detrás del texto
        this.scoreBg = new PIXI.Graphics();
        this.scoreBg.beginFill(0xFFFFFF);
        this.scoreBg.lineStyle(3, 0x0044CC, 1);
        this.scoreBg.drawRect(0, 0, 90, 26);
        this.scoreBg.endFill();
        this.scoreBg.x = scoreBgX;
        this.scoreBg.y = scoreBgY;
        this.scoreBg.zIndex = -2;
        this.container.addChild(this.scoreBg);

        this.puntuacionText.anchor.set(0.5, 1);
        this.puntuacionText.x = textX;
        this.puntuacionText.y = textY;
        this.container.addChild(this.puntuacionText);
    }

    // ========================================================================
    // RE-POSICIONAMIENTO: FILA HORIZONTAL DE ICONOS
    // ========================================================================

    /**
     * Re-posiciona los 6 iconos del HUD en una fila horizontal centrada
     * en la parte inferior de la pantalla, uno al lado del otro con
     * separación pequeña.
     *
     * Cada "grupo" (marco, fondo, icono) se reposiciona independientemente.
     * La imagen UX queda detrás (zIndex -1) y la barra W + puntuación
     * quedan arriba de la fila.
     *
     * FIXED layout for 1080×720 base resolution.
     * @private
     */
    _posicionarIconosEnFila() {
        // =============================================
        // Fixed UX image: 1600×200 for 1080×720 base
        // =============================================
        const uxAncho = 1000;
        const uxAlto = 160;
        const uxX = 40;       // (1080 - 1000) / 2
        const uxY = 560;      // 720 - 160

        // Centros de cada slot como % del ancho de la imagen UX
        const slotCentros = [0.320, 0.399, 0.477, 0.555, 0.629, 0.704];

        const ancho = 70;  // Icon container width
        const alto = 70;   // Icon container height

        const grupos = [
            this.tiempo, this.cohetes, this.escudo,
            this.ulti, this.propul, this.deborador,
        ];

        for (let i = 0; i < grupos.length; i++) {
            const g = grupos[i];
            if (!g || !g.marco) continue;

            // Centro del slot en píxeles de pantalla (1080×720 base)
            const cx = uxX + uxAncho * slotCentros[i];
            // cy: 560 + 160*0.50 + 34 = 674
            const cy = 674;

            // Posición de la esquina superior-izquierda
            const x = cx - ancho / 2;
            const y = cy - alto / 2;

            // Marco exterior (borde azul)
            g.marco.clear();
            g.marco.lineStyle(4, 0x0044CC, 1);
            g.marco.drawRect(0, 0, ancho, alto);
            g.marco.x = x;
            g.marco.y = y;
            g.marco.zIndex = 0;

            // Fondo blanco
            g.fondo.clear();
            g.fondo.beginFill(0xFFFFFF);
            g.fondo.lineStyle(5, 0x0044CC, 1);
            g.fondo.drawRect(0, 0, ancho - 8, alto - 8);
            g.fondo.endFill();
            g.fondo.x = x + 4;
            g.fondo.y = y + 4;
            g.fondo.zIndex = 1;

            // Icono centrado
            if (g.icono) {
                g.icono.width = ancho * 0.65;
                g.icono.height = alto * 0.65;
                g.icono.x = cx;
                g.icono.y = cy;
                g.icono.zIndex = 2;
            }
        }
    }

    // ========================================================================
    // UTILIDADES: CARGA DE TEXTURAS
    // ========================================================================

    /**
     * Crea una textura placeholder VISIBLE (gris oscuro) que se puede ver
     * sobre el fondo blanco del HUD. Esto evita el problema de iconos
     * invisibles cuando PIXI.Texture.WHITE se usa sobre fondo blanco.
     * @private
     */
    _crearTexturaPlaceholder() {
        const g = new PIXI.Graphics();
        g.beginFill(0x3344AA); // Azul oscuro visible sobre fondo blanco
        g.lineStyle(2, 0x0044CC, 1);
        g.drawRect(0, 0, 32, 32);
        g.endFill();
        return this.app.renderer.generateTexture(g);
    }

    async _cargarTexturaIcono(nombre, path, sprite, ancho, alto) {
        try {
            const tex = await PIXI.Assets.load(path);
            if (tex && sprite) {
                sprite.texture = tex;
                if (alto) sprite.height = alto;
            }
        } catch (e) {
            // Si falla la carga, usar textura placeholder visible
            if (sprite) {
                sprite.texture = this._crearTexturaPlaceholder();
                if (alto) sprite.height = alto;
            }
        }
    }

    // ========================================================================
    // ACTUALIZACIÓN (se llama cada frame desde el game loop)
    // ========================================================================

    actualizar() {
        if (!this.inicializado) return;
        // Si el contenedor no está en el stage, no hacer nada
        if (!this.container || !this.container.parent) return;

        // Cada actualizador protegido con try-catch para que un error
        // individual no detenga el game loop (congelaría el juego)
        const actualizadores = [
            () => this._actualizarPanelOleada(),
            () => this._actualizarPuntuacion(),
            () => this._actualizarBarraAceleracion(),
            () => this._actualizarIconoEscudo(),
            () => this._actualizarIconoUlti(),
            () => this._actualizarIconoTiempo(),
            () => this._actualizarContadorDevorador(),
        ];

        for (const fn of actualizadores) {
            try {
                fn();
            } catch (e) {
                // Silenciar errores individuales para no detener el game loop
            }
        }
    }

    _actualizarPanelOleada() {
        if (this.oleadaText && this.game) {
            const faltantes = this.game.objetivoOleada - this.game.asteroidesDestruidos;
            const cantidadPBOids = this.game.particulasBoid ? this.game.particulasBoid.length : 0;
            this.oleadaText.text =
                `Oleada: ${this.game.contadorOleadas} | ` +
                `Faltan: ${faltantes} | ` +
                `Ast: ${this.game.intervaloSpawn.toFixed(1)}s | ` +
                `Naves: ${this.game.intervaloNaveEnemiga.toFixed(1)}s | ` +
                `PBOids: ${cantidadPBOids}`;
        }
    }

    _actualizarPuntuacion() {
        if (this.puntuacionText && this.game) {
            this.puntuacionText.text = this.game.puntuacion.toString();
        }
    }

    _actualizarBarraAceleracion() {
        if (!this.barraAceleracionFill || !this.game || !this.game.jugador) return;

        const jugador = this.game.jugador;
        const porcentaje = Math.max(0, Math.min(100, jugador.cargaAceleracion));
        const anchoMax = this._anchoBarraAceleracion || 100;
        const alto = this._altoBarraAceleracion || 20;

        this.barraAceleracionFill.clear();
        if (jugador.sobrecalentadoAceleracion) {
            this.barraAceleracionFill.beginFill(0xCC0000);
        } else {
            this.barraAceleracionFill.beginFill(0x0044CC);
        }
        this.barraAceleracionFill.drawRect(0, 0, (porcentaje / 100) * anchoMax, alto);
        this.barraAceleracionFill.endFill();

        // Cambiar color del borde también
        this.barraAceleracionBg.clear();
        this.barraAceleracionBg.beginFill(0xFFFFFF);
        this.barraAceleracionBg.lineStyle(2, jugador.sobrecalentadoAceleracion ? 0xCC0000 : 0x0044CC, 1);
        this.barraAceleracionBg.drawRect(0, 0, anchoMax, alto);
        this.barraAceleracionBg.endFill();
    }

    _actualizarIconoEscudo() {
        if (!this.escudo.icono || !this.game || !this.game.jugador) return;
        if (this.escudo.sprites.length < 5) return;

        const jugador = this.game.jugador;
        const porcentajeEscudos = jugador.escudos;
        const huboImpacto = porcentajeEscudos < this._escudosAnterior && !jugador.sobrecalentado;

        let indiceIcono;
        let colorMarco = 0x0044CC;

        if (jugador.sobrecalentado) {
            // Animación entre escudo4 y escudo5
            const tiempo = Date.now();
            indiceIcono = Math.floor(tiempo / 200) % 2 + 4;
            colorMarco = 0xCC0000;
        } else {
            if (porcentajeEscudos > 60) indiceIcono = 1;
            else if (porcentajeEscudos > 30) indiceIcono = 2;
            else indiceIcono = 3;
            if (huboImpacto) colorMarco = 0xFFFFFF;
        }

        this.escudo.icono.texture = this.escudo.sprites[indiceIcono - 1];

        // Actualizar marco (fixed 85×73 for 1080×720 base)
        this.escudo.marco.clear();
        this.escudo.marco.lineStyle(4, colorMarco, 1);
        this.escudo.marco.drawRect(0, 0, 70, 70);

        this._escudosAnterior = porcentajeEscudos;
    }

    _actualizarIconoUlti() {
        if (!this.ulti.icono || !this.game || !this.game.jugador) return;
        if (this.ulti.sprites.length < 5) return;

        const jugador = this.game.jugador;
        const porcentajeCarga = Math.min(100, (jugador.cargaUlti / jugador.cargaMaxUlti) * 100);

        let indiceIcono;
        let alpha = 1.0;
        let colorMarco = 0x0044CC;

        if (jugador.ultiListo) {
            const tiempo = Date.now();
            indiceIcono = Math.floor(tiempo / 200) % 3 + 3;
            // Efecto de parpadeo cuando está listo
            alpha = 0.7 + Math.sin(tiempo / 200) * 0.3;
            // Marco dorado pulsante cuando listo
            colorMarco = 0xFFD700;
        } else {
            indiceIcono = Math.floor(porcentajeCarga / 20) + 1;
            if (indiceIcono < 1) indiceIcono = 1;
            if (indiceIcono > 5) indiceIcono = 5;
        }

        this.ulti.icono.texture = this.ulti.sprites[indiceIcono - 1];
        this.ulti.icono.alpha = alpha;

        // Actualizar marco (fixed 85×73 for 1080×720 base)
        this.ulti.marco.clear();
        this.ulti.marco.lineStyle(4, colorMarco, 1);
        this.ulti.marco.drawRect(0, 0, 70, 70);
    }

    /**
     * Actualiza el icono de Tiempo Fuera (reloj animado durante sobrecalentamiento).
     * Cuando el jugador está sobrecalentado, se activa la pasiva:
     * - Anima frames del reloj (relog1-6, frame 7 = relog6 rotado π)
     * - Parpadea el marco entre blanco y gris
     * Al terminar: regenera escudos y resetea.
     *
     * Referencia: GameSkills.js actualizarTiempoFuera()
     */
    _actualizarIconoTiempo() {
        if (!this.tiempo.icono || !this.game || !this.game.jugador) return;

        const jugador = this.game.jugador;

        // Activar cuando entra en sobrecalentamiento (solo una vez)
        if (jugador.sobrecalentado && !this.game.tiempoFueroActivo) {
            this.game.tiempoFueroActivo = true;
            this.game.timerTiempoFuera = 0;
        }

        // Verificar duración de la habilidad
        if (this.game.tiempoFueroActivo) {
            this.game.timerTiempoFuera += 1 / 60; // delta ~1 frame a 60fps

            if (this.game.timerTiempoFuera >= this.game.duracionTiempoFuera) {
                // Terminó: regenerar escudos
                const regeneracionBase = 10;
                const regeneracionBonus = this.game.regeneracionTiempoFueraBonus || 0;
                jugador.agregarEscudos(regeneracionBase + regeneracionBonus);

                // Resetear
                this.game.tiempoFueroActivo = false;
                this.game.timerTiempoFuera = 0;
                this.game.relojFrameActual = 1;
                this.game.timerAnimacionReloj = 0;
                return;
            }
        }

        // Si está activo y sobrecalentado: animar
        if (jugador.sobrecalentado && this.game.tiempoFueroActivo && this.tiempo.sprites.length >= 6) {
            // Avanzar frame del reloj
            this.game.timerAnimacionReloj += 1 / 60;

            if (this.game.timerAnimacionReloj >= this.game.intervaloAnimacionReloj) {
                this.game.timerAnimacionReloj = 0;
                this.game.relojFrameActual++;

                if (this.game.relojFrameActual > 7) {
                    this.game.relojFrameActual = 1;
                }
            }

            // Aplicar textura y rotación
            if (this.game.relojFrameActual === 7) {
                // Frame 7: relog6 rotado 360° (π radianes en PixiJS)
                this.tiempo.icono.texture = this.tiempo.sprites[5]; // relog6
                this.tiempo.icono.rotation = Math.PI;
            } else {
                this.tiempo.icono.texture = this.tiempo.sprites[this.game.relojFrameActual - 1];
                this.tiempo.icono.rotation = 0;
            }

            // Parpadeo del marco: blanco / gris
            const palpito = Math.floor(Date.now() / 300) % 2 === 0;
            const colorBorde = palpito ? 0xFFFFFF : 0xAAAAAA;

            // Fixed marco size for 1080×720 base: 87×67
            this.tiempo.marco.clear();
            this.tiempo.marco.lineStyle(4, colorBorde, 1);
            this.tiempo.marco.drawRect(0, 0, 70, 70);

            this.tiempo.fondo.clear();
            this.tiempo.fondo.beginFill(0xFFFFFF);
            this.tiempo.fondo.lineStyle(5, colorBorde, 1);
            this.tiempo.fondo.drawRect(0, 0, 62, 62);
            this.tiempo.fondo.endFill();
        } else {
            // Estado normal: marco azul, frame inicial
            if (this.game.tiempoFueroActivo) {
                this.game.relojFrameActual = 1;
                this.game.timerAnimacionReloj = 0;
                this.game.timerTiempoFuera = 0;
                this.game.tiempoFueroActivo = false;
            }

            // Restaurar marco azul normal
            this.tiempo.marco.clear();
            this.tiempo.marco.lineStyle(4, 0x0044CC, 1);
            this.tiempo.marco.drawRect(0, 0, 70, 70);

            this.tiempo.fondo.clear();
            this.tiempo.fondo.beginFill(0xFFFFFF);
            this.tiempo.fondo.lineStyle(5, 0x0044CC, 1);
            this.tiempo.fondo.drawRect(0, 0, 62, 62);
            this.tiempo.fondo.endFill();

            // Textura estática
            this.tiempo.icono.texture = this._texturaIconoTiempo || PIXI.Texture.WHITE;
            this.tiempo.icono.rotation = 0;
        }
    }

    _actualizarContadorDevorador() {
        if (!this.contadorDevoradorText || !this.game) return;
        const cantidad = this.game.particulasCapturadas || 0;
        this.contadorDevoradorText.text = cantidad.toString();
    }

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    /**
     * Maneja el redimensionado de la ventana.
     * Solo recalcula la escala del contenedor; no recrea elementos.
     */
    onResize() {
        this._calcularEscala();
    }

    /**
     * Elimina el HUD del stage y libera recursos
     */
    destruir() {
        if (this.container) {
            this.container.removeFromParent();
            this.container.destroy({ children: true });
        }
        this.inicializado = false;
    }
}
