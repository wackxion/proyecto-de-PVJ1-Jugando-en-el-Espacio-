/**
 * GameSkills - Módulo de gestión de habilidades del jugador
 * 
 * Este archivo contiene funciones relacionadas con las habilidades:
 * - Cohetes (Q): Lanzar 2 cohetes hacia los enemigos más cercanos
 * - Devorador (E): Atrae partículas Boid hacia el jugador
 * - Propulsor (R): Dash hacia adelante
 *
 * La pasiva Tiempo Fuera y el estado visual de los marcos del HUD los maneja
 * PixiHUD.js (lee el estado del juego directamente cada frame).
 *
 * Funciones exportadas principales:
 * - actualizarHabilidadCohetes / actualizarHabilidadDevorador / actualizarHabilidadPropulsor
 * - crearCohetes: Crea los cohetes hacia los enemigos cercanos
 */

import { Cohete } from '../mecanicas/Cohete.js';
import { SuccionEffect } from '../efectosVisuales/SuccionEffect.js';
import { AsteroidExplosion } from '../efectosVisuales/AsteroidExplosion.js';
import { SpecialEnemy } from '../entidades/SpecialEnemy.js';
import { CONFIG } from '../../config.js';

/**
 * Encuentra los N enemigos más cercanos al jugador
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} cantidad - Número de enemigos a encontrar
 * @returns {Array} Array de enemigos ordenados por distancia
 */
export function encontrarEnemigosCercanos(game, cantidad) {
    if (!game.jugador || !game.jugador.active) {
        return [];
    }
    
    const todosEnemigos = [
        ...game.enemigos,
        ...game.enemigosNaves,
        ...game.enemigosSpeciales
    ].filter(e => e && e.active && !e.enOrbita); // Excluir mini especiales
    
    // Ordenar por distancia al jugador
    todosEnemigos.sort((a, b) => {
        const dxA = a.x - game.jugador.x;
        const dyA = a.y - game.jugador.y;
        const distA = Math.sqrt(dxA * dxA + dyA * dyA);
        
        const dxB = b.x - game.jugador.x;
        const dyB = b.y - game.jugador.y;
        const distB = Math.sqrt(dxB * dxB + dyB * dyB);
        
        return distA - distB;
    });
    
    return todosEnemigos.slice(0, cantidad);
}

