/**
 * Proyectil - Proyectil disparado por la nave
 * 
 * Esta clase representa los disparos que hace la nave del jugador.
 * Se mueven en línea recta hacia la dirección que apunta la nave.
 * 
 * Características:
 * - Se renderiza usando una textura (proyectil1.png)
 * - Tiene una velocidad alta (600 px/s)
 * - Tiene un tiempo de vida limitado (2 segundos)
 * - Se destruye cuando sale de la pantalla
 */
import { GameObject } from './GameObject.js';
import { CONFIG } from '../../config.js';

export class Proyectil extends GameObject {
    /**
     * Constructor del proyectil
     * 
     * @param {number} x - Posición X inicial donde nace el proyectil
     * @param {number} y - Posición Y inicial donde nace el proyectil
     * @param {number} direccion - Dirección del disparo en radianes (ángulo)
     * @param {number} anchoJuego - Ancho del área de juego
     * @param {number} altoJuego - Alto del área de juego
     * @param {object} textura - Textura del proyectil (proyectil1.png)
     */
    constructor(x, y, direccion, anchoJuego = 800, altoJuego = 600, textura = null, multiplicadorVelocidad = 1.0) {
        // Llamar al constructor de GameObject
        super(x, y);
        
        // Velocidad: Qué tan rápido se mueve el proyectil (píxeles por segundo)
        // Se aplica el multiplicador de las mejoras Proyectil2
        this.velocidad = CONFIG.PROYECTIL.VELOCIDAD * multiplicadorVelocidad;
        
        // Direccion: Ángulo hacia donde se mueve el proyectil
        // Se mide en radianes (0 = derecha, π/2 = abajo, π = izquierda, etc.)
        this.direccion = direccion;
        
        // Dano: Cuánta salud le quitamos al asteroide
        this.dano = CONFIG.PROYECTIL.DANO;
        
        // Tiempo de vida: Cuánto dura el proyectil antes de destruirse solo
        this.tiempoDeVida = CONFIG.PROYECTIL.TIEMPO_DE_VIDA; // 2 segundos
        
        // Radio: Para calcular colisiones (qué tan grande es el proyectil)
        this.radio = 6;  // Reducido 50% (12 → 6)
        
        // Ancho/Alto Juego: Dimensiones del área de juego
        this.anchoJuego = anchoJuego;
        this.altoJuego = altoJuego;
        
        // Escala del proyectil (se ajustará según el tamaño de la textura)
        this.escala = 0.175;  // Reducido 50% (0.35 → 0.175)
        
        // Crear el sprite del proyectil usando textura
        if (textura) {
            this.imagen = new PIXI.Sprite(textura);
            this.imagen.anchor.set(0.5);
            this.imagen.scale.set(this.escala);
        } else {
            // Fallback: dibujar línea si no hay textura
            this.graphics = new PIXI.Graphics();
            const startX = -12;
            const endX = 12;
            this.graphics.moveTo(startX, 0);
            this.graphics.lineTo(endX, 0);
            this.graphics.stroke({ width: 4, color: 0x0044CC });
            this.imagen = this.graphics;
        }
        
        this.imagen.x = x;
        this.imagen.y = y;
        
        // Rotar la imagen para que apunte en la dirección del disparo
        this.imagen.rotation = direccion;
        
        // Width y Height para colisiones
        this.ancho = this.largo;
        this.alto = 4;
        
        // IMPORTANTE: Mover el proyectil un poco hacia adelante
        // Esto evita que nazca "dentro" de la nave
        // Math.cos(direccion) = componente X de la dirección
        // Math.sin(direccion) = componente Y de la dirección
        this.x += Math.cos(direccion) * 35;
        this.y += Math.sin(direccion) * 35;
        
        // Actualizar la posición de la imagen
        this.imagen.x = this.x;
        this.imagen.y = this.y;
    }
    
    /**
     * Update (Actualización): Se llama cada frame
     * Mueve el proyectil y verifica si debe destruirse
     * 
     * @param {number} delta - Tiempo transcurrido desde el último frame (segundos)
     */
    update(delta) {
        // Si no está activo, salir
        if (!this.active) return;
        
        // Reducir el tiempo de vida
        this.tiempoDeVida -= delta;
        
        // Si el tiempo de vida llegó a 0, destruir el proyectil
        if (this.tiempoDeVida <= 0) {
            this.destroy();
            return;
        }
        
        // Mover el proyectil en la dirección
        // x += cos(direccion) * velocidad * tiempo
        this.x += Math.cos(this.direccion) * this.velocidad * delta;
        this.y += Math.sin(this.direccion) * this.velocidad * delta;
        
        // Actualizar la posición de la imagen (solo si existe)
        if (this.imagen) {
            this.imagen.x = this.x;
            this.imagen.y = this.y;
        }
        
        // Verificar si el proyectil salió de la pantalla
        // Agregamos 50px de margen para que desaparezca fuera de la vista
        if (this.x < -50 || this.x > this.anchoJuego + 50 || 
            this.y < -50 || this.y > this.altoJuego + 50) {
            // Destruir el proyectil
            this.destroy();
        }
    }
    
    /**
     * Renderiza el proyectil en el contenedor
     * 
     * @param {PIXI.Container} container - Contenedor donde agregar el sprite
     */
    render(container) {
        // Agregar el sprite al contenedor (necesario para pooling)
        const visual = this.imagen || this.sprite;
        if (visual) {
            // Si ya tiene padre, primero quitarl
            if (visual.parent) {
                visual.parent.removeChild(visual);
            }
            // Agregar al nuevo contenedor
            container.addChild(visual);
        }
    }
    
    /**
     * Destruye el proyectil y lo devuelve al pool si existe
     * @param {Object} pool - Pool de objetos (opcional)
     */
    destroyAndRelease(pool = null) {
        this.destroy();
        if (pool) {
            pool.release(this);
        }
    }
}
