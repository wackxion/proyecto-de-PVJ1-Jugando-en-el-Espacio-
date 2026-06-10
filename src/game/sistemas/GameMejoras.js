/**
 * GameMejoras - Módulo de gestión de mejoras del jugador
 * 
 * Este archivo contiene funciones relacionadas con la ventana de mejoras:
 * - Crear ventana de mejoras al pausar
 * - Comprar mejoras con partículas boids
 * - Actualizar UI de mejoras
 * 
 * Funciones exportadas:
 * - inicializarMejoras: Inicializa las variables de mejoras
 * - crearVentanaMejoras: Crea la ventana de mejoras en pausa
 * - comprarMejora: Compra una mejora específica
 * - actualizarUIMejoras: Actualiza la UI de mejoras
 * - limpiarVentanaMejoras: Limpia los elementos de la ventana
 */

import { CONFIG } from '../../config.js';
// PIXI está disponible globalmente en el proyecto

/**
 * Inicializa las variables de mejoras en el juego
 * @param {Game} game - Referencia al objeto Game principal
 */
export function inicializarMejoras(game) {
    game.mostrandoVentanaMejoras = false;
    game.mensajeErrorMostrando = false;
    // 5 secciones con 5 mejoras cada una = 25 mejoras totales
    // 0-4: Proyectil, 5-9: Escudo, 10-14: ULTi, 15-19: Proyectil2, 20-24: Tiempo fuera
    game.mejoras = Array(25).fill(0);
    const costosProyectil    = CONFIG.MEJORAS.COSTOS_PROYECTIL;
    const costosEscudo       = CONFIG.MEJORAS.COSTOS_ESCUDO;
    const costosUlti         = CONFIG.MEJORAS.COSTOS_ULTI;
    const costosProyectil2   = CONFIG.MEJORAS.COSTOS_PROYECTIL2;
    const costosTiempoFuera  = CONFIG.MEJORAS.COSTOS_TIEMPO_FUERA;
    game.costosMejoras = [...costosProyectil, ...costosEscudo, ...costosUlti, ...costosProyectil2, ...costosTiempoFuera];
}

/**
 * Crea la ventana de mejoras (se muestra al pausar con P)
 * @param {Game} game - Referencia al objeto Game principal
 */
