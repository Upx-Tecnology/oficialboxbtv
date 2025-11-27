# 🐳 Configuración Docker para Easy Panel

## Problema Resuelto

Si recibes el error: `No such image: easypanel/clientes/oficialboxbtv:latest`

Esto significa que Easy Panel necesita construir la imagen Docker primero. He creado un `Dockerfile` para solucionarlo.

## ✅ Archivos Creados

1. **Dockerfile** - Configuración para construir la imagen Docker
2. **.dockerignore** - Archivos a excluir del build de Docker

## 🔧 Configuración en Easy Panel

### Opción 1: Usar Dockerfile (Recomendado)

En Easy Panel, configura:

1. **Tipo de Proyecto**: Node.js Application (con Docker)
2. **Dockerfile**: Debe detectar automáticamente el `Dockerfile` en la raíz
3. **Build Context**: `.` (directorio raíz)
4. **Port**: `3000`

### Opción 2: Sin Docker (Solo Node.js)

Si prefieres no usar Docker, en Easy Panel:

1. **Tipo de Proyecto**: Node.js Application (sin Docker)
2. **Start Command**: `npm start`
3. **Build Command**: `npm run build` (o vacío, se ejecuta con postinstall)
4. **Node Version**: `18.x`
5. **Port**: `3000`

## 📋 Variables de Entorno

En ambos casos, configura:

```
PORT=3000
NODE_ENV=production
```

## 🚀 Proceso de Build

Con el Dockerfile, Easy Panel ejecutará:

1. `docker build` - Construye la imagen usando el Dockerfile
2. La imagen incluye:
   - Instalación de dependencias (`npm install`)
   - Compilación de TypeScript (`npm run build`)
   - Todos los archivos necesarios
3. `docker run` - Ejecuta el contenedor con `npm start`

## 🔍 Verificación

Después del despliegue:

1. Verifica que la imagen se construyó correctamente
2. El contenedor está corriendo
3. El servidor responde en el puerto 3000
4. Las páginas cargan correctamente

## ⚠️ Si el Error Persiste

1. **Verifica que el Dockerfile está en la raíz del proyecto**
2. **Asegúrate de que Easy Panel tiene acceso al repositorio**
3. **Revisa los logs de build en Easy Panel**
4. **Intenta usar la Opción 2 (sin Docker)** si el problema persiste

## 📝 Notas

- El Dockerfile usa `node:18-alpine` (imagen ligera)
- El build se ejecuta dentro del contenedor
- El `.dockerignore` excluye archivos innecesarios para reducir el tamaño

