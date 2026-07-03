/**
 * Cohete - Proyectil teledirigido que va hacia el enemigo más cercano
 */
import { CONFIG } from '../../config.js';
import { GameObject } from '../entidades/GameObject.js';

export class Cohete extends GameObject {
    /**
     * Constructor del cohete
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {Object} objetivo - Enemigo al que se dirige
     * @param {PIXI.Texture} textura - Textura del cohete
     */
    constructor(x, y, objetivo, textura) {
        super(x, y);
        
        this.objetivo = objetivo;
        this.velocidad = CONFIG.COHETE.VELOCIDAD;
        this.active = true;
        this.dano = CONFIG.COHETE.DANO;
        
        // Crear sprite. Se dimensiona a un "largo" fijo manteniendo la proporción
        // real de la textura, para que el sprite del cohete no se deforme (antes
        // era un rectángulo fijo de 16x8). El largo va sobre el eje X porque el
        // cohete se rota hacia su objetivo (rotación 0 = apunta a la derecha).
        this.imagen = new PIXI.Sprite(textura);
        const largoObjetivo = 30;
        const proporcion = (textura && textura.width) ? (textura.height / textura.width) : 0.5;
        this.imagen.width = largoObjetivo;
        this.imagen.height = largoObjetivo * proporcion;
        this.imagen.anchor.set(0.5);
        this.imagen.x = x;
        this.imagen.y = y;
        
        // Rotar hacia el objetivo
        if (objetivo && objetivo.x !== undefined) {
            const dx = objetivo.x - x;
            const dy = objetivo.y - y;
            this.rotacion = Math.atan2(dy, dx);
            this.imagen.rotation = this.rotacion;
        }
        
        // Velocidad inicial
        this.velX = Math.cos(this.rotacion) * this.velocidad;
        this.velY = Math.sin(this.rotacion) * this.velocidad;
    }
    
    /**
     * Renderiza el cohete en el stage
     * @param {PIXI.Container} stage - Stage donde dibujar
     */
    render(stage) {
        stage.addChild(this.imagen);
    }
    
    /**
     * Actualiza la posición del cohete
     * @param {number} delta - Tiempo transcurrido
     */
    update(delta) {
        if (!this.active) return;
        
        // Si el objetivo está activo, actualizar dirección
        if (this.objetivo && this.objetivo.active) {
            const dx = this.objetivo.x - this.x;
            const dy = this.objetivo.y - this.y;
            this.rotacion = Math.atan2(dy, dx);
            this.imagen.rotation = this.rotacion;
            
            this.velX = Math.cos(this.rotacion) * this.velocidad;
            this.velY = Math.sin(this.rotacion) * this.velocidad;
        }
        
        // Mover
        this.x += this.velX * delta;
        this.y += this.velY * delta;
        
        // Actualizar sprite
        this.imagen.x = this.x;
        this.imagen.y = this.y;
    }
    
    /**
     * Verifica si el cohete colisionó con el objetivo
     * @returns {boolean} true si hay colisión
     */
    verificarColision() {
        if (!this.objetivo || !this.objetivo.active) return false;
        
        const dx = this.x - this.objetivo.x;
        const dy = this.y - this.objetivo.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        const radioObjetivo = this.objetivo.radio || 32;
        
        return distancia < (CONFIG.COHETE.RADIO + radioObjetivo);
    }
    
    /**
     * Destruye el cohete
     */
    destroy() {
        this.active = false;
        // Eliminar sprite del stage
        if (this.imagen) {
            this.imagen.visible = false;
            if (this.imagen.parent) {
                this.imagen.parent.removeChild(this.imagen);
            }
        }
    }
}