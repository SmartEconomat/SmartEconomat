# ⚡ SOLUCIÓN RÁPIDA: Seeder se para sin completar

**Problema:** El seeder corre pero se detiene sin mostrar "Seeding completado exitosamente."

**Causa:** Tu servidor tiene una **imagen backend vieja** compilada antes del fix.

---

## 🔧 Solución (copiar y pegar en servidor remoto):

```bash
cd ~/SmartEconomat

# Traer cambios con los fixes
git pull

# Detener backend
docker compose -f docker-compose.prod.yml down backend

# Reconstruir sin cache (IMPORTANTE)
docker compose -f docker-compose.prod.yml build --no-cache backend

# Levantar
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend

# Esperar
sleep 5

# Verificar que esté running
docker compose -f docker-compose.prod.yml ps backend

# Reintentar seeder
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && NODE_ENV=production npm run seed -- --force-production
'
```

---

## ✅ Resultado esperado:

Verás los endpoints siendo testeados y al final:

```
[seed-cli] Seeding completado exitosamente.
```

Luego el prompt volverá sin colgarse.

---

## 📝 Qué se arregló:

- **seed.cli.ts**: Ahora hace `process.exit(0)` automáticamente al completar
- **prod-bootstrap-runner.js**: Ahora pasa control a NestJS después de bootstrap

Ambos cambios están en el repositorio. Solo necesitas hacer `git pull` + reconstruir la imagen.
