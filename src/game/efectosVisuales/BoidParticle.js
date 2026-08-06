/**
 * BoidParticle - Partícula con comportamiento Boid
 * 
 * Partículas de 10x10px que siguen el algoritmo de Boids:
 * - Cohesión: moverse hacia el centro de masa de los vecinos
 * - Alineación: sincronizar dirección con vecinos
 * - Separación: evitar colisiones con vecinos
 * - Fuga: huir de la nave del jugador y las verdes enemigas
 * - Rebote: rebotar al colisionar con asteroides
 */
import { CONFIG } from '../../config.js';
import { GameObject } from '../entidades/GameObject.js';

export class BoidParticle extends GameObject {
    /**
     * Constructor de BoidParticle
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {PIXI.Texture} textura - Textura de la partícula (10x10px)
     * @param {Array} texturasAnimacion - Array de texturas para animación Pboids
     */
    constructor(x, y, textura, texturasAnimacion = []) {
        super(x, y);
        
        // Texturas de animación
        this.texturasAnimacion = texturasAnimacion;
        this.timerAnimacion = 0;
        this.intervaloAnimacion = 0.12;
        this.frameActual = 0;
        this.secuenciaAnimacion = this._crearSecuenciaAnimacion(texturasAnimacion.length);
        
        // Tamaño de la partícula (10px x 10px)
        this.width = 10;
        this.height = 10;

        // Radio de colisión (5px = la mitad del tamaño)
        this.radio = 5;

        // Velocidad de la partícula
        this.velX = (Math.random() - 0.5) * CONFIG.BOIDS.VELOCIDAD_INICIAL_MAX;
        this.velY = (Math.random() - 0.5) * CONFIG.BOIDS.VELOCIDAD_INICIAL_MAX;

        // Velocidad máxima
        this.velocidadMax = CONFIG.BOIDS.VELOCIDAD_MAX;

        // Crear sprite
        this.imagen = new PIXI.Sprite(textura || this.texturasAnimacion[0] || PIXI.Texture.WHITE);
        this.imagen.width = this.width;
        this.imagen.height = this.height;
        this.imagen.anchor.set(0.5);
        this.imagen.x = x;
        this.imagen.y = y;

        // Color de la partícula (blanco)
        this.imagen.tint = 0xFFFFFF;

        // Flag para saber si está siendo atraída por el devorador
        this.siendoAtraida = false;
        
        // Parámetros de Boids - FUERZAS
        this.fuerzaSeparacion = CONFIG.BOIDS.FUERZA_SEPARACION;
        this.fuerzaCohesion = CONFIG.BOIDS.FUERZA_COHESION;
        this.fuerzaAlineacion = CONFIG.BOIDS.FUERZA_ALINEACION;
        this.fuerzaFuga = CONFIG.BOIDS.FUERZA_FUGA;
        this.rangoVision = CONFIG.BOIDS.RANGO_VISION;
        this.rangoFuga = CONFIG.BOIDS.RANGO_FUGA;

        // Resultados reutilizables: evitan crear vectores temporales en cada frame.
        this._separacionX = 0;
        this._separacionY = 0;
        this._cohesionX = 0;
        this._cohesionY = 0;
        this._alineacionX = 0;
        this._alineacionY = 0;
        this._fugaX = 0;
        this._fugaY = 0;
    }
    
