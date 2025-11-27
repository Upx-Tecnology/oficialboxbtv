# 🚀 Guía de Despliegue en Easy Panel

## Pasos para Desplegar

### 1. Preparar el Proyecto

Asegúrate de que el proyecto esté compilado:

```bash
npm run build
```

### 2. Subir Archivos al Servidor

Sube los siguientes archivos y carpetas a Easy Panel:

**✅ INCLUIR:**
- `package.json`
- `tsconfig.json`
- `src/` (código fuente TypeScript)
- `public/` (archivos HTML/CSS/JS básicos)
- `scraped-content/` (contenido extraído - imágenes, CSS, páginas)
- `.gitignore`
- `README.md`

**❌ NO INCLUIR:**
- `node_modules/` (se instala automáticamente)
- `dist/` (se genera automáticamente con el build)
- `.env` (si contiene información sensible)

### 3. Configuración en Easy Panel

En la configuración del proyecto en Easy Panel, establece:

#### Build Settings:
- **Build Command**: `npm run build` (o déjalo vacío, se ejecuta automáticamente con `postinstall`)
- **Install Command**: `npm install` (por defecto)

#### Runtime Settings:
- **Start Command**: `npm start`
- **Node Version**: `18.x` o superior
- **Port**: `3000` (o el que prefieras, configúralo en variables de entorno)

#### Environment Variables:
```
PORT=3000
NODE_ENV=production
```

### 4. Verificación

Después del despliegue, verifica:

1. ✅ El servidor inicia correctamente
2. ✅ La página principal carga en `http://tu-dominio.com/`
3. ✅ Las imágenes se cargan correctamente
4. ✅ El chat de Chatwoot aparece
5. ✅ Las páginas scraped funcionan como fallback

### 5. Troubleshooting

**Error: "Cannot find module"**
- Verifica que `npm install` se ejecutó correctamente
- Asegúrate de que `dist/` se generó con `npm run build`

**Error: "Port already in use"**
- Cambia el puerto en las variables de entorno: `PORT=3001`

**Las imágenes no cargan**
- Verifica que la carpeta `scraped-content/images/` esté subida
- Revisa los logs del servidor para ver rutas de archivos

**El chat no aparece**
- Verifica que `public/js/chatwoot.js` esté subido
- Revisa la consola del navegador para errores de JavaScript

## 📦 Estructura Mínima Requerida

```
tu-proyecto/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   └── utils/
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
└── scraped-content/
    ├── images/
    ├── css/
    ├── fonts/
    └── pages/
```

## 🔄 Actualización

Para actualizar el proyecto:

1. Sube los archivos modificados
2. Easy Panel ejecutará automáticamente:
   - `npm install` (si hay cambios en package.json)
   - `npm run build` (gracias a `postinstall`)
   - `npm start` (reinicia el servidor)

## 📝 Notas

- El proyecto usa `postinstall` para compilar automáticamente después de `npm install`
- El servidor prioriza archivos HTML básicos en `public/` sobre contenido scraped
- Todas las páginas incluyen automáticamente el script de Chatwoot

