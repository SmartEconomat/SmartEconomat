# 9. Sistema IPC (Inter-Process Communication)

La comunicación entre el proceso principal y el de renderizado es la columna vertebral de la aplicación. Aquí se detallan todos los canales detectados y su función.

## Canales del Instalador (`installer:*`)

| Canal | Tipo | Input | Output | Propósito |
|-------|------|-------|--------|-----------|
| `installer:run-preflight` | `invoke` | `RuntimePaths` | `PreflightReport` | Ejecuta checks de sistema. |
| `installer:run-auto-repair` | `invoke` | `RuntimePaths` | `PreflightReport` | Intenta arreglar bloqueantes detectados. |
| `installer:release-busy-port` | `invoke` | `PortRepairPayload`| `PreflightReport` | Cierra procesos que usan los puertos 80/443. |
| `installer:start-install` | `invoke` | `InstallerConfig` | `StateSnapshot` | Inicia el proceso de despliegue Docker. |
| `installer:get-state` | `invoke` | - | `StateSnapshot` | Obtiene el estado actual de la máquina de estados. |
| `installer:get-boot-state` | `invoke` | - | `BootState` | Verifica si ya existe una instalación previa. |
| `installer:pick-file` | `invoke` | `PickerConfig` | `string (path)` | Abre el diálogo nativo de selección de archivos. |
| `installer:test-smtp` | `invoke` | `SmtpConfig` | `boolean` | Valida la conexión con el servidor de correo. |

## Canales de Ejecución (`runtime:*`)

| Canal | Tipo | Input | Output | Propósito |
|-------|------|-------|--------|-----------|
| `runtime:get-health` | `invoke` | - | `ServiceHealth[]` | Estado (Up/Down) de cada contenedor Docker. |
| `runtime:start-stack` | `invoke` | - | `OperationResult` | Inicia todos los servicios de SmartEconomat. |
| `runtime:stop-stack` | `invoke` | - | `OperationResult` | Detiene todos los servicios. |
| `runtime:restart-stack` | `invoke` | - | `OperationResult` | Reinicia el stack completo. |
| `runtime:tail-logs` | `send` | `serviceName` | - | Inicia el streaming de logs de un servicio. |
| `runtime:stop-logs` | `send` | - | - | Detiene el streaming de logs. |
| `runtime:generate-diagnostics`| `invoke` | - | `string (zip path)` | Crea un paquete con logs y estado para soporte. |
| `runtime:backup-now` | `invoke` | - | `OperationResult` | Ejecuta un backup inmediato de la base de datos. |
| `runtime:restore-from` | `invoke` | `artifactPath` | `OperationResult` | Restaura el sistema desde un archivo de backup. |
| `runtime:prune` | `invoke` | `mode` | `OperationResult` | Limpieza agresiva de recursos Docker no usados. |
| `runtime:uninstall` | `invoke` | `phrase` | `OperationResult` | Eliminación total del software y sus datos. |

## Eventos Asíncronos (Main -> Renderer)

| Evento | Datos | Propósito |
|--------|-------|-----------|
| `installer:progress` | `{ step, progress, message }` | Actualiza la barra de progreso en el wizard. |
| `runtime:log-event` | `{ service, line, timestamp }` | Envía líneas de log de Docker para mostrar en la consola. |
| `runtime:health-push` | `ServiceHealth[]` | Actualización proactiva del estado de los servicios. |
| `system:debug-log` | `DebugEvent` | Logs técnicos internos para la Debug Console. |

## Seguridad en IPC
- **Validación con Zod**: Todos los canales `invoke` validan sus argumentos antes de pasar a la lógica de negocio.
- **Manejo de Errores**: Se utiliza un wrapper (`registerIpcHandleWithDebug`) que captura cualquier excepción en el Main process y la devuelve como un objeto estructurado `{ ok: false, message: ... }`, evitando que el Renderer se quede esperando indefinidamente.
