/**
 * Juego - Clase principal del juego (Main Game Class)
 * 
 * Esta es la clase m├ís importante del juego. Maneja:
 * - El bucle principal del juego (game loop)
 * - La creaci├│n y renderizado de todos los objetos
 * - La detecci├│n y procesamiento de colisiones
 * - El estado general del juego (puntuaci├│n, escudos, game over)
 * - La interfaz de usuario (UI)
 * 
 * Act├║a como el "director" del juego, coordinando todas las dem├ís clases.
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
import { ObjectPool } from './ObjectPool.js';
import { UIManager } from '../../ui/UIManager.js';
import { GestorEntrada } from '../../systems/InputManager.js';

// === M├ôDULOS REFACTORIZADOS ===
import { crearProyectil, actualizarProyectiles, actualizarProyectilesJugador, actualizarProyectilesEnemigos, procesarColisionesProyectiles } from './GameProjectiles.js';
import { generarEnemigo, actualizarEnemigos, generarNaveEnemiga, actualizarNavesEnemigas, actualizarNavesEnemigasCompleto, verificarPosicionLibre, actualizarGeneracion, procesarColisionesJugador, procesarColisionesEnemigos, limpiarEnemigosLejanos } from './GameEnemies.js';
import { crearCohetes, actualizarCohetes, actualizarUIMarcoCohetes, actualizarHabilidadCohetes, actualizarHabilidadDevorador, actualizarHabilidadPropulsor, activarDevorador, actualizarSuccion, actualizarUIMarcoDevorador, activarPropulsor, actualizarUIMarcoPropulsor, actualizarTiempoFuera, encontrarEnemigosCercanos } from './GameSkills.js';
import { activarUlti, actualizarUlti, actualizarEfectosImpacto } from './GameEffects.js';
import { crearParticulaFuera, actualizarParticulasBoid, resetearContadorCapturadas, actualizarSistemaBoid } from './GameBoids.js';
import { inicializarMejoras, crearVentanaMejoras, comprarMejora, actualizarUIMejoras, limpiarVentanaMejoras } from './GameMejoras.js';
import { PixiHUD } from '../ui/PixiHUD.js';

export class Game {
    /**
     * Constructor del juego
     * Inicializa todas las variables principales vac├¡as o en cero
     */
    constructor() {
        // PIXI Application - representa el lienzo (canvas) del juego
        // Se crea en init() y contiene el stage donde se renderizan los objetos
        this.aplicacion = null;
        
        // Objeto del jugador (la nave)
        this.jugador = null;
        
        // InputManager - maneja el teclado
        this.gestorEntrada = null;
        
        // Puntuaci├│n actual del jugador
        this.puntuacion = 0;
        
        // Arrays (listas) para almacenar diferentes tipos de objetos del juego
        // objetosJuego = objetos gen├®ricos
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
        
        // EfectosExplosion = efectos visuales de part├¡culas al destruir especial
        this.efectosExplosion = [];
        
        // EfectosImpacto = efectos visuales de impacto al golpear asteroides
        this.efectosImpacto = [];
        
        // Part├¡culas Boid = part├¡culas con comportamiento de enjambre
        this.particulasBoid = [];
        
        // === OBJECT POOLS ===
        // Pool de proyectiles del jugador - INICIALIZAR DESPU├ëS de cargar texturas
        this.poolProyectiles = null;
        
        // Pool de part├¡culas Boi
        this.poolParticulasBoid = null;
        
        // EfectoUlti = el ataque especial (aro expansivo)
        this.efectoUlti = null;
        
        // EfectoSuccion = efecto de succi├│n del devorador (aro contractivo)
        this.efectoSuccion = null;
        
        // Ejecutando = flag que indica si el juego est├í activo
        // true = el bucle del juego se est├í ejecutando
        // false = el juego est├í pausado o terminado
        this.ejecutando = false;
        
        // Configuraci├│n del juego (game settings)
        
        // TemporizadorSpawn = temporizador para generar nuevos asteroides
        // Se incrementa en cada frame y cuando alcanza un valor, aparece un nuevo asteroide
        this.temporizadorSpawn = 0;
        
        // IntervaloSpawn = tiempo en segundos entre cada oleada de asteroides
        // Se reduce progresivamente para aumentar la dificultad
        this.intervaloSpawn = 1.5;
        this.intervaloMinimoSpawn = 0.3; // M├¡nimo intervalo (m├íxima dificultad)
        this.tasaDisminucionSpawn = 0.10; // Cu├ínto se reduce el intervalo por oleada (5 cent├®simas)
        
        // Temporizador para naves enemigas (cada 10 segundos)
        this.temporizadorNaveEnemiga = 0;
        this.intervaloNaveEnemiga = 10; // Nueva nave cada 10 segundos
        
        // ContadorOleadas = contador de oleadas para determinar dificultad
        this.contadorOleadas = 0;
        
        // AsteroidesDestruidos = contador de asteroides destruidos en la oleada actual
        // La oleada avanza cuando se destruyen 10, 20, 30, etc.
        this.asteroidesDestruidos = 0;
        this.objetivoOleada = 10; // Asteroides a destruir para completar la primera oleada
        this.multiplicadorOleada = 1; // Multiplicador para siguiente oleada (10, 20, 30...)
        
        // MaximoEnemigos = cantidad m├íxima de asteroides en pantalla
        this.maximoEnemigos = 30;
        
        // Ancho y alto del ├írea de juego
        this.anchoJuego = 1080;
        this.altoJuego = 720;
        
        // Texturas cargadas desde assets
        this.texturaJugador = null;
        this.texturaAsteroide = null;
        this.texturaFondo = null;
        
        // Elementos UI
        this.elementoPuntuacionAcumulada = null;
        this.elementoOleada = null;
        this.iconoUltiUX = null;
        this.iconoEscudoUX = null;
        this.marcoEscudoUX = null;
        this.marcoUltiUX = null;
        this.escudosAnterior = 100;
        this.elementoBarraAceleracionUX = null;
        
        // Elementos de fin de juego
        this.elementosFinJuego = [];

        // Flag para evitar limpieza duplicada
        this.limpiezaEnProgreso = false;

        // === PIXI HUD (HUD en PixiJS) ===
        // Se inicializa después de crear la aplicación PixiJS
        this.pixiHUD = null;
        
        // Sistema de Top 5
        this.top5 = new Top5();
        
        // Flag para saber si se pidi├│ nombre
        this.nombreIngresado = false;
        
        // Flag para saber si estamos esperando nombre para el Top 5
        // Evita que clicks reinicien el juego mientras se escribe el nombre
        this.esperandoNombreTop5 = false;
        
        // Flag para saber si estamos en Game Over
        this.enGameOver = false;
        
        // === BANDERAS DE PAUSA Y TOP 5 ===
        // this.pausado = indica si el juego est├í en pausa
        // this.mostrandoTop5EnPausa = indica si se est├í mostrando el Top 5 durante la pausa
        this.pausado = false;
        this.mostrandoTop5EnPausa = false;
        
        // === ESTILOS PREDEFINIDOS PARA PIXI.TEXT ===
        // Para reutilizar y evitar repetir c├│digo
        this.estilos = {
            // Estilo para t├¡tulos (Game Over, etc.)
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
                fontSize: 20,
                fill: 0x0044CC,
                fontWeight: 'bold'
            },
            // Estilo para filas de tabla (Top 5)
            filaTabla: {
                fontFamily: 'Segoe Script, cursive',
                fontSize: 22,
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
    async init(container) {
        // Guardar referencia al contenedor
        this.contenedorJuego = container;
        
        
        
        // Obtener el tama├▒o de la ventana del navegador
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        
        
        // Crear la aplicaci├│n PixiJS
        // PIXI.Application es la clase principal de PixiJS que maneja el canvas
        this.aplicacion = new PIXI.Application();
        
        // Inicializar la aplicaci├│n con configuraci├│n
        await this.aplicacion.init({
            width: width,           
            height: height,         
            backgroundColor: 0x0D0D1A,
            antialias: true,
            resolution: 1,
            autoDensity: true
        });

        //('Aplicaci├│n PixiJS iniciada, canvas:', this.aplicacion.canvas);
        
        // Agregar el canvas (elemento visual del juego) al contenedor HTML
        container.appendChild(this.aplicacion.canvas);
        
        //('Canvas agregado al container');
        
        // Guardar las dimensiones del ├írea de juego
        this.anchoJuego = width;
        this.altoJuego = height;
        
        // Crear el InputManager para manejar el teclado
        this.gestorEntrada = new GestorEntrada();
        
        //('GestorEntrada creado');
        
        // Cargar los assets (im├ígenes) del juego
        await this._cargarRecursos();
        
        //('Recursos cargados, texturas:', this.texturaJugador, this.texturaAsteroide);
        
        // Crear el fondo con estrellas
        this._crearFondo();
        
        //('Fondo creado');
        
        // Crear el jugador (nave)
        this._crearJugador();
        
        // Cargar textura Pboids2
        const texturasPboids = [];
        try {
            const textura = await PIXI.Assets.load('assets/Pboids2.png');
            texturasPboids.push(textura);
        } catch (e) {
            texturasPboids.push(PIXI.Texture.WHITE);
        }

        // Usar Pboids2 como textura de part├¡cula Boid
        this.texturaParticulaBoid = texturasPboids[0] || PIXI.Texture.WHITE;
        this.texturasPboids = texturasPboids;

        // Crear textura de cohete (rect├íngulo rojo)
        const graphicsCohete = new PIXI.Graphics();
        graphicsCohete.beginFill(0xFF4400); // Naranja/rojo
        graphicsCohete.drawRect(0, 0, 16, 8);
        graphicsCohete.endFill();
        this.texturaCohete = this.aplicacion.renderer.generateTexture(graphicsCohete);
        
        //('Jugador creado y renderizado');
        
        // Configurar la interfaz de usuario (UI)
        this._configurarUI();

        // === INICIALIZAR PIXI HUD (migración desde HTML) ===
        // Crea todos los elementos del HUD usando PixiJS en lugar de HTML
        this.pixiHUD = new PixiHUD(this.aplicacion, this);

        // Iniciar el bucle del juego
        // ticker.add() registra una funci├│n que se llama en cada frame (60 veces por segundo)
        this.aplicacion.ticker.add(this._gameLoop.bind(this));
        this.ejecutando = true;
    }
    
    /**
     * Carga los assets (recursos) del juego
     * Son las im├ígenes que se usan en el juego
     */
    async _cargarRecursos() {
        //('Cargando assets...');
        
        try {
            // Inicializar PixiJS Assets
            await PIXI.Assets.init();
            
            // Cargar las im├ígenes desde la carpeta assets/
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
            
            // Asignar las texturas cargadas
            this.texturaJugador = naveTexture;
            this.texturaAsteroide = asteroideTexture;
            this.texturaAsteroideSpecial = asteroideSpecialTexture;
            this.texturaFondo = fondoTexture;
            this.texturaProyectil = proyectilTexture;
            this.texturaExplosion = [explocion1, explocion2, explocion3, explocion4, explocion5];
            this.texturaAsteroidExplosion = [astroExplosion1, astroExplosion2, astroExplosion3, astroExplosion4, astroExplosion5];
            this.texturaNaveEnemiga = enimigoTexture;
            
            // Crear textura de part├¡cula Boid (2x2px) program├íticamente
            // Usar un Graphics directamente como fallback
            this.texturaParticulaBoid = PIXI.Texture.WHITE;
            
            // Verificar que la textura se carg├│ correctamente
            if (!this.texturaNaveEnemiga) {
                console.error('Error: textura de nave enemiga no se carg├│');
            }
            
            //('Assets cargados correctamente - Jugador:', this.texturaJugador, 'Asteroide:', this.texturaAsteroide);
        } catch (error) {
            console.error('Error cargando assets:', error);
            
            //('Usando texturas generadas como fallback...');
            
            // Crear Graphics para la nave
            const naveGraphics = new PIXI.Graphics();
            // Tri├íngulo de nave
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
            // Agregar algunos cr├íteres
            astroGraphics.circle(-10, -5, 8);
            astroGraphics.fill(0x990000);
            astroGraphics.circle(8, 10, 5);
            astroGraphics.fill(0x990000);
            // Convertir a textura
            this.texturaAsteroide = this.aplicacion.renderer.generateTexture(astroGraphics);
            
            //('Fallback listo - Jugador:', this.texturaJugador, 'Asteroide:', this.texturaAsteroide);
        }
    }
    
    /**
     * Crea el fondo del juego usando una imagen
     * Si no hay imagen, dibuja estrellas program├íticamente
     */
    _crearFondo() {
        //('Creando fondo, stage:', this.aplicacion.stage);
        
        const w = this.anchoJuego;
        const h = this.altoJuego;
        
        // Verificar si hay una textura de fondo cargada
        if (this.texturaFondo) {
            // Crear fondo infinito usando mosaicos (tiling)
            // Esto permite que el espacio sea infinito
            
            // Crear un contenedor para el fondo
            this.contenedorFondo = new PIXI.Container();
            
            // Calcular cu├íntas veces cabe la imagen horizontal y verticalmente
            const imagenAncho = this.texturaFondo.width;
            const imagenAlto = this.texturaFondo.height;
            
            const columnas = Math.ceil(w / imagenAncho) + 1;
            const filas = Math.ceil(h / imagenAlto) + 1;
            
            // Crear mosaicos para cubrir toda la pantalla
            this.mosaicosFondo = [];
            
            for (let col = 0; col < columnas; col++) {
                for (let fila = 0; fila < filas; fila++) {
                    const mosaico = new PIXI.Sprite(this.texturaFondo);
                    mosaico.x = col * imagenAncho;
                    mosaico.y = fila * imagenAlto;
                    this.contenedorFondo.addChild(mosaico);
                    this.mosaicosFondo.push(mosaico);
                }
            }
            
            // Agregar al stage
            this.aplicacion.stage.addChild(this.contenedorFondo);
            
            // Guardar dimensiones para el movimiento infinito
            this._anchoMosaico = imagenAncho;
            this._altoMosaico = imagenAlto;
            this._columnasMosaico = columnas;
            this._filasMosaico = filas;
        } else {
            // Fallback: dibujar estrellas program├íticamente
            this._crearFondoConEstrellas(w, h);
        }
        
        //('Fondo agregado al stage, children:', this.aplicacion.stage.children.length);
    }
    
    /**
     * Dibuja estrellas program├íticamente (fallback)
     * Se usa si no hay imagen de fondo
     */
    _crearFondoConEstrellas(w, h) {
        // Crear objeto gr├ífico para dibujar
        const graphics = new PIXI.Graphics();
        
        // Dibujar rect├íngulo negro que cubre toda la pantalla
        graphics.rect(0, 0, w, h);
        graphics.fill(0x0D0D1A); // Color negro espacial
        
        // Calcular cantidad de estrellas seg├║n el tama├▒o de la pantalla
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
        
        // Agregar el fondo al stage
        this.aplicacion.stage.addChild(graphics);
    }
    
    /**
     * Crea el jugador (nave espacial)
     * Se posiciona en el centro de la pantalla
     */
    _crearJugador() {
        // Calcular posici├│n central
        const centerX = this.anchoJuego / 2;
        const centerY = this.altoJuego / 2;
        
        //('Creando jugador en:', centerX, centerY, 'textura:', this.texturaJugador);
        
        // Crear el objeto Player con la textura de la nave
        this.jugador = new Jugador(centerX, centerY, this.texturaJugador, this.anchoJuego, this.altoJuego);
        
        //('Jugador creado, imagen:', this.jugador.imagen);
        
        // Guardar referencia al juego en el jugador
        // Esto permite que el jugador pueda crear proyectiles
        this.jugador.juego = this;
        
        // Resetear la velocidad de disparo al valor inicial
        this.jugador.reiniciarVelocidadDisparo();
        
        // Renderizar el jugador en el stage
        this.jugador.render(this.aplicacion.stage);
        
        //('Jugador renderizado, parent:', this.jugador.imagen?.parent);
        
        // Inicializar sistema de mejoras despu├®s de crear el jugador
        inicializarMejoras(this);
        this.aplicarMejoras();
    }
    
    /**
     * Aplica las mejoras compradas al juego
     * Se llama al inicializar y al comprar mejoras
     */
    aplicarMejoras() {
        // Aplicar reducci├│n de coste ULTi (indices 10-14)
        // Cada compra reduce 50, m├íximo 250 de reducci├│n (500 - 250 = 250 m├¡nimo)
        if (this.jugador && this.mejoras) {
            let reduccionUlti = 0;
            for (let i = 10; i <= 14; i++) {
                if (this.mejoras[i] >= 1) {
                    reduccionUlti += 50;
                }
            }
            this.jugador.cargaMaxUlti = Math.max(250, this.jugador.cargaMaxUltiBase - reduccionUlti);
        }
        
        // Guardar bonificaci├│n de regeneraci├│n para tiempo fuera (indices 20-24)
        // +5, +10, +15, +20, +30 = m├íximo +80
        if (this.mejoras) {
            let regeneracionBonus = 0;
            for (let i = 20; i <= 24; i++) {
                if (this.mejoras[i] >= 1) {
                    regeneracionBonus += [5, 10, 15, 20, 30][i - 20];
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
            this.jugador.escudos = this.jugador.escudosMax;
        }
    }
    
/**
     * Capturar part├¡cula Boid cuando la nave se acerca
     * @param {BoidParticle} particula - Part├¡cula a capturar
     * @param {number} indice - ├ìndice en el array
     */
    _capturarParticulaBoid(particula, indice) {
        // Eliminar la part├¡cula (NO se crea otra autom├íticamente)
        particula.destroy(this.poolParticulasBoid);
        this.particulasBoid.splice(indice, 1);
        
        // Incrementar contador de part├¡culas capturadas
        this.particulasCapturadas++;
        
        // Actualizar contador visual
        if (this.contadorDevoradorUX) {
            this.contadorDevoradorUX.textContent = this.particulasCapturadas.toString();
        }
        
        
    }
    
    /**
     * Crear part├¡cula en posici├│n aleatoria (FUERA de la pantalla)
     * @returns {BoidParticle} Nueva part├¡cula
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
        
        // Usar pool para obtener part├¡cula
        const particula = new BoidParticle(x, y, this.texturaParticulaBoid, this.texturasPboids);
        
        // Configurar posici├│n y velocidad
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
     * Encontrar los N enemigos m├ís cercanos a la nave del jugador
     * @param {number} cantidad - N├║mero de enemigos a encontrar
     * @returns {Array} Array con los enemigos m├ís cercanos
     */
    _encontrarEnemigosCercanos(cantidad) {
        if (!this.jugador || !this.jugador.active) return [];
        
        // Crear lista de enemigos con su distancia
        const enemigosConDistancia = [];
        
        for (const enemigo of this.enemigos) {
            if (!enemigo.active) continue;
            
            const dx = enemigo.x - this.jugador.x;
            const dy = enemigo.y - this.jugador.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            enemigosConDistancia.push({ enemigo, distancia });
        }
        
        // Ordenar por distancia
        enemigosConDistancia.sort((a, b) => a.distancia - b.distancia);
        
        // Devolver los primeros N
        return enemigosConDistancia.slice(0, cantidad).map(e => e.enemigo);
    }
    
    /**
     * Verificar colisiones de la part├¡cula con otros objetos (sin efecto)
     * @param {BoidParticle} particula - Part├¡cula a verificar
     */
    _verificarColisionesParticula(particula) {
        // Colisiones con asteroides
        for (const enemigo of this.enemigos) {
            if (!enemigo.active) continue;
            if (particula.verificarColision(enemigo)) {
                // Colisi├│n detectada pero no hace nada
            }
        }
        
        // Colisiones con naves enemigas
        for (const nave of this.enemigosNaves) {
            if (!nave.active) continue;
            if (particula.verificarColision(nave)) {
                // Colisi├│n detectada pero no hace nada
            }
        }
        
        // Colisiones con proyectiles
        for (const proj of this.proyectiles) {
            if (!proj.active) continue;
            if (particula.verificarColision(proj)) {
                // Colisi├│n detectada pero no hace nada
            }
        }
        
        // Colisiones con proyectiles enemigos
        for (const proj of this.proyectilesEnemigos) {
            if (!proj.active) continue;
            if (particula.verificarColision(proj)) {
                // Colisi├│n detectada pero no hace nada
            }
        }
    }
    
    /**
     * Mantener part├¡cula dentro de la pantalla (wrap-around)
     * @param {BoidParticle} particula - Part├¡cula a verificar
     */
    _mantenerParticulaEnPantalla(particula) {
        const margen = 5;
        
        // Si sale por un lado, aparece por el otro
        if (particula.x < -margen) {
            particula.x = this.anchoJuego + margen;
        } else if (particula.x > this.anchoJuego + margen) {
            particula.x = -margen;
        }
        
        if (particula.y < -margen) {
            particula.y = this.altoJuego + margen;
        } else if (particula.y > this.altoJuego + margen) {
            particula.y = -margen;
        }
    }
    
    /**
     * Configura la interfaz de usuario usando UIManager
     * Crea los elementos HTML din├ímicamente
     */
    _configurarUI() {
        // Crear UIManager y HUD
        if (!this.uiManager && this.contenedorJuego) {
            this.uiManager = new UIManager(this.contenedorJuego, {});
        }
        
        if (this.uiManager) {
            // Crear HUD y obtener referencias
            const hud = this.uiManager.crearHUD();
            
            // Asignar referencias de UI (solo las que mantienen)
            this.elementoOleada = hud.elementoOleada;
            this.elementoPuntuacionAcumulada = hud.elementoPuntuacionAcumulada;
            
            // Barra de aceleraci├│n (solo la de UX)
            this.elementoBarraAceleracionUX = hud.elementoBarraAceleracionUX;
            
            // Iconos UX
            this.iconoEscudoUX = hud.iconoEscudoUX;
            this.marcoEscudoUX = hud.marcoEscudoUX;
            this.fondoEscudoUX = hud.fondoEscudoUX;
            this.iconoUltiUX = hud.iconoUltiUX;
            this.marcoUltiUX = hud.marcoUltiUX;
            
            // Icono y marco del devorador
            this.iconoDeboradorUX = hud.iconoDeboradorUX;
            this.marcoDeboradorUX = hud.marcoDeboradorUX;
            this.fondoDeboradorUX = hud.fondoDeboradorUX;
            this.contadorDevoradorUX = hud.contadorDevorador;
            this.particulasCapturadas = 0;
            
            // Icono y marco de Tiempo Fuera
            this.iconoTiempoUX = hud.iconoTiempoUX;
            this.marcoTiempoUX = hud.marcoTiempoUX;
            this.fondoTiempoUX = hud.fondoTiempoUX;
            this.imagenOriginalTiempoUX = 'assets/tiempo fuera.png'; // Guardar imagen original
            
            // Icono y marco de Cohetes
            this.iconoCohetesUX = hud.iconoCohetesUX;
            this.marcoCohetesUX = hud.marcoCohetesUX;
            this.fondoCohetesUX = hud.fondoCohetesUX;
            
            // Icono y marco de Propulsor
            this.iconoPropulUX = hud.iconoPropulUX;
            this.marcoPropulUX = hud.marcoPropulUX;
            this.fondoPropulUX = hud.fondoPropulUX;
            
            // Habilidad Tiempo Fuera (pasiva)
            this.tiempoFueroActivo = false;
            this.timerTiempoFuera = 0;
            this.duracionTiempoFuera = 25;
            
            // Animaci├│n del reloj (Tiempo Fuero activo)
            this.relojFrameActual = 1;
            this.timerAnimacionReloj = 0;
            this.intervaloAnimacionReloj = 0.3; // 0.3 segundos por frame (m├ís lento)
            this.relojGirado180 = false;
            this.animacionRelojActiva = false;
            
            // Cohetes
            this.cohetes = []; // Array de cohetes activos
            
            // Actualizar UI por primera vez
            this._actualizarUI();
        }
    }
    
/**
     
    /**
     * Actualiza la interfaz de usuario
     * Muestra la puntuaci├│n actual, los escudos y si el ulti est├í listo
     * Si est├í en sobrecalentamiento, muestra en rojo
     * @param {number} delta - Tiempo transcurrido
     */
_actualizarUI(delta = 0) {
        // Actualizar el panel de puntuaci├│n acumulada
        if (this.elementoPuntuacionAcumulada) {
            this.elementoPuntuacionAcumulada.textContent = this.puntuacion.toString();
        }
        
        // Actualizar display de oleada
        if (this.elementoOleada) {
            const faltantes = this.objetivoOleada - this.asteroidesDestruidos;
            const cantidadPBOids = this.particulasBoid ? this.particulasBoid.length : 0;
            this.elementoOleada.textContent = `Oleada: ${this.contadorOleadas} | Faltan: ${faltantes} | Ast: ${this.intervaloSpawn.toFixed(1)}s | Naves: ${this.intervaloNaveEnemiga.toFixed(1)}s | PBOids: ${cantidadPBOids}`;
        }
        
        // Actualizar icono de escudo y marco en UX seg├║n el estado
        if (this.jugador && this.iconoEscudoUX && this.marcoEscudoUX) {
            const porcentajeEscudos = this.jugador.escudos;
            
            // Detectar impacto (los escudos bajaron y no est├í sobrecalentado)
            const huboImpacto = porcentajeEscudos < this.escudosAnterior && !this.jugador.sobrecalentado;
            
            // Si hubo impacto, agregar animaci├│n de brillo blanco (solo flash, no cambia color)
            if (huboImpacto) {
                this.marcoEscudoUX.classList.remove('impact');
                void this.marcoEscudoUX.offsetWidth;
                this.marcoEscudoUX.classList.add('impact');
                // Tambi├®n al fondo
                this.fondoEscudoUX.classList.remove('impact');
                void this.fondoEscudoUX.offsetWidth;
                this.fondoEscudoUX.classList.add('impact');
            }
            
            // Si est├í sobrecalentado (escudo roto), animaci├│n entre escudo4 y escudo5 y marco rojo
            if (this.jugador.sobrecalentado) {
                const tiempo = Date.now();
                const indiceAnimacion = Math.floor(tiempo / 200) % 2 + 4;
                this.iconoEscudoUX.src = `assets/escudo${indiceAnimacion}.png`;
                this.marcoEscudoUX.classList.add('overheated');
                // Cambiar color del marco Y del fondo a ROJO
                this.marcoEscudoUX.style.borderColor = '#CC0000';
                this.marcoEscudoUX.style.boxShadow = '0 0 15px #CC0000';
                this.fondoEscudoUX.style.borderColor = '#CC0000';
                this.fondoEscudoUX.style.boxShadow = '0 0 15px #CC0000';
            } else {
                // Mostrar icono seg├║n el porcentaje de escudos (1, 2 o 3)
                let indiceIcono;
                if (porcentajeEscudos > 60) {
                    indiceIcono = 1;
                } else if (porcentajeEscudos > 30) {
                    indiceIcono = 2;
                } else {
                    indiceIcono = 3;
                }
                this.iconoEscudoUX.src = `assets/escudo${indiceIcono}.png`;
                this.marcoEscudoUX.classList.remove('overheated');
                // Solo restaurar colores si NO hubo impacto reciente
                // (el impacto tiene su propia animaci├│n de flash blanco)
                if (!huboImpacto) {
                    this.marcoEscudoUX.style.borderColor = '#0044CC';
                    this.marcoEscudoUX.style.boxShadow = '0 0 10px #0044CC';
                    this.fondoEscudoUX.style.borderColor = '#0044CC';
                    this.fondoEscudoUX.style.boxShadow = '0 0 10px #0044CC';
                    this.fondoEscudoUX.style.backgroundColor = 'white';
                }
            }
            
            // Guardar valor actual para pr├│ximos impactos
            this.escudosAnterior = porcentajeEscudos;
        }
        
        // Actualizar icono de ULTi en UX
        if (this.jugador && this.iconoUltiUX && this.marcoUltiUX) {
            const porcentajeCarga = Math.min(100, (this.jugador.cargaUlti / this.jugador.cargaMaxUlti) * 100);
            
            if (this.jugador.ultiListo) {
                const tiempo = Date.now();
                const indiceAnimacion = Math.floor(tiempo / 200) % 3 + 3;
                this.iconoUltiUX.src = `assets/ultiicon${indiceAnimacion}.png`;
                this.marcoUltiUX.classList.add('ready');
            } else {
                let indiceIcono = Math.floor(porcentajeCarga / 20) + 1;
                if (indiceIcono < 1) indiceIcono = 1;
                if (indiceIcono > 5) indiceIcono = 5;
                this.iconoUltiUX.src = `assets/ultiicon${indiceIcono}.png`;
                this.marcoUltiUX.classList.remove('ready');
            }
        }
        
        // Actualizar barra de aceleraci├│n (UX)
        if (this.jugador && this.elementoBarraAceleracionUX) {
            const porcentajeAcel = this.jugador.cargaAceleracion;
            this.elementoBarraAceleracionUX.style.width = `${porcentajeAcel}%`;
            
            // Si est├í sobrecalentado, pintar la barra de rojo
            if (this.jugador.sobrecalentadoAceleracion) {
                this.elementoBarraAceleracionUX.style.background = '#CC0000';
                const contenedorUX = document.getElementById('aceleracion-ux-container');
                if (contenedorUX) {
                    contenedorUX.classList.add('overheated');
                }
            } else {
                this.elementoBarraAceleracionUX.style.background = '#0044CC';
                const contenedorUX = document.getElementById('aceleracion-ux-container');
                if (contenedorUX) {
                    contenedorUX.classList.remove('overheated');
                }
            }
        }
    }
    
    /**
     * Crea un nuevo proyectil
     * Se llama cuando el jugador presiona la tecla de disparar
     * 
     * @param {number} x - Posici├│n X donde nace el proyectil
     * @param {number} y - Posici├│n Y donde nace el proyectil
     * @param {number} direction - Direcci├│n del proyectil en radianes (├íngulo)
     */
    crearProyectil(x, y, direction) {
        // Crear proyectil SIN usar pool (forma original)
        const projectile = new Proyectil(x, y, direction, this.anchoJuego, this.altoJuego, this.texturaProyectil);
        
        // Calcular bonus de da├▒o basado en mejoras compradas (indices 0-4)
        // +2, +3, +5, +5, +10 (se acumulan si compras varias)
        let bonusDano = 0;
        if (this.mejoras && this.mejoras[0] >= 1) bonusDano += 2;  // +2 si compraste la primera
        if (this.mejoras && this.mejoras[1] >= 1) bonusDano += 3;  // +3 si compraste la segunda
        if (this.mejoras && this.mejoras[2] >= 1) bonusDano += 5;  // +5 si compraste la tercera
        if (this.mejoras && this.mejoras[3] >= 1) bonusDano += 5;  // +5 si compraste la cuarta
        if (this.mejoras && this.mejoras[4] >= 1) bonusDano += 10; // +10 si compraste la quinta
        
        projectile.dano += bonusDano;
        
        // Calcular bonus de velocidad basado en mejoras de proyectil2 (indices 15-19)
        // +5%, +5%, +10%, +10%, +20% = total m├íximo 50%
        let multiplicadorVelocidad = 1.0;
        if (this.mejoras && this.mejoras[15] >= 1) multiplicadorVelocidad += 0.05;
        if (this.mejoras && this.mejoras[16] >= 1) multiplicadorVelocidad += 0.05;
        if (this.mejoras && this.mejoras[17] >= 1) multiplicadorVelocidad += 0.10;
        if (this.mejoras && this.mejoras[18] >= 1) multiplicadorVelocidad += 0.10;
        if (this.mejoras && this.mejoras[19] >= 1) multiplicadorVelocidad += 0.20;
        
        projectile.velocidad *= multiplicadorVelocidad;
        
        // Renderizar
        projectile.render(this.aplicacion.stage);
        
        // Agregar a la lista
        this.proyectiles.push(projectile);
    }
    
    /**
     * Activa el ataque especial (Ulti)
     * Crea un aro expansivo que destruye todos los asteroides en pantalla
     */
    activarUlti() {
        // Guardar referencia a "this" para usar dentro del callback
        const game = this;
        
        // Crear el efecto visual del ulti
        this.efectoUlti = new UltiEffect(
            this.jugador.x,              // Posici├│n X del jugador
            this.jugador.y,              // Posici├│n Y del jugador
            this.anchoJuego,             // Ancho del juego
            this.altoJuego,            // Alto del juego
            this.enemigos,              // Lista de asteroides para destruir
            // Callback = funci├│n que se ejecuta cuando se destruye un asteroide
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
                    
                    // La siguiente oleada necesita 10 asteroides m├ís
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
        this.efectoUlti.render(this.aplicacion.stage);
    }
    
    /**
     * Genera un nuevo asteroide
     * Se llama peri├│dicamente para crear nuevos enemigos
     */
    _generarEnemigo() {
        // Sin l├¡mite en pantalla - siempre spawnea nuevos asteroides
        
        // Elegir un tama├▒o aleatorio
        const rand = Math.random();
        let size;
        
        // Calcular probabilidad de special: 2% normal, 4% desde oleada 10
        const probabilidadSpecial = (this.contadorOleadas >= 10) ? 0.04 : 0.02;
        
        // Distribuci├│n de tipos de asteroides:
        // special: 2% (4% desde oleada 10), rezagados: 39% (13% cada uno), large: 22%, medium: 17%, small: 20%
        if (rand < probabilidadSpecial) {
            size = 'special';          // 2% (4% desde oleada 10)
        } else if (rand < 0.18) {
            size = 'large_rezagado';  // 13%
        } else if (rand < 0.31) {
            size = 'medium_rezagado'; // 13%
        } else if (rand < 0.44) {
            size = 'small_rezagado';  // 13%
        } else if (rand < 0.66) {
            size = 'large';           // 22%
        } else if (rand < 0.83) {
            size = 'medium';          // 17%
        } else {
            size = 'small';           // 20%
        }
        
        //('Size asignado directamente:', size);
        
        // Determinar posici├│n de spawn (los asteroides aparecen desde los bordes)
        const w = this.anchoJuego;
        const h = this.altoJuego;
        let x, y;
        
        // Verificar si es un tipo rezagado usando strings
        const isRezagado = size === 'large_rezagado' || 
                          size === 'medium_rezagado' || 
                          size === 'small_rezagado';
        
        if (size === 'special') {
            // Verificar l├¡mite de especiales (m├íximo 3 en pantalla)
            if (this.enemigosSpeciales.length >= 3) {
                size = 'large'; // Si lleg├│ al l├¡mite, crear uno normal
            } else {
                // Aparece fuera de la pantalla y se mueve hacia el jugador
                const w = this.anchoJuego;
                const h = this.altoJuego;
                
                // Elegir un borde aleatorio para spawnear
                const borde = Math.floor(Math.random() * 4);
                let x, y;
                
                switch (borde) {
                    case 0: // Top
                        x = Math.random() * w;
                        y = -80;
                        break;
                    case 1: // Bottom
                        x = Math.random() * w;
                        y = h + 80;
                        break;
                    case 2: // Left
                        x = -80;
                        y = Math.random() * h;
                        break;
                    case 3: // Right
                        x = w + 80;
                        y = Math.random() * h;
                        break;
                }
                
                // Crear con posici├│n fuera de la pantalla
                const especial = new SpecialEnemy(
                    x, y,
                    this.jugador,
                    this.texturaAsteroideSpecial,
                    this.anchoJuego,
                    this.altoJuego
                );
                especial.render(this.aplicacion.stage);
                this.enemigosSpeciales.push(especial);
                return; // No crear m├ís
            }
        } else if (size === 'large_rezagado' || size === 'medium_rezagado' || size === 'small_rezagado') {
            // Los rezagados aparecen desde un borde y cruzan la pantalla
            // pero evitan la zona central (donde est├í la nave)
            // Mantienen una l├¡nea recta SIN dirigirse a la nave
            let dirX = 0;
            let dirY = 0;
            
            if (Math.random() < 0.5) {
                // Eje horizontal: aparecen a izquierda/derecha
                if (Math.random() < 0.5) {
                    // Nace a la izquierda, va hacia la derecha
                    x = -60;
                    dirX = 1;
                } else {
                    // Nace a la derecha, va hacia la izquierda
                    x = w + 60;
                    dirX = -1;
                }
                
                // Y en zona superior O inferior (evitando el centro 30%)
                if (Math.random() < 0.5) {
                    // Zona superior (0% al 40% del alto)
                    y = Math.random() * (h * 0.4);
                } else {
                    // Zona inferior (60% al 100% del alto)
                    y = h * 0.6 + Math.random() * (h * 0.4);
                }
            } else {
                // Eje vertical: aparecen arriba/abajo
                if (Math.random() < 0.5) {
                    // Nace arriba, va hacia abajo
                    y = -60;
                    dirY = 1;
                } else {
                    // Nace abajo, va hacia arriba
                    y = h + 60;
                    dirY = -1;
                }
                
                // X en zona izquierda O derecha (evitando el centro 30%)
                if (Math.random() < 0.5) {
                    // Zona izquierda (0% al 40% del ancho)
                    x = Math.random() * (w * 0.4);
                } else {
                    // Zona derecha (60% al 100% del ancho)
                    x = w * 0.6 + Math.random() * (w * 0.4);
                }
            }
            
            // Elegir textura seg├║n el tipo
            const textura = (size === 'special') ? this.texturaAsteroideSpecial : this.texturaAsteroide;
            
            // Crear el enemigo
            const enemigo = new Enemigo(x, y, size, this.jugador, textura, null, false, this.anchoJuego, this.altoJuego);
            
            // === AUMENTAR VELOCIDAD CADA 5 OLEADAS ===
            // Cada 5 oleadas, los asteroides aumentan un 10% su velocidad
            // Hasta un m├íximo del 60% (oleada 30+)
            const oleadasAumento = Math.floor(this.contadorOleadas / 5);
            const aumentoVelocidad = Math.min(oleadasAumento * 0.10, 0.60);
            const multiplicadorVelocidad = 1 + aumentoVelocidad;
            enemigo.multiplicadorVelocidad = multiplicadorVelocidad;
            
            // Asignar la direcci├│n correcta al rezagado
            enemigo.direccionX = dirX;
            enemigo.direccionY = dirY;
            
            // Renderizar y agregar a la lista
            enemigo.render(this.aplicacion.stage);
            this.enemigos.push(enemigo);
            
            // Crear part├¡cula Boid a 10px del enemigo
            this._crearParticulaBoidCercaDe(enemigo);
            
            return;
        } else {
            // Asteroides normales aparecen desde cualquier borde
            // Intentamos hasta 5 veces encontrar una posici├│n libre
            let intentos = 0;
            let posicionLibre = false;
            
            while (!posicionLibre && intentos < 5) {
                if (Math.random() < 0.5) {
                    // Eje horizontal (izquierda o derecha)
                    x = Math.random() < 0.5 ? -60 : w + 60;
                    y = Math.random() * h;
                } else {
                    // Eje vertical (arriba o abajo)
                    x = Math.random() * w;
                    y = Math.random() < 0.5 ? -60 : h + 60;
                }
                
                // Obtener radio seg├║n el tipo de asteroide
                let radioNuevo = 16; // default small
                if (size === 'large') radioNuevo = 64;
                else if (size === 'medium') radioNuevo = 32;
                else if (size === 'small') radioNuevo = 16;
                
                // Verificar si la posici├│n est├í libre
                posicionLibre = this._verificarPosicionLibre(x, y, radioNuevo);
                intentos++;
            }
            
            // Si no encontr├│ posici├│n libre despu├®s de 5 intentos, no crear el asteroide
            if (!posicionLibre) {
                return;
            }
        }
        
        // Elegir textura seg├║n el tipo
        const texturaNormal = (size === 'special') ? this.texturaAsteroideSpecial : this.texturaAsteroide;
        
        // Crear el enemigo con todos los par├ímetros necesarios
        const enemigo = new Enemigo(x, y, size, this.jugador, texturaNormal, null, false, this.anchoJuego, this.altoJuego);
        
        // === AUMENTAR VELOCIDAD CADA 5 OLEADAS ===
        // === AUMENTAR VELOCIDAD CADA 5 OLEADAS ===
        // Cada 5 oleadas, los asteroides aumentan un 10% su velocidad
        // Hasta un m├íximo del 60% (oleada 30+)
        const oleadasAumento = Math.floor(this.contadorOleadas / 5);
        const aumentoVelocidad = Math.min(oleadasAumento * 0.10, 0.60);
        const multiplicadorVelocidad = 1 + aumentoVelocidad;
        enemigo.multiplicadorVelocidad = multiplicadorVelocidad;
        
        //('Enemigo creado:', size, 'imagen:', enemigo.imagen);
        //('TexturaAsteroide:', this.texturaAsteroide);
        
        // Renderizar y agregar a la lista
        enemigo.render(this.aplicacion.stage);
        
        //('Enemigo renderizado, parent:', enemigo.imagen?.parent);
        
        this.enemigos.push(enemigo);
        
        // Crear part├¡cula Boid a 10px del enemigo
        this._crearParticulaBoidCercaDe(enemigo);
    }
    
/**
     * Crear part├¡cula Boid FUERA de la pantalla (cuando se destruye un enemigo)
     * @param {Enemigo} enemigo - Enemy that was destroyed (no usado para posici├│n)
     */
    _crearParticulaBoidCercaDe(enemigo) {
        // Crear part├¡cula FUERA de la pantalla (100px margen)
        const borde = Math.floor(Math.random() * 4);
        let x, y;

        switch (borde) {
            case 0: // Top
                x = Math.random() * this.anchoJuego;
                y = -100;
                break;
            case 1: // Bottom
                x = Math.random() * this.anchoJuego;
                y = this.altoJuego + 100;
                break;
            case 2: // Left
                x = -100;
                y = Math.random() * this.altoJuego;
                break;
            case 3: // Right
                x = this.anchoJuego + 100;
                y = Math.random() * this.altoJuego;
                break;
        }
        
        // Crear part├¡cula en esa posici├│n
        const particula = new BoidParticle(x, y, this.texturaParticulaBoid, this.texturasPboids);
        
        // Velocidad aleatoria hacia el centro
        const centroX = this.anchoJuego / 2;
        const centroY = this.altoJuego / 2;
        const dx = centroX - x;
        const dy = centroY - y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        
        // Configurar posici├│n y velocidad
        particula.x = x;
        particula.y = y;
        particula.velX = (dx / mag) * 50 + (Math.random() - 0.5) * 30;
        particula.velY = (dy / mag) * 50 + (Math.random() - 0.5) * 30;
        particula.active = true;
        
        // Configurar sprite
        if (particula.imagen) {
            particula.imagen.x = x;
            particula.imagen.y = y;
            particula.imagen.visible = true;
        }
        
        this.particulasBoid.push(particula);
        particula.render(this.aplicacion.stage);
    }
    
/**
     * Verifica si dos objetos circulares est├ín en colisi├│n
     * Usa la f├│rmula de distancia entre centros
     * 
     * @param {Object} obj1 - Primer objeto (debe tener x, y, radius)
     * @param {Object} obj2 - Segundo objeto (debe tener x, y, radius)
     * @returns {boolean} - true si hay colisi├│n, false si no
     */
    _verificarColision(obj1, obj2) {
        // Usar 'radio' si existe, sino usar 'radius' (compatibilidad)
        const radio1 = obj1.radio || obj1.radius || 30;
        const radio2 = obj2.radio || obj2.radius || 30;
        
        // Calcular la distancia entre los centros de los dos objetos
        const dx = obj1.x - obj2.x;  // Diferencia en X
        const dy = obj1.y - obj2.y;  // Diferencia en Y
        
        // Teorema de Pit├ígoras: distancia = sqrt(dx┬▓ + dy┬▓)
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Hay colisi├│n si la distancia es menor a la suma de los radios
        // Esto significa que los c├¡rculos se superponen
        return dist < (radio1 + radio2);
    }
    
    /**
     * Verifica si una posici├│n de spawn est├í libre de asteroides
     * Evita que aparezcan asteroides uno encima de otro
     * 
     * @param {number} x - Posici├│n X del nuevo asteroide
     * @param {number} y - Posici├│n Y del nuevo asteroide
     * @param {number} radio - Radio del nuevo asteroide
     * @returns {boolean} - true si est├í libre, false si hay colisi├│n
     */
    _verificarPosicionLibre(x, y, radio) {
        // Verificar contra todos los asteroides normales
        for (const enemigo of this.enemigos) {
            if (!enemigo.active) continue;
            
            const dist = Math.sqrt((x - enemigo.x) ** 2 + (y - enemigo.y) ** 2);
            const sumaRadios = radio + enemigo.radio;
            
            // Si la distancia es menor a la suma de radios, hay superposici├│n
            if (dist < sumaRadios * 1.5) {
                return false; // Posici├│n ocupada
            }
        }
        
        // Verificar contra especiales
        for (const especial of this.enemigosSpeciales) {
            if (!especial.active) continue;
            
            const dist = Math.sqrt((x - especial.x) ** 2 + (y - especial.y) ** 2);
            const sumaRadios = radio + especial.radio;
            
            if (dist < sumaRadios * 1.5) {
                return false;
            }
        }
        
        return true; // Posici├│n libre
    }
    
    /**
     * Procesa las colisiones entre proyectiles y enemigos
     * Se llama en cada frame del juego
     */
    _procesarColisionesProyectiles() {
        // === VERIFICAR COLISI├ôN ENTRE PROYECTILES ALIADOS Y ENEMIGOS ===
        if (this.proyectiles && this.proyectiles.length > 0 && 
            this.proyectilesEnemigos && this.proyectilesEnemigos.length > 0) {
            
            for (let i = this.proyectiles.length - 1; i >= 0; i--) {
                const projectile = this.proyectiles[i];
                if (!projectile || !projectile.active) continue;
                
                // Verificar colisi├│n con proyectiles enemigos
                for (let j = this.proyectilesEnemigos.length - 1; j >= 0; j--) {
                    const projEnemigo = this.proyectilesEnemigos[j];
                    if (!projEnemigo || !projEnemigo.active) continue;
                    
                    if (this._verificarColision(projectile, projEnemigo)) {
                        // Animaci├│n de colisi├│n (t├¡pica de proyectil)
                        const explosion = new ProyectilExplosion(
                            projectile.x, projectile.y,
                            this.texturaExplosion,
                            1.0
                        );
                        explosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(explosion);
                        
                        // Destruir ambos proyectiles
                        projectile.destroy();
                        this.proyectiles.splice(i, 1);
                        
                        projEnemigo.destroy();
                        this.proyectilesEnemigos.splice(j, 1);
                        
                        break; // El proyectil aliado ya no puede chocar con nada m├ís
                    }
                }
            }
        }
        
        // Recorrer todos los proyectiles (de atr├ís hacia adelante para poder eliminar)
        for (let i = this.proyectiles.length - 1; i >= 0; i--) {
            const projectile = this.proyectiles[i];
            
            // Si el proyectil ya no est├í activo, saltar
            if (!projectile || !projectile.active) continue;
            
            // Verificar colisi├│n con cada enemigo
            for (let j = this.enemigos.length - 1; j >= 0; j--) {
                const enemy = this.enemigos[j];
                if (!enemy.active) continue;
                
                // Verificar si hay colisi├│n
                if (this._verificarColision(projectile, enemy)) {
                    // Crear efecto visual de explosi├│n del proyectil (animaci├│n de 5 frames)
                    const explocion = new ProyectilExplosion(
                        enemy.x, enemy.y, 
                        this.texturaExplosion
                    );
                    explocion.render(this.aplicacion.stage);
                    this.efectosImpacto.push(explocion);
                    
                    // Crear efecto visual de impacto (doble tama├▒o: escala = 2)
                    const hit = new HitEffect(enemy.x, enemy.y, 'hit', 2);
                    hit.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hit);
                    
                    // El proyectil hace da├▒o al enemigo
                    // recibirDano() devuelve un array con nuevos asteroides si se rompi├│
                    const newAsteroids = enemy.recibirDano(projectile.dano);
                    
                    // Si hay fragmentos (el asteroide se rompi├│), crear efecto visual de fragmentaci├│n
                    if (newAsteroids && newAsteroids.length > 0) {
                        const hit = new HitEffect(enemy.x, enemy.y, 'fragment', 4, 0xCC0000);
                        hit.render(this.aplicacion.stage);
                        this.efectosImpacto.push(hit);
                    }
                    
                    // Agregar los nuevos fragmentos a la lista
                    for (const nuevoEnemigo of newAsteroids) {
                        nuevoEnemigo.render(this.aplicacion.stage);
                        this.enemigos.push(nuevoEnemigo);
                    }
                    
                    // Si el enemigo fue destruido (health <= 0)
                    if (!enemy.active) {
                        // Crear animaci├│n de destrucci├│n del asteroide (solo para no especiales)
                        // Ajustar escala seg├║n el tama├▒o del asteroide (+20%)
                        if (enemy.tamanio !== 'special') {
                            let escalaAnim = 0.24; // SMALL +20%
                            if (enemy.tamanio === 'medium') {
                                escalaAnim = 0.42; // +20%
                            } else if (enemy.tamanio === 'large') {
                                escalaAnim = 0.84; // +20%
                            } else if (enemy.tamanio === 'rezagado1') {
                                escalaAnim = 0.84; // LARGE +20%
                            } else if (enemy.tamanio === 'rezagado2') {
                                escalaAnim = 0.42; // MEDIUM +20%
                            } else if (enemy.tamanio === 'rezagado3') {
                                escalaAnim = 0.24; // SMALL +20%
                            }
                            
                            // Usar animaci├│n de ASTEROIDE
                            const astroExplosion = new AsteroidExplosion(
                                enemy.x, enemy.y, 
                                this.texturaAsteroidExplosion,
                                escalaAnim
                            );
                            astroExplosion.render(this.aplicacion.stage);
                            this.efectosImpacto.push(astroExplosion);
                        }
                        
                        // El especial se destruye sin animaci├│n de destrucci├│n
                        // Sumar puntos
                        this.puntuacion += enemy.puntos;
                        
                        // Agregar carga al ataque especial
                        this.jugador.agregarCargaUlti(enemy.cargaUlti);
                        
                        // Incrementar contador de asteroides destroyed en la oleada actual
                        this.asteroidesDestruidos++;
                        
                        // Verificar si completamos la oleada (cada 10 asteroides)
                        if (this.asteroidesDestruidos >= this.objetivoOleada) {
                            this.contadorOleadas++;
                            this.asteroidesDestruidos = 0;
                            
                            // La siguiente oleada necesita 10 asteroides m├ís
                            this.objetivoOleada = 10 + (this.contadorOleadas * 10);
                            
                            // Reducir el intervalo de spawn (aumentar dificultad)
                            // Pero ahora de forma m├ís gradual
                            if (this.intervaloSpawn > this.intervaloMinimoSpawn) {
                                this.intervaloSpawn = Math.max(
                                    this.intervaloMinimoSpawn,
                                    this.intervaloSpawn - this.tasaDisminucionSpawn
                                );
                            }
                            
                            // El avance de oleadas se maneja por temporizador (cada 10 segundos)
                            // this._crearNaveEnemiga(); // Deshabilitado - ahora aparece por temporizador
                        }
                        
                        // Remover el enemigo de la lista
                        this.enemigos.splice(j, 1);
                    }
                    
                    // Destruir el proyectil (ya impact├│)
                    projectile.destroy(this.poolProyectiles);
                    this.proyectiles.splice(i, 1);
                    
                    // Actualizar la UI
                    this._actualizarUI();
                    
                    // Salir del for de enemigos (el proyectil solo puede golpear uno)
                    break;
                }
            }
            
            // Verificar colisi├│n con enemigos especiales
            for (let k = this.enemigosSpeciales.length - 1; k >= 0; k--) {
                const especial = this.enemigosSpeciales[k];
                if (!especial || !especial.active) continue;
                
                if (this._verificarColision(projectile, especial)) {
                    // Si est├í en ├│rbita, el proyectil del aliado traspasa (no colisiona)
                    if (especial.enOrbita) {
                        // No hacer nada, el proyectil sigue su camino
                    } else {
                        // Animaci├│n de proyectil (t├¡pica cuando colisiona)
                        const explosion = new ProyectilExplosion(
                            especial.x, especial.y,
                            this.texturaExplosion,
                            1.5
                        );
                        explosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(explosion);
                        
                        // El proyectil hace da├▒o
                        especial.salud -= projectile.dano;
                        
                        // Si fue destruido, convertir en mini y orbitar (como cuando el jugador colisiona)
                        let seConvirtioEnMini = false;
                        if (especial.salud <= 0) {
                            // Contar cu├íntos especiales ya est├ín en ├│rbita
                            let indiceOrbita = 0;
                            for (const esp of this.enemigosSpeciales) {
                                if (esp !== especial && esp.active && esp.enOrbita) {
                                    indiceOrbita++;
                                }
                            }
                            
                            // Calcular primera posici├│n en la ├│rbita para la animaci├│n
                            const velocidadBase = 1.5;
                            const radioBase = 130;
                            const variacionVelocidad = (indiceOrbita % 3) * 0.3;
                            const variacionRadio = (indiceOrbita % 4) * 15;
                            const velocidadActual = velocidadBase + variacionVelocidad;
                            const radioActual = radioBase + variacionRadio;
                            
                            // Calcular posici├│n inicial en la ├│rbita
                            const posX = this.jugador.x + Math.cos(especial.anguloOrbita) * radioActual;
                            const posY = this.jugador.y + Math.sin(especial.anguloOrbita) * radioActual;
                            
                            // Animaci├│n de transformaci├│n (AZUL) en la posici├│n de ├│rbita
                            const astroExplosion = new AsteroidExplosion(
                                posX, posY,
                                this.texturaAsteroidExplosion,
                                0.5,  // Escala mediana
                                0x0000FF  // Color AZUL
                            );
                            astroExplosion.render(this.aplicacion.stage);
                            this.efectosImpacto.push(astroExplosion);
                            
                            // Convertir en mini y orbitar
                            especial.convertirEnOrbita();
                            especial.active = true;
                            seConvirtioEnMini = true;
                            
                            especial.indiceOrbita = indiceOrbita;
                            
                            // Puntos
                            this.puntuacion += especial.puntos;
                        }
                        
                        // Solo destruir el proyectil si NO se convirti├│ en mini
                        if (!seConvirtioEnMini) {
                            projectile.destroy(this.poolProyectiles);
                            this.proyectiles.splice(i, 1);
                            this._actualizarUI();
                        }
                    }
                    break;
                }
            }
            
            // Verificar colisi├│n con cada nave enemiga
            for (let k = this.enemigosNaves.length - 1; k >= 0; k--) {
                const naveEnemiga = this.enemigosNaves[k];
                if (!naveEnemiga || !naveEnemiga.active) continue;
                
                // Verificar si hay colisi├│n
                if (this._verificarColision(projectile, naveEnemiga)) {
                    // Crear efecto visual de impacto (doble tama├▒o: escala = 2)
                    const hit = new HitEffect(naveEnemiga.x, naveEnemiga.y, 'hit', 2);
                    hit.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hit);
                    
                    // El proyectil hace da├▒o a la nave enemiga
                    const destruida = naveEnemiga.recibirDano(projectile.dano);
                    
                    // Si la nave enemiga fue destruida
                    if (destruida) {
                        // Crear animaci├│n de destrucci├│n de la nave enemiga (color verde)
                        const naveExplosion = new AsteroidExplosion(
                            naveEnemiga.x, naveEnemiga.y,
                            this.texturaAsteroidExplosion,
                            0.5, // Escala para nave enemiga
                            0x00FF00 // Color verde
                        );
                        naveExplosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(naveExplosion);
                        
                        // Sumar puntos por destruir nave enemiga
                        this.puntuacion += 500;
                        
                        // Agregar carga de ULTi
                        this.jugador.agregarCargaUlti(naveEnemiga.cargaUlti);
                        
                        // Incrementar contador
                        this.asteroidesDestruidos++;
                        
                        // Verificar si completamos la oleada
                        if (this.asteroidesDestruidos >= this.objetivoOleada) {
                            this.contadorOleadas++;
                            this.asteroidesDestruidos = 0;
                            this.objetivoOleada = 10 + (this.contadorOleadas * 10);
                            if (this.intervaloSpawn > this.intervaloMinimoSpawn) {
                                this.intervaloSpawn = Math.max(
                                    this.intervaloMinimoSpawn,
                                    this.intervaloSpawn - this.tasaDisminucionSpawn
                                );
                            }
                            // Nave enemiga aparece por temporizador (cada 10s)
                        }
                        
                        // Remover la nave enemiga de la lista
                        this.enemigosNaves.splice(k, 1);
                    }
                    
                    // Destruir el proyectil
                    projectile.destroy(this.poolProyectiles);
                    this.proyectiles.splice(i, 1);
                    
                    // Actualizar la UI
                    this._actualizarUI();
                    
                    break;
                }
            }
        }
    }
    
    /**
     * Procesa las colisiones entre el jugador y los enemigos
     * Se llama en cada frame del juego
     */
    _procesarColisionesJugador() {
        // Si no hay jugador o no est├í activo, salir
        if (!this.jugador || !this.jugador.active) return;
        
        // Recorrer todos los enemigos
        for (let i = this.enemigos.length - 1; i >= 0; i--) {
            const enemy = this.enemigos[i];
            if (!enemy.active) continue;
            
            // Verificar colisi├│n con el jugador
            if (this._verificarColision(this.jugador, enemy)) {
                // Si NO es el asteroide especial, hacer da├▒o
                // El especial es un power-up y no hace da├▒o al chocar
                if (enemy.tamanio !== 'special') {
                    // El jugador recibe da├▒o (reduce los escudos)
                    // Si est├í en sobrecalentamiento, pierde el enfriamiento al recibir da├▒o
                    this.jugador.recibirDano(enemy.dano);
                }
                
                // === ANIMACI├ôN DE DESTRUCCI├ôN DEL ASTEROIDE ===
                let escalaAnim = 0.24; // SMALL
                if (enemy.tamanio === 'medium') {
                    escalaAnim = 0.42;
                } else if (enemy.tamanio === 'large') {
                    escalaAnim = 0.84;
                } else if (enemy.tamanio === 'rezagado1') {
                    escalaAnim = 0.84;
                } else if (enemy.tamanio === 'rezagado2') {
                    escalaAnim = 0.42;
                } else if (enemy.tamanio === 'rezagado3') {
                    escalaAnim = 0.24;
                }
                
                const astroExplosion = new AsteroidExplosion(
                    enemy.x, enemy.y,
                    this.texturaAsteroidExplosion,
                    escalaAnim
                );
                astroExplosion.render(this.aplicacion.stage);
                this.efectosImpacto.push(astroExplosion);
                
                // Destruir el enemigo (siempre se destruye al chocar)
                enemy.destroy();
                this.enemigos.splice(i, 1);
                
                // Actualizar la UI
                this._actualizarUI();
            }
        }
        
        // Verificar colisi├│n con enemigos especiales
        for (let i = this.enemigosSpeciales.length - 1; i >= 0; i--) {
            const especial = this.enemigosSpeciales[i];
            if (!especial || !especial.active) continue;
            
            if (this._verificarColision(this.jugador, especial)) {
                // Si el especial NO est├í en ├│rbita, convertirlo en mini y orbitar
                if (!especial.enOrbita) {
                    // Primero hacer la animaci├│n de destrucci├│n
                    const astroExplosion = new AsteroidExplosion(
                        especial.x, especial.y,
                        this.texturaAsteroidExplosion,
                        0.84,  // Escala LARGE
                        0x0000FF  // Color AZUL
                    );
                    astroExplosion.render(this.aplicacion.stage);
                    this.efectosImpacto.push(astroExplosion);
                    
                    // Contar cu├íntos especiales ya est├ín en ├│rbita para asignar ├¡ndice ├║nico
                    let indiceOrbita = 0;
                    for (const esp of this.enemigosSpeciales) {
                        if (esp !== especial && esp.active && esp.enOrbita) {
                            indiceOrbita++;
                        }
                    }
                    
                    // Asignar ├¡ndice para evitar superposici├│n
                    especial.indiceOrbita = indiceOrbita;
                    
                    // Luego convertir en modo ├│rbita
                    especial.convertirEnOrbita();
                    
                    // No dar power-up ni puntos (solo cuando se destruye con proyectil)
                    // El especial se queda orbitando
                } else {
                    // Si ya est├í en ├│rbita, hacer da├▒o a sus HP (25 - same as medium asteroid)
                    especial.salud -= 25;
                    
                    // Crear animaci├│n de impacto
                    const hit = new HitEffect(especial.x, especial.y, 'hit', 1.5);
                    hit.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hit);
                    
                    // Si se destruy├│ porcollisi├│n con enemigo
                    if (especial.salud <= 0) {
                        // Animaci├│n de destrucci├│n
                        const astroExplosion = new AsteroidExplosion(
                            especial.x, especial.y,
                            this.texturaAsteroidExplosion,
                            0.42,  // Escala MEDIUM
                            0x0000FF  // Color AZUL
                        );
                        astroExplosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(astroExplosion);
                        
                        especial.destroy();
                        this.enemigosSpeciales.splice(i, 1);
                    }
                }
                
                this._actualizarUI();
            }
        }
        
        // Verificar colisi├│n de especiales en ├│rbita con otros enemigos
        for (let i = this.enemigosSpeciales.length - 1; i >= 0; i--) {
            const especial = this.enemigosSpeciales[i];
            if (!especial || !especial.active || !especial.enOrbita) continue;
            
            // Verificar colisi├│n con asteroides normales
            for (let j = this.enemigos.length - 1; j >= 0; j--) {
                const enemy = this.enemigos[j];
                if (!enemy || !enemy.active) continue;
                
                if (this._verificarColision(especial, enemy)) {
                    // El especial en ├│rbita recibe da├▒o seg├║n el tipo de asteroide
                    // Mismo da├▒o que el asteroide le hace al jugador
                    const danoAsteroide = enemy.dano || 25;
                    especial.salud -= danoAsteroide;
                    
                    // Animaci├│n de impacto
                    const hit = new HitEffect(especial.x, especial.y, 'hit', 1.5);
                    hit.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hit);
                    
                    // === ANIMACI├ôN DE DESTRUCCI├ôN DEL ASTEROIDE ===
                    let escalaAnim = 0.24; // SMALL
                    if (enemy.tamanio === 'medium') {
                        escalaAnim = 0.42;
                    } else if (enemy.tamanio === 'large') {
                        escalaAnim = 0.84;
                    } else if (enemy.tamanio === 'rezagado1') {
                        escalaAnim = 0.84;
                    } else if (enemy.tamanio === 'rezagado2') {
                        escalaAnim = 0.42;
                    } else if (enemy.tamanio === 'rezagado3') {
                        escalaAnim = 0.24;
                    }
                    
                    const astroExplosion = new AsteroidExplosion(
                        enemy.x, enemy.y,
                        this.texturaAsteroidExplosion,
                        escalaAnim
                    );
                    astroExplosion.render(this.aplicacion.stage);
                    this.efectosImpacto.push(astroExplosion);
                    
                    // Dar puntos al jugador por destruir el asteroide
                    const puntosAsteroide = enemy.puntos || 10;
                    this.puntuacion += puntosAsteroide;
                    
                    // Agregar carga de ULTi
                    this.jugador.agregarCargaUlti(enemy.cargaUlti || 5);
                    
                    // Destruir el asteroide que choc├│
                    enemy.destroy();
                    this.enemigos.splice(j, 1);
                    
                    // Si el especial se destruy├│
                    if (especial.salud <= 0) {
                        const astroExplosion = new AsteroidExplosion(
                            especial.x, especial.y,
                            this.texturaAsteroidExplosion,
                            0.42,
                            0x0000FF
                        );
                        astroExplosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(astroExplosion);
                        
                        especial.destroy();
                        this.enemigosSpeciales.splice(i, 1);
                        break; // Salir del loop de enemigos
                    }
                }
            }
        }
        
        // Verificar colisi├│n con proyectiles enemigos
        if (this.proyectilesEnemigos) {
            for (let i = this.proyectilesEnemigos.length - 1; i >= 0; i--) {
                const projEnemigo = this.proyectilesEnemigos[i];
                if (!projEnemigo.active) continue;
                
                // Verificar colisi├│n con el jugador
                if (this._verificarColision(this.jugador, projEnemigo)) {
                    // El jugador recibe da├▒o
                    this.jugador.recibirDano(25); // Mismo da├▒o que el jugador
                    
                    // Destruir el proyectil
                    projEnemigo.destroy();
                    this.proyectilesEnemigos.splice(i, 1);
                    
                    this._actualizarUI();
                    continue;
                }
                
                // Verificar colisi├│n con mini asteroides especiales en ├│rbita
                for (let j = this.enemigosSpeciales.length - 1; j >= 0; j--) {
                    const especial = this.enemigosSpeciales[j];
                    if (!especial || !especial.active || !especial.enOrbita) continue;
                    
                    if (this._verificarColision(projEnemigo, especial)) {
                        // El proyectil enemigo hace da├▒o al mini asteroide en ├│rbita (25)
                        especial.salud -= 25;
                        
                        // Animaci├│n de impacto
                        const hit = new HitEffect(especial.x, especial.y, 'hit', 1.5);
                        hit.render(this.aplicacion.stage);
                        this.efectosImpacto.push(hit);
                        
                        // Destruir el proyectil enemigo
                        projEnemigo.destroy();
                        this.proyectilesEnemigos.splice(i, 1);
                        
                        // Si el especial se destruy├│
                        if (especial.salud <= 0) {
                            const astroExplosion = new AsteroidExplosion(
                                especial.x, especial.y,
                                this.texturaAsteroidExplosion,
                                0.42,
                                0x0000FF
                            );
                            astroExplosion.render(this.aplicacion.stage);
                            this.efectosImpacto.push(astroExplosion);
                            
                            especial.destroy();
                            this.enemigosSpeciales.splice(j, 1);
                        }
                        
                        this._actualizarUI();
                        break; // Salir del loop de especiales
                    }
                }
            }
        }
        
        // Verificar colisi├│n con naves enemigas
        for (let i = this.enemigosNaves.length - 1; i >= 0; i--) {
            const naveEnemiga = this.enemigosNaves[i];
            if (!naveEnemiga || !naveEnemiga.active) continue;
            
            if (this._verificarColision(this.jugador, naveEnemiga)) {
                // Crear animaci├│n de explosi├│n (color verde)
                const explosion = new AsteroidExplosion(
                    naveEnemiga.x, naveEnemiga.y,
                    this.texturaAsteroidExplosion,
                    0.5,
                    0x00FF00 // Color verde
                );
                explosion.render(this.aplicacion.stage);
                this.efectosImpacto.push(explosion);
                
                // El jugador recibe da├▒o por chocar con la nave enemiga
                this.jugador.recibirDano(25);
                
                // Agregar carga de ULTi
                this.jugador.agregarCargaUlti(naveEnemiga.cargaUlti);
                
                // Destruir la nave enemiga
                naveEnemiga.destroy();
                this.enemigosNaves.splice(i, 1);
                
                this._actualizarUI();
            }
        }
        
        // Verificar colisi├│n de mini asteroides en ├│rbita con naves enemigas
        for (let i = this.enemigosSpeciales.length - 1; i >= 0; i--) {
            const especial = this.enemigosSpeciales[i];
            if (!especial || !especial.active || !especial.enOrbita) continue;
            
            for (let j = this.enemigosNaves.length - 1; j >= 0; j--) {
                const naveEnemiga = this.enemigosNaves[j];
                if (!naveEnemiga || !naveEnemiga.active) continue;
                
                if (this._verificarColision(especial, naveEnemiga)) {
                    // El mini asteroide hace 25 de da├▒o a la nave enemiga
                    naveEnemiga.salud -= 25;
                    
                    // Animaci├│n de impacto
                    const hit = new HitEffect(naveEnemiga.x, naveEnemiga.y, 'hit', 1.5);
                    hit.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hit);
                    
                    // Si la nave enemiga se destruy├│
                    if (naveEnemiga.salud <= 0) {
                        // Animaci├│n de destrucci├│n (verde)
                        const explosion = new AsteroidExplosion(
                            naveEnemiga.x, naveEnemiga.y,
                            this.texturaAsteroidExplosion,
                            0.5,
                            0x00FF00
                        );
                        explosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(explosion);
                        
                        // Puntos por destruir nave
                        this.puntuacion += 500;
                        
                        // Agregar carga de ULTi
                        this.jugador.agregarCargaUlti(naveEnemiga.cargaUlti);
                        
                        naveEnemiga.destroy();
                        this.enemigosNaves.splice(j, 1);
                    }
                    
                    // El mini asteroide tambi├®n recibe da├▒o (-10)
                    especial.salud -= 10;
                    
                    // Animaci├│n de impacto en el especial
                    const hitEsp = new HitEffect(especial.x, especial.y, 'hit', 1.5);
                    hitEsp.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hitEsp);
                    
                    // Si el especial se destruy├│
                    if (especial.salud <= 0) {
                        const astroExplosion = new AsteroidExplosion(
                            especial.x, especial.y,
                            this.texturaAsteroidExplosion,
                            0.42,
                            0x0000FF
                        );
                        astroExplosion.render(this.aplicacion.stage);
                        this.efectosImpacto.push(astroExplosion);
                        
                        especial.destroy();
                        this.enemigosSpeciales.splice(i, 1);
                        break; // Salir del loop de naves
                    }
                }
            }
        }
        
        // Las colisiones nave-asteroide se verifican en el loop de actualizaci├│n de naves enemigas
        
        // Verificar colisi├│n del jugador con part├¡culas boid (captura directa al tocar)
        for (let i = this.particulasBoid.length - 1; i >= 0; i--) {
            const particula = this.particulasBoid[i];
            if (!particula || !particula.active) continue;
            
            // Verificar colisi├│n directa entre el jugador y la part├¡cula
            if (this.jugador && particula.verificarColision(this.jugador)) {
                // Capturar la part├¡cula
                this._capturarParticulaBoid(particula, i);
            }
        }
    }
    
    /**
     * Finaliza el juego (Game Over)
     * Muestra la pantalla de fin de juego con puntuaci├│n y opci├│n de reiniciar
     */
    async gameOver() {
        // Marcar el juego como no corriendo y en Game Over
        this.ejecutando = false;
        this.enGameOver = true;
        
        // Array para guardar los elementos de UI para poder limpiarlos despu├®s
        this.elementosFinJuego = [];
        
        // Crear fondo oscuro semi-transparente
        const bg = new PIXI.Graphics();
        bg.rect(0, 0, this.anchoJuego, this.altoJuego);
        bg.fill({ color: 0x000000, alpha: 0.8 });
        this.aplicacion.stage.addChild(bg);
        this.elementosFinJuego.push(bg);
        
        // Cargar imagen de Game Over
        const gameOverTexture = await PIXI.Assets.load('assets/gameOver.jpg');
        
        // Crear sprite con la imagen
        const gameOverSprite = new PIXI.Sprite(gameOverTexture);
        
        // Ajustar el tama├▒o de la imagen
        // maxHeight controls how tall the image can be (0.5 = 50% of screen, 1 = full screen)
        const maxWidth = this.anchoJuego * 1;
        const maxHeight = this.altoJuego * 0.5;  // Aumentado de 0.5 a 0.9
        const scale = Math.min(maxWidth / gameOverSprite.width, maxHeight / gameOverSprite.height);
        gameOverSprite.scale.set(scale);
        
        // Centrar la imagen
        gameOverSprite.anchor.set(0.5);
        gameOverSprite.x = this.anchoJuego / 2;
        gameOverSprite.y = this.altoJuego / 2;
        
        // Agregar la imagen al stage (para que quede detr├ís del bot├│n)
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
        titleText.y = this.altoJuego / 2 - (gameOverSprite.height * scale) / 2 + 100;
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
        scoreText.y = this.altoJuego / 2 + 10;
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
        waveText.y = this.altoJuego / 2 + 60;
        this.aplicacion.stage.addChild(waveText);
        this.elementosFinJuego.push(waveText);
        
        // === VERIFICAR SI CALIFICA PARA TOP 5 ===
        // Si ya se us├│ el nombre o no califica, no pedir
        // Solo muestra el input si la puntuaci├│n est├í en el top 5
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
            
            // === IMAGEN DE FONDO (GAME OVER) BAJO EL INPUT ===
            // Mostrar la imagen de fondo detr├ís del formulario de nombre
            const bgImage = document.createElement('img');
            bgImage.src = 'assets/guardarPuuntos.png';  // Imagen de fondo
            bgImage.style.position = 'absolute';
            bgImage.style.top = '28%';                  // Posici├│n vertical (28% desde arriba)
            bgImage.style.left = '50%';                 // Centrar horizontalmente
            bgImage.style.transform = 'translate(-50%, -50%) translateY(200px)';
            bgImage.style.maxWidth = '900px';           // Ancho m├íximo
            bgImage.style.opacity = '1';                // Opacidad completa
            bgImage.style.pointerEvents = 'none';       // Permitir clicks a trav├®s de la imagen
            document.body.appendChild(bgImage);
            
            // === CREAR EL FORMULARIO PARA INGRESAR EL NOMBRE ===
            // Contenedor principal del formulario (div)
            const inputContainer = document.createElement('div');
            inputContainer.style.position = 'absolute';
            inputContainer.style.top = '50%';                                      // 50% desde arriba
            inputContainer.style.left = '50%';                                     // 50% desde izquierda
            inputContainer.style.transform = 'translate(-50%, -50%)';             // Centrar exactamente
            inputContainer.style.display = 'flex';                                // Usar flexbox
            inputContainer.style.flexDirection = 'column';                        // Elementos en columna
            inputContainer.style.alignItems = 'center';                           // Centrar horizontalmente
            inputContainer.style.gap = '10px';                                    // Espacio entre elementos
            
            // Etiqueta (texto) que aparece arriba del campo de texto
            const label = document.createElement('div');
            label.textContent = '┬íNUEVO RECORD! Ingresa tu nombre:';              // Texto a mostrar
            label.style.color = '#0044CC';                                        // Color azul
            label.style.fontSize = '18px';                                        // Tama├▒o de letra
            label.style.fontFamily = 'Segoe Script, cursive';                     // Tipo de letra manuscrita
            label.style.textShadow = '0 0 10px #0044CC';                         // Efecto brillo azul
            
            // Campo de texto (input) donde el usuario escribe su nombre
            const input = document.createElement('input');
            input.type = 'text';                                                  // Campo de texto
            input.maxLength = 8;                                                  // M├íximo 8 caracteres
            input.style.padding = '10px';                                          // Espacio interno
            input.style.fontSize = '20px';                                        // Tama├▒o de letra
            input.style.textAlign = 'center';                                     // Centrar texto
            input.style.border = '3px solid #0044CC';                            // Borde azul
            input.style.background = '#0d0d1a00';                                // Fondo transparente
            input.style.color = '#0044CC';                                        // Texto azul
            input.style.fontFamily = 'Segoe Script, cursive';                     // Tipo de letra
            
            // Bot├│n para guardar el nombre (imagen)
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
            
            // Agregar los elementos al contenedor y al documento
            inputContainer.appendChild(label);       // Agregar etiqueta
            inputContainer.appendChild(input);       // Agregar campo de texto
            inputContainer.appendChild(button);      // Agregar bot├│n
            document.body.appendChild(inputContainer); // Agregar todo al body
            
            // Guardar referencia para limpiar despu├®s (cuando se cierre el input)
            this.bgImageRecord = bgImage;
            this.inputContainerRecord = inputContainer;
            
            // === IMPORTANTE: Desactivar click del stage ===
            // Mientras se ingresa el nombre, los clicks en el juego NO deben reiniciarlo
            // Solo se reiniciar├í cuando el usuario haga click en el bot├│n REINICIAR o presione ENTER
            this.clickHandlerActivo = false;
            
            // Enfocar el campo de texto autom├íticamente
            input.focus();
            
            // === BOT├ôN GUARDAR ===
            // Cuando el usuario hace click en el bot├│n "GUARDAR"
            button.onclick = async () => {
                // Obtener el nombre escrito por el usuario
                const nombre = input.value;
                
                // Intentar guardar en el Top 5 (valida el nombre primero)
                if (await this.top5.agregarEntrada(nombre, this.puntuacion, this.contadorOleadas)) {
                    // Si se guard├│ correctamente
                    this.nombreIngresado = true;                    // Marcar que ya se us├│ el nombre
                    this.esperandoNombreTop5 = false;               // Ya no esperamos nombre
                    inputContainer.remove();                       // Cerrar el formulario
                    if (this.bgImageRecord) {                     // Limpiar imagen de fondo
                        this.bgImageRecord.remove();
                        this.bgImageRecord = null;
                    }
                    this.gestorEntrada.habilitar();                // Reactivar teclado del juego
                    
                    // Crear botones de nuevo en la misma posici├│n
                    if (this.posicionBotonesGameOver) {
                        this._crearBotonesGameOverHTML(
                            this.posicionBotonesGameOver.x,
                            this.posicionBotonesGameOver.y,
                            this.posicionBotonesGameOver.ancho
                        );
                        this.clickHandlerActivo = false;
                    }
                } else {
                    // Si el nombre no es v├ílido (vac├¡o o con caracteres inv├ílidos)
                    alert('Nombre inv├ílido. Solo letras y n├║meros.');
                }
            };
            
            // === PRESIONAR ENTER ===
            // Tambi├®n permitir guardar con la tecla ENTER
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
                        
                        // Crear botones de nuevo en la misma posici├│n
                        if (this.posicionBotonesGameOver) {
                            this._crearBotonesGameOverHTML(
                                this.posicionBotonesGameOver.x,
                                this.posicionBotonesGameOver.y,
                                this.posicionBotonesGameOver.ancho
                            );
                        }
                        this.clickHandlerActivo = false;
                    } else {
                        alert('Nombre inv├ílido. Solo letras y n├║meros.');
                    }
                }
            };
            
