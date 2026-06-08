/**
 * GameSkills - Módulo de gestión de habilidades del jugador
 * 
 * Este archivo contiene funciones relacionadas con las habilidades:
 * - Cohetes (Q): Lanzar 2 cohetes hacia los enemigos más cercanos
 * - Devorador (E): Atrae partículas Boid hacia el jugador
 * - Propulsor (R): Dash hacia adelante
 * - Tiempo Fuera (Pasiva): Se activa con sobrecalentamiento
 * 
 * Funciones exportadas:
 * - actualizarHabilidades: Maneja todas las habilidades
 * - crearCohetes: Crea los cohetes hacia los enemigos cercanos
 * - activarDevorador: Activa el efecto de succión de partículas
 * - activarPropulsor: Activa el dash del jugador
 */

import { Cohete } from '../mecanicas/Cohete.js';
import { SuccionEffect } from '../efectosVisuales/SuccionEffect.js';
import { AsteroidExplosion } from '../efectosVisuales/AsteroidExplosion.js';
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
    
    // Actualizar UI del marco
    actualizarUIMarcoCohetes(game);
    
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
    const enemigosCercanos = encontrarEnemigosCercanos(game, CONFIG.HABILIDADES.COHETES_CANTIDAD);
    
    for (const enemigo of enemigosCercanos) {
        if (enemigo && enemigo.active) {
            const cohete = new Cohete(
                game.jugador.x,
                game.jugador.y,
                enemigo,
                game.texturaCohete
            );
            cohete.render(game.aplicacion.stage);
            game.cohetes.push(cohete);
        }
    }
}

/**
 * Actualiza el estado visual del marco de cohetes según el cooldown
 * Función auxiliar para Game.js - líneas 2807-2824
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function actualizarUIMarcoCohetes(game) {
    if (!game.marcoCohetesUX || !game.fondoCohetesUX) {
        return;
    }
    
    const cooldownCohetes = game.gestorEntrada ? game.gestorEntrada.obtenerCooldownCohetes() : 0;
    
    if (cooldownCohetes > 0) {
        // En cooldown - ROJO
        game.marcoCohetesUX.style.borderColor = '#CC0000';
        game.marcoCohetesUX.style.boxShadow = '0 0 15px #CC0000';
        game.fondoCohetesUX.style.borderColor = '#CC0000';
        game.fondoCohetesUX.style.boxShadow = '0 0 15px #CC0000';
    } else {
        // Listo - AZUL
        game.marcoCohetesUX.style.borderColor = '#0044CC';
        game.marcoCohetesUX.style.boxShadow = '0 0 10px #0044CC';
        game.fondoCohetesUX.style.borderColor = '#0044CC';
        game.fondoCohetesUX.style.boxShadow = '0 0 10px #0044CC';
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
            
            // Crear explosión
            const escala = (objetivo.radio || 32) / 64;
            const explosion = new AsteroidExplosion(
                objetivo.x, objetivo.y,
                game.texturaAsteroidExplosion,
                escala * 0.5
            );
            explosion.render(game.aplicacion.stage);
            game.efectosImpacto.push(explosion);
            
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
            
            // Destruir cohete
            cohete.destroy();
            game.cohetes.splice(i, 1);
            continue;
        }
        
        // Eliminar si está fuera de pantalla
        if (cohete.x < -100 || cohete.x > game.anchoJuego + 100 ||
            cohete.y < -100 || cohete.y > game.altoJuego + 100) {
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
        game.efectoSuccion.render(game.aplicacion.stage);
        
        const radioDevorar = CONFIG.HABILIDADES.DEVORADOR_RANGO;
        for (const particula of game.particulasBoid) {
            if (!particula.active) continue;
            const dx = game.jugador.x - particula.x;
            const dy = game.jugador.y - particula.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            if (distancia < radioDevorar && distancia > 0) {
                particula.velX = (dx / distancia) * CONFIG.HABILIDADES.DEVORADOR_VELOCIDAD;
                particula.velY = (dy / distancia) * CONFIG.HABILIDADES.DEVORADOR_VELOCIDAD;
                particula.siendoAtraida = true;
            }
        }
    }
    
    actualizarSuccion(game, delta);
    actualizarUIMarcoDevorador(game, devoradorActivadoAhora);
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
        }
    }
    
    // Actualizar UI del marco
    actualizarUIMarcoPropulsor(game);
}

/**
 * Activa el devorador de partículas Boid
 * Función auxiliar para Game.js - líneas 2621-2655
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function activarDevorador(game) {
    if (!game.jugador || !game.jugador.active) {
        return;
    }
    
    // Crear efecto de succión (visual)
    game.efectoSuccion = new SuccionEffect(
        game.jugador.x,
        game.jugador.y,
        game.anchoJuego,
        game.altoJuego
    );
    game.efectoSuccion.render(game.aplicacion.stage);
    
    // Atraer partículas dentro de 200px hacia la nave
    const radioDevorar = 200;
    for (const particula of game.particulasBoid) {
        if (!particula.active) continue;
        
        const dx = game.jugador.x - particula.x;
        const dy = game.jugador.y - particula.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < radioDevorar && distancia > 0) {
            // Forzar a la partícula a ir directamente a la nave
            particula.velX = (dx / distancia) * CONFIG.HABILIDADES.DEVORADOR_VELOCIDAD;
            particula.velY = (dy / distancia) * CONFIG.HABILIDADES.DEVORADOR_VELOCIDAD;
            particula.siendoAtraida = true;
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

/**
 * Actualiza el marco visual del devorador según el cooldown
 * Función auxiliar para Game.js - líneas 2671-2694
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {boolean} devoradorActivadoAhora - Si el devorador se activó este frame
 */
