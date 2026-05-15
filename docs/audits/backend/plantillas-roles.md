# Auditoría Técnica Completa — Plantillas roles

## Resumen Ejecutivo

- **Estado general**: CRUD de plantillas de rol bajo `/plantillas-roles` con operaciones de permisos efectivos y duplicación; restringido a `ADMIN`.
- **Nivel de riesgo**: Alto (plantillas definen conjuntos de permisos reutilizables).
- **Principales problemas**: Uso de `as unknown as` para invocar `duplicateTemplate`, bypass del tipado estático.
- **Principales fortalezas**: Endpoints claros, permisos alineados con `PERMISSIONS.roles.*`, uso de `ParseUUIDPipe` en rutas con id.
- **Criticidad general**: Alta para RBAC.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Buena
- **Coherencia de dominio**: Buena
- **Tipado**: Deficiente (en duplicación)
- **Resiliencia**: Buena
- **Claridad del código**: Aceptable

## Hallazgos

### [PLANTILLAS-ROLES-001] Cast `unknown` para llamar al servicio de duplicado

#### Severidad
Media

#### Categoría
Tipado / Mantenibilidad

#### Descripción
El método `duplicate` fuerza el servicio a un contrato local vía `as unknown as PlantillasRolesCrudContract` en lugar de exponer el método tipado en la clase de servicio.

#### Riesgo real
Errores de refactor no detectados por el compilador si el servicio renombra o cambia la firma.

#### Evidencia

```96:105:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\plantillas-roles\controller\plantillas-roles.controller.ts
  @Post(':id/duplicar')
  @RequirePermissions(PERMISSIONS.roles.crear)
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicatePlantillaDto
  ) {
    const service = this
      .plantillasRolesService as unknown as PlantillasRolesCrudContract;
    return service.duplicateTemplate(id, dto.nombre);
  }
```

#### Impacto

- **Técnico**: Pérdida de type safety.
- **Negocio**: Bajo directo.
- **UX**: Posible 500 si firma cambia.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Declarar `duplicateTemplate` en `PlantillasRolesService` con visibilidad pública y tipos explícitos; eliminar el cast.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo

### [PLANTILLAS-ROLES-002] Permisos efectivos potencialmente costosos

#### Severidad
Baja

#### Categoría
Performance

#### Descripción
`GET /plantillas-roles/:id/permisos-efectivos` puede implicar joins o deduplicación en servicio; sin paginación.

#### Riesgo real
Latencia en catálogos de permisos muy grandes.

#### Evidencia

```73:77:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\plantillas-roles\controller\plantillas-roles.controller.ts
  @Get(':id/permisos-efectivos')
  @RequirePermissions(PERMISSIONS.roles.listar)
  getPermisosEfectivos(@Param('id', ParseUUIDPipe) id: string) {
    return this.plantillasRolesService.getPermisosEfectivos(id);
  }
```

#### Impacto

- **Técnico**: CPU/memoria.
- **Negocio**: Bajo.
- **UX**: Lentitud en UI admin.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Caché de corta duración por id de plantilla o proyección mínima.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado.

## Riesgos Potenciales Futuros

- Duplicación de plantillas con nombres colisionantes si no hay restricción única en BD.

## Deuda Técnica

- **Crítica**: Ninguna.
- **Importante**: Eliminar `as unknown as` en duplicación.
- **Tolerable**: Documentar semántica de permisos heredados vs directos.

## Recomendaciones Estratégicas

- Auditoría de cambios en plantillas con tabla de historial si el compliance lo exige.

## Conclusión Final

El módulo **plantillas-roles** es funcional y **bien protegido por rol ADMIN**; el principal defecto técnico visible es el **escape del sistema de tipos** en la duplicación.
