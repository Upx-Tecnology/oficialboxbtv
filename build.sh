#!/bin/bash
set -e

echo "🚀 Iniciando build del proyecto..."

# Verificar que estamos en el directorio correcto
pwd
ls -la

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --verbose || {
    echo "❌ Error instalando dependencias"
    exit 1
}

# Verificar que TypeScript está instalado
echo "🔍 Verificando TypeScript..."
npx tsc --version || {
    echo "❌ TypeScript no encontrado"
    exit 1
}

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build || {
    echo "❌ Error compilando TypeScript"
    exit 1
}

# Verificar que dist/ existe
if [ ! -d "dist" ]; then
    echo "❌ Error: directorio dist/ no existe después del build"
    exit 1
fi

echo "✅ Build completado exitosamente!"
ls -la dist/

