# 📋 Scripts de SmartEconomat

## 🎯 Setup HTTPS Local (scripts principales)

### Linux/macOS
```bash
bash ./scripts/setup-smarteconomat-local.sh
```
Hace todo automáticamente:
- ✅ Genera certificados HTTPS
- ✅ Confía certificado en el sistema (Linux/macOS)
- ✅ Configura DNS local al IP LAN del host (smarteconomat.app)
- ✅ Verifica Docker

### Windows
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/setup-smarteconomat-local.ps1"
```
(Ejecutar como Administrador)

Hace todo automáticamente:
- ✅ Genera certificados HTTPS
- ✅ Importa certificado en Windows Trust Store
- ✅ Configura DNS local al IP LAN del host (C:\Windows\System32\drivers\etc\hosts)
- ✅ Abre 80/443 en firewall de Windows
- ✅ Verifica Docker

---

## 📦 Scripts de soporte

- `setup-local-prod-https.sh` - Genera certificados, detecta la IP LAN y actualiza `.env.prod`.
- `fix-prod-container-conflict.sh` - Resuelve conflictos de contenedores duplicados en producción (limpieza completa + redesplegue).
- `fix-prod-env-duplicates.sh` - Limpia duplicados en `.env.prod` y reinicia backend (resuelve restart loop).
- `fix-prod-restart-loop.sh` - Resuelve bucle de reinicio en backend producción (ausencia de `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`).
- `deploy.sh` - Deploy a servidor remoto.
- `collect-host-info.sh` / `collect-host-info.ps1` - Exportan variables `HOST_*` para el entorno de desarrollo.
- `install-docker.sh` - Instalador auxiliar para hosts Linux compatibles.
- `check-docs-internal-links.mjs` - Comprueba que los enlaces relativos en `docs/**/*.md` resuelvan a ficheros existentes (sin red; excluye `docs/archive/`). Misma orden que ejecuta el workflow `docs-internal-links.yml`.

---

## 🚀 Flujo de Setup Recomendado

1. **Primera vez:**
   ```bash
   # Linux/macOS
   bash ./scripts/setup-smarteconomat-local.sh
   
   # Windows (como Admin)
   powershell -ExecutionPolicy Bypass -File "scripts/setup-smarteconomat-local.ps1"
   ```

2. **Resultado:**
   - Certificados generados
   - Sistema operativo confía certificado
   - DNS local configurado al IP LAN del host
   - Acceso en https://smarteconomat.app y https://IP_LAN_DEL_HOST

3. **Acceder:**
   ```
   https://smarteconomat.app
   https://127.0.0.1
   ```

---

## 🔧 Troubleshooting

### "Comando no encontrado" (Linux/macOS)
```bash
chmod +x scripts/setup-smarteconomat-local.sh
bash scripts/setup-smarteconomat-local.sh
```

### "Script Execution Policy" (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/setup-smarteconomat-local.ps1"
```

### "Certificado aún no confiado"
- **Linux:** Cierra navegadores completamente y reabre
- **macOS:** Elige el llavero del sistema o vuelve a ejecutar el script con `sudo`
- **Windows:** 
  - Ejecuta `certmgr.msc` para verificar importación
   - O accede a `https://IP_LAN_DEL_HOST` (sin error)

### "Error generando certificados"
- Verifica `openssl` instalado
- Verifica permisos en `./certs/`

### "Backend en bucle de reinicio en producción"
En el servidor remoto, ejecuta:
```bash
bash ./scripts/fix-prod-restart-loop.sh
```
Esto agregará `SEED_DEFAULT_ADMIN_TEMP_PASSWORD` a `.env.prod` y reconstruirá el backend.

### "Conflicto de nombres de contenedores Docker"
Si ves `Conflict. The container name is already in use by container...`:
```bash
bash ./scripts/fix-prod-container-conflict.sh
```
Este script hace limpieza completa de contenedores huérfanos y redespliega.

---

## 📝 Variables de Entorno

Creado automáticamente en `.env.prod`:
- `DOMAIN=smarteconomat.app`
- `BACKEND_API_URL=https://smarteconomat.app/api/v1`
- `FRONTEND_API_URL=https://smarteconomat.app`
- `DB_SYNC=false`
- `SEED_DEFAULT_ADMIN_TEMP_PASSWORD=...`

---

## ✅ Verificación Final

Después de ejecutar setup:

```bash
# Ver estado Docker
docker compose -f docker-compose.prod.yml ps

# Acceder a frontend
curl -sk https://127.0.0.1 | head -20

# Acceder a API
curl -sk https://127.0.0.1/api/v1/auth/login -X POST -d '{}'
```

---

**Versión:** 1.0  
**Última actualización:** 12 de abril 2026  
**Compatibilidad:** Linux, macOS, Windows (PowerShell 5.0+)
