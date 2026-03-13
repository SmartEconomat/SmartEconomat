# Error de permisos al intentar crear el directorio de subidas (EACCES mkdir './uploads')

## Descripción del Error
Al arrancar el contenedor backend de Docker en modo producción (`start:prod`), NestJS intenta inicializar los módulos, incluyendo el de manejo de archivos estáticos que requiere del directorio de subidas (`uploads`). Pero como la imagen Docker utiliza un usuario sin privilegios por cuestiones de seguridad (`USER appuser`) y el sistema de archivos principal pertenece al usuario root, la aplicación se cuelga al carecer de permisos de escritura, arrojando un error similar a este:

```text
ERROR [ExceptionHandler] Error: EACCES: permission denied, mkdir './uploads'
```

## Solución
Para resolver este problema de forma segura sin comprometer la política de seguridad del contenedor (sin necesidad de ejecutar todo el contenedor como root), es necesario pre-crear el directorio y establecer a `appuser` y `appgroup` como propietarios durante la etapa de construcción en el `Dockerfile.prod` justo antes del cambio de usuario:

```dockerfile
# Se crea el directorio de uploads explícitamente y se conceden permisos al appuser
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# Se cambia al usuario sin privilegios
USER appuser
```

De esta forma, cuando NestJS verifica si el directorio `./uploads` existe o intenta crearlo, ya no obtiene un fallo de persistencia de privilegios.
