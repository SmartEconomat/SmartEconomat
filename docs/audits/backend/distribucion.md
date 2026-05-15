# Auditoría Técnica Completa — Distribución

## Resumen Ejecutivo

- **Estado general**: API REST bajo `/distribuciones` para ciclo de distribución de pedidos de usuario, con guards estándar y filtrado por rol en listados y detalle.
- **Nivel de riesgo**: Medio (operaciones logísticas y posibles condiciones de carrera al reservar/recoger stock virtual).
- **Principales problemas**: La profundidad de reglas de negocio no se auditó línea a línea en `DistribucionService`; el riesgo principal es transaccional/concurrencia.
- **Principales fortalezas**: Uso homogéneo de `JwtAuthGuard` + `PermisosGuard`, Swagger en operaciones principales, `ParseUUIDv7Pipe` en rutas por id.
- **Criticidad general**: Media en la cadena economato–aula.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [DISTRIBUCION-001] Filtrado por rol delegado al servicio sin visibilidad en controlador

#### Severidad
Media

#### Categoría
Autorización / Consistencia

#### Descripción
Los métodos pasan `req.user?.rol` al servicio; si el payload JWT no incluye rol o está mal formado, el filtrado podría degradarse. Depende de que `JwtStrategy` siempre rellene `rol` como string.

#### Riesgo real
Fuga de información entre perfiles si el servicio interpreta `undefined` como «sin restricción».

#### Evidencia

```47:55:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\distribucion\controller\distribucion.controller.ts
  @Get()
  @RequirePermissions(PERMISSIONS.distribuciones.listar)
  @ApiOperation({ summary: 'Listar distribuciones' })
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ) {
    return this.distribucionService.findAll(query, req.user?.rol);
  }
```

#### Impacto

- **Técnico**: Posible bypass de vistas filtradas si `rol` falta.
- **Negocio**: Confidencialidad entre centros/roles.
- **UX**: Listados inesperados.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Validar en guard o interceptor que `req.user.rol` exista para rutas que lo requieren; tests de servicio con `rol` ausente.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [DISTRIBUCION-002] Posible condición de carrera en creación/cancelación

#### Severidad
Media

#### Categoría
Concurrencia

#### Descripción
Sin evidencia en controlador de idempotencia; operaciones concurrentes de distribución del mismo pedido de usuario podrían requerir bloqueo optimista en entidad.

#### Riesgo real
Duplicados o estados imposibles bajo doble clic o clientes móviles con retry.

#### Evidencia

No hay marcas de idempotencia en el controlador revisado; la mitigación debe estar en servicio/entidad (revisar `DistribucionService` y migraciones de unicidad).

#### Impacto

- **Técnico**: Integridad bajo concurrencia.
- **Negocio**: Doble distribución.
- **UX**: Errores intermitentes.
- **Escalabilidad**: Aumenta con usuarios concurrentes.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Claves únicas parciales, version column, o `Idempotency-Key` en POST/PATCH documentado.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

El frontend incluye `distribucion.service.ts` y `distribucion.types.ts`; no se detectaron discrepancias en el alcance revisado (sin diff de tipos ejecutado).

## Riesgos Potenciales Futuros

- Expansión de reglas de negocio sin tests de propiedades sobre máquina de estados.

## Deuda Técnica

- **Crítica**: Ninguna verificada en controlador.
- **Importante**: Confirmar transacciones e idempotencia en servicio.
- **Tolerable**: Ampliar cobertura Swagger en subrutas.

## Recomendaciones Estratégicas

- Pruebas e2e que simulen dos clientes concurrentes sobre la misma distribución.

## Conclusión Final

El módulo **distribucion** sigue buenas prácticas de API y seguridad perimetral; la auditoría profunda debe centrarse en **servicio y modelo de datos** por riesgo de concurrencia, no en el controlador.
