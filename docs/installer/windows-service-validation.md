# Validación Windows Service (10/11)

## Automatizable en CI local

1. `npm run type-check` en `ElectronInstaller`.
2. `npm run test` en `ElectronInstaller`.
3. `npx eslint src/main/services/external-supervisor.service.ts`.
4. `dotnet build` en `ElectronInstaller/windows-supervisor/src`.
5. `dotnet test` en `ElectronInstaller/windows-supervisor/tests` (DriftAnalyzer / reconciliación).

## Validación manual Windows 10 y 11

1. Ejecutar instalador NSIS como administrador.
2. Confirmar que el UAC aparece solo durante instalación.
3. Finalizar instalación y abrir app normalmente sin elevación.
4. Reiniciar equipo y validar (primeros 10 min):
   - **sin prompts UAC** desde Electron al iniciar sesión,
   - tray en estado **Inicializando** (azul), no rojo degradado,
   - servicio `SmartEconomatSupervisor` en `Running`,
   - tras estabilización: Docker daemon y `docker compose ps` con servicios activos.
5. Simular caída **después** de la gracia de boot (5 min):
   - detener `com.docker.service`,
   - detener contenedor `backend`.
6. Confirmar autorreparación controlada:
   - servicio: corrección `com.docker.service` (Manual→Automatic) con cooldown 10 min; `compose down/up` solo tras 3 ciclos degradados y cooldown 15 min,
   - Electron: como máximo `compose restart` automático (sin elevación),
   - sin bucles de reparación en los 10 min siguientes al login.
7. Revisar logs:
   - `C:\ProgramData\SmartEconomat\logs\supervisor-*.log`,
   - estado persistido en `C:\ProgramData\SmartEconomat\state\supervisor-state.json`.
8. Confirmar que el panel Electron refleja estado degradado/healthy real sin falsos OK.

## com.docker.service — tipo de inicio Automatic

SmartEconomat **no** configura el servicio en Manual; el script canónico
`ElectronInstaller/scripts/ops/ensure-com-docker-service-automatic.ps1` fija
`sc config start= auto` + `Set-Service -StartupType Automatic` y verifica
`Win32_Service.StartMode`.

### Diagnóstico rápido

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ElectronInstaller/scripts/ops/diagnose-com-docker-service.ps1
```

### Validación tras reinicio

1. Tras reiniciar, esperar al menos 6 min (gracia de boot 300 s + primer ciclo de supervisión cada 180 s).
2. Comprobar:

```powershell
(Get-CimInstance Win32_Service -Filter "Name='com.docker.service'").StartMode
```

Debe ser `Auto` o `Automatic` si `SmartEconomatSupervisor` está en `Running`.

3. Revisar log del supervisor Windows: líneas `StartMode antes=` / `StartMode después=`
   tras salir de BootGrace.

### Si vuelve a Manual

- **Cerrar Docker Desktop** puede dejar el servicio en Manual (comportamiento de Docker, no de SmartEconomat).
- Habilitar en Docker Desktop: *Settings → General → Start Docker Desktop when you sign in to your computer*.
- Ejecutar reparación manual desde el panel de control de SmartEconomat o:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ElectronInstaller/scripts/ops/ensure-com-docker-service-automatic.ps1 -StartIfStopped
```

Si tras UAC/admin sigue en Manual, el cambio lo está aplicando otro proceso (auditar con Process Monitor).