export async function crearVentanaMejoras(game) {
    game.mostrandoVentanaMejoras = true;
    game.elementosFinJuego = game.elementosFinJuego || [];
    
    // Asegurar que el stage sea interactivo
    game.aplicacion.stage.eventMode = 'static';
    game.aplicacion.stage.interactive = true;
    
    // Cargar textura de game over para el fondo
    const gameOverTexture = await PIXI.Assets.load('assets/gameOver.jpg');
    
    // Fondo
    const fondoSprite = new PIXI.Sprite(gameOverTexture);
    const maxWidth = game.anchoJuego * 0.6;
    const maxHeight = game.altoJuego * 0.6;
    const scale = Math.min(maxWidth / fondoSprite.width, maxHeight / fondoSprite.height);
    fondoSprite.scale.set(scale);
    fondoSprite.anchor.set(0.5);
    fondoSprite.x = game.anchoJuego / 2;
    fondoSprite.y = game.altoJuego / 2;
    game.aplicacion.stage.addChild(fondoSprite);
    game.elementosFinJuego.push(fondoSprite);
    
    // Título "MEJORAS" - agregado primero al stage para que quede debajo del fondo pero visible
    const titleText = new PIXI.Text('MEJORAS', {
        fontFamily: 'Segoe Script, Lucida Handwriting, Bradley Hand, cursive',
        fontSize: 50,
        fill: 0x0044CC, // Azul
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowDistance: 3
    });
    titleText.anchor.set(0.5);
    titleText.x = game.anchoJuego / 2;
    titleText.y = 220; // Un poco más abajo
    game.aplicacion.stage.addChild(titleText);
    game.elementosFinJuego.push(titleText);
    
    // Contenedor principal
    const container = new PIXI.Container();
    container.x = game.anchoJuego / 2;
    container.y = game.altoJuego / 2;
    container.eventMode = 'static';
    container.interactive = true;
    game.aplicacion.stage.addChild(container);
    game.elementosFinJuego.push(container);
    
    // ==================== CREAR LAS 5 SECCIONES DE MEJORAS ====================
    // Configuración de las secciones: [nombre, indiceInicio, textura]
    // Los iconos deben estar alineados con sus barras
    const secciones = [
        { nombre: 'proyectil', indice: 0, textura: game.texturaProyectil, escala: 0.45, yBase: -120 },
        { nombre: 'proyectil2', indice: 15, textura: game.texturaProyectil, escala: 0.45, yBase: -60 },
        { nombre: 'ulti', indice: 10, textura: await PIXI.Assets.load('assets/ultiicon1.png'), escala: 0.5, yBase: 0 },
        { nombre: 'escudo', indice: 5, textura: await PIXI.Assets.load('assets/escudo1.png'), escala: 0.45, yBase: 60 },
        { nombre: 'tiempofuera', indice: 20, textura: await PIXI.Assets.load('assets/tiempo fuera.png'), escala: 0.25, yBase: 120 }
    ];
    
    // Guardar referencias de costos para actualizar después
    game.textoCostoTotal = {};
    game.barsMejoras = [];
    
    // Labels para las mejoras
    const labelsBase = ['+2', '+3', '+5', '+5', '+10'];
    const labelsProyectil2 = ['+10%', '+10%', '+15%', '+15%', '+30%'];
    const labelsEscudo = ['+50', '+50', '+50', '+50', '+50'];
    const labelsUlti = ['-50', '-50', '-50', '-50', '-50'];
    const labelsTiempoFuera = ['+5', '+10', '+15', '+20', '+30'];
    
    // Nombres de las secciones (a la izquierda del icono)
    const nombresSecciones = {
        proyectil: 'AUMENTO DE DAÑO',
        proyectil2: 'AUMENTO DE VELOCIDAD',
        ulti: 'COSTE DE OBTENCIÓN DE ULTI',
        escudo: 'AUMENTO DE ESCUDO',
        tiempofuera: 'AUMENTO DE REGENERACIÓN'
    };
    
    // Crear cada sección
    for (const seccion of secciones) {
        // Encontrar la primera mejora disponible en esta sección
        let primeraDisponibleEnSeccion = -1;
        for (let i = seccion.indice; i < seccion.indice + 5; i++) {
            if (game.mejoras[i] === 0) {
                primeraDisponibleEnSeccion = i;
                break;
            }
        }
        
        // Determinar labels según el tipo
        let labels;
        if (seccion.nombre === 'proyectil2') {
            labels = labelsProyectil2;
        } else if (seccion.nombre === 'escudo') {
            labels = labelsEscudo;
        } else if (seccion.nombre === 'ulti') {
            labels = labelsUlti;
        } else if (seccion.nombre === 'tiempofuera') {
            labels = labelsTiempoFuera;
        } else {
            labels = labelsBase;
        }
        
        // Nombre de la sección (a la izquierda del icono)
        const nombreSeccion = new PIXI.Text(nombresSecciones[seccion.nombre] || '', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x0044CC,
            fontWeight: 'bold'
        });
        nombreSeccion.anchor.set(1, 0.5); // A la derecha del texto
        nombreSeccion.x = -200; // Alineado con el borde izquierdo del fondo
        nombreSeccion.y = seccion.yBase; // Alineado con las barras
        container.addChild(nombreSeccion);
        
        // Icono
        const icono = new PIXI.Sprite(seccion.textura);
        icono.anchor.set(0.5);
        icono.scale.set(seccion.escala);
        
        // Costo de la primera mejora disponible en esta sección
        const costo = primeraDisponibleEnSeccion >= 0 ? game.costosMejoras[primeraDisponibleEnSeccion] : 0;
        
        // Imagen de partícula boid para el costo
        const boidImg = new PIXI.Sprite(game.texturaParticulaBoid);
        boidImg.anchor.set(0.5);
        boidImg.scale.set(0.25);
        boidImg.x = 35;
        boidImg.y = 20;
        
        // Número del costo
        const costoNumero = new PIXI.Text(`${costo}`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x0044CC,
            fontWeight: 'bold'
        });
        costoNumero.anchor.set(0, 0.5);
        costoNumero.x = 50;
        costoNumero.y = 20;
        
        // Contenedor del icono (a la derecha del nombre)
        const iconoContainer = new PIXI.Container();
        iconoContainer.addChild(icono);
        iconoContainer.addChild(boidImg);
        iconoContainer.addChild(costoNumero);
        iconoContainer.x = -140; // A la derecha del nombre
        iconoContainer.y = seccion.yBase;
        container.addChild(iconoContainer);
        
        // Guardar referencia para actualizar costos
        game.textoCostoTotal[seccion.nombre] = { boid: boidImg, numero: costoNumero };
        
        // Ocultar el costo si no hay más mejoras disponibles en esta sección
        if (primeraDisponibleEnSeccion < 0) {
            boidImg.visible = false;
            costoNumero.visible = false;
        }
        
        // Crear las 5 barras de esta sección
        const barraSize = 45;
        const gap = 5;
        const startX = -10; // A la derecha del icono
        
        for (let j = 0; j < 5; j++) {
            const indice = seccion.indice + j;
            const x = startX + j * (barraSize + gap);
            const y = seccion.yBase; // Las barras en el mismo Y que el icono
            
            const barraContainer = new PIXI.Container();
            barraContainer.x = x;
            barraContainer.y = y;
            barraContainer.eventMode = 'static';
            barraContainer.cursor = 'pointer';
            barraContainer.interactive = true;
            barraContainer.hitArea = new PIXI.Rectangle(0, 0, barraSize, barraSize);
            barraContainer.name = `mejora_${indice}`;
            container.addChild(barraContainer);
            
            // Fondo cuadrado
            const barraBg = new PIXI.Graphics();
            barraBg.eventMode = 'none';
            barraBg.lineStyle(2, 0x0044CC, 1);
            barraBg.beginFill(0xFFFFFF);
            barraBg.drawRect(0, 0, barraSize, barraSize);
            barraBg.endFill();
            barraContainer.addChild(barraBg);
            
            // Barra llena
            const nivel = game.mejoras[indice] || 0;
            const porcentaje = nivel >= 1 ? 1 : 0;
            const barraLlena = new PIXI.Graphics();
            barraLlena.eventMode = 'none';
            barraLlena.beginFill(0x0044CC);
            barraLlena.drawRect(0, barraSize * (1 - porcentaje), barraSize, barraSize * porcentaje);
            barraLlena.endFill();
            barraContainer.addChild(barraLlena);
            
            // Guardar referencia
            game.barsMejoras[indice] = { barraLlena, barraSize, container: barraContainer };
            
            // Texto de la mejora
            const labelText = new PIXI.Text(labels[j], {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0x0044CC,
                fontWeight: 'bold'
            });
            labelText.anchor.set(0.5);
            labelText.x = barraSize / 2;
            labelText.y = barraSize / 2;
            barraContainer.addChild(labelText);
            
            // Click para comprar
            barraContainer.on('pointertap', () => {
                comprarMejora(game, indice);
            });
            
            // Hover
            barraContainer.on('pointerover', () => {
                barraBg.tint = 0xCCCCCC;
            });
            barraContainer.on('pointerout', () => {
                barraBg.tint = 0xFFFFFF;
            });
        }
    }
    
    // Guardar también la referencia a la primera mejora disponible
    const primeraDisponible = game.mejoras.findIndex(nivel => nivel === 0);
    game.primeraMejoraIndice = primeraDisponible;
    
    // Mostrar partículas actuales (imagen Pboids2 + número en azul)
    const particulasContainer = new PIXI.Container();
    particulasContainer.x = game.anchoJuego / 2;
    particulasContainer.y = game.altoJuego / 2 + (fondoSprite.height * scale) / 2 - 90;
    game.aplicacion.stage.addChild(particulasContainer);
    game.elementosFinJuego.push(particulasContainer);
    
    // Imagen Pboids2
    const boidIcono = new PIXI.Sprite(game.texturasPboids[0]);
    boidIcono.anchor.set(0.5);
    boidIcono.scale.set(0.5);
    boidIcono.x = -30;
    particulasContainer.addChild(boidIcono);
    
    // Número en azul (usar recolectadas en lugar de existentes)
    const cantidad = game.particulasCapturadas || 0;
    const numeroText = new PIXI.Text(`${cantidad}`, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0x0044CC,
        fontWeight: 'bold'
    });
    numeroText.anchor.set(0, 0.5);
    numeroText.x = 0;
    numeroText.y = 0;
    particulasContainer.addChild(numeroText);
    
    // Guardar referencia para actualizar
    game.textoNumeroParticulas = numeroText;
    
    // Mensaje para continuar
    const continuarText = new PIXI.Text('Presiona P para continuar', {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xAAAAAA
    });
    continuarText.anchor.set(0.5);
    continuarText.x = game.anchoJuego / 2;
    continuarText.y = game.altoJuego / 2 + (fondoSprite.height * scale) / 2 - 20;
    game.aplicacion.stage.addChild(continuarText);
    game.elementosFinJuego.push(continuarText);
}

