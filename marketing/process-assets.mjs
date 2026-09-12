import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Convierte una imagen con fondo blanco o claro en un PNG con transparencia alfa suave.
 * @param {string} inputPath Ruta de la imagen origen (JPG o PNG)
 * @param {string} outputPath Ruta del PNG transparente de salida
 * @param {number} threshold Umbral de luminosidad para considerar fondo blanco (230 - 255)
 */
async function makeTransparent(inputPath, outputPath, threshold = 238) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;

    if (brightness >= threshold) {
      data[i + 3] = 0; // Transparente total
    } else if (brightness > threshold - 40) {
      // Suavizado anti-alias en bordes para cero recortes
      const factor = (threshold - brightness) / 40;
      data[i + 3] = Math.round(255 * factor);
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: channels
    }
  })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`✅ PNG transparente generado: ${path.basename(outputPath)}`);
}

async function run() {
  const brainDir = 'C:/Users/Jafeth/.gemini/antigravity-ide/brain/d74a3e28-9634-4c3b-8856-cb9e602a4e50';
  const targetDir = 'marketing/carta-menu/assets';
  const publicDir = 'public/marketing/carta-menu/assets';

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const files = [
    { src: `${brainDir}/botanical_olive_branch_1789087591729.jpg`, dest: 'olive_branch_corner.png', th: 240 },
    { src: `${brainDir}/botanical_ascending_branch_1789088118489.jpg`, dest: 'olive_branch_ascending.png', th: 240 },
    { src: `${brainDir}/botanical_top_right_1789088210898.jpg`, dest: 'olive_branch_top_right.png', th: 240 },
    { src: `${brainDir}/exact_dry_brush_banner_1789088248077.jpg`, dest: 'brush_stroke_banner.png', th: 242 },
    { src: `${brainDir}/line_art_cinnamon_roll_1789088288720.jpg`, dest: 'art_cinnamon_roll.png', th: 240 },
    { src: `${brainDir}/line_art_cookie_bite_1789088860496.jpg`, dest: 'art_cookie_bite.png', th: 240 },
    { src: `${brainDir}/line_art_brownie_cube_1789088906671.jpg`, dest: 'art_brownie_cube.png', th: 240 },
    { src: `${brainDir}/line_art_apple_tartlet_1789088971794.jpg`, dest: 'art_apple_tartlet.png', th: 240 },
    { src: `${brainDir}/line_art_milhojas_1789089049616.jpg`, dest: 'art_milhojas.png', th: 240 },
    { src: `${brainDir}/line_art_orejitas_1789089103046.jpg`, dest: 'art_orejitas.png', th: 240 },
    { src: `${brainDir}/line_art_empanada_1789089160467.jpg`, dest: 'art_empanada.png', th: 240 },
    { src: `${brainDir}/parchment_texture_1789088090561.jpg`, dest: 'parchment_bg.jpg', isBg: true }
  ];

  for (const f of files) {
    if (fs.existsSync(f.src)) {
      const outTarget = `${targetDir}/${f.dest}`;
      const outPublic = `${publicDir}/${f.dest}`;
      if (f.isBg) {
        fs.copyFileSync(f.src, outTarget);
        fs.copyFileSync(f.src, outPublic);
        console.log(`✅ Textura copiada: ${f.dest}`);
      } else {
        await makeTransparent(f.src, outTarget, f.th);
        fs.copyFileSync(outTarget, outPublic);
      }
    } else {
      console.warn(`⚠️ Archivo no encontrado: ${f.src}`);
    }
  }
}

run().catch(console.error);
