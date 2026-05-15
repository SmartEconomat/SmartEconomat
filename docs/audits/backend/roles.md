# Auditoría Técnica Completa — Roles

## Resumen Ejecutivo

- **Estado general**: CRUD y asignación de roles bajo `/roles` restringido a `ADMIN` con permisos granulares (`roles.*`).
- **Nivel de riesgo**: Muy alto (modificación del grafo de roles y asignación a usuarios).
- **Principales problemas**: Import de `GetUser` desde `sherlock-auth` mientras otros módulos usan `auth/decorators/get-user.decorator` — posible duplicidad y confusión de tipos.
- **Principales fortalezas**: Orden de rutas cuidado (`all` antes de `:id`), uso de `ParseUUIDPipe` en parámetros (ver nota de consistencia v7 en otro módulo).
- **Criticidad general**: Máxima para RBAC.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Buena

## Hallazgos

### [ROLES-001] Duplicidad de decorador `GetUser` (sherlock-auth vs auth)

#### Severidad
Media

#### Categoría
Mantenibilidad / Consistencia

#### Descripción
`RolesController` importa `GetUser` desde `../../sherlock-auth/decorators/get-user.decorator` mientras `UsuarioController` usa `../../auth/decorators/get-user.decorator`.

#### Riesgo real
Divergencia de tipos o comportamiento si uno de los dos decoradores evoluciona distinto.

#### Evidencia

```25:26:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\roles\controller\roles.controller.ts
import { GetUser } from '../../sherlock-auth/decorators/get-user.decorator';
```

Comparar con:

```26:26:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\usuario\controller\usuario.controller.ts
import { GetUser } from '../../auth/decorators/get-user.decorator';
```

#### Impacto

- **Técnico**: Duplicación conceptual.
- **Negocio**: Bajo directo.
- **UX**: Ninguno.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Unificar en un solo decorador canónico (`auth` o `common`) y re-exportar desde sherlock si hace falta compatibilidad.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Medio

### [ROLES-002] Asignación de roles a usuarios como operación privilegiada

#### Severidad
Baja (recordatorio)

#### Categoría
Seguridad

#### Descripción
Los endpoints de asignación requieren permisos explícitos; el riesgo residual es insider threat, mitigado solo por auditoría externa si no hay logs estructurados en servicio.

#### Riesgo real
Cambios maliciosos de roles sin trazabilidad centralizada.

#### Evidencia

Patrón en controlador con `assignRoleToUser` (ver archivo completo) y `PermisosGuard` a nivel de clase.

#### Impacto

- **Técnico**: Observabilidad.
- **Negocio**: Compliance.
- **UX**: Ninguno.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Auditoría append-only de cambios RBAC (quién, cuándo, rol anterior/nuevo).

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado.

## Riesgos Potenciales Futuros

- Roles sistema (`esSistema`) vs eliminación accidental — debe estar en servicio/BD constraints.

## Deuda Técnica

- **Crítica**: Ninguna en controlador.
- **Importante**: Unificar decorador `GetUser`.
- **Tolerable**: Migrar `ParseUUIDPipe` a v7 si aplica a IDs de rol.

## Recomendaciones Estratégicas

- Flujos de aprobación en dos pasos para asignación de roles elevados en tenants sensibles.

## Conclusión Final

El módulo **roles** es **correctamente acotado a ADMIN**, pero el proyecto debe resolver la **bifurcación de decoradores `GetUser`** para reducir riesgo de inconsistencias futuras.
