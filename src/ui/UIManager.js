/**
 * UIManager - Gestor de Interfaz de Usuario
 * 
 * Maneja toda la UI del juego:
 * - Menú principal (JUGAR, TUTORIAL, TOP 5, CRÉDITOS)
 * - HUD del juego (barras, score, oleada)
 * - Posicionamiento responsive (se adapta a cualquier pantalla)
 * 
 * v1.4.5
 */
export class UIManager {
    /**
     * Constructor del UIManager
     * @param {HTMLElement} container - Contenedor principal del juego
     * @param {Object} callbacks - Funciones de callback para los botones
     */
    constructor(container, callbacks = {}) {
        this.container = container;
        
        // Guardar dimensionesresponsive
        this.actualizarDimensiones();
        
        // Callbacks (funciones de los botones del menu)
        this.onJugar = callbacks.onJugar || (() => {});
        this.onTutorial = callbacks.onTutorial || (() => {});
        this.onTop5 = callbacks.onTop5 || (() => {});
        this.onCreditos = callbacks.onCreditos || (() => {});
        this.onVolver = callbacks.onVolver || (() => {});
        
        // Elementos de UI
        this.mainMenu = null;
        this.uiOverlay = null;
        
        // Crear estructura base
        // NOTA: crearEstructuraBase() ya no se usa - el HUD ahora se renderiza con PixiJS (PixiHUD.js)
        // this.crearEstructuraBase();
        
        // listener para cambio de tamano de pantalla
        window.addEventListener('resize', () => this.onResize());
    }
    
    /**
     * Actualiza las dimensiones de la pantalla
     * Se llama en constructor y en evento resize
     */
    actualizarDimensiones() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
    
    /**
     * Crea la estructura base de UI en el DOM
     * NOTA: Los estilos CSS del HUD ya no se usan - el HUD ahora se renderiza con PixiJS
     * (ver src/game/ui/PixiHUD.js)
     */
    crearEstructuraBase() {
        // NOTA: Estilos CSS del HUD eliminados - migrados a PixiJS

        // UI Overlay (capa de UI sobre el juego) - ESTE SE MANTIENE
        this.uiOverlay = document.createElement('div');
        this.uiOverlay.id = 'ui-overlay';
        this.uiOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        this.container.appendChild(this.uiOverlay);
        
        // Versión (esquina inferior derecha)
        const versionDisplay = document.createElement('div');
        versionDisplay.id = 'version-display';
        versionDisplay.textContent = 'v1.4.5';
        versionDisplay.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 15px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: white;
            opacity: 0.7;
            z-index: 200;
        `;
        this.container.appendChild(versionDisplay);
    }
    
    /**
     * Muestra el menú principal
     */
    mostrarMenuPrincipal() {
        // Crear contenedor del menú
        this.mainMenu = document.createElement('div');
        this.mainMenu.id = 'main-menu';
        this.mainMenu.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('assets/fondoEspacio2.png') no-repeat center center;
            background-size: cover;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 20px;
            z-index: 500;
        `;
        
        // Agregar botones
        this.mainMenu.appendChild(this.crearBotonMenu('JUGAR', () => this.onJugar()));
        this.mainMenu.appendChild(this.crearBotonMenu('TUTORIAL', () => this.onTutorial()));
        this.mainMenu.appendChild(this.crearBotonMenu('TOP 5', () => this.onTop5()));
        this.mainMenu.appendChild(this.crearBotonMenu('CRÉDITOS', () => this.onCreditos()));
        
        this.container.appendChild(this.mainMenu);
    }
    
    /**
     * Oculta el menú principal con animación
     */
    ocultarMenuPrincipal(callback) {
        if (this.mainMenu) {
            this.mainMenu.style.transition = 'opacity 0.5s ease';
            this.mainMenu.style.opacity = '0';
            setTimeout(() => {
                this.mainMenu.remove();
                this.mainMenu = null;
                if (callback) callback();
            }, 500);
        } else if (callback) {
            callback();
        }
    }
    
