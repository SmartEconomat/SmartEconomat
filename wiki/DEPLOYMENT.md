# 🚀 Guía de Despliegue en Producción - SmartEconomat

Esta guía garantiza un despliegue profesional y robusto del sistema SmartEconomat desde cero en cualquier servidor Linux o Windows.

## 📋 Requisitos del Sistema
- **SO**: Linux (se recomienda Ubuntu 22.04+) o Windows (10/11/Server con WSL2).
- **RAM**: Mínimo 2GB (se recomiendan 4GB).
- **Espacio en Disco**: 20GB libres.
- **Red**: Los puertos **80** (HTTP) y **443** (HTTPS) deben estar abiertos en el firewall/grupo de seguridad.

---

## ⚡ Inicio Rápido (Automatizado)

### 🐧 Para Usuarios de Linux
1. Clona este repositorio o transfiere los archivos a tu servidor.
2. Ejecuta el script de preparación universal:
   ```bash
   chmod +x setup-production.sh
   ./setup-production.sh
   ```
3. El script se encargará de:
   - Instalar Docker y Docker Compose si faltan.
   - Configurar tu archivo `.env.prod`.
   - Generar certificados SSL (Let's Encrypt).
   - Lanzar todos los contenedores.

### 🪟 Para Usuarios de Windows
1. Abre PowerShell como Administrador.
2. Navega a la raíz del proyecto.
3. Ejecuta el script de preparación:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   .\setup-production.ps1
   ```

---

## 🔧 Configuración Manual

### 1. Variables de Entorno (`.env.prod`)
Variables esenciales a configurar antes del despliegue:
- `DOMAIN`: Tu dominio público o IP (ej. `smarteconomat.com`).
- `BACKEND_API_URL`: `https://api.tu-dominio.com`
- `FRONTEND_API_URL`: `https://tu-dominio.com`.
- `POSTGRES_PASSWORD`: Usa una contraseña fuerte.
- `JWT_SECRET`: Secreto para los tokens de autenticación.

### 2. Certificados SSL
El sistema espera encontrar los certificados en la carpeta `./certs`:
- `fullchain.pem`
- `privkey.pem`

Si usas nuestro script `./scripts/generate-certs.sh`, este utiliza **Let's Encrypt** y configura una **renovación automática mensual** mediante Cron.

---

## 🛠️ Comandos Operativos

### Reiniciar el sistema
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart
```

### Actualizar la aplicación
```bash
# Descargar últimos cambios
git pull origin main
# Reconstruir y reiniciar
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Ver registros (logs)
```bash
# Todos los logs
docker-compose -f docker-compose.prod.yml logs -f
# Servicio específico (backend/frontend/db)
docker logs -f smarteconomat-prod-backend-1
```

### Copias de Seguridad (Base de Datos)
Para exportar la base de datos:
```bash
docker exec smarteconomat-prod-db-1 pg_dump -U smarteconomat-prod-user smarteconomat_prod > backup_$(date +%F).sql
```

### Detener el sistema
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## ✅ Lista de Verificación Post-Despliegue
1. Visita `https://tu-dominio.com` para comprobar el frontend.
2. Comprueba `https://api.tu-dominio.com/api/v1/docs` para la documentación de la API.
3. Verifica que la redirección de HTTP a HTTPS funciona.
4. Revisa los logs para asegurar que no hay errores de conexión con la base de datos.

---
*Creado por Antigravity - Solución DevOps Senior*