export function actualizarUIMarcoDevorador(game, devoradorActivadoAhora) {
    if (!game.marcoDeboradorUX || !game.fondoDeboradorUX) {
        return;
    }
    
    const cooldownActual = game.gestorEntrada ? game.gestorEntrada.obtenerCooldownDevorar() : 0;
    
    if (devoradorActivadoAhora || cooldownActual > 4.5) {
        // Activo o reciente - ROJO BRILLANTE
        game.marcoDeboradorUX.style.borderColor = '#FF0000';
        game.marcoDeboradorUX.style.boxShadow = '0 0 20px #FF0000';
        game.fondoDeboradorUX.style.borderColor = '#FF0000';
        game.fondoDeboradorUX.style.boxShadow = '0 0 20px #FF0000';
    } else if (cooldownActual > 0) {
        // En cooldown - ROJO OSCURO
        game.marcoDeboradorUX.style.borderColor = '#CC0000';
        game.marcoDeboradorUX.style.boxShadow = '0 0 15px #CC0000';
        game.fondoDeboradorUX.style.borderColor = '#CC0000';
        game.fondoDeboradorUX.style.boxShadow = '0 0 15px #CC0000';
    } else {
        // Listo - AZUL
        game.marcoDeboradorUX.style.borderColor = '#0044CC';
        game.marcoDeboradorUX.style.boxShadow = '0 0 10px #0044CC';
        game.fondoDeboradorUX.style.borderColor = '#0044CC';
        game.fondoDeboradorUX.style.boxShadow = '0 0 10px #0044CC';
    }
}