/**
 * Compra una mejora específica
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} indice - Índice de la mejora a comprar
 */
export function comprarMejora(game, indice) {
    const costo = game.costosMejoras[indice];
    const nivelActual = game.mejoras[indice];
    const particulasActuales = game.particulasCapturadas || 0;
    
    // Verificar si ya está comprada (nivel >= 1)
    if (nivelActual >= 1) {
        _mostrarMensajeError(game, 'Esta mejora ya está comprada');
        return;
    }
    
    // Verificar partículas: debe tener al menos el costo necesario
    if (particulasActuales < costo) {
        // Mostrar mensaje de "No hay suficientes partículas"
        _mostrarMensajeError(game, 'No hay suficientes partículas');
        return;
    }
    
    // Consumir partículas (recolectadas, no las existentes)
    game.particulasCapturadas -= costo;
    
    // Aumentar nivel
    game.mejoras[indice]++;
    
    // Aplicar efecto según el tipo de mejora
    // 0-4: Proyectil, 5-9: Escudo, 10-14: ULTi, 15-19: Proyectil2, 20-24: Tiempo fuera
    if (indice >= 5 && indice <= 9 && game.jugador) {
        // Restaurar escudos (+50%) al comprar mejora de escudos
        game.jugador.escudos = Math.min(CONFIG.ESCUDOS.MAXIMO, game.jugador.escudos + CONFIG.MEJORAS.ESCUDO_RESTAURACION);
    }
    
    // Actualizar costos en los iconos según la sección
    // Determinar qué sección se actualizó
    const seccionNombre = _getSeccionNombre(indice);
    if (seccionNombre && game.textoCostoTotal && game.textoCostoTotal[seccionNombre]) {
        const inicioSeccion = _getInicioSeccion(seccionNombre);
        let siguiente = -1;
        for (let i = inicioSeccion; i < inicioSeccion + 5; i++) {
            if (game.mejoras[i] === 0) {
                siguiente = i;
                break;
            }
        }
        const nuevoCosto = siguiente >= 0 ? game.costosMejoras[siguiente] : 0;
        game.textoCostoTotal[seccionNombre].numero.text = `${nuevoCosto}`;
        // Ocultar si no hay más mejoras en esta sección
        game.textoCostoTotal[seccionNombre].boid.visible = siguiente >= 0;
        game.textoCostoTotal[seccionNombre].numero.visible = siguiente >= 0;
    }
    
    // Actualizar contador de partículas en la ventana (recolectadas)
    if (game.textoNumeroParticulas) {
        const cantidad = game.particulasCapturadas || 0;
        game.textoNumeroParticulas.text = `${cantidad}`;
    }

    // Actualizar UI con animación
    actualizarUIMejoras(game, indice);
    
    // Aplicar las mejoras compradas al juego
    if (game.aplicarMejoras) {
        game.aplicarMejoras();
    }
}

