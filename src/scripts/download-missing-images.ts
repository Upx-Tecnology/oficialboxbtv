import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

const missingImages = [
  'b13-banner-home-fundo.webp',
  'ES15-btv-2024-fundo.webp',
  'e13-banner-home.webp',
  'cast-banner-home-scaled.webp'
];

async function downloadMissingImages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = 'https://oficialboxbtv.com';
  const outputDir = path.join(__dirname, '..', '..', 'scraped-content', 'images');

  console.log('🔍 Buscando imágenes faltantes...\n');

  // Navegar a la página principal
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Buscar las URLs de las imágenes faltantes en el HTML
  const html = await page.content();
  
  for (const imageName of missingImages) {
    console.log(`📥 Buscando: ${imageName}`);
    
    // Buscar la URL completa en el HTML
    const regex = new RegExp(`https://oficialboxbtv\\.com/wp-content/uploads/[^"']*${imageName.replace(/\./g, '\\.')}[^"']*`, 'gi');
    const matches = html.match(regex);
    
    if (matches && matches.length > 0) {
      const imageUrl = matches[0].split('?')[0]; // Remover query params
      console.log(`   URL encontrada: ${imageUrl}`);
      
      try {
        // Descargar la imagen
        const response = await page.goto(imageUrl, { waitUntil: 'domcontentloaded' });
        if (response && response.ok()) {
          const buffer = await response.body();
          const filePath = path.join(outputDir, imageName);
          fs.writeFileSync(filePath, buffer);
          console.log(`   ✅ Descargada: ${imageName}\n`);
        } else {
          console.log(`   ❌ Error descargando: ${imageName} (${response?.status()})\n`);
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    } else {
      // Intentar construir la URL directamente
      const possiblePaths = [
        `/wp-content/uploads/2024/07/${imageName}`,
        `/wp-content/uploads/2024/04/${imageName}`,
        `/wp-content/uploads/2024/${imageName}`,
        `/wp-content/uploads/${imageName}`
      ];
      
      let downloaded = false;
      for (const imagePath of possiblePaths) {
        try {
          const imageUrl = `${baseUrl}${imagePath}`;
          const response = await page.goto(imageUrl, { waitUntil: 'domcontentloaded' });
          
          if (response && response.ok()) {
            const buffer = await response.body();
            const filePath = path.join(outputDir, imageName);
            fs.writeFileSync(filePath, buffer);
            console.log(`   ✅ Descargada desde: ${imagePath}\n`);
            downloaded = true;
            break;
          }
        } catch (error) {
          // Continuar con el siguiente path
        }
      }
      
      if (!downloaded) {
        console.log(`   ⚠️  No se pudo encontrar: ${imageName}\n`);
      }
    }
  }

  await browser.close();
  console.log('✅ Proceso completado');
}

if (require.main === module) {
  downloadMissingImages();
}

export { downloadMissingImages };


