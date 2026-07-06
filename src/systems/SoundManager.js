/**
 * GestorSonido - Sistema de audio del juego (SFX y música)
 *
 * Usa HTML5 Audio (sin dependencias externas). Para efectos que pueden
 * superponerse (ej: disparos rápidos) clona el nodo de audio en cada
 * reproducción, así varios sonidos iguales pueden sonar a la vez.
 *
 * Cada sonido tiene una CATEGORÍA ('sfx' o 'musica'). Hay dos multiplicadores
 * de volumen COMPARTIDOS por todas las instancias (una vive en Game y otra en
 * UIManager): uno para música y otro para efectos. Los controla el menú de
 * Opciones y se guardan en localStorage.
 *
 * Volumen final de cada sonido = volumen_individual × multiplicador_de_su_categoría
 *
 * Nota sobre autoplay: los navegadores bloquean el audio hasta que hay una
 * interacción del usuario (primer click).
 *
 * Uso:
 *   const sonido = new GestorSonido();
 *   sonido.cargar('disparo', 'assets/audio/disparo.mp3', 0.6);            // sfx
 *   sonido.cargar('musicaMenu', 'assets/audio/menu.mp3', 0.5, 'musica');  // música
 *   sonido.reproducir('disparo');
 */

/** Limita un valor al rango 0..1. */
function clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
}

export class GestorSonido {
    // Multiplicadores de volumen por categoría (0..1), COMPARTIDOS por todas las
    // instancias. Los ajusta el menú de Opciones vía los métodos estáticos.
    static volumenMusica = 1.0;
    static volumenSfx = 1.0;
    // Instancias de música en bucle que están sonando ahora, para poder
    // actualizar su volumen en vivo cuando se mueve el slider de música.
    static _musicasActivas = new Set();
    // Bandera para cargar los ajustes de localStorage una sola vez.
    static _ajustesCargados = false;

    constructor() {
        // Cargar volúmenes guardados (la primera vez que se crea un gestor)
        GestorSonido._cargarAjustes();

        // clave -> { audio: HTMLAudioElement (plantilla precargada), volumen, categoria }
        this.plantillas = new Map();

        // Si está silenciado, reproducir() no hace nada
        this.silenciado = false;
    }

    /**
     * Registra y precarga un sonido bajo una clave.
     *
     * @param {string} clave     - Identificador del sonido (ej: 'disparo')
     * @param {string} ruta      - Ruta al archivo (ej: 'assets/audio/disparo.mp3')
     * @param {number} volumen   - Volumen individual base del sonido (0..1). Default 1.0
     * @param {string} categoria - 'sfx' (default) o 'musica'
     */
    cargar(clave, ruta, volumen = 1.0, categoria = 'sfx') {
        const audio = new Audio(ruta);
        audio.preload = 'auto';
        this.plantillas.set(clave, { audio, volumen, categoria });
    }

    /** Volumen final = volumen individual × multiplicador de su categoría. */
    _volumenFinal(entrada) {
        const mult = entrada.categoria === 'musica'
            ? GestorSonido.volumenMusica
            : GestorSonido.volumenSfx;
        return clamp01(entrada.volumen * mult);
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
        instancia.volume = this._volumenFinal(entrada);

        const promesa = instancia.play();
        // play() devuelve una promesa; si el navegador la rechaza
        // (ej: autoplay bloqueado) la ignoramos para no romper el game loop
        if (promesa && typeof promesa.catch === 'function') {
            promesa.catch(() => {});
        }
    }

    /**
     * Reproduce un sonido en BUCLE y devuelve la instancia para poder detenerla.
     * Útil para música de fondo y sonidos sostenidos.
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
        instancia.volume = this._volumenFinal(entrada);

        // La música en bucle se registra para poder ajustar su volumen en vivo
        // desde el menú de Opciones (guardamos su volumen base).
        if (entrada.categoria === 'musica') {
            instancia._volumenBase = entrada.volumen;
            GestorSonido._musicasActivas.add(instancia);
        }

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
        GestorSonido._musicasActivas.delete(instancia);
    }

    /**
     * Activa o desactiva el silencio global (de esta instancia).
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

    // ========================================================================
    // Ajustes globales de volumen (menú de Opciones) — estáticos y compartidos
    // ========================================================================

    /**
     * Ajusta el volumen de la MÚSICA (0..1). Afecta a todas las instancias y
     * actualiza en vivo la música que esté sonando. Se guarda en localStorage.
     * @param {number} v
     */
    static setVolumenMusica(v) {
        GestorSonido.volumenMusica = clamp01(v);
        for (const inst of GestorSonido._musicasActivas) {
            const base = (typeof inst._volumenBase === 'number') ? inst._volumenBase : 1;
            inst.volume = clamp01(base * GestorSonido.volumenMusica);
        }
        GestorSonido._guardarAjustes();
    }

    /**
     * Ajusta el volumen de los EFECTOS (SFX) (0..1). Se aplica al próximo SFX.
     * Se guarda en localStorage.
     * @param {number} v
     */
    static setVolumenSfx(v) {
        GestorSonido.volumenSfx = clamp01(v);
        GestorSonido._guardarAjustes();
    }

    static getVolumenMusica() { return GestorSonido.volumenMusica; }
    static getVolumenSfx() { return GestorSonido.volumenSfx; }

    /** Carga los volúmenes guardados (localStorage) una sola vez. */
    static _cargarAjustes() {
        if (GestorSonido._ajustesCargados) return;
        GestorSonido._ajustesCargados = true;
        try {
            const a = JSON.parse(localStorage.getItem('ajustesAudio') || '{}');
            if (typeof a.musica === 'number') GestorSonido.volumenMusica = clamp01(a.musica);
            if (typeof a.sfx === 'number') GestorSonido.volumenSfx = clamp01(a.sfx);
        } catch (e) {
            // Si localStorage no está disponible, quedan los defaults (1.0)
        }
    }

    /** Guarda los volúmenes actuales en localStorage. */
    static _guardarAjustes() {
        try {
            localStorage.setItem('ajustesAudio', JSON.stringify({
                musica: GestorSonido.volumenMusica,
                sfx: GestorSonido.volumenSfx,
            }));
        } catch (e) {
            // Ignorar si no se puede guardar
        }
    }
}
