/**
 * GameProjectiles - Módulo de gestión de proyectiles del jugador
 *
 * Este archivo contiene funciones relacionadas con la creación y actualización
 * de proyectiles disparados por el jugador.
 *
 * Funciones exportadas:
 * - crearProyectil: Crea un nuevo proyectil desde la posición del jugador
 * - actualizarProyectiles: Actualiza todos los proyectiles en pantalla
 */

import { Proyectil } from '../entidades/Projectile.js';
import { Enemigo } from '../entidades/Enemy.js';
import { SpecialEnemy } from '../entidades/SpecialEnemy.js';
import { AsteroidExplosion } from '../efectosVisuales/AsteroidExplosion.js';
import { ProyectilExplosion } from '../efectosVisuales/ProyectilExplosion.js';
import { HitEffect } from '../efectosVisuales/HitEffect.js';
import { BoidParticle } from '../efectosVisuales/BoidParticle.js';
import { soltarParticulasEn } from './GameBoids.js';

function contarAsteroidesActivos(game) {
    return (game.enemigos || []).reduce((total, item) => total + (item && item.active ? 1 : 0), 0);
}

function hayLugarParaAsteroide(game) {
    const max = game.maximoEnemigos || 30;
    return contarAsteroidesActivos(game) < max;
}

/** Indica si la animación PNG de explosión está disponible. */
function hayTexturasExplosion(texturas) {
    return Array.isArray(texturas) && texturas.length > 0 && texturas[0];
}

// NOTA: la creación de proyectiles del jugador vive en Game.crearProyectil()
// (Game.js), que además aplica el bonus de daño de las mejoras. Antes había acá
// un `crearProyectil` exportado que nunca se usaba (y encima no importaba la clase
// Proyectil, así que habría dado ReferenceError si se llamaba): eliminado.

/**
 * Actualiza todos los proyectiles del jugador
 * Función auxiliar de Game.js — se llama cada frame desde el game loop
 *
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarProyectiles(game, delta) {
    if (!game.proyectiles || game.proyectiles.length === 0) {
        return;
    }

    // Actualizar proyectiles del jugador (de atrás hacia adelante para poder eliminar)
    for (let i = game.proyectiles.length - 1; i >= 0; i--) {
        const projectile = game.proyectiles[i];

        // Si el proyectil ya no está activo, eliminarlo
        if (!projectile || !projectile.active) {
            game.proyectiles.splice(i, 1);
            continue;
        }

        // Actualizar posición y velocidad
        projectile.update(delta);

        // Verificar si el proyectil salió del MUNDO (no de la pantalla): la nave
        // y sus disparos están en coords de mundo, que caen fuera de la pantalla.
        if (projectile.x < -50 || projectile.x > game.mundoAncho + 50 ||
            projectile.y < -50 || projectile.y > game.mundoAlto + 50) {

            // Destruir el proyectil
            if (projectile.destroy) {
                projectile.destroy();
            }
            game.proyectiles.splice(i, 1);
            continue;
        }

        // Sincronizar sprite con posición lógica
        if (projectile.imagen) {
            projectile.imagen.x = projectile.x;
            projectile.imagen.y = projectile.y;
            projectile.imagen.rotation = projectile.rotacion;
        }
    }
}

/**
 * Actualiza los proyectiles del jugador
 * Función completa para Game.js
 *
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarProyectilesJugador(game, delta) {
    if (!game.proyectiles || !Array.isArray(game.proyectiles)) {
        return;
    }
    
    for (let i = game.proyectiles.length - 1; i >= 0; i--) {
        const projectile = game.proyectiles[i];
        projectile.update(delta);

        // Si el proyectil ya no está activo, removerlo
        if (!projectile.active) {
            const projVisual = projectile.imagen || projectile.sprite;
            if (projVisual && projVisual.parent) {
                projVisual.parent.removeChild(projVisual);
            }
            game.proyectiles.splice(i, 1);
        }
    }
}

/**
 * Actualiza los proyectiles enemigos
 * Función completa para Game.js
 *
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarProyectilesEnemigos(game, delta) {
    if (!game.proyectilesEnemigos) return;

    for (let i = game.proyectilesEnemigos.length - 1; i >= 0; i--) {
        const proj = game.proyectilesEnemigos[i];
        proj.update(delta);

        // Verificar colisión con asteroides
        for (let j = game.enemigos.length - 1; j >= 0; j--) {
            const ast = game.enemigos[j];
            if (!ast.active) continue;

            if (game._verificarColision(proj, ast)) {
                proj.active = false;

                // Destruir asteroide (SIN puntos para el jugador) — explosión roja
                const escala = ast.radio / 64;
                const explosion = new AsteroidExplosion(
                    ast.x, ast.y,
                    game.texturaExplosionAsteroide,
                    escala * 0.35
                );
                explosion.render(game.mundo);
                game.efectosImpacto.push(explosion);

                ast.destroy();
                game.enemigos.splice(j, 1);
                break;
            }
        }

        if (!proj.active) {
            const projVisual = proj.imagen || proj.sprite;
            if (projVisual && projVisual.parent) {
                projVisual.parent.removeChild(projVisual);
            }
            game.proyectilesEnemigos.splice(i, 1);
        }
    }
}

/**
 * Procesa colisiones de proyectiles (aliados con enemigos y proyectiles enemigos)
 * Función completa para Game.js
 *
 * @param {Game} game - Referencia al objeto Game principal
 */
