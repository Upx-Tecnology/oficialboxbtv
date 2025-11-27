# Dockerfile para Docker Hub (también compatible con Easy Panel)
FROM node:18-alpine

# Instalar dependencias del sistema si son necesarias
RUN apk add --no-cache bash

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración primero (para mejor caché de Docker)
COPY package.json package-lock.json* tsconfig.json ./

# Copiar scripts de build y start
COPY build.sh /build.sh
COPY start.sh /start.sh

# Dar permisos de ejecución
RUN chmod +x /build.sh /start.sh

# Copiar código fuente y archivos estáticos
COPY src/ ./src/
COPY public/ ./public/
COPY scraped-content/ ./scraped-content/

# Ejecutar build
RUN /build.sh

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar (usando formato JSON para evitar warnings)
CMD ["/bin/bash", "-c", "chmod +x /start.sh && /start.sh"]