    /**
     * Crea un botón del menú con estilos
     * @param {string} texto - Texto del botón
     * @param {Function} accion - Función al hacer click
     * @returns {HTMLElement}
     */
    crearBotonMenu(texto, accion) {
        const boton = document.createElement('button');
        boton.textContent = texto;
        boton.style.cssText = `
            width: 200px;
            padding: 15px 30px;
            font-size: 22px;
            font-family: 'Segoe Script', cursive;
            font-weight: bold;
            color: white;
            background: linear-gradient(180deg, #0066FF 0%, #0044CC 100%);
            border: 3px solid white;
            border-radius: 15px;
            cursor: pointer;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            box-shadow: 0 4px 15px rgba(0, 68, 204, 0.5);
            transition: all 0.3s ease;
        `;
        
        boton.addEventListener('mouseenter', () => {
            boton.style.transform = 'scale(1.1)';
            boton.style.boxShadow = '0 6px 25px rgba(0, 68, 204, 0.8)';
            boton.style.background = 'linear-gradient(180deg, #0088FF 0%, #0066FF 100%)';
        });
        
        boton.addEventListener('mouseleave', () => {
            boton.style.transform = 'scale(1)';
            boton.style.boxShadow = '0 4px 15px rgba(0, 68, 204, 0.5)';
            boton.style.background = 'linear-gradient(180deg, #0066FF 0%, #0044CC 100%)';
        });
        
        boton.addEventListener('click', accion);
        return boton;
    }
    
    /**
     * Crea botón VOLVER reutilizable
     * @param {Function} onClick - Función al hacer click
     * @returns {HTMLElement}
     */
    crearBotonVolver(onClick) {
        const boton = document.createElement('button');
        boton.textContent = 'VOLVER';
        boton.style.cssText = `
            padding: 10px 30px;
            font-size: 18px;
            font-family: 'Segoe Script', cursive;
            font-weight: bold;
            color: white;
            background: #0044CC;
            border: 2px solid white;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0, 68, 204, 0.5);
            transition: all 0.3s ease;
        `;
        
        boton.addEventListener('mouseenter', () => {
            boton.style.background = '#0066FF';
            boton.style.transform = 'scale(1.05)';
        });
        
        boton.addEventListener('mouseleave', () => {
            boton.style.background = '#0044CC';
            boton.style.transform = 'scale(1)';
        });
        
        boton.addEventListener('click', onClick);
        return boton;
    }
    