export function procesarColisionesProyectiles(game) {
    // Verificar colisión entre proyectiles aliados y enemigos
    if (game.proyectiles && game.proyectiles.length > 0 &&
        game.proyectilesEnemigos && game.proyectilesEnemigos.length > 0) {

        for (let i = game.proyectiles.length - 1; i >= 0; i--) {
            const projectile = game.proyectiles[i];
            if (!projectile || !projectile.active) continue;

            for (let j = game.proyectilesEnemigos.length - 1; j >= 0; j--) {
                const projEnemigo = game.proyectilesEnemigos[j];
                if (!projEnemigo || !projEnemigo.active) continue;

                if (game._verificarColision(projectile, projEnemigo)) {
                    const explosion = new ProyectilExplosion(projectile.x, projectile.y, game.texturaExplosion);
                    explosion.render(game.mundo);
                    game.efectosImpacto.push(explosion);

                    projectile.destroy();
                    game.proyectiles.splice(i, 1);
                    projEnemigo.destroy();
                    game.proyectilesEnemigos.splice(j, 1);
                    break;
                }
            }
        }
    }

    // Proyectiles aliados con enemigos especiales
    for (let i = game.proyectiles.length - 1; i >= 0; i--) {
        const projectile = game.proyectiles[i];
        if (!projectile || !projectile.active) continue;

        for (let j = game.enemigosSpeciales.length - 1; j >= 0; j--) {
            const especial = game.enemigosSpeciales[j];
            if (!especial || !especial.active) continue;

            // Mini especiales (enOrbita) son atravesados por proyectiles aliados
            if (especial.enOrbita) continue;

            if (game._verificarColision(projectile, especial)) {
                const explocion = new ProyectilExplosion(especial.x, especial.y, game.texturaExplosion);
                explocion.render(game.mundo);
                game.efectosImpacto.push(explocion);

                especial.salud -= projectile.dano;
                
                // Efectos de impacto visual
                const hit = new HitEffect(especial.x, especial.y, 'hit', 1.5);
                hit.render(game.mundo);
                game.efectosImpacto.push(hit);

                if (especial.salud <= 0) {
                    // DESTRUIR: crear 1 mini especial orbitando (SIN power-up)
                    game.puntuacion += especial.puntos || 100;
                    game.asteroidesDestruidos++;
                    
                    // Crear 1 mini especial orbitando
                    const angulo = Math.random() * Math.PI * 2;
                    const xMini = game.jugador.x + Math.cos(angulo) * 130;
                    const yMini = game.jugador.y + Math.sin(angulo) * 130;
                    
                    const mini = new SpecialEnemy(xMini, yMini, game.jugador, game.texturaAsteroideSpecial, game.mundoAncho, game.mundoAlto, true);
                    mini.enOrbita = true;
                    mini.indiceOrbita = 0;
                    mini.render(game.mundo);
                    game.enemigosSpeciales.push(mini);

                    especial.destroy();
                    game.enemigosSpeciales.splice(j, 1);
                    // Destrucción del asteroide especial: usa la explosión de las naves
                    if (game.gestorSonido) game.gestorSonido.reproducir('destruccionNave');
                }

                projectile.destroy();
                game.proyectiles.splice(i, 1);
                break;
            }
        }
    }

    // Proyectiles aliados con enemigos
    for (let i = game.proyectiles.length - 1; i >= 0; i--) {
        const projectile = game.proyectiles[i];
        if (!projectile || !projectile.active) continue;

        for (let j = game.enemigos.length - 1; j >= 0; j--) {
            const enemy = game.enemigos[j];
            if (!enemy.active) continue;

            if (game._verificarColision(projectile, enemy)) {
                const explocion = new ProyectilExplosion(enemy.x, enemy.y, game.texturaExplosion);
                explocion.render(game.mundo);
                game.efectosImpacto.push(explocion);

                // Daño normal a enemigos
                const newAsteroids = enemy.recibirDano(projectile.dano);

                // Si sobrevivió, mostrar solamente el impacto pequeño. Cuando se
                // destruye, la animación PNG de abajo reemplaza este efecto.
                if (enemy.active) {
                    const hit = new HitEffect(enemy.x, enemy.y, 'hit', 2);
                    hit.render(game.mundo);
                    game.efectosImpacto.push(hit);
                }

                for (const nuevoEnemigo of newAsteroids) {
                    if (!hayLugarParaAsteroide(game)) break;
                    nuevoEnemigo.render(game.mundo);
                    game.enemigos.push(nuevoEnemigo);
                }

                if (!enemy.active) {
                    game.puntuacion += enemy.puntos;
                    game.asteroidesDestruidos++;

                    if (game.jugador) {
                        game.jugador.agregarCargaUlti(enemy.cargaUlti || 10);
                    }

                    if (enemy.tamanio !== 'special') {
                        let escalaAnim = 0.24;
                        if (enemy.tamanio === 'medium') escalaAnim = 0.42;
                        else if (enemy.tamanio === 'large') escalaAnim = 0.84;
                        else if (enemy.tamanio === 'large_rezagado') escalaAnim = 0.84;
                        else if (enemy.tamanio === 'medium_rezagado') escalaAnim = 0.42;
                        else if (enemy.tamanio === 'small_rezagado') escalaAnim = 0.24;

                        if (hayTexturasExplosion(game.texturaExplosionAsteroide)) {
                            const astroExplosion = new AsteroidExplosion(enemy.x, enemy.y, game.texturaExplosionAsteroide, escalaAnim);
                            astroExplosion.render(game.mundo);
                            game.efectosExplosion.push(astroExplosion);
                        } else {
                            // Fallback antiguo: partículas procedurales solo si no
                            // se pudo cargar la animación PNG de destrucción.
                            const tipoFallback = newAsteroids.length > 0 ? 'fragment' : 'explosion';
                            const escalaFallback = newAsteroids.length > 0 ? 4 : 2;
                            const fallback = new HitEffect(enemy.x, enemy.y, tipoFallback, escalaFallback, 0xCC0000);
                            fallback.render(game.mundo);
                            game.efectosImpacto.push(fallback);
                        }

                        // Soltar partículas Boid donde se destruyó el asteroide
                        // (más cuanto más grande). El jugador las recolecta con el Devorador (E).
                        const cantParticulas = (enemy.tamanio === 'large' || enemy.tamanio === 'large_rezagado') ? 3
                            : (enemy.tamanio === 'medium' || enemy.tamanio === 'medium_rezagado') ? 2 : 1;
                        soltarParticulasEn(game, enemy.x, enemy.y, cantParticulas);
                    }

                    // Manejar SpecialEnemy
                    if (enemy.tamanio === 'special') {
                        for (let k = 0; k < 5 && hayLugarParaAsteroide(game); k++) {
                            const angulo = Math.random() * Math.PI * 2;
                            const velocidad = 50 + Math.random() * 100;
                            const xMini = enemy.x + Math.cos(angulo) * 20;
                            const yMini = enemy.y + Math.sin(angulo) * 20;

                            const mini = new Enemigo(xMini, yMini, 'small', game.jugador, game.texturaAsteroide, null, false, game.mundoAncho, game.mundoAlto);
                            mini.velX = Math.cos(angulo) * velocidad;
                            mini.velY = Math.sin(angulo) * velocidad;
                            mini.puntos = 20;
                            mini.cargaUlti = 5;
                            mini.render(game.mundo);
                            game.enemigos.push(mini);
                        }
                    }

                    enemy.destroy();
                    game.enemigos.splice(j, 1);

                    if (game.asteroidesDestruidos >= game.objetivoOleada) {
                        game.contadorOleadas++;
                        game.asteroidesDestruidos = 0;
                        game.objetivoOleada = 10 + (game.contadorOleadas * 10);
                        if (game.intervaloSpawn > game.intervaloMinimoSpawn) {
                            game.intervaloSpawn = Math.max(game.intervaloMinimoSpawn, game.intervaloSpawn - game.tasaDisminucionSpawn);
                        }
                    }
                }

                projectile.destroy();
                game.proyectiles.splice(i, 1);
                break;
            }
        }
    }

    // === PROYECTILES ALIADOS CON NAVES ENEMIGAS ===
    if (game.enemigosNaves && game.enemigosNaves.length > 0) {
        for (let i = game.proyectiles.length - 1; i >= 0; i--) {
            const projectile = game.proyectiles[i];
            if (!projectile || !projectile.active) continue;

            for (let k = game.enemigosNaves.length - 1; k >= 0; k--) {
                const naveEnemiga = game.enemigosNaves[k];
                if (!naveEnemiga || !naveEnemiga.active) continue;

                // Verificar colisión
                if (game._verificarColision(projectile, naveEnemiga)) {
                    // Efecto visual de impacto
                    const hit = new HitEffect(naveEnemiga.x, naveEnemiga.y, 'hit', 2);
                    hit.render(game.mundo);
                    game.efectosImpacto.push(hit);

                    // Aplicar daño a la nave enemiga
                    const destruida = naveEnemiga.recibirDano(projectile.dano);

                    // Destruir proyectil
                    projectile.destroy();
                    game.proyectiles.splice(i, 1);

                    // Si la nave fue destruida
                    if (destruida) {
                        // Animación de destrucción (verde para naves)
                        const naveExplosion = new AsteroidExplosion(
                            naveEnemiga.x, naveEnemiga.y,
                            game.texturaExplosionNave,
                            0.5
                        );
                        naveExplosion.render(game.mundo);
                        game.efectosImpacto.push(naveExplosion);

                        // Sumar puntos
                        game.puntuacion += 500;
                        game.asteroidesDestruidos++;

                        // Agregar carga ULTi
                        if (game.jugador) {
                            game.jugador.agregarCargaUlti(naveEnemiga.cargaUlti || 10);
                        }

                        // Eliminar la nave de la lista
                        game.enemigosNaves.splice(k, 1);
                    }

                    break; // El proyectil ya se usó
                }
            }
        }
    }
}
