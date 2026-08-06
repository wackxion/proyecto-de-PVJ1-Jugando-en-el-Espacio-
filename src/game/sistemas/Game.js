/**
 * Juego - Clase principal del juego (Main Game Class)
 * 
 * Esta es la clase más importante del juego. Maneja:
 * - El bucle principal del juego (game loop)
 * - La creación y renderizado de todos los objetos
 * - La detección y procesamiento de colisiones
 * - El estado general del juego (puntuación, escudos, game over)
 * - La interfaz de usuario (UI)
 * 
 * Actúa como el "director" del juego, coordinando todas las demás clases.
 */
import { Jugador } from '../entidades/Player.js';
import { Proyectil } from '../entidades/Projectile.js';
import { EnemyProjectile } from '../entidades/EnemyProjectile.js';
import { Enemigo } from '../entidades/Enemy.js';
import { EnemyShip } from '../entidades/EnemyShip.js';
import { SpecialEnemy } from '../entidades/SpecialEnemy.js';
import { UltiEffect } from '../efectosVisuales/UltiEffect.js';
import { SuccionEffect } from '../efectosVisuales/SuccionEffect.js';
import { BurstEffect } from '../efectosVisuales/BurstEffect.js';
import { HitEffect } from '../efectosVisuales/HitEffect.js';
import { ProyectilExplosion } from '../efectosVisuales/ProyectilExplosion.js';
import { AsteroidExplosion } from '../efectosVisuales/AsteroidExplosion.js';
import { Top5 } from '../mecanicas/Top5.js';
import { BoidParticle } from '../efectosVisuales/BoidParticle.js';
import { Cohete } from '../mecanicas/Cohete.js';
import { UIManager } from '../../ui/UIManager.js';
import { GestorEntrada } from '../../systems/InputManager.js';
import { ControlesTactiles } from '../../systems/TouchControls.js';
import { Anuncios } from '../../systems/Anuncios.js';
import { GestorSonido } from '../../systems/SoundManager.js';
import { CONFIG } from '../../config.js';

// === MÓDULOS REFACTORIZADOS ===
import { crearProyectil, actualizarProyectiles, actualizarProyectilesJugador, actualizarProyectilesEnemigos, procesarColisionesProyectiles } from './GameProjectiles.js';
import { generarEnemigo, actualizarEnemigos, generarNaveEnemiga, actualizarNavesEnemigas, actualizarNavesEnemigasCompleto, verificarPosicionLibre, actualizarGeneracion, procesarColisionesJugador, procesarColisionesEnemigos, procesarColisionesMiniEspeciales } from './GameEnemies.js';
import { actualizarHabilidadCohetes, actualizarHabilidadDevorador, actualizarHabilidadPropulsor } from './GameSkills.js';
import { activarUlti, actualizarUlti, actualizarEfectosImpacto } from './GameEffects.js';
import { crearParticulaFuera, actualizarParticulasBoid, resetearContadorCapturadas, actualizarSistemaBoid } from './GameBoids.js';
import { inicializarMejoras } from './GameMejoras.js';
import { PixiHUD } from '../ui/PixiHUD.js';

export class Game {
    /**
     * Constructor del juego
     * Inicializa todas las variables principales vacías o en cero
     */
    constructor() {
        // PIXI Application - representa el lienzo (canvas) del juego
        // Se crea en init() y contiene el stage donde se renderizan los objetos
        this.aplicacion = null;
        
        // Objeto del jugador (la nave)
        this.jugador = null;
        
        // InputManager - maneja el teclado
        this.gestorEntrada = null;

        // GestorSonido - maneja los efectos de sonido y la música
        this.gestorSonido = null;

        // Puntuación actual del jugador
        this.puntuacion = 0;
        
        // Arrays (listas) para almacenar diferentes tipos de objetos del juego
        // objetosJuego = objetos genéricos
        this.objetosJuego = [];
        
        // Proyectiles = proyectiles disparados por la nave
        this.proyectiles = [];
        
        // Proyectiles enemigos
        this.proyectilesEnemigos = [];
        
        // Enemies = asteroides
        this.enemigos = [];
        
        // EnemyShips = naves enemigas
        this.enemigosNaves = [];
        
        // SpecialEnemies = asteroides especiales con comportamiento propio
        this.enemigosSpeciales = [];
        
        // EfectosExplosion = efectos visuales de partículas al destruir especial
        this.efectosExplosion = [];
        
        // EfectosImpacto = efectos visuales de impacto al golpear asteroides
        this.efectosImpacto = [];
        
        // Partículas Boid = partículas con comportamiento de enjambre
        this.particulasBoid = [];
        
        // EfectoUlti = el ataque especial (aro expansivo)
        this.efectoUlti = null;
        
        // EfectoSuccion = efecto de succión del devorador (aro contractivo)
        this.efectoSuccion = null;
        
        // Ejecutando = flag que indica si el juego está activo
        // true = el bucle del juego se está ejecutando
        // false = el juego está pausado o terminado
        this.ejecutando = false;
        
        // Configuración del juego (game settings)
        
        // TemporizadorSpawn = temporizador para generar nuevos asteroides
        // Se incrementa en cada frame y cuando alcanza un valor, aparece un nuevo asteroide
        this.temporizadorSpawn = 0;
        
        // IntervaloSpawn = tiempo en segundos entre cada oleada de asteroides
        // Se reduce progresivamente para aumentar la dificultad
        this.intervaloSpawn = CONFIG.MUNDO.SPAWN_INTERVALO;
        this.intervaloMinimoSpawn = CONFIG.MUNDO.SPAWN_INTERVALO_MINIMO; // Mínimo intervalo (máxima dificultad)
        this.tasaDisminucionSpawn = CONFIG.MUNDO.SPAWN_TASA_DISMINUCION; // Cuánto se reduce el intervalo por oleada (5 centésimas)
        
        // Temporizador para naves enemigas (cada 10 segundos)
        this.temporizadorNaveEnemiga = 0;
        this.intervaloNaveEnemiga = CONFIG.MUNDO.NAVE_ENEMIGA_INTERVALO; // Nueva nave cada 10 segundos
        
        // ContadorOleadas = contador de oleadas para determinar dificultad
        this.contadorOleadas = 0;
        
        // AsteroidesDestruidos = contador de asteroides destruidos en la oleada actual
        // La oleada avanza cuando se destruyen 10, 20, 30, etc.
        this.asteroidesDestruidos = 0;
        this.objetivoOleada = CONFIG.MUNDO.OLEADA_OBJETIVO; // Asteroides a destruir para completar la primera oleada
        this.multiplicadorOleada = 1; // Multiplicador para siguiente oleada (10, 20, 30...)
        
        // MaximoEnemigos = cantidad máxima de asteroides en pantalla
        this.maximoEnemigos = CONFIG.MUNDO.MAX_ASTEROIDES;
        
        // Ancho y alto del área de juego
        this.anchoJuego = CONFIG.MUNDO.ANCHO;
        this.altoJuego = CONFIG.MUNDO.ALTO;
        
        // Texturas cargadas desde assets
        this.texturaJugador = null;
        this.texturaAsteroide = null;
        this.texturaFondo = null;

        // Elementos de fin de juego
        this.elementosFinJuego = [];

        // Flag para evitar limpieza duplicada
        this.limpiezaEnProgreso = false;

        // === PIXI HUD (HUD en PixiJS) ===
        // Se inicializa después de crear la aplicación PixiJS
        this.pixiHUD = null;
        
        // Sistema de Top 5
        this.top5 = new Top5();
        
        // Flag para saber si se pidió nombre
        this.nombreIngresado = false;
        
        // Flag para saber si estamos esperando nombre para el Top 5
        // Evita que clicks reinicien el juego mientras se escribe el nombre
        this.esperandoNombreTop5 = false;
        
        // Flag para saber si estamos en Game Over
        this.enGameOver = false;
        
        // === BANDERAS DE PAUSA Y TOP 5 ===
        // this.pausado = indica si el juego está en pausa
        // this.mostrandoTop5EnPausa = indica si se está mostrando el Top 5 durante la pausa
        this.pausado = false;
        this.mostrandoTop5EnPausa = false;
        
        // === ESTILOS PREDEFINIDOS PARA PIXI.TEXT ===
        // Para reutilizar y evitar repetir código
        this.estilos = {
            // Estilo para títulos (Game Over, etc.)
            titulo: {
                fontFamily: 'Segoe Script, Lucida Handwriting, Bradley Hand, cursive',
                fontSize: 30,
                fill: 0x0044CC,
                fontWeight: 'bold'
            },
            // Estilo para texto azul normal
            textoAzul: {
                fontFamily: 'Segoe Script, cursive',
                fontSize: 20,
                fill: 0x0044CC
            },
            // Estilo para texto blanco
            textoBlanco: {
                fontFamily: 'Segoe Script, cursive',
                fontSize: 20,
                fill: 0xFFFFFF
            },
            // Estilo para encabezado de tabla (Top 5)
            encabezado: {
                fontFamily: 'Segoe Script, cursive',
                fontSize: 16,
                fill: 0x0044CC,
                fontWeight: 'bold'
            },
            // Estilo para filas de tabla (Top 5)
            filaTabla: {
                fontFamily: 'Segoe Script, cursive',
                fontSize: 17,
                fill: 0x0044CC
            }
        };
    }
    
    /**
     * Inicializa el juego
     * Se llama una sola vez cuando comienza el juego
     * 
     * @param {HTMLDivElement} container - Elemento HTML donde se va a dibujar el juego
     */
    async init(container, onProgress = null, uiManager = null) {
        // Guardar referencia al contenedor
        this.contenedorJuego = container;
        if (uiManager) this.uiManager = uiManager;
        if (onProgress) onProgress(5, 'PREPARANDO...');
        
        
        
        // Obtener el tamaño de la ventana del navegador
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        
        
        // Crear la aplicación PixiJS
        // PIXI.Application es la clase principal de PixiJS que maneja el canvas
        this.aplicacion = new PIXI.Application();
        
        // Antialias: ON en PC (bordes de vectores suaves), OFF en celular (touch)
        // para ahorrar fill-rate en la GPU del G04. Casi todo el arte son sprites
        // (PNG, ya suaves), así que en móvil el impacto visual es mínimo.
        const _modoTouch = GestorEntrada.cargarModoControl() === 'touch';

        // Inicializar la aplicación con configuración
        await this.aplicacion.init({
            width: width,
            height: height,
            backgroundColor: 0x0D0D1A,
            antialias: !_modoTouch,
            resolution: 1,
            autoDensity: true
        });
        if (onProgress) onProgress(20, 'INICIANDO PIXI...');

        
        // Agregar el canvas (elemento visual del juego) al contenedor HTML
        container.appendChild(this.aplicacion.canvas);
        
        
        // Guardar las dimensiones del área de juego (= tamaño de la VENTANA/cámara)
        this.anchoJuego = width;
        this.altoJuego = height;

        // === MUNDO / CÁMARA ===
        // El "mundo" es un contenedor más grande que la pantalla; la cámara lo
        // desplaza para seguir a la nave. Todos los objetos del juego (fondo,
        // nave, enemigos, partículas, proyectiles, efectos) viven dentro de
        // this.mundo. El HUD y los overlays (Game Over, Top 5) quedan FUERA,
        // directamente en el stage, así no se mueven con la cámara.
        // Mundo toroidal 5× la pantalla (antes 3×): aleja la "costura" del toroide,
        // así los enemigos mueren más adentro de la vista y se ven sus explosiones
        // (antes, cerca del borde del mundo, morían off-screen). NO agrega carga:
        // las entidades están capadas y spawnean relativas a la nave, no al mundo.
        this.mundoAncho = width * 5;
        this.mundoAlto = height * 5;
        this.mundo = new PIXI.Container();
        this.mundo.sortableChildren = true;
        this.mundo.scale.set(CONFIG.CAMARA.ZOOM);   // zoom de cámara (aleja/acerca)
        this.aplicacion.stage.addChild(this.mundo);
        this._camaraX = 0;
        this._camaraY = 0;
        // Resetear acumuladores de cámara/parallax para no arrastrar estado previo
        this._prevJugX = undefined; this._prevJugY = undefined;
        this._shipContX = undefined; this._shipContY = undefined;
        this._bgX = 0; this._bgY = 0;
        this._lookX = 0; this._lookY = 0;

        // Crear el InputManager para manejar el teclado
        this.gestorEntrada = new GestorEntrada();

        // Controles táctiles (celular): overlay con joystick virtual + botones.
        // Se crea siempre (barato) pero solo se MUESTRA en dispositivos táctiles.
        if (!this.controlesTactiles) {
            this.controlesTactiles = new ControlesTactiles(document.body, this.gestorEntrada);
        }

        // AdMob (anuncio recompensado para revivir). En la web queda inactivo.
        if (!this.anuncios) {
            this.anuncios = new Anuncios();
            this.anuncios.inicializar();
        }


        // Crear el GestorSonido y registrar los sonidos del juego
        this.gestorSonido = new GestorSonido();
        this._registrarSonidos();

        // Cargar los assets (imágenes) del juego
        if (onProgress) onProgress(35, 'CARGANDO ASSETS...');
        await this._cargarRecursos();
        if (onProgress) onProgress(70, 'CREANDO MUNDO...');
        
        
        // Crear el fondo con estrellas
        this._crearFondo();
        
        
        // Crear el jugador (nave)
        this._crearJugador();
        
        // Cargar textura Pboids2
        const texturasPboids = [];
        try {
            const rutasPboids = ['assets/Pboids1.png', 'assets/Pboids2.png'];
            for (const ruta of rutasPboids) {
                try {
                    texturasPboids.push(await PIXI.Assets.load(ruta));
                } catch (e) {
                    // Si falta un frame, seguimos con los que cargaron.
                }
            }
        } catch (e) {
            // Fallback final abajo.
        }

        if (texturasPboids.length === 0) {
            texturasPboids.push(PIXI.Texture.WHITE);
        }

        // Cargar el icono dedicado que muestra el HUD al recolectar partículas.
        let texturaIconoParticulaBoid = null;
        try {
            texturaIconoParticulaBoid = await PIXI.Assets.load('assets/pboids_Icon.png');
        } catch (e) {
            // El HUD usará Pboids2 o el primer frame como respaldo.
        }

        // Usar el primer frame como textura base de la animación Boid.
        this.texturaParticulaBoid = texturasPboids[0] || PIXI.Texture.WHITE;
        this.texturasPboids = texturasPboids;
        this.texturaIconoParticulaBoid = texturaIconoParticulaBoid
            || texturasPboids[1]
            || this.texturaParticulaBoid;

        // Textura del proyectil cohete. Primero se crea un rectángulo rojo de
        // FALLBACK y luego se intenta cargar el sprite real; si el archivo carga
        // bien, reemplaza al fallback. (Va acá, después de _cargarRecursos(), para
        // que el fallback no pise al sprite ya cargado.)
        const graphicsCohete = new PIXI.Graphics();
        graphicsCohete.beginFill(0xFF4400); // Naranja/rojo
        graphicsCohete.drawRect(0, 0, 16, 8);
        graphicsCohete.endFill();
        this.texturaCohete = this.aplicacion.renderer.generateTexture(graphicsCohete);
        try {
            const coheteTex = await PIXI.Assets.load('assets/cohetes -habilidad.png');
            if (coheteTex) this.texturaCohete = coheteTex;
        } catch (e) {
            console.error('No se pudo cargar cohetes -habilidad.png; el cohete usará la textura por defecto', e);
        }
        
        
        // Configurar la interfaz de usuario (UI)
        this._configurarUI();
        if (onProgress) onProgress(85, 'PREPARANDO HUD...');

        // === INICIALIZAR PIXI HUD (migración desde HTML) ===
        // Crea todos los elementos del HUD usando PixiJS en lugar de HTML
        this.pixiHUD = new PixiHUD(this.aplicacion, this);

        // Iniciar el bucle del juego
        // ticker.add() registra una función que se llama en cada frame (60 veces por segundo)
        this.aplicacion.ticker.add(this._gameLoop.bind(this));
        this.ejecutando = true;

        // Arrancar la música de la partida (el clic en JUGAR desbloqueó el audio)
        this._iniciarMusicaJuego();
        if (onProgress) onProgress(95, 'ARRANCANDO...');
    }
    
