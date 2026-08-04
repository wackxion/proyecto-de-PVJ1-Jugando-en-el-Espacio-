/**
 * GameEffects - Módulo de gestión de efectos visuales
 * 
 * Este archivo contiene funciones relacionadas con efectos visuales:
 * - Explosiones de proyectiles
 * - Efectos de impacto
 * - Efecto Ulti (ataque especial)
 * - Efecto de succión (Devorador)
 * - Explosiones de asteroides
 * 
 * Funciones exportadas:
 * - activarUlti: Activa el ataque especial
 * - verificarColisionesProyectiles: Verifica colisiones entre proyectiles
 * - verificarColisionesEnemigos: Verifica colisiones con enemigos
 */

import { ProyectilExplosion } from '../efectosVisuales/ProyectilExplosion.js';
import { HitEffect } from '../efectosVisuales/HitEffect.js';
import { UltiEffect } from '../efectosVisuales/UltiEffect.js';
import { AsteroidExplosion } from '../efectosVisuales/AsteroidExplosion.js';

/**
 * Activa el ataque especial (Ulti)
 * Función auxiliar para Game.js - líneas 910-962
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function activarUlti(game) {
    // Guardar referencia a "this" para usar dentro del callback
    const gameRef = game;
    
    // Crear el efecto visual del ulti
    game.efectoUlti = new UltiEffect(
        game.jugador.x,              // Posición X del jugador
        game.jugador.y,              // Posición Y del jugador
        game.anchoJuego,             // Ancho del juego
        game.altoJuego,              // Alto del juego
        game.enemigos,               // Lista de asteroides para destruir
        // Callback = función que se ejecuta cuando se destruye un asteroide
        function(enemy) {
            // Sumar puntos
            gameRef.puntuacion += enemy.puntos;
            
            // CONTAR para la oleada
            gameRef.asteroidesDestruidos++;
        },
        // Lista de naves enemigas
        game.enemigosNaves,
        // Callback cuando se destruye una nave enemiga
        function(nave) {
            gameRef.puntuacion += 500;
            gameRef.asteroidesDestruidos++;
            
            // Verificar si completamos la oleada
            if (gameRef.asteroidesDestruidos >= gameRef.objetivoOleada) {
                gameRef.contadorOleadas++;
                gameRef.asteroidesDestruidos = 0;
                
                // La siguiente oleada necesita 10 asteroides más
                gameRef.objetivoOleada = 10 + (gameRef.contadorOleadas * 10);
                
                // Reducir el intervalo de spawn
                if (gameRef.intervaloSpawn > gameRef.intervaloMinimoSpawn) {
                    gameRef.intervaloSpawn = Math.max(
                        gameRef.intervaloMinimoSpawn,
                        gameRef.intervaloSpawn - gameRef.tasaDisminucionSpawn
                    );
                }
            }
        },
        // Referencia al juego para crear animaciones
        game
    );
    
    // Renderizar el efecto
    game.efectoUlti.render(game.mundo);
}

/**
 * Actualiza el efecto Ulti
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarUlti(game, delta) {
    if (game.efectoUlti) {
        game.efectoUlti.update(delta);
        
        // Verificar si el efecto terminó
        if (!game.efectoUlti.active) {
            game.efectoUlti = null;
        }
    }
}

/**
 * Verifica colisiones entre proyectiles aliados y enemigos
 * Función auxiliar para Game.js - líneas 1408-1441
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function verificarColisionesProyectiles(game) {
    if (game.proyectiles && game.proyectiles.length > 0 && 
        game.proyectilesEnemigos && game.proyectilesEnemigos.length > 0) {
        
        for (let i = game.proyectiles.length - 1; i >= 0; i--) {
            const projectile = game.proyectiles[i];
            if (!projectile || !projectile.active) continue;
            
            // Verificar colisión con proyectiles enemigos
            for (let j = game.proyectilesEnemigos.length - 1; j >= 0; j--) {
                const projEnemigo = game.proyectilesEnemigos[j];
                if (!projEnemigo || !projEnemigo.active) continue;
                
                if (game._verificarColision(projectile, projEnemigo)) {
                    // Animación de colisión
                    const explosion = new ProyectilExplosion(
                        projectile.x, projectile.y,
                        game.texturaExplosion,
                        1.0
                    );
                    explosion.render(game.mundo);
                    game.efectosImpacto.push(explosion);
                    
                    // Destruir ambos proyectiles
                    projectile.destroy();
                    game.proyectiles.splice(i, 1);
                    
                    projEnemigo.destroy();
                    game.proyectilesEnemigos.splice(j, 1);
                    
                    break;
                }
            }
        }
    }
}

/**
 * Crea efecto de impacto de proyectil
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} tipo - Tipo de efecto ('hit' o 'fragment')
 * @param {number} escala - Escala del efecto
 * @param {number} color - Color del efecto (opcional)
 */
export function crearEfectoImpacto(game, x, y, tipo, escala, color) {
    const hit = new HitEffect(x, y, tipo, escala, color);
    hit.render(game.mundo);
    game.efectosImpacto.push(hit);
}

/**
 * Crea animación de destrucción de asteroide
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {Enemigo} enemy - Enemigo que fue destruido
 */
export function crearExplosionAsteroide(game, enemy) {
    if (enemy.tamanio !== 'special') {
        let escalaAnim = 0.24; // SMALL +20%
        if (enemy.tamanio === 'medium') {
            escalaAnim = 0.42;
        } else if (enemy.tamanio === 'large') {
            escalaAnim = 0.84;
        } else if (enemy.tamanio === 'large_rezagado') {
            escalaAnim = 0.84;
        } else if (enemy.tamanio === 'medium_rezagado') {
            escalaAnim = 0.42;
        } else if (enemy.tamanio === 'small_rezagado') {
            escalaAnim = 0.24;
        }
        
        const astroExplosion = new AsteroidExplosion(
            enemy.x, enemy.y,
            game.texturaExplosionAsteroide,
            escalaAnim
        );
        astroExplosion.render(game.mundo);
        game.efectosExplosion.push(astroExplosion);
    }
}

/**
 * Actualiza los efectos de impacto en pantalla
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarEfectosImpacto(game, delta) {
    if (!game.efectosImpacto || !Array.isArray(game.efectosImpacto)) {
        return;
    }
    
    for (let i = game.efectosImpacto.length - 1; i >= 0; i--) {
        const efecto = game.efectosImpacto[i];
        
        if (efecto.update) {
            efecto.update(delta);
        }
        
        // Eliminar si la animación terminó
        if (efecto.active === false) {
            if (efecto.imagen && efecto.imagen.parent) {
                efecto.imagen.parent.removeChild(efecto.imagen);
            }
            game.efectosImpacto.splice(i, 1);
        }
    }
    
    // Actualizar efectos de explosión
    if (!game.efectosExplosion || !Array.isArray(game.efectosExplosion)) {
        return;
    }
    
    for (let i = game.efectosExplosion.length - 1; i >= 0; i--) {
        const explosion = game.efectosExplosion[i];
        
        if (explosion.update) {
            explosion.update(delta);
        }
        
        if (explosion.active === false) {
            if (explosion.imagen && explosion.imagen.parent) {
                explosion.imagen.parent.removeChild(explosion.imagen);
            }
            game.efectosExplosion.splice(i, 1);
        }
    }
}