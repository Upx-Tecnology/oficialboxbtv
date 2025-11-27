import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface PageIssue {
  url: string;
  missingImages: string[];
  brokenImages: string[];
  missingContent: string[];
  errors: string[];
}

interface ImageStatus {
  url: string;
  status: number | null;
  exists: boolean;
  filename: string;
}

class PageVerifier {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private scrapedContentDir: string;
  private issues: PageIssue[] = [];
  private allImages: Map<string, ImageStatus> = new Map();

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.scrapedContentDir = path.join(__dirname, '..', '..', 'scraped-content');
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Interceptar todas las respuestas para rastrear imágenes
    this.page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/images/')) {
        const status = response.status();
        const filename = path.basename(url.split('?')[0]);
        const localPath = path.join(this.scrapedContentDir, 'images', filename);
        const exists = fs.existsSync(localPath);
        
        this.allImages.set(url, {
          url,
          status,
          exists,
          filename
        });
      }
    });

    // Capturar errores de la consola
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Failed to load') || text.includes('404')) {
          console.log(`  ⚠️  Error en consola: ${text}`);
        }
      }
    });
  }

  async verifyPage(pageUrl: string): Promise<PageIssue> {
    if (!this.page) throw new Error('Browser not initialized');

    const issue: PageIssue = {
      url: pageUrl,
      missingImages: [],
      brokenImages: [],
      missingContent: [],
      errors: []
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 Verificando: ${this.baseUrl}${pageUrl}`);
    console.log(`${'='.repeat(80)}`);

    try {
      await this.page.goto(`${this.baseUrl}${pageUrl}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Esperar a que las imágenes carguen
      await this.page.waitForTimeout(3000);

      // Verificar imágenes
      const imageIssues = await this.checkImages();
      issue.missingImages = imageIssues.missing;
      issue.brokenImages = imageIssues.broken;

      // Verificar contenido de la página
      const contentIssues = await this.checkContent();
      issue.missingContent = contentIssues;

      // Verificar errores en la página
      const pageErrors = await this.checkPageErrors();
      issue.errors = pageErrors;

      // Mostrar resumen
      this.printSummary(issue);

      // Tomar screenshot
      const screenshotName = pageUrl === '/' ? 'index' : pageUrl.replace(/\//g, '_').substring(1);
      const screenshotPath = path.join(__dirname, '..', '..', `screenshot-${screenshotName}.png`);
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      console.log(`  📸 Screenshot guardado: ${screenshotPath}`);

    } catch (error: any) {
      issue.errors.push(`Error al cargar la página: ${error.message}`);
      console.error(`  ❌ Error: ${error.message}`);
    }

    return issue;
  }

  private async checkImages(): Promise<{ missing: string[]; broken: string[] }> {
    if (!this.page) return { missing: [], broken: [] };

    const missing: string[] = [];
    const broken: string[] = [];

    // Obtener todas las imágenes del DOM
    const images = await this.page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      const imageData: Array<{ src: string; srcset: string; dataSrc: string; alt: string }> = [];
      
      imgElements.forEach((img: HTMLImageElement) => {
        imageData.push({
          src: img.src || '',
          srcset: img.srcset || '',
          dataSrc: img.getAttribute('data-src') || '',
          alt: img.alt || ''
        });
      });

      return imageData;
    });

    console.log(`\n📷 Imágenes encontradas en el DOM: ${images.length}`);

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

    console.log(`  URLs únicas: ${imageUrls.size}`);

    // Verificar imágenes rotas
    const brokenImages = await this.page.evaluate(() => {
      const broken: Array<{ src: string; alt: string }> = [];
      const imgElements = document.querySelectorAll('img');
      
      imgElements.forEach((img: HTMLImageElement) => {
        if (!img.complete || img.naturalHeight === 0) {
          broken.push({
            src: img.src || img.getAttribute('src') || '',
            alt: img.alt || ''
          });
        }
      });

      return broken;
    });

    // Verificar qué imágenes están rotas o faltan
    for (const imgUrl of imageUrls) {
      if (imgUrl.includes('/images/')) {
        const filename = path.basename(imgUrl.split('?')[0]);
        const localPath = path.join(this.scrapedContentDir, 'images', filename);
        const exists = fs.existsSync(localPath);
        
        const imageStatus = this.allImages.get(imgUrl);
        const status = imageStatus?.status;
        
        if (!exists) {
          missing.push(filename);
          console.log(`  ❌ Imagen faltante: ${filename}`);
        } else if (status && status >= 400) {
          broken.push(filename);
          console.log(`  ⚠️  Imagen con error HTTP ${status}: ${filename}`);
        } else if (brokenImages.some(bi => bi.src === imgUrl)) {
          broken.push(filename);
          console.log(`  ⚠️  Imagen rota en DOM: ${filename}`);
        }
      }
    }

    console.log(`\n  📊 Resumen de imágenes:`);
    console.log(`    ✅ Correctas: ${imageUrls.size - missing.length - broken.length}`);
    console.log(`    ❌ Faltantes: ${missing.length}`);
    console.log(`    ⚠️  Rotas: ${broken.length}`);

    return { missing, broken };
  }

  private async checkContent(): Promise<string[]> {
    if (!this.page) return [];

    const issues: string[] = [];

    // Verificar que la página tenga contenido
    const hasContent = await this.page.evaluate(() => {
      const body = document.body;
      const textContent = body.textContent || '';
      const hasText = textContent.trim().length > 100;
      const hasImages = document.querySelectorAll('img').length > 0;
      const hasMainContent = document.querySelector('main') || 
                            document.querySelector('.content') ||
                            document.querySelector('#main-content') ||
                            document.querySelector('.entry-content');
      
      return {
        hasText,
        hasImages,
        hasMainContent: !!hasMainContent,
        textLength: textContent.trim().length
      };
    });

    console.log(`\n📄 Verificación de contenido:`);
    console.log(`  Texto: ${hasContent.textLength} caracteres`);
    console.log(`  Tiene imágenes: ${hasContent.hasImages}`);
    console.log(`  Tiene contenido principal: ${hasContent.hasMainContent}`);

    if (!hasContent.hasText) {
      issues.push('Página sin contenido de texto');
    }
    if (!hasContent.hasImages && this.page.url().includes(this.baseUrl)) {
      issues.push('Página sin imágenes');
    }
    if (!hasContent.hasMainContent) {
      issues.push('No se encontró área de contenido principal');
    }

    return issues;
  }

  private async checkPageErrors(): Promise<string[]> {
    if (!this.page) return [];

    const errors: string[] = [];

    // Verificar errores de recursos
    const resourceErrors = await this.page.evaluate(() => {
      const errors: string[] = [];
      const scripts = document.querySelectorAll('script[src]');
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      
      scripts.forEach((script: Element) => {
        const src = script.getAttribute('src');
        if (src && (src.includes('wp-content') || src.includes('wp-includes'))) {
          errors.push(`Script de WordPress encontrado: ${src}`);
        }
      });
      
      links.forEach((link: Element) => {
        const href = link.getAttribute('href');
        if (href && (href.includes('wp-content') || href.includes('wp-includes'))) {
          errors.push(`CSS de WordPress encontrado: ${href}`);
        }
      });
      
      return errors;
    });

    errors.push(...resourceErrors);

    return errors;
  }

  private printSummary(issue: PageIssue) {
    console.log(`\n📋 Resumen de problemas:`);
    
    if (issue.missingImages.length > 0) {
      console.log(`  ❌ Imágenes faltantes (${issue.missingImages.length}):`);
      issue.missingImages.slice(0, 5).forEach(img => {
        console.log(`     - ${img}`);
      });
      if (issue.missingImages.length > 5) {
        console.log(`     ... y ${issue.missingImages.length - 5} más`);
      }
    }
    
    if (issue.brokenImages.length > 0) {
      console.log(`  ⚠️  Imágenes rotas (${issue.brokenImages.length}):`);
      issue.brokenImages.slice(0, 5).forEach(img => {
        console.log(`     - ${img}`);
      });
      if (issue.brokenImages.length > 5) {
        console.log(`     ... y ${issue.brokenImages.length - 5} más`);
      }
    }
    
    if (issue.missingContent.length > 0) {
      console.log(`  ⚠️  Problemas de contenido:`);
      issue.missingContent.forEach(problem => {
        console.log(`     - ${problem}`);
      });
    }
    
    if (issue.errors.length > 0) {
      console.log(`  ❌ Errores (${issue.errors.length}):`);
      issue.errors.slice(0, 5).forEach(error => {
        console.log(`     - ${error}`);
      });
    }
    
    if (issue.missingImages.length === 0 && 
        issue.brokenImages.length === 0 && 
        issue.missingContent.length === 0 && 
        issue.errors.length === 0) {
      console.log(`  ✅ No se encontraron problemas`);
    }
  }

  async verifyAllPages() {
    // Cargar metadatos para obtener todas las páginas
    const metadataPath = path.join(this.scrapedContentDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.error('❌ No se encontró metadata.json');
      return;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pages = metadata.pages || [];

    console.log(`\n🚀 Iniciando verificación de ${pages.length} páginas\n`);

    for (const pageData of pages) {
      const pageUrl = new URL(pageData.url).pathname;
      const issue = await this.verifyPage(pageUrl);
      this.issues.push(issue);
      
      // Pequeña pausa entre páginas
      await this.page?.waitForTimeout(1000);
    }

    // Generar reporte final
    this.generateReport();
  }

  private generateReport() {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 REPORTE FINAL`);
    console.log(`${'='.repeat(80)}\n`);

    const totalPages = this.issues.length;
    const pagesWithIssues = this.issues.filter(i => 
      i.missingImages.length > 0 || 
      i.brokenImages.length > 0 || 
      i.missingContent.length > 0 || 
      i.errors.length > 0
    ).length;

    const totalMissingImages = this.issues.reduce((sum, i) => sum + i.missingImages.length, 0);
    const totalBrokenImages = this.issues.reduce((sum, i) => sum + i.brokenImages.length, 0);
    const totalErrors = this.issues.reduce((sum, i) => sum + i.errors.length, 0);

    console.log(`📄 Páginas verificadas: ${totalPages}`);
    console.log(`✅ Páginas sin problemas: ${totalPages - pagesWithIssues}`);
    console.log(`⚠️  Páginas con problemas: ${pagesWithIssues}`);
    console.log(`\n📷 Imágenes:`);
    console.log(`   ❌ Faltantes: ${totalMissingImages}`);
    console.log(`   ⚠️  Rotas: ${totalBrokenImages}`);
    console.log(`\n❌ Errores totales: ${totalErrors}`);

    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, '..', '..', 'verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalPages,
      pagesWithIssues,
      totalMissingImages,
      totalBrokenImages,
      totalErrors,
      issues: this.issues
    }, null, 2));

    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar verificación
async function main() {
  const verifier = new PageVerifier('http://localhost:3000');
  
  try {
    await verifier.init();
    await verifier.verifyAllPages();
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await verifier.close();
  }
}

if (require.main === module) {
  main();
}

export { PageVerifier };


