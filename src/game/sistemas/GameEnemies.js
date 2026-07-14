/**
 * GameEnemies - Módulo de gestión de enemigos y naves enemigas
 * 
 * Este archivo contiene funciones relacionadas con la creación,
 * actualización y destrucción de enemigos (asteroides), naves enemigas
 * y enemigos especiales.
 * 
 * Funciones exportadas:
 * - generarEnemigo: Genera un nuevo enemigo/asteroide
 * - actualizarEnemigos: Actualiza todos los enemigos en pantalla
 * - generarNaveEnemiga: Genera una nueva nave enemiga
 * - actualizarNavesEnemigas: Actualiza las naves enemigas
 */

import { CONFIG } from '../../config.js';
import { Enemigo } from '../entidades/Enemy.js';
import { EnemyShip } from '../entidades/EnemyShip.js';
import { SpecialEnemy } from '../entidades/SpecialEnemy.js';
import { BoidParticle } from '../efectosVisuales/BoidParticle.js';
import { EnemyProjectile } from '../entidades/EnemyProjectile.js';
import { AsteroidExplosion } from '../efectosVisuales/AsteroidExplosion.js';
import { HitEffect } from '../efectosVisuales/HitEffect.js';

/**
 * Genera un nuevo enemigo (asteroide)
 * Función auxiliar para Game.js - líneas 968-1188
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function generarEnemigo(game) {
    // Sin límite en pantalla - siempre spawnea nuevos asteroides
    
    // Elegir un tamaño aleatorio
    const rand = Math.random();
    let size;
    
    // Calcular probabilidad de special: 2% normal, 4% desde oleada 10
    const probabilidadSpecial = (game.contadorOleadas >= 10) ? 0.04 : 0.02;
    
    // Distribución de tipos de asteroides:
    // special: 2% (4% desde oleada 10), rezagados: 39% (13% cada uno), large: 22%, medium: 17%, small: 20%
    if (rand < probabilidadSpecial) {
        size = 'special';          // 2% (4% desde oleada 10)
    } else if (rand < 0.18) {
        size = 'large_rezagado';  // 13%
    } else if (rand < 0.31) {
        size = 'medium_rezagado'; // 13%
    } else if (rand < 0.44) {
        size = 'small_rezagado';  // 13%
    } else if (rand < 0.66) {
        size = 'large';           // 22%
    } else if (rand < 0.83) {
        size = 'medium';          // 17%
    } else {
        size = 'small';           // 20%
    }
    
    // Determinar posición de spawn (los asteroides aparecen desde los bordes)
    const w = game.anchoJuego;
    const h = game.altoJuego;
    let x, y;
    
    // Verificar si es un tipo rezagado usando strings
    const isRezagado = size === 'large_rezagado' || 
                      size === 'medium_rezagado' || 
                      size === 'small_rezagado';
    
    if (size === 'special') {
        // Verificar límite de especiales (máximo 3 en pantalla)
        if (game.enemigosSpeciales.length >= 3) {
            size = 'large'; // Si llegó al límite, crear uno normal
        } else {
            // Aparece fuera de la pantalla y se mueve hacia el jugador
            const w = game.anchoJuego;
            const h = game.altoJuego;
            
            // Elegir un borde aleatorio para spawnear
            const borde = Math.floor(Math.random() * 4);
            let x, y;
            
            switch (borde) {
                case 0: // Top
                    x = Math.random() * w;
                    y = -80;
                    break;
                case 1: // Bottom
                    x = Math.random() * w;
                    y = h + 80;
                    break;
                case 2: // Left
                    x = -80;
                    y = Math.random() * h;
                    break;
                case 3: // Right
                    x = w + 80;
                    y = Math.random() * h;
                    break;
            }
            
            // Crear con posición fuera de la pantalla
            const especial = new SpecialEnemy(
                x, y,
                game.jugador,
                game.texturaAsteroideSpecial,
                game.anchoJuego,
                game.altoJuego
            );
            especial.render(game.aplicacion.stage);
            game.enemigosSpeciales.push(especial);
            return; // No crear más
        }
    } else if (isRezagado) {
        // Los rezagados aparecen desde un borde y cruzan la pantalla
        // pero evitan la zona central (donde está la nave)
        // Mantienen una línea recta SIN dirigirse a la nave
        let dirX = 0;
        let dirY = 0;
        
        if (Math.random() < 0.5) {
            // Eje horizontal: aparecen a izquierda/derecha
            if (Math.random() < 0.5) {
                // Nace a la izquierda, va hacia la derecha
                x = -60;
                dirX = 1;
            } else {
                // Nace a la derecha, va hacia la izquierda
                x = w + 60;
                dirX = -1;
            }
            
            // Y en zona superior O inferior (evitando el centro 30%)
            if (Math.random() < 0.5) {
                // Zona superior (0% al 40% del alto)
                y = Math.random() * (h * 0.4);
            } else {
                // Zona inferior (60% al 100% del alto)
                y = h * 0.6 + Math.random() * (h * 0.4);
            }
        } else {
            // Eje vertical: aparecen arriba/abajo
            if (Math.random() < 0.5) {
                // Nace arriba, va hacia abajo
                y = -60;
                dirY = 1;
            } else {
                // Nace abajo, va hacia arriba
                y = h + 60;
                dirY = -1;
            }
            
            // X en zona izquierda O derecha (evitando el centro 30%)
            if (Math.random() < 0.5) {
                // Zona izquierda (0% al 40% del ancho)
                x = Math.random() * (w * 0.4);
            } else {
                // Zona derecha (60% al 100% del ancho)
                x = w * 0.6 + Math.random() * (w * 0.4);
            }
        }
        
        // Elegir textura según el tipo
        const textura = (size === 'special') ? game.texturaAsteroideSpecial : game.texturaAsteroide;
        
        // Crear el enemigo
        const enemigo = new Enemigo(x, y, size, game.jugador, textura, null, false, game.anchoJuego, game.altoJuego);
        
        // === AUMENTAR VELOCIDAD CADA 5 OLEADAS ===
        const oleadasAumento = Math.floor(game.contadorOleadas / 5);
        const aumentoVelocidad = Math.min(oleadasAumento * CONFIG.GENERACION.VELOCIDAD_AUMENTO_POR_OLEADA, CONFIG.GENERACION.VELOCIDAD_AUMENTO_MAXIMO);
        const multiplicadorVelocidad = 1 + aumentoVelocidad;
        enemigo.multiplicadorVelocidad = multiplicadorVelocidad;
        
        // Asignar la dirección correcta al rezagado
        enemigo.direccionX = dirX;
        enemigo.direccionY = dirY;
        
        // Renderizar y agregar a la lista
        enemigo.render(game.aplicacion.stage);
        game.enemigos.push(enemigo);
        
        return;
    } else {
        // Asteroides normales aparecen desde cualquier borde
        // Intentamos hasta 5 veces encontrar una posición libre
        let intentos = 0;
        let posicionLibre = false;
        
        while (!posicionLibre && intentos < 5) {
            if (Math.random() < 0.5) {
                // Eje horizontal (izquierda o derecha)
                x = Math.random() < 0.5 ? -60 : w + 60;
                y = Math.random() * h;
            } else {
                // Eje vertical (arriba o abajo)
                x = Math.random() * w;
                y = Math.random() < 0.5 ? -60 : h + 60;
            }
            
            // Obtener radio según el tipo de asteroide
            let radioNuevo = 16; // default small
            if (size === 'large') radioNuevo = 64;
            else if (size === 'medium') radioNuevo = 32;
            else if (size === 'small') radioNuevo = 16;
            
            // Verificar si la posición está libre
            posicionLibre = verificarPosicionLibre(game, x, y, radioNuevo);
            intentos++;
        }
        
        // Si no encontró posición libre después de 5 intentos, no crear el asteroide
        if (!posicionLibre) {
            return;
        }
    }
    
    // Elegir textura según el tipo
    const texturaNormal = (size === 'special') ? game.texturaAsteroideSpecial : game.texturaAsteroide;
    
    // Crear el enemigo con todos los parámetros necesarios
    const enemigo = new Enemigo(x, y, size, game.jugador, texturaNormal, null, false, game.anchoJuego, game.altoJuego);
    
    // === AUMENTAR VELOCIDAD CADA 5 OLEADAS ===
    const oleadasAumento = Math.floor(game.contadorOleadas / 5);
    const aumentoVelocidad = Math.min(oleadasAumento * 0.10, 0.60);
    const multiplicadorVelocidad = 1 + aumentoVelocidad;
    enemigo.multiplicadorVelocidad = multiplicadorVelocidad;
    
    // Renderizar y agregar a la lista
    enemigo.render(game.aplicacion.stage);
    game.enemigos.push(enemigo);
}

/**
 * Crea una partícula Boid a 10px de un enemigo
 * Función auxiliar para Game.js - líneas 1194-1229
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {Enemigo} enemigo - Enemy near which to create the particle
 */
