# SmartEconomat Supervisor: Matriz de Pruebas de Caos

Este runbook valida que el supervisor autónomo de `ElectronInstaller` se comporta correctamente ante fallos reales en Windows 10/11.

## Objetivo

Validar de forma repetible:

- detección temprana de fallos en Docker Desktop/Engine/stack;
- autorecuperación por niveles (1-6) sin bucles infinitos;
- mensajes claros para usuario no técnico;
- estado visible y consistente en panel + tray + notificaciones;
- tolerancia a reinicios, red inestable y recursos degradados.

## Precondiciones

- App Electron instalada y con autoarranque activo.
- Runtime disponible (por defecto `C:\SmartEconomatRuntime`).
- Docker Desktop instalado.
- Stack levantado y saludable inicialmente.
- Abrir Panel de Control en modo `control`.

## Observabilidad mínima durante pruebas

- **UI**: estado general, bloque de supervisor, `Última reparación automática`.
- **Tray**: color (verde/amarillo/rojo) y estado textual.
- **Logs supervisor**: `%APPDATA%\SmartEconomatInstaller\supervisor.log`.
- **Logs runtime**: botón `Ver logs` y diagnóstico avanzado.

## Criterios globales de aprobación

- El supervisor no queda en estado muerto; siempre sigue monitorizando.
- Toda acción automática queda reflejada en logs y estado visible.
- En fallo no recuperable se escala a guía clara (nivel 6), sin spam.
- No se rompe funcionalidad existente de instalación/control panel.

## Matriz de caos (ejecutar en orden)

### Caso 01 - Docker Desktop cerrado manualmente

- **Inyección de fallo**
  - Cerrar Docker Desktop desde bandeja o Administrador de tareas.
- **Resultado esperado**
  - Supervisor detecta `desktop-not-running`.
  - Intenta arrancar Docker Desktop automáticamente.
  - Tray pasa a amarillo durante recuperación y vuelve a verde al estabilizar.
  - Notificación visible: Docker se ha reiniciado/arrancado.
- **Aceptar si**
  - `docker ps` vuelve a responder y stack queda operativo sin intervención.

### Caso 02 - Daemon Docker no responde

- **Inyección de fallo**
  - Interrumpir servicio backend de Docker Desktop o forzar estado no listo.
- **Resultado esperado**
  - Estado `daemon-starting`/`daemon-error`.
  - Reintentos con backoff, sin consumo excesivo de CPU.
  - Escalada de recuperación y mensaje claro en panel.
- **Aceptar si**
  - Se recupera automáticamente o escala a nivel 6 con instrucción de diagnóstico.

### Caso 03 - Contenedor backend detenido

- **Inyección de fallo**
  - `docker compose -f <compose> --env-file <env> stop backend`
- **Resultado esperado**
  - Detecta contenedor no saludable.
  - Nivel 1: reinicio selectivo de `backend`.
  - Health vuelve a OK.
- **Aceptar si**
  - Recuperación en menos de 2 ciclos del watchdog.

### Caso 04 - Múltiples contenedores degradados

- **Inyección de fallo**
  - Detener `backend` y `frontend`.
- **Resultado esperado**
  - Nivel 1 puede fallar y escalar a nivel 2 (`compose up -d`).
  - Si persiste, nivel 3 (`down + up --build --force-recreate`).
- **Aceptar si**
  - Escalada progresiva correcta y sin salto directo injustificado.

### Caso 05 - Fallo persistente de imagen/estado Docker

- **Inyección de fallo**
  - Simular estado irreparable inicial (imagen corrupta o metadata inconsistente).
- **Resultado esperado**
  - Escala hasta nivel 4 (prune safe + recreate).
- **Aceptar si**
  - Queda registrado en logs `Nivel 4` y stack vuelve a saludable o sigue escalando.

### Caso 06 - Requiere reinicio completo de Docker Desktop

- **Inyección de fallo**
  - Dejar daemon inaccesible de forma sostenida.
- **Resultado esperado**
  - Escala a nivel 5 (reinicio Docker Desktop) y reintenta stack.
- **Aceptar si**
  - Se ejecuta acción de reinicio y se actualiza `Última reparación automática`.

### Caso 07 - Fallo no recuperable (escalado usuario)

- **Inyección de fallo**
  - Forzar condición que impida recuperar (p.ej. Docker desinstalado).
- **Resultado esperado**
  - Nivel 6: guía humana, notificación y recomendación clara.
- **Aceptar si**
  - Usuario entiende en 1 lectura qué hacer (instalar/reparar Docker, abrir diagnóstico).

### Caso 08 - Puertos de frontend no disponibles

- **Inyección de fallo**
  - Ocupar puertos `FRONTEND_HTTP_PORT`/`FRONTEND_HTTPS_PORT` con otro proceso.
- **Resultado esperado**
  - Check de puertos en estado `warn/error`.
  - Endpoint HTTP/HTTPS reporta degradación.
  - Mensaje orientado a reparación.
- **Aceptar si**
  - El panel refleja el problema y la recuperación intenta restablecer disponibilidad.

### Caso 09 - Endpoint HTTP/HTTPS no responde

- **Inyección de fallo**
  - Mantener contenedores `running` pero sin respuesta de endpoint.
- **Resultado esperado**
  - Checks `http-endpoint`/`https-endpoint` degradados.
  - Estado general no permanece en verde.
- **Aceptar si**
  - Se detecta degradación aunque Docker reporte running.

### Caso 10 - Memoria baja del sistema

- **Inyección de fallo**
  - Simular presión de memoria con procesos de carga.
- **Resultado esperado**
  - Check `memory` cambia a `warn/error` por umbral.
  - El supervisor sigue operativo y evita colapso por loops.
- **Aceptar si**
  - El sistema no entra en espiral de reinicios agresivos.

### Caso 11 - Reinicio de Windows

- **Inyección de fallo**
  - Reiniciar el equipo.
- **Resultado esperado**
  - App se inicia con Windows.
  - Supervisor recupera estado y vuelve a vigilar automáticamente.
  - Stack se valida y repara si es necesario.
- **Aceptar si**
  - Sin intervención manual el panel vuelve a estado operativo.

### Caso 12 - Suspensión/reanudación

- **Inyección de fallo**
  - Suspender equipo y reanudar.
- **Resultado esperado**
  - Se dispara verificación post-resume con delay de seguridad.
  - Si hay degradación, inicia recuperación.
- **Aceptar si**
  - Sin falsos positivos prolongados y con restablecimiento estable.

## Prueba de regresión funcional (obligatoria)

Tras completar la matriz:

- instalar/reinstalar desde wizard;
- start/stop/restart stack desde panel;
- stream de logs;
- backup y restore de prueba;
- diagnóstico avanzado.

Debe seguir funcionando todo sin romper el comportamiento existente.

## Checklist de salida (Go/No-Go)

- [ ] 12/12 casos ejecutados.
- [ ] Sin bloqueos no controlados del supervisor.
- [ ] Tray y UI siempre coherentes con el estado real.
- [ ] Logs estructurados generados para cada incidente.
- [ ] Ninguna regresión en flujo principal del instalador.

Si alguno falla, registrar incidencia con:

- caso de matriz;
- timestamp;
- extracto de `%APPDATA%\SmartEconomatInstaller\supervisor.log`;
- captura de panel y tray;
- resultado de diagnóstico exportado.
