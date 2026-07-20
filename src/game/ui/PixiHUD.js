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
        // El stage debe ser interactivo para que los clics lleguen a los iconos
        // de mejora del HUD (botones de compra). Antes lo activaba la ventana de
        // mejoras vieja (ya deshabilitada), así que lo aseguramos acá.
        this.app.stage.eventMode = 'static';

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
        // Placeholders (cuadrantes sin icono todavía; se dibujan vacíos)
        this.proyectil = { marco: null, fondo: null, icono: null };
        this.nuevo = { marco: null, fondo: null, icono: null };

        // Contenedores laterales (rediseño del HUD): columnas de cuadrantes de
        // habilidades ancladas a los bordes izquierdo y derecho.
        this.contenedorIzq = null;
        this.contenedorDer = null;
        // Despliegue: 0 = recogido (solo el cuadrado en el borde), 1 = desplegado
        // hacia el centro (se ve el rectángulo de mejoras). Se anima al abrir Mejoras.
        this._despliegueProgreso = 0;
        // Contenedor arriba-centro: marcador (imagen puntacion-recursos.png) con
        // los números de PUNTOS y RECURSOS (en blanco) y la imagen de upgrade.
        this.contenedorTop = null;
        this._marcadorSprite = null;
        this._upgradeSprite = null;
        this._marcadorEscala = 80 / 431;                    // alto ~80
        this._marcadorW = Math.round(2172 * (80 / 431));    // ancho (~403)

        // Marco de cada cuadrante: imagen marcos1mejora.png (2307×688), un
        // rectángulo con un CUADRADO en la punta izquierda donde va el icono.
        // Se escala para que el cuadrado mida ~70px; el resto es para la mejora.
        this._texturaMarco = null;
        this._texturasMarcos = null;                       // 5 marcos por tier de mejora (max(1,nivel))
        this._marcoQ = 85;                                 // lado del cuadrado del icono (+10%)
        this._marcoEscala = 85 / 688;                      // escala (cuadrado ~85)
        this._marcoAncho = Math.round(2307 * (85 / 688));  // ancho del marco (~285)

        // Panel de mejoras dentro del rectángulo del marco: imagen chipDeMejora.png
        // (1536×463, placa con 5 chips OPACOS en fila + un chip grande a la derecha
        // + un rectángulo para el precio abajo). Como los chips son opacos, el pip
        // va ENCIMA (overlay blanco = prendido / negro = apagado) para "prender" el
        // chip. En el chip grande va el icono de mejora (upgreate).
        this._texturaChip = null;
        this._texturaUpgrade = null;                                // icono upgreate
        this._chipFracs = [0.1003, 0.2337, 0.3685, 0.4961, 0.6260]; // centros X de los 5 chips
        this._chipHuecoY = 0.36;                                    // centro Y del chip (frac de alto)
        this._chipUpgradeFrac = { x: 0.874, y: 0.324, w: 0.216, h: 0.592 }; // chip grande del upgrade
        this._chipPrecioFrac = { x: 0.423, y: 0.810 };              // centro del rectángulo del precio
        this._chipPrecioBox = { w: 0.467, h: 0.363 };               // tamaño del rectángulo del precio (frac)
        this._chipShiftDer = 10;                                    // la placa de la columna DER se corre a la izq (local)
        this._chipShiftIzq = 10;                                    // la placa de la columna IZQ se corre a la der (local)

        // Área INTERIOR del rectángulo del marco (fracción del marco), medida del
        // PNG marcos1mejora.png. La placa de chips encaja acá (llena el ancho).
        this._marcoInnerLfrac = 0.317;   // borde interior izquierdo del rectángulo
        this._marcoInnerRfrac = 0.985;   // borde interior derecho
        this._marcoInnerTfrac = 0.0785;  // borde interior superior
        this._marcoInnerBfrac = 0.942;   // borde interior inferior

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

        // 12. Barra de aceleración CURVA, pegada al borde del escudo de la nave.
        //     Sigue la posición de la nave (no rota con ella). Sin contorno circular.
        //     Elemento nuevo, en pruebas; convive con el HUD viejo por ahora.
        this.contenedorEscudo = null;
        this.escudoCurvo = { barras: [] };
        // Geometría común: cada arco se centra en (0,0); el contenedor se pega a la nave.
        this._escRBar = 36;   // radio de las barras: DENTRO de la circunferencia del escudo (aura ≈ radio+10 = 42)
        this._escGrosor = 5;  // grosor de los arcos
        // Las 3 barras curvas del escudo (ángulos en radianes). Aceleración va en
        // la inferior-derecha (135°). Escudos y Tiempo Fuera van en el lado opuesto
        // (arriba-izquierda), cada una la mitad (67.5°), con un huequito en el medio.
        const rad = (d) => (d * Math.PI) / 180;
        this._barrasDef = [
            { id: 'aceleracion', angIni: rad(-22.5), angSpan: rad(135),  reverso: true  },
            { id: 'escudos',     angIni: rad(153),   angSpan: rad(67.5), reverso: false },
            { id: 'tiempoFuera', angIni: rad(229.5), angSpan: rad(67.5), reverso: true  },
        ];

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

        // Grupo superior derecho → panel de FPS (info adicional), anclado arriba-derecha
        this.contenedorSuperiorDer = new PIXI.Container();
        this.contenedorSuperiorDer.sortableChildren = true;

        this.contenedorInferior = new PIXI.Container();
        this.contenedorInferior.sortableChildren = true; // respeta zIndex (UX/barra detrás de iconos)

        // Grupo del escudo curvo → arriba-derecha (caja local 200×200)
        this.contenedorEscudo = new PIXI.Container();
        this.contenedorEscudo.sortableChildren = true;

        // Columnas laterales de habilidades (rediseño del HUD)
        this.contenedorIzq = new PIXI.Container();
        this.contenedorIzq.sortableChildren = true;
        this.contenedorDer = new PIXI.Container();
        this.contenedorDer.sortableChildren = true;
        // Marco arriba-centro (puntaje + partículas)
        this.contenedorTop = new PIXI.Container();
        this.contenedorTop.sortableChildren = true;

        this.container.addChild(this.contenedorSuperior);
        this.container.addChild(this.contenedorSuperiorDer);
        this.container.addChild(this.contenedorInferior);
        this.container.addChild(this.contenedorIzq);
        this.container.addChild(this.contenedorDer);
        this.container.addChild(this.contenedorTop);
        this.container.addChild(this.contenedorEscudo);
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

        // Grupo superior derecho (panel de FPS) → arriba-derecha
        if (this.contenedorSuperiorDer) {
            this.contenedorSuperiorDer.scale.set(this._escala);
            this.contenedorSuperiorDer.position.set(w - margen, margen);
        }

        // Grupo inferior → abajo-centro. Se ancla el punto de diseño
        // (540, 720) = centro-inferior del layout a la coordenada real (w/2, h).
        this.contenedorInferior.scale.set(this._escala);
        this.contenedorInferior.position.set(
            Math.round(w / 2 - 540 * this._escala),
            Math.round(h - 720 * this._escala)
        );

        // Columnas laterales de habilidades → ancladas a los bordes izq/der y
        // centradas verticalmente. El layout local mide ~482px de alto (5 marcos
        // de 85 con la última fila en y=397).
        const margenLat = 2;    // los cuadrados quedan casi pegados al borde
        const altoColumna = 482;
        const yColumna = Math.round(h / 2 - (altoColumna / 2) * this._escala);
        // Posición "recogida" (solo el cuadrado en el borde) + offset para
        // desplegar hacia el centro (revela el rectángulo, ancho = marco - cuadrado).
        this._izqXBase = margenLat;
        this._derXBase = Math.round(w - margenLat - this._marcoQ * this._escala);
        this._despliegueOffset = (this._marcoAncho - this._marcoQ) * this._escala;
        this._yColumnas = yColumna;
        this._aplicarDespliegue();

        // Marcador arriba-centro (imagen puntacion-recursos). Se centra por su ancho.
        if (this.contenedorTop) {
            this.contenedorTop.scale.set(this._escala);
            this.contenedorTop.position.set(
                Math.round(w / 2 - (this._marcadorW / 2) * this._escala),
                2
            );
        }

        // El contenedor del escudo curvo NO se ancla a un borde: sigue a la nave
        // (escala 1 = mundo/pantalla), su posición se fija cada frame en
        // _actualizarEscudoCurvo. Solo aseguramos que no herede escala del HUD.
        if (this.contenedorEscudo) {
            this.contenedorEscudo.scale.set(1);
        }
    }

    /**
     * Coloca las columnas laterales según el progreso de despliegue actual
     * (this._despliegueProgreso): 0 = recogidas al borde (solo el cuadrado),
     * 1 = desplegadas hacia el centro (se ve el rectángulo de mejoras).
     * @private
     */
    _aplicarDespliegue() {
        const p = this._despliegueProgreso || 0;
        const off = this._despliegueOffset || 0;
        if (this.contenedorIzq) {
            this.contenedorIzq.scale.set(this._escala);
            this.contenedorIzq.position.set(Math.round(this._izqXBase + off * p), this._yColumnas);
        }
        if (this.contenedorDer) {
            this.contenedorDer.scale.set(this._escala);
            this.contenedorDer.position.set(Math.round(this._derXBase - off * p), this._yColumnas);
        }
    }

    /**
     * Anima el despliegue de las columnas laterales. Se llama cada frame ANTES
     * del corte por pausa (así corre también con el juego pausado): cuando el
     * menú de Mejoras está abierto las columnas se deslizan hacia el centro
     * revelando el rectángulo del marco (donde irán las mejoras), y al cerrarse
     * se recogen al borde.
     * @param {boolean} desplegado - true si el menú de Mejoras está abierto
     */
    actualizarDespliegue(desplegado) {
        const objetivo = desplegado ? 1 : 0;
        const p = this._despliegueProgreso || 0;
        if (Math.abs(objetivo - p) >= 0.002) {
            this._despliegueProgreso = p + (objetivo - p) * 0.2; // lerp suave
            this._aplicarDespliegue();
        } else if (this._despliegueProgreso !== objetivo) {
            this._despliegueProgreso = objetivo;
            this._aplicarDespliegue();
        }

        // Mientras las columnas están (aunque sea un poco) desplegadas, elevar el
        // HUD por encima de la ventana de mejoras (fondo en zIndex 2000) para que
        // los paneles laterales queden visibles y clickeables. En reposo, vuelve
        // a su capa normal (1000).
        if (this.container) {
            const zDeseado = this._despliegueProgreso > 0.001 ? 2500 : 1000;
            if (this.container.zIndex !== zDeseado) this.container.zIndex = zDeseado;
        }
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
            ['_crearPanelFPS', () => this._crearPanelFPS()],
            ['_crearCohetes', () => this._crearCohetes()],
            ['_crearTiempoFuera', () => this._crearTiempoFuera()],
            ['_crearEscudo', () => this._crearEscudo()],
            ['_crearUlti', () => this._crearUlti()],
            ['_crearPropulsor', () => this._crearPropulsor()],
            ['_crearDevorador', () => this._crearDevorador()],
            ['_crearPlaceholders', () => this._crearPlaceholders()],
            ['_crearContadorDevorador', () => this._crearContadorDevorador()],
            ['_crearPanelPuntuacion', () => this._crearPanelPuntuacion()],
            ['_crearEscudoCurvo', () => this._crearEscudoCurvo()],
            ['_crearTooltipMejora', () => this._crearTooltipMejora()],
        ];

        for (const [nombre, fn] of creadores) {
            try {
                fn();
            } catch (e) {
                console.error(`[PixiHUD] Error creando ${nombre}:`, e);
            }
        }

        // Re-posicionar los cuadrantes de habilidades en las columnas laterales
        try {
            this._posicionarIconosLaterales();
        } catch (e) {
            console.error('[PixiHUD] Error posicionando iconos en laterales:', e);
        }

        // Cargar la imagen de marco (marcos1mejora) y redibujar los cuadrantes con ella
        this._cargarTexturaMarco();
        // Cargar la placa de chips de mejora y dibujar los paneles en los rectángulos
        this._cargarTexturaChip();

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

    /**
     * Crea el texto del panel de FPS (esquina superior-derecha). Misma fuente y
     * color que el panel de oleada. Se ancla a la derecha (anchor.x = 1) dentro
     * del contenedorSuperiorDer, que lo pega al borde arriba-derecha. Su
     * visibilidad (junto con el panel de oleada) la controla la opción
     * "Mostrar información adicional" (ver _actualizarInfoAdicional).
     * @private
     */
    _crearPanelFPS() {
        this.fpsText = new PIXI.Text('FPS: 60', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fill: 0xFFFFFF
        });
        this.fpsText.anchor.set(1, 0); // pegado a la derecha
        this.fpsText.x = 0;
        this.fpsText.y = 0;
        this.contenedorSuperiorDer.addChild(this.fpsText);
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
            fontFamily: 'Segoe Script, cursive',
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.contadorDevoradorText.anchor.set(0.5);
        // La posición la fija _posicionarMarcador (casilla RECURSOS del marcador).
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
     * Crea el marcador arriba-centro (imagen puntacion-recursos.png): los números
     * de PUNTOS y RECURSOS en blanco sobre sus casillas, más la imagen de upgrade
     * en el cuadro de la izquierda. Va en contenedorTop.
     * @private
     */
    _crearPanelPuntuacion() {
        if (!this.contenedorTop) return;

        // Número de puntos (blanco)
        this.puntuacionText = new PIXI.Text('0', {
            fontFamily: 'Segoe Script, cursive', fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold'
        });
        this.puntuacionText.anchor.set(0.5);
        this.puntuacionText.zIndex = 2;
        this.contenedorTop.addChild(this.puntuacionText);

        // Número de recursos (creado en _crearContadorDevorador, ya en blanco)
        if (this.contadorDevoradorText) {
            this.contadorDevoradorText.zIndex = 2;
            this.contenedorTop.addChild(this.contadorDevoradorText);
        }

        // Cargar las imágenes (marcador + upgrade) y ubicar todo
        this._cargarMarcadorImagenes();
    }

    /**
     * Carga las imágenes del marcador (puntacion-recursos) y del upgrade y, al
     * tenerlas, ubica el fondo, la imagen de upgrade y los números. @private
     */
    async _cargarMarcadorImagenes() {
        try {
            const [texMarcador, texUpgrade] = await Promise.all([
                PIXI.Assets.load('assets/puntacion-recursos.png'),
                PIXI.Assets.load('assets/upgreate.png'),
            ]);
            this._posicionarMarcador(texMarcador, texUpgrade);
        } catch (e) {
            console.error('[PixiHUD] No se pudo cargar el marcador:', e);
        }
    }

    /**
     * Ubica el fondo del marcador, la imagen de upgrade (cuadro izquierdo) y los
     * números de PUNTOS/RECURSOS en sus casillas. Coordenadas sobre la imagen
     * nativa (2172×431) escaladas por this._marcadorEscala. @private
     */
    _posicionarMarcador(texMarcador, texUpgrade) {
        const s = this._marcadorEscala;

        // Fondo del marcador
        if (!this._marcadorSprite) {
            this._marcadorSprite = new PIXI.Sprite(texMarcador);
            this._marcadorSprite.anchor.set(0, 0);
            this._marcadorSprite.zIndex = 0;
            this.contenedorTop.addChild(this._marcadorSprite);
        }
        this._marcadorSprite.texture = texMarcador;
        this._marcadorSprite.scale.set(s);
        this._marcadorSprite.position.set(0, 0);

        // Imagen de upgrade en el cuadro de la izquierda
        if (texUpgrade) {
            if (!this._upgradeSprite) {
                this._upgradeSprite = new PIXI.Sprite(texUpgrade);
                this._upgradeSprite.anchor.set(0.5);
                this._upgradeSprite.zIndex = 1;
                this.contenedorTop.addChild(this._upgradeSprite);
            }
            this._upgradeSprite.texture = texUpgrade;
            const upAlto = 48;
            this._upgradeSprite.height = upAlto;
            this._upgradeSprite.width = upAlto * (255 / 274);
            this._upgradeSprite.position.set(210 * s, 215 * s);
        }

        // Números en sus casillas (coordenadas sobre la imagen nativa)
        if (this.puntuacionText) this.puntuacionText.position.set(975 * s, 245 * s);
        if (this.contadorDevoradorText) this.contadorDevoradorText.position.set(1785 * s, 245 * s);
    }

    // ========================================================================
    // RE-POSICIONAMIENTO: CUADRANTES EN COLUMNAS LATERALES
    // ========================================================================

    /**
     * Crea los cuadrantes placeholder (Proyectil y Nuevo), que todavía no tienen
     * icono: solo marco + fondo blanco. Reciben sprite más adelante.
     * @private
     */
    _crearPlaceholders() {
        // proyectil (abajo-izq) y nuevo (arriba-der) sólo tenían marco/fondo.
        for (const ph of [this.proyectil, this.nuevo]) {
            ph.marco = new PIXI.Graphics();
            ph.fondo = new PIXI.Graphics();
        }
        // Iconos temporales para los dos placeholders:
        //  - "nuevo" (arriba-derecha) = aceleración
        //  - "proyectil" (abajo-izquierda) = proyectil básico (temporal)
        this.nuevo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.nuevo.icono.anchor.set(0.5);
        this._cargarIconoLateral('assets/aceleracion.png', this.nuevo.icono);

        this.proyectil.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.proyectil.icono.anchor.set(0.5);
        this._cargarIconoLateral('assets/proyectil1.png', this.proyectil.icono);
    }

    /**
     * Carga la textura de un icono lateral y, al tenerla, re-posiciona los
     * cuadrantes para que el icono tome su tamaño real con la proporción correcta.
     * @param {string} path - Ruta de la textura
     * @param {PIXI.Sprite} sprite - Sprite destino del icono
     * @private
     */
    async _cargarIconoLateral(path, sprite) {
        try {
            const tex = await PIXI.Assets.load(path);
            if (tex && sprite) {
                sprite.texture = tex;
                this._posicionarIconosLaterales();
            }
        } catch (e) {
            console.error('[PixiHUD] No se pudo cargar icono lateral:', path, e);
        }
    }

    /**
     * Ubica los 8 cuadrantes de habilidades en dos columnas laterales:
     *  - Izquierda: Tiempo Fuera, Escudo, Proyectil (trío).
     *  - Derecha: Nuevo + Propulsor (par) arriba, y Cohetes, Devorador, Ulti (trío).
     * Re-parenta cada grupo (marco/fondo/icono) a su contenedor lateral y lo dibuja.
     * El escalado/anclado a los bordes lo aplica _calcularEscala.
     * @private
     */
    _posicionarIconosLaterales() {
        // Mapeo cuadrante → sección de mejora (índice de inicio en game.mejoras).
        // Las 8 habilidades tienen su sección de 5 mejoras.
        this.proyectil.mejoraSeccion = 0;    // daño de proyectil (0-4)
        this.escudo.mejoraSeccion = 5;       // escudo (5-9)
        this.ulti.mejoraSeccion = 10;        // ulti (10-14)
        this.tiempo.mejoraSeccion = 15;      // tiempo fuera (15-19)
        this.nuevo.mejoraSeccion = 20;       // aceleración (20-24)
        this.propul.mejoraSeccion = 25;      // propulsor (25-29)
        this.deborador.mejoraSeccion = 30;   // devorador (30-34)
        this.cohetes.mejoraSeccion = 35;     // cohetes (35-39)

        // y = esquina superior de cada marco en el sistema local de su columna.
        const izquierda = [
            { g: this.tiempo,    y: 216 },
            { g: this.escudo,    y: 307 },
            { g: this.proyectil, y: 397 },
        ];
        const derecha = [
            { g: this.nuevo,     y: 0 },
            { g: this.propul,    y: 90 },
            { g: this.cohetes,   y: 216 },
            { g: this.deborador, y: 307 },
            { g: this.ulti,      y: 397 },
        ];
        // Izquierda: marco espejado (rectángulo se va fuera de pantalla por la izq).
        // Derecha: marco normal (rectángulo se va fuera de pantalla por la der).
        // En ambas, el cuadrado del icono queda pegado al borde.
        for (const { g, y } of izquierda) this._dibujarCuadrante(g, this.contenedorIzq, y, true);
        for (const { g, y } of derecha)   this._dibujarCuadrante(g, this.contenedorDer, y, false);
    }

    /**
     * Devuelve la textura de marco según el NIVEL de mejora de la habilidad:
     * marco = max(1, nivel), o sea 0-1 mejoras → marco 1, 2 → marco 2, ...,
     * 5 → marco 5 (la 1ª mejora no cambia el marco, recién la 2ª). Los cuadrantes
     * sin mejora usan siempre el marco 1.
     * @private
     */
    _marcoTexturaTier(g) {
        const marcos = this._texturasMarcos;
        if (!marcos || !marcos.length) return this._texturaMarco || null;
        let nivel = 0;
        if (g && g.mejoraSeccion !== undefined && this.game && this.game.mejoras) {
            for (let i = 0; i < 5; i++) {
                if ((this.game.mejoras[g.mejoraSeccion + i] || 0) >= 1) nivel++;
            }
        }
        const tier = Math.max(1, nivel);
        return marcos[Math.min(tier, marcos.length) - 1] || marcos[0];
    }

    /**
     * Actualiza el marco de un cuadrante si cambió su tier (se compró una mejora).
     * Recalcula la escala porque cada marco tiene dimensiones algo distintas.
     * @private
     */
    _actualizarMarco(g) {
        if (!g || !g.frameSprite || g.mejoraSeccion === undefined) return;
        const tex = this._marcoTexturaTier(g);
        if (!tex || g.frameSprite.texture === tex) return;
        g.frameSprite.texture = tex;
        const sx = this._marcoAncho / tex.width, sy = this._marcoQ / tex.height;
        g.frameSprite.scale.set(g._espejo ? -sx : sx, sy);
    }

    /**
     * Dibuja un cuadrante usando la imagen de marco (marcos1mejora) y centra su
     * icono en el cuadrado de la punta. En la columna derecha el marco se espeja
     * (cuadrado del lado del borde derecho). Si el marco aún no cargó, solo ubica
     * el icono.
     * @param {boolean} espejo - true = columna derecha (marco espejado)
     * @private
     */
    _dibujarCuadrante(g, contenedor, y, espejo) {
        if (!g || !contenedor) return;

        // Ocultar el marco/fondo viejos (los _crear* los dibujaron en el HUD viejo);
        // ahora el marco es la imagen marcos1mejora.
        if (g.marco && g.marco.parent) g.marco.removeFromParent();
        if (g.fondo && g.fondo.parent) g.fondo.removeFromParent();

        const Q = this._marcoQ;      // lado del cuadrado del icono
        const W = this._marcoAncho;  // ancho total del marco
        g._espejo = espejo;          // se usa al cambiar el marco de tier

        // El CUADRADO del icono queda en local [0, Q] (en el borde de pantalla).
        // El RECTÁNGULO del marco se va hacia el centro (ahí van las mejoras).
        // La textura del marco depende del NIVEL de mejora de la habilidad (tier).
        // Cada marco tiene dims algo distintas, así que se escala para renderizar
        // siempre W×Q (escala no uniforme; deja todo alineado).
        const marcoTex = this._marcoTexturaTier(g);
        if (marcoTex) {
            if (!g.frameSprite) {
                g.frameSprite = new PIXI.Sprite(marcoTex);
                g.frameSprite.anchor.set(0, 0);
                g.frameSprite.zIndex = 0;
            }
            g.frameSprite.texture = marcoTex;
            const sx = W / marcoTex.width, sy = Q / marcoTex.height;
            if (espejo) {
                // Columna izquierda: marco espejado; el rectángulo se va por la izquierda.
                g.frameSprite.scale.set(-sx, sy);
                g.frameSprite.position.set(Q, y);
            } else {
                // Columna derecha: marco normal; el rectángulo se va por la derecha.
                g.frameSprite.scale.set(sx, sy);
                g.frameSprite.position.set(0, y);
            }
            contenedor.addChild(g.frameSprite);
        }

        // Icono centrado en el cuadrado (local [0, Q]), encajado en una caja
        // tam×tam preservando su proporción (no lo deforma si no es cuadrado).
        if (g.icono) {
            const tam = Q * 0.58;
            const tex = g.icono.texture;
            const tw = (tex && tex.width) ? tex.width : 1;
            const th = (tex && tex.height) ? tex.height : 1;
            g.icono.scale.set(tam / Math.max(tw, th));
            g.icono.position.set(Q / 2, y + Q / 2);
            g.icono.zIndex = 2;
            contenedor.addChild(g.icono);
        }

        // Panel de mejoras (chip + pips) dentro del rectángulo del marco.
        this._dibujarChipMejoras(g, contenedor, y, espejo);
    }

    /**
     * Dibuja el panel de mejoras dentro del RECTÁNGULO del marco (la parte que
     * queda fuera de pantalla y se revela al desplegar): la imagen de la placa
     * con 5 chips y, debajo de cada chip, un pip (cuadrado negro que se pone
     * blanco al clickear). Si la textura del chip aún no cargó, no hace nada
     * (se redibuja cuando carga).
     * @param {boolean} espejo - true = columna izquierda (rectángulo hacia la izq)
     * @private
     */
    _dibujarChipMejoras(g, contenedor, y, espejo) {
        if (!g || !contenedor || !this._texturaChip) return;

        const Q = this._marcoQ;
        const mAncho = this._marcoAncho;
        // Área INTERIOR del rectángulo del marco (donde encaja la placa). En la
        // columna izquierda el marco está espejado, así que el interior se refleja
        // respecto del borde del cuadrado (en Q).
        const inW = (this._marcoInnerRfrac - this._marcoInnerLfrac) * mAncho; // ancho interior
        const inX0 = espejo
            ? (Q - this._marcoInnerRfrac * mAncho)   // izquierda (espejo)
            : (this._marcoInnerLfrac * mAncho);      // derecha
        const inY0 = this._marcoInnerTfrac * Q;
        const inH = (this._marcoInnerBfrac - this._marcoInnerTfrac) * Q;

        // La placa llena el ANCHO interior; su alto sale de la proporción y se
        // centra verticalmente dentro del interior del rectángulo.
        const imgW = inW;
        const escChip = imgW / this._texturaChip.width;
        const imgH = this._texturaChip.height * escChip;
        // Corrimiento fino de la placa dentro del marco (el marco y el icono
        // quedan igual; solo se mueve el contenido del chip y sus pips):
        //  - columna DERECHA: se corre a la izquierda.
        //  - columna IZQUIERDA (espejo): se corre a la derecha.
        const chipX = inX0 + (espejo ? this._chipShiftIzq : -this._chipShiftDer); // esquina sup-izq
        const chipY = y + inY0 + Math.max(0, (inH - imgH) / 2);   // centrada vertical en el interior

        // PIPS: van DETRÁS de la placa (zIndex menor), centrados en el hueco de
        // cada chip; la placa opaca los tapa salvo por el hueco, así al ponerse
        // blanco "prende" el chip. Ya NO se clickean: reflejan el nivel comprado
        // de la mejora (game.mejoras). La compra se hace clickeando el icono de
        // mejora (upgradeSprite), que prende el siguiente chip.
        const pipVisual = imgW * 0.058;   // ~tamaño del centro del chip
        if (!g.pips) g.pips = [];
        if (!g.pipsEstado) g.pipsEstado = [false, false, false, false, false];
        for (let i = 0; i < 5; i++) {
            const cx = chipX + imgW * this._chipFracs[i];   // centro X del chip i
            const cy = chipY + imgH * this._chipHuecoY;     // centro Y del chip
            let pip = g.pips[i];
            if (!pip) {
                pip = new PIXI.Graphics();
                pip.zIndex = 4;                 // ENCIMA de la placa (zIndex 3): overlay
                pip.eventMode = 'none';         // los pips no se clickean
                g.pips[i] = pip;
            }
            pip._visual = pipVisual;
            pip.position.set(cx, cy);   // posición = CENTRO del pip
            // Estado = nivel comprado de la mejora (si el cuadrante tiene sección)
            g.pipsEstado[i] = (g.mejoraSeccion !== undefined) &&
                !!(this.game && this.game.mejoras && this.game.mejoras[g.mejoraSeccion + i] >= 1);
            this._pintarPip(pip, g.pipsEstado[i]);
            contenedor.addChild(pip);
        }

        // Imagen de la placa POR ENCIMA de los pips. eventMode 'none' para que
        // los clicks la atraviesen y lleguen a los pips de atrás.
        if (!g.chipSprite) {
            g.chipSprite = new PIXI.Sprite(this._texturaChip);
            g.chipSprite.anchor.set(0, 0);
            g.chipSprite.zIndex = 3;
            g.chipSprite.eventMode = 'none';
        }
        g.chipSprite.texture = this._texturaChip;
        g.chipSprite.scale.set(escChip);
        g.chipSprite.position.set(chipX, chipY);
        contenedor.addChild(g.chipSprite);

        // Icono de mejora (upgreate) dentro del cuadrado gris del chip grande,
        // POR ENCIMA de la placa. Encaja en el cuadrado preservando su proporción.
        if (this._texturaUpgrade) {
            if (!g.upgradeSprite) {
                g.upgradeSprite = new PIXI.Sprite(this._texturaUpgrade);
                g.upgradeSprite.anchor.set(0.5);
                g.upgradeSprite.zIndex = 4;      // encima de la placa (zIndex 3)
                if (g.mejoraSeccion !== undefined) {
                    // El icono de mejora es el BOTÓN DE COMPRA: cada clic compra el
                    // próximo nivel de la sección y prende el siguiente chip.
                    g.upgradeSprite.eventMode = 'static';
                    g.upgradeSprite.cursor = 'pointer';
                    g.upgradeSprite.on('pointertap', () => this._comprarMejoraCuadrante(g));
                    // Tooltip: al pasar el cursor por el icono, mostrar qué hace la mejora.
                    g.upgradeSprite.on('pointerover', () => this._mostrarTooltipMejora(g));
                    g.upgradeSprite.on('pointerout', () => this._ocultarTooltipMejora());
                } else {
                    g.upgradeSprite.eventMode = 'none'; // cuadrante sin mejora
                }
            }
            g.upgradeSprite.texture = this._texturaUpgrade;
            const uf = this._chipUpgradeFrac;
            const boxW = imgW * uf.w, boxH = imgH * uf.h;
            const escU = Math.min(boxW / this._texturaUpgrade.width, boxH / this._texturaUpgrade.height) * 0.99; // +10% sobre 0.9
            g.upgradeSprite.scale.set(escU);
            g.upgradeSprite.position.set(chipX + imgW * uf.x, chipY + imgH * uf.y);
            // Cuadrantes SIN mejora: icono siempre atenuado (no hay nada que
            // comprar). Los que tienen mejora los ilumina _actualizarPreciosMejora.
            if (g.mejoraSeccion === undefined) g.upgradeSprite.alpha = 0.4;
            contenedor.addChild(g.upgradeSprite);
        }

        // Precio de la próxima mejora en el rectángulo azul de la placa. Sólo en
        // los cuadrantes con mejora asociada (mejoraSeccion). El valor lo refresca
        // _actualizarPreciosMejora() cada frame; acá se crea y se ubica/encaja.
        if (g.mejoraSeccion !== undefined) {
            if (!g.precioText) {
                g.precioText = new PIXI.Text('', {
                    fontFamily: 'Segoe Script, cursive', fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold'
                });
                g.precioText.anchor.set(0.5);
                g.precioText.zIndex = 4;         // encima de la placa (zIndex 3)
                g.precioText.eventMode = 'none';
            }
            g.precioText.position.set(chipX + imgW * this._chipPrecioFrac.x, chipY + imgH * this._chipPrecioFrac.y);
            g._precioBoxLocal = { w: imgW * this._chipPrecioBox.w, h: imgH * this._chipPrecioBox.h };
            contenedor.addChild(g.precioText);
            this._refrescarPrecio(g);
        }
    }

    /**
     * Crea el globo de ayuda (tooltip) que aparece al pasar el cursor sobre el
     * icono de una mejora. Vive en el contenedor raíz (espacio de pantalla,
     * escala 1) por encima de todo; se posiciona por frame según el icono.
     * Estilo tinta de birome sobre papel: fondo papel, borde y texto azul/negro.
     * @private
     */
    _crearTooltipMejora() {
        const c = new PIXI.Container();
        c.visible = false;
        c.eventMode = 'none';   // no intercepta clicks/hover
        c.zIndex = 9999;

        const bg = new PIXI.Graphics();
        c.addChild(bg);

        const titulo = new PIXI.Text('', {
            fontFamily: 'Segoe Script, cursive', fontSize: 18, fill: 0x0B2E6B, fontWeight: 'bold'
        });
        c.addChild(titulo);

        const desc = new PIXI.Text('', {
            fontFamily: 'Segoe Script, cursive', fontSize: 15, fill: 0x111111,
            wordWrap: true, wordWrapWidth: 230
        });
        c.addChild(desc);

        // Fila inferior: 5 pips de nivel (izquierda) + precio (derecha).
        const pips = [];
        for (let i = 0; i < 5; i++) {
            const p = new PIXI.Graphics();
            c.addChild(p);
            pips.push(p);
        }
        const precio = new PIXI.Text('', {
            fontFamily: 'Segoe Script, cursive', fontSize: 17, fill: 0x0A7D2C, fontWeight: 'bold'
        });
        precio.anchor.set(1, 0.5);   // anclado a la derecha, centrado vertical
        c.addChild(precio);

        // Última: se agrega tras _crearEscudoCurvo, así queda encima del resto.
        this.container.addChild(c);
        this._tooltipMejora = { c, bg, titulo, desc, pips, precio };
    }

    /**
     * Nombre y descripción del efecto de una sección de mejora.
     * @param {number} seccion - índice de inicio (0,5,10,...,35)
     * @returns {[string,string]|null}
     * @private
     */
    _infoMejora(seccion) {
        const M = {
            0:  ['Daño',         'Aumenta el daño de cada disparo.'],
            5:  ['Escudo',       'Sube el escudo máximo y lo recarga.'],
            10: ['Ulti',         'Reduce el coste de carga de la ulti.'],
            15: ['Tiempo Fuera', 'Mejora la regeneración al reaparecer.'],
            20: ['Aceleración',  'Más tiempo de acelerón antes de recalentar.'],
            25: ['Propulsor',    'Baja 2 s el enfriamiento del propulsor.'],
            30: ['Devorador',    'Más alcance y velocidad de atracción.'],
            35: ['Cohetes',      'Lanza un cohete extra por nivel.'],
        };
        return M[seccion] || null;
    }

    /**
     * Muestra el tooltip de la mejora del cuadrante g junto a su icono. Estructura:
     * título + línea separadora + descripción + fila con pips de nivel (izq) y
     * precio del próximo nivel (der), coloreado según si se puede pagar (verde) o
     * no (rojo), o "MAX" (azul) si la sección está completa. Una flecha apunta al
     * icono. Todo en tinta de birome sobre papel.
     * @private
     */
    _mostrarTooltipMejora(g) {
        const tt = this._tooltipMejora;
        if (!tt || !g || g.mejoraSeccion === undefined || !g.upgradeSprite) return;
        const info = this._infoMejora(g.mejoraSeccion);
        if (!info) return;

        const AZUL = 0x0B2E6B, VERDE = 0x0A7D2C, ROJO = 0xCC0000, PAPEL = 0xFBF7EC;
        const PAD = 12;

        // Nivel comprado de la sección (cuántos de los 5 están en >=1).
        let niveles = 0;
        for (let i = 0; i < 5; i++) {
            if (this.game && this.game.mejoras && (this.game.mejoras[g.mejoraSeccion + i] || 0) >= 1) niveles++;
        }
        const precioVal = this._precioMejora(g.mejoraSeccion);
        const particulas = this.game ? (this.game.particulasCapturadas || 0) : 0;

        // Textos
        tt.titulo.text = info[0];
        tt.titulo.position.set(PAD, 9);
        tt.desc.text = info[1];
        const sepY = Math.round(tt.titulo.y + tt.titulo.height + 6);
        tt.desc.position.set(PAD, sepY + 7);

        // Fila inferior (pips + precio)
        const filaY = Math.round(tt.desc.y + tt.desc.height + 12);
        const pipR = 5, pipGap = 15;
        for (let i = 0; i < 5; i++) {
            const p = tt.pips[i];
            const on = i < niveles;
            p.clear();
            p.circle(PAD + pipR + i * pipGap, filaY + pipR, pipR)
                .fill({ color: on ? AZUL : PAPEL })
                .stroke({ width: 1.5, color: AZUL });
            p.visible = true;
        }
        const pipsAncho = 2 * pipR + 4 * pipGap;

        // Precio coloreado por disponibilidad (o MAX)
        let precioColor;
        if (precioVal === null) { tt.precio.text = 'MAX'; precioColor = AZUL; }
        else { tt.precio.text = `${precioVal}`; precioColor = (particulas >= precioVal) ? VERDE : ROJO; }
        tt.precio.style.fill = precioColor;

        // Ancho/alto de la caja
        const contenido = Math.max(
            tt.titulo.width,
            tt.desc.width,
            pipsAncho + 14 + tt.precio.width
        );
        const w = Math.round(contenido + PAD * 2);
        const h = filaY + pipR * 2 + PAD;
        tt.precio.position.set(w - PAD, filaY + pipR);

        // Posición: al lado del icono, en coordenadas de pantalla.
        const gp = g.upgradeSprite.getGlobalPosition();
        const sw = this.app.screen.width;
        const sh = this.app.screen.height || 720;
        const derecha = gp.x > sw / 2;   // icono en columna derecha → tooltip a la izquierda
        const gapFlecha = 16;
        let x = derecha ? (gp.x - w - gapFlecha) : (gp.x + gapFlecha);
        if (x < 4) x = 4;
        if (x + w > sw - 4) x = sw - 4 - w;
        let y = gp.y - h / 2;
        y = Math.max(4, Math.min(sh - h - 4, y));

        // Dibujo del fondo + separador + flecha hacia el icono.
        const flechaY = Math.max(14, Math.min(h - 14, gp.y - y));
        tt.bg.clear();
        tt.bg.roundRect(0, 0, w, h, 8)
            .fill({ color: PAPEL, alpha: 0.98 })
            .stroke({ width: 2, color: AZUL });
        // Separador bajo el título
        tt.bg.moveTo(PAD, sepY).lineTo(w - PAD, sepY).stroke({ width: 1, color: AZUL, alpha: 0.4 });
        // Flecha (triángulo): relleno que solapa el borde de la caja + dos aristas externas
        if (derecha) {
            tt.bg.poly([w - 1, flechaY - 7, w + 9, flechaY, w - 1, flechaY + 7]).fill({ color: PAPEL, alpha: 0.98 });
            tt.bg.moveTo(w - 1, flechaY - 7).lineTo(w + 9, flechaY).lineTo(w - 1, flechaY + 7).stroke({ width: 2, color: AZUL });
        } else {
            tt.bg.poly([1, flechaY - 7, -9, flechaY, 1, flechaY + 7]).fill({ color: PAPEL, alpha: 0.98 });
            tt.bg.moveTo(1, flechaY - 7).lineTo(-9, flechaY).lineTo(1, flechaY + 7).stroke({ width: 2, color: AZUL });
        }

        tt.c.position.set(Math.round(x), Math.round(y));
        tt.c.visible = true;
    }

    /** Oculta el tooltip de mejora. @private */
    _ocultarTooltipMejora() {
        if (this._tooltipMejora) this._tooltipMejora.c.visible = false;
    }

    /**
     * Costo de la PRÓXIMA mejora disponible de una sección (índice de inicio),
     * o null si ya están todas compradas o aún no hay datos de mejoras.
     * @param {number} seccion - índice de inicio de la sección (0,5,10,15,20)
     * @returns {number|null}
     * @private
     */
    _precioMejora(seccion) {
        const game = this.game;
        if (!game || !game.mejoras || !game.costosMejoras) return null;
        for (let i = seccion; i < seccion + 5; i++) {
            if ((game.mejoras[i] || 0) === 0) return game.costosMejoras[i];
        }
        return null; // todas compradas
    }

    /**
     * Refresca el texto de precio de un cuadrante y lo encaja en el rectángulo
     * azul. Sólo re-mide cuando cambia el texto o la caja (evita medir cada frame).
     * @private
     */
    _refrescarPrecio(g) {
        if (!g.precioText || g.mejoraSeccion === undefined) return;
        const precio = this._precioMejora(g.mejoraSeccion);
        // Sección maxeada (todas compradas) → "MAX" en vez de quedar vacío.
        const txt = (precio === null) ? 'MAX' : `${precio}`;
        const box = g._precioBoxLocal;
        if (g.precioText.text === txt && g._precioBoxFit === box) return;
        g.precioText.text = txt;
        g.precioText.visible = !!txt;
        if (box && txt) {
            // Tamaño fijo (fontSize 20); sólo achicar si el número no entra a lo
            // ancho del rectángulo azul (números de 3 cifras).
            g.precioText.scale.set(1);
            const tw = g.precioText.width || 1;
            if (tw > box.w * 0.9) g.precioText.scale.set((box.w * 0.9) / tw);
        }
        g._precioBoxFit = box;
    }

    /**
     * Refresca los pips de un cuadrante según los niveles comprados (game.mejoras):
     * pip encendido (blanco) = nivel comprado. @private
     */
    _refrescarPips(g) {
        if (!g.pips || g.mejoraSeccion === undefined) return;
        const game = this.game;
        for (let i = 0; i < 5; i++) {
            const on = !!(game && game.mejoras && game.mejoras[g.mejoraSeccion + i] >= 1);
            if (g.pipsEstado[i] !== on && g.pips[i]) {
                g.pipsEstado[i] = on;
                this._pintarPip(g.pips[i], on);
            }
        }
    }

    /**
     * Compra el próximo nivel de la mejora de un cuadrante (clic en su icono de
     * mejora): pide la compra al juego y refresca pips + precio. Si no alcanza,
     * parpadea el precio en rojo. @private
     */
    _comprarMejoraCuadrante(g) {
        if (!this.game || g.mejoraSeccion === undefined) return;
        const res = this.game.comprarMejoraSeccion(g.mejoraSeccion);
        if (res === 'ok') {
            // Refresca pips/precios y la iluminación de TODOS los iconos de mejora
            // (el saldo bajó, otra sección puede haber dejado de ser comprable).
            this._actualizarPreciosMejora();
            // Refrescar YA el contador de partículas: con el panel de mejoras abierto
            // el juego está pausado y el loop del HUD no corre, así que sin esto el
            // contador quedaría congelado hasta salir de la compra.
            this._actualizarContadorDevorador();
        } else if (res === 'sinSaldo') {
            this._flashPrecioSinSaldo(g);
        }
        // 'maxeada' → no hay más niveles: no se hace nada
    }

    /** Parpadeo rojo del precio cuando no alcanzan las partículas. @private */
    _flashPrecioSinSaldo(g) {
        if (!g.precioText) return;
        g.precioText.style.fill = 0xCC0000; // rojo tinta
        clearTimeout(g._precioFlashTimer);
        g._precioFlashTimer = setTimeout(() => {
            if (g.precioText) g.precioText.style.fill = 0xFFFFFF;
        }, 400);
    }

    /**
     * Actualiza precio, pips e ILUMINACIÓN de los iconos de mejora de cada
     * cuadrante: el icono upgreate se ilumina cuando el próximo nivel se puede
     * pagar con las partículas Boid actuales (atenuado si no alcanza o si la
     * sección está maxeada). El upgreate del marcador superior se ilumina si
     * hay AL MENOS una mejora comprable. Se llama cada frame desde actualizar().
     * @private
     */
    _actualizarPreciosMejora() {
        const juego = this.game;
        const particulas = juego ? (juego.particulasCapturadas || 0) : 0;
        let algunaComprable = false;
        for (const g of [this.proyectil, this.escudo, this.ulti, this.tiempo, this.nuevo, this.propul, this.deborador, this.cohetes]) {
            if (!g) continue;
            if (g.precioText) this._refrescarPrecio(g);
            if (g.pips) this._refrescarPips(g);
            this._actualizarMarco(g);   // cambia el marco según el nivel comprado
            if (g.upgradeSprite && g.mejoraSeccion !== undefined) {
                const precio = this._precioMejora(g.mejoraSeccion);
                const comprable = (precio !== null) && particulas >= precio;
                g.upgradeSprite.alpha = comprable ? 1 : 0.4;
                if (comprable) algunaComprable = true;
            }
        }
        // Icono upgreate del marcador superior (panel de puntos/recursos)
        if (this._upgradeSprite) {
            this._upgradeSprite.alpha = algunaComprable ? 1 : 0.4;
        }
    }

    /**
     * Pinta un pip de mejora: negro cuando está apagado, blanco cuando está
     * encendido; borde de tinta azul en ambos casos.
     * @param {PIXI.Graphics} pip
     * @param {boolean} encendido
     * @private
     */
    _pintarPip(pip, encendido) {
        const s = pip._visual || 8;
        pip.clear();
        // Overlay ENCIMA del chip: prendido = blanco pleno y un poco más grande
        // para que resalte; apagado = negro semi-transparente (deja ver el chip).
        if (encendido) {
            const g = s * 1.2;
            pip.rect(-g / 2, -g / 2, g, g).fill(0xFFFFFF);
            pip.alpha = 1;
        } else {
            pip.rect(-s / 2, -s / 2, s, s).fill(0x000000);
            pip.alpha = 0.45;
        }
    }

    /**
     * Carga la imagen de marco (marcos1mejora) y, al tenerla, redibuja los
     * cuadrantes para que la usen. @private
     */
    async _cargarTexturaMarco() {
        try {
            // 5 marcos por tier de mejora (marcos1..5mejora.png).
            const rutas = [1, 2, 3, 4, 5].map(n => `assets/marcos${n}mejora.png`);
            const texs = await Promise.all(rutas.map(r => PIXI.Assets.load(r)));
            this._texturasMarcos = texs;
            this._texturaMarco = texs[0];   // marco base (tier 1)
            this._posicionarIconosLaterales();
        } catch (e) {
            console.error('[PixiHUD] No se pudieron cargar los marcos de mejora:', e);
        }
    }

    /**
     * Carga la placa de chips de mejora (chipDeMejora.png) y el icono upgreate y,
     * al tenerlos, redibuja los cuadrantes para que se dibujen los paneles de
     * mejora en los rectángulos. @private
     */
    async _cargarTexturaChip() {
        try {
            const [chip, upg] = await Promise.all([
                PIXI.Assets.load('assets/chipDeMejora.png'),
                PIXI.Assets.load('assets/upgreate.png'),
            ]);
            if (chip) this._texturaChip = chip;
            if (upg) this._texturaUpgrade = upg;
            this._posicionarIconosLaterales();
        } catch (e) {
            console.error('[PixiHUD] No se pudo cargar la placa de chips/upgreate:', e);
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
            () => this._actualizarPanelFPS(),
            () => this._actualizarInfoAdicional(),
            () => this._actualizarPuntuacion(),
            () => this._actualizarBarraAceleracion(),
            () => this._actualizarIconoEscudo(),
            () => this._actualizarIconoUlti(),
            () => this._actualizarIconoTiempo(),
            () => this._actualizarContadorDevorador(),
            () => this._actualizarEscudoCurvo(),
            () => this._actualizarPreciosMejora(),
            () => this._actualizarIluminacionIconos(),
        ];

        for (const fn of actualizadores) {
            try {
                fn();
            } catch (e) {
                // Silenciar errores individuales para no detener el game loop
            }
        }
    }

    /**
     * Ilumina el icono de cada habilidad cuando está DISPONIBLE para usar y lo
     * atenúa cuando no (en cooldown / sin carga / sobrecalentado). Habilidades:
     *  - Cohetes (Q), Propulsor (R), Devorador (E): disponibles con cooldown en 0.
     *  - Ulti (S): disponible cuando está cargado (jugador.ultiListo).
     *  - Aceleración (W): disponible mientras NO esté sobrecalentada.
     * Las pasivas (Escudo, Tiempo Fuera, Proyectil) quedan siempre encendidas.
     * @private
     */
    _actualizarIluminacionIconos() {
        const g = this.game;
        if (!g) return;
        const ATENUADO = 0.4, ENCENDIDO = 1;
        const luz = (grupo, disponible) => {
            if (grupo && grupo.icono) grupo.icono.alpha = disponible ? ENCENDIDO : ATENUADO;
        };
        const ge = g.gestorEntrada;
        if (ge) {
            luz(this.cohetes,   (ge.enfriamientoCohetes   || 0) <= 0);
            luz(this.propul,    (ge.enfriamientoPropulsor  || 0) <= 0);
            luz(this.deborador, (ge.enfriamientoDevorar    || 0) <= 0);
        }
        const j = g.jugador;
        if (j) {
            luz(this.ulti,  !!j.ultiListo);              // cargado
            luz(this.nuevo, !j.sobrecalentadoAceleracion); // aceleración no sobrecalentada
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

    /** Refresca el contador de FPS (usa el ticker de PixiJS). @private */
    _actualizarPanelFPS() {
        if (this.fpsText && this.app && this.app.ticker) {
            this.fpsText.text = `FPS: ${Math.round(this.app.ticker.FPS)}`;
        }
    }

    /**
     * Muestra u oculta el conjunto de "información adicional" (panel de oleada
     * arriba-izquierda + FPS arriba-derecha) según la opción guardada en
     * localStorage ('infoAdicional'). Por defecto está oculto (opt-in desde
     * Opciones). @private
     */
    _actualizarInfoAdicional() {
        let mostrar = false;
        try {
            mostrar = (typeof localStorage !== 'undefined') && localStorage.getItem('infoAdicional') === '1';
        } catch (e) { /* localStorage no disponible */ }
        if (this.oleadaText) this.oleadaText.visible = mostrar;
        if (this.fpsText) this.fpsText.visible = mostrar;
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
        // % relativo al máximo actual (cargaMax sube con las mejoras de aceleración)
        const cargaMax = jugador.cargaMax || 100;
        const porcentaje = Math.max(0, Math.min(100, (jugador.cargaAceleracion / cargaMax) * 100));
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
    /** Muestra un icono estático de escudo (sin animación). @private */
    _actualizarIconoEscudo() {
        if (this.escudo.icono && this.escudo.sprites.length >= 1) {
            this.escudo.icono.texture = this.escudo.sprites[0];
        }
    }

    /** Muestra un icono estático de Ulti (sin animación). @private */
    _actualizarIconoUlti() {
        if (this.ulti.icono && this.ulti.sprites.length >= 1) {
            this.ulti.icono.texture = this.ulti.sprites[0];
            this.ulti.icono.alpha = 1;
        }
    }

    /**
     * Corre la PASIVA de Tiempo Fuera (activar al sobrecalentarse, contar el
     * tiempo y regenerar escudos al terminar) y muestra un icono ESTÁTICO (sin
     * la animación del reloj ni del marco). El conteo lo muestra la barra curva.
     * @private
     */
    _actualizarIconoTiempo() {
        if (!this.game || !this.game.jugador) return;
        const jugador = this.game.jugador;

        // Activar al entrar en sobrecalentamiento
        if (jugador.sobrecalentado && !this.game.tiempoFueroActivo) {
            this.game.tiempoFueroActivo = true;
            this.game.timerTiempoFuera = 0;
        }

        // Correr el conteo; al terminar, regenerar escudos y resetear
        if (this.game.tiempoFueroActivo) {
            this.game.timerTiempoFuera += 1 / 60; // ~1 frame a 60fps
            if (this.game.timerTiempoFuera >= this.game.duracionTiempoFuera) {
                const regeneracionBase = 10;
                const regeneracionBonus = this.game.regeneracionTiempoFueraBonus || 0;
                jugador.agregarEscudos(regeneracionBase + regeneracionBonus);
                this.game.tiempoFueroActivo = false;
                this.game.timerTiempoFuera = 0;
            } else if (!jugador.sobrecalentado) {
                // Salió del sobrecalentamiento antes de tiempo: cancelar
                this.game.tiempoFueroActivo = false;
                this.game.timerTiempoFuera = 0;
            }
        }

        // Icono estático (sin animación)
        if (this.tiempo.icono) {
            this.tiempo.icono.texture = this._texturaIconoTiempo || this.tiempo.sprites[0] || PIXI.Texture.WHITE;
            this.tiempo.icono.rotation = 0;
        }
    }

    /** Refresca el contador de partículas capturadas por el Devorador (game.particulasCapturadas). @private */
    _actualizarContadorDevorador() {
        if (!this.contadorDevoradorText || !this.game) return;
        const cantidad = this.game.particulasCapturadas || 0;
        this.contadorDevoradorText.text = cantidad.toString();
    }

    /**
     * Crea el escudo curvo (rediseño del HUD, en pruebas): un círculo (el escudo)
     * con una barra de aceleración CURVA en su parte inferior derecha, que sigue
     * la curvatura del círculo. Consta de: contorno del círculo, riel tenue de la
     * barra y el relleno (que se redibuja cada frame). Vive en contenedorEscudo
     * (anclado arriba-derecha).
     * @private
     */
    _crearEscudoCurvo() {
        if (!this.contenedorEscudo) return;

        this.escudoCurvo = { barras: [] };
        for (const def of this._barrasDef) {
            // Riel: arco tenue de fondo (recorrido completo de la barra). Centrado
            // en (0,0); el contenedor se posiciona sobre la nave cada frame.
            const track = new PIXI.Graphics();
            track.arc(0, 0, this._escRBar, def.angIni, def.angIni + def.angSpan)
                 .stroke({ width: this._escGrosor, color: 0xCFD9F0, cap: 'butt' });
            this.contenedorEscudo.addChild(track);

            // Relleno (se redibuja en _actualizarEscudoCurvo según su valor)
            const fill = new PIXI.Graphics();
            this.contenedorEscudo.addChild(fill);

            this.escudoCurvo.barras.push({ def, track, fill });
        }
    }

    /**
     * Pega la barra al borde del escudo de la nave (sigue su posición cada frame,
     * sin rotar con ella) y redibuja el arco según jugador.cargaAceleracion
     * (0-100%): crece por la curva y el azul se intensifica (tinta clara → tinta
     * oscura) al cargarse. Al sobrecalentarse queda llena en el azul más oscuro y
     * parpadea, para avisar el recalentamiento. Se oculta si la nave no está activa.
     * @private
     */
    _actualizarEscudoCurvo() {
        const cont = this.contenedorEscudo;
        if (!cont || !this.escudoCurvo || !this.game || !this.game.jugador) return;

        const jugador = this.game.jugador;

        // Seguir a la nave (posición del mundo = pantalla, 1:1). No rota con ella.
        if (!jugador.active) {
            cont.visible = false;
            return;
        }
        cont.visible = true;
        // El escudo curvo vive en el stage (pantalla), pero la nave está en el
        // MUNDO (que la cámara desplaza). La posición REAL en pantalla de la nave
        // es mundo.x + jugador.x → así el escudo sigue a la nave incluyendo el
        // look-ahead y el screen shake de la cámara.
        const m = this.game.mundo;
        if (m) cont.position.set(m.x + jugador.x, m.y + jugador.y);

        for (const barra of this.escudoCurvo.barras) {
            this._dibujarBarraEscudo(barra, jugador);
        }
    }

    /**
     * Calcula el valor (0..1) de una barra del escudo según su id y redibuja su
     * relleno curvo (color SÓLIDO azul tinta, sin degradado). La barra está al 50%
     * de opacidad en reposo y al 100% cuando está EN USO / activa:
     *  - aceleracion: en uso al acelerar (carga > 0); parpadea al sobrecalentarse.
     *  - escudos: escudos/escudosMax; en uso cuando recibió daño (< máximo).
     *  - tiempoFuera: llena por defecto; en uso mientras corre el conteo (se descarga).
     * @private
     */
    _dibujarBarraEscudo(barra, jugador) {
        const def = barra.def;
        const fill = barra.fill;
        const track = barra.track;
        if (!fill) return;

        let fraccion = 0;
        let sobre = false;
        let activa = false;   // en uso / activa -> opacidad plena

        if (def.id === 'aceleracion') {
            sobre = !!jugador.sobrecalentadoAceleracion;
            // Relativo al máximo actual (cargaMax crece con las mejoras)
            fraccion = sobre ? 1 : this._clamp01((jugador.cargaAceleracion || 0) / (jugador.cargaMax || 100));
            activa = sobre || (jugador.cargaAceleracion || 0) > 0;
        } else if (def.id === 'escudos') {
            const max = jugador.escudosMax || 100;
            fraccion = this._clamp01((jugador.escudos || 0) / max);
            activa = (jugador.escudos || 0) < max; // recibió daño
        } else if (def.id === 'tiempoFuera') {
            const g = this.game;
            activa = !!g.tiempoFueroActivo;
            fraccion = (activa && g.duracionTiempoFuera)
                ? this._clamp01(1 - (g.timerTiempoFuera || 0) / g.duracionTiempoFuera)
                : 1;
        }

        fill.clear();
        if (fraccion > 0) {
            const color = sobre ? 0x002766 : 0x173B75; // color sólido (sin degradado)
            let desde, hasta;
            if (def.reverso) {
                desde = def.angIni + (1 - fraccion) * def.angSpan;
                hasta = def.angIni + def.angSpan;
            } else {
                desde = def.angIni;
                hasta = def.angIni + fraccion * def.angSpan;
            }
            fill.arc(0, 0, this._escRBar, desde, hasta)
                .stroke({ width: this._escGrosor, color, cap: 'butt' });
        }

        // Opacidad: 50% en reposo, 100% en uso/activa. La de aceleración parpadea
        // al sobrecalentarse.
        let op = activa ? 1 : 0.5;
        if (sobre) op = 0.55 + 0.45 * Math.abs(Math.sin(Date.now() / 200));
        fill.alpha = op;
        if (track) track.alpha = op;
    }

    /** Limita un valor al rango 0..1. @private */
    _clamp01(v) {
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }

    /**
     * Interpola entre azul tinta claro (#AFC6EC) y oscuro (#002766) según t (0..1).
     * Devuelve el color como número 0xRRGGBB. @private
     */
    _lerpColorTinta(t) {
        const r = Math.round(0xAF + (0x00 - 0xAF) * t);
        const g = Math.round(0xC6 + (0x27 - 0xC6) * t);
        const b = Math.round(0xEC + (0x66 - 0xEC) * t);
        return (r << 16) | (g << 8) | b;
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
