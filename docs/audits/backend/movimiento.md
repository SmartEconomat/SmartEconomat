# Auditoría Técnica Completa — Movimiento

## Resumen Ejecutivo

- **Estado general**: API de trazabilidad bajo `/movimientos` con listados paginados, historial y operaciones de mantenimiento; creación directa protegida por permiso de ajuste de stock.
- **Nivel de riesgo**: Medio (auditoría y posible suplantación si el DTO permite `usuario` arbitrario).
- **Principales problemas**: `CreateMovimientoDto` permite `usuario` opcional; el controlador `create` no inyecta el usuario autenticado, confiando en el cuerpo.
- **Principales fortalezas**: `validateDateRange` en listados, permisos dedicados para listar movimientos vs ajustar inventario.
- **Criticidad general**: Media-alta para compliance.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Aceptable (servicio usa `any` en `log`)
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [MOVIMIENTO-001] Creación HTTP de movimiento sin amarre obligatorio al usuario del token

#### Severidad
Alta

#### Categoría
Seguridad / Auditoría

#### Descripción
El endpoint `POST /movimientos` expone `movimientoService.create(dto)` sin pasar `userId` del JWT; el DTO incluye `usuario` opcional, permitiendo atribuir la acción a otro UUID.

#### Riesgo real
Manipulación de huella de auditoría por un cliente malicioso con permiso `inventario.ajustar_stock`.

#### Evidencia

```50:69:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\movimiento\controller\movimiento.controller.ts
  @Post()
  @RequirePermissions(PERMISSIONS.inventario.ajustar_stock)
  @ApiOperation({
    summary: 'Crear un nuevo movimiento',
    description: 'docs.SOLO_ADMIN_Y_PROFESORES_PUEDEN',
  })
  ...
  create(@Body() dto: CreateMovimientoDto) {
    return this.movimientoService.create(dto);
  }
```

```125:131:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\movimiento\dto\create-movimiento.dto.ts
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  @IsOptional()
  usuario?: string;
```

#### Impacto

- **Técnico**: Integridad de auditoría comprometida.
- **Negocio**: Incumplimiento de trazabilidad.
- **UX**: Bajo directo.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Ignorar `dto.usuario` en API pública y fijar siempre `usuario = req.user.id` salvo rol elevado con justificación documentada; o eliminar el campo del DTO expuesto.

#### Prioridad recomendada
Inmediata

#### Riesgo de regresión
Medio

### [MOVIMIENTO-002] Uso de `any` en helper `log` del servicio

#### Severidad
Baja

#### Categoría
Tipado

#### Descripción
El método `log` acepta `before?: any` y `after?: any`, debilitando garantías de serialización JSON.

#### Riesgo real
Objetos no serializables o ciclos inadvertidos.

#### Evidencia

```41:48:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\movimiento\service\movimiento.service.ts
  async log(
    params: {
      entity: string;
      entityId: string;
      action: AccionMovimiento;
      description?: string;
      before?: any;
      after?: any;
```

#### Impacto

- **Técnico**: Riesgo runtime.
- **Negocio**: Bajo.
- **UX**: Ninguno.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Sustituir por `unknown` + normalizador o `Record<string, unknown>` con tamaño máximo.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (`movimiento.service.ts` en frontend no contrastado con `CreateMovimientoDto`).

## Riesgos Potenciales Futuros

- Crecimiento del volumen de movimientos sin partición/archivado.

## Deuda Técnica

- **Crítica**: Atribución de usuario en `POST /movimientos`.
- **Importante**: Tipado de snapshots en `log`.
- **Tolerable**: Documentar semántica de `idempotenciaKey` en OpenAPI.

## Recomendaciones Estratégicas

- Pipeline de inmutabilidad: append-only log con hash encadenado para entornos regulados.

## Conclusión Final

El módulo **movimiento** es central para la **trazabilidad**; el hallazgo más grave es la **posible suplantación del actor** en creación vía API si no se corrige en controlador/servicio.