    /**
     * Actualizar el comportamiento Boid
     * @param {number} delta - Tiempo transcurrido
     * @param {Object} contextoVecinos - Celdas cercanas y cantidad de celdas ocupadas
     * @param {Object} jugador - Nave del jugador para huir
     * @param {Array} enemigos - Naves enemigas para huir
     * @param {Array} asteroides - Asteroides para rebotar
     * @param {number} anchoJuego - Ancho del juego
     * @param {number} altoJuego - Alto del juego
     */
    actualizar(delta, contextoVecinos, jugador = null, enemigos = [], asteroides = [], anchoJuego = 800, altoJuego = 600) {
        if (!this.active) return;

        // Guardar el tamaño del mundo para los cálculos toroidales de fuga.
        this._wMundo = anchoJuego; this._hMundo = altoJuego;
        
        // Animación: 1,2,3,4,3,2,1 en bucle
        if (this.texturasAnimacion && this.texturasAnimacion.length > 0) {
            this.timerAnimacion += delta;
            if (this.timerAnimacion >= this.intervaloAnimacion) {
                this.timerAnimacion = 0;
                
                // Avanzar en la secuencia
                this.frameActual++;
                if (this.frameActual >= this.secuenciaAnimacion.length) {
                    this.frameActual = 0;
                }
                
                // Obtener el índice de la textura
                const indiceTextura = this.secuenciaAnimacion[this.frameActual] || 0;
                this.imagen.texture = this.texturasAnimacion[indiceTextura];
            }
        }
        
        // Si está siendo atraída por el devorador, ignorar todo y solo mover hacia la nave
        if (this.siendoAtraida) {
            // Ya tiene la velocidad configurada en Game.js, solo actualizar posición
            this.x += this.velX * delta;
            this.y += this.velY * delta;
            
            this._actualizarVisualMovimiento();
            
            // Mantener dentro de los límites
            this.mantenerEnPantalla(anchoJuego, altoJuego);
            return;
        }
        
        // Calcular separación, cohesión y alineación recorriendo los vecinos una sola vez.
        this._calcularFuerzasBoid(contextoVecinos);
        
        // Fuerza de huir de la nave (jugador)
        let fugaNaveX = 0;
        let fugaNaveY = 0;
        if (jugador && jugador.active) {
            this._calcularFuga(jugador);
            fugaNaveX = this._fugaX;
            fugaNaveY = this._fugaY;
        }
        
        // Fuerza de huir de las naves enemigas
        let fugaEnemigaX = 0;
        let fugaEnemigaY = 0;
        for (let i = 0; i < enemigos.length; i++) {
            const enemigo = enemigos[i];
            if (enemigo && enemigo.active) {
                this._calcularFuga(enemigo, 80);
                fugaEnemigaX += this._fugaX;
                fugaEnemigaY += this._fugaY;
            }
        }
        
        // Aplicar fuerzas a la velocidad
        this.velX += this._separacionX * this.fuerzaSeparacion;
        this.velY += this._separacionY * this.fuerzaSeparacion;
        this.velX += this._cohesionX * this.fuerzaCohesion;
        this.velY += this._cohesionY * this.fuerzaCohesion;
        this.velX += this._alineacionX * this.fuerzaAlineacion;
        this.velY += this._alineacionY * this.fuerzaAlineacion;
        
        // Aplicar fuerza de fuga
        this.velX += fugaNaveX * this.fuerzaFuga;
        this.velY += fugaNaveY * this.fuerzaFuga;
        this.velX += fugaEnemigaX * this.fuerzaFuga;
        this.velY += fugaEnemigaY * this.fuerzaFuga;
        
        // Limitar velocidad máxima
        const velocidadCuadrada = this.velX * this.velX + this.velY * this.velY;
        if (velocidadCuadrada > this.velocidadMax * this.velocidadMax) {
            const escalaVelocidad = this.velocidadMax / Math.sqrt(velocidadCuadrada);
            this.velX *= escalaVelocidad;
            this.velY *= escalaVelocidad;
        }
        
        // Guardar posición anterior para detectar colisiones
        const prevX = this.x;
        const prevY = this.y;
        
        // Actualizar posición
        this.x += this.velX * delta;
        this.y += this.velY * delta;
        
        // Verificar colisiones con asteroides y rebotar
        this.verificarReboteAsteroides(asteroides, prevX, prevY);
        
        // Verificar colisiones con otras partículas Boid
        this._verificarColisionParticulas(contextoVecinos);
        
        this._actualizarVisualMovimiento();
        
        // Mantener dentro de los límites del juego (dinámico)
        this.mantenerEnPantalla(anchoJuego, altoJuego);
    }

    _crearSecuenciaAnimacion(cantidadFrames) {
        if (cantidadFrames <= 1) return [0];

        const ida = Array.from({ length: cantidadFrames }, (_, i) => i);
        const vuelta = Array.from({ length: Math.max(cantidadFrames - 2, 0) }, (_, i) => cantidadFrames - 2 - i);
        return ida.concat(vuelta);
    }

