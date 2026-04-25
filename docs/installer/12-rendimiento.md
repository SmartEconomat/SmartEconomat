# 12. Rendimiento

A pesar de ser una aplicación Electron (que tradicionalmente consume más recursos que una nativa), SmartEconomat Installer está optimizado para mantenerse ligero fuera de los momentos de instalación activa.

## Consumo de Recursos

### 1. Memoria RAM
- **En reposo (Tray)**: ~80MB - 120MB. Al cerrar la ventana principal y quedar en el tray, el consumo se reduce al mínimo necesario para ejecutar los checks de salud del `BootGuardian`.
- **Ventana Principal abierta**: ~250MB - 400MB. Dependiendo de la cantidad de logs que se estén visualizando en tiempo real.
- **Durante la Instalación**: ~500MB+ (incluyendo el overhead de los comandos de Docker que se lanzan en paralelo).

### 2. Carga de CPU
- **Optimización de Logs**: La visualización de logs utiliza técnicas de "throttling" para evitar que el proceso de renderizado se sature cuando Docker emite miles de líneas por segundo.
- **Idle State**: Cuando los servicios están sanos, los checks de salud se realizan en intervalos espaciados (Watchdog), consumiendo menos del 1% de CPU.

## Optimizaciones Implementadas

- **Vite**: El uso de Vite para el empaquetado del frontend reduce drásticamente el tamaño del bundle inicial y el tiempo de carga de la interfaz.
- **Tree Shaking**: Se han eliminado dependencias no utilizadas y se importan solo los módulos necesarios de librerías grandes como MUI.
- **Asincronía**: Todas las operaciones pesadas de sistema (Docker, Copia de archivos, Generación de certificados) se ejecutan de forma asíncrona mediante promesas en el Main Process, evitando que la interfaz se congele ("unresponsive").

## Puntos de Mejora (Rendimiento)
- **Tamaño del Binario**: El instalador es pesado (~200MB - 400MB) porque incluye como `extraResources` todos los artefactos de SmartEconomat (backend, frontend y docker images). Se podría optimizar descargando estos recursos bajo demanda, aunque esto requeriría conexión a internet obligatoria.
- **Operaciones de Disco**: Durante la limpieza de Docker (`prune`), el uso de I/O de disco puede ser intenso. Se recomienda no realizar estas tareas mientras se ejecutan otras aplicaciones críticas en el host.
