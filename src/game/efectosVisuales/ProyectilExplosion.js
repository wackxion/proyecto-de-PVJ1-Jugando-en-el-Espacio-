/**
 * ProyectilExplosion - Efecto de explosión animado del proyectil
 * 
 * Esta clase muestra una animación de explosión cuando un proyectil golpea un asteroide.
 * Usa 5 frames para la animación (proyectil2-6Explocion.png).
 * 
 * Características:
 * - Animación de 5 frames
 * - Duración: 0.5 segundos (0.1s por frame)
 * - Se destruye después de reproducir la animación
 */
import { GameObject } from '../entidades/GameObject.js';

export class ProyectilExplosion extends GameObject {
    /**
     * Constructor del efecto de explosón del proyectil
     * 
     * @param {number} x - Posición X donde ocurre el impacto
     * @param {number} y - Posición Y donde ocurre el impacto
     * @param {Array} texturas - Array de 5 texturas para la animación
     * @param {number} escala - Escala del efecto (por defecto 0.35, el de un impacto de proyectil)
     */
    constructor(x, y, texturas, escala = 0.35) {
        super(x, y);

        this.active = true;

        // Array de texturas para la animación
        this.texturas = texturas;

        // Tiempo total de la animación
        this.duracionTotal = 0.5; // 0.5 segundos total
        this.tiempoActual = 0;

        // Duración de cada frame
        this.duracionFrame = 0.1; // 0.1 segundos por frame

        // Escala de la explosión (parametrizable; el cohete la usa para el tamaño del área)
        this.escala = escala;
        
        // Crear el sprite con el primer frame
        this.imagen = new PIXI.Sprite(texturas[0]);
        this.imagen.anchor.set(0.5);
        this.imagen.scale.set(this.escala);
        this.imagen.x = x;
        this.imagen.y = y;
        
        // Frame actual (0-4 para los 5 frames)
        this.frameActual = 0;
    }
    
    /**
     * Update: Actualiza la animación
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     */
    update(delta) {
        if (!this.active) return;
        
        this.tiempoActual += delta;
        
        // Cambiar de frame cada duracionFrame
        if (this.tiempoActual >= this.duracionFrame) {
            this.tiempoActual = 0;
            this.frameActual++;
            
            // Si hay más frames, cambiarlos
            if (this.frameActual < this.texturas.length) {
                this.imagen.texture = this.texturas[this.frameActual];
            }
        }
        
        // Destruirse después de la animación completa
        if (this.frameActual >= this.texturas.length) {
            this.destroy();
            return;
        }
    }
    
    /**
     * Renderiza el efecto en el contenedor
     * 
     * @param {PIXI.Container} container - Contenedor donde agregar
     */
    render(container) {
        if (this.imagen && !this.imagen.parent) {
            container.addChild(this.imagen);
        }
    }
    
    /**
     * Destruye el efecto y lo elimina del contenedor
     */
    destroy() {
        this.active = false;
        if (this.imagen && this.imagen.parent) {
            this.imagen.parent.removeChild(this.imagen);
        }
    }
}