    _actualizarVisualMovimiento() {
        if (!this.imagen) return;

        this.imagen.x = this.x;
        this.imagen.y = this.y;

        const velocidadCuadrada = this.velX * this.velX + this.velY * this.velY;
        if (velocidadCuadrada > 1) {
            this.imagen.rotation = Math.atan2(this.velY, this.velX);
        }

        // Sin brillo - mantener color original.
        // this.imagen.tint = 0xFFFFFF; // Por defecto ya es blanco.
    }
    
    /**
     * Calcula separación, cohesión y alineación en una sola pasada.
     * Las celdas ya limitan los candidatos; aquí se aplica el rango exacto.
     * @param {Object} contextoVecinos - Celdas cercanas reutilizadas por el sistema
     */
    _calcularFuerzasBoid(contextoVecinos) {
        let separacionX = 0;
        let separacionY = 0;
        let centroX = 0;
        let centroY = 0;
        let promedioVelX = 0;
        let promedioVelY = 0;
        let cantidadSeparacion = 0;
        let cantidadGrupo = 0;

        const rangoVisionCuadrado = this.rangoVision * this.rangoVision;
        const rangoSeparacionCuadrado = rangoVisionCuadrado * 0.25;
        const celdas = contextoVecinos ? contextoVecinos.celdas : null;
        const cantidadCeldas = contextoVecinos ? contextoVecinos.cantidad : 0;

        for (let i = 0; i < cantidadCeldas; i++) {
            const celda = celdas[i];
            for (let j = 0; j < celda.length; j++) {
                const otro = celda[j];
                if (otro === this || !otro.active) continue;

                const dx = this.x - otro.x;
                const dy = this.y - otro.y;
                const distanciaCuadrada = dx * dx + dy * dy;
                if (distanciaCuadrada <= 0 || distanciaCuadrada >= rangoVisionCuadrado) continue;

                centroX += otro.x;
                centroY += otro.y;
                promedioVelX += otro.velX;
                promedioVelY += otro.velY;
                cantidadGrupo++;

                if (distanciaCuadrada < rangoSeparacionCuadrado) {
                    separacionX += dx / distanciaCuadrada;
                    separacionY += dy / distanciaCuadrada;
                    cantidadSeparacion++;
                }
            }
        }

        this._separacionX = cantidadSeparacion > 0 ? separacionX / cantidadSeparacion : 0;
        this._separacionY = cantidadSeparacion > 0 ? separacionY / cantidadSeparacion : 0;
        this._cohesionX = cantidadGrupo > 0 ? centroX / cantidadGrupo - this.x : 0;
        this._cohesionY = cantidadGrupo > 0 ? centroY / cantidadGrupo - this.y : 0;
        this._alineacionX = cantidadGrupo > 0 ? promedioVelX / cantidadGrupo - this.velX : 0;
        this._alineacionY = cantidadGrupo > 0 ? promedioVelY / cantidadGrupo - this.velY : 0;
    }
    
    /**
     * Calcular fuerza de fuga (huir de un objeto)
     * @param {Object} objetivo - Objetivo del que huir
     * @param {number} rango - Rango de detección
     */
    _calcularFuga(objetivo, rango = null) {
        const rangoFuga = rango || this.rangoFuga;

        this._fugaX = 0;
        this._fugaY = 0;

        // Delta al objetivo por el camino corto del toroide (así huye para el lado
        // correcto aunque el objetivo esté del otro lado de la costura).
        let dx = this.x - objetivo.x;
        let dy = this.y - objetivo.y;
        if (CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL && this._wMundo) {
            const h1 = this._wMundo / 2, h2 = this._hMundo / 2;
            if (dx > h1) dx -= this._wMundo; else if (dx < -h1) dx += this._wMundo;
            if (dy > h2) dy -= this._hMundo; else if (dy < -h2) dy += this._hMundo;
        }
        const distanciaCuadrada = dx * dx + dy * dy;
        
        if (distanciaCuadrada > 0 && distanciaCuadrada < rangoFuga * rangoFuga) {
            const distancia = Math.sqrt(distanciaCuadrada);
            const intensidad = (rangoFuga - distancia) / rangoFuga;
            this._fugaX = (dx / distancia) * intensidad * 2;
            this._fugaY = (dy / distancia) * intensidad * 2;
        }
    }
    
