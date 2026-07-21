/**
 * EnemyShip - Nave enemiga controlada por IA
 * 
 * Esta clase representa las naves enemigas que aparecen en el juego.
 * Tienen su propia IA para orbitar alrededor del jugador y disparar.
 * 
 * Características:
 * - 25 HP
 * - Movimiento de órbita con inercia
 * - Dispara cada 3 segundos (cuando está en pantalla)
 * - Esquiva asteroides
 * - Si colisiona con un asteroide, ambos se destruyen
 */
import { GameObject } from './GameObject.js';
import { CONFIG } from '../../config.js';

export class EnemyShip extends GameObject {
    /**
     * Constructor de la nave enemiga
     * 
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {object} textura - Textura de la nave enemiga
     * @param {object} jugador - Referencia al jugador (para seguirlo)
     * @param {object} enemigosAsteroides - Lista de asteroides (para esquivar)
     * @param {number} anchoJuego - Ancho del área de juego
     * @param {number} altoJuego - Alto del área de juego
     */
    constructor(x, y, textura, jugador, enemigosAsteroides, anchoJuego, altoJuego) {
        super(x, y);
        
        this.active = true;
        
        // Salud
        this.salud = CONFIG.NAVE_ENEMIGA.SALUD;
        this.saludMax = CONFIG.NAVE_ENEMIGA.SALUD;

        // Daño que hace al jugador
        this.dano = CONFIG.NAVE_ENEMIGA.DANO;

        // Carga de ULTi que da al destroy (10)
        this.cargaUlti = CONFIG.NAVE_ENEMIGA.CARGA_ULTI;
        
        // Velocidad de movimiento
        this.velocidad = CONFIG.NAVE_ENEMIGA.VELOCIDAD;  // Aumentado de 150 a 225 (50% más rápido)
        
        // Referencia al jugador
        this.jugador = jugador;
        
        // Lista de asteroides para esquivar
        this.enemigosAsteroides = enemigosAsteroides;
        
        // Dimensiones del juego
        this.anchoJuego = anchoJuego;
        this.altoJuego = altoJuego;
        
        // Rotación actual
        this.rotacion = 0;
        
        // Ya disparó?
        this.yaDisparo = false;
        
        // Puede moverse?
        this.puedeMoverse = true;
        
        // Crear el sprite - usar la textura original
        if (textura) {
            this.imagen = new PIXI.Sprite(textura);
            this.imagen.anchor.set(0.5);
            this.imagen.scale.set(0.3);
        } else {
            // Fallback si no hay textura
            this.imagen = new PIXI.Graphics();
            this.imagen.rect(-15, -15, 30, 30);
            this.imagen.fill(0x00FF00);
        }
        
        this.imagen.x = x;
        this.imagen.y = y;
        
        // Importante: evitar que no se renderice cuando está fuera de la pantalla
        this.imagen.cullable = false;
        
        // Sin tinte - mantener color original de la imagen
        
        // Radio de colisión (reducido para evitar colisiones falsas)
        this.radio = CONFIG.NAVE_ENEMIGA.RADIO_COLISION;
        
        // Temporizador de disparo (cada 3 segundos)
        this.tiempoDisparo = 2; // Empiezan con timer a 2s para que disparen pronto
        this.intervaloDisparo = CONFIG.NAVE_ENEMIGA.INTERVALO_DISPARO;
        this.tiempoInicio = 0; // Sin delay
        
        // Tiempo moviéndose alrededor del jugador
        this.tiempoMovimiento = 0;
        
        // Ángulo de órbita actual
        this.anguloOrbita = Math.random() * Math.PI * 2;
        
        // Radio de órbita (distancia del jugador)
        this.radioOrbita = 250 + Math.random() * 150;
        
        // Velocidad actual (para inercia)
        this.vx = 0;
        this.vy = 0;
    }
    
