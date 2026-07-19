/**
 * GameMejoras - Inicialización del sistema de mejoras del jugador.
 *
 * NOTA: la "ventana de mejoras" vieja (un modal centrado que se abría con P) fue
 * reemplazada por los chips/pips del HUD lateral (ver PixiHUD) y su compra vive
 * en Game.comprarMejoraSeccion. Acá solo queda la inicialización de los datos.
 *
 * Funciones exportadas:
 * - inicializarMejoras: crea game.mejoras (40) y game.costosMejoras.
 */

import { CONFIG } from '../../config.js';

/**
 * Inicializa las variables de mejoras en el juego
 * @param {Game} game - Referencia al objeto Game principal
 */
export function inicializarMejoras(game) {
    game.mostrandoVentanaMejoras = false;
    game.mensajeErrorMostrando = false;
    // 8 secciones × 5 = 40 mejoras. 0-4: Proyectil (daño), 5-9: Escudo,
    // 10-14: Ulti, 15-19: Tiempo Fuera, 20-24: Aceleración, 25-29: Propulsor,
    // 30-34: Devorador, 35-39: Cohetes.
    game.mejoras = Array(40).fill(0);
    const costosProyectil    = CONFIG.MEJORAS.COSTOS_PROYECTIL;
    const costosEscudo       = CONFIG.MEJORAS.COSTOS_ESCUDO;
    const costosUlti         = CONFIG.MEJORAS.COSTOS_ULTI;
    const costosTiempoFuera  = CONFIG.MEJORAS.COSTOS_TIEMPO_FUERA;
    const costosAceleracion  = CONFIG.MEJORAS.COSTOS_ACELERACION;
    const costosPropulsor    = CONFIG.MEJORAS.COSTOS_PROPULSOR;
    const costosDevorador    = CONFIG.MEJORAS.COSTOS_DEVORADOR;
    const costosCohetes      = CONFIG.MEJORAS.COSTOS_COHETES;
    game.costosMejoras = [
        ...costosProyectil, ...costosEscudo, ...costosUlti, ...costosTiempoFuera,
        ...costosAceleracion, ...costosPropulsor, ...costosDevorador, ...costosCohetes
    ];
}
