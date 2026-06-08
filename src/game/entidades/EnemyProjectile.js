/**
 * EnemyProjectile - Proyectil teledirigido de la nave enemiga
 * 
 * Este proyectil sigue al jugador y evita asteroides.
 * 
 * Características:
 * - Perseguir al jugador (teledirigido)
 * - Evita asteroides
 * - Velocidad: 400 px/s
 * - Tiempo de vida: 3 segundos
 */
import { GameObject } from './GameObject.js';
import { CONFIG } from '../../config.js';

export class EnemyProjectile extends GameObject {
    constructor(x, y, direccion, anchoJuego, altoJuego, textura, jugador, enemigos) {
        super(x, y);
        
        this.velocidad = CONFIG.PROYECTIL_ENEMIGO.VELOCIDAD;
        this.direccion = direccion;
        
        this.dano = CONFIG.PROYECTIL_ENEMIGO.DANO;
        this.tiempoDeVida = CONFIG.PROYECTIL_ENEMIGO.TIEMPO_DE_VIDA;
        
        this.radio = 12;  // Aumentado de 8 a 12 para mejor colisión
        this.anchoJuego = anchoJuego;
        this.altoJuego = altoJuego;
        
        this.jugador = jugador;
        this.enemigos = enemigos;
        
        this.active = true;
        
        this.escala = 0.35;
        
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
        
        // ===== TELERRECCIÓN: Perseguir hacia el jugador =====
        const dx = this.jugador.x - this.x;
        const dy = this.jugador.y - this.y;
        const distJugador = Math.sqrt(dx * dx + dy * dy);
        
        // Ángulo deseado hacia el jugador
        let dirX = dx / distJugador;
        let dirY = dy / distJugador;
        
        // ===== EVITAR ASTEROIDES =====
        let evitarX = 0;
        let evitarY = 0;
        
        for (const ast of this.enemigos) {
            if (!ast.active) continue;
            
            const distAst = Math.sqrt((ast.x - this.x) ** 2 + (ast.y - this.y) ** 2);
            
            // Si hay un asteroide cerca (menos de 80px)
            if (distAst < 80) {
                // Fuerza de repulsión
                const fuerza = (80 - distAst) / 80;
                evitarX += ((this.x - ast.x) / distAst) * fuerza * 2;
                evitarY += ((this.y - ast.y) / distAst) * fuerza * 2;
            }
        }
        
        // Normalizar vector de evasión
        const magEvasion = Math.sqrt(evitarX * evitarX + evitarY * evitarY);
        if (magEvasion > 0) {
            evitarX /= magEvasion;
            evitarY /= magEvasion;
        }
        
        // Mezclar: 70% hacia jugador, 30% evitar asteroides
        dirX = dirX * 0.7 + evitarX * 0.3;
        dirY = dirY * 0.7 + evitarY * 0.3;
        
        // Normalizar dirección final
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 0) {
            dirX /= mag;
            dirY /= mag;
        }
        
        // Actualizar dirección del proyectil (interpolación suave)
        const anguloDeseado = Math.atan2(dirY, dirX);
        let diff = anguloDeseado - this.direccion;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        // Suavizar giro (factor 2)
        this.direccion += diff * 2 * delta;
        
        // Mover proyectil
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