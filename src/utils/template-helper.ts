import * as fs from 'fs';
import * as path from 'path';

/**
 * Utilidad para crear páginas HTML con el template base
 */
export class TemplateHelper {
  private static readonly PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
  private static readonly TEMPLATE_HEADER = this.getHeader();
  private static readonly TEMPLATE_FOOTER = this.getFooter();
  private static readonly CHATWOOT_SCRIPT = this.getChatwootScript();

  /**
   * Obtiene el header del template
   */
  private static getHeader(): string {
    const headerPath = path.join(this.PUBLIC_DIR, 'partials', 'header.html');
    if (fs.existsSync(headerPath)) {
      return fs.readFileSync(headerPath, 'utf-8');
    }
    return '';
  }

  /**
   * Obtiene el footer del template
   */
  private static getFooter(): string {
    const footerPath = path.join(this.PUBLIC_DIR, 'partials', 'footer.html');
    if (fs.existsSync(footerPath)) {
      return fs.readFileSync(footerPath, 'utf-8');
    }
    return '';
  }

  /**
   * Obtiene el script de Chatwoot
   */
  private static getChatwootScript(): string {
    return `
    <script src="/js/chatwoot.js"></script>
    `;
  }

  /**
   * Crea una página HTML completa usando el template base
   */
  static createPage(options: {
    title: string;
    content: string;
    customHead?: string;
    customScripts?: string;
  }): string {
    const { title, content, customHead = '', customScripts = '' } = options;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/css/style.css">
    ${customHead}
</head>
<body>
    ${this.TEMPLATE_HEADER}
    
    <main class="main-content">
        ${content}
    </main>
    
    ${this.TEMPLATE_FOOTER}
    
    <script src="/js/main.js"></script>
    ${this.CHATWOOT_SCRIPT}
    ${customScripts}
</body>
</html>`;
  }

  /**
   * Inyecta el script de Chatwoot en un HTML existente
   */
  static injectChatwoot(html: string): string {
    // Verificar si ya tiene el script
    if (html.includes('chatwoot.js') || html.includes('chatwootSDK')) {
      return html;
    }

    // Buscar el cierre de body y agregar el script antes
    const bodyCloseIndex = html.lastIndexOf('</body>');
    if (bodyCloseIndex !== -1) {
      const beforeBody = html.substring(0, bodyCloseIndex);
      const afterBody = html.substring(bodyCloseIndex);
      return `${beforeBody}${this.CHATWOOT_SCRIPT}${afterBody}`;
    }

    // Si no encuentra </body>, agregar al final
    return `${html}${this.CHATWOOT_SCRIPT}`;
  }

  /**
   * Procesa un HTML scraped para agregar el script de Chatwoot
   */
  static processScrapedHtml(html: string): string {
    return this.injectChatwoot(html);
  }
}