/**
 * Crear cohetes hacia los enemigos más cercanos
 * Función completa para manejar la habilidad Q
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarHabilidadCohetes(game, delta) {
    // Crear nuevos cohetes si se presiona Q
    if (game.gestorEntrada && game.gestorEntrada.debeUsarCohetes(delta)) {
        if (game.jugador && game.jugador.active && game.texturaCohete) {
            crearCohetes(game);
        }
    }

    // Actualizar cohetes activos
    actualizarCohetes(game, delta);
}

/**
 * Crea los cohetes hacia los enemigos más cercanos
 * Función auxiliar para Game.js - líneas 2785-2804
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function crearCohetes(game) {
    if (!game.jugador || !game.jugador.active || !game.texturaCohete) {
        return;
    }
    
    // Encontrar los 2 enemigos más cercanos
    const enemigosCercanos = encontrarEnemigosCercanos(game, CONFIG.HABILIDADES.COHETES_CANTIDAD + (game.mejoraCohetesExtra || 0));
    
    let algunoLanzado = false;
    for (const enemigo of enemigosCercanos) {
        if (enemigo && enemigo.active) {
            const cohete = new Cohete(
                game.jugador.x,
                game.jugador.y,
                enemigo,
                game.texturaCohete
            );
            // Tamaño del mundo para el homing toroidal (persigue por el camino corto).
            cohete.mundoAncho = game.mundoAncho;
            cohete.mundoAlto = game.mundoAlto;
            cohete.render(game.mundo);
            game.cohetes.push(cohete);
            algunoLanzado = true;
        }
    }

    // Sonido de lanzamiento (una sola vez por activación, si se lanzó algún cohete)
    if (algunoLanzado && game.gestorSonido) {
        game.gestorSonido.reproducir('cohetes');
    }
}

/**
 * Actualiza los cohetes activos
 * Función auxiliar para Game.js - líneas 2853-2953
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarCohetes(game, delta) {
    if (!game.cohetes || !Array.isArray(game.cohetes)) {
        return;
    }
    
    for (let i = game.cohetes.length - 1; i >= 0; i--) {
        const cohete = game.cohetes[i];
        
        if (!cohete.active) {
            game.cohetes.splice(i, 1);
            continue;
        }
        
        // Actualizar movimiento
        cohete.update(delta);
        
        let impacto = false;
        
        // Verificar colisión con objetivo actual
        if (cohete.verificarColision()) {
            impacto = true;
        }
        
        // Si no hay colisión con el objetivo, verificar otros enemigos
        if (!impacto) {
            // Verificar asteroides
            for (const enemigo of game.enemigos) {
                if (!enemigo.active || !enemigo.x || !enemigo.y) continue;
                if (cohete.objetivo === enemigo) continue;
                
                const dx = cohete.x - enemigo.x;
                const dy = cohete.y - enemigo.y;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                
                const radioAst = enemigo.radio || 32;
                if (distancia < (12 + radioAst)) {
                    cohete.objetivo = enemigo;
                    impacto = true;
                    break;
                }
            }
        }
        
        if (!impacto) {
            // Verificar naves enemigas
            for (const nave of game.enemigosNaves) {
                if (!nave.active || !nave.x || !nave.y) continue;
                
                const dx = cohete.x - nave.x;
                const dy = cohete.y - nave.y;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                
                const radioNave = nave.radio || 20;
                if (distancia < (15 + radioNave)) {
                    cohete.objetivo = nave;
                    impacto = true;
                    break;
                }
            }
        }

        if (!impacto) {
            // Verificar enemigos especiales (PERO NO los mini que orbitan)
            for (const especial of game.enemigosSpeciales) {
                if (!especial.active || !especial.x || !especial.y) continue;
                // Los mini especiales tienen enOrbita = true, no les hacen daño
                if (especial.enOrbita) continue;
                
                const dx = cohete.x - especial.x;
                const dy = cohete.y - especial.y;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                
                const radioEspecial = especial.radio || 40;
                if (distancia < (15 + radioEspecial)) {
                    cohete.objetivo = especial;
                    impacto = true;
                    break;
                }
            }
        }
        
        // Si hubo impacto, destruir objetivo y cohete
        if (impacto && cohete.objetivo && cohete.objetivo.active) {
            const objetivo = cohete.objetivo;
            
            // Crear explosión según el objetivo:
            //  - NAVE      → verde (la explosión común de naves, igual que al dispararle)
            //  - ESPECIAL  → asset azul (viejo, tintado)
            //  - ASTEROIDE → roja
            const escala = (objetivo.radio || 32) / 64;
            const esObjetivoEspecial = game.enemigosSpeciales.includes(objetivo);
            const esNave = game.enemigosNaves.includes(objetivo);
            let texturaExpl, tinteExpl, escalaExpl;
            if (esNave) {
                texturaExpl = game.texturaExplosionNave; tinteExpl = null; escalaExpl = 0.5;
            } else if (esObjetivoEspecial) {
                texturaExpl = game.texturaAsteroidExplosion; tinteExpl = 0x0000FF; escalaExpl = escala * 0.5;
            } else {
                texturaExpl = game.texturaExplosionAsteroide; tinteExpl = null; escalaExpl = escala * 0.5;
            }
            const explosion = new AsteroidExplosion(objetivo.x, objetivo.y, texturaExpl, escalaExpl, tinteExpl);
            explosion.render(game.mundo);
            game.efectosImpacto.push(explosion);

            // Sonido de destrucción por cohete: nave y especial → explosión de nave;
            // asteroide común → sonido de meteorito.
            if (game.gestorSonido) {
                const usaSonidoNave = esNave || esObjetivoEspecial;
                game.gestorSonido.reproducir(usaSonidoNave ? 'destruccionNave' : 'destruccionMeteorito');
            }

            // Agregar puntos, carga Ulti y actualizar contador de oleada
            game.puntuacion += objetivo.puntos || 10;
            game.jugador.agregarCargaUlti(objetivo.cargaUlti || 10);
            game.asteroidesDestruidos++;

            // Actualizar oleada
            if (game.asteroidesDestruidos >= game.objetivoOleada) {
                game.contadorOleadas++;
                game.asteroidesDestruidos = 0;
                game.objetivoOleada = 10 + (game.contadorOleadas * 10);
                if (game.intervaloSpawn > game.intervaloMinimoSpawn) {
                    game.intervaloSpawn = Math.max(game.intervaloMinimoSpawn, game.intervaloSpawn - game.tasaDisminucionSpawn);
                }
            }

            // Si el objetivo es un asteroide ESPECIAL, hacer su EFECTO: generar 1
            // mini especial que orbita al jugador (igual que al destruirlo con un
            // proyectil). Antes el cohete solo lo destruía, sin este efecto.
            const esEspecial = game.enemigosSpeciales.includes(objetivo) && !objetivo.enOrbita;
            if (esEspecial) {
                const angulo = Math.random() * Math.PI * 2;
                const xMini = game.jugador.x + Math.cos(angulo) * 130;
                const yMini = game.jugador.y + Math.sin(angulo) * 130;
                const mini = new SpecialEnemy(xMini, yMini, game.jugador, game.texturaAsteroideSpecial, game.mundoAncho, game.mundoAlto, true);
                mini.enOrbita = true;
                mini.indiceOrbita = 0;
                mini.render(game.mundo);
                game.enemigosSpeciales.push(mini);
            }

            // Destruir objetivo
            if (objetivo.destroy) {
                objetivo.destroy();
            } else {
                objetivo.active = false;
                if (objetivo.imagen) {
                    objetivo.imagen.visible = false;
                    objetivo.imagen.parent?.removeChild(objetivo.imagen);
                }
            }
            if (esEspecial) {
                const idx = game.enemigosSpeciales.indexOf(objetivo);
                if (idx >= 0) game.enemigosSpeciales.splice(idx, 1);
            }

            // Destruir cohete
            cohete.destroy();
            game.cohetes.splice(i, 1);
            continue;
        }
        
        // Eliminar si está fuera del MUNDO (no de la pantalla): el cohete nace en
        // la posición de la nave en coords de mundo, que quedan fuera de la pantalla.
        if (cohete.x < -100 || cohete.x > game.mundoAncho + 100 ||
            cohete.y < -100 || cohete.y > game.mundoAlto + 100) {
            cohete.destroy();
            game.cohetes.splice(i, 1);
        }
    }
}

/**
 * Actualiza el devorador de partículas Boid (Tecla E)
 * Función completa para manejar la habilidad E
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 * @returns {boolean} true si el devorador se activó este frame
 */
