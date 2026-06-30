/**
 * main.js - Punto de entrada del juego
 * 
 * Solo inicializa UIManager y maneja el flujo del menú.
 * Todo el código de UI está en src/ui/UIManager.js
 * 
 * v1.4.5
 */
import { Game } from './game/sistemas/Game.js';
import { UIManager } from './ui/UIManager.js';
import { Top5 } from './game/mecanicas/Top5.js';

// Variables globales
let game = null;
let juegoInicializado = false;
let uiManager = null;
let top5Data = null;

// =============================================================================
// EVENTO: DOMContentLoaded
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('game-container');
    
    // Verificar que PixiJS esté disponible
    if (typeof PIXI === 'undefined') {
        container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error: PixiJS no está cargado</p>';
        return;
    }
    
    // Precargar Top 5 en segundo plano con retry adaptativo
    async function preloadTop5() {
        const maxIntentos = 5;
        const tiempoBase = 500; // 500ms inicial
        
        for (let intento = 1; intento <= maxIntentos; intento++) {
            try {
                const top5Instance = new Top5();
                
                // Espera adaptativa: exponential backoff (500ms, 1000ms, 2000ms, 4000ms, 8000ms)
                const tiempoEspera = tiempoBase * Math.pow(2, intento - 1);
                await new Promise(resolve => setTimeout(resolve, tiempoEspera));
                
                const datos = await top5Instance.obtenerLista();
                
                // Verificar que los datos no estén vacíos
                if (datos && datos.length > 0) {
                    top5Data = datos;
                    // console.log(`Top 5 cargado en intento ${intento}:`, datos.length, 'entradas');
                    return;
                }
                
                // console.log(`Intento ${intento}: datos vacíos, reintentando...`);
            } catch (e) {
                // console.log(`Intento ${intento} fallido:`, e.message);
            }
        }
        
        // Si todos los intentos fallan, continuar sin datos
        // console.log('Top 5: no se pudo cargar después de', maxIntentos, 'intentos');
    }
    preloadTop5();
    
    // Crear UIManager con callbacks
    uiManager = new UIManager(container, {
        // Botón JUGAR
        onJugar: () => {
            if (juegoInicializado && game) {
                // El juego ya existe (se volvió al menú con Escape): reiniciar
                // partida sin recargar assets ni mostrar pantalla de carga.
                uiManager.ocultarMenuPrincipal(() => {
                    game.reiniciarDesdeMenu();
                });
            } else {
                // Primera partida: mostrar carga e inicializar
                uiManager.mostrarPantallaCarga(async (updateProgress) => {
                    await inicializarJuego(updateProgress);
                    uiManager.ocultarMenuPrincipal();
                });
            }
        },
        
        // Botón TUTORIAL
        onTutorial: () => {
            uiManager.mostrarTutorial();
        },
        
        // Botón TOP 5
        onTop5: () => {
            uiManager.mostrarTop5(top5Data);
        },
        
        // Botón CRÉDITOS
        onCreditos: () => {
            uiManager.mostrarCreditos();
        }
    });
    
    // Mostrar menú principal
    uiManager.mostrarMenuPrincipal();
});

// =============================================================================
// FUNCIÓN: Inicializar juego
// =============================================================================
async function inicializarJuego(onProgress) {
    if (juegoInicializado) return;
    
    const container = document.getElementById('game-container');
    game = new Game();
    // Pasar uiManager existente para evitar duplicación
    await game.init(container, onProgress, uiManager);
    
    juegoInicializado = true;
    window.game = game;
}

// =============================================================================
// TECLA ESCAPE: confirmar volver al menú principal
// =============================================================================
// Estado del modal de confirmación (evita abrir varios a la vez)
let confirmSalirAbierto = false;
let modalSalir = null;

/**
 * Cierra el modal de confirmación de salida.
 * @param {boolean} volver - true = volver al menú principal; false = seguir jugando
 */
function cerrarConfirmSalir(volver) {
    if (modalSalir) {
        modalSalir.remove();
        modalSalir = null;
    }
    confirmSalirAbierto = false;

    if (volver) {
        // Detener la partida y mostrar el menú principal (el de main.js, con
        // botones funcionales). JUGAR reiniciará vía game.reiniciarDesdeMenu().
        if (game) game.detenerParaMenu();
        uiManager.mostrarMenuPrincipal();
    } else {
        // Seguir jugando: sacar la pausa y limpiar teclas atascadas
        if (game) {
            game.pausado = false;
            if (game.gestorEntrada) game.gestorEntrada.reiniciar();
        }
    }
}

// Escuchar Escape a nivel ventana. Solo actúa si hay una partida activa.
window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!game || !juegoInicializado) return;

    // Si el modal ya está abierto, Escape = seguir jugando (cerrar)
    if (confirmSalirAbierto) {
        e.preventDefault();
        cerrarConfirmSalir(false);
        return;
    }

    // No abrir si no se está jugando, si terminó la partida, o si ya está en
    // pausa (ventana de MEJORAS / Top 5 abiertas con P)
    if (!game.ejecutando || game.enGameOver || game.pausado) return;

    e.preventDefault();
    confirmSalirAbierto = true;
    game.pausado = true; // congelar el juego mientras el jugador decide

    modalSalir = uiManager.mostrarConfirmacionSalir(
        () => cerrarConfirmSalir(true),   // VOLVER AL MENÚ
        () => cerrarConfirmSalir(false)   // SEGUIR JUGANDO
    );
});