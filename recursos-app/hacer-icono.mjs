/**
 * hacer-icono.mjs — Genera los recursos fuente del ícono/splash de la app a
 * partir de la nave (`assets/Nave322.png`) sobre fondo espacial. De acá,
 * @capacitor/assets genera todos los tamaños/densidades de Android.
 *
 * Salidas (en recursos-app/):
 *   - icon-only.png        (1024) ícono completo (fondo + nave) → íconos legacy
 *   - icon-foreground.png  (1024) solo la nave, centrada, fondo transparente → adaptativo (frente)
 *   - icon-background.png  (1024) solo el fondo radial → adaptativo (fondo)
 *   - splash.png / splash-dark.png (2732) pantalla de carga
 *   - _preview.png         (256) para revisar rápido
 *
 * Correr:  node recursos-app/hacer-icono.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (f) => join(raiz, 'recursos-app', f);
const navePath = join(raiz, 'assets', 'Nave322.png');

const fondoRadial = (S) => `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="44%" r="68%">
      <stop offset="0%" stop-color="#2d4390"/>
      <stop offset="50%" stop-color="#15203f"/>
      <stop offset="100%" stop-color="#0a0a16"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
</svg>`;

// --- Ícono 1024 ---
const S = 1024;
const bg1024 = await sharp(Buffer.from(fondoRadial(S))).png().toBuffer();
const nave620 = await sharp(navePath).resize({ height: 620 }).toBuffer();

// icon-background: solo el fondo
await sharp(bg1024).png().toFile(out('icon-background.png'));
// icon-foreground: solo la nave, centrada en un lienzo transparente 1024
await sharp({ create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: nave620, gravity: 'center' }]).png().toFile(out('icon-foreground.png'));
// icon-only: fondo + nave (para íconos legacy)
await sharp(bg1024).composite([{ input: nave620, gravity: 'center' }]).png().toFile(out('icon-only.png'));
await sharp(out('icon-only.png')).resize(256, 256).toFile(out('_preview.png'));

// --- Splash 2732 (nave más chica, centrada) ---
const SS = 2732;
const bgSplash = await sharp(Buffer.from(fondoRadial(SS))).png().toBuffer();
const naveSplash = await sharp(navePath).resize({ height: 760 }).toBuffer();
await sharp(bgSplash).composite([{ input: naveSplash, gravity: 'center' }]).png().toFile(out('splash.png'));
await sharp(out('splash.png')).png().toFile(out('splash-dark.png'));

console.log('[icono] recursos generados en recursos-app/ (icon-only/foreground/background, splash, _preview)');
