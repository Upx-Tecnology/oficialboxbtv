# 📦 Guía para Subir el Proyecto a GitHub

## Opción 1: Usar el Script Automático (Recomendado)

Ejecuta el script que preparé:

```bash
bash .git-upload.sh
```

Este script hará todo automáticamente.

## Opción 2: Comandos Manuales

Si prefieres hacerlo manualmente, sigue estos pasos:

### 1. Inicializar Git

```bash
git init
```

### 2. Configurar rama main

```bash
git branch -M main
```

### 3. Agregar remote

```bash
git remote add origin https://github.com/Upx-Tecnology/oficialboxbtv.git
```

### 4. Agregar archivos necesarios

```bash
# Archivos de configuración
git add README.md
git add package.json
git add tsconfig.json
git add .gitignore

# Código fuente y contenido
git add src/
git add public/
git add scraped-content/

# Documentación
git add EASYPANEL_SETUP.md
git add DEPLOY.md
```

### 5. Crear commit

```bash
git commit -m "Initial commit: Proyecto listo para deploy en Easy Panel"
```

### 6. Subir a GitHub

```bash
git push -u origin main
```

## ✅ Archivos que se suben

- ✅ `src/` - Código fuente TypeScript
- ✅ `public/` - HTML/CSS/JS básicos
- ✅ `scraped-content/` - Imágenes, CSS, páginas HTML
- ✅ `package.json` - Configuración de dependencias
- ✅ `tsconfig.json` - Configuración TypeScript
- ✅ `README.md` - Documentación
- ✅ `.gitignore` - Archivos a ignorar
- ✅ `EASYPANEL_SETUP.md` - Guía de setup
- ✅ `DEPLOY.md` - Guía de despliegue

## ❌ Archivos que NO se suben (gracias a .gitignore)

- ❌ `node_modules/` - Se instala con `npm install`
- ❌ `dist/` - Se genera con `npm run build`
- ❌ `.env` - Variables de entorno (si existe)
- ❌ `*.log` - Archivos de log
- ❌ Archivos temporales

## 🔗 Después de subir a GitHub

1. Ve a Easy Panel
2. Crea un nuevo proyecto
3. Conecta el repositorio: `https://github.com/Upx-Tecnology/oficialboxbtv`
4. Configura según `EASYPANEL_SETUP.md`

## 📝 Notas

- El `.gitignore` está configurado para excluir `node_modules` y `dist`
- Easy Panel ejecutará `npm install` y `npm run build` automáticamente
- El tamaño total del repositorio será ~32 MB (principalmente imágenes)

