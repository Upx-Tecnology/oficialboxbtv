# oficialboxbtv

Clon del sitio web oficialboxbtv.com construido con Node.js, Express y TypeScript.

## 🚀 Instalación y Uso

### Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Producción

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto especificado en la variable de entorno `PORT`).

## 📁 Estructura del Proyecto

```
btvbox/
├── dist/              # Código compilado (TypeScript → JavaScript)
├── public/            # Archivos HTML/CSS/JS básicos
│   ├── index.html
│   ├── css/
│   └── js/
├── scraped-content/   # Contenido extraído del sitio original
│   ├── images/
│   ├── css/
│   ├── fonts/
│   └── pages/
├── src/               # Código fuente TypeScript
│   ├── index.ts       # Servidor Express
│   ├── scripts/       # Scripts de scraping
│   └── utils/         # Utilidades
└── package.json
```

## 🔧 Scripts Disponibles

- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm run scrape` - Ejecuta el scraper para extraer contenido
- `npm run verify-pages` - Verifica que todas las páginas funcionen correctamente

## 🌐 Despliegue en Easy Panel

1. Sube todos los archivos al servidor (excepto `node_modules` y `dist`)
2. En Easy Panel, configura:
   - **Start Command**: `npm start`
   - **Build Command**: `npm run build` (opcional, se ejecuta automáticamente con `postinstall`)
   - **Node Version**: 18.x o superior
   - **Port**: 3000 (o el que configures en `PORT`)

3. El servidor iniciará automáticamente después del build.

## 📝 Variables de Entorno

Puedes configurar el puerto usando la variable de entorno `PORT`:

```bash
PORT=3000 npm start
```

## 🎨 Características

- ✅ HTML básico sin dependencias de WordPress
- ✅ CSS personalizado y responsive
- ✅ Integración con Chatwoot para soporte en vivo
- ✅ Servidor Express optimizado
- ✅ Soporte para contenido scraped como fallback

## 📄 Licencia

ISC
