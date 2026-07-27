/**
 * build-www.mjs — Arma la carpeta `www/` que Capacitor empaqueta dentro de la
 * app Android (es el `webDir` de capacitor.config.json).
 *
 * El juego es un sitio estático sin bundler, así que en vez de apuntar Capacitor
 * a la raíz del repo (que arrastraría node_modules, .git, android/, docs, etc.),
 * copiamos SOLO lo que el juego necesita a `www/`.
 *
 * Correr:  npm run cap:www     (o se corre solo con  npm run cap:sync)
 *
 * Firebase se carga desde CDN (gstatic) en runtime, no hace falta copiarlo.
 */
import { existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(raiz, 'www');

// Archivos/carpetas del juego que SÍ van dentro de la app.
const incluir = ['index.html', 'assets', 'css', 'libs', 'src'];

// Limpiar y recrear www/
if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const item of incluir) {
    const origen = join(raiz, item);
    if (!existsSync(origen)) {
        console.warn(`[build-www] AVISO: no existe "${item}", se saltea.`);
        continue;
    }
    cpSync(origen, join(www, item), { recursive: true });
    console.log(`[build-www] copiado: ${item}`);
}

console.log('[build-www] listo → www/');
