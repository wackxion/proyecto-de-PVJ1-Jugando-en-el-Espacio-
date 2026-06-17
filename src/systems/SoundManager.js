/**
 * GestorSonido - Sistema de audio del juego (SFX y música)
 *
 * Usa HTML5 Audio (sin dependencias externas). Para efectos que pueden
 * superponerse (ej: disparos rápidos) clona el nodo de audio en cada
 * reproducción, así varios sonidos iguales pueden sonar a la vez.
 *
 * Nota sobre autoplay: los navegadores bloquean el audio hasta que hay una
 * interacción del usuario. En este juego la primera interacción es el click
 * en "JUGAR", que desbloquea el audio antes de que empiece la partida.
 *
 * Uso:
 *   const sonido = new GestorSonido();
 *   sonido.cargar('disparo', 'assets/audio/disparo.mp3', 0.6);
 *   sonido.reproducir('disparo');
 */
export class GestorSonido {
    constructor() {
        // clave -> { audio: HTMLAudioElement (plantilla precargada), volumen: number }
        this.plantillas = new Map();

        // Volumen global (0..1) que multiplica al volumen individual de cada sonido
        this.volumenGlobal = 1.0;

        // Si está silenciado, reproducir() no hace nada
        this.silenciado = false;
    }

    /**
     * Registra y precarga un sonido bajo una clave.
     *
     * @param {string} clave   - Identificador del sonido (ej: 'disparo')
     * @param {string} ruta    - Ruta al archivo (ej: 'assets/audio/disparo.mp3')
     * @param {number} volumen - Volumen individual del sonido (0..1). Default 1.0
     */
    cargar(clave, ruta, volumen = 1.0) {
        const audio = new Audio(ruta);
        audio.preload = 'auto';
        this.plantillas.set(clave, { audio, volumen });
    }

    /**
     * Reproduce un sonido por su clave.
     * Clona el nodo para permitir reproducciones superpuestas (disparos rápidos).
     *
     * @param {string} clave - Identificador del sonido a reproducir
     */
    reproducir(clave) {
        if (this.silenciado) return;

        const entrada = this.plantillas.get(clave);
        if (!entrada) return;

        // Clonar para que varios disparos suenen sin cortarse entre sí
        const instancia = entrada.audio.cloneNode();
        instancia.volume = this._clamp(entrada.volumen * this.volumenGlobal);

        const promesa = instancia.play();
        // play() devuelve una promesa; si el navegador la rechaza
        // (ej: autoplay bloqueado) la ignoramos para no romper el game loop
        if (promesa && typeof promesa.catch === 'function') {
            promesa.catch(() => {});
        }
    }

    /**
     * Reproduce un sonido en BUCLE y devuelve la instancia para poder detenerla.
     * Útil para sonidos sostenidos (ej: alarma mientras dura un estado).
     *
     * @param {string} clave - Identificador del sonido
     * @returns {HTMLAudioElement|null} la instancia en loop, o null si no se reprodujo
     */
    reproducirLoop(clave) {
        if (this.silenciado) return null;

        const entrada = this.plantillas.get(clave);
        if (!entrada) return null;

        const instancia = entrada.audio.cloneNode();
        instancia.loop = true;
        instancia.volume = this._clamp(entrada.volumen * this.volumenGlobal);

        const promesa = instancia.play();
        if (promesa && typeof promesa.catch === 'function') {
            promesa.catch(() => {});
        }
        return instancia;
    }

    /**
     * Detiene una instancia devuelta por reproducirLoop() (o cualquier Audio).
     * @param {HTMLAudioElement} instancia
     */
    detener(instancia) {
        if (!instancia) return;
        try {
            instancia.pause();
            instancia.currentTime = 0;
            instancia.loop = false;
        } catch (e) {
            // Ignorar
        }
    }

    /**
     * Activa o desactiva el silencio global.
     * @param {boolean} estado - true para silenciar, false para reactivar
     */
    silenciar(estado = true) {
        this.silenciado = estado;
    }

    /**
     * Alterna el estado de silencio. Devuelve el nuevo estado.
     * @returns {boolean} true si quedó silenciado
     */
    alternarSilencio() {
        this.silenciado = !this.silenciado;
        return this.silenciado;
    }

    /**
     * Ajusta el volumen global (0..1).
     * @param {number} volumen
     */
    setVolumenGlobal(volumen) {
        this.volumenGlobal = this._clamp(volumen);
    }

    /**
     * Limita un valor al rango 0..1.
     * @param {number} v
     * @returns {number}
     */
    _clamp(v) {
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }
}