// === LIMPIEZA DEL INPUT ===
            // Funci├│n que se llama cuando se limpian los elementos de fin de juego
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
        this._crearBotonesGameOverHTML(gameOverSprite.x, gameOverSprite.y, gameOverSprite.width * scale);
        
        // === FIN GAME OVER ===
        
        // Flag para controlar el click handler
        this.clickHandlerActivo = true;
        this.botonClicked = false;  // Track si se hizo click en un boton
        
        // Esperar la tecla ENTER para reiniciar
        const restartHandler = (e) => {
            if (e.code === 'Enter') {
                window.removeEventListener('keydown', restartHandler);
                this._limpiarFinJuego();
                this._reiniciarJuego();
            }
        };
        window.addEventListener('keydown', restartHandler);
        
        // Tambi├®n permitir click en cualquier parte de la pantalla (solo si no se hizo click en bot├│n)
        const clickHandler = (event) => {
            // Si ya se hizo click en un bot├│n, no hacer nada
            if (this.botonClicked) {
                this.botonClicked = false;
                return;
            }
            
            // Si estamos esperando nombre para el Top 5, NO reiniciar
            if (this.esperandoNombreTop5 || !this.clickHandlerActivo) return;
            
            // Si los botones est├ín ocultos (input de guardar activo), no hacer nada
            const btnReiniciar = document.getElementById('btn-reiniciar');
            const btnTop5 = document.getElementById('btn-top5');
            if ((btnReiniciar && btnReiniciar.style.display === 'none') || 
                (btnTop5 && btnTop5.style.display === 'none')) {
                return;
            }
            
            window.removeEventListener('keydown', restartHandler);
            this.aplicacion.stage.off('pointerdown', clickHandler);
            this._limpiarFinJuego();
            this._reiniciarJuego();
        };
        this.aplicacion.stage.eventMode = 'static';
        this.aplicacion.stage.hitArea = null;  // Asegurar que el stage tiene hitArea
        this.aplicacion.stage.on('pointerdown', clickHandler);
    }
    
    /**
     * Limpia los elementos de la pantalla de Game Over
     * Se llama antes de reiniciar el juego
     */
    _limpiarFinJuego() {
        // Flag para evitar m├║ltiples limpiezas simult├íneas
        if (this.limpiezaEnProgreso) return;
        this.limpiezaEnProgreso = true;
        
        // Remover botones HTML por ID
        const btnReiniciar = document.getElementById('btn-reiniciar');
        const btnTop5 = document.getElementById('btn-top5');
        if (btnReiniciar) btnReiniciar.remove();
        if (btnTop5) btnTop5.remove();
        
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
        
        // Resetear el flag despu├®s de un peque├▒o delay
        setTimeout(() => {
            this.limpiezaEnProgreso = false;
        }, 100);
    }
    
