# Auditoría Técnica Completa — Inventario

## Resumen Ejecutivo

- **Estado general**: Módulo central de stock bajo `/inventario` con operaciones de alta, consulta, ajustes manuales auditados, transferencias y Swagger en rutas críticas.
- **Nivel de riesgo**: Alto (integridad de cantidades y trazabilidad).
- **Principales problemas**: La complejidad transaccional vive en servicios/repositorios no auditados exhaustivamente en este informe; riesgo de condiciones de carrera en ajustes concurrentes.
- **Principales fortalezas**: Permisos separados (`crear`, `listar`, `ajustar_stock`), uso de `GetUser` para auditoría, DTOs específicos para stock y transferencias.
- **Criticidad general**: Máxima para el dominio economato.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [INVENTARIO-001] Ajustes manuales como superficie de alto impacto

#### Severidad
Alta

#### Categoría
Integridad de datos / Negocio

#### Descripción
El endpoint de ajustes manuales combina cambio de stock y auditoría; cualquier bug en validación de cantidades o en transacción puede corromper el inventario.

#### Riesgo real
Pérdidas económicas, descuadres de inventario físico vs sistema, desconfianza del usuario.

#### Evidencia

```96:114:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\inventario\controller\inventario.controller.ts
  /**
   * Realiza un ajuste manual de stock (entrada, salida o ajuste) con auditoría.
   * @param dto Datos del ajuste manual.
   * @param userId ID del usuario responsable del ajuste.
   * @returns El registro de inventario actualizado.
   */
  @Post('ajustes-manuales')
  @RequirePermissions(PERMISSIONS.inventario.ajustar_stock)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un ajuste manual de stock con auditoría',
  })
  @ApiBody({ type: CreateMovimientoManualDto })
  @ApiResponse({
    status: 201,
    type: Inventario,
    description: 'Inventario actualizado y movimiento auditado',
  })
```

#### Impacto

- **Técnico**: Integridad referencial y numérica.
- **Negocio**: Directo.
- **UX**: Errores 409/400 si hay reglas correctas.
- **Escalabilidad**: Contención en filas calientes.
- **Mantenibilidad**: Requiere tests de propiedades.

#### Solución recomendada
Mantener transacciones con bloqueo a nivel de fila de inventario, pruebas de concurrencia, e idempotencia por clave de operación.

#### Prioridad recomendada
Inmediata (hardening continuo)

#### Riesgo de regresión
Alto

### [INVENTARIO-002] Filtrado por rol en listados delegado al servicio

#### Severidad
Media

#### Categoría
Autorización

#### Descripción
`findAll` usa `@GetUser('rol')` — coherente con JWT que expone `rol` como string — pero cualquier divergencia futura en el payload rompería filtros.

#### Riesgo real
Fuga o censura incorrecta de líneas de inventario.

#### Evidencia

```73:80:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\inventario\controller\inventario.controller.ts
  @Get()
  @RequirePermissions(PERMISSIONS.inventario.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.inventario, InventarioListQueryDto)
    query: InventarioListQueryDto,
    @GetUser('rol') userRole: string
  ): Promise<PaginatedResponseDto<Inventario>> {
    return this.inventarioService.findAll(query, userRole);
  }
```

#### Impacto

- **Técnico**: Consistencia JWT ↔ servicio.
- **Negocio**: Visibilidad por rol.
- **UX**: Listados vacíos erróneos.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Interfaz `AuthenticatedUser` compartida y tests de contrato del payload JWT.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (`inventario.types.ts` / servicios no contrastados exhaustivamente).

## Riesgos Potenciales Futuros

- Inventario particionado por ubicación con reglas de negocio más complejas (multi-centro).

## Deuda Técnica

- **Crítica**: Ninguna en controlador aislado.
- **Importante**: Cobertura de tests de carrera en ajustes.
- **Tolerable**: Ampliar documentación de códigos de error 409.

## Recomendaciones Estratégicas

- Métricas de ratio de ajustes manuales vs movimientos automáticos para detectar anomalías.

## Conclusión Final

El módulo **inventario** expone correctamente la **sensibilidad del dominio** con permisos y Swagger; el foco de riesgo real está en **servicio/transacciones**, no en el controlador superficial.
