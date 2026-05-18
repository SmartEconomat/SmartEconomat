# Reconciliación por estado deseado

## Modelo

```text
desired_state (catálogo fijo)
        ↓ compare
actual_state (señales observadas)
        ↓
drift + severidad (OK / Degraded / Unhealthy / Critical)
        ↓
plan (nivel mínimo L1–L4 + persistencia)
        ↓
una acción por ciclo (cooldown)
```

## Estado deseado

| Componente | Deseado |
|------------|---------|
| docker | running |
| postgres | healthy |
| redis | healthy |
| backend | healthy |
| frontend | available |

## Señales (actual)

- `docker info` → daemon
- `docker compose ps` → inventario
- `docker inspect` → healthchecks contenedor
- HTTP `127.0.0.1/api/v1` → backend
- HTTP `127.0.0.1/` → frontend
- CIM `com.docker.service` → StartMode/State (telemetría auxiliar; no fuente de verdad si el daemon y el stack ya responden)

## Source of truth operativa

1. `docker info` + inventario/healthchecks reales del stack Compose.
2. Reachability HTTP local de backend/frontend cuando aplique.
3. Señales Windows (`com.docker.service`, WSL) solo como contexto auxiliar.

Si `docker info` responde y el stack `smarteconomat-prod` está sano, `com.docker.service` en `Manual` o `Stopped` no debe degradar el estado global ni disparar reparación fuerte por sí solo.

## Niveles de recuperación

| Nivel | Acción | Cuándo |
|-------|--------|--------|
| **L1** | `compose restart <servicio>` | Drift en un contenedor; persistencia ≥ L1PersistenceThreshold |
| **L2** | Script canónico `com.docker.service` + WSL | Daemon caído o plataforma Docker realmente inaccesible |
| **L3** | `up -d` + restart selectivo | Varios componentes; persistencia ≥ PersistenceThreshold |
| **L4** | `down/up` | Critical persistente tras L3 |

`com.docker.service` **solo** se corrige dentro de **L2** cuando el daemon/stack no están disponibles. Si el daemon está operativo, cualquier desalineación de `StartMode/State` se registra como observación auxiliar, nunca como incidente primario.

## Cooldowns

- `ServiceCorrectionCooldownSeconds` — sub-acción L2 (script)
- `ContainerRecoveryCooldownSeconds` — L1
- `DockerRecoveryCooldownSeconds` — L2 completo
- `ComposeLightRecoveryCooldownSeconds` — L3
- `ComposeFullRecoveryCooldownSeconds` — L4

## Logs estructurados

- `desired_state_snapshot`
- `actual_state_snapshot`
- `drift_detected`
- `recovery_level_applied`
- `reconciliation_deferred` + `cooldown_active_reason`

## Electron

Solo observación (`ExternalSupervisorService`); sin repair automático con elevación.
