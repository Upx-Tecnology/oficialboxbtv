#!/bin/bash
set -e

echo "🚀 Iniciando servidor..."

# Verificar que dist/ existe
if [ ! -d "dist" ]; then
    echo "❌ Error: directorio dist/ no existe. Ejecuta npm run build primero."
    exit 1
fi

# Verificar que dist/index.js existe
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js no existe. Ejecuta npm run build primero."
    exit 1
fi

echo "✅ Archivos verificados. Iniciando servidor..."

# Iniciar el servidor Node.js
exec npm start

