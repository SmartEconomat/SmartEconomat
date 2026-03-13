# Error de parseo JSON en producción (unexpected character at line 1 column 1)

## Descripción del Error
Al intentar realizar acciones que requieren del backend en el entorno de producción (como el Login), el frontend arroja el siguiente error en la consola del navegador:

```text
JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

Esto sucede porque el frontend (servido por Nginx en el puerto 80) no sabe qué hacer con las peticiones que empiezan por `/api/v1`. Debido a la regla `try_files $uri $uri/ /index.html;`, Nginx acaba devolviendo el contenido del archivo `index.html` (que empieza por `<`) en lugar de los datos JSON del backend. El navegador, al recibir HTML e intentar parsearlo como JSON, falla inmediatamente.

## Solución
Es necesario configurar un proxy inverso en el servidor Nginx del frontend para que redirija todas las peticiones de API al contenedor del backend.

Se ha actualizado el archivo `frontend/smart-economat-frontend/nginx.conf` incluyendo el siguiente bloque:

```nginx
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```

Después de este cambio, es necesario reconstruir la imagen del frontend:
`docker compose -f docker-compose.prod.yml up --build`
