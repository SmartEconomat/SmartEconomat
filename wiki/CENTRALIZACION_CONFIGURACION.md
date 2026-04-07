# Centralización de configuración para despliegue y dominios personalizados

## 1. Variables de entorno recomendadas (para .env, .env.prod, .env.dev)

### Variables generales
- NODE_ENV=development|production
- DOMAIN=midominio.com

### Backend
- BACKEND_PORT=3000
- BACKEND_API_URL=https://api.midominio.com (o http://localhost:3000 en local)
- DB_HOST=db (o el host real de la base de datos en despliegue)
- DB_PORT=5432
- DB_USERNAME=usuario
- DB_PASSWORD=contraseña
- DB_DATABASE=nombre_db
- JWT_SECRET=clave_secreta
- JWT_EXPIRATION=7d
- SENTRY_DSN=...

### Frontend
- FRONTEND_PORT=5173
- FRONTEND_API_URL=https://app.midominio.com (o http://localhost:5173 en local)
- VITE_API_PROXY_TARGET=https://api.midominio.com (o http://localhost:3000 en local)
- VITE_SENTRY_DSN=...

## 2. Cambios en docker-compose
- Usar variables DOMAIN, BACKEND_API_URL y FRONTEND_API_URL para exponer correctamente los servicios.
- Permitir sobreescribir puertos y URLs desde variables de entorno del host o del entorno de despliegue.

## 3. Cambios en Vite y NestJS
- Vite: leer VITE_API_PROXY_TARGET y VITE_SENTRY_DSN desde el entorno.
- NestJS: leer BACKEND_API_URL, SENTRY_DSN y DB_* desde el entorno.

## 4. Ejemplo de .env de despliegue
NODE_ENV=production
DOMAIN=midominio.com
BACKEND_PORT=3000
BACKEND_API_URL=https://api.midominio.com
FRONTEND_PORT=80
FRONTEND_API_URL=https://app.midominio.com
VITE_API_PROXY_TARGET=https://api.midominio.com
VITE_SENTRY_DSN=...
SENTRY_DSN=...
DB_HOST=db-host-produccion
DB_PORT=5432
DB_USERNAME=usuario
DB_PASSWORD=contraseña
DB_DATABASE=nombre_db
JWT_SECRET=clave_secreta
JWT_EXPIRATION=7d

## 5. Notas
- Mantener separados los valores de local y despliegue en archivos `.env` distintos.
- Revisar que `DOMAIN`, `BACKEND_API_URL`, `FRONTEND_API_URL` y `VITE_API_PROXY_TARGET` apunten al mismo entorno.
- Si cambian dominio, puertos o proxy, recrear los contenedores para aplicar la configuración nueva.