    /**
     * Carga los assets (recursos) del juego
     * Son las imágenes que se usan en el juego
     */
    async _cargarRecursos() {
        
        try {
            // Inicializar PixiJS Assets
            await PIXI.Assets.init();
            
            // Cargar las imágenes desde la carpeta assets/
            // Usar el API de PixiJS v8
const [naveTexture, asteroideTexture, fondoTexture, proyectilTexture, explocion1, explocion2, explocion3, explocion4, explocion5, astroExplosion1, astroExplosion2, astroExplosion3, astroExplosion4, astroExplosion5, enimigoTexture, asteroideSpecialTexture] = await Promise.all([
                PIXI.Assets.load('assets/Nave322.png'),
                PIXI.Assets.load('assets/asteroide250.png'),
                PIXI.Assets.load('assets/fondoEspacio3.png'),
                PIXI.Assets.load('assets/proyectil1.png'),
                PIXI.Assets.load('assets/proyectil2Explocion.png'),
                PIXI.Assets.load('assets/proyectil3Explocion.png'),
                PIXI.Assets.load('assets/proyectil4Explocion.png'),
                PIXI.Assets.load('assets/proyectil5Explocion.png'),
                PIXI.Assets.load('assets/proyectil6Explocion.png'),
                PIXI.Assets.load('assets/explocionAsteroides1.png'),
                PIXI.Assets.load('assets/explocionAsteroides2.png'),
                PIXI.Assets.load('assets/explocionAsteroides3.png'),
                PIXI.Assets.load('assets/explocionAsteroides4.png'),
                PIXI.Assets.load('assets/explocionAsteroides5.png'),
                PIXI.Assets.load('assets/enimigo1.png'),
                PIXI.Assets.load('assets/asteroideESP.png')
            ]);

            // Explosiones dedicadas: asteroides (rojo) y naves enemigas (verde), 4 frames c/u
            const [expRojo1, expRojo2, expRojo3, expRojo4, expVerde1, expVerde2, expVerde3, expVerde4] = await Promise.all([
                PIXI.Assets.load('assets/esplocionRojo1.png'),
                PIXI.Assets.load('assets/esplocionRojo2.png'),
                PIXI.Assets.load('assets/esplocionRojo3.png'),
                PIXI.Assets.load('assets/esplocionRojo4.png'),
                PIXI.Assets.load('assets/esplocionVerde1.png'),
                PIXI.Assets.load('assets/esplocionVerde2.png'),
                PIXI.Assets.load('assets/esplocionVerde3.png'),
                PIXI.Assets.load('assets/esplocionVerde4.png')
            ]);

            // Variantes de nave enemiga (spray). Al generar una nave se elige una al azar.
            const [naveEnem2, naveEnem3, naveEnem4, naveEnem5] = await Promise.all([
                PIXI.Assets.load('assets/enimigo2.png'),
                PIXI.Assets.load('assets/enimigo3.png'),
                PIXI.Assets.load('assets/enimigo4.png'),
                PIXI.Assets.load('assets/enemigo5.png')
            ]);

            // Asignar las texturas cargadas
            this.texturaJugador = naveTexture;
            this.texturaAsteroide = asteroideTexture;
            this.texturaAsteroideSpecial = asteroideSpecialTexture;
            this.texturaFondo = fondoTexture;
            this.texturaProyectil = proyectilTexture;
            this.texturaExplosion = [explocion1, explocion2, explocion3, explocion4, explocion5];
            this.texturaAsteroidExplosion = [astroExplosion1, astroExplosion2, astroExplosion3, astroExplosion4, astroExplosion5];
            // Explosión roja para asteroides, verde para naves enemigas (el especial sigue usando texturaAsteroidExplosion con tinte azul)
            this.texturaExplosionAsteroide = [expRojo1, expRojo2, expRojo3, expRojo4];
            this.texturaExplosionNave = [expVerde1, expVerde2, expVerde3, expVerde4];
            this.texturaNaveEnemiga = enimigoTexture;
            // Conjunto de variantes de nave enemiga (incluye la original). generarNaveEnemiga elige una al azar.
            this.texturasNaveEnemiga = [enimigoTexture, naveEnem2, naveEnem3, naveEnem4, naveEnem5].filter(Boolean);

            // Crear textura de partícula Boid (2x2px) programáticamente
            // Usar un Graphics directamente como fallback
            this.texturaParticulaBoid = PIXI.Texture.WHITE;
            
            // Verificar que la textura se cargó correctamente
            if (!this.texturaNaveEnemiga) {
                console.error('Error: textura de nave enemiga no se cargó');
            }
            
        } catch (error) {
            console.error('Error cargando assets:', error);
            
            
            // Crear Graphics para la nave
            const naveGraphics = new PIXI.Graphics();
            // Triángulo de nave
            naveGraphics.moveTo(25, 0);
            naveGraphics.lineTo(-15, -15);
            naveGraphics.lineTo(-10, 0);
            naveGraphics.lineTo(-15, 15);
            naveGraphics.closePath();
            naveGraphics.fill(0x00AAFF);
            // Convertir a textura
            this.texturaJugador = this.aplicacion.renderer.generateTexture(naveGraphics);
            
            // Crear Graphics para el asteroide
            const astroGraphics = new PIXI.Graphics();
            astroGraphics.circle(0, 0, 30);
            astroGraphics.fill(0xCC0000);
            // Agregar algunos cráteres
            astroGraphics.circle(-10, -5, 8);
            astroGraphics.fill(0x990000);
            astroGraphics.circle(8, 10, 5);
            astroGraphics.fill(0x990000);
            // Convertir a textura
            this.texturaAsteroide = this.aplicacion.renderer.generateTexture(astroGraphics);
            
        }
    }
    
    /**
     * Crea el fondo del juego usando una imagen
     * Si no hay imagen, dibuja estrellas programáticamente
     */
    _crearFondo() {
        const sw = this.anchoJuego, sh = this.altoJuego;

        if (this.texturaFondo) {
            // PARALLAX: dos capas fijas a la PANTALLA que se desplazan a una
            // fracción del movimiento de la cámara → dan profundidad (el mundo se
            // mueve 1:1, el fondo más lento). Van DEBAJO del mundo en el stage.
            this.fondoParallax = new PIXI.TilingSprite({ texture: this.texturaFondo, width: sw, height: sh });
            this.fondoParallax.factorParallax = 0.5;
            this.aplicacion.stage.addChildAt(this.fondoParallax, 0);

            // Capa de estrellas que titilan (más cercana, parallax más rápido)
            this._crearEstrellas();
        } else {
            // Fallback: estrellas dibujadas dentro del mundo
            this._crearFondoConEstrellas(this.mundoAncho, this.mundoAlto);
        }
    }

    /**
     * Crea el campo de estrellas que TITILAN: estrellas individuales, cada una
     * con su ritmo, que se prenden y apagan (invisibles al apagarse). Se
     * desplazan con parallax y se envuelven (wrap) para cubrir siempre la
     * pantalla. Van debajo del mundo, encima del fondo. @private
     */
    _crearEstrellas() {
        this.estrellas = new PIXI.Container();
        this.aplicacion.stage.addChildAt(this.estrellas, 1);
        this.estrellasFactor = 0.85;
        this.estrellasData = [];
        this._estT = 0;
        const tex = this._crearTexturaPuntoEstrella();
        const N = 40;   // menos estrellas de fondo = menos sprites que actualizar/renderizar en el celu (antes 90)
        for (let i = 0; i < N; i++) {
            const sp = new PIXI.Sprite(tex);
            sp.anchor.set(0.5);
            sp.scale.set(0.5 + Math.random() * 1.3);
            this.estrellas.addChild(sp);
            this.estrellasData.push({
                sp,
                bx: Math.random(),                  // posición base normalizada [0,1)
                by: Math.random(),
                fase: Math.random() * Math.PI * 2,  // desfase del titileo
                vel: 0.5 + Math.random() * 2.5,     // velocidad de titileo (cada una distinta)
                brilloMax: 0.45 + Math.random() * 0.55
            });
        }
    }

    /**
     * Textura chica de un punto de estrella (con un halo tenue). @private
     */
    _crearTexturaPuntoEstrella() {
        const g = new PIXI.Graphics();
        g.circle(5, 5, 3).fill({ color: 0xFFFFFF, alpha: 0.25 }); // halo
        g.circle(5, 5, 1.6).fill({ color: 0xFFFFFF, alpha: 1 });  // núcleo
        return this.aplicacion.renderer.generateTexture(g);
    }

    /**
     * Actualiza el titileo y el parallax de las estrellas. Cada estrella oscila
     * su brillo (curva al cuadrado → pasa más tiempo "apagada") y se oculta del
     * todo cuando está apagada. El parallax se aplica con wrap (módulo).
     * @private
     */
    _actualizarEstrellas(delta) {
        if (!this.estrellas || !this.estrellasData) return;
        const pad = 40;
        const tw = this.anchoJuego + pad, th = this.altoJuego + pad;
        // Usa la referencia CONTINUA del parallax (no salta al envolver la nave).
        const refX = (this._bgX ?? this._camaraX), refY = (this._bgY ?? this._camaraY);
        const ox = -refX * this.estrellasFactor;
        const oy = -refY * this.estrellasFactor;
        this._estT += (delta > 0 ? delta : 1 / 60);
        for (const d of this.estrellasData) {
            let x = (d.bx * tw + ox) % tw; if (x < 0) x += tw;
            let y = (d.by * th + oy) % th; if (y < 0) y += th;
            d.sp.x = x - pad / 2;
            d.sp.y = y - pad / 2;
            const osc = Math.sin(this._estT * d.vel + d.fase) * 0.5 + 0.5; // 0..1
            const a = osc * osc * d.brilloMax; // al cuadrado: pasa más tiempo apagada
            if (a > 0.03) { d.sp.visible = true; d.sp.alpha = a; }
            else { d.sp.visible = false; } // apagada = no se ve
        }
    }
    
