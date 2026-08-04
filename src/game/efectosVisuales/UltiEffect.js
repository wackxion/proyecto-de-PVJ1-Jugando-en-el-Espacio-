/**
 * UltiEffect - Efecto de ataque especial (Ulti)
 * 
 * Esta clase crea el efecto visual del ataque especial (ulti).
 * Es un aro azul que se expande desde la nave hacia los bordes de la pantalla.
 * 
 * Cómo funciona:
 * 1. aparece como un punto en el centro de la nave
 * 2. Se expande rápidamente hacia afuera (800 px/s)
 * 3. Destruye cualquier asteroide que toque
 * 4. Se desvanece a medida que crece
 * 5. Desaparece cuando llega a los bordes de la pantalla
 */
import { GameObject } from '../entidades/GameObject.js';
import { AsteroidExplosion } from './AsteroidExplosion.js';
import { ProyectilExplosion } from './ProyectilExplosion.js';
import { CONFIG } from '../../config.js';

export class UltiEffect extends GameObject {
    /**
     * Constructor del efecto ulti
     * 
     * @param {number} x - Posición X inicial (donde está la nave)
     * @param {number} y - Posición Y inicial (donde está la nave)
     * @param {number} gameWidth - Ancho del área de juego
     * @param {number} gameHeight - Alto del área de juego
     * @param {Array} enemies - Array con todos los enemigos (asteroides)
     * @param {Function} onDestroyEnemy - Función a llamar cuando se destruye un enemigo
     * @param {Array} enemyShips - Array con las naves enemigas (opcional)
     * @param {Function} onDestroyShip - Función a llamar cuando se destruye una nave (opcional)
     * @param {Object} gameRef - Referencia al juego para crear animaciones (opcional)
     */
    constructor(x, y, gameWidth, gameHeight, enemies, onDestroyEnemy = null, enemyShips = null, onDestroyShip = null, gameRef = null) {
        super(x, y);
        
        // Dimensiones del área de juego
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Referencia a los enemigos (asteroides)
        this.enemigos = enemies;
        
        // Referencia a las naves enemigas
        this.enemyShips = enemyShips;
        
        // Callback = función que se llama cuando se destruye un enemigo
        this.onDestroyEnemy = onDestroyEnemy;
        
        // Callback = función que se llama cuando se destruye una nave
        this.onDestroyShip = onDestroyShip;
        
        // Referencia al juego para crear animaciones
        this.gameRef = gameRef;
        
        // El efecto está activo
        this.active = true;
        
        // Radius (radio): радиус actual del aro (comienza en 0)
        this.radius = 0;
        
        // MaxRadius: El radio máximo que puede alcanzar (fracción de la diagonal).
        // El aro se dibuja en `game.mundo`, que está escalado por el ZOOM de cámara.
        // Se divide por el zoom para que la ULTI cubra la MISMA proporción de la vista
        // visible que antes del zoom (si no, con zoom 0.70 se veía y afectaba más chica).
        const zoom = (CONFIG.CAMARA && CONFIG.CAMARA.ZOOM) ? CONFIG.CAMARA.ZOOM : 1;
        this.maxRadius = Math.sqrt(gameWidth * gameWidth + gameHeight * gameHeight) * 0.18 / zoom;
        
        // ExpansionSpeed: Qué tan rápido se expande el aro (800 píxeles por segundo)
        this.expansionSpeed = 800;
        
        // Thickness (grosor): Cuánto thick es el aro (15 píxeles)
        this.thickness = 15;
        
        // Color: Azul Birome (#0044CC)
        this.color = 0x0044CC;
        
        // Crear graphics para dibujar el aro
        this.graphics = new PIXI.Graphics();
        
        // Dibujar el aro inicial
        this._dibujarAnillo();
        
        this.sprite = this.graphics;
        this.sprite.x = x;
        this.sprite.y = y;
    }
    