    /**
     * Update: Lógica de la nave enemiga cada frame
     * Movimiento con inercia, aceleración y frenado
     * 
     * @param {number} delta - Tiempo transcurrido (segundos)
     */
    update(delta) {
        if (!this.active || !this.puedeMoverse) return;
        
        // Actualizar temporizador de movimiento
        this.tiempoMovimiento += delta;
        
        // ----------------------------------------
        // 1. DISPARO (cada 3 segundos, con delay inicial)
        // ----------------------------------------
        // Reducir delay inicial
        if (this.tiempoInicio > 0) {
            this.tiempoInicio -= delta;
        }
        
        // Posición del jugador "más cercana" a esta nave por el wrap del toroide,
        // así apunta y orbita por el camino corto (no el largo) cerca de un borde.
        const W = this.anchoJuego, H = this.altoJuego;
        const _tor = !!(CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL);
        const _wrap = (d, s) => { if (!_tor) return d; const h = s / 2; if (d > h) return d - s; if (d < -h) return d + s; return d; };
        const jugX = this.x + _wrap(this.jugador.x - this.x, W);
        const jugY = this.y + _wrap(this.jugador.y - this.y, H);

        const dxJugador = jugX - this.x;
        const dyJugador = jugY - this.y;
        const anguloJugador = Math.atan2(dyJugador, dxJugador);
        
        this.tiempoDisparo += delta;
        // Solo dispara si pasó el delay inicial
        if (this.tiempoInicio <= 0 && this.tiempoDisparo >= this.intervaloDisparo) {
            this.tiempoDisparo = 0;
            this.direccionDisparo = anguloJugador;
            this.yaDisparo = true;
            this.disparoCreado = false; // Resetear para el siguiente disparo
        }
        
        // ----------------------------------------
        // 2. OBJETIVO DE ÓRBITA
        // ----------------------------------------
        // Cambiar ángulo de órbita gradualmente (movimiento suave y circular)
        this.anguloOrbita += 0.4 * delta;
        
        // Variar el radio para que no sea siempre el mismo (entre 350-500px)
        const radioDeseado = 400 + Math.sin(this.tiempoMovimiento * 0.5) * 100;
        this.radioOrbita += (radioDeseado - this.radioOrbita) * 0.05 * delta;
        
        const destinoX = jugX + Math.cos(this.anguloOrbita) * this.radioOrbita;
        const destinoY = jugY + Math.sin(this.anguloOrbita) * this.radioOrbita;
        
        // ----------------------------------------
        // 3. CALCULAR ACELERACIÓN DESEADA
        // ----------------------------------------
        // Vector hacia el destino
        let dirX = destinoX - this.x;
        let dirY = destinoY - this.y;
        let distDestino = Math.sqrt(dirX * dirX + dirY * dirY);
        
        if (distDestino > 0) {
            dirX /= distDestino;
            dirY /= distDestino;
        }
        
        // ----------------------------------------
        // 4. ESQUIVAR ASTEROIDES (fuerza de repulsión)
        // ----------------------------------------
        let esquivarX = 0;
        let esquivarY = 0;
        
        for (const ast of this.enemigosAsteroides) {
            if (!ast.active) continue;
            // Delta toroidal al asteroide (camino corto)
            const adx = _wrap(ast.x - this.x, W), ady = _wrap(ast.y - this.y, H);
            const distAst = Math.sqrt(adx * adx + ady * ady);
            // Solo esquivar si está muy cerca (radio de esquiva = 100px)
            if (distAst < 100) {
                const fuerza = (100 - distAst) / 100;
                esquivarX += (-adx / distAst) * fuerza;   // alejarse del asteroide
                esquivarY += (-ady / distAst) * fuerza;
            }
        }
        
        let magEsq = Math.sqrt(esquivarX * esquivarX + esquivarY * esquivarY);
        if (magEsq > 0) {
            esquivarX /= magEsq;
            esquivarY /= magEsq;
        }
        
        // ----------------------------------------
        // 5. ACELERACIÓN CON INERCIA
        // ----------------------------------------
        // Aceleración objetivo (hacia donde queremos ir)
        let acelX = dirX;
        let acelY = dirY;
        
        // Mezclar con esquiva
        if (magEsq > 0) {
            acelX = dirX * 0.6 + esquivarX * 0.4;
            acelY = dirY * 0.6 + esquivarY * 0.4;
        }
        
        // Si está lejos del destino, acelerar; si está cerca, desacelerar
        const constFactor = distDestino < 80 ? 0.3 : 1.0;
        acelX *= this.velocidad * constFactor;
        acelY *= this.velocidad * constFactor;
        
        // Aplicar inercia: mezclar velocidad actual con aceleración deseada
        // Suavizado (factor 0.05 = mucha inercia, 0.5 = poco)
        const suavizado = 0.05;
        
        // Interpolación hacia la aceleración deseada (inercia)
        this.vx = this.vx * (1 - suavizado) + acelX * suavizado;
        this.vy = this.vy * (1 - suavizado) + acelY * suavizado;
        
        // ----------------------------------------
        // 6. APLICAR MOVIMIENTO
        // ----------------------------------------
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        
        // ----------------------------------------
        // 7. ROTACIÓN SUAVE CON INERCIA
        // ----------------------------------------
        // La rotación sigue a la velocidad (hacia donde se mueve)
        const anguloMovimiento = Math.atan2(this.vy, this.vx);
        let diffAngulo = anguloMovimiento - this.rotacion;
        while (diffAngulo > Math.PI) diffAngulo -= Math.PI * 2;
        while (diffAngulo < -Math.PI) diffAngulo += Math.PI * 2;
        
        // Doblar suavemente según la velocidad (más lento = más suave)
        const velocidadActual = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const factorGiro = velocidadActual > 50 ? 2 : 1; // Giro más suave cuando está despacio
        this.rotacion += diffAngulo * factorGiro * delta;
        
        // Actualizar sprite
        this.imagen.x = this.x;
        this.imagen.y = this.y;
        this.imagen.rotation = this.rotacion;
    }
    
    /**
     * Recibe daño del jugador
     * 
     * @param {number} dano - Cantidad de daño
     * @returns {boolean} - true si fue destruido
     */
    recibirDano(dano) {
        this.salud -= dano;
        
        this.imagen.alpha = this.salud / this.saludMax;
        
        if (this.salud <= 0) {
            // Sonido de destrucción de nave enemiga (jugador -> juego -> gestorSonido)
            if (this.jugador && this.jugador.juego && this.jugador.juego.gestorSonido) {
                this.jugador.juego.gestorSonido.reproducir('destruccionNave');
            }
            this.destroy();
            return true;
        }

        return false;
    }
    
    /**
     * Renderiza la nave en el contenedor
     * 
     * @param {PIXI.Container} container - Contenedor donde agregar
     */
    render(container) {
        if (this.imagen && !this.imagen.parent) {
            container.addChild(this.imagen);
        }
    }
    
    /**
     * Destruye la nave y la elimina de pantalla
     */
    destroy() {
        this.active = false;
        if (this.imagen && this.imagen.parent) {
            this.imagen.parent.removeChild(this.imagen);
        }
    }
    
    /**
     * Verifica colisión con otro objeto (como un asteroide)
     * 
     * @param {object} otro - Otro objeto con x, y, radio
     * @returns {boolean} - true si hay colisión
     */
    verificarColision(otro) {
        if (!otro || !otro.active) return false;
        
        const dx = this.x - otro.x;
        const dy = this.y - otro.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        return distancia < (this.radio + (otro.radio || 30));
    }
}