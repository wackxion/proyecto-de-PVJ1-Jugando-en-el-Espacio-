/**
 * PixiHUD - HUD del juego renderizado en el canvas de PixiJS.
 *
 * Es el ÚNICO HUD in-game: dibuja todos los elementos directamente sobre el
 * canvas (UIManager.js solo maneja los menús/pantallas fuera del canvas).
 * Lee el estado del juego (this.game) en cada frame vía actualizar() y refleja
 * puntuación, oleada, escudos, Ulti, Tiempo Fuera y partículas capturadas.
 *
 * --- LAYOUT ---
 * Los elementos se diseñan en una base FIJA de 1080×720 px y se escalan con
 * `escala = Math.min(w/1080, h/720)`. No es un bloque rígido: se reparten en
 * dos grupos anclados a los bordes REALES de la pantalla (ver _prepararContenedores
 * y _calcularEscala), por lo que el HUD se adapta a cualquier proporción:
 *   - contenedorSuperior → panel de oleada (arriba-izquierda)
 *   - contenedorInferior → imagen UX, 6 iconos de habilidad, barra W,
 *                          puntuación y contador de Boids (abajo-centro)
 *
 * --- ELEMENTOS ---
 * 1. Panel de oleada        7. Devorador (E)
 * 2. Cohetes (Q)            8. Contador de partículas (Boids)
 * 3. Tiempo Fuera (pasiva)  9. Imagen UX (fondo de la barra inferior)
 * 4. Escudo                 10. Barra de aceleración (W)
 * 5. ULTi (S)               11. Panel de puntuación
 * 6. Propulsor (R)
 *
 * --- NOTAS PixiJS v8 ---
 * - `removeFromParent()` (no `removeFromStage()`, deprecado).
 * - `sortableChildren = true` + `zIndex` para ordenar capas (la imagen UX y la
 *   barra W van con zIndex negativo, detrás de los iconos).
 * - La inicialización se difiere un frame (requestAnimationFrame) para que el
 *   canvas ya tenga dimensiones válidas.
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
            this._prepararContenedores();
            this._calcularEscala();
            this._inicializar();
        });
    }

    /**
     * Crea (o recrea) los dos grupos del HUD que se anclan a los bordes
     * reales de la pantalla, de forma independiente de la proporción:
     *  - contenedorSuperior: panel de oleada → arriba-izquierda
     *  - contenedorInferior: iconos, imagen UX, barra W, puntuación, contador → abajo-centro
     * @private
     */
    _prepararContenedores() {
        this.contenedorSuperior = new PIXI.Container();
        this.contenedorSuperior.sortableChildren = true;

        this.contenedorInferior = new PIXI.Container();
        this.contenedorInferior.sortableChildren = true; // respeta zIndex (UX/barra detrás de iconos)

        this.container.addChild(this.contenedorSuperior);
        this.container.addChild(this.contenedorInferior);
    }

    /**
     * Calcula la escala y ANCLA cada grupo del HUD a su borde real de pantalla.
     *
     * El layout interno sigue diseñado en la base fija 1080×720, pero ya no se
     * trata como un bloque rígido: el grupo superior se pega arriba-izquierda y
     * el inferior se pega abajo-centro, así el HUD se adapta a cualquier
     * proporción (horizontal, vertical o cuadrada) igual que el campo de juego.
     * @private
     */
    _calcularEscala() {
        const w = this.app.screen.width || window.innerWidth || 1080;
        const h = this.app.screen.height || window.innerHeight || 720;
        this._escala = Math.min(w / 1080, h / 720);

        // El contenedor raíz no se escala; cada grupo lleva su propia escala
        // y posición ancladas al borde real.
        this.container.scale.set(1);
        this.container.position.set(0, 0);

        if (!this.contenedorSuperior || !this.contenedorInferior) return;

        const margen = 12;

        // Grupo superior (panel de oleada) → arriba-izquierda
        this.contenedorSuperior.scale.set(this._escala);
        this.contenedorSuperior.position.set(margen, margen);

        // Grupo inferior → abajo-centro. Se ancla el punto de diseño
        // (540, 720) = centro-inferior del layout a la coordenada real (w/2, h).
        this.contenedorInferior.scale.set(this._escala);
        this.contenedorInferior.position.set(
            Math.round(w / 2 - 540 * this._escala),
            Math.round(h - 720 * this._escala)
        );
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

        // Recrear los grupos anclados (removeChildren los eliminó), recalcular
        // la escala y volver a crear los elementos
        this._prepararContenedores();
        this._calcularEscala();
        this._inicializar();
    }

    // ========================================================================
    // 1. PANEL DE OLEADA (top-left)
    // ========================================================================

    /**
     * Crea el texto del panel de oleada (esquina superior-izquierda).
     * Se ancla en (0,0) dentro del contenedorSuperior, que lo pega al borde
     * arriba-izquierda. El texto se actualiza cada frame en _actualizarPanelOleada().
     * @private
     */
    _crearPanelOleada() {
        this.oleadaText = new PIXI.Text('Oleada: 1', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fill: 0xFFFFFF
        });
        this.oleadaText.x = 0;  // anclado por el grupo superior (arriba-izquierda)
        this.oleadaText.y = 0;
        this.contenedorSuperior.addChild(this.oleadaText);
    }

    // ========================================================================
    // 9. IMAGEN UX EXPERIMENTAL (bottom center background)
    // ========================================================================

    /**
     * Crea la imagen de fondo de la barra inferior del HUD (la "consola").
     * Dispara la carga asíncrona de la textura. @private
     */
    _crearImagenUX() {
        this._cargarTexturaUX();
    }

    /**
     * Carga la textura de la imagen UX y la posiciona como fondo de la barra
     * inferior: anclada abajo-centro (anchor 0.5,1) en el punto de diseño
     * (540, 720), con zIndex -1 para quedar DETRÁS de los iconos de habilidad.
     * @private
     */
    async _cargarTexturaUX() {
        try {
            const tex = await PIXI.Assets.load('assets/uxExperimental2.png');
            this.uxImage = new PIXI.Sprite(tex);
            // Dimensiones fijas en la base 1080×720
            this.uxImage.width = 1000;
            this.uxImage.height = 160;
            this.uxImage.anchor.set(0.5, 1); // centro-inferior
            this.uxImage.x = 540;  // centro horizontal (1080 / 2)
            this.uxImage.y = 720;  // borde inferior
            this.uxImage.zIndex = -1; // detrás de los iconos
            this.contenedorInferior.addChild(this.uxImage);
        } catch (e) {
            // Si falla la carga, el HUD funciona igual sin la imagen de fondo
        }
    }

    // ========================================================================
    // 2. ICONO DE COHETES (Q)
    // ========================================================================

    /**
     * Crea el icono de la habilidad Cohetes (Q): marco azul + recuadro blanco +
     * sprite del icono. Se dibuja en (0,0); la posición final (en la fila inferior)
     * la asigna _posicionarIconosEnFila(). Este icono es estático (no cambia con el estado).
     * @private
     */
    _crearCohetes() {
        const anchoFondo = 77;  // recuadro blanco interno (base 1080×720)
        const altoFondo = 57;
        const anchoIcono = 55;  // se reajusta luego en _posicionarIconosEnFila()

        // Marco exterior (borde azul)
        this.cohetes.marco = new PIXI.Graphics();
        this.cohetes.marco.lineStyle(4, 0x0044CC, 1);
        this.cohetes.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        this.contenedorInferior.addChild(this.cohetes.marco);

        // Fondo blanco con borde azul
        this.cohetes.fondo = new PIXI.Graphics();
        this.cohetes.fondo.beginFill(0xFFFFFF);
        this.cohetes.fondo.lineStyle(5, 0x0044CC, 1);
        this.cohetes.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.cohetes.fondo.endFill();
        this.contenedorInferior.addChild(this.cohetes.fondo);

        // Icono (placeholder blanco hasta que carga cohetes.png)
        this.cohetes.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.cohetes.icono.anchor.set(0.5);
        this.cohetes.icono.width = anchoIcono;
        this.contenedorInferior.addChild(this.cohetes.icono);
        this._cargarTexturaIcono('cohetes', 'assets/cohetes.png', this.cohetes.icono, anchoIcono, null);
    }

    // ========================================================================
    // 3. ICONO DE TIEMPO FUERA
    // ========================================================================

    /**
     * Crea el icono de la pasiva Tiempo Fuera: marco + recuadro + icono del reloj.
     * Además precarga la textura original (`tiempo fuera.png`) y los 6 sprites del
     * reloj (relog1-6) que usa la animación cuando el jugador está sobrecalentado
     * (ver _actualizarIconoTiempo). Posición final: _posicionarIconosEnFila().
     * @private
     */
    _crearTiempoFuera() {
        const anchoFondo = 77;  // recuadro blanco interno (base 1080×720)
        const altoFondo = 57;
        const anchoIcono = 55;  // se reajusta luego en _posicionarIconosEnFila()

        // Marco exterior (borde azul)
        this.tiempo.marco = new PIXI.Graphics();
        this.tiempo.marco.lineStyle(5, 0x0044CC, 1);
        this.tiempo.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        this.contenedorInferior.addChild(this.tiempo.marco);

        // Fondo blanco con borde azul
        this.tiempo.fondo = new PIXI.Graphics();
        this.tiempo.fondo.beginFill(0xFFFFFF);
        this.tiempo.fondo.lineStyle(5, 0x0044CC, 1);
        this.tiempo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.tiempo.fondo.endFill();
        this.contenedorInferior.addChild(this.tiempo.fondo);

        // Icono (placeholder hasta cargar la textura)
        this.tiempo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.tiempo.icono.anchor.set(0.5);
        this.tiempo.icono.width = anchoIcono;
        this.contenedorInferior.addChild(this.tiempo.icono);

        // Textura estática (reloj base) que se muestra cuando NO está sobrecalentado
        this._cargarTexturaTiempoOriginal(anchoIcono);
        // Sprites de la animación del reloj (relog1-6; el frame 7 = relog6 rotado π)
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

    /**
     * Crea el icono de Escudo: marco + recuadro + icono. Precarga los 5 sprites
     * del escudo (escudo1-5) que _actualizarIconoEscudo() intercambia según el
     * % de escudos del jugador (y la animación de sobrecalentamiento).
     * Posición final: _posicionarIconosEnFila().
     * @private
     */
    _crearEscudo() {
        const anchoFondo = 77;  // recuadro blanco interno (base 1080×720)
        const altoFondo = 57;
        const anchoIcono = 55;  // se reajusta luego en _posicionarIconosEnFila()
        const altoIcono = 41;

        // Marco exterior (borde azul)
        this.escudo.marco = new PIXI.Graphics();
        this.escudo.marco.lineStyle(5, 0x0044CC, 1);
        this.escudo.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        this.contenedorInferior.addChild(this.escudo.marco);

        // Fondo blanco con borde azul
        this.escudo.fondo = new PIXI.Graphics();
        this.escudo.fondo.beginFill(0xFFFFFF);
        this.escudo.fondo.lineStyle(5, 0x0044CC, 1);
        this.escudo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.escudo.fondo.endFill();
        this.contenedorInferior.addChild(this.escudo.fondo);

        // Icono (la textura cambia según el % de escudos)
        this.escudo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.escudo.icono.anchor.set(0.5);
        this.escudo.icono.width = anchoIcono;
        this.escudo.icono.height = altoIcono;
        this.contenedorInferior.addChild(this.escudo.icono);

        this._cargarSpritesEscudo();
    }

    /**
     * Precarga los 5 sprites del escudo (escudo1-5) en this.escudo.sprites.
     * @private
     */
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

    /**
     * Crea el icono de ULTi (S): marco + recuadro + icono. Precarga los 5 sprites
     * (ultiicon1-5) que _actualizarIconoUlti() intercambia según la carga del Ulti
     * (y la animación de "listo"). Posición final: _posicionarIconosEnFila().
     * @private
     */
    _crearUlti() {
        const anchoFondo = 77;  // recuadro blanco interno (base 1080×720)
        const altoFondo = 57;
        const anchoIcono = 41;  // se reajusta luego en _posicionarIconosEnFila()
        const altoIcono = 49;

        // Marco exterior (borde azul, como los demás iconos)
        this.ulti.marco = new PIXI.Graphics();
        this.ulti.marco.lineStyle(5, 0x0044CC, 1);
        this.ulti.marco.drawRect(0, 0, anchoFondo + 10, altoFondo + 10);
        this.contenedorInferior.addChild(this.ulti.marco);

        // Fondo blanco
        this.ulti.fondo = new PIXI.Graphics();
        this.ulti.fondo.beginFill(0xFFFFFF);
        this.ulti.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.ulti.fondo.endFill();
        this.contenedorInferior.addChild(this.ulti.fondo);

        // Icono (la textura cambia según la carga del Ulti)
        this.ulti.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.ulti.icono.anchor.set(0.5);
        this.ulti.icono.width = anchoIcono;
        this.ulti.icono.height = altoIcono;
        this.contenedorInferior.addChild(this.ulti.icono);

        this._cargarSpritesUlti();
    }

    /**
     * Precarga los 5 sprites del Ulti (ultiicon1-5) en this.ulti.sprites.
     * @private
     */
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

    /**
     * Crea el icono de la habilidad Propulsor (R): marco + recuadro + icono.
     * Icono estático. Posición final: _posicionarIconosEnFila().
     * @private
     */
    _crearPropulsor() {
        const anchoFondo = 75;  // recuadro blanco interno (base 1080×720)
        const altoFondo = 57;
        const anchoIcono = 55;  // se reajusta luego en _posicionarIconosEnFila()

        // Marco exterior (borde azul)
        this.propul.marco = new PIXI.Graphics();
        this.propul.marco.lineStyle(4, 0x0044CC, 1);
        this.propul.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        this.contenedorInferior.addChild(this.propul.marco);

        // Fondo blanco
        this.propul.fondo = new PIXI.Graphics();
        this.propul.fondo.beginFill(0xFFFFFF);
        this.propul.fondo.lineStyle(5, 0x0044CC, 1);
        this.propul.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.propul.fondo.endFill();
        this.contenedorInferior.addChild(this.propul.fondo);

        // Icono (placeholder hasta que carga propulsor.png)
        this.propul.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.propul.icono.anchor.set(0.5);
        this.propul.icono.width = anchoIcono;
        this.contenedorInferior.addChild(this.propul.icono);
        this._cargarTexturaIcono('propul', 'assets/propulsor.png', this.propul.icono, anchoIcono, null);
    }

    // ========================================================================
    // 7. ICONO DE DEBORADOR (E)
    // ========================================================================

    /**
     * Crea el icono de la habilidad Devorador (E): marco + recuadro + icono.
     * Icono estático. Posición final: _posicionarIconosEnFila().
     * @private
     */
    _crearDevorador() {
        const anchoFondo = 77;  // recuadro blanco interno (base 1080×720)
        const altoFondo = 57;
        const anchoIcono = 55;  // se reajusta luego en _posicionarIconosEnFila()

        // Marco exterior (borde azul)
        this.deborador.marco = new PIXI.Graphics();
        this.deborador.marco.lineStyle(4, 0x0044CC, 1);
        this.deborador.marco.drawRect(0, 0, anchoFondo + 8, altoFondo + 8);
        this.contenedorInferior.addChild(this.deborador.marco);

        // Fondo blanco
        this.deborador.fondo = new PIXI.Graphics();
        this.deborador.fondo.beginFill(0xFFFFFF);
        this.deborador.fondo.lineStyle(5, 0x0044CC, 1);
        this.deborador.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        this.deborador.fondo.endFill();
        this.contenedorInferior.addChild(this.deborador.fondo);

        // Icono (placeholder hasta que carga deborador.png)
        this.deborador.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.deborador.icono.anchor.set(0.5);
        this.deborador.icono.width = anchoIcono;
        this.contenedorInferior.addChild(this.deborador.icono);
        this._cargarTexturaIcono('deborador', 'assets/deborador.png', this.deborador.icono, anchoIcono, null);
    }

    // ========================================================================
    // 8. CONTADOR DEL DEBORADOR
    // ========================================================================

    /**
     * Crea el contador de partículas Boid capturadas (a la derecha de la fila
     * de iconos). El número se actualiza cada frame en _actualizarContadorDevorador().
     * @private
     */
    _crearContadorDevorador() {
        this.contadorDevoradorText = new PIXI.Text('0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 18,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 2,
            dropShadowBlur: 4
        });
        // Posición fija en la base 1080×720 (a la derecha de la fila de iconos)
        this.contadorDevoradorText.x = 811;
        this.contadorDevoradorText.y = 720 - 23 - this.contadorDevoradorText.height;
        this.contenedorInferior.addChild(this.contadorDevoradorText);
    }

    // ========================================================================
    // 10. BARRA DE ACELERACIÓN (W)
    // ========================================================================

    /**
     * Crea la barra de aceleración (W): un fondo blanco/borde azul fijo y un
     * relleno azul cuyo ancho se actualiza en _actualizarBarraAceleracion()
     * según la carga (se pone rojo al sobrecalentar). Va con zIndex -2, detrás
     * de la imagen UX. Posición fija en la base 1080×720.
     * @private
     */
    _crearBarraAceleracion() {
        const ancho = 120;
        const alto = 18;
        const x = 470;  // centrada bajo la imagen UX (1080/2 - ancho/2 - 10)
        const y = 607;

        // Fondo (borde azul + relleno blanco) - detrás de la imagen UX
        this.barraAceleracionBg = new PIXI.Graphics();
        this.barraAceleracionBg.beginFill(0xFFFFFF);
        this.barraAceleracionBg.lineStyle(2, 0x0044CC, 1);
        this.barraAceleracionBg.drawRect(0, 0, ancho, alto);
        this.barraAceleracionBg.endFill();
        this.barraAceleracionBg.x = x;
        this.barraAceleracionBg.y = y;
        this.barraAceleracionBg.zIndex = -2;
        this.contenedorInferior.addChild(this.barraAceleracionBg);

        // Relleno (azul) - detrás de la imagen UX
        this.barraAceleracionFill = new PIXI.Graphics();
        this.barraAceleracionFill.beginFill(0x0044CC);
        this.barraAceleracionFill.drawRect(0, 0, 0, alto);
        this.barraAceleracionFill.endFill();
        this.barraAceleracionFill.x = x;
        this.barraAceleracionFill.y = y;
        this.barraAceleracionFill.zIndex = -2;
        this.contenedorInferior.addChild(this.barraAceleracionFill);

        this._anchoBarraAceleracion = ancho;
        this._altoBarraAceleracion = alto;
    }

    // ========================================================================
    // 11. PANEL DE PUNTUACIÓN
    // ========================================================================

    /**
     * Crea el panel de puntuación: un recuadro blanco con borde azul y el número
     * de puntos encima (fuente manuscrita). El valor se actualiza cada frame en
     * _actualizarPuntuacion(). Posición fija en la base 1080×720.
     * @private
     */
    _crearPanelPuntuacion() {
        this.puntuacionText = new PIXI.Text('0', {
            fontFamily: 'Segoe Script, cursive',
            fontSize: 16,
            fill: 0x0044CC,
            fontWeight: 'bold'
        });

        // Posición fija (base 1080×720): recuadro 90×26 sobre la imagen UX
        const scoreBgX = 383;
        const scoreBgY = 603;
        const textX = (41.7 / 100) * 1080 - 17;
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
        this.contenedorInferior.addChild(this.scoreBg);

        this.puntuacionText.anchor.set(0.5, 1);
        this.puntuacionText.x = textX;
        this.puntuacionText.y = textY;
        this.contenedorInferior.addChild(this.puntuacionText);
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
     * Layout calculado sobre la resolución base fija de 1080×720; el escalado
     * a la pantalla real lo aplica el contenedor padre (ver _calcularEscala).
     * @private
     */
    _posicionarIconosEnFila() {
        // Dimensiones/posición de la imagen UX (base 1080×720) para alinear cada icono a su slot
        const uxAncho = 1000;
        const uxAlto = 160;
        const uxX = 40;       // (1080 - 1000) / 2
        const uxY = 560;      // 720 - 160

        // Centros de cada slot como % del ancho de la imagen UX
        const slotCentros = [0.320, 0.399, 0.477, 0.555, 0.629, 0.704];

        const ancho = 70;  // ancho del contenedor de cada icono
        const alto = 70;   // alto del contenedor de cada icono

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

    /**
     * Carga la textura de un icono y se la aplica al sprite. Si la carga falla,
     * usa una textura placeholder visible (azul) para que el icono no quede invisible.
     * @param {string} nombre - Nombre del icono (informativo)
     * @param {string} path - Ruta del archivo de textura
     * @param {PIXI.Sprite} sprite - Sprite destino
     * @param {number} ancho - Ancho a aplicar
     * @param {number|null} alto - Alto a aplicar (null = mantener proporción)
     * @private
     */
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

    /**
     * Actualiza el HUD; se llama UNA vez por frame desde el game loop.
     * Refresca cada elemento leyendo el estado actual del juego (this.game).
     * Cada actualizador va envuelto en try-catch para que un error individual
     * no congele el game loop.
     * @public
     */
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

    /** Refresca el texto de oleada (nº de oleada, asteroides faltantes, intervalos de spawn y Boids en pantalla). @private */
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

    /** Refresca el número de puntuación con game.puntuacion. @private */
    _actualizarPuntuacion() {
        if (this.puntuacionText && this.game) {
            this.puntuacionText.text = this.game.puntuacion.toString();
        }
    }

    /**
     * Ajusta el ancho del relleno de la barra de aceleración (W) según
     * jugador.cargaAceleracion (0-100%) y lo pinta rojo si está sobrecalentado,
     * azul si no. @private
     */
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

    /**
     * Actualiza el icono de escudo según el estado del jugador:
     * - Normal: elige sprite 1/2/3 según el % de escudos (>60 / >30 / resto),
     *   y pone el marco blanco un frame si justo recibió impacto.
     * - Sobrecalentado: anima entre escudo4 y escudo5 con marco rojo.
     * Guarda el % en this._escudosAnterior para detectar el impacto del próximo frame.
     * @private
     */
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

        // Redibujar el marco 70×70 (base 1080×720) con el color según estado
        this.escudo.marco.clear();
        this.escudo.marco.lineStyle(4, colorMarco, 1);
        this.escudo.marco.drawRect(0, 0, 70, 70);

        this._escudosAnterior = porcentajeEscudos;
    }

    /**
     * Actualiza el icono de la ULTi según su carga:
     * - Cargando: elige sprite 1-5 proporcional al % de carga (cargaUlti/cargaMaxUlti).
     * - Lista (ultiListo): anima entre los sprites 3-5, parpadea el alpha y
     *   pinta el marco dorado pulsante para avisar que se puede usar.
     * @private
     */
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

        // Redibujar el marco 70×70 (base 1080×720) con el color según estado
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

            // Marco 70×70 + fondo 62×62 (base 1080×720) parpadeando blanco/gris
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

    /** Refresca el contador de partículas capturadas por el Devorador (game.particulasCapturadas). @private */
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