    /**
     * Crea la animación de destrucción según el tipo de enemigo
     */
    _crearAnimacionDestruccion(enemy) {
        if (!this.gameRef) return;
        
        const game = this.gameRef;
        const x = enemy.x;
        const y = enemy.y;
        
        // Determinar el tipo de animación según el enemigo
        if (enemy.tamanio === 'special') {
            // Special Enemy: animación de asteroide AZUL
            const explosion = new AsteroidExplosion(
                x, y,
                game.texturaAsteroidExplosion,
                0.84,
                0x0000FF
            );
            explosion.render(game.mundo);
            game.efectosImpacto.push(explosion);
        } else if (enemy.tamanio === 'large' || enemy.tamanio === 'large_rezagado') {
            // Asteroides grandes: animación de asteroide (rojo)
            const explosion = new AsteroidExplosion(
                x, y,
                game.texturaExplosionAsteroide,
                0.84
            );
            explosion.render(game.mundo);
            game.efectosImpacto.push(explosion);
        } else if (enemy.tamanio === 'medium' || enemy.tamanio === 'medium_rezagado') {
            // Asteroides medianos (rojo)
            const explosion = new AsteroidExplosion(
                x, y,
                game.texturaExplosionAsteroide,
                0.42
            );
            explosion.render(game.mundo);
            game.efectosImpacto.push(explosion);
        } else if (enemy.tamanio === 'small' || enemy.tamanio === 'small_rezagado') {
            // Asteroides pequeños (rojo)
            const explosion = new AsteroidExplosion(
                x, y,
                game.texturaExplosionAsteroide,
                0.24
            );
            explosion.render(game.mundo);
            game.efectosImpacto.push(explosion);
        } else {
            // Por defecto (cualquier tipo no reconocido), usar animación mediana (rojo)
            const explosion = new AsteroidExplosion(
                x, y,
                game.texturaExplosionAsteroide,
                0.42
            );
            explosion.render(game.mundo);
            game.efectosImpacto.push(explosion);
        }
    }
    
    /**
     * Crea la animación de destrucción para naves enemigas
     */
    _crearAnimacionNave(ship) {
        if (!this.gameRef) return;
        
        const game = this.gameRef;
        
        // Naves enemigas: animación de explosión VERDE
        const explosion = new AsteroidExplosion(
            ship.x, ship.y,
            game.texturaExplosionNave,
            0.5
        );
        explosion.render(game.mundo);
        game.efectosImpacto.push(explosion);
    }
    
    /**
     * Dibuja el aro en el graphics
     * Se llama en cada frame para actualizar el tamaño
     */
    _dibujarAnillo() {
        // Limpiar el graphics anterior
        this.graphics.clear();
        
        // Dibujar un círculo en el centro
        this.graphics.circle(0, 0, this.radius);
        
        // Aplicar el trazo (stroke) con el grosor y color
        this.graphics.stroke({ 
            width: this.thickness, 
            color: this.color, 
            alpha: this.getAlpha() 
        });
    }
    
    /**
     * Calcula la transparencia (alpha) del aro
     * El aro se vuelve más transparente a medida que crece
     * 
     * @returns {number} - Valor de alpha entre 0 y 1
     */
    getAlpha() {
        // progress = qué tan grande es el aro vs el máximo
        // 0 = acaba de empezar, 1 = llegó al borde
        const progress = this.radius / this.maxRadius;
        
        // Invertir: 1 al principio, 0 al final
        return Math.max(0, 1 - progress);
    }
    
    /**
     * Update: Se llama cada frame
     * Expande el aro y verifica colisiones con asteroides
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     */
    update(delta) {
        if (!this.active) return;
        
        // Expandir el radio
        // radius += velocidad * tiempo
        this.radius += this.expansionSpeed * delta;
        
        // Redibujar el aro con el nuevo tamaño
        this._dibujarAnillo();
        
        // Verificar si el aro toca algún asteroide
        this._verificarColisiones();
        
        // Si el radio llegó al máximo, destruir el efecto
        if (this.radius >= this.maxRadius) {
            this.destroy();
        }
    }
    
