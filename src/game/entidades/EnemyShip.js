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
        
        // Ya disparó? (flag que GameEnemies consume para crear el proyectil)
        this.yaDisparo = false;
        // disparoCreado: evita crear más de un proyectil por ciclo de disparo.
        // Se inicializa acá (antes quedaba undefined hasta el primer disparo).
        this.disparoCreado = false;
        
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

        // "Pasada agresiva" (dive): cada tanto la nave se acerca de golpe y después
        // vuelve a su órbita. Da variedad al movimiento (no siempre a media distancia).
        this.diveTimer = 4 + Math.random() * 6;   // primera pasada en 4-10s
        this.enDive = false;                       // ¿está en una pasada cercana ahora?
        this.diveDuracion = 0;                     // segundos que le quedan a la pasada

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
        if (!this.active) return;
        
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
        
        // Radio de órbita: normalmente oscila 300-500px. Cada tanto la nave hace una
        // PASADA agresiva más cerca (dive) y después vuelve a su órbita.
        this.diveTimer -= delta;
        if (this.diveTimer <= 0 && !this.enDive) {
            this.enDive = true;
            this.diveDuracion = 2;                    // la pasada cercana dura ~2s
            this.diveTimer = 8 + Math.random() * 8;   // próxima pasada en 8-16s
        }
        if (this.enDive) {
            this.diveDuracion -= delta;
            if (this.diveDuracion <= 0) this.enDive = false;
        }
        // En dive se acerca a ~150px; si no, oscila suave entre 300 y 500px.
        const radioDeseado = this.enDive ? 150 : (400 + Math.sin(this.tiempoMovimiento * 0.5) * 100);
        // Convergencia frame-independiente (~2/s): antes usaba 0.05·delta, que era
        // tan lento que el radio casi no cambiaba.
        this.radioOrbita += (radioDeseado - this.radioOrbita) * Math.min(1, 2 * delta);
        
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
        
        // Aplicar inercia: mezclar velocidad actual con la deseada.
        // Frame-INDEPENDIENTE: antes era 0.05 fijo por frame (más lento a menos FPS,
        // p. ej. en el G04 si baja de 60). Ahora ~3/s da el mismo feel a 60fps pero
        // se mantiene consistente a cualquier framerate.
        const suavizado = Math.min(1, 3 * delta);
        this.vx = this.vx * (1 - suavizado) + acelX * suavizado;
        this.vy = this.vy * (1 - suavizado) + acelY * suavizado;
        
        // ----------------------------------------
        // 6. APLICAR MOVIMIENTO
        // ----------------------------------------
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        
        // ----------------------------------------
        // 7. ROTACIÓN
        // ----------------------------------------
        // Normalmente la nave mira hacia donde se MUEVE (tangencial a la órbita).
        // PERO si tiene un disparo pendiente, ENCARA al jugador para poder dispararle
        // (antes miraba siempre de costado ~96° → casi nunca podía tirar). Mientras
        // encara, mantiene la mira fresca hacia el jugador y gira más rápido.
        const disparoPendiente = this.yaDisparo && !this.disparoCreado;
        let anguloObjetivo;
        if (disparoPendiente) {
            this.direccionDisparo = anguloJugador;   // mira fresca (el jugador se mueve)
            anguloObjetivo = anguloJugador;           // encarar al jugador
        } else {
            anguloObjetivo = Math.atan2(this.vy, this.vx);  // seguir el movimiento
        }
        let diffAngulo = anguloObjetivo - this.rotacion;
        while (diffAngulo > Math.PI) diffAngulo -= Math.PI * 2;
        while (diffAngulo < -Math.PI) diffAngulo += Math.PI * 2;

        // Gira un poco más rápido cuando encara para disparar (configurable), suave si
        // solo se mueve. Antes era 8 fijo → se sentía un giro muy brusco al apuntar.
        const velocidadActual = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const giroApuntado = (CONFIG.NAVE_ENEMIGA && CONFIG.NAVE_ENEMIGA.FACTOR_GIRO_APUNTADO) || 4;
        const factorGiro = disparoPendiente ? giroApuntado : (velocidadActual > 50 ? 2 : 1);
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
}