import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function extractAssets() {
  const userDir = 'C:/Users/Jafeth/.gemini/antigravity-ide/brain/d74a3e28-9634-4c3b-8856-cb9e602a4e50/.user_uploaded';
  const targetDir = 'marketing/carta-menu/assets';
  const publicDir = 'public/marketing/carta-menu/assets';

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // Función para recortar una región y remover el fondo crema/blanco convirtiéndolo a canal alfa
  async function cropAndAlpha(srcImg, cropBox, destName, creamR = 241, creamG = 226, creamB = 205, tol = 30) {
    const croppedBuffer = await sharp(srcImg)
      .extract(cropBox)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = croppedBuffer;
    const ch = info.channels;

    for (let i = 0; i < data.length; i += ch) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Distancia euclidiana al color del papel crema/blanco
      const diffR = Math.abs(r - creamR);
      const diffG = Math.abs(g - creamG);
      const diffB = Math.abs(b - creamB);
      const maxDiff = Math.max(diffR, diffG, diffB);

      // Si es fondo crema o casi blanco
      if (maxDiff <= tol || (r > 230 && g > 215 && b > 195)) {
        data[i + 3] = 0; // Transparente
      } else if (maxDiff <= tol + 20) {
        // Suavizado anti-alias
        const factor = (maxDiff - tol) / 20;
        data[i + 3] = Math.round(255 * factor);
      }
    }

    const outPath = `${targetDir}/${destName}`;
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: ch }
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

    fs.copyFileSync(outPath, `${publicDir}/${destName}`);
    console.log(`✅ Extraído PNG idéntico: ${destName}`);
  }

  // 1. Lámina 1: 576 x 1024
  const lam1 = `${userDir}/media_1789089480752.jpg`;
  
  // Rama superior izquierda (aprox 0,0 a 160,250)
  await cropAndAlpha(lam1, { left: 0, top: 0, width: 160, height: 260 }, 'orig_leaves_top_left.png');

  // Rama ascendente inferior derecha (aprox 480, 650 a 96, 370)
  await cropAndAlpha(lam1, { left: 470, top: 620, width: 106, height: 380 }, 'orig_leaves_bottom_right.png');

  // Sello Hechos con Dedicación (sobre fondo verde oscuro: extraemos sin borrar fondo o recortado)
  const stampBuffer = await sharp(lam1)
    .extract({ left: 450, top: 50, width: 110, height: 110 })
    .png()
    .toFile(`${targetDir}/orig_stamp_dark.png`);
  fs.copyFileSync(`${targetDir}/orig_stamp_dark.png`, `${publicDir}/orig_stamp_dark.png`);

  // Banner brush stroke central (aprox left: 100, top: 260, width: 376, height: 65)
  // Lo extraemos limpio con su texto
  await sharp(lam1)
    .extract({ left: 105, top: 262, width: 365, height: 60 })
    .png()
    .toFile(`${targetDir}/orig_brush_banner.png`);
  fs.copyFileSync(`${targetDir}/orig_brush_banner.png`, `${publicDir}/orig_brush_banner.png`);

  // 2. Lámina 2 (Bocaditos): media_1789089480694.jpg (576 x 1024)
  const lam2 = `${userDir}/media_1789089480694.jpg`;
  
  // Roles de canela (aprox left: 40, top: 340, width: 85, height: 85)
  await cropAndAlpha(lam2, { left: 42, top: 345, width: 82, height: 82 }, 'orig_rol_canela.png');

  // Galletita mordida (aprox left: 40, top: 515, width: 85, height: 85)
  await cropAndAlpha(lam2, { left: 45, top: 515, width: 78, height: 78 }, 'orig_galletita.png');

  // Mini brownies (aprox left: 40, top: 705, width: 85, height: 85)
  await cropAndAlpha(lam2, { left: 42, top: 705, width: 84, height: 80 }, 'orig_brownie.png');

  // Tartaletitas (aprox left: 40, top: 845, width: 85, height: 85)
  await cropAndAlpha(lam2, { left: 40, top: 845, width: 88, height: 80 }, 'orig_tartaleta.png');

  // Sello sobre crema de Lámina 2 (arriba derecha)
  await cropAndAlpha(lam2, { left: 455, top: 52, width: 100, height: 100 }, 'orig_stamp_light.png');

  // 3. Lámina 4 (Bocaditos Tradicionales): media_1789089480677.jpg
  const lam4 = `${userDir}/media_1789089480677.jpg`;

  // Mil hojitas (aprox left: 35, top: 265, width: 60, height: 60)
  await cropAndAlpha(lam4, { left: 36, top: 266, width: 56, height: 56 }, 'orig_milhojas.png');

  // Orejitas (aprox left: 295, top: 265, width: 60, height: 60)
  await cropAndAlpha(lam4, { left: 295, top: 266, width: 58, height: 56 }, 'orig_orejitas.png');

  // Empanaditas mixtas (aprox left: 35, top: 375, width: 60, height: 60)
  await cropAndAlpha(lam4, { left: 36, top: 378, width: 56, height: 56 }, 'orig_empanadita.png');

  // Empanaditas carne y pollo (aprox left: 295, top: 375, width: 60, height: 60)
  await cropAndAlpha(lam4, { left: 295, top: 378, width: 56, height: 56 }, 'orig_empanadita_carne.png');

  // Canastillas (aprox left: 35, top: 485, width: 60, height: 60)
  await cropAndAlpha(lam4, { left: 36, top: 485, width: 56, height: 56 }, 'orig_canastilla.png');

  // Enrolladitos (aprox left: 35, top: 595, width: 60, height: 60)
  await cropAndAlpha(lam4, { left: 36, top: 598, width: 56, height: 56 }, 'orig_enrolladito.png');

  // Alfajorcitos Regulares (aprox left: 38, top: 720, width: 56, height: 56)
  await cropAndAlpha(lam4, { left: 38, top: 720, width: 56, height: 56 }, 'orig_alfajor_reg.png');

  // Alfajorcitos Chips (aprox left: 300, top: 720, width: 56, height: 56)
  await cropAndAlpha(lam4, { left: 300, top: 720, width: 56, height: 56 }, 'orig_alfajor_chips.png');

  // Triples (aprox left: 38, top: 865, width: 56, height: 56)
  await cropAndAlpha(lam4, { left: 38, top: 865, width: 56, height: 56 }, 'orig_triple.png');

  // Triples Premium (aprox left: 300, top: 865, width: 56, height: 56)
  await cropAndAlpha(lam4, { left: 300, top: 865, width: 56, height: 56 }, 'orig_triple_prem.png');

  // 4. Textura exacta del pergamino de fondo (un recorte de 300x300 de zona limpia de la lámina)
  await sharp(lam1)
    .extract({ left: 160, top: 450, width: 250, height: 250 })
    .toFile(`${targetDir}/orig_parchment_exact.jpg`);
  fs.copyFileSync(`${targetDir}/orig_parchment_exact.jpg`, `${publicDir}/orig_parchment_exact.jpg`);

  console.log("🌟 Todos los elementos originales han sido extraídos como PNG transparente sin fondo.");
}

extractAssets().catch(console.error);
