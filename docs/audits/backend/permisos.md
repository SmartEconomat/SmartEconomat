# Auditoría Técnica Completa — Permisos

## Resumen Ejecutivo

- **Estado general**: CRUD administrativo de permisos bajo `/permisos` restringido a rol `ADMIN` con `JwtAuthGuard`, `RolesGuard` y `PermisosGuard`.
- **Nivel de riesgo**: Alto (modificación del grafo RBAC).
- **Principales problemas**: Orden de rutas `GET grouped` vs `GET :id` debe mantenerse (actualmente `grouped` está antes de `:id`, correcto); cualquier regresión en orden rompería la API.
- **Principales fortalezas**: Paginación con `SortableFields`, endpoint de agrupación por módulo, uso de `ParseUUIDPipe` en `:id`.
- **Criticidad general**: Máxima para la seguridad del sistema.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Buena

## Hallazgos

### [PERMISOS-001] Ruta estática `grouped` debe permanecer antes de `:id`

#### Severidad
Media

#### Categoría
Mantenibilidad / Contratos API

#### Descripción
NestJS resuelve rutas en orden de declaración; `GET /permisos/grouped` está correctamente declarado antes de `GET /permisos/:id`. Un refactor que invierta el orden haría que `grouped` se interprete como UUID.

#### Riesgo real
404/400 confusos tras refactor mecánico del controlador.

#### Evidencia

```65:78:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\permisos\controller\permisos.controller.ts
  @Get('grouped')
  @RequirePermissions(PERMISSIONS.permisos.listar)
  findGroupedByModule() {
    return this.permisosService.findGroupedByModule();
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
```

#### Impacto

- **Técnico**: Rotura de cliente.
- **Negocio**: Indisponibilidad de pantallas de permisos.
- **UX**: Errores opacos.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Alto si se rompe.

#### Solución recomendada
Regla de lint o comentario de «no reordenar» + test e2e que llame a `/permisos/grouped`.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [PERMISOS-002] Superficie de escritura amplia para ADMIN

#### Severidad
Baja

#### Categoría
Seguridad / Gobierno

#### Descripción
Crear/editar/eliminar permisos en runtime es potente; en entornos enterprise suele preferirse despliegue versionado de permisos vía migraciones/seed.

#### Riesgo real
Drift entre entornos si cambios manuales no se versionan.

#### Evidencia

Controlador expone `POST`, `PATCH`, `DELETE` con `@Roles(rolUsuario.ADMIN)` a nivel de clase (ver archivo completo).

#### Impacto

- **Técnico**: Configuración divergente.
- **Negocio**: Incumplimiento de change management.
- **UX**: Ninguno.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Feature flag `PERMISOS_RUNTIME_MUTABLE` o separar lectura/escritura por entorno.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado.

## Riesgos Potenciales Futuros

- Renombrar códigos de permiso sin migración coordinada en frontend.

## Deuda Técnica

- **Crítica**: Ninguna.
- **Importante**: Tests de orden de rutas y contrato `grouped`.
- **Tolerable**: Reducir JSDoc autogenerado ruidoso.

## Recomendaciones Estratégicas

- Exportar catálogo de permisos como artefacto versionado en CI.

## Conclusión Final

El módulo **permisos** sigue el patrón **administrativo seguro** del proyecto; el riesgo principal es **operacional** (orden de rutas y gobierno de cambios), no un fallo de guardas en el código leído.
