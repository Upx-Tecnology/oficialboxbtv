#!/bin/bash
set -e

echo "🚀 Iniciando build del proyecto..."

# Verificar que estamos en el directorio correcto
echo "📁 Directorio actual: $(pwd)"
echo "📋 Archivos en el directorio:"
ls -la

# Verificar que package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    exit 1
fi

# Instalar TODAS las dependencias (incluyendo devDependencies para TypeScript)
echo "📦 Instalando dependencias (incluyendo devDependencies)..."
npm install --include=dev || {
    echo "❌ Error instalando dependencias"
    echo "📋 Intentando con npm ci..."
    npm ci --include=dev || {
        echo "❌ Error con npm ci también"
        exit 1
    }
}

# Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules no existe después de npm install"
    exit 1
fi

# Verificar que TypeScript está instalado
echo "🔍 Verificando TypeScript..."
if [ ! -f "node_modules/.bin/tsc" ] && [ ! -f "node_modules/typescript/bin/tsc" ]; then
    echo "❌ TypeScript no encontrado en node_modules"
    echo "📦 Verificando si está en devDependencies..."
    if grep -q '"typescript"' package.json; then
        echo "⚠️  TypeScript está en package.json pero no se instaló"
        echo "📦 Reinstalando TypeScript..."
        npm install typescript --save-dev || {
            echo "❌ Error instalando TypeScript"
            exit 1
        }
    else
        echo "❌ TypeScript no está en package.json"
        exit 1
    fi
fi

# Verificar versión de TypeScript
echo "📋 Versión de TypeScript:"
npx tsc --version || ./node_modules/.bin/tsc --version || {
    echo "❌ No se puede ejecutar tsc"
    exit 1
}

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
echo "📋 Ejecutando: npx tsc"
if npx tsc; then
    echo "✅ Compilación exitosa con npx tsc"
elif ./node_modules/.bin/tsc; then
    echo "✅ Compilación exitosa con ./node_modules/.bin/tsc"
else
    echo "❌ Error compilando TypeScript"
    echo "📋 Mostrando error detallado..."
    npx tsc --version
    cat tsconfig.json
    exit 1
fi

# Verificar que dist/ existe
if [ ! -d "dist" ]; then
    echo "❌ Error: directorio dist/ no existe después del build"
    exit 1
fi

# Verificar que dist/index.js existe
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js no existe después del build"
    exit 1
fi

echo "✅ Build completado exitosamente!"
echo "📋 Contenido de dist/:"
ls -la dist/