    /**
     * Muestra pantalla de carga
     * @param {Function} callback - Función a ejecutar después
     */
    mostrarPantallaCarga(callback, onProgress) {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #0D0D1A;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const shipContainer = document.createElement('div');
        shipContainer.id = 'loading-ship';
        shipContainer.innerHTML = '<img src="assets/Nave322.png" alt="Nave">';
        shipContainer.style.cssText = `
            width: 80px;
            height: 80px;
            animation: spin 1s linear infinite;
        `;
        
        const loadingText = document.createElement('div');
        loadingText.textContent = 'CARGANDO...';
        loadingText.id = 'loading-text';
        loadingText.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 24px;
            margin-top: 20px;
            text-shadow: 0 0 10px #0044CC;
        `;
        
        // Barra de progreso
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = `
            width: 200px;
            height: 20px;
            border: 3px solid #0044CC;
            border-radius: 10px;
            margin-top: 15px;
            overflow: hidden;
            box-shadow: 0 0 10px #0044CC;
        `;
        
        const progressBarFill = document.createElement('div');
        progressBarFill.id = 'loading-progress-fill';
        progressBarFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #0044CC, #0088FF);
            transition: width 0.2s ease;
        `;
        
        const progressPercent = document.createElement('div');
        progressPercent.id = 'loading-progress-percent';
        progressPercent.textContent = '0%';
        progressPercent.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 16px;
            margin-top: 5px;
        `;
        
        // CSS para animación
        if (!document.getElementById('loading-style')) {
            const style = document.createElement('style');
            style.id = 'loading-style';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                #loading-ship img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transform-origin: center center;
                }
                .loading-spin {
                    animation: spin 1s linear infinite;
                    transform-origin: center center;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Agregar barra al contenedor
        progressBarContainer.appendChild(progressBarFill);
        loadingScreen.appendChild(shipContainer);
        loadingScreen.appendChild(loadingText);
        loadingScreen.appendChild(progressBarContainer);
        loadingScreen.appendChild(progressPercent);
        this.container.appendChild(loadingScreen);
        
        // Función para actualizar progreso
        const updateProgress = (percent, texto) => {
            progressBarFill.style.width = percent + '%';
            progressPercent.textContent = Math.round(percent) + '%';
            if (texto) {
                loadingText.textContent = texto;
            }
        };
        
        setTimeout(async () => {
            try {
                // Si hay callback de progreso, pasarlo
                if (onProgress) {
                    onProgress(updateProgress);
                } else {
                    // Simular progreso si no hay callback
                    updateProgress(50, 'CARGANDO...');
                }
                
                await callback();
                updateProgress(100, 'LISTO!');
                loadingScreen.style.transition = 'opacity 0.5s ease';
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.remove(), 500);
            } catch (error) {
                loadingScreen.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error: ${error.message}</p>`;
            }
        }, 100);
    }
    
    /**
     * Muestra modal de Tutorial con navegación paso a paso
     */
    mostrarTutorial() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0D0D1A;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 600;
        `;
        
        // Contenido de cada paso del tutorial
        const pasos = [
            // Paso 1: Objetivo
            {
                titulo: 'TUTORIAL - OBJETIVO',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">OBJETIVO DEL JUEGO</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 20px; text-align: center; line-height: 1.5;">
                        Tu misión es <strong>destruir asteroides</strong> para obtener partículas BOIDS.<br><br>
                        Usa esas partículas para <strong>mejorar tu nave</strong> y sobrevivir<br>
                        tantas oleadas como puedas.<br><br>
                        Cada vez que tu puntuación sube, aparecen más asteroides.<br>
                        ¡Sobrevive el mayor tiempo posible!
                    </div>
                `
            },
            // Paso 2: Controles
            {
                titulo: 'TUTORIAL - CONTROLES',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">CONTROLES</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 18px; text-align: left; line-height: 1.6; max-width: 500px; margin: 0 auto;">
                        <strong>W</strong> - Avanzar<br>
                        <strong>A / D</strong> - Rotar izquierda/derecha<br>
                        <strong>ESPACIO</strong> - Disparar<br>
                        <strong>Q</strong> - Cohetes (aceleración)<br>
                        <strong>E</strong> - Devorador (atrae partículas)<br>
                        <strong>R</strong> - Propulsor (dash)<br>
                        <strong>P</strong> - Pausar / Abrir MEJORAS<br>
                        <strong>T</strong> - Ver Top 5 (en pausa)
                    </div>
                `
            },
            // Paso 3: Sistema de Mejoras
            {
                titulo: 'TUTORIAL - MEJORAS',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">SISTEMA DE MEJORAS</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 16px; text-align: left; line-height: 1.5;">
                        Presiona <strong>P</strong> para abrir el menú de mejoras.<br><br>
                        <strong>AUMENTO DE DAÑO</strong>: +2, +3, +5, +5, +10<br>
                        <strong>AUMENTO DE VELOCIDAD</strong>: +5%, +5%, +10%, +10%, +20%<br>
                        <strong>COSTE DE ULTI</strong>: -50,-50,-50,-50,-50 (de 500 a 250)<br>
                        <strong>AUMENTO DE ESCUDO</strong>: +50,+50,+50,+50,+50 HP<br>
                        <strong>REGENERACIÓN</strong>: +5,+10,+15,+20,+30 tras Tiempo Fuera<br><br>
                        <em style="color: #6688AA;">Paga con partículas del Devorador.</em>
                    </div>
                `
            },
            // Paso 4: Partículas
            {
                titulo: 'TUTORIAL - PARTÍCULAS',
                contenido: `
                    <div style="color: #0044CC; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 15px; text-align: center;">PARTÍCULAS BOIDS</div>
                    <div style="text-align: center; margin-bottom: 15px;">
                        <img src="assets/Pboids2.png" style="width: 80px; height: 80px; border: 2px solid #0044CC; border-radius: 10px;">
                    </div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 16px; text-align: left; line-height: 1.5;">
                        Los <strong>asteroides especiales</strong> sueltan partículas BOIDS al destruirse.<br><br>
                        <strong>¿Cómo recolectarlas?</strong><br>
                        - Presiona <strong>E</strong> para activar el Devorador<br>
                        - Las partículas serán atraídas hacia ti<br>
                        - También puedes tocarlas con tu nave<br><br>
                        Las partículas se usan en el menú de mejoras (tecla P).<br><br>
                        <em style="color: #6688AA;">¡Recolecta sabiamente!</em>
                    </div>
                `
            },
            // Paso 5: Sobrecalentamiento
            {
                titulo: 'TUTORIAL - SOBRECALENTAMIENTO',
                contenido: `
                    <div style="color: #FF0000; font-family: 'Segoe Script', cursive; font-size: 32px; font-weight: bold; margin-bottom: 20px; text-align: center;">SOBRECALENTAMIENTO</div>
                    <div style="color: #0044CC; font-family: 'Arial', sans-serif; font-size: 16px; text-align: left; line-height: 1.5;">
                        Si tus escudos llegan a <strong>0</strong>, entras en modo<br>
                        <strong>SOBRECALENTAMIENTO</strong>.<br><br>
                        Durante <strong>25 segundos</strong>:<br>
                        - Eres vulnerable<br>
                        - No puedes usar el propulsor (R)<br>
                        - Solo puedes moverte y disparar<br><br>
                        Al terminar, regeneras <strong>10 escudos</strong>.<br>
                        Las mejoras de ESCUDO (+50 HP cada una) aumentan<br>
                        tu vida máxima para que puedas resistir más.<br><br>
                        <em style="color: #6688AA;">¡Mantén tus escudos altos!</em>
                    </div>
                `
            }
        ];
        
        let pasoActual = 0;
        
        // Crear función para mostrar el paso actual
        const mostrarPaso = (indice) => {
            // Limpiar contenido anterior
            container.innerHTML = '';
            
            const paso = pasos[indice];
            
            // Título del paso
            const titulo = document.createElement('div');
            titulo.innerHTML = paso.titulo;
            titulo.style.cssText = `
                color: #0044CC;
                font-family: 'Segoe Script', cursive;
                font-size: 26px;
                font-weight: bold;
                margin-bottom: 15px;
            `;
            container.appendChild(titulo);
            
            // Contenido
            const contenido = document.createElement('div');
            contenido.innerHTML = paso.contenido;
            container.appendChild(contenido);
            
            // Indicador de progreso
            const progreso = document.createElement('div');
            progreso.textContent = `${indice + 1} / ${pasos.length}`;
            progreso.style.cssText = `
                color: #0044CC;
                font-family: 'Arial', sans-serif;
                font-size: 16px;
                margin-top: 15px;
                font-weight: bold;
            `;
            container.appendChild(progreso);
            
            // Contenedor de botones
            const botones = document.createElement('div');
            botones.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
                width: 100%;
            `;
            
            // Botón Anterior (siempre presente pero invisible si es el primer paso)
            const btnAnterior = document.createElement('button');
            btnAnterior.textContent = 'ANTERIOR';
            btnAnterior.style.cssText = `
                padding: 15px 30px;
                font-size: 18px;
                font-family: 'Segoe Script', cursive;
                font-weight: bold;
                color: white;
                background: #0044CC;
                border: 2px solid white;
                border-radius: 10px;
                cursor: pointer;
                visibility: ${indice > 0 ? 'visible' : 'hidden'};
            `;
            if (indice > 0) {
                btnAnterior.addEventListener('click', () => mostrarPaso(indice - 1));
            }
            botones.appendChild(btnAnterior);
            
            // Botón Siguiente / Finalizar
            const btnSiguiente = document.createElement('button');
            if (indice < pasos.length - 1) {
                btnSiguiente.textContent = 'SIGUIENTE';
            } else {
                btnSiguiente.textContent = 'FINALIZAR';
            }
            btnSiguiente.style.cssText = `
                padding: 15px 30px;
                font-size: 18px;
                font-family: 'Segoe Script', cursive;
                font-weight: bold;
                color: white;
                background: #003366;
                border: 2px solid white;
                border-radius: 10px;
                cursor: pointer;
            `;
            btnSiguiente.addEventListener('click', () => {
                if (indice < pasos.length - 1) {
                    mostrarPaso(indice + 1);
                } else {
                    modal.remove();
                }
            });
            botones.appendChild(btnSiguiente);
            
            container.appendChild(botones);
        };
        
        // Crear contenedor
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: url('assets/gameOver.jpg') no-repeat center center;
            background-size: cover;
            width: ${Math.min(750, this.width * 0.9)}px;
            height: ${Math.min(700, this.height * 0.9)}px;
            padding: 30px;
            border-radius: 20px;
            border: 4px solid #0044CC;
        `;
        
        // Mostrar primer paso
        mostrarPaso(0);
        
        modal.appendChild(container);
        this.mainMenu.appendChild(modal);
    }
    
