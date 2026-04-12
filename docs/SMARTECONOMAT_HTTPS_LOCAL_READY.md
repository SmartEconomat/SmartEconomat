# ✅ SmartEconomat - Acceso Local Listo

El stack está levantado y funciona en **HTTP (sin SSL warnings)** y **HTTPS**.

---

## 🚀 Acceso INMEDIATO (sin nada que configurar)

### HTTP (Recomendado para desarrollo - sin SSL warnings):
```
http://127.0.0.1
http://localhost
```

✅ **Funciona ahora mismo en cualquier navegador**  
✅ Sin advertencias de certificado  
✅ Acceso completamente normal

### HTTPS (SSL/TLS - para pruebas):
```
https://127.0.0.1
https://localhost
```

⚠️ Navegador mostrará "No es seguro" (certificado autofirmado)  
→ Haz clic en "Avanzada" → "Continuar"  
→ El certificado ES válido, solo que no es de una autoridad reconocida

---

## 🌐 Con dominio `smarteconomat.app` (1 paso opcional)

Si prefieres usar el dominio personalizado en lugar de `127.0.0.1`:

```bash
# Linux/macOS - agregar a /etc/hosts
sudo bash -c 'echo "127.0.0.1  smarteconomat.app api.smarteconomat.app" >> /etc/hosts'
```

**Después accede a:**
```
http://smarteconomat.app      # HTTP (sin warnings)
https://smarteconomat.app     # HTTPS (con cert warning)
```
http://smarteconomat.app      # HTTP (sin warnings)
https://smarteconomat.app     # HTTPS (con cert warning)
```

---

## 📋 Estado actual del stack

```
✅ Frontend (Nginx):   UP - puerto 80 (HTTP) y 443 (HTTPS)
✅ Backend (NestJS):   UP - puerto 3000 (interno)
✅ PostgreSQL:         UP - healthy
✅ Redis:              UP - healthy
```

Verifica estado:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

---

## 👤 Credenciales de acceso

**Admin temporal:**
- Username: `admin`
- Password: `SmartEconomatTemp2026!`

---

## 🔒 Certificado HTTPS (Información Técnica)

- **CN:** smarteconomat.app
- **Emitido por:** SmartEconomat Local Root CA (autofirmado)
- **Válido para:**
  - smarteconomat.app
  - api.smarteconomat.app
  - localhost
  - 127.0.0.1
  - ::1 (IPv6 local)

**Para confiar en el certificado:**
- Sistema: Ya configurado en `/usr/local/share/ca-certificates/`
- Navegadores: Deberían confiar automáticamente tras importación
- OpenSSL: Ya confía (verificado: "Verify return code: 0")

---

## ✨ Opciones de acceso (resumen)

| URL | Protocolo | Certificado | Navegador | Recomendación |
|-----|-----------|-------------|-----------|--------------|
| `http://127.0.0.1` | HTTP | - | Todos | ✅ **MEJOR PARA DEV** |
| `http://localhost` | HTTP | - | Todos | ✅ **MEJOR PARA DEV** |
| `https://127.0.0.1` | HTTPS | Autofirmado | Todos (con bypass) | Para probar SSL |
| `http://smarteconomat.app` | HTTP | - | Todos (después de /etc/hosts) | Con DNS local |
| `https://smarteconomat.app` | HTTPS | Autofirmado | Todos (con bypass) | Para probar SSL con dominio |

**Recomendación:** Usa `http://127.0.0.1` durante desarrollo. No necesitas configurar nada más.

---

## 🛠️ Troubleshooting

### "No puedo acceder a http://127.0.0.1"
```bash
# Verificar que frontend está up
docker compose -f docker-compose.prod.yml ps frontend

# Si está down, levantarlo
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend
```

### "smarteconomat.app no resuelve"
```bash
# Verificar /etc/hosts
grep smarteconomat /etc/hosts

# Si no está, agregarlo
sudo bash -c 'echo "127.0.0.1  smarteconomat.app api.smarteconomat.app" >> /etc/hosts'
```

### "HTTPS muestra error de certificado en navegador"
- ✅ Es **normal** para certificados autofirmados
- Clickea "Avanzada" → "Continuar"
- O accede por HTTP sin problemas

### "API no responde"
```bash
# Verificar backend
docker compose -f docker-compose.prod.yml ps backend

# Ver logs
docker compose -f docker-compose.prod.yml logs backend --tail=50
```

---

## 📚 Setup Automatizado (Opcional)

Si necesitas HTTPS con confianza automática del certificado:

```bash
# Linux/macOS
bash ./scripts/setup-smarteconomat-local.sh

# Windows (como Admin)
powershell -ExecutionPolicy Bypass -File "scripts/setup-smarteconomat-local.ps1"
```

Ver: [scripts/README.md](scripts/README.md)

---

**Generado:** 12 de abril 2026  
**Stack:** Docker Compose (Nginx + NestJS + PostgreSQL + Redis)  
**Certificados:** `/home/psych/projects/SmartEconomat/certs/`

---

## Estado del stack

```
✅ Frontend (Nginx):     UP y respondiendo en puerto 443 (HTTPS)
✅ Backend (NestJS):     UP y respondiendo en puerto 3000 (interno)
✅ PostgreSQL:           UP y healthy
✅ Redis:                UP y healthy
```

Verifica con:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

---

## Credenciales por defecto

**Admin temporal:**
- Username: `admin`
- Password: `SmartEconomatTemp2026!`

(Esta contraseña está en `.env.prod` como `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`)

---

## Troubleshooting

### "No se resuelve smarteconomat.app"
→ Verifica `/etc/hosts` tiene la entrada:
```bash
grep smarteconomat /etc/hosts
```

Si no aparece, ejecuta:
```bash
sudo bash -c 'echo "127.0.0.1  smarteconomat.app api.smarteconomat.app" >> /etc/hosts'
```

### "Certificado no confiable (ERR_CERT_AUTHORITY_INVALID)"
→ Sigue el paso 2 de arriba (confiar CA en navegador)

### "Conexión rechazada (ERR_CONNECTION_REFUSED)"
→ Verifica los contenedores están corriendo:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Si alguno está parado, levanta todo:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### "HTTPS funciona pero Frontend no carga"
→ Revisa logs del backend:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs backend --tail=50
```

---

## Siguientes pasos

1. Accede a https://smarteconomat.app
2. Inicia sesión con credenciales del admin
3. Prueba funcionalidades principales
4. Para resetear datos completamente:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

---

**Generado:** 12 de abril 2026
**Certificados en:** `/home/psych/projects/SmartEconomat/certs/`
**CA local en:** `/home/psych/projects/SmartEconomat/certs/local-ca/smarteconomat-local-root-ca.crt`
