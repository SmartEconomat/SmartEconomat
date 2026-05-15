# Auditoría Técnica Completa — Ubicación

## Resumen Ejecutivo

- **Estado general**: CRUD de ubicaciones bajo `/ubicacion` extendiendo `BaseController` con overrides que añaden permisos y Swagger.
- **Nivel de riesgo**: Medio (afecta inventario, transferencias y enlaces de usuario).
- **Principales problemas**: Herencia de `BaseController` puede ocultar endpoints «genéricos» si no se revisan overrides; filtrado por rol delegado al servicio vía `req.user?.rol`.
- **Principales fortalezas**: Reutilización de infraestructura común, permisos explícitos en cada override (`ubicaciones.*`).
- **Criticidad general**: Media-alta para logística.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Buena
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Buena

## Hallazgos

### [UBICACION-001] Prefijo singular `/ubicacion` vs convención plural del proyecto

#### Severidad
Baja

#### Categoría
Coherencia de API

#### Descripción
La mayoría de recursos usan plural (`/productos`, `/pedidos`), mientras ubicaciones usan singular `/ubicacion`, incrementando la carga cognitiva del cliente HTTP.

#### Riesgo real
Errores de routing en integraciones nuevas.

#### Evidencia

```32:33:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\ubicacion\controller\ubicacion.controller.ts
@Controller('ubicacion')
export class UbicacionController extends BaseController<
```

#### Impacto

- **Técnico**: Inconsistencia REST.
- **Negocio**: Bajo.
- **UX**: Ninguno directo.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Documentar como legacy intencional o introducir alias `/ubicaciones` con deprecación controlada.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Alto (si se renombra)

### [UBICACION-002] `findAll` depende de `req.user?.rol` sin validación adicional

#### Severidad
Media

#### Categoría
Autorización

#### Descripción
El listado delega el filtrado al servicio con el rol del JWT; si el rol falta, el comportamiento depende de defaults del servicio.

#### Riesgo real
Listados demasiado amplios o demasiado restrictivos según implementación.

#### Evidencia

```72:79:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\ubicacion\controller\ubicacion.controller.ts
  @Get()
  @RequirePermissions(PERMISSIONS.ubicaciones.listar)
  @ApiOperation({ summary: 'Obtener todas las ubicaciones' })
  override findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ) {
    return super.findAll(query, req);
  }
```

#### Impacto

- **Técnico**: Consistencia JWT ↔ servicio.
- **Negocio**: Visibilidad de ubicaciones internas.
- **UX**: Listados inesperados.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Tipar `req.user` y tests de servicio para `rol` ausente.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado.

## Riesgos Potenciales Futuros

- Soft delete de ubicaciones con inventario residual requiere reglas de negocio fuertes.

## Deuda Técnica

- **Crítica**: Ninguna.
- **Importante**: Clarificar semántica de listado por rol.
- **Tolerable**: Naming REST singular/plural.

## Recomendaciones Estratégicas

- Endpoint de validación «¿ubicación en uso?» antes de borrar, con métricas.

## Conclusión Final

El módulo **ubicacion** aprovecha bien la **herencia de controlador base** y mantiene permisos explícitos; los temas principales son **convención de rutas** y **comportamiento con rol ausente** en servicios.