export function crearParticulaBoidCercaDe(game, enemigo) {
    if (!enemigo || !enemigo.x || !enemigo.y) return;
    
    // Posición aleatoria a 10px del enemigo
    const angulo = Math.random() * Math.PI * 2;
    const distancia = 10;
    const x = enemigo.x + Math.cos(angulo) * distancia;
    const y = enemigo.y + Math.sin(angulo) * distancia;
    
    // Crear partícula (sin usar pool)
    const particula = new BoidParticle(x, y, game.texturaParticulaBoid, game.texturasPboids);
    
    // Velocidad aleatoria hacia el centro
    const centroX = game.anchoJuego / 2;
    const centroY = game.altoJuego / 2;
    const dx = centroX - x;
    const dy = centroY - y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    
    // Configurar posición y velocidad
    particula.x = x;
    particula.y = y;
    particula.velX = (dx / mag) * 50 + (Math.random() - 0.5) * 30;
    particula.velY = (dy / mag) * 50 + (Math.random() - 0.5) * 30;
    particula.active = true;
    
    // Configurar sprite
    if (particula.imagen) {
        particula.imagen.x = x;
        particula.imagen.y = y;
        particula.imagen.visible = true;
    }
    
    game.particulasBoid.push(particula);
    particula.render(game.aplicacion.stage);
}

