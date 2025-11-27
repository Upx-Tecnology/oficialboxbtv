import * as path from 'path';

/**
 * Limpia el HTML eliminando referencias a WordPress, WooCommerce y otros sistemas
 * que no vamos a usar en el clon estático
 */
export function cleanHtml(html: string, baseUrl: string = 'https://oficialboxbtv.com'): string {
  // Remover scripts de WordPress/WooCommerce
  html = html.replace(/<script[^>]*wp-content[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*wp-includes[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*woocommerce[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*js_composer[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*woodmart[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remover links a CSS de WordPress/WooCommerce
  html = html.replace(/<link[^>]*wp-content[^>]*\.css[^>]*>/gi, '');
  html = html.replace(/<link[^>]*wp-includes[^>]*\.css[^>]*>/gi, '');
  
  // Remover meta tags de WordPress
  html = html.replace(/<link[^>]*rel=["']pingback["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']EditURI["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*generator[^>]*WordPress[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*generator[^>]*WooCommerce[^>]*>/gi, '');
  
  // Remover scripts inline de WordPress
  html = html.replace(/<script[^>]*>[\s\S]*?var wc_[^<]*<\/script>/gi, '');
  html = html.replace(/<script[^>]*>[\s\S]*?woocommerce_params[^<]*<\/script>/gi, '');
  html = html.replace(/<script[^>]*>[\s\S]*?wc_add_to_cart_params[^<]*<\/script>/gi, '');
  
  // Remover estilos inline de WordPress admin
  html = html.replace(/<style[^>]*>[\s\S]*?#wpadminbar[^<]*<\/style>/gi, '');
  
  // Remover comentarios de WordPress
  html = html.replace(/<!--[\s\S]*?wp-[^>]*?-->/gi, '');
  
  // Remover elementos del admin bar de WordPress
  html = html.replace(/<div[^>]*id=["']wpadminbar["'][^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Remover scripts externos problemáticos
  html = html.replace(/<script[^>]*cdn-cgi[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*sac\.c6b0ecb69ff9da03d5a614ca0cf55e04\.com[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Reemplazar URLs de imágenes
  html = replaceImageUrls(html, baseUrl);
  
  // Reemplazar URLs de CSS locales
  html = replaceCssUrls(html, baseUrl);
  
  // Reemplazar URLs de fuentes
  html = replaceFontUrls(html, baseUrl);
  
  // Reemplazar enlaces internos
  html = replaceInternalLinks(html, baseUrl);
  
  return html;
}

function replaceImageUrls(html: string, baseUrl: string): string {
  const originalDomain = 'https://oficialboxbtv.com';
  
  // Reemplazar src de imágenes
  html = html.replace(
    /src=["'](https?:\/\/oficialboxbtv\.com\/wp-content\/uploads\/[^"']+)["']/gi,
    (match, url) => {
      const filename = path.basename(url.split('?')[0]);
      return `src="/images/${filename}"`;
    }
  );
  
  // Reemplazar srcset
  html = html.replace(
    /srcset=["']([^"']+)["']/gi,
    (match, srcset) => {
      const urls = srcset.split(',').map((item: string) => {
        const parts = item.trim().split(/\s+/);
        const url = parts[0];
        if (url.includes('oficialboxbtv.com/wp-content/uploads')) {
          const filename = path.basename(url.split('?')[0]);
          return `/images/${filename}${parts[1] ? ' ' + parts[1] : ''}`;
        }
        return item.trim();
      });
      return `srcset="${urls.join(', ')}"`;
    }
  );
  
  // Reemplazar data-src (lazy loading)
  html = html.replace(
    /data-src=["'](https?:\/\/oficialboxbtv\.com\/wp-content\/uploads\/[^"']+)["']/gi,
    (match, url) => {
      const filename = path.basename(url.split('?')[0]);
      return `data-src="/images/${filename}"`;
    }
  );
  
  // Reemplazar en atributos style
  html = html.replace(
    /url\(["']?(https?:\/\/oficialboxbtv\.com\/wp-content\/uploads\/[^"')]+)["']?\)/gi,
    (match, url) => {
      const filename = path.basename(url.split('?')[0]);
      return `url("/images/${filename}")`;
    }
  );
  
  return html;
}

function replaceCssUrls(html: string, baseUrl: string): string {
  // Solo reemplazar CSS que esté en nuestro directorio local
  html = html.replace(
    /href=["'](https?:\/\/oficialboxbtv\.com\/wp-content\/themes\/woodmart\/css\/[^"']+\.css[^"']*)["']/gi,
    (match, url) => {
      const filename = path.basename(url.split('?')[0]);
      return `href="/css/${filename}"`;
    }
  );
  
  return html;
}

function replaceFontUrls(html: string, baseUrl: string): string {
  // Reemplazar fuentes
  html = html.replace(
    /(href|src)=["'](https?:\/\/oficialboxbtv\.com\/wp-content\/[^"']+\.(woff|woff2|ttf|otf)[^"']*)["']/gi,
    (match, attr, url) => {
      const filename = path.basename(url.split('?')[0]);
      return `${attr}="/fonts/${filename}"`;
    }
  );
  
  return html;
}

function replaceInternalLinks(html: string, baseUrl: string): string {
  // Reemplazar enlaces internos
  html = html.replace(
    /href=["'](https?:\/\/oficialboxbtv\.com)([^"']+)["']/gi,
    (match, domain, pathname) => {
      return `href="${pathname}"`;
    }
  );
  
  return html;
}


