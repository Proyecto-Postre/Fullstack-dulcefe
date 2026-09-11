import sharp from 'sharp';
import fs from 'fs';

async function analyzePalette() {
  const userDir = 'C:/Users/Jafeth/.gemini/antigravity-ide/brain/d74a3e28-9634-4c3b-8856-cb9e602a4e50/.user_uploaded';
  
  // Analicemos media_1789089480752.jpg (Lámina 1: Menú de Postres)
  const imgPath = `${userDir}/media_1789089480752.jpg`;
  const image = sharp(imgPath);
  const metadata = await image.metadata();
  console.log(`Dimensiones de imagen original: ${metadata.width}x${metadata.height}`);

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  function getPixel(x, y) {
    const idx = (y * info.width + x) * info.channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return { r, g, b, hex };
  }

  // Muestreos en coordenadas clave de la imagen de 576x1024 aprox (o su resolución)
  const W = info.width;
  const H = info.height;

  // 1. Fondo crema central (por ejemplo a x: W*0.4, y: H*0.4)
  const bgCream = getPixel(Math.round(W * 0.45), Math.round(H * 0.35));
  
  // 2. Verde de la onda lateral derecha (arriba derecha x: W*0.9, y: H*0.1)
  const greenWave = getPixel(Math.round(W * 0.9), Math.round(H * 0.1));
  
  // 3. Verde del título "MENÚ" (alrededor de x: W*0.4, y: H*0.15)
  // Busquemos el pixel más oscuro en esa zona
  let minLum = 999;
  let titleColor = null;
  for (let y = Math.round(H * 0.12); y < Math.round(H * 0.18); y += 2) {
    for (let x = Math.round(W * 0.25); x < Math.round(W * 0.65); x += 2) {
      const p = getPixel(x, y);
      const lum = (p.r + p.g + p.b) / 3;
      if (lum < minLum) {
        minLum = lum;
        titleColor = p;
      }
    }
  }

  // 4. Color cursiva "de Postres" (alrededor de x: W*0.4, y: H*0.21)
  // Es un tono dorado/oliva cálido. Busquemos en esa franja
  let maxSatGold = null;
  let maxSat = -1;
  for (let y = Math.round(H * 0.18); y < Math.round(H * 0.24); y += 2) {
    for (let x = Math.round(W * 0.25); x < Math.round(W * 0.65); x += 2) {
      const p = getPixel(x, y);
      // Filtramos que no sea el fondo crema ni negro
      const lum = (p.r + p.g + p.b) / 3;
      if (lum > 70 && lum < 180) {
        const sat = (Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b));
        if (sat > maxSat && p.r >= p.g && p.g > p.b) {
          maxSat = sat;
          maxSatGold = p;
        }
      }
    }
  }

  // 5. Verde del Badge de precio (alrededor de x: W*0.78, y: H*0.42)
  let badgeColor = null;
  minLum = 999;
  for (let y = Math.round(H * 0.41); y < Math.round(H * 0.44); y += 2) {
    for (let x = Math.round(W * 0.72); x < Math.round(W * 0.84); x += 2) {
      const p = getPixel(x, y);
      const lum = (p.r + p.g + p.b) / 3;
      if (lum < minLum && p.g > p.r && p.g > p.b) {
        minLum = lum;
        badgeColor = p;
      }
    }
  }

  // 6. Verde del Brush banner "INGREDIENTES DE CALIDAD..." (alrededor de y: H*0.28)
  let brushColor = null;
  minLum = 999;
  for (let y = Math.round(H * 0.26); y < Math.round(H * 0.30); y += 2) {
    for (let x = Math.round(W * 0.35); x < Math.round(W * 0.60); x += 2) {
      const p = getPixel(x, y);
      const lum = (p.r + p.g + p.b) / 3;
      if (lum < minLum && p.g >= p.b) {
        minLum = lum;
        brushColor = p;
      }
    }
  }

  // 7. Línea punteada
  const dotsColor = getPixel(Math.round(W * 0.60), Math.round(H * 0.425));

  console.log("🎨 PALETA EXACTA EXTRAÍDA DE LA IMAGEN:");
  console.log("Fondo Crema Pergamino:", bgCream.hex, bgCream);
  console.log("Verde Onda Lateral:", greenWave.hex, greenWave);
  console.log("Verde Título MENÚ:", titleColor?.hex, titleColor);
  console.log("Dorado/Oliva Cursiva 'de Postres':", maxSatGold?.hex, maxSatGold);
  console.log("Verde Badge Precio:", badgeColor?.hex, badgeColor);
  console.log("Verde Brush Banner:", brushColor?.hex, brushColor);
  console.log("Puntos suspensivos:", dotsColor.hex, dotsColor);
}

analyzePalette().catch(console.error);
