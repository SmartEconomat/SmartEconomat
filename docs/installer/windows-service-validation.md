# Validación Windows Service (10/11)

## Automatizable en CI local

1. `npm run type-check` en `ElectronInstaller`.
2. `npm run test` en `ElectronInstaller`.
3. `npx eslint src/main/services/external-supervisor.service.ts`.
4. `dotnet build` en `ElectronInstaller/windows-supervisor/src`.

## Validación manual Windows 10 y 11

1. Ejecutar instalador NSIS como administrador.
2. Confirmar que el UAC aparece solo durante instalación.
3. Finalizar instalación y abrir app normalmente sin elevación.
4. Reiniciar equipo y validar:
   - servicio `SmartEconomatSupervisor` en estado `Running`,
   - Docker daemon disponible,
   - `docker compose ps` con `frontend/backend/db/redis` activos.
5. Simular caída:
   - detener `com.docker.service`,
   - detener contenedor `backend`.
6. Confirmar autorreparación en <= 30s:
   - servicio restablece daemon,
   - se ejecuta `compose down/up` cuando corresponde.
7. Revisar logs:
   - `C:\ProgramData\SmartEconomat\logs\supervisor-*.log`,
   - estado persistido en `C:\ProgramData\SmartEconomat\state\supervisor-state.json`.
8. Confirmar que el panel Electron refleja estado degradado/healthy real sin falsos OK.
