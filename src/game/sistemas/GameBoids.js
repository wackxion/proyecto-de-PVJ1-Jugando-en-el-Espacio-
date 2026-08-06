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
 * Construye una grilla espacial con mapas numéricos: columna X -> celda Y -> boids.
 * El tamaño de celda es el rango de visión, así que todos los vecinos de un boid
 * dentro de ese rango quedan en su celda o en una adyacente. @private
 */
function _construirGrillaBoids(particulas, cellSize) {
    const grilla = new Map();
    for (const p of particulas) {
        if (!p || !p.active) continue;
        const cx = Math.floor(p.x / cellSize);
        const cy = Math.floor(p.y / cellSize);

        let columna = grilla.get(cx);
        if (!columna) {
            columna = new Map();
            grilla.set(cx, columna);
        }

        let celda = columna.get(cy);
        if (!celda) {
            celda = [];
            columna.set(cy, celda);
        }
        celda.push(p);
    }
    return grilla;
}

/**
 * Guarda en `salida` las celdas ocupadas alrededor de la partícula.
 * El mismo array se reutiliza para todos los boids, evitando crear una lista por partícula.
 * @returns {number} Cantidad de celdas válidas guardadas en `salida`. @private
 */
function _obtenerCeldasVecinas(grilla, particula, cellSize, salida) {
    const cx = Math.floor(particula.x / cellSize);
    const cy = Math.floor(particula.y / cellSize);
    let cantidad = 0;

    for (let dx = -1; dx <= 1; dx++) {
        const columna = grilla.get(cx + dx);
        if (!columna) continue;

        for (let dy = -1; dy <= 1; dy++) {
            const celda = columna.get(cy + dy);
            if (celda) salida[cantidad++] = celda;
        }
    }

    return cantidad;
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
    
    // OPTIMIZACIÓN — GRILLA ESPACIAL: en vez de que cada boid compare contra TODAS las
    // partículas (O(n²)), se agrupan en celdas del tamaño del rango de visión. Cada boid
    // solo mira su celda + las 8 adyacentes. Las celdas se pasan sin aplanarlas para no
    // crear arreglos temporales ni claves de texto por cada partícula.
    const cellSize = CONFIG.BOIDS.RANGO_VISION || 100;
    const grilla = _construirGrillaBoids(game.particulasBoid, cellSize);
    const celdasVecinas = new Array(9);
    const contextoVecinos = { celdas: celdasVecinas, cantidad: 0 };
    const limiteRecycle = Math.hypot(game.anchoJuego, game.altoJuego) * 1.4;

    for (let i = game.particulasBoid.length - 1; i >= 0; i--) {
        const particula = game.particulasBoid[i];
        
        // Resetear flag de atracción si está muy lejos de la nave (distancia toroidal)
        if (game.jugador && game.jugador.active) {
            const distancia = game.distanciaToroidal(particula.x, particula.y, game.jugador.x, game.jugador.y);
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
        
        // Las atraídas ignoran el enjambre, por eso no necesitan buscar vecinos.
        contextoVecinos.cantidad = particula.siendoAtraida
            ? 0
            : _obtenerCeldasVecinas(grilla, particula, cellSize, celdasVecinas);

        // Actualizar comportamiento Boid (enjambre, fuga y rebote).
        particula.actualizar(
            delta,
            contextoVecinos,
            game.jugador,
            game.enemigosNaves,
            game.enemigos,
            game.mundoAncho,
            game.mundoAlto
        );
        
        // Reciclado: si está demasiado lejos de la NAVE por más de 5 s, traerla
        // de vuelta cerca (con cámara, se mide distancia al jugador, no a la pantalla).
        const fueraDeLosBordes = game.jugador &&
            game.distanciaToroidal(particula.x, particula.y, game.jugador.x, game.jugador.y) > limiteRecycle;

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
        const disponibles = CONFIG.BOIDS.MAX_PARTICULAS - game.particulasBoid.length;
        const cantidad = Math.min(CONFIG.BOIDS.SPAWN_BATCH, disponibles);
        for (let i = 0; i < cantidad; i++) {
            const nuevaParticula = crearParticulaFuera(game);
            game.particulasBoid.push(nuevaParticula);
            nuevaParticula.render(game.mundo);
        }
    }
    
    // Actualizar todas las partículas
    actualizarParticulasBoid(game, delta);
}
