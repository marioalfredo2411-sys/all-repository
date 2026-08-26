/**
 * Genera las imágenes fuente que consume `@capacitor/assets` (npm run assets).
 *
 * Partimos de `icon-512.png`: la "M" con degradado azul→dorado sobre fondo
 * transparente. Como el extremo azul del degradado se pierde sobre el fondo
 * oscuro de la app, la "M" se monta siempre sobre una placa blanca.
 *
 * Salidas en assets/:
 *   icon.png             1024×1024  ícono opaco (iOS no admite transparencia)
 *   icon-foreground.png  1024×1024  capa frontal del adaptive icon de Android
 *   icon-background.png  1024×1024  capa de fondo del adaptive icon
 *   splash.png           2732×2732  splash claro
 *   splash-dark.png      2732×2732  splash oscuro
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
const SOURCE = join(ROOT, 'icon-512.png');

const BG_DARK = '#0a0e1a'; // --bg de la app
const PLATE = '#ffffff';

/** La "M" reescalada a `size` px, con fondo transparente. */
const glyph = (size) =>
  sharp(SOURCE).resize(size, size, { fit: 'contain', background: '#00000000' }).png().toBuffer();

/** Placa blanca con esquinas redondeadas (radio estilo iOS ≈ 22%). */
const plate = (size) => {
  const r = Math.round(size * 0.22);
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${PLATE}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
};

const canvas = (size, background) =>
  sharp({ create: { width: size, height: size, channels: 4, background } });

async function main() {
  await mkdir(OUT, { recursive: true });

  // ── Ícono opaco (iOS / fallback). La "M" ocupa el 78%; iOS aplica su
  //    propia máscara redondeada, así que el lienzo va cuadrado y lleno.
  const ICON = 1024;
  await canvas(ICON, PLATE)
    .composite([{ input: await glyph(Math.round(ICON * 0.78)), gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'icon.png'));

  // ── Adaptive icon de Android. El sistema recorta hasta el 66% central,
  //    así que la "M" se limita a esa zona segura.
  await canvas(ICON, '#00000000')
    .composite([{ input: await glyph(Math.round(ICON * 0.52)), gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'icon-foreground.png'));

  await canvas(ICON, PLATE).png().toFile(join(OUT, 'icon-background.png'));

  // `capacitor-assets` acepta icon-only.png como alias del ícono opaco.
  await canvas(ICON, PLATE)
    .composite([{ input: await glyph(Math.round(ICON * 0.78)), gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'icon-only.png'));

  // ── Íconos de la PWA (van en la raíz, junto a manifest.json).
  //    apple-touch-icon: sin él iOS usa una captura de la página al instalar.
  await canvas(180, PLATE)
    .composite([{ input: await glyph(Math.round(180 * 0.78)), gravity: 'center' }])
    .png()
    .toFile(join(ROOT, 'apple-touch-icon.png'));

  // Maskable: el contenido debe caber en el 80% central (zona segura W3C).
  await canvas(512, PLATE)
    .composite([{ input: await glyph(Math.round(512 * 0.6)), gravity: 'center' }])
    .png()
    .toFile(join(ROOT, 'icon-maskable-512.png'));

  // ── Splash: placa blanca centrada sobre el fondo oscuro de la app, para
  //    que la transición hacia el mapa no produzca un destello blanco.
  const SPLASH = 2732;
  const PLATE_SIZE = Math.round(SPLASH * 0.22);
  const plateWithGlyph = await sharp(await plate(PLATE_SIZE))
    .composite([{ input: await glyph(Math.round(PLATE_SIZE * 0.72)), gravity: 'center' }])
    .png()
    .toBuffer();

  for (const name of ['splash.png', 'splash-dark.png']) {
    await canvas(SPLASH, BG_DARK)
      .composite([{ input: plateWithGlyph, gravity: 'center' }])
      .png()
      .toFile(join(OUT, name));
  }

  console.log('✓ assets/ generado (icon, icon-foreground, icon-background, splash, splash-dark)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
