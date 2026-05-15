# Auditoría Técnica Completa — Proveedor

## Resumen Ejecutivo

- **Estado general**: CRUD de proveedores bajo `/proveedor` con listados paginados y filtrado por rol en servicio.
- **Nivel de riesgo**: Medio (datos maestros de compras y NIF/contacto).
- **Principales problemas**: Uso de `ParseUUIDPipe` en lugar de `ParseUUIDv7Pipe` en rutas `:id`, inconsistente con módulos que ya migraron a v7.
- **Principales fortalezas**: Rutas estáticas (`con-pedidos`) declaradas antes de `:id`, evitando colisiones; permisos estándar.
- **Criticidad general**: Alta para compras, media para seguridad en el controlador aislado.

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

### [PROVEEDOR-001] Inconsistencia de pipe UUID (`ParseUUIDPipe` vs v7)

#### Severidad
Media

#### Categoría
Coherencia de API / Validación

#### Descripción
Los endpoints con `:id` usan `ParseUUIDPipe` genérico mientras otros módulos (`pedidos`, `preparaciones`, …) usan `ParseUUIDv7Pipe`, generando comportamiento distinto ante IDs no v7.

#### Riesgo real
Errores 400 heterogéneos entre módulos y posible confusión si el proyecto asume v7 globalmente.

#### Evidencia

```90:97:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\proveedor\controller\proveedor.controller.ts
  @Get(':id')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Proveedor> {
    const userRole = req.user?.rol;
    return this.proveedorService.findOne(id, userRole);
  }
```

#### Impacto

- **Técnico**: Contratos inconsistentes.
- **Negocio**: Bajo.
- **UX**: Mensajes de error distintos.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Estandarizar en `ParseUUIDv7Pipe` o documentar explícitamente qué entidades aún aceptan UUID legacy.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [PROVEEDOR-002] Datos personales/empresa sin anonimización en listados

#### Severidad
Baja

#### Categoría
Privacidad

#### Descripción
Los listados devuelven entidades completas según servicio; el filtrado por rol mitiga pero no sustituye a políticas de minimización de datos.

#### Riesgo real
Exposición de emails/teléfonos a roles que no deberían verlos si el servicio no proyecta campos.

#### Evidencia

Patrón en `findAll` que delega en servicio con `userRole`:

```59:67:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\proveedor\controller\proveedor.controller.ts
  @Get()
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.proveedores)
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Proveedor>> {
    const userRole = req.user?.rol;
    return this.proveedorService.findAll(query, userRole);
  }
```

#### Impacto

- **Técnico**: DTO de respuesta potencialmente amplio.
- **Negocio**: Cumplimiento RGPD según despliegue.
- **UX**: Ninguno.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
DTOs de lectura (`ProveedorPublicDto`) con campos explícitos por rol.

#### Prioridad recomendada
Media (si aplica compliance)

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (`proveedor.service.ts` no diff completo).

## Riesgos Potenciales Futuros

- Importación masiva de proveedores desde CSV sin validación de duplicados por NIF.

## Deuda Técnica

- **Crítica**: Ninguna.
- **Importante**: Unificación de pipes UUID.
- **Tolerable**: DTOs de lectura por rol.

## Recomendaciones Estratégicas

- Índices únicos en BD para NIF cuando exista.

## Conclusión Final

El módulo **proveedor** es **sólido en estructura**, con riesgo principal de **consistencia de validación de IDs** respecto al resto del API.