    /**
     * Dibuja estrellas programáticamente (fallback)
     * Se usa si no hay imagen de fondo
     */
    _crearFondoConEstrellas(w, h) {
        // Crear objeto gráfico para dibujar
        const graphics = new PIXI.Graphics();
        
        // Dibujar rectángulo negro que cubre toda la pantalla
        graphics.rect(0, 0, w, h);
        graphics.fill(0x0D0D1A); // Color negro espacial
        
        // Calcular cantidad de estrellas según el tamaño de la pantalla
        const starCount = Math.floor((w * h) / 4000);
        
        // Dibujar cada estrella
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = Math.random() * 2 + 1;
            const alpha = Math.random() * 0.5 + 0.3;
            
            graphics.circle(x, y, size);
            graphics.fill({ color: 0xFFFFFF, alpha: alpha });
        }
        
        // Agregar el fondo al MUNDO
        this.mundo.addChild(graphics);
    }
    
    /**
     * Crea el jugador (nave espacial)
     * Se posiciona en el centro de la pantalla
     */
    _crearJugador() {
        // Posición central DEL MUNDO (no de la pantalla): la cámara lo seguirá
        const centerX = this.mundoAncho / 2;
        const centerY = this.mundoAlto / 2;


        // Crear el objeto Player. Sus límites de movimiento son los del MUNDO.
        this.jugador = new Jugador(centerX, centerY, this.texturaJugador, this.mundoAncho, this.mundoAlto);
        
        
        // Guardar referencia al juego en el jugador
        // Esto permite que el jugador pueda crear proyectiles
        this.jugador.juego = this;
        
        // Resetear la velocidad de disparo al valor inicial
        this.jugador.reiniciarVelocidadDisparo();
        
        // Renderizar el jugador en el stage
        this.jugador.render(this.mundo);
        
        
        // Inicializar sistema de mejoras después de crear el jugador
        inicializarMejoras(this);
        this.aplicarMejoras();
    }
    
    /**
     * Aplica las mejoras compradas al juego
     * Se llama al inicializar y al comprar mejoras
     */
    aplicarMejoras() {
        // Aplicar reducción de coste ULTi (indices 10-14)
        // Cada compra reduce 50, máximo 250 de reducción (500 - 250 = 250 mínimo)
        if (this.jugador && this.mejoras) {
            let reduccionUlti = 0;
            for (let i = 10; i <= 14; i++) {
                if (this.mejoras[i] >= 1) {
                    reduccionUlti += 50;
                }
            }
            this.jugador.cargaMaxUlti = Math.max(250, this.jugador.cargaMaxUltiBase - reduccionUlti);
        }
        
        // Guardar bonificación de regeneración para tiempo fuera (indices 15-19)
        // +5, +10, +15, +20, +30 = máximo +80
        if (this.mejoras) {
            let regeneracionBonus = 0;
            for (let i = 15; i <= 19; i++) {
                if (this.mejoras[i] >= 1) {
                    regeneracionBonus += [5, 10, 15, 20, 30][i - 15];
                }
            }
            this.regeneracionTiempoFueraBonus = regeneracionBonus;
        }
        
        // Aplicar bonus de escudos al jugador (indices 5-9)
        // +50 por cada mejora, máximo +250 (5 * 50)
        let escudosBonus = 0;
        for (let i = 5; i <= 9; i++) {
            if (this.mejoras[i] >= 1) escudosBonus += 50;
        }
        if (this.jugador) {
            this.jugador.escudosMax = 100 + escudosBonus;
            // NO resetear la vida al aplicar mejoras (esto corre en cada compra):
            // solo asegurar que no supere el nuevo máximo. La cura al comprar la
            // mejora de escudo se hace aparte, en comprarMejoraSeccion.
            this.jugador.escudos = Math.min(this.jugador.escudos, this.jugador.escudosMax);
        }

        // Helper: cuántos niveles comprados en una sección (índice de inicio)
        const nivelSeccion = (inicio) => {
            let n = 0;
            for (let i = inicio; i < inicio + 5; i++) if ((this.mejoras[i] || 0) >= 1) n++;
            return n;
        };

        // Aceleración (20-24): +tiempo de aceleración. Se aumenta la capacidad de
        // la barra de sobrecalentamiento (+40 por mejora → base 100, hasta 300 =
        // 3× el tiempo antes de sobrecalentar). La barra sigue siendo 0-100%.
        if (this.jugador) {
            const nAcel = nivelSeccion(20);
            this.jugador.cargaMax = CONFIG.ACELERACION.CARGA_MAXIMA + nAcel * 40;
        }

        // Propulsor (25-29): -2 s de cooldown por mejora (base 15 s, mínimo 3 s).
        if (this.gestorEntrada) {
            const nProp = nivelSeccion(25);
            this.gestorEntrada.enfriamientoPropulsorMax = Math.max(3, CONFIG.HABILIDADES.PROPULSOR_COOLDOWN - 2 * nProp);
        }

        // Devorador (30-34): +40% de rango y velocidad de atracción por mejora,
        // hasta un máximo de +200% (×3) con las 5 mejoras. Lo leen GameSkills
        // (atracción) y GameBoids (rango de reseteo).
        this.mejoraDevoradorMult = 1 + 0.4 * nivelSeccion(30);

        // Cohetes (35-39): +1 cohete por mejora (base 2, hasta 7). Lo lee GameSkills.
        this.mejoraCohetesExtra = nivelSeccion(35);
    }

    /**
     * Compra el PRÓXIMO nivel de una sección de mejora (0,5,10,15). Es lo que
     * dispara el clic en el icono de mejora de un cuadrante del HUD nuevo:
     * descuenta partículas capturadas, marca el nivel y aplica el efecto.
     * @param {number} seccion - índice de inicio de la sección (0,5,10,15)
     * @returns {'ok'|'sinSaldo'|'maxeada'}
     */
    comprarMejoraSeccion(seccion) {
        if (!this.mejoras || !this.costosMejoras) return 'maxeada';
        // Próximo nivel sin comprar dentro de la sección
        let idx = -1;
        for (let i = seccion; i < seccion + 5; i++) {
            if ((this.mejoras[i] || 0) === 0) { idx = i; break; }
        }
        if (idx < 0) return 'maxeada';
        const costo = this.costosMejoras[idx] || 0;
        if ((this.particulasCapturadas || 0) < costo) {
            if (this.gestorSonido) this.gestorSonido.reproducir('particulasInsuficientes');
            return 'sinSaldo';
        }
        this.particulasCapturadas -= costo;
        this.mejoras[idx] = 1;
        this.aplicarMejoras();
        // Solo la mejora de ESCUDO (sección 5) restaura vida al comprarse.
        if (seccion === 5 && this.jugador) {
            this.jugador.escudos = Math.min(this.jugador.escudosMax, this.jugador.escudos + CONFIG.MEJORAS.ESCUDO_RESTAURACION);
        }
        if (this.gestorSonido) this.gestorSonido.reproducir('mejora');
        return 'ok';
    }

    /**
     * Reproduce el sonido de captura de Boid con "throttle": como se pueden
     * capturar muchas partículas por segundo, limita la frecuencia (mínimo
     * ~90ms entre sonidos) para que no se amontonen en una cacofonía.
     */
    _sonidoCapturaBoid() {
        if (!this.gestorSonido) return;
        const ahora = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        if (ahora - (this._ultimoSonidoBoid || 0) < 90) return;
        this._ultimoSonidoBoid = ahora;
        this.gestorSonido.reproducir('particulaBoid');
    }

    /**
     * Crear partícula en posición aleatoria (FUERA de la pantalla)
     * @returns {BoidParticle} Nueva partícula
     */
_crearParticulaBoidFuera() {
        // Elegir un lado aleatorio: 0=arriba, 1=derecha, 2=abajo, 3=izquierda
        const lado = Math.floor(Math.random() * 4);
        let x, y;
        let vx, vy;

        // Margen fijo de 100px
        const margen = 100;

        // Velocidad fija
        const velocidadBase = 100;
        const velocidadLateral = 50;

        switch(lado) {
            case 0: // Arriba
                x = Math.random() * this.anchoJuego;
                y = -margen;
                vx = (Math.random() - 0.5) * velocidadLateral;
                vy = velocidadBase + Math.random() * (velocidadBase * 0.5);
                break;
            case 1: // Derecha
                x = this.anchoJuego + margen;
                y = Math.random() * this.altoJuego;
                vx = -(velocidadBase + Math.random() * (velocidadBase * 0.5));
                vy = (Math.random() - 0.5) * velocidadLateral;
                break;
            case 2: // Abajo
                x = Math.random() * this.anchoJuego;
                y = this.altoJuego + margen;
                vx = (Math.random() - 0.5) * velocidadLateral;
                vy = -(velocidadBase + Math.random() * (velocidadBase * 0.5));
                break;
            case 3: // Izquierda
                x = -margen;
                y = Math.random() * this.altoJuego;
                vx = velocidadBase + Math.random() * (velocidadBase * 0.5);
                vy = (Math.random() - 0.5) * velocidadLateral;
                break;
        }
        
        // Usar pool para obtener partícula
        const particula = new BoidParticle(x, y, this.texturaParticulaBoid, this.texturasPboids);
        
        // Configurar posición y velocidad
        particula.x = x;
        particula.y = y;
        particula.velX = vx;
        particula.velY = vy;
        particula.active = true;
        
        // Configurar sprite
        if (particula.imagen) {
            particula.imagen.x = x;
            particula.imagen.y = y;
            particula.imagen.visible = true;
        }
        
        return particula;
    }
    
    /**
     * Configura la interfaz de usuario usando UIManager
     * Crea los elementos HTML dinámicamente
     */
    _configurarUI() {
        // Crear UIManager (menús, tutorial, Top 5, créditos). El HUD in-game
        // se renderiza con PixiHUD.js, que lee el estado del juego directamente.
        if (!this.uiManager && this.contenedorJuego) {
            this.uiManager = new UIManager(this.contenedorJuego, {});
        }

        if (this.uiManager) {
            // Estado real consumido por PixiHUD y las habilidades
            this.particulasCapturadas = 0;

            // Habilidad Tiempo Fuera (pasiva) - la gestiona PixiHUD._actualizarIconoTiempo()
            this.tiempoFueroActivo = false;
            this.timerTiempoFuera = 0;
            this.duracionTiempoFuera = 25;

            // Animación del reloj de Tiempo Fuera
            this.relojFrameActual = 1;
            this.timerAnimacionReloj = 0;
            this.intervaloAnimacionReloj = 0.3; // 0.3 segundos por frame

            // Cohetes activos (habilidad Q)
            this.cohetes = [];
        }
    }

    /**
     * Registra (precarga) todos los sonidos del juego en el GestorSonido.
     * Único lugar donde se agregan sonidos nuevos a medida que se consiguen.
     * Los archivos van en assets/audio/.
     */
    _registrarSonidos() {
        if (!this.gestorSonido) return;

        // Los volúmenes salen de config.js (CONFIG.AUDIO.VOLUMENES), así se
        // ajustan todos en un solo lugar. Acá solo se mapea cada clave a su archivo.
        const V = CONFIG.AUDIO.VOLUMENES;

        // --- Habilidades del jugador ---
        this.gestorSonido.cargar('disparo', 'assets/audio/disparo.mp3', V.disparo);
        this.gestorSonido.cargar('ulti', 'assets/audio/ulti.mp3', V.ulti);
        this.gestorSonido.cargar('propulsor', 'assets/audio/propulsor.mp3', V.propulsor);
        this.gestorSonido.cargar('roturaEscudos', 'assets/audio/rotura de escudos.mp3', V.roturaEscudos);
        this.gestorSonido.cargar('sobrecalentamientoW', 'assets/audio/sobrecalentamiento(w).mp3', V.sobrecalentamientoW);
        this.gestorSonido.cargar('devorador', 'assets/audio/deborador.mp3', V.devorador);
        this.gestorSonido.cargar('cohetes', 'assets/audio/cohetes.mp3', V.cohetes);

        // --- Combate / impactos ---
        this.gestorSonido.cargar('destruccionMeteorito', 'assets/audio/destruccion_meteorito.mp3', V.destruccionMeteorito);
        this.gestorSonido.cargar('destruccionNave', 'assets/audio/destruccion_nave.mp3', V.destruccionNave);
        this.gestorSonido.cargar('reboteMeteoritos', 'assets/audio/revoteEntreMeteoritos.mp3', V.reboteMeteoritos); // dos asteroides chocan (sin destruirse)
        this.gestorSonido.cargar('recibirImpacto', 'assets/audio/recibir impacto.mp3', V.recibirImpacto);
        this.gestorSonido.cargar('particulaBoid', 'assets/audio/particula_boid.mp3', V.particulaBoid); // suena en cada captura (con throttle)
        this.gestorSonido.cargar('mejora', 'assets/audio/mejora.mp3', V.mejora); // comprar una mejora
        this.gestorSonido.cargar('particulasInsuficientes', 'assets/audio/particulasInsuficientes.mp3', V.particulasInsuficientes); // sin saldo

        // --- Música de fondo (en bucle) ---
        this.gestorSonido.cargar('musicaMenu', 'assets/audio/musica_menu.mp3', V.musicaMenu, 'musica');
        this.gestorSonido.cargar('musicaJuego', 'assets/audio/musica_juego(Cold_Horizon).mp3', V.musicaJuego, 'musica');

        // Pendiente (aún sin archivo): game over
    }

    /**
     * Arranca la música de la partida (en bucle) y detiene la del menú.
     * (El primer clic en JUGAR desbloquea el audio del navegador.)
     */
    _iniciarMusicaJuego() {
        if (!this.gestorSonido) return;
        if (this._musicaMenuLoop) {
            this.gestorSonido.detener(this._musicaMenuLoop);
            this._musicaMenuLoop = null;
        }
        if (this._musicaJuegoLoop) return; // ya está sonando
        this._musicaJuegoLoop = this.gestorSonido.reproducirLoop('musicaJuego');
    }

    /**
     * Arranca la música del menú (en bucle) y detiene la de la partida.
     * Se usa al volver al menú principal (Escape).
     */
    _iniciarMusicaMenu() {
        if (!this.gestorSonido) return;
        if (this._musicaJuegoLoop) {
            this.gestorSonido.detener(this._musicaJuegoLoop);
            this._musicaJuegoLoop = null;
        }
        if (this._musicaMenuLoop) return;
        this._musicaMenuLoop = this.gestorSonido.reproducirLoop('musicaMenu');
    }

    /**
     * Detiene toda la música de fondo.
     */
    _detenerMusica() {
        if (!this.gestorSonido) return;
        if (this._musicaJuegoLoop) {
            this.gestorSonido.detener(this._musicaJuegoLoop);
            this._musicaJuegoLoop = null;
        }
        if (this._musicaMenuLoop) {
            this.gestorSonido.detener(this._musicaMenuLoop);
            this._musicaMenuLoop = null;
        }
    }

    /**
     * Crea un nuevo proyectil
     * Se llama cuando el jugador presiona la tecla de disparar
     *
     * @param {number} x - Posición X donde nace el proyectil
     * @param {number} y - Posición Y donde nace el proyectil
     * @param {number} direction - Dirección del proyectil en radianes (ángulo)
     */
    crearProyectil(x, y, direction) {
        // Sonido de disparo
        if (this.gestorSonido) {
            this.gestorSonido.reproducir('disparo');
        }

        // Crear proyectil SIN usar pool (forma original). Los límites son los del
        // MUNDO (no de la pantalla): el proyectil se autoelimina al salir del
        // mundo, no de la cámara (sino desaparecería apenas creado).
        const projectile = new Proyectil(x, y, direction, this.mundoAncho, this.mundoAlto, this.texturaProyectil);
        
        // Calcular bonus de daño basado en mejoras compradas (indices 0-4)
        // +2, +3, +5, +5, +10 (se acumulan si compras varias)
        let bonusDano = 0;
        if (this.mejoras && this.mejoras[0] >= 1) bonusDano += 2;  // +2 si compraste la primera
        if (this.mejoras && this.mejoras[1] >= 1) bonusDano += 3;  // +3 si compraste la segunda
        if (this.mejoras && this.mejoras[2] >= 1) bonusDano += 5;  // +5 si compraste la tercera
        if (this.mejoras && this.mejoras[3] >= 1) bonusDano += 5;  // +5 si compraste la cuarta
        if (this.mejoras && this.mejoras[4] >= 1) bonusDano += 10; // +10 si compraste la quinta
        
        projectile.dano += bonusDano;

        // Renderizar
        projectile.render(this.mundo);
        
        // Agregar a la lista
        this.proyectiles.push(projectile);
    }
    
    /**
     * Activa el ataque especial (Ulti)
     * Crea un aro expansivo que destruye todos los asteroides en pantalla
     */
    activarUlti() {
        // Sonido del Ulti
        if (this.gestorSonido) {
            this.gestorSonido.reproducir('ulti');
        }

        // Sacudida de cámara fuerte al lanzar la Ulti
        this.sacudirCamara(14, 0.5);

        // Guardar referencia a "this" para usar dentro del callback
        const game = this;
        
        // Crear el efecto visual del ulti
        this.efectoUlti = new UltiEffect(
            this.jugador.x,              // Posición X del jugador
            this.jugador.y,              // Posición Y del jugador
            this.anchoJuego,             // Ancho del juego
            this.altoJuego,            // Alto del juego
            this.enemigos,              // Lista de asteroides para destruir
            // Callback = función que se ejecuta cuando se destruye un asteroide
            function(enemy) {
                // Sumar puntos
                game.puntuacion += enemy.puntos;
                
                // NO agregar carga al ataque especial cuando se usa ULTi
                // (para equilibrar el juego)
                
                // CONTAR para la oleada (igual que los proyectiles)
                game.asteroidesDestruidos++;
            },
            // Lista de naves enemigas
            this.enemigosNaves,
            // Callback cuando se destruye una nave enemiga
            function(nave) {
                game.puntuacion += 500;
                game.asteroidesDestruidos++;
                
                // Verificar si completamos la oleada (cada 10 asteroides)
                if (game.asteroidesDestruidos >= game.objetivoOleada) {
                    game.contadorOleadas++;
                    game.asteroidesDestruidos = 0;
                    
                    // La siguiente oleada necesita 10 asteroides más
                    game.objetivoOleada = 10 + (game.contadorOleadas * 10);
                    
                    // Reducir el intervalo de spawn (aumentar dificultad)
                    if (game.intervaloSpawn > game.intervaloMinimoSpawn) {
                        game.intervaloSpawn = Math.max(
                            game.intervaloMinimoSpawn,
                            game.intervaloSpawn - game.tasaDisminucionSpawn
                        );
                    }
                }
            },
            // Referencia al juego para crear animaciones
            this
        );
        
        // Renderizar el efecto
        this.efectoUlti.render(this.mundo);
    }
    
