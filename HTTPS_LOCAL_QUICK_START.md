# 🚀 HTTPS Local - Quick Start

**Garantiza funcionamiento en `https://smarteconomat.app/` con certificados autofirmados**

---

## ✅ PRE-REQUISITOS (Validar)

```bash
# 1. Check /etc/hosts tiene 127.0.0.1 mapping
grep smarteconomat /etc/hosts
# Debe mostrar: 127.0.0.1  smarteconomat.app api.smarteconomat.app

# 2. Certificados existen
ls -la /certs/live/local-smarteconomat.app/ | grep -E "cert|privkey|fullchain"
# Debe mostrar 3 archivos .pem

# 3. .env.prod configurado
grep DOMAIN /home/psych/projects/SmartEconomat/.env.prod
# Debe mostrar: DOMAIN=smarteconomat.app
```

---

## 🔥 STARTUP (3 pasos)

```bash
cd /home/psych/projects/SmartEconomat

# 1. Validar YAML
docker compose -f docker-compose.prod.yml config > /dev/null && echo "✅ YAML válido"

# 2. Levantar (en background)
docker compose -f docker-compose.prod.yml up -d

# 3. Esperar servicios listos (~60s total)
docker compose -f docker-compose.prod.yml logs -f
# Esperar hasta ver: backend healthy, frontend healthy
# Presionar Ctrl+C para salir
```

---

## 🌐 ACCESO

```
Frontend:  https://smarteconomat.app/
API:       https://smarteconomat.app/api/v1/
Backend:   https://smarteconomat.app/api/v1/health

Nota: Certificado auto-firmado → aceptar warning en navegador
```

---

## 🔍 VERIFICACIÓN

```bash
# Check servicios corriendo
docker compose -f docker-compose.prod.yml ps

# Health endpoints
curl -k https://smarteconomat.app/
curl -k https://smarteconomat.app/api/v1/health

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## 🛑 SHUTDOWN

```bash
# Detener sin eliminar volúmenes
docker compose -f docker-compose.prod.yml down

# Detener y eliminar todo (destructivo)
docker compose -f docker-compose.prod.yml down -v
```

---

## ⚠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` | Actualizar navegador o usar navegador compatible con TLSv1.2+ |
| `Certificate verification failed` | Es esperado (auto-firmado). Click "Avanzado" → "Continuar a sitio" |
| Backend error `connection refused` | Esperar ~30-45s (healthcheck de DB), revisar logs |
| Frontend no carga | Verificar resolución DNS: `nslookup smarteconomat.app` → debe ser `127.0.0.1` |
| `Cannot GET /` | Frontend no compiló correctamente, revisar: `docker compose logs frontend` |

---

## 📊 Performance Notes

- ✅ Build sin cambios: **< 5s** (caché Docker)
- ✅ Startup: **~60s** (healthchecks + migrations)
- ✅ Imagen backend: **~190MB**
- ✅ Imagen frontend: **~42MB**

✨ **TODO LISTO PARA LOCAL** ✨

