# SmartEconomat

SmartEconomat es una aplicación diseñada para gestionar el inventario de ingredientes y materiales en una escuela de cocina, optimizando el control de stock y facilitando la planificación de clases y recetas.

## Requisitos previos

- **Docker**: Asegúrate de tener Docker instalado en tu sistema. Puedes descargarlo desde [el sitio oficial de Docker](https://www.docker.com/get-started).
- **Docker Compose**: Viene incluido con Docker Desktop, pero verifica que esté disponible ejecutando `docker-compose --version` en tu terminal.

## Configuración inicial

1. **Clonar el repositorio**  
   Clona el repositorio de SmartEconomat en tu máquina local:

   ```bash
   git clone https://github.com/SmartEconomat/SmartEconomat.git
   cd SmartEconomat
   ```

2. **Configurar variables de entorno**  
   El proyecto utiliza archivos de entorno separados para desarrollo y producción.
   - **Desarrollo**:
     Asegúrate de tener el archivo `.env.dev` configurado con tus variables locales.
   - **Producción**:
     Configura el archivo `.env.prod` con las credenciales de producción seguras.

3. **Ejecutar el proyecto**

   ### Entorno de Desarrollo (Hot Reload)

   Ideal para programar. Incluye recarga automática (HMR) para backend y frontend.

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend**: [http://localhost:3000](http://localhost:3000)
   - **Base de Datos**: localhost:5432

   ### Entorno de Producción

   Despliega la aplicación optimizada para producción (imágenes ligeras, sin código fuente montado).

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

   - **Frontend**: [http://localhost:80](http://localhost:80)
   - **Backend**: [http://localhost:3000](http://localhost:3000)

4. **Detener el proyecto**  
   Para detener y eliminar los contenedores:

   ```bash
   # Desarrollo
   docker compose -f docker-compose.dev.yml down

   # Producción
   docker compose -f docker-compose.prod.yml down
   ```

## Scripts del Backend

El backend incluye varios scripts útiles para gestionar la base de datos y generar documentación. Estos scripts se ejecutan desde el directorio `backend/smart-economat-backend`.

### Seeders (Datos de Prueba)

Para poblar la base de datos con datos iniciales o de prueba:

- **Todos los seeders**:

  ```bash
  npm run seed
  ```

- **Seeder específico**:
  Puedes ejecutar un seeder específico enviando su nombre como argumento (ej. `usuario`, `producto`, `pedido`, etc.):

  ```bash
  npm run seed -- usuario
  ```

- **Reset de datos**:
  Para reiniciar la base de datos (drop schema + sync) y poblarla nuevamente:
  ```bash
  npm run db:reset
  ```

### Diagrama Entidad-Relación (ERD)

Para generar un diagrama visual de la estructura actual de la base de datos:

```bash
npm run generate:erd
```

El archivo generado se guardará en `tools/erd/erd.svg`.

> **Nota para usuarios de Docker**:  
> Puedes ejecutar estos comandos dentro del contenedor en ejecución:
>
> ```bash
> docker compose -f docker-compose.dev.yml exec backend npm run seed
> ```

## Notas adicionales

- **Conflicto de puertos**: Ten en cuenta que si intentas levantar el entorno de desarrollo y producción simultáneamente en la misma máquina, es probable que ocurra un conflicto de puertos (por defecto, ambos intentan usar el puerto 3000 para el backend). Detén uno antes de iniciar el otro.
- **Logs**: Para ver los logs de un entorno específico:

  ```bash
  # Desarrollo
  docker compose -f docker-compose.dev.yml logs -f

  # Producción
  docker compose -f docker-compose.prod.yml logs -f
  ```

## Licencia

**SmartEconomat - Todos los derechos reservados**  
Este software es propiedad exclusiva de sus creadores. Queda estrictamente prohibido copiar, modificar, distribuir, sublicenciar o utilizar el software, en su totalidad o en parte, sin la autorización explícita y por escrito de los propietarios. Cualquier uso no autorizado constituye una violación de los derechos de propiedad intelectual y puede estar sujeto a acciones legales.

Para solicitudes de uso o licencias, contacta a los propietarios del proyecto en **darelmartinezcaballero@gmail.com**.

---
