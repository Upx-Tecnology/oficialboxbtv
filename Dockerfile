FROM easypanel/base:latest

# Copiar archivos del proyecto
COPY . /app
WORKDIR /app

# Copiar scripts de build y start
COPY build.sh /build.sh
COPY start.sh /start.sh

# Dar permisos de ejecución
RUN chmod +x /build.sh /start.sh

# Ejecutar build
RUN /build.sh

# Comando para iniciar (usando formato JSON para evitar warnings)
CMD ["/bin/bash", "-c", "chmod +x /start.sh && /start.sh"]