/**
     * Muestra modal de Top 5
     * @param {Array|null|undefined} puntuaciones - Lista de puntuaciones (null = cargando)
     */
    mostrarTop5(puntuaciones) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0D0D1A;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 600;
        `;
        
        const exterior = document.createElement('div');
        exterior.style.cssText = `
            background: url('assets/gameOver.jpg') no-repeat center center;
            background-size: 100% 100%;
            width: ${Math.min(560, this.width * 0.9)}px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 70px 40px;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = 'TOP 5';
        titulo.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);
        
        // Headers
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            width: ${Math.min(400, this.width * 0.6)}px;
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 0 20px;
        `;
        header.innerHTML = `
            <span style="width: 50px; text-align: center;">N°</span>
            <span style="width: 100px; text-align: center;">NOMBRE</span>
            <span style="width: 100px; text-align: center;">PUNTOS</span>
            <span style="width: 80px; text-align: center;">OLEADAS</span>
        `;
        container.appendChild(header);
        
        // Lista container
        const lista = document.createElement('div');
        lista.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 20px;
            font-weight: bold;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
            min-height: 150px;
        `;
        container.appendChild(lista);
        
        // Botón volver (se guarda referencia para mostrar después si está cargando)
        const btnVolver = this.crearBotonVolver(() => {
            // Detener polling si existe
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            modal.remove();
        });
        
        // Función para mostrar la lista
        const mostrarLista = (data) => {
            lista.innerHTML = '';
            btnVolver.style.display = 'flex';
            
            if (data && data.length > 0) {
                data.forEach((p, i) => {
                    const fila = document.createElement('div');
                    fila.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        width: ${Math.min(400, this.width * 0.6)}px;
                        padding: 5px 20px;
                    `;
                    fila.innerHTML = `
                        <span style="width: 50px; text-align: center; color: #0044CC; font-weight: bold;">${i + 1}</span>
                        <span style="width: 100px; text-align: center; color: #0044CC; font-weight: bold;">${p.nombre}</span>
                        <span style="width: 100px; text-align: center; color: #0044CC; font-weight: bold;">${p.puntuacion}</span>
                        <span style="width: 80px; text-align: center; color: #0044CC; font-weight: bold;">${p.oleada}</span>
                    `;
                    lista.appendChild(fila);
                });
            } else {
                lista.innerHTML = '<div style="text-align: center; color: #0044CC; font-weight: bold; margin-top: 30px;">¡Aún no hay puntuaciones!</div>';
            }
        };
        
        //Función para mostrar pantalla de carga
        const mostrarCarga = () => {
            // Asegurar que CSS de spin existe
            if (!document.getElementById('spin-animation-style')) {
                const spinStyle = document.createElement('style');
                spinStyle.id = 'spin-animation-style';
                spinStyle.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
                document.head.appendChild(spinStyle);
            }
            
            lista.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 30px;">
                    <img src="assets/Nave322.png" style="width: 60px; height: 60px; animation: spin 1s linear infinite; transform-origin: center center;">
                    <div style="color: #0044CC; font-size: 18px; text-shadow: 0 0 10px #0044CC;">CARGANDO...</div>
                </div>
            `;
            btnVolver.style.display = 'flex';
        };
        
        // Ocultar botón volver inicialmente (se muestra junto con contenido)
        btnVolver.style.display = 'none';
        container.appendChild(btnVolver);
        exterior.appendChild(container);
        modal.appendChild(exterior);
        this.mainMenu.appendChild(modal);
        
// Variable para polling
        let pollingInterval = null;
        let datosCargados = false;
        
        // Función para obtener datos frescos
        const refreshDataCallback = async () => {
            if (datosCargados) return;
            
            try {
                // Importar Top5 y obtener datos frescos
                const { Top5 } = await import('../game/mecanicas/Top5.js');
                const top5Instance = new Top5();
                const nuevosDatos = await top5Instance.obtenerLista();
                
                datosCargados = true;
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
                
                mostrarLista(nuevosDatos);
            } catch (e) {
                console.log('Error cargando Top 5:', e);
            }
        };
        
        // Verificar estado inicial de los datos
        if (puntuaciones === null || puntuaciones === undefined) {
            // Está cargando - mostrar pantalla de carga
            mostrarCarga();
            
            // Iniciar polling para obtener datos cuando estén listos
            pollingInterval = setInterval(async () => {
                await refreshDataCallback();
            }, 500); // Verificar cada 500ms
            
            // También ejecutar inmediatamente
            refreshDataCallback();
        } else {
            // Datos ya disponibles
            datosCargados = true;
            mostrarLista(puntuaciones);
}
    }
    
    /**
     * Muestra modal de Créditos
     */
    mostrarCreditos() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0D0D1A;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 600;
        `;
        
        const exterior = document.createElement('div');
        exterior.style.cssText = `
            background: url('assets/gameOver.jpg') no-repeat center center;
            background-size: 100% 100%;
            width: ${Math.min(640, this.width * 0.9)}px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 70px 50px;
        `;
        
        const titulo = document.createElement('div');
        titulo.textContent = 'CRÉDITOS';
        titulo.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 0 0 10px #0044CC;
        `;
        container.appendChild(titulo);
        
        const contenido = document.createElement('div');
        contenido.style.cssText = `
            color: #0044CC;
            font-family: 'Segoe Script', cursive;
            font-size: 18px;
            text-align: center;
            line-height: 1.2;
        `;
        contenido.innerHTML = `
            <div style="margin-bottom: 20px; font-weight: bold;">JUGANDO EN EL ESPACIO</div>
            <div style="font-weight: bold;">Desarrollado por:</div>
            <div>Braian Zapater</div>
            <div style="margin-top: 20px; font-weight: bold;">Curso:</div>
            <div>Programación de Videojuegos 1</div>
            <div>UNAHUR 2026</div>
            <div style="margin-top: 20px; font-weight: bold;">Profesor:</div>
            <div>Facundo Saiegh</div>
            <div style="margin-top: 20px; font-weight: bold;">Tecnologías:</div>
            <div>PixiJS v8 | Firebase Firestore</div>
            <div style="margin-top: 10px; font-weight: bold;">Asistencia IA:</div>
            <div>OpenCode</div>
        `;
        container.appendChild(contenido);
        container.appendChild(this.crearBotonVolver(() => modal.remove()));
        exterior.appendChild(container);
        modal.appendChild(exterior);
        this.mainMenu.appendChild(modal);
    }
    
    /**
     * Actualiza la versión mostrada
     * @param {string} version 
     */
    setVersion(version) {
        const versionDisplay = document.getElementById('version-display');
        if (versionDisplay) {
            versionDisplay.textContent = version;
        }
    }
    
    /**
     * Maneja el redimensionamiento de ventana
     */
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        // Los elementos con % se ajustan automáticamente
    }
    
    /**
     * Limpia toda la UI del contenedor
     */
    destruir() {
        if (this.uiOverlay) {
            this.uiOverlay.remove();
        }
        if (this.mainMenu) {
            this.mainMenu.remove();
        }
        window.removeEventListener('resize', this.onResize);
    }
    
}