/**
 * Activa el propulsor (dash)
 * Función auxiliar para Game.js - líneas 2826-2832
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function activarPropulsor(game) {
    if (!game.jugador || !game.jugador.active) {
        return;
    }
    
    game.jugador.activarPropulsor();
}

/**
 * Actualiza el marco visual del propulsor según el cooldown
 * Función auxiliar para Game.js - líneas 2834-2851
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function actualizarUIMarcoPropulsor(game) {
    if (!game.marcoPropulUX || !game.fondoPropulUX) {
        return;
    }
    
    const cooldownPropulsor = game.gestorEntrada ? game.gestorEntrada.obtenerCooldownPropulsor() : 0;
    
    if (cooldownPropulsor > 0) {
        // En cooldown - ROJO
        game.marcoPropulUX.style.borderColor = '#CC0000';
        game.marcoPropulUX.style.boxShadow = '0 0 15px #CC0000';
        game.fondoPropulUX.style.borderColor = '#CC0000';
        game.fondoPropulUX.style.boxShadow = '0 0 15px #CC0000';
    } else {
        // Listo - AZUL
        game.marcoPropulUX.style.borderColor = '#0044CC';
        game.marcoPropulUX.style.boxShadow = '0 0 10px #0044CC';
        game.fondoPropulUX.style.borderColor = '#0044CC';
        game.fondoPropulUX.style.boxShadow = '0 0 10px #0044CC';
    }
}

/**
 * Actualiza el habilidad pasiva Tiempo Fuera (sobrecalentamiento)
 * Función auxiliar para Game.js - líneas 2696-2784
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarTiempoFuera(game, delta) {
    if (!game.marcoTiempoUX || !game.fondoTiempoUX) {
        return;
    }
    
    // Activar habilidad cuando entra en sobrecalentamiento (solo una vez)
    if (game.jugador && game.jugador.sobrecalentado && !game.tiempoFueroActivo) {
        game.tiempoFueroActivo = true;
        game.timerTiempoFuera = 0;
    }
    
    // Verificar si pasaron los 10 segundos de duración (aunque ya no esté sobrecalentado)
    if (game.tiempoFueroActivo) {
        game.timerTiempoFuera += delta;
        
        if (game.timerTiempoFuera >= game.duracionTiempoFuera) {
            // Al terminar: regenerar 10 escudos + bonus de mejoras (indices 20-24)
            const regeneracionBase = CONFIG.HABILIDADES.TIEMPO_FUERA_REGENERACION;
            const regeneracionBonus = game.regeneracionTiempoFueraBonus || 0;
            game.jugador.agregarEscudos(regeneracionBase + regeneracionBonus);
            
            // Desactivar habilidad
            game.tiempoFueroActivo = false;
            game.timerTiempoFuera = 0;
            game.relojFrameActual = 1;
            game.timerAnimacionReloj = 0;
            return;
        }
    }
    
    // Si está sobrecalentado y la habilidad está activa, mostrar animación
    if (game.jugador && game.jugador.sobrecalentado && game.tiempoFueroActivo) {
        const tiempo = Date.now();
        const palpito = Math.floor(tiempo / 300) % 2 === 0;
        
        // === ANIMACIÓN DEL RELOJ (siempre durante sobrecalentamiento) ===
        if (game.iconoTiempoUX) {
            game.timerAnimacionReloj += delta;
            
            if (game.timerAnimacionReloj >= game.intervaloAnimacionReloj) {
                game.timerAnimacionReloj = 0;
                
                // Secuencia: 1,2,3,4,5,6,6(girado),1,2,3...
                game.relojFrameActual++;
                
                // Si pasamos de 7, volver a 1
                if (game.relojFrameActual > 7) {
                    game.relojFrameActual = 1;
                }
                
                // Actualizar textura del icono (usar URL string como el código original)
                if (game.relojFrameActual === 7) {
                    // Segundo 6 con giro 360°
                    if (game.iconoTiempoUX) {
                        game.iconoTiempoUX.src = 'assets/relog6.png';
                        game.iconoTiempoUX.style.transform = 'rotate(360deg)';
                    }
                } else {
                    // Frames 1-6 sin giro
                    if (game.iconoTiempoUX) {
                        game.iconoTiempoUX.src = `assets/relog${game.relojFrameActual}.png`;
                        game.iconoTiempoUX.style.transform = 'rotate(0deg)';
                    }
                }
            }
        }
        
        // Animación de parpadeo del marco (blanco)
        if (palpito) {
            game.marcoTiempoUX.style.borderColor = '#FFFFFF';
            game.marcoTiempoUX.style.boxShadow = '0 0 20px #FFFFFF';
            game.fondoTiempoUX.style.borderColor = '#FFFFFF';
            game.fondoTiempoUX.style.boxShadow = '0 0 20px #FFFFFF';
        } else {
            game.marcoTiempoUX.style.borderColor = '#AAAAAA';
            game.marcoTiempoUX.style.boxShadow = '0 0 10px #AAAAAA';
            game.fondoTiempoUX.style.borderColor = '#AAAAAA';
            game.fondoTiempoUX.style.boxShadow = '0 0 10px #AAAAAA';
        }
    } else {
        // Resetear cuando no está sobrecalentado o terminó la habilidad
        if (game.tiempoFueroActivo) {
            game.relojFrameActual = 1;
            game.timerAnimacionReloj = 0;
            game.timerTiempoFuera = 0;
            game.tiempoFueroActivo = false;
        }
        
        // Marco en estado normal
        game.marcoTiempoUX.style.borderColor = '#0044CC';
        game.marcoTiempoUX.style.boxShadow = '0 0 10px #0044CC';
        game.fondoTiempoUX.style.borderColor = '#0044CC';
        game.fondoTiempoUX.style.boxShadow = '0 0 10px #0044CC';
    }
}

/**
 * Actualiza todas las habilidades del juego
 * Función auxiliar que orquesta todas las habilidades
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 * @param {boolean} devoradorActivadoAhora - Si el devorador se activó este frame
 */
export function actualizarHabilidades(game, delta, devoradorActivadoAhora) {
    // Actualizar cohetes
    actualizarUIMarcoCohetes(game);
    actualizarCohetes(game, delta);
    
    // Actualizar propulsor
    actualizarUIMarcoPropulsor(game);
    
    // Actualizar devorador
    actualizarSuccion(game, delta);
    actualizarUIMarcoDevorador(game, devoradorActivadoAhora);
    
    // Actualizar Tiempo Fuera (pasiva)
    actualizarTiempoFuera(game, delta);
}