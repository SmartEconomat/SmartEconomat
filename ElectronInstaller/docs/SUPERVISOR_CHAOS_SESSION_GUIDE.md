# SmartEconomat Supervisor: Ejecucion Guiada en 1 Sesion

Guia practica para ejecutar la validacion de caos completa del supervisor en una unica sesion controlada.

## Duracion estimada

- Preparacion: 15 min
- Ejecucion de 12 casos: 90-120 min
- Cierre y reporte: 20 min
- **Total recomendado**: 2h a 2h 30min

## Roles recomendados

- **Operador**: ejecuta fallos inyectados.
- **Observador QA**: valida criterios y registra evidencias.
- **Soporte/Dev** (opcional): analiza diagnosticos cuando haya fallo.

## Pre-flight de sesion (checklist)

- [ ] Windows 10/11 actualizado y sin reinicio pendiente.
- [ ] Docker Desktop instalado.
- [ ] App Electron instalada y ejecutandose.
- [ ] Stack inicial en estado saludable.
- [ ] Panel de Control abierto.
- [ ] Ruta de runtime confirmada (ej. `C:\SmartEconomatRuntime`).
- [ ] Permisos para abrir PowerShell como admin.
- [ ] Espacio libre en disco > 10 GB.
- [ ] Ruta de evidencias creada (ej. `C:\QA\SupervisorChaos\YYYYMMDD`).

## Orden de ejecucion recomendado

Seguir este orden minimiza interferencias y evita falsos positivos:

1. Caso 01 - Docker Desktop cerrado
2. Caso 02 - Daemon no responde
3. Caso 03 - Backend detenido
4. Caso 04 - Multiples contenedores degradados
5. Caso 05 - Estado Docker persistente degradado
6. Caso 06 - Reinicio completo de Docker Desktop
7. Caso 08 - Puertos frontend ocupados
8. Caso 09 - Endpoint HTTP/HTTPS no responde
9. Caso 10 - Presion de memoria
10. Caso 12 - Suspend/Resume
11. Caso 11 - Reinicio de Windows
12. Caso 07 - Fallo no recuperable (escalado humano)

Referencia de criterios: `docs/SUPERVISOR_CHAOS_MATRIX.md`.

## Timebox por caso

- Casos simples (01,03,08,09): 5-8 min cada uno.
- Casos de escalado (02,04,05,06,07): 8-12 min cada uno.
- Casos de sistema (11,12): 10-15 min cada uno.
- Caso de recursos (10): 8-10 min.

Si un caso excede 15 min, marcar como incidencia y continuar al siguiente.

## Evidencias minimas por caso

Para cada caso guardar:

- 1 captura de panel (`estado general + bloque supervisor`).
- 1 captura de tray (`estado textual y color`).
- extracto de `%APPDATA%\SmartEconomatInstaller\supervisor.log`.
- resultado de diagnostico exportado si aplica.
- marca temporal de inicio/fin del caso.

## Plantilla de registro por caso (copiar/pegar)

```text
CASO: [ID y nombre]
INICIO: [YYYY-MM-DD HH:mm:ss]
FIN: [YYYY-MM-DD HH:mm:ss]
ENTORNO: [Windows version, Docker Desktop version]

INYECCION:
- [comando o accion exacta]

OBSERVADO:
- UI estado:
- Tray estado:
- Notificacion:
- Recovery level alcanzado:
- Ultima reparacion automatica:

CRITERIOS:
- Cumple deteccion temprana: [SI/NO]
- Cumple autorecuperacion: [SI/NO]
- Cumple mensaje claro: [SI/NO]
- Cumple no-loop infinito: [SI/NO]

RESULTADO FINAL:
- [PASS/FAIL/BLOCKED]

EVIDENCIAS:
- screenshot_panel: [ruta]
- screenshot_tray: [ruta]
- supervisor_log_fragment: [ruta]
- diagnostics_bundle: [ruta/opcional]

NOTAS:
- [observaciones]
```

## Plantilla resumen de sesion (QA/Soporte)

```text
SESION: Supervisor Chaos
FECHA: [YYYY-MM-DD]
DURACION_TOTAL: [hh:mm]
EJECUTADO_POR: [nombre]
VALIDADO_POR: [nombre]

RESULTADO GLOBAL:
- Casos PASS: [n]
- Casos FAIL: [n]
- Casos BLOCKED: [n]

INCIDENCIAS ABIERTAS:
1) [id] [titulo] [severidad]
   - caso: [id]
   - impacto: [descripcion]
   - evidencia: [ruta]
   - accion propuesta: [descripcion]

RIESGO RESIDUAL:
- [bajo/medio/alto] + justificacion breve

RECOMENDACION GO/NO-GO:
- [GO/NO-GO]
```

## Criterio de cierre de sesion

La sesion se considera cerrada cuando:

- [ ] todos los casos fueron ejecutados o justificados como blocked;
- [ ] cada caso tiene evidencia minima;
- [ ] se emitio resumen QA/soporte;
- [ ] se registraron incidencias con accion propuesta.

## Comandos utiles de soporte (PowerShell)

```powershell
# Estado rapido Docker
docker version
docker info
docker ps

# Estado de stack (ajustar rutas reales)
docker compose -f C:\SmartEconomatRuntime\project\docker-compose.prod.yml --env-file C:\SmartEconomatRuntime\.env.prod ps

# Exportar diagnostico desde app (usar boton "Diagnostico avanzado")
# Revisar log supervisor
Get-Content "$env:APPDATA\SmartEconomatInstaller\supervisor.log" -Tail 200
```

