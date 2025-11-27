# 🐳 Configuración para Portainer - oficialboxbtv.com

## 📋 Información del Stack

- **Imagen Docker**: `tsilvaec/oficialboxbtv:latest`
- **Dominio**: `oficialboxbtv.com`
- **Puerto interno**: `3000`
- **Red**: `upxnet` (compartida con Chatwoot)

## 🚀 Pasos para Desplegar en Portainer

### 1. Preparar la Imagen Docker

Asegúrate de que la imagen esté construida y subida a Docker Hub:

```bash
# Construir la imagen
docker build -t tsilvaec/oficialboxbtv:latest .

# Subir a Docker Hub
docker push tsilvaec/oficialboxbtv:latest
```

### 2. Crear Stack en Portainer

1. **Ve a Portainer** → **Stacks** → **Add Stack**
2. **Nombre del Stack**: `oficialboxbtv`
3. **Método**: Copia y pega el contenido de `docker-compose.portainer.yml`
4. **Red**: Asegúrate de que la red `upxnet` existe (la misma que usa Chatwoot)

### 3. Configuración de Traefik

El stack está configurado para usar Traefik como reverse proxy con:
- ✅ SSL/HTTPS automático (Let's Encrypt)
- ✅ Redirección de www a no-www
- ✅ Headers de seguridad
- ✅ Puerto 3000 expuesto internamente

### 4. Variables de Entorno

El stack incluye:
- `PORT=3000` - Puerto de la aplicación
- `NODE_ENV=production` - Entorno de producción
- `TZ=America/Sao_Paulo` - Zona horaria

### 5. Recursos

Límites configurados:
- **CPU**: 0.5 cores (máximo), 0.25 cores (reservado)
- **Memoria**: 512MB (máximo), 256MB (reservado)

Puedes ajustar estos valores según tus necesidades.

## 🔧 Configuración Avanzada

### Si necesitas cambiar el dominio:

Edita la línea en `docker-compose.portainer.yml`:
```yaml
- traefik.http.routers.oficialboxbtv.rule=Host(`tu-dominio.com`) || Host(`www.tu-dominio.com`)
```

### Si necesitas agregar más variables de entorno:

Agrega en la sección `environment`:
```yaml
environment:
  - PORT=3000
  - NODE_ENV=production
  - TZ=America/Sao_Paulo
  - TU_VARIABLE=valor
```

## 📝 Verificación

Después del despliegue:

1. ✅ Verifica que el contenedor está corriendo
2. ✅ Accede a `https://oficialboxbtv.com`
3. ✅ Verifica que el SSL funciona correctamente
4. ✅ Prueba que las imágenes cargan
5. ✅ Verifica que el chat de Chatwoot aparece

## 🔗 Archivos

- `docker-compose.yml` - Versión completa con comentarios
- `docker-compose.portainer.yml` - Versión simplificada para Portainer
- `PORTAINER_SETUP.md` - Esta guía

## ⚠️ Notas Importantes

1. **Red `upxnet`**: Asegúrate de que esta red existe antes de desplegar
2. **Traefik**: El stack asume que Traefik está configurado con:
   - Entrypoint `websecure` (puerto 443)
   - Cert resolver `letsencryptresolver`
3. **Dominio**: Asegúrate de que el DNS apunta a tu servidor antes de desplegar

## 🆘 Troubleshooting

**Error: "network upxnet not found"**
- Crea la red: `docker network create upxnet`

**Error: "traefik labels not working"**
- Verifica que Traefik está corriendo y configurado correctamente

**El sitio no carga**
- Verifica los logs: `docker logs oficialboxbtv`
- Verifica que el puerto 3000 está accesible internamente
- Verifica la configuración de Traefik

