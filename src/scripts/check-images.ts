import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ImageCheck {
  url: string;
  status: number | null;
  error: string | null;
  exists: boolean;
}

class ImageChecker {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private results: ImageCheck[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Interceptar requests de imágenes para verificar su estado
    this.page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/images/')) {
        const status = response.status();
        const filename = path.basename(url.split('?')[0]);
        const localPath = path.join(__dirname, '..', '..', 'scraped-content', 'images', filename);
        const exists = fs.existsSync(localPath);
        
        this.results.push({
          url,
          status,
          error: status >= 400 ? `HTTP ${status}` : null,
          exists
        });

        if (status >= 400 || !exists) {
          console.log(`❌ Imagen con problemas: ${filename}`);
          console.log(`   URL: ${url}`);
          console.log(`   Status: ${status}`);
          console.log(`   Existe localmente: ${exists}`);
        }
      }
    });
  }

  async checkPage(pageUrl: string = '/') {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`\n🔍 Revisando página: ${this.baseUrl}${pageUrl}`);
    
    await this.page.goto(`${this.baseUrl}${pageUrl}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Esperar a que las imágenes carguen
    await this.page.waitForTimeout(3000);

    // Obtener todas las imágenes de la página
    const images = await this.page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      const imageData: Array<{ src: string; srcset: string; dataSrc: string }> = [];
      
      imgElements.forEach((img: HTMLImageElement) => {
        imageData.push({
          src: img.src || '',
          srcset: img.srcset || '',
          dataSrc: img.getAttribute('data-src') || ''
        });
      });

      return imageData;
    });

    console.log(`\n📊 Total de imágenes encontradas en el DOM: ${images.length}`);

    // Verificar cada imagen
    const imageUrls = new Set<string>();
    images.forEach(img => {
      if (img.src) imageUrls.add(img.src);
      if (img.dataSrc) imageUrls.add(img.dataSrc);
      if (img.srcset) {
        img.srcset.split(',').forEach(item => {
          const url = item.trim().split(/\s+/)[0];
          if (url) imageUrls.add(url);
        });
      }
    });

    console.log(`📊 URLs únicas de imágenes: ${imageUrls.size}`);

    // Verificar qué imágenes están rotas
    const brokenImages = await this.page.evaluate(() => {
      const broken: string[] = [];
      const imgElements = document.querySelectorAll('img');
      
      imgElements.forEach((img: HTMLImageElement) => {
        if (!img.complete || img.naturalHeight === 0) {
          broken.push(img.src || img.getAttribute('src') || '');
        }
      });

      return broken;
    });

    console.log(`\n❌ Imágenes rotas detectadas: ${brokenImages.length}`);
    if (brokenImages.length > 0) {
      brokenImages.forEach(url => {
        console.log(`   - ${url}`);
      });
    }

    // Verificar imágenes en el HTML fuente
    const html = await this.page.content();
    const imageMatches = html.match(/src=["']([^"']+)["']/gi) || [];
    const localImageMatches = imageMatches.filter(m => m.includes('/images/'));
    
    console.log(`\n📄 Imágenes en HTML con /images/: ${localImageMatches.length}`);
    
    // Extraer nombres de archivo de las URLs locales
    const localImageFiles = new Set<string>();
    localImageMatches.forEach(match => {
      const urlMatch = match.match(/\/images\/([^"']+)/);
      if (urlMatch) {
        const filename = urlMatch[1].split('?')[0];
        localImageFiles.add(filename);
      }
    });

    console.log(`📁 Archivos de imágenes referenciados: ${localImageFiles.size}`);

    // Verificar qué archivos existen localmente
    const imagesDir = path.join(__dirname, '..', '..', 'scraped-content', 'images');
    const existingFiles = fs.readdirSync(imagesDir);
    const missingFiles: string[] = [];

    localImageFiles.forEach(filename => {
      if (!existingFiles.includes(filename)) {
        missingFiles.push(filename);
        console.log(`⚠️  Archivo faltante: ${filename}`);
      }
    });

    console.log(`\n✅ Archivos existentes: ${existingFiles.length}`);
    console.log(`❌ Archivos faltantes: ${missingFiles.length}`);

    // Verificar requests fallidos
    const failedRequests = this.results.filter(r => r.status && r.status >= 400);
    console.log(`\n📊 Resumen de requests:`);
    console.log(`   Total: ${this.results.length}`);
    console.log(`   Exitosos: ${this.results.filter(r => r.status && r.status < 400).length}`);
    console.log(`   Fallidos: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log(`\n❌ Requests fallidos:`);
      failedRequests.forEach(r => {
        console.log(`   - ${r.url} (${r.error})`);
      });
    }

    // Tomar screenshot para verificar visualmente
    const screenshotPath = path.join(__dirname, '..', '..', 'screenshot-check.png');
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    console.log(`\n📸 Screenshot guardado en: ${screenshotPath}`);

    return {
      totalImages: images.length,
      uniqueUrls: imageUrls.size,
      brokenImages: brokenImages.length,
      missingFiles: missingFiles.length,
      failedRequests: failedRequests.length
    };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar checker
async function main() {
  const checker = new ImageChecker('http://localhost:3000');
  
  try {
    await checker.init();
    const results = await checker.checkPage('/');
    
    console.log('\n✅ Revisión completada');
    console.log('\n📊 Resumen:');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la revisión:', error);
  } finally {
    await checker.close();
  }
}

if (require.main === module) {
  main();
}

export { ImageChecker };