/**
 * Crea botones HTML nativos para Game Over
 * Se posicionan a la derecha de la imagen de Game Over
 */
_crearBotonesGameOverHTML(xCentro, yCentro, ancho) {
    // Guardar posici├│n SIEMPRE (antes del return para que funcione despu├®s de guardar nombre)
    this.posicionBotonesGameOver = { x: xCentro, y: yCentro, ancho: ancho };
    
    // Si estamos esperando nombre para el Top 5 (record), NO crear botones
    // Se crean despu├®s de guardar el nombre
    if (this.esperandoNombreTop5) {
        return;
    }
    
    const canvas = this.aplicacion.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleY = rect.height / this.altoJuego;
    
    // Posicion Y debajo de la imagen de Game Over (un poco mas arriba)
    const btnY = yCentro + (ancho * 0.18);
    
    // Bot├│n Reiniciar - centrado debajo de la imagen
    const btnReiniciar = document.createElement('img');
    btnReiniciar.src = 'assets/reiniciar.png';
    btnReiniciar.id = 'btn-reiniciar';
    btnReiniciar.style.cssText = `
        position: absolute;
        left: ${this.anchoJuego * 0.42}px;
        top: ${btnY * scaleY}px;
        transform: translate(-50%, -50%);
        width: 175px;
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
    
    // Bot├│n Top 5 - a la derecha, debajo de la imagen
    const btnTop5 = document.createElement('img');
    btnTop5.id = 'btn-top5';
    btnTop5.src = 'assets/top5Boton.png';
    btnTop5.style.cssText = `
        position: absolute;
        left: ${this.anchoJuego * 0.58}px;
        top: ${btnY * scaleY}px;
        transform: translate(-50%, -50%);
        width: 120px;
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
    
    // Guardar referencias para limpiar despues
    this.botonesHTML = [btnReiniciar, btnTop5];
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
        
        // Resetear contador visual
        if (this.contadorDevoradorUX) {
            this.contadorDevoradorUX.textContent = '0';
        }
        
        // Restaurar colores del icono Tiempo Fuera
        if (this.marcoTiempoUX && this.fondoTiempoUX) {
            this.marcoTiempoUX.style.border = '5px solid #0044CC !important';
            this.marcoTiempoUX.style.boxShadow = '0 0 10px #0044CC !important';
        }
        
        // Reiniciar flag de nombre
        this.nombreIngresado = false;
        this.esperandoNombreTop5 = false;
        this.enGameOver = false;
        
        // Reiniciar variables de oleadas y dificultad
        this.contadorOleadas = 0;
        this.asteroidesDestruidos = 0;
        this.objetivoOleada = 10;
        this.intervaloSpawn = 1.5;
        
        // Reiniciar temporizadores de naves enemigas
        this.temporizadorNaveEnemiga = 0;
        this.intervaloNaveEnemiga = 10;
        
        // Recrear el fondo
        this._crearFondo();
        
        // Recrear el jugador
        this._crearJugador();
        
        // Actualizar la UI
        this._actualizarUI(0);
        
        // Resetear estados de pausa y ventanas
        this.pausado = false;
        this.mostrandoVentanaMejoras = false;
        this.mostrandoTop5EnPausa = false;
        this.clickHandlerActivo = true;
        this.botonClicked = false;
        
        // Re-agregar el contenedor del HUD (PixiHUD) al stage.
        // Es necesario porque stage.removeChildren() lo eliminó arriba.
        if (hudContainer && this.aplicacion && this.aplicacion.stage) {
            this.aplicacion.stage.addChild(hudContainer);
        }
        
        // Marcar el juego como corriendo
        this.ejecutando = true;
    }
    
    /**
     * Bucle principal del juego (Game Loop)
     * Se ejecuta 60 veces por segundo
     * Actualiza todos los objetos y procesa las colisiones
     * 
     * @param {object} ticker - Objeto de PixiJS que proporciona informaci├│n del frame
     */
    async _gameLoop(ticker) {
        // Si el juego no est├í corriendo, salir
        if (!this.ejecutando) return;

        // Envolver todo el cuerpo del game loop en try-catch para que
        // cualquier error no controlado NO detenga el ticker de PixiJS.
        // Sin esto, un error en cualquier subsistema congelaría la pantalla.
        try {
            // Calcular delta time (tiempo desde el ├║ltimo frame en segundos)
            // ticker.deltaTime viene en frames, convertir a segundos dividiendo por 60
            const delta = ticker.deltaTime / 60;

    // === CONTROL DE PAUSA (Tecla P) ===
            // Si se presiona P, alternar pausa (solo si no est├í en Game Over)
            if (this.gestorEntrada.debePausar() && !this.enGameOver) {
                this.pausado = !this.pausado;
                // Limpiar la tecla para que no se togglee constantemente
                this.gestorEntrada.reiniciar();

                if (this.pausado && !this.mostrandoVentanaMejoras) {
                    crearVentanaMejoras(this);
                } else if (!this.pausado && this.mostrandoVentanaMejoras) {
                    limpiarVentanaMejoras(this);
                }
            }

    // Si el juego est├í pausado, actualizar contador y salir del loop
            if (this.pausado) {
                // Actualizar contador de part├¡culas aunque est├® pausado
                if (this.elementoOleada) {
                    const cantidadPBOids = this.particulasBoid ? this.particulasBoid.length : 0;
                    const faltantes = this.objetivoOleada - this.asteroidesDestruidos;
                    this.elementoOleada.textContent = `Oleada: ${this.contadorOleadas} | Faltan: ${faltantes} | Ast: ${this.intervaloSpawn.toFixed(1)}s | Naves: ${this.intervaloNaveEnemiga.toFixed(1)}s | PBOids: ${cantidadPBOids}`;
                }
                // No mostrar Top 5 con T - solo funciona desde el menu de pausa
                return;
            }

    // Si el juego est├í pausado, salir del loop
            if (this.pausado) {
                // No mostrar Top 5 con T - solo funciona desde el menu principal
                return;
            }

            // === ACTUALIZAR JUGADOR ===
            if (this.jugador && this.jugador.active) {
                this.jugador.update(delta, this.gestorEntrada);
            }

    // === DEVORADOR DE PART├ìCULAS BOID (Tecla E) - usando m├│dulo ===
            const devoradorActivadoAhora = actualizarHabilidadDevorador(this, delta);

            // === HABILIDAD COHETES (Tecla Q) - usando m├│dulo ===
            actualizarHabilidadCohetes(this, delta);

            // === HABILIDAD PROPULSOR (Tecla R) - usando m├│dulo ===
            actualizarHabilidadPropulsor(this, delta);

            // === HABILIDAD TIEMPO FUERA (Pasiva) - usando m├│dulo ===
            actualizarTiempoFuera(this, delta);

    // === ACTUALIZAR PART├ìCULAS BOID - usando m├│dulo ===
            actualizarSistemaBoid(this, delta);

    // === ACTUALIZAR PROYECTILES - usando m├│dulo ===
            actualizarProyectilesJugador(this, delta);
            actualizarProyectilesEnemigos(this, delta);

            // === ACTUALIZAR ENEMIGOS (usando m├│dulo) ===
            actualizarEnemigos(this, delta);

            // === ACTUALIZAR NAVES ENEMIGAS - usando m├│dulo ===
            actualizarNavesEnemigasCompleto(this, delta);

            // Eliminar enemigos que est├ín muy lejos de la pantalla (fuera de vista)
            limpiarEnemigosLejanos(this);

            // === ACTUALIZAR EFECTO ULTI - usando m├│dulo ===
            actualizarUlti(this, delta);

            // === ACTUALIZAR EFECTOS - usando m├│dulo ===
            actualizarEfectosImpacto(this, delta);

            // === PROCESAR COLISIONES - usando m├│dulo ===
            procesarColisionesProyectiles(this);
            procesarColisionesJugador(this);
            procesarColisionesEnemigos(this);

            // === GENERAR NUEVOS ENEMIGOS Y NAVES - usando m├│dulo ===
            actualizarGeneracion(this, delta);

            // === ACTUALIZAR UI ===
            this._actualizarUI();

            // === ACTUALIZAR PIXI HUD (nuevo HUD en PixiJS) ===
            // Se actualiza cada frame para reflejar el estado del juego
            if (this.pixiHUD) {
                this.pixiHUD.actualizar();
            }

            // === ACTUALIZAR FONDO INFINITO ===
            if (this.contenedorFondo && this.mosaicosFondo) {
                // Mover el fondo lentamente para dar efecto de movimiento
                // Usar velocidad basada en delta (60fps base)
                const velocidadFondo = 0.3 * delta;

                // Mover cada mosaico
                for (const mosaico of this.mosaicosFondo) {
                    mosaico.x -= velocidadFondo;

                    // Si el mosaico sale de la pantalla por la izquierda, moverlo a la derecha
                    if (mosaico.x < -this._anchoMosaico) {
                        mosaico.x += this._anchoMosaico * this._columnasMosaico;
                    }
                }
            }
        } catch (error) {
            // Cualquier error no controlado en el game loop se loguea
            // pero NO detiene el ticker de PixiJS.
            console.error('[Game] Error en game loop:', error);
        }
    }
    
    /**
     * Procesa colisiones entre asteroides
     * - Todos los asteroides rebotan al chocar
     - Solo los asteroides GRANDES entre s├¡ se hacen da├▒o y se fragmentan
     */
    _procesarColisionesEnemigos() {
        for (let i = 0; i < this.enemigos.length; i++) {
            const enemy1 = this.enemigos[i];
            if (!enemy1.active) continue;
            
            for (let j = i + 1; j < this.enemigos.length; j++) {
                const enemy2 = this.enemigos[j];
                if (!enemy2.active) continue;
                
                // Verificar si alguno est├í en cooldown de colisi├│n
                if (enemy1.enfriamientoColision > 0 || enemy2.enfriamientoColision > 0) continue;
                
                // Verificar colisi├│n entre los dos asteroides
                if (this._verificarColision(enemy1, enemy2)) {
                    // Crear efecto visual de impacto cuando asteroides chocan (doble tama├▒o, color ROJO)
                    const puntoMedioX = (enemy1.x + enemy2.x) / 2;
                    const puntoMedioY = (enemy1.y + enemy2.y) / 2;
                    const hit = new HitEffect(puntoMedioX, puntoMedioY, 'hit', 2, 0xCC0000);
                    hit.render(this.aplicacion.stage);
                    this.efectosImpacto.push(hit);
                    
                    // ALTERAR DIRECCI├ôN de TODOS los asteroides que chocan
                    enemy1.alterDirection();
                    enemy2.alterDirection();
                    
                    // Aplicar cooldown para evitar colisiones m├║ltiples seguidas
                    enemy1.enfriamientoColision = 0.5;
                    enemy2.enfriamientoColision = 0.5;
                    
                    // === S├ôLO LOS GRANDES RECIBEN DA├æO ===
                    // Si ambos son grandes (o rezagados), se hacen da├▒o mutuo
                    const esGrande1 = enemy1.tamanio === 'large' || enemy1.tamanio === 'large_rezagado';
                    const esGrande2 = enemy2.tamanio === 'large' || enemy2.tamanio === 'large_rezagado';
                    
                    if (esGrande1 && esGrande2) {
                        // Ambos asteroides reciben da├▒o por la colisi├│n
                        // El da├▒o es el mismo que el grande hace al jugador (50)
                        const danoColision = 50;
                        enemy1.salud -= danoColision;
                        enemy2.salud -= danoColision;
                        
                        // Si la salud llega a 0 o menos, el asteroide se destruye y fragmenta
                        if (enemy1.salud <= 0) {
                            this._destruirYFragmentar(enemy1);
                        }
                        
                        if (enemy2.salud <= 0) {
                            this._destruirYFragmentar(enemy2);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Destruye un asteroide y crea fragmentos
     * M├®todo helper para usar en colisiones
     */
    _destruirYFragmentar(enemy) {
        enemy.salud = 0;
        enemy.active = false;
        
        // Destruir sprite
        if (enemy.imagen && enemy.imagen.parent) {
            enemy.imagen.parent.removeChild(enemy.imagen);
        }
        
        // Crear fragmentos
        const fragmentos = enemy._romper();
        for (const frag of fragmentos) {
            frag.render(this.aplicacion.stage);
            this.enemigos.push(frag);
        }
        
        // Efecto de explosi├│n (usar las texturas de animaci├│n de asteroides)
        const astroExplosion = new AsteroidExplosion(enemy.x, enemy.y, this.texturaAsteroidExplosion, 0.5);
        astroExplosion.render(this.aplicacion.stage);
        this.efectosExplosion.push(astroExplosion);
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
     * Se llama cuando se cierra la p├ígina o se termina el juego definitivamente
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
        
        // Destruir la aplicaci├│n PixiJS
        if (this.aplicacion) {
            this.aplicacion.destroy(true);
        }
    }
    
    /**
     * Muestra la pantalla de Top 5
     * Se puede llamar desde pausa (juego en curso) o desde Game Over
     */
    async _mostrarTop5() {
        // Si no est├í en Game Over ni en pausa, el Top 5 deber├¡a mostrarse de forma diferente
        // Verificar si el juego est├í en curso (no pausado, no game over)
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
        
        // Cargar imagen de puntuaci├│n (usando gameOver.jpg como fondo)
        const puntuacionTexture = await PIXI.Assets.load('assets/gameOver.jpg');
        
        // Crear sprite con la imagen
        const puntuacionSprite = new PIXI.Sprite(puntuacionTexture);
        
        // === IMAGEN M├üS GRANDE, FIJA Y CENTRADA ===
        // Usar ~65% del ancho y ~75% del alto (m├ís grande que antes)
        const maxWidth = this.anchoJuego * 0.5;
        const maxHeight = this.altoJuego * 0.5;
        const scale = Math.min(maxWidth / puntuacionSprite.width, maxHeight / puntuacionSprite.height);
        puntuacionSprite.scale.set(scale);
        puntuacionSprite.anchor.set(0.5);
        
        // Centro exacto de la pantalla
        puntuacionSprite.x = this.anchoJuego / 2;
        puntuacionSprite.y = this.altoJuego / 2;
        
        this.aplicacion.stage.addChild(puntuacionSprite);
        this.elementosFinJuego.push(puntuacionSprite);
        
        // Dimensiones reales de la imagen escalada (ya est├í escalada, no multiplicar por scale de nuevo)
        const imagenAncho = puntuacionSprite.width;
        const imagenAlto = puntuacionSprite.height;
        
        // === ENCABEZADO DE LA TABLA (centrado dentro de la imagen) ===
        // T├¡tulo de las columnas: N┬░ | NOMBRE | PUNTOS | OLEADAS
        const headerContainer = new PIXI.Container();
        
        // Crear cada columna del encabezado por separado para mejor alineaci├│n
        // Usando estilo predefinido de encabezado
        const headerNum = new PIXI.Text({ text: 'N┬░', style: this.estilos.encabezado });
        const headerNombre = new PIXI.Text({ text: 'NOMBRE', style: this.estilos.encabezado });
        const headerPuntos = new PIXI.Text({ text: 'PUNTOS', style: this.estilos.encabezado });
        const headerOleada = new PIXI.Text({ text: 'OLEADAS', style: this.estilos.encabezado });
        
        // Posicionar cada columna (separados m├ís entre s├¡)
        headerNum.x = -180;       // N┬░ m├ís a la izquierda
        headerNombre.x = -100;   // NOMBRE 
        headerPuntos.x = 50;     // PUNTOS
        headerOleada.x = 160;    // OLEADAS m├ís a la derecha
        
        headerContainer.addChild(headerNum, headerNombre, headerPuntos, headerOleada);
        
        // Centrar el encabezado dentro de la imagen
        headerContainer.x = this.anchoJuego / 2 - 50;
        // El encabezado va en la parte superior de la zona de contenido de la imagen
        const zonaContenidoInicioY = (this.altoJuego / 2) - (imagenAlto / 2) + 80 - 50;
        headerContainer.y = zonaContenidoInicioY;
        
        this.aplicacion.stage.addChild(headerContainer);
        this.elementosFinJuego.push(headerContainer);
        
        // Obtener lista del top 5
        const lista = await this.top5.obtenerLista();
        
        // === MOSTRAR LOS 5 PRIMEROS (centrado dentro de la imagen) ===
        // Crear cada fila con columnas separadas para mejor alineaci├│n
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
            
// Posicionar cada columna en la fila (mismo spacing que el encabezado)
            textNum.x = -180;      // N┬░ m├ís a la izquierda
            textNombre.x = -100;   // NOMBRE
            textPuntos.x = 50;     // PUNTOS
            textOleada.x = 160;    // OLEADAS m├ís a la derecha
            
            rowContainer.addChild(textNum, textNombre, textPuntos, textOleada);
            rowContainer.x = this.anchoJuego / 2 - 30;
            // Las filas van una debajo de la otra, centradas en la imagen
            // Empiezan debajo del encabezado y dejan espacio para el bot├│n
            const filaInicioY = zonaContenidoInicioY + 45 + 20;
            rowContainer.y = filaInicioY + (i * 38);
            
            this.aplicacion.stage.addChild(rowContainer);
            this.elementosFinJuego.push(rowContainer);
        }
        
        // === BOT├ôN VOLVER (HTML nativo) ===
        // Calcular posicion
        const margenSeparacion = 40;
        const bordeIzq = (this.anchoJuego / 2) - (puntuacionSprite.width / 2) + margenSeparacion;
        const bordeInf = (this.altoJuego / 2) + (puntuacionSprite.height / 2) - margenSeparacion;
        
        const btnVolver = document.createElement('img');
        btnVolver.src = 'assets/volver.png';
        btnVolver.id = 'btn-volver';
        btnVolver.style.position = 'absolute';
        btnVolver.style.left = (bordeIzq + 80) + 'px';
        btnVolver.style.top = (bordeInf - 40) + 'px';
        btnVolver.style.transform = 'translateY(-50%)';
        btnVolver.style.width = '156px';
        btnVolver.style.height = 'auto';
        btnVolver.style.cursor = 'pointer';
        btnVolver.style.zIndex = '1000';
        btnVolver.style.transition = 'all 0.2s ease';
        
        // Efecto hover para VOLVER
        btnVolver.addEventListener('mouseenter', () => {
            btnVolver.style.transform = 'translateY(-50%) scale(1.1)';
            btnVolver.style.filter = 'brightness(1.3) drop-shadow(0 0 10px #0044CC)';
        });
        
        btnVolver.addEventListener('mouseleave', () => {
            btnVolver.style.transform = 'translateY(-50%) scale(1)';
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
                // Si est├íbamos en pausa, volver a pausa (no reanudar)
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