    /**
     * Verifica colisiones con los enemigos
     * Destruye cualquier asteroide que el aro toque
     */
    _verificarColisiones() {
        // Recorrer todos los enemigos
        for (let i = this.enemigos.length - 1; i >= 0; i--) {
            const enemy = this.enemigos[i];
            
            // Si el enemigo no está activo, skip
            if (!enemy.active) continue;
            
            // Calcular distancia del enemigo al centro del aro
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Calcular el rango del aro (entre el radio interno y externo)
            const innerRadius = this.radius - this.thickness;
            const outerRadius = this.radius + this.thickness;
            
            // Si el enemigo está dentro del aro, destruirlo
            if (dist >= innerRadius && dist <= outerRadius) {
                // Crear animación de destrucción
                this._crearAnimacionDestruccion(enemy);
                
                // Llamar al callback si existe
                if (this.onDestroyEnemy) {
                    this.onDestroyEnemy(enemy);
                }
                
                // Destruir el enemigo
                enemy.destroy();
                
                // Remover de la lista
                this.enemigos.splice(i, 1);
            }
        }
        
        // Verificar colisión con naves enemigas
        if (this.enemyShips) {
            for (let i = this.enemyShips.length - 1; i >= 0; i--) {
                const ship = this.enemyShips[i];
                
                if (!ship || !ship.active) continue;
                
                const dx = ship.x - this.x;
                const dy = ship.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const innerRadius = this.radius - this.thickness;
                const outerRadius = this.radius + this.thickness;
                
                if (dist >= innerRadius && dist <= outerRadius) {
                    // Crear animación de destrucción de nave
                    this._crearAnimacionNave(ship);
                    
                    if (this.onDestroyShip) {
                        this.onDestroyShip(ship);
                    }
                    
                    ship.destroy();
                    this.enemyShips.splice(i, 1);
                }
            }
        }
        
        // Verificar colisión con enemigos especiales (SpecialEnemy - solo los normales, NO los mini en órbita)
        if (this.gameRef && this.gameRef.enemigosSpeciales) {
            for (let i = this.gameRef.enemigosSpeciales.length - 1; i >= 0; i--) {
                const especial = this.gameRef.enemigosSpeciales[i];
                
                // Skip mini asteroides en órbita - el ULTi no los destruye
                if (!especial || !especial.active || especial.enOrbita) continue;
                
                const dx = especial.x - this.x;
                const dy = especial.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const innerRadius = this.radius - this.thickness;
                const outerRadius = this.radius + this.thickness;
                
                if (dist >= innerRadius && dist <= outerRadius) {
                    // Crear animación de destrucción (AZUL)
                    if (this.gameRef.texturaAsteroidExplosion) {
                        const explosion = new AsteroidExplosion(
                            especial.x, especial.y,
                            this.gameRef.texturaAsteroidExplosion,
                            0.84,
                            0x0000FF
                        );
                        explosion.render(this.gameRef.mundo);
                        this.gameRef.efectosImpacto.push(explosion);
                    }
                    
                    // Dar power-up al jugador (si destroy con ULTi también lo da)
                    if (this.gameRef.jugador) {
                        this.gameRef.jugador.aumentarVelocidadDisparo();
                        if (this.gameRef.jugador.escudos < 100) {
                            this.gameRef.jugador.escudos = Math.min(100, this.gameRef.jugador.escudos + 20);
                        }
                    }
                    
                    // Sumar puntos
                    if (this.gameRef) {
                        this.gameRef.puntuacion += especial.puntos;
                        this.gameRef.asteroidesDestruidos++;
                    }
                    
                    especial.destroy();
                    this.gameRef.enemigosSpeciales.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Renderiza el efecto en el contenedor
     * 
     * @param {PIXI.Container} container - Contenedor donde agregar
     */
    render(container) {
        if (this.sprite && !this.sprite.parent) {
            container.addChild(this.sprite);
        }
    }
}
