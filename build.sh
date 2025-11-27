#!/bin/bash
set -e

echo "🚀 Iniciando build del proyecto..."

# Verificar que estamos en el directorio correcto
echo "📁 Directorio actual: $(pwd)"
echo "📋 Archivos en el directorio:"
ls -la

# Instalar TODAS las dependencias (incluyendo devDependencies para TypeScript)
echo "📦 Instalando dependencias (incluyendo devDependencies)..."
npm install --include=dev --verbose || {
    echo "❌ Error instalando dependencias"
    echo "📋 Intentando con npm ci..."
    npm ci --include=dev || {
        echo "❌ Error con npm ci también"
        exit 1
    }
}

# Verificar que TypeScript está instalado
echo "🔍 Verificando TypeScript..."
if ! npx tsc --version; then
    echo "❌ TypeScript no encontrado"
    echo "📦 Intentando instalar TypeScript globalmente..."
    npm install -g typescript || {
        echo "❌ Error instalando TypeScript"
        exit 1
    }
fi

# Verificar que package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    exit 1
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
echo "📋 Verificando que tsc está disponible..."
which tsc || npm list -g typescript || {
    echo "⚠️  TypeScript no encontrado globalmente, usando npx..."
}

# Intentar compilar
if npm run build; then
    echo "✅ Compilación exitosa con npm run build"
elif npx tsc; then
    echo "✅ Compilación exitosa con npx tsc"
else
    echo "❌ Error compilando TypeScript"
    echo "📋 Verificando instalación de TypeScript..."
    npm list typescript || {
        echo "❌ TypeScript no está instalado"
        echo "📦 Instalando TypeScript..."
        npm install --save-dev typescript || {
            echo "❌ No se pudo instalar TypeScript"
            exit 1
        }
    }
    echo "🔄 Reintentando compilación..."
    npx tsc || {
        echo "❌ Error en compilación después de instalar TypeScript"
        exit 1
    }
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

