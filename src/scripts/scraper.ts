import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

interface PageData {
  url: string;
  html: string;
  title: string;
  images: string[];
  css: string[];
  scripts: string[];
  links: string[];
}

class WebsiteScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private visitedUrls: Set<string> = new Set();
  private pagesData: Map<string, PageData> = new Map();
  private outputDir: string;

  constructor(baseUrl: string, outputDir: string = './scraped-content') {
    this.baseUrl = baseUrl;
    this.outputDir = outputDir;
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async scrape() {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`🚀 Iniciando scraping de ${this.baseUrl}`);
    
    // Crear directorios de salida
    this.ensureDirectories();

    // Empezar desde la página principal
    await this.scrapePage(this.baseUrl);

    // Guardar metadatos
    await this.saveMetadata();

    console.log(`✅ Scraping completado. ${this.pagesData.size} páginas procesadas.`);
  }

  private ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'pages'),
      path.join(this.outputDir, 'images'),
      path.join(this.outputDir, 'css'),
      path.join(this.outputDir, 'scripts'),
      path.join(this.outputDir, 'fonts')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async scrapePage(url: string) {
    if (this.visitedUrls.has(url)) return;
    if (!this.page) return;

    try {
      console.log(`📄 Procesando: ${url}`);
      this.visitedUrls.add(url);

      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Esperar a que la página cargue completamente y contenido dinámico
      await this.page.waitForTimeout(3000);
      
      // Esperar a que los elementos de navegación estén visibles
      try {
        await this.page.waitForSelector('nav, header, a[href]', { timeout: 5000 });
      } catch (e) {
        // Continuar aunque no se encuentren estos elementos
      }

      const pageData: PageData = {
        url,
        html: await this.page.content(),
        title: await this.page.title(),
        images: [],
        css: [],
        scripts: [],
        links: []
      };

      // Extraer imágenes
      pageData.images = await this.extractImages();

      // Extraer CSS
      pageData.css = await this.extractCSS();

      // Extraer scripts
      pageData.scripts = await this.extractScripts();

      // Extraer enlaces internos del HTML
      pageData.links = this.extractLinksFromHTML(pageData.html, url);
      console.log(`  🔗 Enlaces encontrados: ${pageData.links.length}`);

      // Descargar imágenes
      await this.downloadImages(pageData.images, url);

      // Descargar CSS
      await this.downloadCSS(pageData.css, url);

      // Guardar HTML
      await this.saveHTML(pageData, url);

      this.pagesData.set(url, pageData);

      // Procesar enlaces internos encontrados
      for (const link of pageData.links) {
        if (!this.visitedUrls.has(link) && this.isInternalLink(link)) {
          await this.scrapePage(link);
        }
      }

    } catch (error) {
      console.error(`❌ Error procesando ${url}:`, error);
    }
  }

  private async extractImages(): Promise<string[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const images: string[] = [];
      // @ts-ignore - código ejecutado en el navegador
      const imgElements = document.querySelectorAll('img');
      // @ts-ignore - código ejecutado en el navegador
      const bgImages = document.querySelectorAll('[style*="background-image"]');

      imgElements.forEach((img: Element) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src) images.push(src);
      });

      bgImages.forEach((el: Element) => {
        const style = el.getAttribute('style');
        if (style) {
          const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match && match[1]) images.push(match[1]);
        }
      });

      return [...new Set(images)];
    });
  }

  private async extractCSS(): Promise<string[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const css: string[] = [];
      // @ts-ignore - código ejecutado en el navegador
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      // @ts-ignore - código ejecutado en el navegador
      const styleElements = document.querySelectorAll('style');

      linkElements.forEach((link: Element) => {
        const href = link.getAttribute('href');
        if (href) css.push(href);
      });

      styleElements.forEach((style: Element) => {
        const content = style.textContent;
        if (content) {
          // Extraer URLs de @import y url() dentro de estilos inline
          const urlMatches = content.match(/url\(['"]?([^'"]+)['"]?\)/g);
          if (urlMatches) {
            urlMatches.forEach((match: string) => {
              const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
              if (url) css.push(url);
            });
          }
        }
      });

      return [...new Set(css)];
    });
  }

  private async extractScripts(): Promise<string[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const scripts: string[] = [];
      // @ts-ignore - código ejecutado en el navegador
      const scriptElements = document.querySelectorAll('script[src]');

      scriptElements.forEach((script: Element) => {
        const src = script.getAttribute('src');
        if (src) scripts.push(src);
      });

      return [...new Set(scripts)];
    });
  }

  private extractLinksFromHTML(html: string, pageUrl: string): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const matches = html.matchAll(linkRegex);

    for (const match of matches) {
      const href = match[1];
      if (href && href.trim() !== '' && href !== '#' && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        try {
          // Limpiar URL de fragmentos y parámetros de tracking
          let cleanHref = href.split('#')[0].split('?')[0];
          
          // Si es una URL relativa, convertirla a absoluta
          const absoluteUrl = new URL(cleanHref, pageUrl).href;
          
          // Verificar que sea del mismo dominio y no sea un archivo (imagen, css, js, etc.)
          if (absoluteUrl.startsWith(this.baseUrl)) {
            // Excluir archivos estáticos
            const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.pdf', '.zip'];
            const hasStaticExtension = staticExtensions.some(ext => absoluteUrl.toLowerCase().includes(ext));
            
            if (!hasStaticExtension) {
              // Normalizar URL (remover trailing slash excepto para root)
              const normalizedUrl = absoluteUrl.endsWith('/') && absoluteUrl !== this.baseUrl
                ? absoluteUrl.slice(0, -1)
                : absoluteUrl;
              links.push(normalizedUrl);
            }
          }
        } catch (e) {
          // Ignorar URLs inválidas
        }
      }
    }

    return [...new Set(links)];
  }

  private isInternalLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(this.baseUrl);
      return urlObj.origin === baseUrlObj.origin;
    } catch {
      return false;
    }
  }

  private async downloadImages(imageUrls: string[], pageUrl: string) {
    if (!this.page) return;

    for (const imageUrl of imageUrls) {
      try {
        const absoluteUrl = new URL(imageUrl, pageUrl).href;
        const urlPath = new URL(absoluteUrl).pathname;
        const filename = path.basename(urlPath) || 'image.png';
        const filepath = path.join(this.outputDir, 'images', filename);

        // Descargar imagen
        const response = await this.page.goto(absoluteUrl);
        if (response && response.ok()) {
          const buffer = await response.body();
          fs.writeFileSync(filepath, buffer);
          console.log(`  📷 Imagen descargada: ${filename}`);
        }
      } catch (error) {
        console.error(`  ⚠️  Error descargando imagen ${imageUrl}:`, error);
      }
    }
  }

  private async downloadCSS(cssUrls: string[], pageUrl: string) {
    if (!this.page) return;

    for (const cssUrl of cssUrls) {
      try {
        // Saltar archivos de fuentes (woff, woff2, ttf, otf)
        const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf'];
        if (fontExtensions.some(ext => cssUrl.toLowerCase().includes(ext))) {
          // Guardar como fuente en lugar de CSS
          await this.downloadFont(cssUrl, pageUrl);
          continue;
        }

        if (cssUrl.startsWith('http') || cssUrl.startsWith('//')) {
          const absoluteUrl = new URL(cssUrl, pageUrl).href;
          const urlPath = new URL(absoluteUrl).pathname;
          const filename = path.basename(urlPath) || 'style.css';
          const filepath = path.join(this.outputDir, 'css', filename);

          const response = await this.page.goto(absoluteUrl, { waitUntil: 'domcontentloaded' });
          if (response && response.ok()) {
            const buffer = await response.body();
            fs.writeFileSync(filepath, buffer);
            console.log(`  🎨 CSS descargado: ${filename}`);
          }
        }
      } catch (error: any) {
        // Ignorar errores de descarga que son normales (archivos que se descargan automáticamente)
        if (!error.message?.includes('Download is starting')) {
          console.error(`  ⚠️  Error descargando CSS ${cssUrl}:`, error.message);
        }
      }
    }
  }

  private async downloadFont(fontUrl: string, pageUrl: string) {
    if (!this.page) return;

    try {
      const absoluteUrl = new URL(fontUrl, pageUrl).href;
      const urlPath = new URL(absoluteUrl).pathname;
      const filename = path.basename(urlPath) || 'font.woff2';
      const filepath = path.join(this.outputDir, 'fonts', filename);

      // Usar el contexto de la página para descargar
      const response = await this.page.request.get(absoluteUrl);
      if (response.ok()) {
        const buffer = await response.body();
        fs.writeFileSync(filepath, buffer);
        console.log(`  🔤 Fuente descargada: ${filename}`);
      }
    } catch (error: any) {
      // Ignorar errores silenciosamente para fuentes
    }
  }

  private async saveHTML(pageData: PageData, pageUrl: string) {
    const urlPath = new URL(pageUrl).pathname;
    const filename = urlPath === '/' ? 'index.html' : `${urlPath.replace(/\//g, '_')}.html`;
    const filepath = path.join(this.outputDir, 'pages', filename);

    fs.writeFileSync(filepath, pageData.html, 'utf-8');
    console.log(`  💾 HTML guardado: ${filename}`);
  }

  private async saveMetadata() {
    const metadata = {
      baseUrl: this.baseUrl,
      scrapedAt: new Date().toISOString(),
      totalPages: this.pagesData.size,
      pages: Array.from(this.pagesData.entries()).map(([url, data]) => ({
        url,
        title: data.title,
        imagesCount: data.images.length,
        cssCount: data.css.length,
        scriptsCount: data.scripts.length,
        linksCount: data.links.length
      }))
    };

    const metadataPath = path.join(this.outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`📊 Metadatos guardados: metadata.json`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar scraper
async function main() {
  const scraper = new WebsiteScraper('https://oficialboxbtv.com/');
  
  try {
    await scraper.init();
    await scraper.scrape();
  } catch (error) {
    console.error('Error en el scraping:', error);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main();
}

export { WebsiteScraper };

