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
   - Copia el archivo `.env.example` a un nuevo archivo llamado `.env`:
     ```bash
     cp .env.example .env
     ```
   - Abre el archivo `.env` con un editor de texto y completa las variables con los valores reales correspondientes (por ejemplo, credenciales de base de datos, claves API, etc.).

3. **Construir y levantar el proyecto**  
   - La primera vez, ejecuta el siguiente comando para construir las imágenes de Docker y levantar los servicios:
     ```bash
     docker compose up --build
     ```
   - En ejecuciones posteriores, simplemente usa:
     ```bash
     docker compose up
     ```

4. **Detener el proyecto**  
   Para detener los contenedores sin eliminarlos, usa:
   ```bash
   docker compose stop
   ```
   Si deseas eliminar los contenedores y liberar recursos, usa:
   ```bash
   docker compose down
   ```

## Notas adicionales

- Asegúrate de que los puertos especificados en el archivo `docker-compose.yml` no estén en uso por otras aplicaciones.
- Si encuentras problemas durante la configuración, verifica los logs de Docker con:
  ```bash
  docker compose logs
  ```

## Licencia

**SmartEconomat - Todos los derechos reservados**  
Este software es propiedad exclusiva de sus creadores. Queda estrictamente prohibido copiar, modificar, distribuir, sublicenciar o utilizar el software, en su totalidad o en parte, sin la autorización explícita y por escrito de los propietarios. Cualquier uso no autorizado constituye una violación de los derechos de propiedad intelectual y puede estar sujeto a acciones legales.

Para solicitudes de uso o licencias, contacta a los propietarios del proyecto en **darelmartinezcaballero@gmail.com**.

---