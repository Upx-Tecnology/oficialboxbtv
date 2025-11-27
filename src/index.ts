import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { cleanHtml } from './utils/html-cleaner';
import { TemplateHelper } from './utils/template-helper';

const app = express();
const PORT = process.env.PORT || 3000;
const SCRAPED_CONTENT_DIR = path.join(__dirname, '..', 'scraped-content');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos (imágenes, CSS, fuentes)
const imagesDir = path.join(SCRAPED_CONTENT_DIR, 'images');
const cssDir = path.join(SCRAPED_CONTENT_DIR, 'css');
const fontsDir = path.join(SCRAPED_CONTENT_DIR, 'fonts');
const scriptsDir = path.join(SCRAPED_CONTENT_DIR, 'scripts');

// Directorios de public (HTML básico)
const publicCssDir = path.join(PUBLIC_DIR, 'css');
const publicJsDir = path.join(PUBLIC_DIR, 'js');

console.log('📁 Directorios de assets:');
console.log(`  Imágenes: ${imagesDir} (existe: ${fs.existsSync(imagesDir)})`);
console.log(`  CSS: ${cssDir} (existe: ${fs.existsSync(cssDir)})`);
console.log(`  Fuentes: ${fontsDir} (existe: ${fs.existsSync(fontsDir)})`);

// Configurar headers para archivos estáticos con tipos MIME correctos
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '1d',
  setHeaders: (res: express.Response, filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
};

// Servir archivos estáticos - DEBE ir antes de cualquier ruta catch-all
// Prioridad: primero public, luego scraped-content
app.use('/images', express.static(imagesDir, staticOptions));
app.use('/css', express.static(publicCssDir, staticOptions)); // CSS básico primero
app.use('/css', express.static(cssDir, staticOptions)); // CSS scraped como fallback
app.use('/js', express.static(publicJsDir, staticOptions)); // JS básico
app.use('/fonts', express.static(fontsDir, staticOptions));
// No servimos scripts de WordPress/WooCommerce
// app.use('/scripts', express.static(scriptsDir, staticOptions));

// Cargar metadatos
let metadata: any = null;
try {
  const metadataPath = path.join(SCRAPED_CONTENT_DIR, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }
} catch (error) {
  console.error('Error cargando metadatos:', error);
}

// Función para mapear URL a archivo HTML
function getHtmlFileForUrl(url: string): string | null {
  if (!metadata) return null;

  const baseUrl = metadata.baseUrl;
  const urlPath = new URL(url, baseUrl).pathname;
  
  // Buscar en los metadatos
  const page = metadata.pages.find((p: any) => {
    const pageUrl = new URL(p.url).pathname;
    return pageUrl === urlPath || pageUrl === urlPath + '/';
  });

  if (!page) return null;

  // Generar nombre de archivo basado en la URL
  let filename = urlPath === '/' ? 'index.html' : `${urlPath.replace(/\//g, '_').substring(1)}.html`;
  const filepath = path.join(SCRAPED_CONTENT_DIR, 'pages', filename);

  if (fs.existsSync(filepath)) {
    return filepath;
  }

  return null;
}

// Función para extraer el nombre del archivo de una URL
function getImageFilename(url: string): string {
  try {
    // Remover query params y fragmentos
    const cleanUrl = url.split('?')[0].split('#')[0];
    // Extraer el nombre del archivo
    const filename = path.basename(cleanUrl);
    return filename;
  } catch (e) {
    return path.basename(url);
  }
}

// Middleware para procesar HTML - ahora usa el limpiador
function processHtml(html: string, baseUrl: string): string {
  // Limpiar HTML de WordPress/WooCommerce
  html = cleanHtml(html, baseUrl);
  return html;
}

// Ruta para verificar que las imágenes se sirven correctamente
app.get('/test-image', (req, res) => {
  const testImage = path.join(imagesDir, 'logo-btv-stile-crome.png');
  if (fs.existsSync(testImage)) {
    res.sendFile(testImage);
  } else {
    res.status(404).send('Imagen de prueba no encontrada');
  }
});

