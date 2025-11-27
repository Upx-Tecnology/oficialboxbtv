#!/bin/bash
set -e

# Configuración
DOCKER_USERNAME="${DOCKER_USERNAME:-tu-usuario}"  # Cambia esto por tu usuario de Docker Hub
IMAGE_NAME="oficialboxbtv"
VERSION="${1:-latest}"

echo "🐳 Construyendo imagen Docker..."
echo "📦 Usuario: $DOCKER_USERNAME"
echo "🏷️  Imagen: $IMAGE_NAME:$VERSION"

# Construir la imagen
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$VERSION .

echo "✅ Imagen construida exitosamente!"

# Preguntar si quiere subir
read -p "¿Deseas subir la imagen a Docker Hub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Subiendo imagen a Docker Hub..."
    
    # Login (si no está logueado)
    if ! docker info | grep -q "Username"; then
        echo "🔐 Necesitas hacer login en Docker Hub..."
        docker login
    fi
    
    # Push
    docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION
    
    echo "✅ Imagen subida exitosamente!"
    echo "🔗 Imagen disponible en: docker.io/$DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
else
    echo "⏭️  Saltando upload. Puedes subirla después con:"
    echo "   docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
fi

