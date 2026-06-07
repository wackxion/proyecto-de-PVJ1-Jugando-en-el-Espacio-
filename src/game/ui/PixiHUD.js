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
        this.tiempo = { marco: null, fondo: null, icono: null };
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
            this._calcularVmin();
            this._inicializar();
        });
    }

    /**
     * Calcula vmin basado en el tamaño actual de la pantalla
     * @private
     */
    _calcularVmin() {
        let w = this.app.screen.width;
        let h = this.app.screen.height;
        // Si la pantalla aún no tiene tamaño, usar el viewport como fallback
        if (!w || !h) {
            w = window.innerWidth || 1920;
            h = window.innerHeight || 1080;
        }
        this._vmin = Math.min(w, h) / 100;
    }

    /**
     * Convierte vmin a píxeles
     * @param {number} vmin - Valor en vmin
     * @returns {number} Valor en píxeles
     * @private
     */
    _v(vmin) {
        return vmin * this._vmin;
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
        this.tiempo = { marco: null, fondo: null, icono: null };
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

        // Re-calcular vmin y crear elementos
        this._calcularVmin();
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
            const anchoMax = 2000;
            const anchoCalc = this.app.screen.width * 0.8;
            const ancho = Math.min(anchoMax, anchoCalc);
            const alto = this.app.screen.height * 0.2;
            this.uxImage.width = ancho;
            this.uxImage.height = alto;
            this.uxImage.anchor.set(0.5, 1); // Para usar bottom: 0 con translateX(-50%)
            this.uxImage.x = this.app.screen.width / 2;
            this.uxImage.y = this.app.screen.height;
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

        const tamanoMarco = this._v(10);  // border
        const anchoFondo = this._v(9.9);
        const altoFondo = this._v(7.9);
        const anchoIcono = this._v(8);
        const bottom = this._v(2.3);
        const leftPorcentaje = 48.9;

        const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        const xIzquierda = xCentro - this._v(20); // translateX(-200%) = 2 * 10vmin
        const yBottom = this.app.screen.height - bottom;

        // Marco exterior
        this.cohetes.marco = new PIXI.Graphics();
        this.cohetes.marco.lineStyle(4, 0x0044CC, 1);
        this.cohetes.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        this.cohetes.marco.x = xIzquierda;
        this.cohetes.marco.y = yBottom;
        this.container.addChild(this.cohetes.marco);

        // Fondo blanco con borde azul
        this.cohetes.fondo = new PIXI.Graphics();
        this.cohetes.fondo.beginFill(0xFFFFFF);
        this.cohetes.fondo.lineStyle(5, 0x0044CC, 1);
        this.cohetes.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.cohetes.fondo.endFill();
        this.cohetes.fondo.x = xIzquierda + 4;
        this.cohetes.fondo.y = yBottom + 4;
        this.container.addChild(this.cohetes.fondo);

        // Icono
        this.cohetes.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.cohetes.icono.anchor.set(0.5);
        this.cohetes.icono.x = xIzquierda + (anchoFondo + 8) / 2;
        this.cohetes.icono.y = yBottom + (altoFondo + 8) / 2;
        this.cohetes.icono.width = anchoIcono;
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

        const anchoFondo = this._v(9.9);
        const altoFondo = this._v(7.9);
        const anchoIcono = this._v(5);
        const bottom = this._v(2.3);
        const leftPorcentaje = 44;

        const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        const xIzquierda = xCentro - this._v(30); // translateX(-300%) = 3 * 10vmin
        const yBottom = this.app.screen.height - bottom;

        // Marco exterior
        this.tiempo.marco = new PIXI.Graphics();
        this.tiempo.marco.lineStyle(5, 0x0044CC, 1);
        this.tiempo.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        this.tiempo.marco.x = xIzquierda;
        this.tiempo.marco.y = yBottom;
        this.container.addChild(this.tiempo.marco);

        // Fondo blanco con borde azul
        this.tiempo.fondo = new PIXI.Graphics();
        this.tiempo.fondo.beginFill(0xFFFFFF);
        this.tiempo.fondo.lineStyle(5, 0x0044CC, 1);
        this.tiempo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.tiempo.fondo.endFill();
        this.tiempo.fondo.x = xIzquierda + 5;
        this.tiempo.fondo.y = yBottom + 5;
        this.container.addChild(this.tiempo.fondo);

        // Icono
        this.tiempo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.tiempo.icono.anchor.set(0.5);
        this.tiempo.icono.x = xIzquierda + (anchoFondo + 10) / 2;
        this.tiempo.icono.y = yBottom + (altoFondo + 10) / 2;
        this.tiempo.icono.width = anchoIcono;
        this._cargarTexturaIcono('tiempo', 'assets/tiempo fuera.png', this.tiempo.icono, anchoIcono, null);
    }

    // ========================================================================
    // 4. ICONO DE ESCUDO
    // ========================================================================

    _crearEscudo() {
        // HTML marco: position: absolute; bottom: 5.1vmin; left: 49%;
        //           transform: translateX(-200%); border: 5px solid #0044CC;
        // HTML fondo: width: 9.9vmin; height: 7.9vmin; background: white;
        // HTML icono: width: 8vmin; height: 6vmin;

        const anchoFondo = this._v(9.9);
        const altoFondo = this._v(7.9);
        const anchoIcono = this._v(8);
        const altoIcono = this._v(6);
        const bottom = this._v(5.1);
        const leftPorcentaje = 49;

        const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        const xIzquierda = xCentro - this._v(20); // translateX(-200%) = 2 * 10vmin
        const yBottom = this.app.screen.height - bottom;

        // Marco exterior
        this.escudo.marco = new PIXI.Graphics();
        this.escudo.marco.lineStyle(5, 0x0044CC, 1);
        this.escudo.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        this.escudo.marco.x = xIzquierda;
        this.escudo.marco.y = yBottom;
        this.container.addChild(this.escudo.marco);

        // Fondo blanco con borde azul
        this.escudo.fondo = new PIXI.Graphics();
        this.escudo.fondo.beginFill(0xFFFFFF);
        this.escudo.fondo.lineStyle(5, 0x0044CC, 1);
        this.escudo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.escudo.fondo.endFill();
        this.escudo.fondo.x = xIzquierda + 5;
        this.escudo.fondo.y = yBottom + 5;
        this.container.addChild(this.escudo.fondo);

        // Icono (sprite que cambiará de textura)
        this.escudo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.escudo.icono.anchor.set(0.5);
        this.escudo.icono.x = xIzquierda + (anchoFondo + 10) / 2;
        this.escudo.icono.y = yBottom + (altoFondo + 10) / 2;
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

        const anchoMarco = this._v(9.9);
        const altoMarco = this._v(7.9);
        const anchoFondo = this._v(9);
        const altoFondo = this._v(7);
        const anchoIcono = this._v(6);
        const altoIcono = this._v(7);
        const bottom = this._v(1.7);
        const leftPorcentaje = 46.8;

        const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        const xIzquierda = xCentro + this._v(10); // translateX(100%) = 1 * 10vmin
        const yBottom = this.app.screen.height - bottom;

        // Marco (sin borde, es solo un contenedor)
        this.ulti.marco = new PIXI.Graphics();
        this.ulti.marco.beginFill(0x000000, 0); // Transparente
        this.ulti.marco.drawRect(0, 0, anchoMarco, altoMarco);
        this.ulti.marco.endFill();
        this.ulti.marco.x = xIzquierda;
        this.ulti.marco.y = yBottom;
        this.container.addChild(this.ulti.marco);

        // Fondo blanco
        this.ulti.fondo = new PIXI.Graphics();
        this.ulti.fondo.beginFill(0xFFFFFF);
        this.ulti.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.ulti.fondo.endFill();
        this.ulti.fondo.x = xIzquierda + (anchoMarco - anchoFondo) / 2;
        this.ulti.fondo.y = yBottom + (altoMarco - altoFondo) / 2;
        this.container.addChild(this.ulti.fondo);

        // Icono
        this.ulti.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.ulti.icono.anchor.set(0.5);
        this.ulti.icono.x = xIzquierda + anchoMarco / 2;
        this.ulti.icono.y = yBottom + altoMarco - altoIcono / 2 - this._v(1);
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

        const anchoFondo = this._v(9.7);
        const altoFondo = this._v(7.9);
        const anchoIcono = this._v(8);
        const bottom = this._v(2);
        const leftPorcentaje = 48.9;

        const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        const xIzquierda = xCentro + this._v(20); // translateX(200%) = 2 * 10vmin
        const yBottom = this.app.screen.height - bottom;

        // Marco exterior
        this.propul.marco = new PIXI.Graphics();
        this.propul.marco.lineStyle(4, 0x0044CC, 1);
        this.propul.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        this.propul.marco.x = xIzquierda;
        this.propul.marco.y = yBottom;
        this.container.addChild(this.propul.marco);

        // Fondo blanco
        this.propul.fondo = new PIXI.Graphics();
        this.propul.fondo.beginFill(0xFFFFFF);
        this.propul.fondo.lineStyle(5, 0x0044CC, 1);
        this.propul.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.propul.fondo.endFill();
        this.propul.fondo.x = xIzquierda + 4;
        this.propul.fondo.y = yBottom + 4;
        this.container.addChild(this.propul.fondo);

        // Icono
        this.propul.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.propul.icono.anchor.set(0.5);
        this.propul.icono.x = xIzquierda + (anchoFondo + 8) / 2;
        this.propul.icono.y = yBottom + (altoFondo + 8) / 2;
        this.propul.icono.width = anchoIcono;
        this._cargarTexturaIcono('propul', 'assets/propulsor.png', this.propul.icono, anchoIcono, null);
    }

    // ========================================================================
    // 7. ICONO DE DEBORADOR (E)
    // ========================================================================

    _crearDevorador() {
        // HTML marco: position: absolute; bottom: 1.9vmin; left: 50%;
        //           transform: translateX(300%); border: 4px solid #0044CC;
        // HTML fondo: width: 9.9vmin; height: 7.9vmin; background: white;
        // HTML icono: width: 8vmin; height: auto;

        const anchoFondo = this._v(9.9);
        const altoFondo = this._v(7.9);
        const anchoIcono = this._v(8);
        const bottom = this._v(1.9);
        const leftPorcentaje = 50;

        const xCentro = (leftPorcentaje / 100) * this.app.screen.width;
        const xIzquierda = xCentro + this._v(30); // translateX(300%) = 3 * 10vmin
        const yBottom = this.app.screen.height - bottom;

        // Marco exterior
        this.deborador.marco = new PIXI.Graphics();
        this.deborador.marco.lineStyle(4, 0x0044CC, 1);
        this.deborador.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        this.deborador.marco.x = xIzquierda;
        this.deborador.marco.y = yBottom;
        this.container.addChild(this.deborador.marco);

        // Fondo blanco
        this.deborador.fondo = new PIXI.Graphics();
        this.deborador.fondo.beginFill(0xFFFFFF);
        this.deborador.fondo.lineStyle(5, 0x0044CC, 1);
        this.deborador.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.deborador.fondo.endFill();
        this.deborador.fondo.x = xIzquierda + 4;
        this.deborador.fondo.y = yBottom + 4;
        this.container.addChild(this.deborador.fondo);

        // Icono
        this.deborador.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.deborador.icono.anchor.set(0.5);
        this.deborador.icono.x = xIzquierda + (anchoFondo + 8) / 2;
        this.deborador.icono.y = yBottom + (altoFondo + 8) / 2;
        this.deborador.icono.width = anchoIcono;
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
            fontSize: Math.max(12, this._v(2.5)),
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 2,
            dropShadowBlur: 4
        });
        this.contadorDevoradorText.x = (70.5 / 100) * this.app.screen.width;
        this.contadorDevoradorText.y = this.app.screen.height - this._v(3.2) - this.contadorDevoradorText.height;
        this.container.addChild(this.contadorDevoradorText);
    }

    // ========================================================================
    // 10. BARRA DE ACELERACIÓN (W)
    // ========================================================================

    _crearBarraAceleracion() {
        // HTML: position: absolute; bottom: 11.9vmin; left: 50%;
        //      transform: translateX(-50%); width: min(190, width * 0.3)px;
        // #bg: width: 100%; height: 2.5vmin; background: white; border: 2px solid #0044CC;
        // #fill: width: 0%; height: 100%; background: #0044CC;

        const anchoMax = 190;
        const anchoCalc = this.app.screen.width * 0.3;
        const ancho = Math.min(anchoMax, anchoCalc);
        const alto = this._v(2.5);
        const bottom = this._v(11.9);

        const xCentro = this.app.screen.width / 2;
        const yBottom = this.app.screen.height - bottom;

        // Fondo (borde azul + relleno blanco)
        this.barraAceleracionBg = new PIXI.Graphics();
        this.barraAceleracionBg.beginFill(0xFFFFFF);
        this.barraAceleracionBg.lineStyle(2, 0x0044CC, 1);
        this.barraAceleracionBg.drawRect(0, 0, ancho, alto);
        this.barraAceleracionBg.endFill();
        this.barraAceleracionBg.x = xCentro - ancho / 2;
        this.barraAceleracionBg.y = yBottom;
        this.container.addChild(this.barraAceleracionBg);

        // Relleno (azul)
        this.barraAceleracionFill = new PIXI.Graphics();
        this.barraAceleracionFill.beginFill(0x0044CC);
        this.barraAceleracionFill.drawRect(0, 0, 0, alto); // Empieza en 0
        this.barraAceleracionFill.endFill();
        this.barraAceleracionFill.x = xCentro - ancho / 2;
        this.barraAceleracionFill.y = yBottom;
        this.container.addChild(this.barraAceleracionFill);

        this._anchoBarraAceleracion = ancho;
        this._altoBarraAceleracion = alto;
    }

    // ========================================================================
    // 11. PANEL DE PUNTUACIÓN
    // ========================================================================

    _crearPanelPuntuacion() {
        // HTML panel: position: absolute; bottom: 11.6vmin; left: 41.7%;
        //            transform: translateX(-50%); background: white;
        //            border: 3px solid #0044CC; padding: 2px 50px;
        // #value: color: #0044CC; font-family: 'Segoe Script'; font-size: 18px;
        //         text-shadow: 0 0 10px #0044CC;

        this.puntuacionText = new PIXI.Text('0', {
            fontFamily: 'Segoe Script, cursive',
            fontSize: 18,
            fill: 0x0044CC,
            fontWeight: 'bold'
        });

        const bottom = this._v(11.6);
        const xCentro = (41.7 / 100) * this.app.screen.width;
        const yBottom = this.app.screen.height - bottom;

        this.puntuacionText.anchor.set(0.5, 1);
        this.puntuacionText.x = xCentro;
        this.puntuacionText.y = yBottom;
        this.container.addChild(this.puntuacionText);
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

        // Actualizar marco
        this.escudo.marco.clear();
        this.escudo.marco.lineStyle(5, colorMarco, 1);
        this.escudo.marco.drawRect(0, 0, this._v(9.9) + 10, this._v(7.9) + 10);

        this._escudosAnterior = porcentajeEscudos;
    }

    _actualizarIconoUlti() {
        if (!this.ulti.icono || !this.game || !this.game.jugador) return;
        if (this.ulti.sprites.length < 5) return;

        const jugador = this.game.jugador;
        const porcentajeCarga = Math.min(100, (jugador.cargaUlti / jugador.cargaMaxUlti) * 100);

        let indiceIcono;
        let alpha = 1.0;

        if (jugador.ultiListo) {
            const tiempo = Date.now();
            indiceIcono = Math.floor(tiempo / 200) % 3 + 3;
            // Efecto de parpadeo cuando está listo
            alpha = 0.7 + Math.sin(tiempo / 200) * 0.3;
        } else {
            indiceIcono = Math.floor(porcentajeCarga / 20) + 1;
            if (indiceIcono < 1) indiceIcono = 1;
            if (indiceIcono > 5) indiceIcono = 5;
        }

        this.ulti.icono.texture = this.ulti.sprites[indiceIcono - 1];
        this.ulti.icono.alpha = alpha;
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
     * Maneja el redimensionado de la ventana
     */
    onResize() {
        // Recalcular vmin y reposicionar elementos
        this._vmin = Math.min(this.app.screen.width, this.app.screen.height) / 100;
        // Destruir y recrear el HUD
        this.destruir();
        this._inicializar();
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