/**
 * Verifica si una posición está libre de colisiones con otros enemigos
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} x - Posición X a verificar
 * @param {number} y - Posición Y a verificar
 * @param {number} radio - Radio del nuevo enemigo
 * @returns {boolean} true si la posición está libre
 */
export function verificarPosicionLibre(game, x, y, radio) {
    // Verificar con enemigos existentes
    for (const enemigo of game.enemigos) {
        if (!enemigo.active) continue;
        
        const dx = x - enemigo.x;
        const dy = y - enemigo.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        const radioEnemigo = enemigo.radio || 32;
        
        // Necesario mantener distancia mínima
        if (distancia < (radio + radioEnemigo + 50)) {
            return false;
        }
    }
    
    // Verificar con el jugador
    if (game.jugador && game.jugador.active) {
        const dx = x - game.jugador.x;
        const dy = y - game.jugador.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        // Mantener distancia mínima del jugador
        if (distancia < (radio + 100)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Actualiza todos los enemigos (asteroides) en pantalla
 * Función auxiliar para Game.js - gestión de enemigos en _actualizarUI
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarEnemigos(game, delta) {
    if (!game.enemigos || !Array.isArray(game.enemigos)) {
        return;
    }
    
    // Actualizar enemigos normales
    for (let i = game.enemigos.length - 1; i >= 0; i--) {
        const enemy = game.enemigos[i];
        
        // Si el enemigo ya no está activo, eliminarlo
        if (!enemy || !enemy.active) {
            game.enemigos.splice(i, 1);
            continue;
        }
        
        // Actualizar posición
        if (enemy.update) {
            enemy.update(delta);
        }
        
        // Sincronizar sprite con posición lógica
        if (enemy.imagen) {
            enemy.imagen.x = enemy.x;
            enemy.imagen.y = enemy.y;
            enemy.imagen.rotation = enemy.rotacion || 0;
        }
        
        // Eliminar si está muy lejos de la pantalla (para rezagados)
        const margen = 200;
        if (enemy.x < -margen || enemy.x > game.anchoJuego + margen ||
            enemy.y < -margen || enemy.y > game.altoJuego + margen) {
            
            // Destruir sprite
            if (enemy.imagen && enemy.imagen.parent) {
                enemy.imagen.parent.removeChild(enemy.imagen);
            }
            enemy.active = false;
            game.enemigos.splice(i, 1);
        }
    }
    
    // Actualizar enemigos especiales
    for (let i = game.enemigosSpeciales.length - 1; i >= 0; i--) {
        const especial = game.enemigosSpeciales[i];
        
        if (!especial || !especial.active) {
            game.enemigosSpeciales.splice(i, 1);
            continue;
        }
        
        if (especial.update) {
            especial.update(delta);
        }
        
        if (especial.imagen) {
            especial.imagen.x = especial.x;
            especial.imagen.y = especial.y;
        }
    }
}

/**
 * Genera una nave enemiga que aparece en cada oleada
 * Función auxiliar para Game.js - líneas 1231+
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function generarNaveEnemiga(game) {
    // Elegir un borde aleatorio para spawnear
    const borde = Math.floor(Math.random() * 4);
    const w = game.anchoJuego;
    const h = game.altoJuego;
    let x, y;
    
    switch (borde) {
        case 0: // Top
            x = Math.random() * w;
            y = -50;
            break;
        case 1: // Bottom
            x = Math.random() * w;
            y = h + 50;
            break;
        case 2: // Left
            x = -50;
            y = Math.random() * h;
            break;
        case 3: // Right
            x = w + 50;
            y = Math.random() * h;
            break;
    }
    
    // Elegir una variante de nave enemiga al azar (spray). Fallback a la textura única.
    const variantes = game.texturasNaveEnemiga;
    const texturaNave = (variantes && variantes.length)
        ? variantes[Math.floor(Math.random() * variantes.length)]
        : game.texturaNaveEnemiga;

    // Crear la nave enemiga (orden correcto: x, y, textura, jugador, enemigos, ancho, alto)
    const nave = new EnemyShip(x, y, texturaNave, game.jugador, game.enemigos, game.anchoJuego, game.altoJuego);
    nave.render(game.aplicacion.stage);
    game.enemigosNaves.push(nave);
}

/**
 * Actualiza las naves enemigas en pantalla
 * Función auxiliar para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
export function actualizarNavesEnemigas(game, delta) {
    for (let i = game.enemigosNaves.length - 1; i >= 0; i--) {
        const nave = game.enemigosNaves[i];
        
        if (!nave || !nave.active) {
            game.enemigosNaves.splice(i, 1);
            continue;
        }
        
        if (nave.update) {
            nave.update(delta);
        }
        
        if (nave.imagen) {
            nave.imagen.x = nave.x;
            nave.imagen.y = nave.y;
            nave.imagen.rotation = nave.rotacion || 0;
        }
    }
}

/**
 * Actualiza naves enemigas con IA completa (disparos, colisiones)
 * Función completa para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarNavesEnemigasCompleto(game, delta) {
    if (!game.enemigosNaves || !Array.isArray(game.enemigosNaves)) {
        return;
    }
    
    for (let i = game.enemigosNaves.length - 1; i >= 0; i--) {
        const naveEnemiga = game.enemigosNaves[i];
        
        if (!naveEnemiga.active) continue;
        
        // Actualizar la nave enemiga
        naveEnemiga.update(delta);
        
        // Solo disparar si está en pantalla
        if (naveEnemiga.x > 0 && naveEnemiga.x < game.anchoJuego &&
            naveEnemiga.y > 0 && naveEnemiga.y < game.altoJuego) {
            
            // Verificar si dispara (cada 3 segundos)
            if (naveEnemiga.yaDisparo && !naveEnemiga.disparoCreado) {
                // Calcular ángulo hacia el jugador
                const dx = game.jugador.x - naveEnemiga.x;
                const dy = game.jugador.y - naveEnemiga.y;
                const anguloDisparo = Math.atan2(dy, dx);
                
                // Verificar si la nave está apuntando hacia el jugador (diferencia < 30°)
                let diff = anguloDisparo - naveEnemiga.rotacion;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                // Solo dispara si está apuntando hacia el jugador (±30° = ±PI/6)
                if (Math.abs(diff) < Math.PI / 6) {
                    // Gira hacia el jugador
                    naveEnemiga.rotacion += diff * 8 * delta;
                    
                    // Crear el proyectil desde la punta de la nave
                    _crearProyectilEnemigo(game, naveEnemiga.x, naveEnemiga.y, anguloDisparo);
                    naveEnemiga.disparoCreado = true;
                } else {
                    // Si no está apuntando, girar hacia el jugador sin disparar
                    naveEnemiga.rotacion += diff * 5 * delta;
                }
                
                // Resetear para el siguiente disparo
                naveEnemiga.yaDisparo = false;
            }
        }
        
        // Verificar colisión con asteroides
        for (let j = game.enemigos.length - 1; j >= 0; j--) {
            const asteroid = game.enemigos[j];
            if (!asteroid.active) continue;
            
            if (naveEnemiga.verificarColision(asteroid)) {
                // Ambos se destruyen
                asteroid.salud = 0;
                asteroid.active = false;
                asteroid.destroy();
                
                // Crear efecto de explosión del asteroide (rojo)
                const escala = asteroid.radio / 64;
                const astroExplosion = new AsteroidExplosion(
                    asteroid.x, asteroid.y,
                    game.texturaExplosionAsteroide,
                    escala * 0.35
                );
                astroExplosion.render(game.aplicacion.stage);
                game.efectosImpacto.push(astroExplosion);
                
                // Destruir la nave enemiga
                naveEnemiga.destroy();
                game.enemigos.splice(j, 1);
                break;
            }
        }
        
        // Si la nave enemiga está muy lejos, destruirla
        const margin = 200;
        if (naveEnemiga.x < -margin || naveEnemiga.x > game.anchoJuego + margin ||
            naveEnemiga.y < -margin || naveEnemiga.y > game.altoJuego + margin) {
            naveEnemiga.destroy();
        }
        
        // Eliminar si no está activa
        if (!naveEnemiga.active) {
            game.enemigosNaves.splice(i, 1);
        }
    }
}

/**
 * Crea un proyectil enemigo desde una nave enemiga
 * Función auxiliar para actualizarNavesEnemigasCompleto
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} direction - Dirección del disparo
 */
function _crearProyectilEnemigo(game, x, y, direction) {
    // Calcular la posición de la punta de la nave
    const distanciaPuntera = 35;
    const origenX = x + Math.cos(direction) * distanciaPuntera;
    const origenY = y + Math.sin(direction) * distanciaPuntera;
    
    // Crear proyectil teledirigido
    const projectile = new EnemyProjectile(
        origenX, origenY, direction,
        game.anchoJuego, game.altoJuego,
        game.texturaProyectil,
        game.jugador,
        game.enemigos
    );
    
    // Renderizarlo
    projectile.render(game.aplicacion.stage);
    
    // Agregar a la lista
    if (!game.proyectilesEnemigos) {
        game.proyectilesEnemigos = [];
    }
    game.proyectilesEnemigos.push(projectile);
}

/**
 * Maneja la generación de enemigos y naves enemigas
 * Función completa para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} delta - Tiempo transcurrido
 */
export function actualizarGeneracion(game, delta) {
    // Generar nuevos enemigos
    game.temporizadorSpawn += delta;
    if (game.temporizadorSpawn >= game.intervaloSpawn) {
        game.temporizadorSpawn = 0;
        generarEnemigo(game);
    }
    
    // Generar naves enemigas
    if (game.contadorOleadas >= 0) {
        // Calcular intervalo: 8s (oleada 0) -> 5s (oleada 15)
        // Reducido de 25s a 8s para que aparezcan más rápido al inicio
        const reduccion = game.contadorOleadas * (3 / 15);
        game.intervaloNaveEnemiga = Math.max(CONFIG.GENERACION.NAVE_INTERVALO_MINIMO, CONFIG.GENERACION.NAVE_INTERVALO_BASE - reduccion);
        
        game.temporizadorNaveEnemiga += delta;
        if (game.temporizadorNaveEnemiga >= game.intervaloNaveEnemiga) {
            game.temporizadorNaveEnemiga = 0;
            
            // Cantidad de naves según oleada
            let navesPorVez = 1;
            if (game.contadorOleadas >= 30) {
                navesPorVez = 3;
            } else if (game.contadorOleadas >= 10) {
                navesPorVez = 2;
            }
            
            // Generación normal
            for (let i = 0; i < navesPorVez; i++) {
                generarNaveEnemiga(game);
            }
            
            // Cada 5 oleadas: generar 3 naves adicionales
            if (game.contadorOleadas > 0 && game.contadorOleadas % 5 === 0) {
                for (let i = 0; i < 3; i++) {
                    generarNaveEnemiga(game);
                }
            }
        }
    }
}

/**
 * Procesa colisiones entre asteroides
 * - Todos los asteroides rebotan al chocar
 * - Solo los asteroides GRANDES entre sí se hacen daño y se fragmentan
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function procesarColisionesEnemigos(game) {
    for (let i = 0; i < game.enemigos.length; i++) {
        const enemy1 = game.enemigos[i];
        if (!enemy1.active) continue;
        
        for (let j = i + 1; j < game.enemigos.length; j++) {
            const enemy2 = game.enemigos[j];
            if (!enemy2.active) continue;
            
            if (enemy1.enfriamientoColision > 0 || enemy2.enfriamientoColision > 0) continue;
            
            if (game._verificarColision(enemy1, enemy2)) {
                const puntoMedioX = (enemy1.x + enemy2.x) / 2;
                const puntoMedioY = (enemy1.y + enemy2.y) / 2;
                const hit = new HitEffect(puntoMedioX, puntoMedioY, 'hit', 2, 0xCC0000);
                hit.render(game.aplicacion.stage);
                game.efectosImpacto.push(hit);
                
                enemy1.alterDirection();
                enemy2.alterDirection();
                
                enemy1.enfriamientoColision = CONFIG.GENERACION.COLISION_ENFRIAMIENTO;
                enemy2.enfriamientoColision = CONFIG.GENERACION.COLISION_ENFRIAMIENTO;
                
                const esGrande1 = enemy1.tamanio === 'large' || enemy1.tamanio === 'large_rezagado';
                const esGrande2 = enemy2.tamanio === 'large' || enemy2.tamanio === 'large_rezagado';
                
                if (esGrande1 && esGrande2) {
                    const danoColision = CONFIG.GENERACION.COLISION_DANO_LARGE;
                    enemy1.salud -= danoColision;
                    enemy2.salud -= danoColision;
                    
                    if (enemy1.salud <= 0) {
                        _destruirYFragmentar(game, enemy1, i);
                    }
                    
                    if (enemy2.salud <= 0) {
                        _destruirYFragmentar(game, enemy2, j);
                    }
                }
            }
        }
    }
}

/**
 * Elimina enemigos que están muy lejos de la pantalla
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function limpiarEnemigosLejanos(game) {
    if (!game.enemigos || !Array.isArray(game.enemigos)) {
        return;
    }
    
    const margin = 200;
    
    for (let i = game.enemigos.length - 1; i >= 0; i--) {
        const enemy = game.enemigos[i];
        
        if (enemy.x < -margin || enemy.x > game.anchoJuego + margin ||
            enemy.y < -margin || enemy.y > game.altoJuego + margin) {
            
            const enemyVisual = enemy.imagen || enemy.sprite;
            if (enemyVisual && enemyVisual.parent) {
                enemyVisual.parent.removeChild(enemyVisual);
            }
            
            enemy.destroy();
            game.enemigos.splice(i, 1);
        }
    }
    
    // Verificar colisiones entre enemigos normales y especiales (mini orbitando)
    for (let i = 0; i < game.enemigos.length; i++) {
        const enemy = game.enemigos[i];
        if (!enemy.active) continue;
        
        for (let k = game.enemigosSpeciales.length - 1; k >= 0; k--) {
            const especial = game.enemigosSpeciales[k];
            if (!especial || !especial.active || !especial.enOrbita) continue;
            
            if (game._verificarColision(enemy, especial)) {
                // Mini especial recibe -10 HP por colisión con asteroide
                especial.salud -= 10;
                // El asteroide también recibe daño
                enemy.salud -= 20;

                const puntoMedioX = (enemy.x + especial.x) / 2;
                const puntoMedioY = (enemy.y + especial.y) / 2;
                const hit = new HitEffect(puntoMedioX, puntoMedioY, 'hit', 2, 0xCC0000);
                hit.render(game.aplicacion.stage);
                game.efectosImpacto.push(hit);

                enemy.alterDirection();

                if (especial.salud <= 0) {
                    // Destruir mini especial con animación y puntos
                    const explosion = new AsteroidExplosion(especial.x, especial.y, game.texturaAsteroidExplosion, 0.25, 0x0000FF);
                    explosion.render(game.aplicacion.stage);
                    game.efectosExplosion.push(explosion);

                    game.puntuacion += 50;
                    especial.active = false;
                    if (especial.imagen && especial.imagen.parent) {
                        especial.imagen.parent.removeChild(especial.imagen);
                    }
                    game.enemigosSpeciales.splice(k, 1);
                }
                
                if (enemy.salud <= 0) {
                    _destruirYFragmentar(game, enemy, i);
                }
            }
        }
    }
}

function _destruirYFragmentar(game, enemy, indice) {
    const escala = (enemy.radio || 32) / 64;
    const explosion = new AsteroidExplosion(enemy.x, enemy.y, game.texturaExplosionAsteroide, escala * 0.5);
    explosion.render(game.aplicacion.stage);
    game.efectosExplosion.push(explosion);
    
    const fragmentos = enemy.recibirDano(1000);
    for (const frag of fragmentos) {
        frag.render(game.aplicacion.stage);
        game.enemigos.push(frag);
    }
    
    enemy.destroy();
    enemy.active = false;
}

/**
 * Procesa las colisiones entre el jugador y los enemigos
 * Función completa para Game.js
 * 
 * @param {Game} game - Referencia al objeto Game principal
 */
export function procesarColisionesJugador(game) {
    if (!game.jugador || !game.jugador.active) return;
    
    // Colisión con enemigos normales
    for (let i = game.enemigos.length - 1; i >= 0; i--) {
        const enemy = game.enemigos[i];
        if (!enemy.active) continue;
        
        if (game._verificarColision(game.jugador, enemy)) {
            if (enemy.tamanio !== 'special') {
                game.jugador.recibirDano(enemy.dano);
            }
            
            // Animación de destrucción
            let escalaAnim = 0.24;
            if (enemy.tamanio === 'medium') escalaAnim = 0.42;
            else if (enemy.tamanio === 'large') escalaAnim = 0.84;
            else if (enemy.tamanio === 'rezagado1') escalaAnim = 0.84;
            else if (enemy.tamanio === 'rezagado2') escalaAnim = 0.42;
            else if (enemy.tamanio === 'rezagado3') escalaAnim = 0.24;
            
            const astroExplosion = new AsteroidExplosion(enemy.x, enemy.y, game.texturaExplosionAsteroide, escalaAnim);
            astroExplosion.render(game.aplicacion.stage);
            game.efectosExplosion.push(astroExplosion);
            
            enemy.destroy();
            game.enemigos.splice(i, 1);
            
            // Verificar game over
            if (game.jugador.escudos <= 0 && !game.jugador.sobrecalentado) {
                game.gameOver();
            }
        }
    }
    
    // Colisión con naves enemigas
    for (let i = game.enemigosNaves.length - 1; i >= 0; i--) {
        const nave = game.enemigosNaves[i];
        if (!nave.active) continue;
        
        if (game._verificarColision(game.jugador, nave)) {
            game.jugador.recibirDano(nave.dano || 20);

            const explosion = new AsteroidExplosion(nave.x, nave.y, game.texturaExplosionNave, 0.5);
            explosion.render(game.aplicacion.stage);
            game.efectosExplosion.push(explosion);
            
            nave.destroy();
            game.enemigosNaves.splice(i, 1);
            
            if (game.jugador.escudos <= 0 && !game.jugador.sobrecalentado) {
                game.gameOver();
            }
        }
    }
    
    // Colisión con proyectiles enemigos
    for (let i = game.proyectilesEnemigos.length - 1; i >= 0; i--) {
        const proj = game.proyectilesEnemigos[i];
        if (!proj.active) continue;
        
        if (game._verificarColision(game.jugador, proj)) {
            game.jugador.recibirDano(proj.dano || 10);
            proj.destroy();
            game.proyectilesEnemigos.splice(i, 1);
            
            if (game.jugador.escudos <= 0 && !game.jugador.sobrecalentado) {
                game.gameOver();
            }
        }
    }
    
    // Colisión con enemigos especiales
    for (let i = game.enemigosSpeciales.length - 1; i >= 0; i--) {
        const especial = game.enemigosSpeciales[i];
        if (!especial.active) continue;
        
        if (game._verificarColision(game.jugador, especial)) {
            // El especial no hace daño, se convierte en mini y orbita
            if (!especial.enOrbita) {
                especial.convertirEnOrbita();
                game.puntuacion += especial.puntos || 100;
                
                // Animación de transformación
                const astroExplosion = new AsteroidExplosion(especial.x, especial.y, game.texturaAsteroidExplosion, 0.5, 0x0000FF);
                astroExplosion.render(game.aplicacion.stage);
                game.efectosExplosion.push(astroExplosion);
            }
        }
    }
    
    // Colisión de mini especiales en órbita con naves enemigas
    if (game.enemigosSpeciales && game.enemigosNaves) {
        for (let i = game.enemigosSpeciales.length - 1; i >= 0; i--) {
            const especial = game.enemigosSpeciales[i];
            if (!especial || !especial.active || !especial.enOrbita) continue;
            
            for (let j = game.enemigosNaves.length - 1; j >= 0; j--) {
                const naveEnemiga = game.enemigosNaves[j];
                if (!naveEnemiga || !naveEnemiga.active) continue;
                
                if (game._verificarColision(especial, naveEnemiga)) {
                    // El mini asteroide hace 25 de daño a la nave enemiga
                    naveEnemiga.salud -= 25;
                    
                    // Animación de impacto
                    const hit = new HitEffect(naveEnemiga.x, naveEnemiga.y, 'hit', 1.5);
                    hit.render(game.aplicacion.stage);
                    game.efectosImpacto.push(hit);
                    
                    // Si la nave enemiga se destruyó
                    if (naveEnemiga.salud <= 0) {
                        // Animación de destrucción (verde)
                        const explosion = new AsteroidExplosion(
                            naveEnemiga.x, naveEnemiga.y,
                            game.texturaExplosionNave,
                            0.5
                        );
                        explosion.render(game.aplicacion.stage);
                        game.efectosExplosion.push(explosion);
                        
                        // Puntos por destruir nave
                        game.puntuacion += 500;
                        
                        // Agregar carga de ULTi
                        if (game.jugador) {
                            game.jugador.agregarCargaUlti(naveEnemiga.cargaUlti);
                        }
                        
                        naveEnemiga.destroy();
                        game.enemigosNaves.splice(j, 1);
                    }
                    
                    // El mini asteroide también recibe daño (-10)
                    especial.salud -= 10;
                    
                    // Animación de impacto en el especial
                    const hitEsp = new HitEffect(especial.x, especial.y, 'hit', 1.5);
                    hitEsp.render(game.aplicacion.stage);
                    game.efectosImpacto.push(hitEsp);
                    
                    // Si el especial se destruyó
                    if (especial.salud <= 0) {
                        const astroExplosion = new AsteroidExplosion(
                            especial.x, especial.y,
                            game.texturaAsteroidExplosion,
                            0.42,
                            0x0000FF
                        );
                        astroExplosion.render(game.aplicacion.stage);
                        game.efectosExplosion.push(astroExplosion);
                        
                        especial.destroy();
                        game.enemigosSpeciales.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
}