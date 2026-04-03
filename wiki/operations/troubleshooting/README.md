# Errores Comunes y Soluciones

Guía de resolución de errores frecuentes encontrados durante el desarrollo y despliegue de SmartEconomat.

---

## Índice de errores

| Error | Entorno | Documento |
|-------|---------|-----------|
| EACCES: permission denied, mkdir './uploads' | Docker Producción | [eacces_mkdir_uploads.md](eacces_mkdir_uploads.md) |
| ENOENT: scandir '/app/dist/i18n/' | Docker Producción | [enoent_scandir_i18n.md](enoent_scandir_i18n.md) |
| JSON.parse: unexpected character at line 1 | Nginx / Producción | [json_parse_nginx_proxy.md](json_parse_nginx_proxy.md) |
| Permisos de la carpeta `dist` | Build local / Docker | [solucion_permisos_dist.md](solucion_permisos_dist.md) |

---

## Resumen rápido

### EACCES: mkdir './uploads'

**Causa:** El contenedor Docker usa un usuario sin privilegios (`appuser`) que no tiene permisos para crear el directorio `uploads`.

**Solución:** Pre-crear el directorio en el Dockerfile y asignar permisos:
```dockerfile
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads
USER appuser
```

---

### ENOENT: scandir '/app/dist/i18n/'

**Causa:** Los archivos de traducción (`src/i18n/`) no se copian al directorio `dist/` durante el build de producción, especialmente con SWC.

**Solución:** Copiar explícitamente el directorio en el Dockerfile:
```dockerfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/i18n ./dist/i18n
```

---

### JSON.parse: unexpected character

**Causa:** Nginx devuelve `index.html` en lugar de JSON cuando las peticiones a `/api/` no están configuradas como proxy.

**Solución:** Añadir bloque de proxy en `nginx.conf`:
```nginx
location /api/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

---

### Permisos de carpeta dist

**Causa:** La carpeta `dist` fue creada con `root` (por un build con `sudo`), impidiendo recompilar.

**Solución:**
```bash
sudo chown -R $USER:$USER dist
npm run build
```

**Prevención:** No ejecutar `npm run build` con `sudo`. Usar Docker para desarrollo.
