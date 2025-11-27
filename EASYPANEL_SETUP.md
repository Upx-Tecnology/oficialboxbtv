# 📋 Configuración en Easy Panel - Guía Paso a Paso

## 1️⃣ Tipo de Proyecto

En Easy Panel, crea un proyecto de tipo:
- **Node.js** o **Node.js Application**
- **Web Application** (si hay opción)
- **Custom Application** (si no hay opción específica de Node.js)

## 2️⃣ Archivos y Carpetas a Subir

### ✅ SUBIR ESTOS ARCHIVOS Y CARPETAS:

```
btvbox/
├── src/                    ← CARPETA COMPLETA (código fuente TypeScript)
│   ├── index.ts
│   ├── scripts/
│   └── utils/
│
├── public/                  ← CARPETA COMPLETA (HTML/CSS/JS básicos)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       └── chatwoot.js
│
├── scraped-content/         ← CARPETA COMPLETA (contenido extraído)
│   ├── images/             ← TODAS las imágenes (85 archivos)
│   ├── css/                ← CSS scraped
│   ├── fonts/              ← Fuentes
│   ├── pages/               ← Páginas HTML scraped
│   └── metadata.json
│
├── package.json             ← ARCHIVO (configuración de dependencias)
├── tsconfig.json            ← ARCHIVO (configuración TypeScript)
├── .gitignore              ← ARCHIVO (opcional pero recomendado)
└── README.md                ← ARCHIVO (opcional)
```

### ❌ NO SUBIR:

```
❌ node_modules/          (se instala automáticamente con npm install)
❌ dist/                  (se genera automáticamente con npm run build)
❌ .env                   (si contiene información sensible)
❌ *.log                  (archivos de log)
❌ .DS_Store              (archivos del sistema)
```

## 3️⃣ Configuración en Easy Panel

### Build Settings (Configuración de Build):

```
Build Command: npm run build
   O simplemente déjalo vacío (se ejecuta automáticamente con postinstall)

Install Command: npm install
   (por defecto, no necesitas cambiarlo)
```

### Runtime Settings (Configuración de Ejecución):

```
Start Command: npm start

Node Version: 18.x o superior
   (recomendado: 18.20.0 o 20.x)

Port: 3000
   (o el puerto que prefieras)
```

### Environment Variables (Variables de Entorno):

Agrega estas variables:

```
PORT=3000
NODE_ENV=production
```

## 4️⃣ Proceso de Despliegue

1. **Crea el proyecto** en Easy Panel como "Node.js Application"

2. **Sube los archivos** usando:
   - Git (si tienes repositorio)
   - SFTP/FTP
   - O el gestor de archivos de Easy Panel

3. **Configura las opciones** según lo indicado arriba

4. **Inicia el despliegue**

5. **Easy Panel ejecutará automáticamente:**
   ```
   npm install          → Instala dependencias
   npm run build        → Compila TypeScript (gracias a postinstall)
   npm start            → Inicia el servidor
   ```

## 5️⃣ Verificación Post-Despliegue

Después del despliegue, verifica:

1. ✅ El servidor está corriendo (status: Running)
2. ✅ Los logs no muestran errores
3. ✅ La página carga en: `http://tu-dominio.com/`
4. ✅ Las imágenes se ven correctamente
5. ✅ El chat de Chatwoot aparece

## 6️⃣ Estructura de Carpetas en el Servidor

Después del despliegue, en el servidor deberías tener:

```
tu-proyecto/
├── node_modules/        (instalado automáticamente)
├── dist/                (generado automáticamente)
├── src/                 (tu código fuente)
├── public/              (tus archivos HTML/CSS/JS)
├── scraped-content/     (contenido extraído)
├── package.json
└── tsconfig.json
```

## 7️⃣ Tamaños Aproximados

- `src/`: ~50 KB
- `public/`: ~25 KB
- `scraped-content/`: ~32 MB (la mayor parte son imágenes)
- `node_modules/`: ~50-100 MB (se instala en el servidor)
- `dist/`: ~80 KB (se genera en el servidor)

**Total a subir: ~32 MB** (sin node_modules ni dist)

## 8️⃣ Comandos Útiles en Easy Panel

Si Easy Panel tiene terminal/SSH, puedes ejecutar:

```bash
# Verificar que el build se completó
ls -la dist/

# Verificar que las imágenes están
ls -la scraped-content/images/ | wc -l  # Debe mostrar ~85 archivos

# Ver logs del servidor
npm start  # o revisa los logs en el panel
```

## ⚠️ Problemas Comunes

**Error: "Cannot find module 'express'"**
- Solución: Verifica que `npm install` se ejecutó correctamente

**Error: "Cannot find module './dist/index.js'"**
- Solución: Verifica que `npm run build` se ejecutó (revisa que existe `dist/index.js`)

**Las imágenes no cargan**
- Solución: Verifica que la carpeta `scraped-content/images/` está completa

**Puerto en uso**
- Solución: Cambia `PORT=3001` en las variables de entorno

## 📝 Resumen Rápido

**Tipo de Proyecto:** Node.js Application

**Carpetas a subir:**
- ✅ `src/`
- ✅ `public/`
- ✅ `scraped-content/`

**Archivos a subir:**
- ✅ `package.json`
- ✅ `tsconfig.json`

**Start Command:** `npm start`

**Port:** `3000`

¡Listo para desplegar! 🚀

