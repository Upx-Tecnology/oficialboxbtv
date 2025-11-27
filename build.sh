#!/bin/bash
set -e

echo "🚀 Iniciando build del proyecto..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

echo "✅ Build completado exitosamente!"

