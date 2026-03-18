# Guía de Despliegue en Producción - SmartEconomat

Este documento detalla los pasos para desplegar la aplicación en la máquina virtual de Azure con SSL habilitado.

## 1. Preparación en la VM

1. Asegúrate de tener **Docker** y **Docker Compose** instalados en la VM.
2. Clona el repositorio en la VM (o transfiere los archivos modificados).
3. Asegúrate de que los puertos **80** y **443** están abiertos en el Firewall de Azure (Ya verificado: están abiertos).

## 2. Configuración de Variables de Entorno

El archivo `.env.prod` ya ha sido configurado con la IP pública de la VM utilizando `nip.io`:
- `DOMAIN=48.220.49.43.nip.io`
- `BACKEND_API_URL=https://api.48.220.49.43.nip.io`
- `FRONTEND_API_URL=https://48.220.49.43.nip.io`

**IMPORTANTE**: Cambia las contraseñas de la base de datos (`DB_PASSWORD`) en `.env.prod` antes de arrancar.

## 3. Generación del Certificado SSL

Hemos incluido un script para automatizar la obtención de certificados de Let's Encrypt:

```bash
chmod +x scripts/generate-certs.sh
sudo ./scripts/generate-certs.sh
```

*Nota: Durante la ejecución del script, ningún otro servicio (como Nginx) debe estar ocupando el puerto 80.*

## 4. Despliegue con Docker Compose

Una vez que los certificados estén en la carpeta `./certs`, puedes arrancar la aplicación:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Servicios incluidos:
- **db**: Base de datos PostgreSQL.
- **redis**: Cache y colas.
- **backend**: API NestJS (puerto 3000 interno).
- **frontend**: Cliente React + Nginx (puertos 80 y 443 externos).

## 5. Verificación

Accede a:
- Frontend: `https://48.220.49.43.nip.io`
- API / Docs: `https://api.48.220.49.43.nip.io/docs`

## Notas Adicionales
- La configuración de Nginx en `frontend/smart-economat-frontend/nginx.conf` ya está preparada para redirigir todo el tráfico HTTP a HTTPS.
- El backend confía en el proxy inverso para manejar el protocolo seguro.
