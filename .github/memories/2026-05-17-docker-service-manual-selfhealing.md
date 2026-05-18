# Supervisor: reconciliación por estado deseado

## Arquitectura (2026-05)
- **StateReconciler**: observe → drift → plan → una acción/ciclo
- **DesiredStateCatalog**: docker=running, postgres/redis/backend=healthy, frontend=available
- **ActualStateCollector**: docker info, compose ps, inspect, HTTP
- **DriftAnalyzer**: actual vs desired → SignalHealth + RecoveryLevel mínimo
- **ReconciliationExecutor**: L1–L4
- **CooldownRegistry**: cooldowns desacoplados por nivel

## L2 y Docker Desktop
`com.docker.service` Manual/parado → drift → corrección **solo en L2** vía `ensure-com-docker-service-automatic.ps1` (cooldown ServiceCorrectionCooldownSeconds).

## Ciclo
180s (120–300). Boot grace 300s = observe only.

## Doc
`ElectronInstaller/windows-supervisor/docs/RECONCILIATION.md`