/**
 * Actualiza la UI de las barras de mejoras con animación
 * @param {Game} game - Referencia al objeto Game principal
 * @param {number} indiceCompra - Índice de la barra que se compró (opcional)
 */
export function actualizarUIMejoras(game, indiceCompra) {
    if (!game.barsMejoras) return;
    
    // Actualizar las 25 barras (5 secciones x 5 mejoras)
    for (let i = 0; i < 25; i++) {
        const barData = game.barsMejoras[i];
        if (!barData) continue;
        
        const nivel = game.mejoras[i] || 0;
        const nuevoPorcentaje = nivel >= 1 ? 1 : 0; // 100% si está comprada
        
        // Si es la barra que se acaba de comprar, animarla
        if (i === indiceCompra && nivel > 0) {
            // Animación de la barra
            const barraSize = barData.barraSize;
            const duration = 300; // ms
            const startPorcentaje = 0;
            const startTime = Date.now();
            
            // Función de animación
            const animateBar = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentPorcentaje = startPorcentaje + (nuevoPorcentaje - startPorcentaje) * eased;
                
                // Redibujar barra
                barData.barraLlena.clear();
                barData.barraLlena.beginFill(0x00FF00); // Verde para mostrar progreso
                barData.barraLlena.drawRect(0, barraSize * (1 - currentPorcentaje), barraSize, barraSize * currentPorcentaje);
                barData.barraLlena.endFill();
                
                if (progress < 1) {
                    requestAnimationFrame(animateBar);
                } else {
                    // Volver al color normal después de la animación
                    setTimeout(() => {
                        barData.barraLlena.clear();
                        barData.barraLlena.beginFill(0x0044CC);
                        barData.barraLlena.drawRect(0, barraSize * (1 - nuevoPorcentaje), barraSize, barraSize * nuevoPorcentaje);
                        barData.barraLlena.endFill();
                    }, 200);
                }
            };
            
            animateBar();
        } else {
            // Solo actualizar sin animación - si está comprada (nivel >= 1) mostrar completa
            barData.barraLlena.clear();
            const porcentaje = nivel >= 1 ? 1 : 0; // 100% si está comprada, 0% si no
            barData.barraLlena.beginFill(0x0044CC);
            barData.barraLlena.drawRect(0, barData.barraSize * (1 - porcentaje), barData.barraSize, barData.barraSize * porcentaje);
            barData.barraLlena.endFill();
        }
    }
}

