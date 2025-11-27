FROM easypanel/base:latest

# Copiar archivos del proyecto
COPY . /app
WORKDIR /app

# Copiar scripts de build y start
COPY build.sh /build.sh
COPY start.sh /start.sh

# Ejecutar build
RUN chmod +x /build.sh && /build.sh

# Comando para iniciar
CMD chmod +x /start.sh && /start.sh