export function actualizarHabilidadDevorador(game, delta) {
    // Verificar si se activa el devorador
    let devoradorActivadoAhora = false;
    if (game.gestorEntrada) {
        devoradorActivadoAhora = game.gestorEntrada.debeUsarDevorar(delta);
    }
    
    if (devoradorActivadoAhora && game.jugador && game.jugador.active) {
        game.efectoSuccion = new SuccionEffect(game.jugador.x, game.jugador.y, game.anchoJuego, game.altoJuego);
        game.efectoSuccion.render(game.mundo);

        // Sonido del devorador al activarse
        if (game.gestorSonido) game.gestorSonido.reproducir('devorador');

        const multDevorador = game.mejoraDevoradorMult || 1;
        const radioDevorar = CONFIG.HABILIDADES.DEVORADOR_RANGO * multDevorador;
        const velDevorar = CONFIG.HABILIDADES.DEVORADOR_VELOCIDAD * multDevorador;
        const _tor = !!(CONFIG.MUNDO && CONFIG.MUNDO.TOROIDAL);
        for (const particula of game.particulasBoid) {
            if (!particula.active) continue;
            // Delta hacia el jugador por el camino corto del toroide (así atrae
            // partículas que se ven cerca aunque estén del otro lado de la costura).
            let dx = game.jugador.x - particula.x;
            let dy = game.jugador.y - particula.y;
            if (_tor) { dx = game._wrapDelta(dx, game.mundoAncho); dy = game._wrapDelta(dy, game.mundoAlto); }
            const distancia = Math.sqrt(dx * dx + dy * dy);
            if (distancia < radioDevorar && distancia > 0) {
                particula.velX = (dx / distancia) * velDevorar;
                particula.velY = (dy / distancia) * velDevorar;
                particula.siendoAtraida = true;
            }
        }
    }
    
    actualizarSuccion(game, delta);
    return devoradorActivadoAhora;
}

/**
 * Actualiza el propulsor (Tecla R)
 * Función completa para manejar la habilidad R (dash)
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarHabilidadPropulsor(game, delta) {
    // Activar propulsor si se presiona R
    if (game.gestorEntrada && game.gestorEntrada.debeUsarPropulsor(delta)) {
        if (game.jugador && game.jugador.active) {
            game.jugador.activarPropulsor();
            if (game.gestorSonido) game.gestorSonido.reproducir('propulsor');
        }
    }
}

/**
 * Actualiza el efecto de succión del devorador
 * Función auxiliar para Game.js - líneas 2657-2669
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarSuccion(game, delta) {
    if (game.efectoSuccion && game.efectoSuccion.active) {
        // Mantener el efecto en la posición del jugador
        if (game.jugador && game.jugador.active) {
            game.efectoSuccion.x = game.jugador.x;
            game.efectoSuccion.y = game.jugador.y;
        }
        game.efectoSuccion.update(delta);
    } else if (game.efectoSuccion) {
        // Efecto terminado, destruirlo
        game.efectoSuccion.destroy();
        game.efectoSuccion = null;
    }
}

