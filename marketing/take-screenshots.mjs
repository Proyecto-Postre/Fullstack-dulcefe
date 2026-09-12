import { chromium } from '@playwright/test';
import fs from 'fs';

async function capture() {
  const outDir = 'marketing/screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });

  console.log('Navegando a la carta...');
  const filePath = 'file:///' + process.cwd().replace(/\\/g, '/') + '/marketing/carta-menu/index.html';
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Captura de Lámina 1
  const sheet1 = await page.$('#sheet-1');
  if (sheet1) {
    await sheet1.screenshot({ path: `${outDir}/sheet-1.png` });
    console.log('📸 Capturada Lámina 1');
  }

  // Clic en pestaña 2: Bocaditos
  await page.click('button[data-target="2"]');
  await page.waitForTimeout(1000);
  const sheet2 = await page.$('#sheet-2');
  if (sheet2) {
    await sheet2.screenshot({ path: `${outDir}/sheet-2.png` });
    console.log('📸 Capturada Lámina 2');
  }

  // Clic en pestaña 3: Bizcochos
  await page.click('button[data-target="3"]');
  await page.waitForTimeout(1000);
  const sheet3 = await page.$('#sheet-3');
  if (sheet3) {
    await sheet3.screenshot({ path: `${outDir}/sheet-3.png` });
    console.log('📸 Capturada Lámina 3');
  }

  // Clic en pestaña 4: Tradicionales
  await page.click('button[data-target="4"]');
  await page.waitForTimeout(1000);
  const sheet4 = await page.$('#sheet-4');
  if (sheet4) {
    await sheet4.screenshot({ path: `${outDir}/sheet-4.png` });
    console.log('📸 Capturada Lámina 4');
  }

  await browser.close();
  console.log('✨ Capturas completadas exitosamente.');
}

capture().catch(console.error);
