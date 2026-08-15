/**
 * EnemyProjectile - Proyectil de la nave enemiga (disparo RECTO)
 *
 * La nave apunta al jugador al momento de disparar y el proyectil viaja en línea
 * recta en esa dirección (ya NO es teledirigido ni esquiva asteroides).
 *
 * Características:
 * - Velocidad: 400 px/s
 * - Tiempo de vida: 3 segundos
 */
import { GameObject } from './GameObject.js';
import { CONFIG } from '../../config.js';

export class EnemyProjectile extends GameObject {
    constructor(x, y, direccion, anchoJuego, altoJuego, textura) {
        super(x, y);

        this.velocidad = CONFIG.PROYECTIL_ENEMIGO.VELOCIDAD;
        this.direccion = direccion;

        this.dano = CONFIG.PROYECTIL_ENEMIGO.DANO;
        this.tiempoDeVida = CONFIG.PROYECTIL_ENEMIGO.TIEMPO_DE_VIDA;

        this.radio = 6;  // Reducido 50% (12 → 6)
        this.anchoJuego = anchoJuego;
        this.altoJuego = altoJuego;

        // (Ya no guarda jugador/enemigos: eran de cuando era teledirigido; ahora
        //  el disparo es recto y no los usa.)

        this.active = true;
        
        this.escala = 0.175;  // Reducido 50% (0.35 → 0.175)
        
        if (textura) {
            this.imagen = new PIXI.Sprite(textura);
            this.imagen.anchor.set(0.5);
            this.imagen.scale.set(this.escala);
            this.imagen.x = x;
            this.imagen.y = y;
            
            this.imagen.tint = 0x00FF00;
        }
        
        this.tiempoActual = 0;
    }
    
    update(delta) {
        if (!this.active) return;
        
        this.tiempoActual += delta;
        
        if (this.tiempoActual >= this.tiempoDeVida) {
            this.destroy();
            return;
        }
        
        // Disparo RECTO: se mueve en la dirección con la que fue disparado (la nave
        // apuntó al jugador al disparar). Ya NO persigue ni esquiva (sin teledirección).
        this.x += Math.cos(this.direccion) * this.velocidad * delta;
        this.y += Math.sin(this.direccion) * this.velocidad * delta;
        
        // Actualizar sprite
        if (this.imagen) {
            this.imagen.x = this.x;
            this.imagen.y = this.y;
            this.imagen.rotation = this.direccion;
        }
        
        // Destruir si sale de la pantalla
        if (this.x < -50 || this.x > this.anchoJuego + 50 ||
            this.y < -50 || this.y > this.altoJuego + 50) {
            this.destroy();
        }
    }
    
    render(container) {
        if (this.imagen && !this.imagen.parent) {
            container.addChild(this.imagen);
        }
    }
    
    destroy() {
        this.active = false;
        if (this.imagen && this.imagen.parent) {
            this.imagen.parent.removeChild(this.imagen);
        }
    }
}