# Error al cargar traducciones en NestJS (ENOENT: no such file or directory, scandir '/app/dist/i18n/')

## Descripción del Error
Al compilar y ejecutar el proyecto NestJS en modo producción (`npm run start:prod` apuntando a `dist/main`), la aplicación se rompe instantáneamente al inicializar el módulo de internacionalización (`nestjs-i18n`) devolviendo los siguientes errores en cadena:

```text
ERROR [I18nService] I18nError: i18n path (/app/dist/i18n/) cannot be found
ERROR [I18nService] Error: ENOENT: no such file or directory, scandir '/app/dist/i18n/'
```

Esto ocurre porque, aunque hayas configurado los `assets` en tu `nest-cli.json` para que el compilador nativo se encargue de copiar los ficheros de traducciones a la carpeta compilada `dist`, existen escenarios (frecuentes usando integraciones SWC u otros constructores en cadena de Docker) en los que los ficheros que no son `.ts` acaban siendo ignorados y omitidos. Por tanto, `nestjs-i18n` no los encuentra en el `outDir` y tira la aplicación.

## Solución
Para resolverlo de manera completamente fiable sin depender de que los *bundlers* de TypeScript cumplan la directiva de copia, la mejor práctica en despliegues es copiar de forma manual y explícita la carpeta `src/i18n/` en la misma etapa final tu `Dockerfile.prod`, asegurando que llegue íntegra a `dist/`:

```dockerfile
# Se copia la carpeta compilada
COPY --from=builder /app/dist ./dist

# Se copia explícitamente el directorio de traducciones JSON al dist
COPY --from=builder /app/src/i18n ./dist/i18n
```

Con una copia manual en Docker, se garantiza que jamás falte independientemente del constructor que usemos para transpilar el TypeScript.
