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
        // Crear partícula FUERA de la pantalla (100px)
        const borde = Math.floor(Math.random() * 4);
        let x, y;

        switch (borde) {
            case 0: // Top
                x = Math.random() * game.anchoJuego;
                y = -100;
                break;
            case 1: // Bottom
                x = Math.random() * game.anchoJuego;
                y = game.altoJuego + 100;
                break;
            case 2: // Left
                x = -100;
                y = Math.random() * game.altoJuego;
                break;
            case 3: // Right
                x = game.anchoJuego + 100;
                y = Math.random() * game.altoJuego;
                break;
        }

        // Crear partícula
        const particula = new BoidParticle(x, y, game.texturaParticulaBoid, game.texturasPboids);
        
        // Velocidad aleatoria
        particula.velX = (Math.random() - 0.5) * 60;
        particula.velY = (Math.random() - 0.5) * 60;
        particula.active = true;
        
        // Renderizar
        particula.render(game.aplicacion.stage);
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
    const borde = Math.floor(Math.random() * 4);
    let x, y;
    
switch (borde) {
        case 0: // Top
            x = Math.random() * game.anchoJuego;
            y = -100;
            break;
        case 1: // Bottom
            x = Math.random() * game.anchoJuego;
            y = game.altoJuego + 100;
            break;
        case 2: // Left
            x = -100;
            y = Math.random() * game.altoJuego;
            break;
        case 3: // Right
            x = game.anchoJuego + 100;
            y = Math.random() * game.altoJuego;
            break;
    }
    
    const particula = new BoidParticle(x, y, game.texturaParticulaBoid, game.texturasPboids);
    
    // Velocidad hacia el centro
    const centroX = game.anchoJuego / 2;
    const centroY = game.altoJuego / 2;
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
            if (distancia > CONFIG.BOIDS.RANGO_RESET_ATRACCION) {
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
            game.anchoJuego,
            game.altoJuego
        );
        
        // Sincronizar sprite
        if (particula.imagen) {
            particula.imagen.x = particula.x;
            particula.imagen.y = particula.y;
        }
        
        // Las partículas pueden entrar y salir de la pantalla libremente
        // Recyclo: si está más de 5 segundos fuera, mandarla de vuelta a un borde
        const fueraDeLosBordes = particula.x < -50 || particula.x > game.anchoJuego + 50 ||
                                 particula.y < -50 || particula.y > game.altoJuego + 50;
        
        if (fueraDeLosBordes) {
            particula.contadorFueraDePantalla = (particula.contadorFueraDePantalla || 0) + delta;
            if (particula.contadorFueraDePantalla > 5) {
                // Recyclo: mover a un borde y dar velocidad hacia el centro
                const borde = Math.floor(Math.random() * 4);
                switch (borde) {
                    case 0: // Top
                        particula.x = Math.random() * game.anchoJuego;
                        particula.y = -100;
                        break;
                    case 1: // Bottom
                        particula.x = Math.random() * game.anchoJuego;
                        particula.y = game.altoJuego + 100;
                        break;
                    case 2: // Left
                        particula.x = -100;
                        particula.y = Math.random() * game.altoJuego;
                        break;
                    case 3: // Right
                        particula.x = game.anchoJuego + 100;
                        particula.y = Math.random() * game.altoJuego;
                        break;
                }
                // Velocidad hacia el centro
                const centroX = game.anchoJuego / 2;
                const centroY = game.altoJuego / 2;
                const dx = centroX - particula.x;
                const dy = centroY - particula.y;
                const mag = Math.sqrt(dx * dx + dy * dy);
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
            nuevaParticula.render(game.aplicacion.stage);
        }
    }
    
    // Actualizar todas las partículas
    actualizarParticulasBoid(game, delta);
}