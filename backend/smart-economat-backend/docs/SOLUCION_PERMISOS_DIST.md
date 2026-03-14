# Solución al Problema de Permisos de la Carpeta `dist`

## Problema

La carpeta `dist` fue creada con propietario `root` durante un build anterior ejecutado con `sudo`, lo que impide:

- Eliminar la carpeta
- Volver a compilar el proyecto
- Actualizar los archivos compilados

## Solución

### Opción 1: Cambiar el propietario de la carpeta dist (Recomendada)

```bash
# Cambiar el propietario de la carpeta dist al usuario actual
sudo chown -R $USER:$USER dist

# O si la carpeta se llama dist_old
sudo chown -R $USER:$USER dist_old

# Luego intentar el build nuevamente
npm run build
```

### Opción 2: Eliminar y recrear la carpeta dist

```bash
# Eliminar la carpeta dist con sudo
sudo rm -rf dist

# Ejecutar el build sin sudo
npm run build
```

### Opción 3: Usar Docker (Si está disponible)

```bash
# Usar Docker para build en un entorno limpio
docker-compose -f docker-compose.dev.yml up --build
```

### Opción 4: Build en una carpeta temporal

```bash
# Configurar una carpeta de output temporal
npx nest build --outputPath dist_new

# Si funciona, cambiar los permisos de la carpeta original
sudo rm -rf dist
mv dist_new dist
```

## Prevención

Para evitar este problema en el futuro:

1. **Nunca ejecutar `npm run build` con sudo**
2. **Usar Docker para desarrollo**: `docker-compose -f docker-compose.dev.yml up`
3. **Configurar permisos correctos**: Asegurarse de que el usuario tenga permisos de escritura en la carpeta del proyecto

## Verificación

Después de aplicar la solución, verificar que el build funciona:

```bash
# Verificar permisos
ls -la dist

# Debería mostrar tu usuario como propietario, no root
# drwxr-xr-x  6 psych psych  4096 mar 12 15:01 dist

# Ejecutar build
npm run build

# Verificar que no hay errores
echo $?  # Debería retornar 0
```

## Notas Adicionales

Si el problema persiste, puede ser necesario:

1. Verificar los permisos del directorio padre del proyecto
2. Ejecutar `npm cache clean --force`
3. Reinstalar node_modules: `rm -rf node_modules && npm install`
