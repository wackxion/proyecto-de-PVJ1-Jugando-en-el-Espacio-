/**
 * GameBoids - Módulo de gestión de partículas Boid
 * 
 * Este archivo contiene funciones relacionadas con las partículas Boid:
 * - Creación de partículas iniciales
 * - Actualización del comportamiento de enjambre
 * - Captura de partículas por el Devorador
 * 
 * Funciones exportadas:
 * - crearParticulasIniciales: Crea las partículas Boid iniciales
 * - crearParticulaFuera: Crea una partícula fuera de la pantalla
 * - actualizarParticulas: Actualiza todas las partículas Boid
 * - capturarParticula: Elimina una partícula capturada
 */

import { CONFIG } from '../../config.js';
import { BoidParticle } from '../efectosVisuales/BoidParticle.js';

/**
 * Crea las partículas Boid iniciales
 * Función auxiliar para Game.js - líneas 293-294
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} cantidad - Número de partículas a crear
 */
export function crearParticulasIniciales(game, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        // Alrededor de la nave, dentro de un área del tamaño de la pantalla
        const jx = game.jugador ? game.jugador.x : game.mundoAncho / 2;
        const jy = game.jugador ? game.jugador.y : game.mundoAlto / 2;
        const x = jx + (Math.random() - 0.5) * game.anchoJuego;
        const y = jy + (Math.random() - 0.5) * game.altoJuego;

        // Crear partícula
        const particula = new BoidParticle(x, y, game.texturaParticulaBoid, game.texturasPboids);
        
        // Velocidad aleatoria
        particula.velX = (Math.random() - 0.5) * 60;
        particula.velY = (Math.random() - 0.5) * 60;
        particula.active = true;
        
        // Renderizar
        particula.render(game.mundo);
        game.particulasBoid.push(particula);
    }
}

/**
 * Crea una partícula Boid fuera de la pantalla
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @returns {BoidParticle} La partícula creada
 */
export function crearParticulaFuera(game) {
    // Aparece justo afuera de la vista de la cámara (alrededor de la nave)
    const p = game._puntoSpawnFueraDeVista(100);
    const x = p.x, y = p.y;

    const particula = new BoidParticle(x, y, game.texturaParticulaBoid, game.texturasPboids);

    // Velocidad hacia la nave
    const centroX = game.jugador ? game.jugador.x : game.mundoAncho / 2;
    const centroY = game.jugador ? game.jugador.y : game.mundoAlto / 2;
    const dx = centroX - x;
    const dy = centroY - y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    
    particula.velX = (dx / mag) * 50 + (Math.random() - 0.5) * 30;
    particula.velY = (dy / mag) * 50 + (Math.random() - 0.5) * 30;
    particula.active = true;
    
    if (particula.imagen) {
        particula.imagen.x = x;
        particula.imagen.y = y;
        particula.imagen.visible = true;
    }

    return particula;
}

/**
 * Suelta partículas Boid EN una posición (p. ej. donde se destruyó un asteroide).
 * Salen disparadas en direcciones al azar. Respeta el máximo de partículas.
 *
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} x - Posición X donde soltarlas
 * @param {number} y - Posición Y donde soltarlas
 * @param {number} cantidad - Cuántas partículas soltar
 */
export function soltarParticulasEn(game, x, y, cantidad = 1) {
    if (!game.particulasBoid) return;
    const max = CONFIG.BOIDS.MAX_PARTICULAS;
    for (let i = 0; i < cantidad; i++) {
        if (game.particulasBoid.length >= max) break;
        const particula = new BoidParticle(x, y, game.texturaParticulaBoid, game.texturasPboids);
        const ang = Math.random() * Math.PI * 2;
        const vel = 60 + Math.random() * 80;
        particula.x = x;
        particula.y = y;
        particula.velX = Math.cos(ang) * vel;
        particula.velY = Math.sin(ang) * vel;
        particula.active = true;
        if (particula.imagen) {
            particula.imagen.x = x;
            particula.imagen.y = y;
            particula.imagen.visible = true;
        }
        game.particulasBoid.push(particula);
        particula.render(game.mundo);
    }
}

