# 10. Base de Datos y Persistencia

SmartEconomat Installer gestiona dos niveles de persistencia: los datos internos del instalador y los datos del producto final (SmartEconomat).

## 1. Persistencia de la Aplicación (Instalador)

El instalador no utiliza una base de datos pesada (como SQLite) para su estado interno, sino que confía en el **sistema de archivos nativo**:

- **Journaling**: Utiliza un servicio de `JournalService` para grabar el progreso de la instalación en archivos JSON. Esto permite que, si el proceso se interrumpe, el instalador pueda retomar desde el último paso válido o realizar un rollback.
- **Configuración Local**: Almacena preferencias de usuario (idioma, ruta de backup por defecto) en el directorio de datos de la aplicación (`AppData/Roaming/SmartEconomat`).

## 2. Persistencia del Producto (Stack Docker)

El instalador es responsable de configurar la persistencia persistente para el stack de servicios:

- **PostgreSQL**: Se crean **volúmenes de Docker** (`db_data`) que mapean los datos de la base de datos a una ubicación física en el disco del host. Esto garantiza que los datos no se pierdan al detener o actualizar los contenedores.
- **Redis**: Persistencia configurada mediante archivos AOF (Append Only File) dentro de un volumen Docker dedicado.
- **Archivos y Adjuntos**: Las imágenes y documentos subidos a SmartEconomat se almacenan en un volumen compartido (`uploads_data`).

## 3. Estrategia de Backup y Recuperación

El servicio `BackupRestoreService` implementa una estrategia de desastre-recuperación local:

- **Backups Preventivos**: Antes de realizar una actualización o reinstalación, el sistema realiza automáticamente una copia de seguridad de los datos existentes.
- **Formato de Artefactos**: Los backups son archivos comprimidos que contienen:
    - Un dump SQL de la base de datos PostgreSQL.
    - Los archivos de configuración `.env`.
    - Los certificados TLS generados.
- **Restauración**: El instalador permite "inyectar" un backup previo durante el proceso de configuración para migrar datos de un equipo a otro o recuperar un estado anterior.

## Riesgos y Mejoras
- **Riesgo**: El borrado accidental de la carpeta runtime o de los volúmenes de Docker (`docker volume prune`) eliminaría todos los datos de negocio.
- **Mejora**: Se recomienda implementar una tarea programada (cron job) nativa de Windows que mueva los archivos de backup generados por la app a una unidad externa o almacenamiento en la nube (S3/Drive).