// Ruta principal y páginas (debe ir después de las rutas estáticas)
// Express.static maneja automáticamente las rutas /images, /css, etc.
// Si llegamos aquí, es porque no es una ruta de asset estático
app.get('*', (req, res) => {
  // Si es una ruta de asset, express.static ya la manejó o no existe
  if (req.url.startsWith('/images/') || 
      req.url.startsWith('/css/') || 
      req.url.startsWith('/js/') ||
      req.url.startsWith('/fonts/')) {
    // Si llegamos aquí, el archivo no existe
    console.log(`⚠️  Archivo estático no encontrado: ${req.url}`);
    return res.status(404).send('Archivo no encontrado');
  }
  
  // Ignorar rutas de scripts (no los servimos)
  if (req.url.startsWith('/scripts/') || req.url.startsWith('/wp-includes/') || req.url.startsWith('/wp-content/')) {
    return res.status(404).send('Recurso no disponible');
  }

  const url = req.url.split('?')[0]; // Remover query params
  
  // PRIORIDAD 1: Servir HTML básico desde public/
  if (url === '/' || url === '') {
    const publicIndex = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(publicIndex)) {
      console.log(`📄 Sirviendo HTML básico: ${url}`);
      return res.sendFile(publicIndex);
    }
  }
  
  // Verificar si hay una página HTML básica en public/
  const publicPagePath = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : `${url.substring(1)}.html`);
  if (fs.existsSync(publicPagePath)) {
    console.log(`📄 Sirviendo HTML básico: ${url}`);
    return res.sendFile(publicPagePath);
  }
  
  // PRIORIDAD 2: Buscar en scraped-content
  const htmlFile = getHtmlFileForUrl(`https://oficialboxbtv.com${url}`);
  if (htmlFile && fs.existsSync(htmlFile)) {
    let html = fs.readFileSync(htmlFile, 'utf-8');
    const originalImageCount = (html.match(/src=["']https?:\/\/oficialboxbtv\.com\/wp-content\/uploads\/[^"']+["']/gi) || []).length;
    html = processHtml(html, 'https://oficialboxbtv.com');
    // Inyectar script de Chatwoot en páginas scraped
    html = TemplateHelper.processScrapedHtml(html);
    const processedImageCount = (html.match(/src=["']\/images\/[^"']+["']/gi) || []).length;
    console.log(`📄 Página scraped: ${url} - Imágenes procesadas: ${originalImageCount} -> ${processedImageCount}`);
    return res.send(html);
  }
  
  // PRIORIDAD 3: Fallback a index.html scraped
  const indexFile = path.join(SCRAPED_CONTENT_DIR, 'pages', 'index.html');
  if (fs.existsSync(indexFile)) {
    let html = fs.readFileSync(indexFile, 'utf-8');
    const originalImageCount = (html.match(/src=["']https?:\/\/oficialboxbtv\.com\/wp-content\/uploads\/[^"']+["']/gi) || []).length;
    html = processHtml(html, 'https://oficialboxbtv.com');
    // Inyectar script de Chatwoot en páginas scraped
    html = TemplateHelper.processScrapedHtml(html);
    const processedImageCount = (html.match(/src=["']\/images\/[^"']+["']/gi) || []).length;
    console.log(`📄 Página (fallback): ${url} - Imágenes procesadas: ${originalImageCount} -> ${processedImageCount}`);
    return res.send(html);
  }
  
  // Si no se encuentra nada
  res.status(404).send('Página no encontrada');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`📁 Contenido scraped desde: ${SCRAPED_CONTENT_DIR}`);
  console.log(`📁 HTML básico desde: ${PUBLIC_DIR}`);
  console.log(`✅ Prioridad: HTML básico > Contenido scraped`);
});

