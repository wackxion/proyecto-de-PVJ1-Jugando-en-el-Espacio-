/**
 * Anuncios.js — Wrapper de AdMob para el anuncio RECOMPENSADO (rewarded) que se
 * usa para REVIVIR en el Game Over.
 *
 * Usa los IDs de PRUEBA de Google. Cuando el dev tenga cuenta de AdMob:
 *   1. Reemplazar TEST_REWARDED_ANDROID por el "ad unit" real.
 *   2. Cambiar el App ID de prueba por el real en AndroidManifest.xml.
 *   3. Poner isTesting/initializeForTesting en false.
 *
 * En la WEB (sin Capacitor) queda inactivo → disponible() devuelve false, así el
 * botón "Revivir" solo aparece en la app.
 */

// Ad unit REAL del rewarded (revivir), de la cuenta de AdMob del dev.
// ⚠️ Mientras `isTesting` (abajo) sea true, AdMob muestra anuncios de PRUEBA de
// Google igual → seguro para probar SIN riesgo de ban. Pasar isTesting a false
// (y initializeForTesting a false) recién al PUBLICAR.
const REWARDED_ANDROID = 'ca-app-pub-8065871181264852/9966477167';

const EV_REWARD  = 'onRewardedVideoAdReward';     // el usuario completó y obtuvo la recompensa
const EV_DISMISS = 'onRewardedVideoAdDismissed';  // el anuncio se cerró (con o sin recompensa)

export class Anuncios {
    constructor() {
        this.plugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) || null;
        this.rewardedListo = false;
    }

    /** true si AdMob está disponible (app nativa). En la web es false. */
    disponible() { return !!this.plugin; }

    /** Inicializa AdMob y precarga el primer rewarded. Silencioso si no hay plugin. */
    async inicializar() {
        if (!this.plugin) return;
        try {
            await this.plugin.initialize({ initializeForTesting: true });
            this._precargarRewarded();
        } catch (e) { /* sin AdMob / error: se ignora, el juego sigue */ }
    }

    async _precargarRewarded() {
        if (!this.plugin) return;
        try {
            await this.plugin.prepareRewardVideoAd({ adId: REWARDED_ANDROID, isTesting: true });
            this.rewardedListo = true;
        } catch (e) { this.rewardedListo = false; }
    }

    /**
     * Muestra el anuncio recompensado. Llama `onReward()` SOLO si el usuario lo
     * completó y obtuvo la recompensa. Resuelve a true/false.
     * @param {Function} onReward
     * @returns {Promise<boolean>}
     */
    async mostrarRewarded(onReward) {
        if (!this.plugin) return false;
        if (!this.rewardedListo) { await this._precargarRewarded(); }
        return new Promise(async (resolve) => {
            let recompensado = false;
            let subReward = null, subDismiss = null;
            const limpiar = () => {
                try { if (subReward && subReward.remove) subReward.remove(); } catch (e) {}
                try { if (subDismiss && subDismiss.remove) subDismiss.remove(); } catch (e) {}
            };
            try {
                subReward = await this.plugin.addListener(EV_REWARD, () => { recompensado = true; });
                subDismiss = await this.plugin.addListener(EV_DISMISS, () => {
                    limpiar();
                    this.rewardedListo = false;
                    this._precargarRewarded();               // dejar listo el próximo
                    if (recompensado && onReward) onReward();
                    resolve(recompensado);
                });
                await this.plugin.showRewardVideoAd();
            } catch (e) {
                limpiar();
                resolve(false);
            }
        });
    }
}
