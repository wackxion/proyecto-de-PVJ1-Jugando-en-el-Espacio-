/**
 * PixiHUD - HUD completo renderizado en PixiJS
 *
 * Todos los elementos del HUD (iconos, barra W, puntuación) se dimensionan
 * y posicionan en función del cuadrante de la imagen UX (20% inferior de pantalla).
 *
 * Dimensiones del cuadrante UX:
 *   - Alto: screen.height * 0.2
 *   - Ancho: min(2000, screen.width * 0.8)
 *   - Centrado horizontalmente, anclado al fondo
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
        this.container.sortableChildren = true;
        this.app.stage.addChild(this.container);
        this.app.stage.sortableChildren = true;

        // =========================================
        // REFERENCIAS A ELEMENTOS DEL HUD
        // =========================================
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

        // Estado
        this._escudosAnterior = 100;
        this.inicializado = false;

        // Dimensiones del cuadrante UX (calculadas en _calcularDimensiones)
        this._uxX = 0;       // Borde izquierdo del cuadrante
        this._uxY = 0;       // Borde superior del cuadrante
        this._uxW = 0;       // Ancho del cuadrante
        this._uxH = 0;       // Alto del cuadrante

        // DIFERIR inicialización al próximo frame para canvas con dimensiones válidas
        requestAnimationFrame(() => {
            this._calcularDimensiones();
            this._inicializar();
        });
    }

    /**
     * Calcula las dimensiones del cuadrante UX y vmin como fallback
     * @private
     */
    _calcularDimensiones() {
        let w = this.app.screen.width;
        let h = this.app.screen.height;
        if (!w || !h) {
            w = window.innerWidth || 1920;
            h = window.innerHeight || 1080;
        }
        this._vmin = Math.min(w, h) / 100;

        // Cuadrante UX: 20% inferior de pantalla, 80% de ancho centrado
        this._uxW = Math.min(2000, w * 0.8);
        this._uxH = h * 0.2;
        this._uxX = (w - this._uxW) / 2;
        this._uxY = h - this._uxH;
    }

    /**
     * Convierte vmin a píxeles
     * @param {number} vmin
     * @returns {number} Píxeles
     * @private
     */
    _v(vmin) {
        return vmin * this._vmin;
    }

    // ========================================================================
    // INICIALIZACIÓN
    // ========================================================================

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
            try { fn(); } catch (e) {
                console.error(`[PixiHUD] Error creando ${nombre}:`, e);
            }
        }

        // Posicionar todo dentro del cuadrante UX
        try {
            this._posicionarEnCuadranteUX();
        } catch (e) {
            console.error('[PixiHUD] Error posicionando en cuadrante UX:', e);
        }

        this.inicializado = true;
    }

    /**
     * Re-inicializa el HUD destruyendo y recreando todo.
     * @public
     */
    reinicializar() {
        if (this.container) {
            try { this.container.removeChildren(); } catch (e) {}
        }
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
        this._escudosAnterior = 100;
        this.inicializado = false;

        this._calcularDimensiones();
        this._inicializar();
    }

    // ========================================================================
    // 1. PANEL DE OLEADA (top-left, fuera del cuadrante)
    // ========================================================================

    _crearPanelOleada() {
        this.oleadaText = new PIXI.Text('Oleada: 1', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fill: 0xFFFFFF
        });
        this.oleadaText.x = 15;
        this.oleadaText.y = 10;
        this.container.addChild(this.oleadaText);
    }

    // ========================================================================
    // IMAGEN UX (fondo del cuadrante)
    // ========================================================================

    _crearImagenUX() {
        this._cargarTexturaUX();
    }

    async _cargarTexturaUX() {
        try {
            const tex = await PIXI.Assets.load('assets/uxExperimental2.png');
            this.uxImage = new PIXI.Sprite(tex);
            this.uxImage.width = this._uxW;
            this.uxImage.height = this._uxH;
            this.uxImage.anchor.set(0.5, 1);
            this.uxImage.x = this.app.screen.width / 2;
            this.uxImage.y = this.app.screen.height;
            this.uxImage.zIndex = -1;
            this.container.addChild(this.uxImage);
        } catch (e) { /* Si falla, no hacer nada */ }
    }

    // ========================================================================
    // CREACIÓN DE ICONOS (crea en origen, se reposiciona después)
    // ========================================================================

    /**
     * Helper: crea un icono con marco, fondo y sprite.
     * Todos se crean en (0,0) — _posicionarEnCuadranteUX() los reposiciona.
     *
     * @param {object} grupo - Objeto que contiene marco, fondo, icono
     * @param {number} anchoFondo - Ancho del fondo blanco
     * @param {number} altoFondo - Alto del fondo blanco
     * @param {number} borde - Grosor del borde del marco
     * @param {number} lineColor - Color del borde (hex)
     * @private
     */
    _crearIcono(grupo, anchoFondo, altoFondo, borde, lineColor) {
        const anchoTotal = anchoFondo + borde * 2;
        const altoTotal = altoFondo + borde * 2;

        // Marco exterior
        grupo.marco = new PIXI.Graphics();
        grupo.marco.lineStyle(borde, lineColor, 1);
        grupo.marco.drawRect(0, 0, anchoTotal, altoTotal);
        this.container.addChild(grupo.marco);

        // Fondo blanco
        grupo.fondo = new PIXI.Graphics();
        grupo.fondo.beginFill(0xFFFFFF);
        grupo.fondo.drawRect(0, 0, anchoFondo, altoFondo);
        grupo.fondo.endFill();
        this.container.addChild(grupo.fondo);

        // Icono (sprite placeholder, se carga después)
        grupo.icono = new PIXI.Sprite(PIXI.Texture.WHITE);
        grupo.icono.anchor.set(0.5);
        this.container.addChild(grupo.icono);

        return { anchoTotal, altoTotal };
    }

    _crearCohetes() {
        this._crearIcono(this.cohetes, this._uxH * 0.42, this._uxH * 0.34, 4, 0x0044CC);
        this._cargarTexturaIcono('cohetes', 'assets/cohetes.png', this.cohetes.icono, this._uxH * 0.35, null);
    }

    _crearTiempoFuera() {
        this._crearIcono(this.tiempo, this._uxH * 0.42, this._uxH * 0.34, 5, 0x0044CC);
        this._cargarTexturaIcono('tiempo', 'assets/tiempo fuera.png', this.tiempo.icono, this._uxH * 0.22, null);
    }

    _crearEscudo() {
        const dims = this._crearIcono(this.escudo, this._uxH * 0.42, this._uxH * 0.34, 5, 0x0044CC);
        this.escudo.icono.width = this._uxH * 0.35;
        this.escudo.icono.height = this._uxH * 0.26;
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

    _crearUlti() {
        this._crearIcono(this.ulti, this._uxH * 0.42, this._uxH * 0.34, 5, 0x0044CC);
        this.ulti.icono.width = this._uxH * 0.26;
        this.ulti.icono.height = this._uxH * 0.30;
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

    _crearPropulsor() {
        this._crearIcono(this.propul, this._uxH * 0.41, this._uxH * 0.34, 4, 0x0044CC);
        this._cargarTexturaIcono('propul', 'assets/propulsor.png', this.propul.icono, this._uxH * 0.35, null);
    }

    _crearDevorador() {
        this._crearIcono(this.deborador, this._uxH * 0.42, this._uxH * 0.34, 4, 0x0044CC);
        this._cargarTexturaIcono('deborador', 'assets/deborador.png', this.deborador.icono, this._uxH * 0.35, null);
    }

    // ========================================================================
    // 8. CONTADOR DEL DEBORADOR
    // ========================================================================

    _crearContadorDevorador() {
        this.contadorDevoradorText = new PIXI.Text('0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: Math.max(10, this._uxH * 0.11),
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 2,
            dropShadowBlur: 4
        });
        this.container.addChild(this.contadorDevoradorText);
    }

    // ========================================================================
    // 10. BARRA DE ACELERACIÓN (W)
    // ========================================================================

    _crearBarraAceleracion() {
        const ancho = this._uxW * 0.22;
        const alto = this._uxH * 0.12;

        // Fondo (borde azul + relleno blanco)
        this.barraAceleracionBg = new PIXI.Graphics();
        this.barraAceleracionBg.beginFill(0xFFFFFF);
        this.barraAceleracionBg.lineStyle(2, 0x0044CC, 1);
        this.barraAceleracionBg.drawRect(0, 0, ancho, alto);
        this.barraAceleracionBg.endFill();
        this.container.addChild(this.barraAceleracionBg);

        // Relleno (azul)
        this.barraAceleracionFill = new PIXI.Graphics();
        this.barraAceleracionFill.beginFill(0x0044CC);
        this.barraAceleracionFill.drawRect(0, 0, 0, alto);
        this.barraAceleracionFill.endFill();
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
            fontSize: Math.max(14, this._uxH * 0.18),
            fill: 0x0044CC,
            fontWeight: 'bold'
        });
        this.puntuacionText.anchor.set(0.5, 1);
        this.container.addChild(this.puntuacionText);
    }

    // ========================================================================
    // POSICIONAMIENTO DENTRO DEL CUADRANTE UX
    // ========================================================================

    /**
     * Posiciona TODOS los elementos del HUD dentro del cuadrante UX.
     *
     * Layout vertical del cuadrante (de arriba a abajo):
     *   1. Panel puntuación  (centrado, parte superior)
     *   2. Barra W           (centrado, debajo de puntuación)
     *   3. Fila de 6 iconos  (centrados, parte inferior)
     *   4. Contador devorador (junto al último icono)
     *
     * @private
     */
    _posicionarEnCuadranteUX() {
        const cx = this.app.screen.width / 2; // Centro horizontal de pantalla
        const uxTop = this._uxY;              // Borde superior del cuadrante
        const uxH = this._uxH;                // Alto del cuadrante

        // =============================================
        // FILA DE 6 ICONOS (parte inferior del cuadrante)
        // =============================================
        const iconos = [
            { grupo: this.tiempo,     borde: 5 },
            { grupo: this.cohetes,    borde: 4 },
            { grupo: this.escudo,     borde: 5 },
            { grupo: this.ulti,       borde: 5 },
            { grupo: this.propul,     borde: 4 },
            { grupo: this.deborador,  borde: 4 },
        ];

        const visibles = iconos.filter(i => i.grupo && i.grupo.marco);
        if (visibles.length > 0) {
            // Calcular tamaño de cada icono para que 6 quepan en el ancho UX
            const separacion = this._uxW * 0.008; // 0.8% del ancho UX
            const anchoIcono = (this._uxW - separacion * (visibles.length - 1)) / visibles.length;
            const altoIcono = anchoIcono * 0.82; // Proporción 1:0.82

            const totalAncho = anchoIcono * visibles.length + separacion * (visibles.length - 1);
            const xInicio = cx - totalAncho / 2;

            // Posición vertical: parte inferior del cuadrante
            const iconoBottomPad = uxH * 0.06; // 6% padding inferior
            const yIconos = uxTop + uxH - iconoBottomPad - altoIcono;

            let xActual = xInicio;
            for (const icono of visibles) {
                const g = icono.grupo;
                const borde = icono.borde;
                const fondoW = anchoIcono - borde * 2;
                const fondoH = altoIcono - borde * 2;

                // Redibujar marco con tamaño correcto
                g.marco.clear();
                g.marco.lineStyle(borde, 0x0044CC, 1);
                g.marco.drawRect(0, 0, anchoIcono, altoIcono);
                g.marco.x = xActual;
                g.marco.y = yIconos;
                g.marco.zIndex = 0;

                // Redibujar fondo con tamaño correcto
                g.fondo.clear();
                g.fondo.beginFill(0xFFFFFF);
                g.fondo.drawRect(0, 0, fondoW, fondoH);
                g.fondo.endFill();
                g.fondo.x = xActual + borde;
                g.fondo.y = yIconos + borde;
                g.fondo.zIndex = 1;

                // Icono centrado
                g.icono.x = xActual + anchoIcono / 2;
                g.icono.y = yIconos + altoIcono / 2;
                g.icono.width = Math.min(g.icono.width || anchoIcono * 0.7, fondoW * 0.85);
                g.icono.height = Math.min(g.icono.height || fondoH * 0.7, fondoH * 0.85);
                g.icono.zIndex = 2;

                xActual += anchoIcono + separacion;
            }

            // Guardar dimensiones para updates dinámicos
            this._iconoAncho = anchoIcono;
            this._iconoAlto = altoIcono;
            this._iconoY = yIconos;

            // =============================================
            // CONTADOR DEVORADOR (junto al último icono)
            // =============================================
            if (this.contadorDevoradorText) {
                this.contadorDevoradorText.x = xActual + separacion;
                this.contadorDevoradorText.y = yIconos + altoIcono / 2;
            }
        }

        // =============================================
        // BARRA DE ACELERACIÓN (W) — centro, debajo de puntuación
        // =============================================
        if (this.barraAceleracionBg) {
            const barraAncho = this._anchoBarraAceleracion;
            const barraAlto = this._altoBarraAceleracion;
            const barraY = uxTop + uxH * 0.28; // 28% desde arriba del cuadrante

            this.barraAceleracionBg.x = cx - barraAncho / 2;
            this.barraAceleracionBg.y = barraY;

            this.barraAceleracionFill.x = cx - barraAncho / 2;
            this.barraAceleracionFill.y = barraY;
        }

        // =============================================
        // PUNTUACIÓN — centro, parte superior del cuadrante
        // =============================================
        if (this.puntuacionText) {
            this.puntuacionText.x = cx;
            this.puntuacionText.y = uxTop + uxH * 0.18;
        }
    }

    // ========================================================================
    // UTILIDADES: CARGA DE TEXTURAS
    // ========================================================================

    /**
     * Crea una textura placeholder VISIBLE (azul oscuro) sobre fondo blanco.
     * @private
     */
    _crearTexturaPlaceholder() {
        const g = new PIXI.Graphics();
        g.beginFill(0x3344AA);
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
        if (!this.container || !this.container.parent) return;

        const actualizadores = [
            () => this._actualizarPanelOleada(),
            () => this._actualizarPuntuacion(),
            () => this._actualizarBarraAceleracion(),
            () => this._actualizarIconoEscudo(),
            () => this._actualizarIconoUlti(),
            () => this._actualizarContadorDevorador(),
        ];

        for (const fn of actualizadores) {
            try { fn(); } catch (e) { /* Silenciar */ }
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

        // Actualizar marco con color dinámico
        const ancho = this._iconoAncho || (this._uxH * 0.42 + 10);
        const alto = this._iconoAlto || (this._uxH * 0.34 + 10);
        this.escudo.marco.clear();
        this.escudo.marco.lineStyle(5, colorMarco, 1);
        this.escudo.marco.drawRect(0, 0, ancho, alto);

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
            alpha = 0.7 + Math.sin(tiempo / 200) * 0.3;
            colorMarco = 0xFFD700;
        } else {
            indiceIcono = Math.floor(porcentajeCarga / 20) + 1;
            if (indiceIcono < 1) indiceIcono = 1;
            if (indiceIcono > 5) indiceIcono = 5;
        }

        this.ulti.icono.texture = this.ulti.sprites[indiceIcono - 1];
        this.ulti.icono.alpha = alpha;

        // Actualizar marco con color dinámico
        const ancho = this._iconoAncho || (this._uxH * 0.42 + 10);
        const alto = this._iconoAlto || (this._uxH * 0.34 + 10);
        this.ulti.marco.clear();
        this.ulti.marco.lineStyle(5, colorMarco, 1);
        this.ulti.marco.drawRect(0, 0, ancho, alto);
    }

    _actualizarContadorDevorador() {
        if (!this.contadorDevoradorText || !this.game) return;
        const cantidad = this.game.particulasCapturadas || 0;
        this.contadorDevoradorText.text = cantidad.toString();
    }

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    onResize() {
        this._calcularDimensiones();
        this.destruir();
        this._inicializar();
    }

    destruir() {
        if (this.container) {
            this.container.removeFromParent();
            this.container.destroy({ children: true });
        }
        this.inicializado = false;
    }
}