/**
     * Verifica si dos objetos circulares están en colisión
     * Usa la fórmula de distancia entre centros
     * 
     * @param {Object} obj1 - Primer objeto (debe tener x, y, radius)
     * @param {Object} obj2 - Segundo objeto (debe tener x, y, radius)
     * @returns {boolean} - true si hay colisión, false si no
     */
    _verificarColision(obj1, obj2) {
        // Usar 'radio' si existe, sino usar 'radius' (compatibilidad)
        const radio1 = obj1.radio || obj1.radius || 30;
        const radio2 = obj2.radio || obj2.radius || 30;
        
        // Diferencia entre centros. En mundo TOROIDAL se toma el camino más corto
        // (si no, cerca de un borde dos objetos que SE VEN pegados darían "lejos" y
        // la nave los atravesaría).
        let dx = obj1.x - obj2.x;
        let dy = obj1.y - obj2.y;
        if (CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL) {
            dx = this._wrapDelta(dx, this.mundoAncho);
            dy = this._wrapDelta(dy, this.mundoAlto);
        }

        // Teorema de Pitágoras: distancia = sqrt(dx² + dy²)
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Hay colisión si la distancia es menor a la suma de los radios
        // Esto significa que los círculos se superponen
        return dist < (radio1 + radio2);
    }
    
    /**
     * Finaliza el juego (Game Over)
     * Muestra la pantalla de fin de juego con puntuación y opción de reiniciar
     */
    async gameOver() {
        // Marcar el juego como no corriendo y en Game Over
        this.ejecutando = false;
        this.enGameOver = true;

        // Ocultar los controles táctiles (el loop se detiene, no los apagaría solo)
        if (this.controlesTactiles) this.controlesTactiles.ocultar();

        // Ocultar el HUD (escudo curvo, paneles, marcador): está en zIndex 1000,
        // por encima de la ventana de Game Over, y no tiene sentido durante el
        // fin de partida. Se restaura al reiniciar.
        if (this.pixiHUD && this.pixiHUD.container) {
            this.pixiHUD.container.visible = false;
        }

        // Cortar el bucle de rotura de escudos si estaba sonando
        if (this.jugador && this.gestorSonido) {
            this.gestorSonido.detener(this.jugador._loopRotura);
            this.jugador._loopRotura = null;
        }

        // Array para guardar los elementos de UI para poder limpiarlos después
        this.elementosFinJuego = [];
        
        // Crear fondo oscuro semi-transparente
        const bg = new PIXI.Graphics();
        bg.rect(0, 0, this.anchoJuego, this.altoJuego);
        bg.fill({ color: 0x000000, alpha: 0.8 });
        this.aplicacion.stage.addChild(bg);
        this.elementosFinJuego.push(bg);
        
        // Cargar imagen de Game Over
        const gameOverTexture = await PIXI.Assets.load('assets/gameOver.png');
        
        // Crear sprite con la imagen
        const gameOverSprite = new PIXI.Sprite(gameOverTexture);
        
        // Ajustar el tamaño de la imagen
        // maxHeight controls how tall the image can be (0.5 = 50% of screen, 1 = full screen)
        const maxWidth = this.anchoJuego * 1;
        const maxHeight = this.altoJuego * 0.5;  // Aumentado de 0.5 a 0.9
        const scale = Math.min(maxWidth / gameOverSprite.width, maxHeight / gameOverSprite.height);
        gameOverSprite.scale.set(scale);
        
        // Centrar la imagen
        gameOverSprite.anchor.set(0.5);
        gameOverSprite.x = this.anchoJuego / 2;
        gameOverSprite.y = this.altoJuego / 2;
        
        // Agregar la imagen al stage (para que quede detrás del botón)
        this.aplicacion.stage.addChild(gameOverSprite);
        this.elementosFinJuego.push(gameOverSprite);
        
        // Guardar referencia para poder restaurar despues
        this.gameOverSprite = gameOverSprite;
        
        // Estilo de letra manuscrita (como Birome)
        const fontStyle = {
            fontFamily: 'Segoe Script, Lucida Handwriting, Bradley Hand, cursive',
            fontSize: 30,
            fill: 0x0044CC,
            fontWeight: 'bold'
        };
        
        // Crear texto "GAME OVER"
        const titleText = new PIXI.Text({
            text: 'GAME OVER',
            style: this.estilos.titulo
        });
        titleText.anchor.set(0.5);
        titleText.x = this.anchoJuego / 2;
        // Posiciones PROPORCIONALES a la altura del marco (no px fijos): así al
        // achicarse el marco en pantallas anchas (celular) el texto no se pega a
        // los botones ni se sale del papel.
        titleText.y = this.altoJuego / 2 - gameOverSprite.height * 0.30;
        this.aplicacion.stage.addChild(titleText);
        this.elementosFinJuego.push(titleText);
        
        // Crear texto de puntuación final
        const scoreText = new PIXI.Text({
            text: `Puntuacion Final: ${this.puntuacion}`,
            style: {
                ...fontStyle,
                fontSize: 30,
                fill: 0x0044CC
            }
        });
        scoreText.anchor.set(0.5);
        scoreText.x = this.anchoJuego / 2;
        scoreText.y = this.altoJuego / 2 + gameOverSprite.height * 0.03;
        this.aplicacion.stage.addChild(scoreText);
        this.elementosFinJuego.push(scoreText);
        
        // Crear texto de la oleada alcanzada
        const waveText = new PIXI.Text({
            text: `Oleada Alcanzada: ${this.contadorOleadas}`,
            style: {
                ...fontStyle,
                fontSize: 20
            }
        });
        waveText.anchor.set(0.5);
        waveText.x = this.anchoJuego / 2;
        waveText.y = this.altoJuego / 2 + gameOverSprite.height * 0.15;
        this.aplicacion.stage.addChild(waveText);
        this.elementosFinJuego.push(waveText);

        // Referencias a los visuales del Game Over para poder ocultarlos mientras
        // se ingresa el nombre del récord (sino se ven por detrás del formulario)
        this._gameOverVisuales = [gameOverSprite, titleText, scoreText, waveText];

        // === VERIFICAR SI CALIFICA PARA TOP 5 ===
        // Si ya se usó el nombre o no califica, no pedir
        // Solo muestra el input si la puntuación está en el top 5
        const calificaTop5 = await this.top5.califica(this.puntuacion);
        
        if (!this.nombreIngresado && calificaTop5) {
            // Flag para saber que estamos esperando nombre
            // Evita que los clicks reinicien el juego mientras se escribe el nombre
            this.esperandoNombreTop5 = true;
            
            // Ocultar botones de Game Over mientras se ingresa el nombre
            const btnReiniciar = document.getElementById('btn-reiniciar');
            const btnTop5 = document.getElementById('btn-top5');
            if (btnReiniciar) btnReiniciar.style.display = 'none';
            if (btnTop5) btnTop5.style.display = 'none';
            
            // Deshabilitar el input del teclado
            // Esto evita que las teclas W/A/S/D afecten al juego mientras se escribe el nombre
            this.gestorEntrada.deshabilitar();

            // Ocultar la pantalla de Game Over de PixiJS mientras se ingresa el nombre
            // (evita que "GAME OVER"/score se vean por detrás del formulario transparente)
            if (this._gameOverVisuales) this._gameOverVisuales.forEach(el => { if (el) el.visible = false; });

            // === VENTANA DE NUEVO RÉCORD ===
            // Usa el mismo marco (gameOver.png con border-image) y fondo oscuro
            // que las demás ventanas del juego (Opciones / Top 5 / Créditos).
            const inputContainer = document.createElement('div');
            inputContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(13, 13, 26, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;

            // Marco decorativo (border-image de gameOver.png), igual que las demás ventanas
            const exterior = document.createElement('div');
            exterior.style.cssText = `
                border-style: solid;
                border-width: 36px;
                border-image: url('assets/gameOver.png') 100 fill / 36px / 0 stretch;
                box-sizing: border-box;
                width: ${Math.min(520, this.anchoJuego * 0.9)}px;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            // Contenido interno (columna centrada)
            const contenido = document.createElement('div');
            contenido.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                padding: 55px 50px;
                gap: 16px;
            `;
            
            // Título de la ventana (mismo estilo que las demás ventanas)
            const titulo = document.createElement('div');
            titulo.textContent = '¡NUEVO RÉCORD!';
            titulo.style.cssText = `
                color: #0044CC;
                font-family: 'Segoe Script', cursive;
                font-size: 26px;
                font-weight: bold;
                text-shadow: 0 0 10px #0044CC;
                text-align: center;
            `;

            // Subtítulo (arriba del campo de texto)
            const label = document.createElement('div');
            label.textContent = 'Ingresa tu nombre:';
            label.style.cssText = `
                color: #0044CC;
                font-family: 'Segoe Script', cursive;
                font-size: 18px;
                text-shadow: 0 0 10px #0044CC;
                text-align: center;
            `;
            
            // Campo de texto (input) donde el usuario escribe su nombre
            const input = document.createElement('input');
            input.type = 'text';                                                  // Campo de texto
            input.maxLength = 8;                                                  // Máximo 8 caracteres
            input.style.padding = '10px';                                          // Espacio interno
            input.style.fontSize = '20px';                                        // Tamaño de letra
            input.style.textAlign = 'center';                                     // Centrar texto
            input.style.border = '3px solid #0044CC';                            // Borde azul
            input.style.outline = 'none';                                        // Sin anillo de foco naranja del navegador
            input.style.borderRadius = '6px';                                    // Esquinas suaves
            input.style.background = 'rgba(255, 255, 255, 0.6)';                 // Fondo blanco tenue (legible sobre el marco)
            input.style.color = '#0044CC';                                        // Texto azul
            input.style.fontFamily = 'Segoe Script, cursive';                     // Tipo de letra
            
            // Botón para guardar el nombre (imagen)
            const button = document.createElement('img');
            button.src = 'assets/guardadoBoton.png';
            button.style.cursor = 'pointer';
            button.style.marginLeft = '10px';
            button.style.transition = 'transform 0.2s ease, filter 0.2s ease';
            button.style.transform = 'scale(1)';
            button.style.filter = 'brightness(1)';
            
            // Efecto hover (mouse encima)
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.1)';
                button.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
            });
            
            // Efecto cuando el mouse sale
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
                button.style.filter = 'brightness(1)';
            });
            
            // Ensamblar: contenido dentro del marco, marco dentro del overlay
            contenido.appendChild(titulo);           // Título
            contenido.appendChild(label);            // Subtítulo
            contenido.appendChild(input);            // Campo de texto
            contenido.appendChild(button);           // Botón guardar
            exterior.appendChild(contenido);
            inputContainer.appendChild(exterior);
            document.body.appendChild(inputContainer); // Agregar todo al body

            // Guardar referencia para limpiar después (cuando se cierre el input)
            // Ya no hay imagen de fondo separada; el marco es parte del inputContainer
            this.bgImageRecord = null;
            this.inputContainerRecord = inputContainer;
            
            // === IMPORTANTE: Desactivar click del stage ===
            // Mientras se ingresa el nombre, los clicks en el juego NO deben reiniciarlo
            // Solo se reiniciará cuando el usuario haga click en el botón REINICIAR o presione ENTER
            this.clickHandlerActivo = false;
            
            // Enfocar el campo de texto automáticamente
            input.focus();
            
            // === BOTÓN GUARDAR ===
            // Cuando el usuario hace click en el botón "GUARDAR"
            button.onclick = async () => {
                // Obtener el nombre escrito por el usuario
                const nombre = input.value;
                
                // Intentar guardar en el Top 5 (valida el nombre primero)
                if (await this.top5.agregarEntrada(nombre, this.puntuacion, this.contadorOleadas)) {
                    // Si se guardó correctamente
                    this.nombreIngresado = true;                    // Marcar que ya se usó el nombre
                    this.esperandoNombreTop5 = false;               // Ya no esperamos nombre
                    inputContainer.remove();                       // Cerrar el formulario
                    if (this.bgImageRecord) {                     // Limpiar imagen de fondo
                        this.bgImageRecord.remove();
                        this.bgImageRecord = null;
                    }
                    this.gestorEntrada.habilitar();                // Reactivar teclado del juego

                    // Volver a mostrar la pantalla de Game Over (estaba oculta durante el ingreso del nombre)
                    if (this._gameOverVisuales) this._gameOverVisuales.forEach(el => { if (el) el.visible = true; });

                    // Crear botones de nuevo en la misma posición
                    if (this.posicionBotonesGameOver) {
                        this._crearBotonesGameOverHTML(
                            this.posicionBotonesGameOver.x,
                            this.posicionBotonesGameOver.y,
                            this.posicionBotonesGameOver.ancho
                        );
                        this.clickHandlerActivo = false;
                    }
                } else {
                    // Si el nombre no es válido (vacío o con caracteres inválidos)
                    alert('Nombre inválido. Solo letras y números.');
                }
            };
            
            // === PRESIONAR ENTER ===
            // También permitir guardar con la tecla ENTER
            input.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    const nombre = input.value;
                    if (await this.top5.agregarEntrada(nombre, this.puntuacion, this.contadorOleadas)) {
                        this.nombreIngresado = true;
                        this.esperandoNombreTop5 = false;
                        inputContainer.remove();
                        if (this.bgImageRecord) {
                            this.bgImageRecord.remove();
                            this.bgImageRecord = null;
                        }
                        this.gestorEntrada.habilitar();

                        // Volver a mostrar la pantalla de Game Over
                        if (this._gameOverVisuales) this._gameOverVisuales.forEach(el => { if (el) el.visible = true; });

                        // Crear botones de nuevo en la misma posición
                        if (this.posicionBotonesGameOver) {
                            this._crearBotonesGameOverHTML(
                                this.posicionBotonesGameOver.x,
                                this.posicionBotonesGameOver.y,
                                this.posicionBotonesGameOver.ancho
                            );
                        }
                        this.clickHandlerActivo = false;
                    } else {
                        alert('Nombre inválido. Solo letras y números.');
                    }
                }
            };
            
