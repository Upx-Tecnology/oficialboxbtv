# Dockerfile para Easy Panel
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package.json tsconfig.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente y archivos estáticos
COPY src/ ./src/
COPY public/ ./public/
COPY scraped-content/ ./scraped-content/

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Variable de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar el servidor
CMD ["npm", "start"]