/**
 * Limpia la ventana de mejoras
 * @param {Game} game - Referencia al objeto Game principal
 */
export function limpiarVentanaMejoras(game) {
    game.mostrandoVentanaMejoras = false;
    game.mensajeErrorMostrando = false;
    
    if (game.elementosFinJuego) {
        for (const el of game.elementosFinJuego) {
            try {
                if (el && el.parent) {
                    el.parent.removeChild(el);
                    if (el.destroy && typeof el.destroy === 'function') {
                        el.destroy();
                    }
                }
            } catch (e) {
                // Ignorar errores
            }
        }
        game.elementosFinJuego = [];
    }
}

/**
 * Muestra un mensaje de error temporal en la ventana de mejoras
 * @param {Game} game - Referencia al objeto Game principal
 * @param {string} mensaje - Mensaje a mostrar
 */
function _mostrarMensajeError(game, mensaje) {
    // Si ya hay un mensaje de error mostrando, no mostrar otro
    if (game.mensajeErrorMostrando) {
        return;
    }
    
    // Marcar que hay un mensaje mostrando
    game.mensajeErrorMostrando = true;
    
    // Crear texto de error (misma fuente que el título "MEJORAS", debajo del título)
    const textoError = new PIXI.Text(mensaje, {
        fontFamily: 'Segoe Script, Lucida Handwriting, Bradley Hand, cursive',
        fontSize: 24,
        fill: 0xFF0000,
        fontWeight: 'bold'
    });
    textoError.anchor.set(0.5);
    textoError.x = game.anchoJuego / 2;
    textoError.y = 280; // Debajo del título "MEJORAS" que está en y=220
    game.aplicacion.stage.addChild(textoError);
    game.elementosFinJuego.push(textoError);
    
    // Desaparecer después de 2 segundos
    setTimeout(() => {
        if (textoError.parent) {
            textoError.parent.removeChild(textoError);
            const idx = game.elementosFinJuego.indexOf(textoError);
            if (idx > -1) {
                game.elementosFinJuego.splice(idx, 1);
            }
            textoError.destroy();
        }
        // Limpiar la bandera cuando el mensaje desaparece
        game.mensajeErrorMostrando = false;
    }, 2000);
}

/**
 * Obtiene el nombre de la sección según el índice de mejora
 * @param {number} indice - Índice de la mejora
 * @returns {string} Nombre de la sección
 */
function _getSeccionNombre(indice) {
    if (indice >= 0 && indice <= 4) return 'proyectil';
    if (indice >= 5 && indice <= 9) return 'escudo';
    if (indice >= 10 && indice <= 14) return 'ulti';
    if (indice >= 15 && indice <= 19) return 'proyectil2';
    if (indice >= 20 && indice <= 24) return 'tiempofuera';
    return '';
}

/**
 * Obtiene el índice de inicio de una sección
 * @param {string} nombre - Nombre de la sección
 * @returns {number} Índice de inicio
 */
function _getInicioSeccion(nombre) {
    switch (nombre) {
        case 'proyectil': return 0;
        case 'escudo': return 5;
        case 'ulti': return 10;
        case 'proyectil2': return 15;
        case 'tiempofuera': return 20;
        default: return 0;
    }
}