/**
 * Actualiza todas las partículas Boid en pantalla
 * Función auxiliar para Game.js - líneas 2955-3030
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarParticulasBoid(game, delta) {
    // Verificar que el array existe
    if (!game.particulasBoid || !Array.isArray(game.particulasBoid)) {
        return;
    }
    
    const maxParticulas = CONFIG.BOIDS.MAX_PARTICULAS;
    
    for (let i = game.particulasBoid.length - 1; i >= 0; i--) {
        const particula = game.particulasBoid[i];
        
        // Resetear flag de atracción si está muy lejos de la nave
        if (game.jugador && game.jugador.active) {
            const dx = game.jugador.x - particula.x;
            const dy = game.jugador.y - particula.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            if (distancia > CONFIG.BOIDS.RANGO_RESET_ATRACCION * (game.mejoraDevoradorMult || 1)) {
                particula.siendoAtraida = false;
            }
            
            // Verificar si la partícula llegó al jugador (capturada por Devorador)
            if (particula.siendoAtraida && distancia < CONFIG.BOIDS.RANGO_CAPTURA) {
                // Capturar la partícula
                _capturarParticulaBoid(game, i);
                continue;
            }
        }
        
        // Actualizar comportamiento Boid (fuga de nave y asteroides)
        particula.actualizar(
            delta, 
            game.particulasBoid, 
            game.jugador, 
            game.enemigosNaves,
            game.enemigos,
            game.mundoAncho,
            game.mundoAlto
        );
        
        // Sincronizar sprite
        if (particula.imagen) {
            particula.imagen.x = particula.x;
            particula.imagen.y = particula.y;
        }
        
        // Reciclado: si está demasiado lejos de la NAVE por más de 5 s, traerla
        // de vuelta cerca (con cámara, se mide distancia al jugador, no a la pantalla).
        const limiteRecycle = Math.hypot(game.anchoJuego, game.altoJuego) * 1.4;
        const fueraDeLosBordes = game.jugador &&
            Math.hypot(particula.x - game.jugador.x, particula.y - game.jugador.y) > limiteRecycle;

        if (fueraDeLosBordes) {
            particula.contadorFueraDePantalla = (particula.contadorFueraDePantalla || 0) + delta;
            if (particula.contadorFueraDePantalla > 5) {
                // Reaparece justo afuera de la vista y va hacia la nave
                const pr = game._puntoSpawnFueraDeVista(100);
                particula.x = pr.x;
                particula.y = pr.y;
                const centroX = game.jugador ? game.jugador.x : game.mundoAncho / 2;
                const centroY = game.jugador ? game.jugador.y : game.mundoAlto / 2;
                const dx = centroX - particula.x;
                const dy = centroY - particula.y;
                const mag = Math.sqrt(dx * dx + dy * dy) || 1;
                particula.velX = (dx / mag) * 50 + (Math.random() - 0.5) * 30;
                particula.velY = (dy / mag) * 50 + (Math.random() - 0.5) * 30;
                particula.contadorFueraDePantalla = 0;
            }
        } else {
            particula.contadorFueraDePantalla = 0;
        }
        
        // Captura por la nave
        if (game.jugador && game.jugador.active && particula.puedeSerCapturada(game.jugador)) {
            _capturarParticulaBoid(game, i);
            continue;
        }
    }
    
    // Actualizar contador UI
    if (game.uiManager && game.uiManager.actualizarContadorParticulas) {
        game.uiManager.actualizarContadorParticulas(game.particulasBoid.length);
    }
}

/**
 * Captura una partícula Boid (cuando el Devorador la alcanza)
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} indice - Índice de la partícula en el array
 */
function _capturarParticulaBoid(game, indice) {
    const particula = game.particulasBoid[indice];
    
    // Eliminar la partícula
    particula.destroy();
    game.particulasBoid.splice(indice, 1);
    
    // Incrementar contador de partículas capturadas (PixiHUD lo muestra)
    game.particulasCapturadas++;

    // Sonido de captura (con throttle interno)
    if (game._sonidoCapturaBoid) game._sonidoCapturaBoid();
}

/**
 * Resetea el contador de partículas capturadas
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function resetearContadorCapturadas(game) {
    game.particulasCapturadas = 0;
}

/**
 * Función completa para manejar partículas Boid en el game loop
 * Incluye timer para crear partículas en grupos de 10 cada 7 segundos
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarSistemaBoid(game, delta) {
    // Verificar que el array existe
    if (!game.particulasBoid || !Array.isArray(game.particulasBoid)) {
        return;
    }
    
    // Timer para crear partículas en grupos de 10 (cada 7 segundos)
    game.timerParticulasBoid = (game.timerParticulasBoid || 0) + delta;
    if (game.timerParticulasBoid >= CONFIG.BOIDS.SPAWN_INTERVALO && game.particulasBoid.length < CONFIG.BOIDS.MAX_PARTICULAS) {
        game.timerParticulasBoid = 0;
        // Crear grupo de 10 partículas
        for (let i = 0; i < CONFIG.BOIDS.SPAWN_BATCH; i++) {
            const nuevaParticula = crearParticulaFuera(game);
            game.particulasBoid.push(nuevaParticula);
            nuevaParticula.render(game.mundo);
        }
    }
    
    // Actualizar todas las partículas
    actualizarParticulasBoid(game, delta);
}