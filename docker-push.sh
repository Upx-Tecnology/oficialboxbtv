#!/bin/bash
set -e

# Configuración
DOCKER_USERNAME="${DOCKER_USERNAME:-tu-usuario}"  # Cambia esto por tu usuario de Docker Hub
IMAGE_NAME="oficialboxbtv"
VERSION="${1:-latest}"

FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$VERSION"

echo "📤 Subiendo imagen a Docker Hub..."
echo "🏷️  Imagen: $FULL_IMAGE_NAME"

# Verificar que la imagen existe localmente
if ! docker images | grep -q "$DOCKER_USERNAME/$IMAGE_NAME.*$VERSION"; then
    echo "❌ Error: La imagen $FULL_IMAGE_NAME no existe localmente"
    echo "💡 Construye la imagen primero con: ./docker-build.sh"
    exit 1
fi

# Login (si no está logueado)
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "🔐 Necesitas hacer login en Docker Hub..."
    docker login
fi

# Push
echo "📤 Subiendo $FULL_IMAGE_NAME..."
docker push $FULL_IMAGE_NAME

echo "✅ Imagen subida exitosamente!"
echo ""
echo "🔗 Imagen disponible en: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
echo "📋 Para usar la imagen:"
echo "   docker pull $FULL_IMAGE_NAME"
echo "   docker run -p 3000:3000 $FULL_IMAGE_NAME"