// === LIMPIEZA DEL INPUT ===
            // Función que se llama cuando se limpian los elementos de fin de juego
            // Asegura que el input se cierre correctamente
            this.elementosFinJuego.push({ destroy: () => {
                inputContainer.remove();                      // Remover el formulario HTML
                // Limpiar imagen de fondo si existe
                if (this.bgImageRecord) {
                    this.bgImageRecord.remove();
                    this.bgImageRecord = null;
                }
                this.clickHandlerActivo = true;                // Reactivar clicks para reiniciar
                this.gestorEntrada.habilitar();            // Reactivar teclado del juego
                
                // Mostrar botones de nuevo
                const btnReiniciar = document.getElementById('btn-reiniciar');
                const btnTop5 = document.getElementById('btn-top5');
                if (btnReiniciar) btnReiniciar.style.display = 'block';
                if (btnTop5) btnTop5.style.display = 'block';
    } });
        }
         
        // =====================================================
        // Crear botones HTML nativos para Game Over
        // (mas confiables que los botones de PixiJS)
        // =====================================================
        // Pasar la ALTURA real del papel (ya escalada) para ubicar los botones debajo del texto
        this._crearBotonesGameOverHTML(gameOverSprite.x, gameOverSprite.y, gameOverSprite.height);
        
        // === FIN GAME OVER ===
        // El reinicio depende SOLO del botón "Reiniciar" (btnReiniciar.onclick, que
        // llama a _limpiarFinJuego() + _reiniciarJuego() por su cuenta).
        //
        // Se QUITÓ el "reiniciar al hacer click en cualquier lado" (pointerdown en el
        // stage) y el "reiniciar con ENTER" globales: chocaban con la ventana de
        // NUEVO RÉCORD. Un click/ENTER fuera del input de nombre reiniciaba el juego
        // por debajo mientras se ingresaba el nombre, dejando la ventana de récord
        // huérfana y los botones de Game Over flotando. Con el botón como único
        // disparador, el flujo queda limpio y predecible.
    }
    
    /**
     * Limpia los elementos de la pantalla de Game Over
     * Se llama antes de reiniciar el juego
     */
    _limpiarFinJuego() {
        // Flag para evitar múltiples limpiezas simultáneas
        if (this.limpiezaEnProgreso) return;
        this.limpiezaEnProgreso = true;
        
        // Remover botones HTML por ID
        const btnReiniciar = document.getElementById('btn-reiniciar');
        const btnTop5 = document.getElementById('btn-top5');
        const btnRevivir = document.getElementById('btn-revivir');
        if (btnReiniciar) btnReiniciar.remove();
        if (btnTop5) btnTop5.remove();
        if (btnRevivir) btnRevivir.remove();
        
        // Limpiar array de botones
        if (this.botonesHTML) {
            this.botonesHTML = null;
        }
        
        // Remover todos los elementos guardados
        if (this.elementosFinJuego) {
            for (const el of this.elementosFinJuego) {
                try {
                    if (el && el.parent) {
                        el.parent.removeChild(el);
                        // Destruir completamente si es posible
                        if (el.destroy && typeof el.destroy === 'function') {
                            el.destroy();
                        }
                    }
                } catch (e) {
                    // Ignorar errores al limpiar
                }
            }
            this.elementosFinJuego = [];
        }
        
        // Limpiar eventos del stage
        if (this.aplicacion && this.aplicacion.stage) {
            this.aplicacion.stage.removeAllListeners('pointerdown');
            this.aplicacion.stage.eventMode = 'none';
        }
        
        // Resetear el flag después de un pequeño delay
        setTimeout(() => {
            this.limpiezaEnProgreso = false;
        }, 100);
    }

    /**
     * REVIVE al jugador tras un Game Over (lo llama el botón "Revivir" cuando el
     * anuncio recompensado se completó). Conserva puntos/oleada. Restaura escudo
     * lleno, 2s de invulnerabilidad, limpia enemigos cerca y reanuda la partida.
     */
    revivir() {
        if (!this.enGameOver) return;
        // 1. Limpiar la UI de Game Over (botones + visuales Pixi) SIN resetear.
        this._limpiarFinJuego();
        // 2. Restaurar el HUD (se ocultó en gameOver).
        if (this.pixiHUD && this.pixiHUD.container) this.pixiHUD.container.visible = true;
        // 3. Restaurar el jugador.
        const j = this.jugador;
        if (j) {
            j.escudos = j.escudosMax;
            j.sobrecalentado = false;
            j.sobrecalentadoAceleracion = false;
            j.cargaAceleracion = 0;
            j.velocidad = 0;
            j.active = true;
            if (j.imagen) j.imagen.visible = true;
            if (this.gestorSonido && j._loopRotura) { this.gestorSonido.detener(j._loopRotura); j._loopRotura = null; }
            if (j.activarInvulnerabilidad) j.activarInvulnerabilidad(2);
        }
        // 4. Limpiar proyectiles enemigos + enemigos cercanos (gracia).
        this._limpiarCercaAlRevivir(340);
        // 5. Reanudar la partida.
        this.enGameOver = false;
        this.pausado = false;
        this.ejecutando = true;
        if (this.aplicacion && this.aplicacion.stage) this.aplicacion.stage.eventMode = 'static';
        if (this.gestorEntrada) this.gestorEntrada.reiniciar();
    }

    /** Quita TODOS los proyectiles enemigos y los enemigos dentro de `radio` del jugador. @private */
    _limpiarCercaAlRevivir(radio) {
        const j = this.jugador; if (!j) return;
        const dist = (e) => this.distanciaToroidal ? this.distanciaToroidal(j.x, j.y, e.x, e.y) : Math.hypot(j.x - e.x, j.y - e.y);
        const quitarSprite = (e) => {
            try {
                const sp = e && (e.imagen || e.sprite);
                if (sp && sp.parent) sp.parent.removeChild(sp);
                if (sp && sp.destroy) sp.destroy();
            } catch (err) { /* ignorar */ }
        };
        if (this.proyectilesEnemigos) { this.proyectilesEnemigos.forEach(quitarSprite); this.proyectilesEnemigos = []; }
        for (const campo of ['enemigos', 'enemigosNaves', 'enemigosSpeciales']) {
            const arr = this[campo]; if (!arr) continue;
            this[campo] = arr.filter(e => {
                if (e && dist(e) <= radio) { quitarSprite(e); return false; }
                return true;
            });
        }
    }
    
/**
 * Crea botones HTML nativos para Game Over
 * Se posicionan a la derecha de la imagen de Game Over
 */
/**
 * Convierte coordenadas del "mundo de juego" (anchoJuego×altoJuego = resolución
 * del canvas) a píxeles de PANTALLA, contemplando cómo el canvas se muestra con
 * `object-fit: contain` (escala + barras de letterbox). Sirve para ubicar botones
 * HTML alineados con lo dibujado en PixiJS en cualquier pantalla (en el celu la
 * resolución del canvas suele diferir del tamaño mostrado).
 * @returns {{escala:number, offX:number, offY:number}}
 */
_mapaCanvas() {
    const rect = this.aplicacion.canvas.getBoundingClientRect();
    const escala = Math.min(rect.width / this.anchoJuego, rect.height / this.altoJuego);
    return {
        escala,
        offX: rect.left + (rect.width - this.anchoJuego * escala) / 2,
        offY: rect.top + (rect.height - this.altoJuego * escala) / 2,
    };
}

