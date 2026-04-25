# 7. Backend Interno / Lógica Node Integrada

A diferencia del backend web (NestJS) que se instala, el **Backend Interno** del instalador vive en el proceso principal de Electron y gestiona la interacción con el sistema operativo host.

## Servicios del Sistema

### 1. DockerOrchestratorService
Es el motor principal de la aplicación.
- **Funciones**: `startStack()`, `stopStack()`, `prune()`, `getHealth()`.
- **Implementación**: Ejecuta comandos `docker compose` y parsea la salida para determinar si cada servicio (db, redis, backend, frontend) está operativo.

### 2. PreflightService
Auditor de salud del sistema previo a la instalación.
- **Checks**: Espacio en disco, memoria RAM, versión de WSL2, disponibilidad de puertos (80/443).
- **Auto-repair**: Capaz de ejecutar tareas correctivas como limpiar temporales o cerrar procesos que bloquean puertos.

### 3. TLSService
Gestor de seguridad de red local.
- **Acciones**: Genera certificados autofirmados si el usuario no proporciona unos personalizados.
- **Confianza**: Registra el certificado raíz en el almacén de confianza del sistema (Trusted Root) para evitar advertencias de "Conexión no segura" en el navegador.

### 4. BootGuardianService (Watchdog)
Servicio de vigilancia que se ejecuta en segundo plano.
- **Misión**: Asegurarse de que el stack de SmartEconomat se mantenga levantado. Detecta si un contenedor se cae y trata de reiniciarlo.
- **Integración**: Se comunica con el `powerMonitor` de Electron para suspender/reproducir checks cuando el equipo entra en suspensión.

### 5. BackupRestoreService
Gestión de persistencia de datos.
- **Backup**: Empaqueta los volúmenes de Docker (PostgreSQL) y archivos de configuración en un artefacto comprimido.
- **Restore**: Realiza la operación inversa, validando la integridad del artefacto antes de sobrescribir el estado actual.

## Integración con el Sistema Operativo
- **FileSystem**: Acceso directo para leer/escribir archivos `.env`, configuraciones de Nginx y logs.
- **Process Manager**: Capacidad para detectar y finalizar procesos por PID (necesario para liberar puertos).
- **Power Management**: Escucha eventos de suspensión y reanudación del sistema para pausar tareas intensivas.
- **Shell**: Ejecución de comandos asíncronos con captura de STDOUT/STDERR para informar al usuario.
