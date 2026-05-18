# Matriz de responsabilidades: supervisión SmartEconomat (Windows)

Documento de referencia para startup, diagnóstico y reparación. Actualizado con el refactor OBSERVE_ONLY / RUNTIME.

## Leyenda

| Columna | Significado |
|---------|-------------|
| **Mutación SO** | Modifica Windows (servicios, hosts, firewall, registry) |
| **Mutación Docker** | Ejecuta `docker` / `compose` con efecto en contenedores |
| **Elevación** | Puede disparar UAC (`RunAs`) |
| **Startup** | Comportamiento en login / `app.whenReady` |
| **Runtime** | Comportamiento con entorno estable |
| **Repair** | Reparación automática o manual |

## Matriz por componente

| Componente | Observa | Mutación SO | Mutación Docker | Elevación | Startup | Runtime | Repair automático | Riesgo loop |
|------------|---------|-------------|-----------------|-----------|---------|---------|-------------------|-------------|
| `index.ts` | Indirecto | Indirecto | Indirecto | No (packaged) | Lifecycle OBSERVE_ONLY, tray `stabilizing` | Delega a supervisor | No | Bajo |
| `ExternalSupervisorService` | Sí | `sc` sin elevar | `restartStack` ligero | Solo manual | OBSERVE: solo lectura | Monitor + repair ligero K-of-N | Ligero en RUNTIME | Medio (mitigado) |
| `SmartEconomatSupervisor` (.NET) | Sí | Reconciliación L2 (servicio Docker, WSL) | L3/L4 compose | No (SYSTEM) | Gracia boot, observe | L1–L4 una acción/ciclo | Desired-state + cooldowns | Bajo (mitigado) |
| `DockerOrchestratorService` | Sí | Set-Service (contextual) | compose full | Solo `install` / `user-repair` | No auto en observe | Panel / IPC manual | Según contexto | Alto sin contexto |
| `DockerReadinessService` | Sí | No | Probe / start Desktop | No | Probes pasivos | Probes | No | Bajo |
| `LocalDomainSelfHealService` | Sí | hosts, firewall | No | Solo `user-repair` | **No** en whenReady | Manual / post-estable | No auto | Bajo |
| `BootGuardianService` | — | — | — | — | **No cableado** | Deprecado | — | N/A |
| `PreflightService` | Sí | Sí | Sí | Sí (wizard) | Solo instalación | N/A | Durante install | Bajo |

## Autoridad de reparación (post-refactor)

```text
Boot / OBSERVE_ONLY:
  Electron     → solo observación (60–120s)
  Win Service  → solo observación (BootGraceSeconds)

RUNTIME:
  Electron     → compose restart (ligero), sin elevación, K-of-N
  Win Service  → down/up, Set-Service, WSL (fuerte), K-of-N + cooldown 15 min

Manual / Install:
  Panel IPC    → user-repair (puede elevar)
  Preflight    → install (puede elevar)
```

## Rutas UAC auditadas

| Ruta | Contextos permitidos |
|------|----------------------|
| `docker-orchestrator.tryElevatedWindowsDockerServiceRepair` | `install`, `user-repair` |
| `external-supervisor` RunAs | `recoverStack(manual)` |
| `local-domain-selfheal` RunAs | `user-repair` |
| `firewall-executor` RunAs fallback | `install`, `user-repair` |
| `preflight.runElevated*` | `install` |

## Estado persistido

- Fuente: `C:\ProgramData\SmartEconomat\state\supervisor-state.json` (servicio Windows).
- Electron: lectura + enriquecimiento vivo; no duplica `compose down` en automático.

## Principios

1. Startup nunca repara ni eleva (Electron).
2. Docker lento ≠ Docker roto (`STABILIZING` / `STACK_STARTING`).
3. Un actor para repair fuerte automático: servicio Windows.
4. Electron: repair ligero automático solo en RUNTIME con incidente confirmado.
5. `com.docker.service` y señales Windows equivalentes son telemetría auxiliar: no pueden degradar por sí solas un sistema cuyo Docker Engine y stack Compose están verificados en vivo.