_crearBotonesGameOverHTML(xCentro, yCentro, ancho) {
    // Guardar posición SIEMPRE (antes del return para que funcione después de guardar nombre)
    this.posicionBotonesGameOver = { x: xCentro, y: yCentro, ancho: ancho };
    
    // Si estamos esperando nombre para el Top 5 (record), NO crear botones
    // Se crean después de guardar el nombre
    if (this.esperandoNombreTop5) {
        return;
    }
    
    // Coords de juego → pantalla (contempla escala/letterbox del canvas).
    const { escala, offX, offY } = this._mapaCanvas();
    const frameW = this.gameOverSprite ? this.gameOverSprite.width : ancho;
    // Ubicar los botones en la parte baja del papel, dentro del blanco.
    const btnY = yCentro + (ancho * 0.32);        // Y en coords de juego
    // Reiniciar y Top 5 dentro del marco (2 botones). El botón Revivir (si hay
    // AdMob) va FUERA del marco, más abajo (ver más adelante).
    // NO se muestra Revivir si ya se guardó un récord nuevo (`nombreIngresado`):
    // guardado el puntaje, la partida quedó cerrada y revivir no corresponde.
    const hayRevivir = !!(this.anuncios && this.anuncios.disponible()) && !this.nombreIngresado;
    const dx = frameW * 0.17;
    const btnW = Math.max(90, Math.round(frameW * 0.26 * escala));

    // Botón Reiniciar
    const btnReiniciar = document.createElement('img');
    btnReiniciar.src = 'assets/botonReiniciar.png';
    btnReiniciar.id = 'btn-reiniciar';
    btnReiniciar.style.cssText = `
        position: absolute;
        left: ${offX + (xCentro - dx) * escala}px;
        top: ${offY + btnY * escala}px;
        transform: translate(-50%, -50%);
        width: ${btnW}px;
        height: auto;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.2s ease;
    `;
    
    // Efecto hover para REINICIAR
    btnReiniciar.addEventListener('mouseenter', () => {
        btnReiniciar.style.transform = 'translate(-50%, -50%) scale(1.1)';
        btnReiniciar.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
    });
    
    btnReiniciar.addEventListener('mouseleave', () => {
        btnReiniciar.style.transform = 'translate(-50%, -50%) scale(1)';
        btnReiniciar.style.filter = 'brightness(1) drop-shadow(0 0 0 transparent)';
    });
    
    btnReiniciar.onclick = () => {
        // No hacer nada si el boton esta oculto (cuando se muestra el input de guardar)
        const btn = document.getElementById('btn-reiniciar');
        if (!btn || btn.style.display === 'none') return;
        
        this._limpiarFinJuego();
        this._reiniciarJuego();
    };
    document.body.appendChild(btnReiniciar);
    
    // Botón Top 5 - a la derecha, debajo de la imagen
    const btnTop5 = document.createElement('img');
    btnTop5.id = 'btn-top5';
    btnTop5.src = 'assets/botonTOP5.png';
    btnTop5.style.cssText = `
        position: absolute;
        left: ${offX + (xCentro + dx) * escala}px;
        top: ${offY + btnY * escala}px;
        transform: translate(-50%, -50%);
        width: ${btnW}px;
        height: auto;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.2s ease;
    `;
    
    // Efecto hover para TOP 5
    btnTop5.addEventListener('mouseenter', () => {
        btnTop5.style.transform = 'translate(-50%, -50%) scale(1.1)';
        btnTop5.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
    });
    
    btnTop5.addEventListener('mouseleave', () => {
        btnTop5.style.transform = 'translate(-50%, -50%) scale(1)';
        btnTop5.style.filter = 'brightness(1) drop-shadow(0 0 0 transparent)';
    });
    
    btnTop5.onclick = async () => {
        // Ocultar botones mientras se muestra el Top 5
        const btnReiniciar = document.getElementById('btn-reiniciar');
        const btnTop5El = document.getElementById('btn-top5');
        if (btnReiniciar) btnReiniciar.style.display = 'none';
        if (btnTop5El) btnTop5El.style.display = 'none';
        
        await this._mostrarTop5();
    };
    document.body.appendChild(btnTop5);

    // Botón REVIVIR (solo si AdMob está disponible): muestra un anuncio
    // recompensado y, al completarlo, revive al jugador (misma partida).
    let btnRevivir = null;
    if (hayRevivir) {
        btnRevivir = document.createElement('div');
        btnRevivir.id = 'btn-revivir';
        btnRevivir.innerHTML = '<span style="font-weight:bold;">▶ Revivir</span> <span style="font-size:0.7em; opacity:0.85;">(ver anuncio)</span>';
        // FUERA del marco, centrado y más abajo que Reiniciar/Top 5.
        const yRevivir = yCentro + (ancho * 0.62);   // debajo del borde inferior del marco
        btnRevivir.style.cssText = `
            position: absolute;
            left: ${offX + xCentro * escala}px;
            top: ${offY + yRevivir * escala}px;
            transform: translate(-50%, -50%);
            padding: ${Math.round(9 * escala)}px ${Math.round(20 * escala)}px;
            white-space: nowrap; text-align: center; color: #cfe0ff;
            font-family: 'Segoe Script', 'Lucida Handwriting', cursive;
            font-size: ${Math.max(14, Math.round(frameW * 0.05 * escala))}px;
            background: rgba(0,68,204,0.85); border: 2px solid #7fb0ff; border-radius: 12px;
            box-shadow: 0 0 12px rgba(0,68,204,0.6);
            cursor: pointer; z-index: 1000; transition: all 0.2s ease;
        `;
        let revivirEnCurso = false;
        btnRevivir.onclick = async () => {
            if (revivirEnCurso) return;
            revivirEnCurso = true;
            const ok = await this.anuncios.mostrarRewarded(() => this.revivir());
            revivirEnCurso = false;
            // Si no se recompensó (cerró el anuncio antes), el botón sigue disponible.
        };
        document.body.appendChild(btnRevivir);
    }

    // Guardar referencias para limpiar despues
    this.botonesHTML = [btnReiniciar, btnTop5, btnRevivir].filter(Boolean);
}
    
    /**
     * Reinicia el juego a su estado inicial
     * Se llama cuando el jugador pierde y elige jugar de nuevo
     */
    _reiniciarJuego() {
        // Guardar referencia al contenedor del HUD (PixiHUD) para no perderlo
        // al limpiar el stage. stage.removeChildren() elimina TODOS los hijos,
        // incluyendo el contenedor del HUD (zIndex 1000). Sin esto, el HUD
        // desaparecería al reiniciar el juego.
        const hudContainer = (this.pixiHUD && this.pixiHUD.container)
            ? this.pixiHUD.container
            : null;
        if (hudContainer) {
            try { hudContainer.removeFromParent(); } catch (e) {}
        }

        // Limpiar todo el stage (eliminar todos los objetos anteriores)
        if (this.aplicacion && this.aplicacion.stage) {
            this.aplicacion.stage.removeChildren();
        }

        // Recrear el contenedor del MUNDO: removeChildren() lo sacó del stage.
        // Creamos uno nuevo (el viejo, con los objetos de la partida anterior, se
        // descarta) y reseteamos la cámara. El HUD se re-agrega más abajo, así
        // que queda por encima del mundo.
        this.mundo = new PIXI.Container();
        this.mundo.sortableChildren = true;
        this.mundo.scale.set(CONFIG.CAMARA.ZOOM);   // zoom de cámara (aleja/acerca)
        this.aplicacion.stage.addChild(this.mundo);
        this._camaraX = 0;
        this._camaraY = 0;
        // Resetear acumuladores de cámara/parallax para no arrastrar estado previo
        this._prevJugX = undefined; this._prevJugY = undefined;
        this._shipContX = undefined; this._shipContY = undefined;
        this._bgX = 0; this._bgY = 0;
        this._lookX = 0; this._lookY = 0;

        // Reiniciar todas las variables del juego
        this.puntuacion = 0;
        this.proyectiles = [];
        this.enemigos = [];
        this.enemigosNaves = []; // Limpiar naves enemigas
        this.enemigosSpeciales = []; // Limpiar especiales
        this.proyectilesEnemigos = []; // Limpiar proyectiles enemigos
        this.efectosExplosion = [];
        this.efectosImpacto = [];
        this.efectoUlti = null;
        this.efectoSuccion = null;
        this.particulasBoid = [];
        this.timerParticulasBoid = 0;
        this.particulasCapturadas = 0;
        this.cohetes = []; // Limpiar cohetes activos
        this.regeneracionTiempoFueraBonus = 0; // Resetear bonus de tiempo fuera
        inicializarMejoras(this);
        this.aplicarMejoras();
        
        // Resetear habilidad Tiempo Fuera
        this.tiempoFueroActivo = false;
        this.timerTiempoFuera = 0;

        // Resetear cooldowns de habilidades (cohetes/propulsor/devorador). Sin
        // esto, si moriste con una habilidad en cooldown, la nueva partida
        // arrancaba con ese icono atenuado y la habilidad bloqueada hasta que
        // expiraba el cooldown viejo.
        if (this.gestorEntrada) this.gestorEntrada.reiniciar();

        // Reiniciar flag de nombre
        this.nombreIngresado = false;
        this.esperandoNombreTop5 = false;
        this.enGameOver = false;
        
        // Reiniciar variables de oleadas y dificultad
        this.contadorOleadas = 0;
        this.asteroidesDestruidos = 0;
        this.objetivoOleada = CONFIG.MUNDO.OLEADA_OBJETIVO;
        this.intervaloSpawn = CONFIG.MUNDO.SPAWN_INTERVALO;
        
        // Reiniciar temporizadores de naves enemigas
        this.temporizadorNaveEnemiga = 0;
        this.intervaloNaveEnemiga = CONFIG.MUNDO.NAVE_ENEMIGA_INTERVALO;
        
        // Recrear el fondo
        this._crearFondo();
        
        // Recrear el jugador
        this._crearJugador();
        
        
        // Resetear estados de pausa y ventanas
        this.pausado = false;
        this.mostrandoVentanaMejoras = false;
        this.mostrandoTop5EnPausa = false;
        this.clickHandlerActivo = true;
        this.botonClicked = false;
        
        // Re-agregar el contenedor del HUD (PixiHUD) al stage y volver a mostrarlo
        // (se ocultó en gameOver). Es necesario porque stage.removeChildren() lo
        // eliminó arriba.
        if (hudContainer && this.aplicacion && this.aplicacion.stage) {
            this.aplicacion.stage.addChild(hudContainer);
            hudContainer.visible = true;
        }

        // Restaurar la interactividad del stage: el game over (_limpiarFinJuego)
        // la había puesto en 'none'. Sin esto, los clicks no llegan a los iconos
        // de mejora del HUD y no se pueden comprar mejoras tras reiniciar.
        if (this.aplicacion && this.aplicacion.stage) {
            this.aplicacion.stage.eventMode = 'static';
        }
        
        // Marcar el juego como corriendo
        this.ejecutando = true;

        // Reanudar la música de la partida (cambia menú -> juego si venías del menú)
        this._iniciarMusicaJuego();
    }

    /**
     * Reinicia una partida desde el menú principal.
     *
     * Se usa cuando el juego YA fue inicializado y el jugador volvió al menú con
     * Escape (que dejó `ejecutando = false` y el canvas oculto). A diferencia de
     * la primera partida, acá no se recargan assets ni se recrea la app PixiJS:
     * solo se vuelve a mostrar el canvas, se rehabilita el teclado y se resetea
     * todo el estado con `_reiniciarJuego()`.
     */
    reiniciarDesdeMenu() {
        // Volver a mostrar el canvas (Escape→menú lo había ocultado)
        if (this.aplicacion && this.aplicacion.canvas) {
            this.aplicacion.canvas.style.display = 'block';
        }
        // Rehabilitar el teclado del juego
        if (this.gestorEntrada) {
            this.gestorEntrada.habilitar();
        }
        // Resetear todo el estado y volver a poner el juego en marcha
        this._reiniciarJuego();
    }

    /**
     * Detiene la partida en curso y oculta el canvas para volver al menú.
     *
     * Frena el game loop (`ejecutando = false`, su cuerpo hace `if (!ejecutando)
     * return;`), saca la pausa, limpia teclas atascadas y oculta el canvas para
     * no dejar un frame congelado detrás del menú. El menú principal lo muestra
     * el orquestador (main.js), que es quien tiene el UIManager con callbacks.
     */
    detenerParaMenu() {
        this.ejecutando = false;
        this.pausado = false;
        if (this.gestorEntrada) {
            this.gestorEntrada.reiniciar();
        }
        if (this.aplicacion && this.aplicacion.canvas) {
            this.aplicacion.canvas.style.display = 'none';
        }
        // Cambiar a la música del menú
        this._iniciarMusicaMenu();
    }

    /**
     * Bucle principal del juego (Game Loop)
     * Se ejecuta 60 veces por segundo
     * Actualiza todos los objetos y procesa las colisiones
     * 
     * @param {object} ticker - Objeto de PixiJS que proporciona información del frame
     */
    /**
     * Mueve el contenedor del mundo para que la cámara siga a la nave, dejándola
     * centrada en pantalla. Se clampea a los bordes del mundo para no mostrar
     * "vacío" fuera de él.
     */
    _actualizarCamara(delta = 1 / 60) {
        if (!this.mundo || !this.jugador) return;
        const sw = this.anchoJuego, sh = this.altoJuego;
        const j = this.jugador;
        const dt = delta > 0 ? delta : 1 / 60;

        // --- Look-ahead: la cámara "mira" un poco hacia donde se mueve la nave ---
        // Velocidad estimada por delta de posición (independiente del modelo interno).
        const toroidal = !!(CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL);
        let dxJ = j.x - (this._prevJugX ?? j.x);
        let dyJ = j.y - (this._prevJugY ?? j.y);
        if (toroidal) {
            // Si la nave envolvió, el delta "salta" ~mundo entero: tomar el camino corto
            // para que el look-ahead no se dispare en el cruce.
            if (dxJ > this.mundoAncho / 2) dxJ -= this.mundoAncho; else if (dxJ < -this.mundoAncho / 2) dxJ += this.mundoAncho;
            if (dyJ > this.mundoAlto / 2) dyJ -= this.mundoAlto; else if (dyJ < -this.mundoAlto / 2) dyJ += this.mundoAlto;
        }
        const vx = dxJ / dt;
        const vy = dyJ / dt;
        this._prevJugX = j.x; this._prevJugY = j.y;

        // Acumulador CONTINUO del desplazamiento de la nave (para el parallax del
        // fondo/estrellas): suma el delta "por el camino corto", así NUNCA salta al
        // envolver la nave → el fondo scrollea sin costura con cualquier imagen.
        this._shipContX = (this._shipContX ?? j.x) + dxJ;
        this._shipContY = (this._shipContY ?? j.y) + dyJ;
        const vmag = Math.hypot(vx, vy);
        const MAX_LOOK = 110;
        let laX = 0, laY = 0;
        if (vmag > 15) {
            const f = Math.min(1, vmag / (CONFIG.JUGADOR.VELOCIDAD_MAX || 300));
            laX = (vx / vmag) * MAX_LOOK * f;
            laY = (vy / vmag) * MAX_LOOK * f;
        }
        const s = Math.min(1, dt * 3); // suavizado del look-ahead
        this._lookX = (this._lookX || 0) + (laX - (this._lookX || 0)) * s;
        this._lookY = (this._lookY || 0) + (laY - (this._lookY || 0)) * s;

        // Cámara centrada en la nave + look-ahead. En modo clásico se clampea al
        // mundo; en TOROIDAL no se clampea (la cámara sigue a la nave aunque cruce
        // el borde, así la nave queda siempre centrada al envolver).
        // Con ZOOM: el mundo se escala por Z, así que la vista abarca sw/Z × sh/Z
        // en coords de mundo (con Z<1 se ve MÁS área). _camaraX/Y = esquina
        // superior-izquierda de la vista en el mundo (lo usa el culling/spawn).
        const Z = CONFIG.CAMARA.ZOOM;
        const vw = sw / Z, vh = sh / Z;
        let camX = j.x + this._lookX - vw / 2;
        let camY = j.y + this._lookY - vh / 2;
        if (!toroidal) {
            const maxX = Math.max(0, this.mundoAncho - vw);
            const maxY = Math.max(0, this.mundoAlto - vh);
            camX = Math.max(0, Math.min(maxX, camX));
            camY = Math.max(0, Math.min(maxY, camY));
        }
        this._camaraX = camX;
        this._camaraY = camY;

        // Referencia del PARALLAX (fondo + estrellas): en TOROIDAL usa el acumulador
        // continuo (no salta al envolver la nave → sin costura); en modo clásico usa
        // la cámara clampeada como siempre.
        this._bgX = toroidal ? (this._shipContX + this._lookX - sw / 2) : camX;
        this._bgY = toroidal ? (this._shipContY + this._lookY - sh / 2) : camY;

        // --- Parallax: el fondo se desplaza a una fracción de la cámara; las
        // estrellas titilan y se mueven aparte (con wrap) ---
        if (this.fondoParallax) this.fondoParallax.tilePosition.set(-this._bgX * this.fondoParallax.factorParallax, -this._bgY * this.fondoParallax.factorParallax);
        this._actualizarEstrellas(dt);

        // --- Screen shake (decae con el tiempo) ---
        let shx = 0, shy = 0;
        if ((this._shakeTime || 0) > 0) {
            this._shakeTime -= dt;
            const k = Math.max(0, this._shakeTime / (this._shakeDur || 0.3));
            const mag = (this._shakeMag || 0) * k;
            shx = (Math.random() - 0.5) * 2 * mag;
            shy = (Math.random() - 0.5) * 2 * mag;
        }

        // El mundo está escalado por Z, así que la traslación también va por Z
        // (deja la nave centrada: -camX*Z + sw/2 con camX = j.x+look - sw/(2Z)).
        this.mundo.x = Math.round(-camX * Z + shx);
        this.mundo.y = Math.round(-camY * Z + shy);
    }

    /**
     * Envuelve un delta al camino más corto del toroide (queda en [-size/2, size/2]).
     * @private
     */
    _wrapDelta(d, size) {
        const h = size / 2;
        if (d > h) return d - size;
        if (d < -h) return d + size;
        return d;
    }

    /**
     * Distancia entre dos puntos considerando el mundo TOROIDAL (camino más corto).
     * En modo no toroidal es la distancia euclidiana normal.
     */
    distanciaToroidal(ax, ay, bx, by) {
        if (!(CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL)) return Math.hypot(bx - ax, by - ay);
        return Math.hypot(this._wrapDelta(bx - ax, this.mundoAncho), this._wrapDelta(by - ay, this.mundoAlto));
    }

    /**
     * Paso central del mundo TOROIDAL (A + B). Para cada entidad:
     *  - B: envuelve su posición lógica (x/y) al tamaño del mundo (módulo), así en
     *    vez de auto-borrarse en un borde, "aparece" por el opuesto.
     *  - A: ubica su sprite en la COPIA más cercana a la nave → el mundo se ve SIN
     *    costura (al acercarte a un borde ya asoma lo del otro lado, sin salto).
     * La lógica (IA, colisiones, cohetes) todavía usa distancia recta salvo el
     * culling de enemigos; hacerla toroidal es el paso C.
     * @private
     */
    _actualizarToroide() {
        if (!(CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL) || !this.jugador) return;
        const W = this.mundoAncho, H = this.mundoAlto;
        const sx = this.jugador.x, sy = this.jugador.y;
        const listas = [this.enemigos, this.enemigosSpeciales, this.enemigosNaves,
                        this.proyectiles, this.proyectilesEnemigos, this.particulasBoid, this.cohetes];
        for (const lista of listas) {
            if (!lista) continue;
            for (const e of lista) {
                if (!e || !e.imagen) continue;
                // B: envolver la posición lógica al mundo
                e.x = ((e.x % W) + W) % W;
                e.y = ((e.y % H) + H) % H;
                // A: render en la copia más cercana a la nave (sin costura)
                e.imagen.x = sx + this._wrapDelta(e.x - sx, W);
                e.imagen.y = sy + this._wrapDelta(e.y - sy, H);
            }
        }
    }

    /**
     * Dispara una sacudida de cámara (screen shake). Si ya hay una en curso, se
     * queda con la más fuerte.
     * @param {number} magnitud - amplitud en px
     * @param {number} duracion - segundos
     */
    sacudirCamara(magnitud, duracion = 0.3) {
        if ((this._shakeTime || 0) <= 0 || magnitud >= (this._shakeMag || 0)) {
            this._shakeMag = magnitud;
            this._shakeDur = duracion;
            this._shakeTime = duracion;
        }
    }

    /**
     * Devuelve un punto (en coords de mundo) justo AFUERA de lo que ve la cámara,
     * en un borde al azar. Se usa para spawnear enemigos/partículas alrededor de
     * la nave (no en una esquina fija del mundo). Clampeado a los bordes del mundo.
     * @param {number} margen - cuántos px afuera de la vista
     * @returns {{x:number, y:number}}
     */
    _puntoSpawnFueraDeVista(margen = 80) {
        const cx = this._camaraX, cy = this._camaraY; // esquina sup-izq de la vista en el mundo
        // Con zoom, la vista abarca sw/Z × sh/Z en coords de mundo.
        const Z = CONFIG.CAMARA.ZOOM;
        const sw = this.anchoJuego / Z, sh = this.altoJuego / Z;
        const borde = Math.floor(Math.random() * 4);
        let x, y;
        switch (borde) {
            case 0: x = cx + Math.random() * sw; y = cy - margen; break;        // arriba
            case 1: x = cx + Math.random() * sw; y = cy + sh + margen; break;   // abajo
            case 2: x = cx - margen; y = cy + Math.random() * sh; break;        // izquierda
            default: x = cx + sw + margen; y = cy + Math.random() * sh; break;  // derecha
        }
        // En modo TOROIDAL no se clampea (el spawn puede caer "fuera" del mundo y el
        // paso toroidal lo envuelve); así el enemigo aparece justo afuera de la vista
        // aunque la nave esté cerca de un borde del mundo.
        if (!(CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL)) {
            x = Math.max(0, Math.min(this.mundoAncho, x));
            y = Math.max(0, Math.min(this.mundoAlto, y));
        }
        return { x, y };
    }

    /**
     * Abre/cierra el panel de MEJORAS (equivale a la tecla P). Lo usa el icono de
     * mejoras del HUD (arriba) al tocarlo/clickearlo — así en celular se entra sin
     * teclado. Pausa el juego mientras el panel está abierto.
     */
    alternarMejoras() {
        if (this.enGameOver) return;
        this.pausado = !this.pausado;
        this.gestorEntrada.reiniciar();
        this.mostrandoVentanaMejoras = this.pausado;
    }

    async _gameLoop(ticker) {
        // Si el juego no está corriendo, salir
        if (!this.ejecutando) return;

        // Envolver todo el cuerpo del game loop en try-catch para que
        // cualquier error no controlado NO detenga el ticker de PixiJS.
        // Sin esto, un error en cualquier subsistema congelaría la pantalla.
        try {
            // Calcular delta time (tiempo desde el último frame en segundos)
            // ticker.deltaTime viene en frames, convertir a segundos dividiendo por 60
            const delta = ticker.deltaTime / 60;

            // === JOYSTICK / GAMEPAD ===
            // La Gamepad API es por polling: hay que leerla UNA vez por frame, antes
            // de consultar las acciones (disparar, acelerar, habilidades) y el apuntado.
            if (this.gestorEntrada && this.gestorEntrada.actualizarGamepad) {
                this.gestorEntrada.actualizarGamepad();
            }

    // === CONTROL DE PAUSA (Tecla P) ===
            // Si se presiona P, alternar pausa (solo si no está en Game Over)
            if (this.gestorEntrada.debePausar() && !this.enGameOver) {
                this.pausado = !this.pausado;
                // Limpiar la tecla para que no se togglee constantemente
                this.gestorEntrada.reiniciar();

                // Ventana de mejoras vieja DESHABILITADA temporalmente: se está
                // reemplazando por los paneles laterales (chips + pips). Por ahora
                // solo alternamos el flag para desplegar/recoger esos paneles; no
                // hay compra de mejoras hasta engancharla a los pips.
                // Para reactivar la ventana vieja: volver a llamar
                // crearVentanaMejoras(this) / limpiarVentanaMejoras(this) aquí.
                this.mostrandoVentanaMejoras = this.pausado;
            }

            // Desplegar/recoger las columnas laterales del HUD según el menú de
            // Mejoras. Va ANTES del corte por pausa para que la animación corra
            // también con el juego pausado (que es cuando el menú está abierto).
            if (this.pixiHUD) {
                this.pixiHUD.actualizarDespliegue(!!this.mostrandoVentanaMejoras);
            }

            // Controles táctiles: visibles solo en modo 'touch' y mientras se juega
            // (no en pausa/mejoras ni en game over).
            if (this.controlesTactiles) {
                const modoTouch = this.gestorEntrada && this.gestorEntrada.modoControl === 'touch';
                this.controlesTactiles.setVisible(modoTouch && !this.pausado && !this.enGameOver);
                // Iluminar/apagar los botones de habilidad según disponibilidad.
                if (modoTouch) this.controlesTactiles.actualizarDisponibilidad(this);
            }

    // Si el juego está pausado, salir del loop (PixiHUD ya refleja el estado)
            if (this.pausado) {
                // No mostrar Top 5 con T - solo funciona desde el menu de pausa
                return;
            }

            // === ACTUALIZAR JUGADOR ===
            if (this.jugador && this.jugador.active) {
                this.jugador.update(delta, this.gestorEntrada);
            }

            // === CÁMARA: seguir a la nave ===
            this._actualizarCamara(delta);

    // === DEVORADOR DE PARTÍCULAS BOID (Tecla E) - usando módulo ===
            const devoradorActivadoAhora = actualizarHabilidadDevorador(this, delta);

            // === HABILIDAD COHETES (Tecla Q) - usando módulo ===
            actualizarHabilidadCohetes(this, delta);

            // === HABILIDAD PROPULSOR (Tecla R) - usando módulo ===
            actualizarHabilidadPropulsor(this, delta);

            // NOTA: La pasiva Tiempo Fuera (incl. regeneración de escudos) la maneja
            // PixiHUD._actualizarIconoTiempo(), invocado vía this.pixiHUD.actualizar().

    // === ACTUALIZAR PARTÍCULAS BOID - usando módulo ===
            actualizarSistemaBoid(this, delta);

    // === ACTUALIZAR PROYECTILES - usando módulo ===
            actualizarProyectilesJugador(this, delta);
            actualizarProyectilesEnemigos(this, delta);

            // === ACTUALIZAR ENEMIGOS (usando módulo) ===
            actualizarEnemigos(this, delta);

            // === ACTUALIZAR NAVES ENEMIGAS - usando módulo ===
            actualizarNavesEnemigasCompleto(this, delta);

            // Colisiones de asteroides con mini especiales que orbitan al jugador
            procesarColisionesMiniEspeciales(this);

            // === ACTUALIZAR EFECTO ULTI - usando módulo ===
            actualizarUlti(this, delta);

            // === ACTUALIZAR EFECTOS - usando módulo ===
            actualizarEfectosImpacto(this, delta);

            // === PROCESAR COLISIONES - usando módulo ===
            procesarColisionesProyectiles(this);
            procesarColisionesJugador(this);
            procesarColisionesEnemigos(this);

            // === GENERAR NUEVOS ENEMIGOS Y NAVES - usando módulo ===
            actualizarGeneracion(this, delta);

            // === MUNDO TOROIDAL (A+B): envolver posiciones + render sin costura ===
            // Va al final, tras mover/generar todo, para que cada sprite quede en su
            // copia más cercana a la nave este frame.
            this._actualizarToroide();

            // === ACTUALIZAR PIXI HUD (nuevo HUD en PixiJS) ===
            // Se actualiza cada frame para reflejar el estado del juego
            if (this.pixiHUD) {
                this.pixiHUD.actualizar();
            }

            // === FONDO ===
            // Ya no se auto-desplaza: el fondo es fijo dentro del mundo y la
            // sensación de movimiento la da la cámara al seguir a la nave.
        } catch (error) {
            // Cualquier error no controlado en el game loop se loguea
            // pero NO detiene el ticker de PixiJS.
            console.error('[Game] Error en game loop:', error);
        }
    }
    
    /**
     * Detiene el juego
     * Pausa el bucle principal
     */
    stop() {
        this.ejecutando = false;
    }
    
    /**
     * Destruye el juego y libera todos los recursos
     * Se llama cuando se cierra la página o se termina el juego definitivamente
     */
    destroy() {
        // Detener el juego
        this.stop();
        
        // Destruir el jugador
        if (this.jugador) {
            this.jugador.destroy();
        }
        
        // Destruir todos los proyectiles
        for (const obj of this.proyectiles) {
            obj.destroy();
        }
        
        // Destruir todos los enemigos
        for (const enemy of this.enemigos) {
            enemy.destroy();
        }
        
        // Destruir la aplicación PixiJS
        if (this.aplicacion) {
            this.aplicacion.destroy(true);
        }
    }
    
    /**
     * Muestra la pantalla de Top 5
     * Se puede llamar desde pausa (juego en curso) o desde Game Over
     */
    async _mostrarTop5() {
        // Si no está en Game Over ni en pausa, el Top 5 debería mostrarse de forma diferente
        // Verificar si el juego está en curso (no pausado, no game over)
        const juegoEnCurso = !this.pausado && !this.enGameOver;
        
        if (juegoEnCurso) {
            // Durante el juego: solo mostrar el Top 5 sin limpiar nada del juego
            // Pausar el juego primero
            this.pausado = true;
            this.mostrandoTop5EnPausa = true;
            
            // Desactivar los listeners del stage para evitar reinicios no deseados
            if (this.aplicacion && this.aplicacion.stage) {
                this.aplicacion.stage.removeAllListeners('pointerdown');
                this.aplicacion.stage.eventMode = 'none';
            }
        } else if (this.pausado) {
            // Desde pausa (tecla T en menu de pausa): setear flag
            this.mostrandoTop5EnPausa = true;
            
            // Desactivar listeners
            if (this.aplicacion && this.aplicacion.stage) {
                this.aplicacion.stage.eventMode = 'none';
            }
        } else {
            // Desde Game Over: NO limpiar - solo agregar elementos del Top 5
            // Los elementos de Game Over ya estan en elementosFinJuego
        }
        
        // Cargar imagen de puntuación (usando gameOver.png como fondo)
        const puntuacionTexture = await PIXI.Assets.load('assets/gameOver.png');
        
        // Crear sprite con la imagen
        const puntuacionSprite = new PIXI.Sprite(puntuacionTexture);
        
        // === IMAGEN MÁS GRANDE, FIJA Y CENTRADA ===
        // Marco más grande para que el botón Volver no tape las filas del Top 5
        const maxWidth = this.anchoJuego * 0.6;
        const maxHeight = this.altoJuego * 0.62;
        const scale = Math.min(maxWidth / puntuacionSprite.width, maxHeight / puntuacionSprite.height);
        puntuacionSprite.scale.set(scale);
        puntuacionSprite.anchor.set(0.5);
        
        // Centro exacto de la pantalla
        puntuacionSprite.x = this.anchoJuego / 2;
        puntuacionSprite.y = this.altoJuego / 2;
        
        this.aplicacion.stage.addChild(puntuacionSprite);
        this.elementosFinJuego.push(puntuacionSprite);
        
        // Dimensiones reales de la imagen escalada (ya está escalada, no multiplicar por scale de nuevo)
        const imagenAncho = puntuacionSprite.width;
        const imagenAlto = puntuacionSprite.height;
        
        // === ENCABEZADO DE LA TABLA (centrado dentro de la imagen) ===
        // Título de las columnas: N° | NOMBRE | PUNTOS | OLEADAS
        const headerContainer = new PIXI.Container();
        
        // Crear cada columna del encabezado por separado para mejor alineación
        // Usando estilo predefinido de encabezado
        const headerNum = new PIXI.Text({ text: 'N°', style: this.estilos.encabezado });
        const headerNombre = new PIXI.Text({ text: 'NOMBRE', style: this.estilos.encabezado });
        const headerPuntos = new PIXI.Text({ text: 'PUNTOS', style: this.estilos.encabezado });
        const headerOleada = new PIXI.Text({ text: 'OLEADAS', style: this.estilos.encabezado });
        
        // Posicionar cada columna PROPORCIONAL al ancho del marco (imagenAncho),
        // no en px fijos: así al achicarse el marco en el celular las columnas no
        // se salen del papel.
        headerNum.x = -imagenAncho * 0.36;     // N° más a la izquierda
        headerNombre.x = -imagenAncho * 0.27;  // NOMBRE
        headerPuntos.x = imagenAncho * 0.06;   // PUNTOS
        headerOleada.x = imagenAncho * 0.28;   // OLEADAS más a la derecha

        headerContainer.addChild(headerNum, headerNombre, headerPuntos, headerOleada);

        // Centrar el encabezado dentro de la imagen (proporcional)
        headerContainer.x = this.anchoJuego / 2 - imagenAncho * 0.025;
        // El encabezado se posiciona PROPORCIONAL a la altura del marco (no en px
        // absolutos): así al maximizar la ventana el marco crece y el encabezado
        // baja con él, sin quedar pegado arriba.
        const zonaContenidoInicioY = (this.altoJuego / 2) - (imagenAlto / 2) + imagenAlto * 0.17;
        headerContainer.y = zonaContenidoInicioY;
        
        this.aplicacion.stage.addChild(headerContainer);
        this.elementosFinJuego.push(headerContainer);
        
        // Obtener lista del top 5
        const lista = await this.top5.obtenerLista();
        
        // === MOSTRAR LOS 5 PRIMEROS (centrado dentro de la imagen) ===
        // Crear cada fila con columnas separadas para mejor alineación
        for (let i = 0; i < 5; i++) {
            const rowContainer = new PIXI.Container();
            
            // Obtener datos de la lista o mostrar guiones
            const num = i + 1;
            const nombre = lista[i] ? lista[i].nombre : '---';
            const puntos = lista[i] ? lista[i].puntuacion.toString() : '---';
            const oleada = lista[i] ? lista[i].oleada.toString() : '---';
            
            // Crear texto para cada columna usando estilo predefinido
            const textNum = new PIXI.Text({ text: num.toString(), style: this.estilos.filaTabla });
            const textNombre = new PIXI.Text({ text: nombre, style: this.estilos.filaTabla });
            const textPuntos = new PIXI.Text({ text: puntos, style: this.estilos.filaTabla });
            const textOleada = new PIXI.Text({ text: oleada, style: this.estilos.filaTabla });
            
// Posicionar cada columna en la fila (mismo spacing PROPORCIONAL que el encabezado)
            textNum.x = -imagenAncho * 0.36;     // N° más a la izquierda
            textNombre.x = -imagenAncho * 0.27;  // NOMBRE
            textPuntos.x = imagenAncho * 0.06;   // PUNTOS
            textOleada.x = imagenAncho * 0.28;   // OLEADAS más a la derecha

            rowContainer.addChild(textNum, textNombre, textPuntos, textOleada);
            rowContainer.x = this.anchoJuego / 2 - imagenAncho * 0.025;
            // Las filas van una debajo de la otra, centradas en la imagen.
            // Espaciado proporcional a la altura del marco (igual que el encabezado)
            // para que escale bien al maximizar la ventana.
            const filaInicioY = zonaContenidoInicioY + imagenAlto * 0.11;
            rowContainer.y = filaInicioY + (i * imagenAlto * 0.085);
            
            this.aplicacion.stage.addChild(rowContainer);
            this.elementosFinJuego.push(rowContainer);
        }
        
        // === BOTÓN VOLVER (HTML nativo) ===
        // Posición PROPORCIONAL al marco, centrado abajo, con la conversión
        // coords-juego → pantalla (para que quede alineado con el marco en el
        // celular y NO se superponga a las filas).
        const { escala: escVolver, offX: offXVolver, offY: offYVolver } = this._mapaCanvas();
        const gxVolver = this.anchoJuego / 2;                          // centro horizontal
        const gyVolver = (this.altoJuego / 2) + imagenAlto * 0.34;     // cerca del fondo del marco
        const anchoVolver = Math.max(110, Math.round(imagenAncho * 0.25 * escVolver));

        const btnVolver = document.createElement('img');
        btnVolver.src = 'assets/botonVolver.png';
        btnVolver.id = 'btn-volver';
        btnVolver.style.position = 'absolute';
        btnVolver.style.left = (offXVolver + gxVolver * escVolver) + 'px';
        btnVolver.style.top = (offYVolver + gyVolver * escVolver) + 'px';
        btnVolver.style.transform = 'translate(-50%, -50%)';
        btnVolver.style.width = anchoVolver + 'px';
        btnVolver.style.height = 'auto';
        btnVolver.style.cursor = 'pointer';
        btnVolver.style.zIndex = '1000';
        btnVolver.style.transition = 'all 0.2s ease';

        // Efecto hover para VOLVER
        btnVolver.addEventListener('mouseenter', () => {
            btnVolver.style.transform = 'translate(-50%, -50%) scale(1.1)';
            btnVolver.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
        });
        
        btnVolver.addEventListener('mouseleave', () => {
            btnVolver.style.transform = 'translate(-50%, -50%) scale(1)';
            btnVolver.style.filter = 'brightness(1) drop-shadow(0 0 0 transparent)';
        });
        
        btnVolver.onclick = () => {
            // Remover solo los elementos del Top 5 (indices 5 en adelante)
            // Conservar: 0=bg, 1=gameOver, 2=titleText, 3=scoreText, 4=waveText
            if (this.elementosFinJuego && this.elementosFinJuego.length > 5) {
                const elementosAQuitar = this.elementosFinJuego.slice(5);
                for (const el of elementosAQuitar) {
                    try {
                        if (el && el.parent) {
                            el.parent.removeChild(el);
                            if (el.destroy) el.destroy();
                        }
                    } catch (e) {}
                }
            }
            
            // Remover boton VOLVER HTML
            const btnVolverEl = document.getElementById('btn-volver');
            if (btnVolverEl) btnVolverEl.remove();
            
            // Restaurar eventMode del stage
            if (this.aplicacion && this.aplicacion.stage) {
                this.aplicacion.stage.eventMode = 'static';
            }
            
            if (this.mostrandoTop5EnPausa) {
                // Si estábamos en pausa, volver a pausa (no reanudar)
                this.mostrandoTop5EnPausa = false;
                this.pausado = true;
            }
            // Desde Game Over: solo mostrar los botones que ya existen (ocultos)
            const btnReiniciar = document.getElementById('btn-reiniciar');
            const btnTop5El = document.getElementById('btn-top5');
            if (btnReiniciar) btnReiniciar.style.display = 'block';
            if (btnTop5El) btnTop5El.style.display = 'block';
        };
        
        document.body.appendChild(btnVolver);
        
        // Guardar referencia para limpiar despues
        this.botonesHTML = this.botonesHTML || [];
        this.botonesHTML.push(btnVolver);
        
        // IMPORTANTE: Restaurar eventMode del stage para que funcione
        if (this.aplicacion && this.aplicacion.stage) {
            this.aplicacion.stage.eventMode = 'static';
        }
    }
}
