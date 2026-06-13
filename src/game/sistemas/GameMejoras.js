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
    const maxWidth = game.anchoJuego * 0.9;
    const maxHeight = game.altoJuego * 0.85;
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
    // Ubicar el título cerca del borde superior del papel (relativo, robusto a cualquier tamaño)
    titleText.y = fondoSprite.y - fondoSprite.height / 2 + 46;
    game.aplicacion.stage.addChild(titleText);
    game.elementosFinJuego.push(titleText);

    // === MINI-LEYENDA (debajo del título): qué significa cada color ===
    const leyenda = new PIXI.Container();
    leyenda.y = titleText.y + 38;
    const estadosLeyenda = [
        { fill: 0xDCE7F7, borde: 0x0044CC, alpha: 1,   check: true,  texto: 'Comprada' },
        { fill: 0xFBFBF2, borde: 0x0044CC, alpha: 1,   check: false, texto: 'Disponible' },
        { fill: 0xFBFBF2, borde: 0xB9C4DC, alpha: 0.6, check: false, texto: 'Sin partículas' },
        { fill: 0xF7E0E0, borde: 0xCC0000, alpha: 1,   check: false, texto: 'Sin saldo' }
    ];
    const szChip = 15, gapChip = 16;
    let lx = 0;
    for (const e of estadosLeyenda) {
        const chip = new PIXI.Container();
        chip.x = lx;
        chip.alpha = e.alpha;
        const cuad = new PIXI.Graphics();
        cuad.lineStyle(2, e.borde, 1);
        cuad.beginFill(e.fill);
        cuad.drawRect(0, 0, szChip, szChip);
        cuad.endFill();
        chip.addChild(cuad);
        if (e.check) {
            const ck = new PIXI.Text('✓', { fontFamily: 'Arial', fontSize: 11, fill: 0x0044CC, fontWeight: 'bold' });
            ck.anchor.set(0.5);
            ck.x = szChip / 2; ck.y = szChip / 2 + 1;
            chip.addChild(ck);
        }
        const txt = new PIXI.Text(e.texto, { fontFamily: 'Arial', fontSize: 13, fill: 0x0C447C, fontWeight: 'bold' });
        txt.anchor.set(0, 0.5);
        txt.x = szChip + 5; txt.y = szChip / 2;
        chip.addChild(txt);
        leyenda.addChild(chip);
        lx += szChip + 5 + txt.width + gapChip;
    }
    // Centrar la leyenda horizontalmente
    const anchoLeyenda = lx - gapChip;
    leyenda.x = game.anchoJuego / 2 - anchoLeyenda / 2;
    game.aplicacion.stage.addChild(leyenda);
    game.elementosFinJuego.push(leyenda);

    // Contenedor principal
    // Sin las etiquetas de texto, la fila es [icono + costo + grid].
    // Offset -35 en X para centrar ese contenido bajo el papel.
    const container = new PIXI.Container();
    container.x = game.anchoJuego / 2 - 35;
    container.y = game.altoJuego / 2;
    container.eventMode = 'static';
    container.interactive = true;
    game.aplicacion.stage.addChild(container);
    game.elementosFinJuego.push(container);
    
    // ==================== CREAR LAS 5 SECCIONES DE MEJORAS ====================
    // Configuración de las secciones: [nombre, indiceInicio, textura]
    // Los iconos deben estar alineados con sus barras
    const secciones = [
        { nombre: 'proyectil', indice: 0, textura: game.texturaProyectil, escala: 0.45, yBase: -100 },
        { nombre: 'proyectil2', indice: 15, textura: game.texturaProyectil, escala: 0.45, yBase: -50 },
        { nombre: 'ulti', indice: 10, textura: await PIXI.Assets.load('assets/ultiicon1.png'), escala: 0.5, yBase: 0 },
        { nombre: 'escudo', indice: 5, textura: await PIXI.Assets.load('assets/escudo1.png'), escala: 0.45, yBase: 50 },
        { nombre: 'tiempofuera', indice: 20, textura: await PIXI.Assets.load('assets/tiempo fuera.png'), escala: 0.25, yBase: 100 }
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
        
        // (Se reemplazaron los títulos de texto por el icono de cada categoría)

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
            
            // Fondo cuadrado (el color/estado lo pinta _estilarBarra)
            const barraBg = new PIXI.Graphics();
            barraBg.eventMode = 'none';
            barraContainer.addChild(barraBg);

            // Capa de relleno (vestigial; el estado se pinta en barraBg)
            const barraLlena = new PIXI.Graphics();
            barraLlena.eventMode = 'none';
            barraContainer.addChild(barraLlena);

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

            // Tilde de "comprada" (oculto hasta comprar)
            const check = new PIXI.Text('✓', {
                fontFamily: 'Arial',
                fontSize: 13,
                fill: 0x0044CC,
                fontWeight: 'bold'
            });
            check.anchor.set(1, 0);
            check.x = barraSize - 3;
            check.y = 1;
            check.visible = false;
            barraContainer.addChild(check);

            // Guardar referencia y pintar estado inicial
            game.barsMejoras[indice] = { barraBg, barraLlena, labelText, check, barraSize, container: barraContainer };
            _estilarBarra(game, indice);

            // Click para comprar
            barraContainer.on('pointertap', () => {
                comprarMejora(game, indice);
            });
            
            // Hover (tinte azul claro)
            barraContainer.on('pointerover', () => {
                barraBg.tint = 0xCFE0F7;
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
    // fondoSprite.height ya está escalado: ubicar cerca del borde inferior del papel
    particulasContainer.y = game.altoJuego / 2 + fondoSprite.height / 2 - 75;
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
    continuarText.y = game.altoJuego / 2 + fondoSprite.height / 2 - 30;
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
        // Mostrar mensaje de "No hay suficientes partículas" + flash rojo en la mejora
        _mostrarMensajeError(game, 'No hay suficientes partículas');
        _flashRojoBarra(game, indice);
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
export function actualizarUIMejoras(game) {
    if (!game.barsMejoras) return;
    // Repintar el estado de las 25 barras (comprada / disponible / sin partículas).
    // La disponibilidad cambia al gastar partículas, por eso se repinta todo.
    for (let i = 0; i < 25; i++) {
        if (game.barsMejoras[i]) _estilarBarra(game, i);
    }
}

/**
 * Pinta una barra de mejora según su estado, en tinta:
 *  - comprada      -> azul pastel suave + tilde
 *  - disponible    -> contorno azul sobre papel
 *  - sin partículas-> tinta tenue (borde pálido + atenuado)
 * @param {Game} game
 * @param {number} i - índice de la mejora (0-24)
 */
function _estilarBarra(game, i) {
    const b = game.barsMejoras[i];
    if (!b || !b.barraBg) return;
    const sz = b.barraSize;
    const comprada = (game.mejoras[i] || 0) >= 1;
    const alcanza = (game.particulasCapturadas || 0) >= (game.costosMejoras[i] || 0);

    b.container.alpha = 1;
    if (b.barraLlena) b.barraLlena.clear();
    b.barraBg.clear();

    if (comprada) {
        b.barraBg.lineStyle(2, 0x0044CC, 1);
        b.barraBg.beginFill(0xDCE7F7); // azul pastel suave
        b.barraBg.drawRect(0, 0, sz, sz);
        b.barraBg.endFill();
        if (b.labelText) b.labelText.style.fill = 0x0C447C;
        if (b.check) b.check.visible = true;
    } else if (alcanza) {
        b.barraBg.lineStyle(2, 0x0044CC, 1);
        b.barraBg.beginFill(0xFBFBF2); // papel
        b.barraBg.drawRect(0, 0, sz, sz);
        b.barraBg.endFill();
        if (b.labelText) b.labelText.style.fill = 0x0044CC;
        if (b.check) b.check.visible = false;
    } else {
        b.barraBg.lineStyle(2, 0xB9C4DC, 1); // borde tinta tenue
        b.barraBg.beginFill(0xFBFBF2);
        b.barraBg.drawRect(0, 0, sz, sz);
        b.barraBg.endFill();
        if (b.labelText) b.labelText.style.fill = 0xA4B0CD;
        if (b.check) b.check.visible = false;
        b.container.alpha = 0.5; // atenuado, como tinta gastada
    }
}

/**
 * Flash rojo breve en una mejora (al intentar comprar sin partículas)
 * @param {Game} game
 * @param {number} i
 */
function _flashRojoBarra(game, i) {
    const b = game.barsMejoras[i];
    if (!b || !b.barraBg) return;
    const sz = b.barraSize;
    b.container.alpha = 1;
    b.barraBg.clear();
    b.barraBg.lineStyle(2, 0xCC0000, 1);
    b.barraBg.beginFill(0xF7E0E0);
    b.barraBg.drawRect(0, 0, sz, sz);
    b.barraBg.endFill();
    if (b.labelText) b.labelText.style.fill = 0x7A1414;
    setTimeout(() => _estilarBarra(game, i), 450);
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