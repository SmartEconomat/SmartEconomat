# Índice de arquitectura

Este índice agrupa la documentación de **arquitectura y decisiones técnicas** del proyecto. Para la visión consolidada y versiones de dependencias, conviene cruzar con [`.github/ai/ARCHITECTURE.md`](../../.github/ai/ARCHITECTURE.md).

## Vista general por capa

| Documento | Contenido |
| --- | --- |
| [backend.md](./backend.md) | Servidor NestJS, módulos y pipeline de petición. |
| [frontend.md](./frontend.md) | Cliente React, capas y sesión. |
| [data-model.md](./data-model.md) | Entidades y relaciones principales. |

## Consulta rápida y UI

| Documento | Contenido |
| --- | --- |
| [Backend quick reference](../development/backend-quick-reference.md) | Rutas, prefijos API y tips operativos. |
| [Normalización de respuestas API](../development/normalizacion-quick-reference.md) | Envelope e interceptores. |
| [UI de inventario (frontend)](../frontend/ui-inventario.md) | Particularidades del módulo de inventario. |

## Decisiones y políticas

| Documento | Contenido |
| --- | --- |
| [patrones-y-tradeoffs.md](./patrones-y-tradeoffs.md) | Decisiones de diseño y costes asumidos. |
| [uuid-v7.md](./uuid-v7.md) | Uso de UUID v7 en persistencia. |
| [soft-delete.md](./soft-delete.md) | Borrado lógico y efectos en dominio. |

## Diagramas y resúmenes

| Documento | Contenido |
| --- | --- |
| [Diagrama backend](../diagrams/arquitectura-backend.md) | Vista Mermaid de la capa servidor. |
| [Resumen backend (overview)](../overview.md) | Objetivos, stack y diagramas de flujo (énfasis API). |

## Relacionado

- [Arquitectura full-stack (runbook)](../architecture.md)
- [Patrones reutilizables (monorepo)](../patrones-arquitectura.md)
- [Referencia de API](../reference/api/README.md)
- [Variables de entorno](../environment-variables.md)
- [Despliegue](../deployment.md)

### Nota sobre `docs/archive/obsolete/`

Documentación antigua movida a archivo **no** se mantiene al día con el código. Úsala solo como contexto histórico, nunca como especificación.