    /**
     * Verificar colisión con asteroides y rebotar
     * @param {Array} asteroides - Lista de asteroides
     * @param {number} prevX - Posición X anterior
     * @param {number} prevY - Posición Y anterior
     */
    verificarReboteAsteroides(asteroides, prevX, prevY) {
        for (const ast of asteroides) {
            if (!ast || !ast.active) continue;
            
            const dx = this.x - ast.x;
            const dy = this.y - ast.y;
            const radioAst = ast.radio || 32;
            const radioColision = this.radio + radioAst;
            const distanciaCuadrada = dx * dx + dy * dy;
            
            if (distanciaCuadrada > 0 && distanciaCuadrada < radioColision * radioColision) {
                const distancia = Math.sqrt(distanciaCuadrada);
                const normalX = dx / distancia;
                const normalY = dy / distancia;
                
                const productoPunto = this.velX * normalX + this.velY * normalY;
                
                this.velX = this.velX - 2 * productoPunto * normalX;
                this.velY = this.velY - 2 * productoPunto * normalY;
                
                this.velX *= 1.2;
                this.velY *= 1.2;
                
                const nuevoDistancia = this.radio + radioAst + 2;
                this.x = ast.x + normalX * nuevoDistancia;
                this.y = ast.y + normalY * nuevoDistancia;
                
                break;
            }
        }
    }
    
    /**
     * Verificar colisión con otras partículas Boid y separarlas si se superponen
     * @param {Object} contextoVecinos - Celdas cercanas reutilizadas por el sistema
     */
    _verificarColisionParticulas(contextoVecinos) {
        const celdas = contextoVecinos ? contextoVecinos.celdas : null;
        const cantidadCeldas = contextoVecinos ? contextoVecinos.cantidad : 0;

        for (let i = 0; i < cantidadCeldas; i++) {
            const celda = celdas[i];
            for (let j = 0; j < celda.length; j++) {
                const otra = celda[j];
                if (otra === this || !otra.active) continue;

                const dx = this.x - otra.x;
                const dy = this.y - otra.y;
                const distanciaCuadrada = dx * dx + dy * dy;
                const radioColision = this.radio + otra.radio;

                if (distanciaCuadrada > 0 && distanciaCuadrada < radioColision * radioColision) {
                    const distancia = Math.sqrt(distanciaCuadrada);
                    const overlap = radioColision - distancia;
                    const escalaSeparacion = overlap * 0.5 / distancia;

                    // Solo se mueve este boid para que el vecino no se procese dos veces aquí.
                    this.x += dx * escalaSeparacion;
                    this.y += dy * escalaSeparacion;
                }
            }
        }
    }
    
    /**
     * Mantener la partícula dentro de los límites de la pantalla (dinámico)
     * @param {number} anchoJuego - Ancho del juego
     * @param {number} altoJuego - Alto del juego
     */
    mantenerEnPantalla(anchoJuego, altoJuego) {
        // Las partículas pueden salir de la pantalla freely
        // No hay límite - pueden entrar y salir
    }
    
    /**
     * Verificar si la nave puede capturar esta partícula
     * @param {Object} nave - El jugador (nave)
     * @returns {boolean} true si la nave captura la partícula
     */
    puedeSerCapturada(nave) {
        if (!nave || !nave.x || !nave.y) return false;

        // Distancia toroidal (la nave "toca" partículas que se ven pegadas aunque
        // estén del otro lado de la costura).
        let dx = this.x - nave.x;
        let dy = this.y - nave.y;
        if (CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL && nave.anchoJuego) {
            const h1 = nave.anchoJuego / 2, h2 = nave.altoJuego / 2;
            if (dx > h1) dx -= nave.anchoJuego; else if (dx < -h1) dx += nave.anchoJuego;
            if (dy > h2) dy -= nave.altoJuego; else if (dy < -h2) dy += nave.altoJuego;
        }
        const radioCaptura = nave.radio + 15;
        
        return dx * dx + dy * dy < radioCaptura * radioCaptura;
    }
    
    /**
     * Actualizar posición del sprite (compatibilidad)
     */
    update(delta) {
        // La actualización principal se hace desde Game.js
    }
    
    /**
     * Destruye la partícula y la devuelve al pool si existe
     * @param {Object} pool - Pool de objetos (opcional)
     */
    destroyAndRelease(pool = null) {
        this.active = false;
        if (this.imagen && this.imagen.parent) {
            this.imagen.parent.removeChild(this.imagen);
        }
        if (pool) {
            pool.release(this);
        }
    }
}
