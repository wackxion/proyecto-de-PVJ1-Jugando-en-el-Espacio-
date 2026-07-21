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
        this.imagen = new PIXI.Sprite(textura);
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
    }
    
    /**
     * Actualizar el comportamiento Boid
     * @param {number} delta - Tiempo transcurrido
     * @param {Array} vecinos - Array de partículas vecinas
     * @param {Object} jugador - Nave del jugador para huir
     * @param {Array} enemigos - Naves enemigas para huir
     * @param {Array} asteroides - Asteroides para rebotar
     * @param {number} anchoJuego - Ancho del juego
     * @param {number} altoJuego - Alto del juego
     */
    actualizar(delta, vecinos, jugador = null, enemigos = [], asteroides = [], anchoJuego = 800, altoJuego = 600) {
        if (!this.active) return;

        // Guardar el tamaño del mundo para los cálculos toroidales (calcularFuga).
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
                const indiceTextura = this.secuenciaAnimacion[this.frameActual];
                this.imagen.texture = this.texturasAnimacion[indiceTextura];
            }
        }
        
        // Si está siendo atraída por el devorador, ignorar todo y solo mover hacia la nave
        if (this.siendoAtraida) {
            // Ya tiene la velocidad configurada en Game.js, solo actualizar posición
            this.x += this.velX * delta;
            this.y += this.velY * delta;
            
            // Actualizar sprite
            if (this.imagen) {
                this.imagen.x = this.x;
                this.imagen.y = this.y;
            }
            
            // Mantener dentro de los límites
            this.mantenerEnPantalla(anchoJuego, altoJuego);
            return;
        }
        
        // Calcular fuerzas Boids
        const fuerzaSeparacion = this.calcularSeparacion(vecinos);
        const fuerzaCohesion = this.calcularCohesion(vecinos);
        const fuerzaAlineacion = this.calcularAlineacion(vecinos);
        
        // Fuerza de huir de la nave (jugador)
        let fuerzaFugaNave = { x: 0, y: 0 };
        if (jugador && jugador.active) {
            fuerzaFugaNave = this.calcularFuga(jugador);
        }
        
        // Fuerza de huir de las naves enemigas
        let fuerzaFugaEnemiga = { x: 0, y: 0 };
        for (const enemigo of enemigos) {
            if (enemigo && enemigo.active) {
                const fuga = this.calcularFuga(enemigo, 80);
                fuerzaFugaEnemiga.x += fuga.x;
                fuerzaFugaEnemiga.y += fuga.y;
            }
        }
        
        // Aplicar fuerzas a la velocidad
        this.velX += fuerzaSeparacion.x * this.fuerzaSeparacion;
        this.velY += fuerzaSeparacion.y * this.fuerzaSeparacion;
        
        this.velX += fuerzaCohesion.x * this.fuerzaCohesion;
        this.velY += fuerzaCohesion.y * this.fuerzaCohesion;
        
        this.velX += fuerzaAlineacion.x * this.fuerzaAlineacion;
        this.velY += fuerzaAlineacion.y * this.fuerzaAlineacion;
        
        // Aplicar fuerza de fuga
        this.velX += fuerzaFugaNave.x * this.fuerzaFuga;
        this.velY += fuerzaFugaNave.y * this.fuerzaFuga;
        
        this.velX += fuerzaFugaEnemiga.x * this.fuerzaFuga;
        this.velY += fuerzaFugaEnemiga.y * this.fuerzaFuga;
        
        // Limitar velocidad máxima
        const velocidad = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
        if (velocidad > this.velocidadMax) {
            this.velX = (this.velX / velocidad) * this.velocidadMax;
            this.velY = (this.velY / velocidad) * this.velocidadMax;
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
        this.verificarColisionParticulas(vecinos);
        
        // Actualizar sprite
        if (this.imagen) {
            this.imagen.x = this.x;
            this.imagen.y = this.y;
            
            // Sin brillo - mantener color original
            // this.imagen.tint = 0xFFFFFF; // Por defecto ya es blanco
        }
        
        // Mantener dentro de los límites del juego (dinámico)
        this.mantenerEnPantalla(anchoJuego, altoJuego);
    }
    
    /**
     * Calcular fuerza de separación (evitar colisiones)
     * @param {Array} vecinos - Partículas vecinas
     * @returns {Object} Vector de fuerza
     */
    calcularSeparacion(vecinos) {
        let fuerzaX = 0;
        let fuerzaY = 0;
        let conteo = 0;
        
        for (const otro of vecinos) {
            if (otro === this || !otro.active) continue;
            
            const distancia = this.calcularDistancia(otro);
            
            if (distancia > 0 && distancia < this.rangoVision * 0.5) {
                const diffX = this.x - otro.x;
                const diffY = this.y - otro.y;
                
                fuerzaX += diffX / (distancia * distancia);
                fuerzaY += diffY / (distancia * distancia);
                
                conteo++;
            }
        }
        
        if (conteo > 0) {
            fuerzaX /= conteo;
            fuerzaY /= conteo;
        }
        
        return { x: fuerzaX, y: fuerzaY };
    }
    
    /**
     * Calcular fuerza de cohesión (ir hacia el centro del grupo)
     * @param {Array} vecinos - Partículas vecinas
     * @returns {Object} Vector de fuerza
     */
    calcularCohesion(vecinos) {
        let centroX = 0;
        let centroY = 0;
        let conteo = 0;
        
        for (const otro of vecinos) {
            if (otro === this || !otro.active) continue;
            
            const distancia = this.calcularDistancia(otro);
            
            if (distancia > 0 && distancia < this.rangoVision) {
                centroX += otro.x;
                centroY += otro.y;
                conteo++;
            }
        }
        
        if (conteo > 0) {
            centroX /= conteo;
            centroY /= conteo;
            
            return { x: centroX - this.x, y: centroY - this.y };
        }
        
        return { x: 0, y: 0 };
    }
    
    /**
     * Calcular fuerza de alineación (sincronizar dirección)
     * @param {Array} vecinos - Partículas vecinas
     * @returns {Object} Vector de fuerza
     */
    calcularAlineacion(vecinos) {
        let promedioVelX = 0;
        let promedioVelY = 0;
        let conteo = 0;
        
        for (const otro of vecinos) {
            if (otro === this || !otro.active) continue;
            
            const distancia = this.calcularDistancia(otro);
            
            if (distancia > 0 && distancia < this.rangoVision) {
                promedioVelX += otro.velX;
                promedioVelY += otro.velY;
                conteo++;
            }
        }
        
        if (conteo > 0) {
            promedioVelX /= conteo;
            promedioVelY /= conteo;
            
            return { x: promedioVelX - this.velX, y: promedioVelY - this.velY };
        }
        
        return { x: 0, y: 0 };
    }
    
    /**
     * Calcular fuerza de fuga (huir de un objeto)
     * @param {Object} objetivo - Objetivo del que huir
     * @param {number} rango - Rango de detección
     * @returns {Object} Vector de fuerza
     */
    calcularFuga(objetivo, rango = null) {
        const rangoFuga = rango || this.rangoFuga;

        // Delta al objetivo por el camino corto del toroide (así huye para el lado
        // correcto aunque el objetivo esté del otro lado de la costura).
        let dx = this.x - objetivo.x;
        let dy = this.y - objetivo.y;
        if (CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL && this._wMundo) {
            const h1 = this._wMundo / 2, h2 = this._hMundo / 2;
            if (dx > h1) dx -= this._wMundo; else if (dx < -h1) dx += this._wMundo;
            if (dy > h2) dy -= this._hMundo; else if (dy < -h2) dy += this._hMundo;
        }
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia > 0 && distancia < rangoFuga) {
            const intensidad = (rangoFuga - distancia) / rangoFuga;
            return {
                x: (dx / distancia) * intensidad * 2,
                y: (dy / distancia) * intensidad * 2
            };
        }
        
        return { x: 0, y: 0 };
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
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            const radioAst = ast.radio || 32;
            
            if (distancia < this.radio + radioAst) {
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
     * @param {Array} particulas - Lista de partículas
     */
    verificarColisionParticulas(particulas) {
        for (const otra of particulas) {
            if (otra === this || !otra.active) continue;
            
            const dx = this.x - otra.x;
            const dy = this.y - otra.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            // Verificar si se superponen (suma de radios)
            if (distancia > 0 && distancia < this.radio + otra.radio) {
                // Calcular separación necesaria
                const overlap = (this.radio + otra.radio) - distancia;
                const normalX = dx / distancia;
                const normalY = dy / distancia;
                
                // Separar cada una a la mitad de la superposición
                const separacionX = normalX * overlap * 0.5;
                const separacionY = normalY * overlap * 0.5;
                
                this.x += separacionX;
                this.y += separacionY;
                
                // NO modificar la otra para evitar doble cálculo
            }
        }
    }
    
    /**
     * Calcular distancia a otra partícula
     * @param {BoidParticle} otro - Otra partícula
     * @returns {number} Distancia
     */
    calcularDistancia(otro) {
        const dx = this.x - otro.x;
        const dy = this.y - otro.y;
        return Math.sqrt(dx * dx + dy * dy);
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
        const distancia = Math.sqrt(dx * dx + dy * dy);

        const radioCaptura = nave.radio + 15;
        
        return distancia < radioCaptura;
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