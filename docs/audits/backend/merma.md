# Auditoría Técnica Completa — Merma

## Resumen Ejecutivo

- **Estado general**: Módulo activo bajo `/merma` con creación manual, reporting desde producción, KPIs y estadísticas con validación de rangos de fechas.
- **Nivel de riesgo**: Medio-alto (impacto directo en stock y costes).
- **Principales problemas**: Superficie DTO reciente (stats/query) debe mantenerse alineada con frontend; lógica de negocio en `MermaService` requiere transacciones con inventario.
- **Principales fortalezas**: Swagger en operaciones de creación, `validateDateRange` en endpoints agregados, permisos separados (`crear`, `stats`).
- **Criticidad general**: Alta para control de pérdidas.

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

### [MERMA-001] Doble vía de creación (manual vs producción)

#### Severidad
Media

#### Categoría
Coherencia de dominio

#### Descripción
Existen dos endpoints de alta (`POST /` y `POST /produccion/reportar`) con reglas distintas; el riesgo es divergencia de validación o de motivos/tipos entre ambos caminos.

#### Riesgo real
Inconsistencias contables o de stock si una ruta endurece validación y la otra no.

#### Evidencia

```56:98:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\merma\controller\merma.controller.ts
  @Post()
  @RequirePermissions(PERMISSIONS.merma.crear)
  @HttpCode(HttpStatus.CREATED)
  ...
  create(
    @Body() dto: CreateMermaDto,
    @GetUser('id') userId: string
  ): Promise<Merma> {
    return this.mermaService.create(dto, userId);
  }
...
  @Post('produccion/reportar')
  @RequirePermissions(PERMISSIONS.merma.crear)
  @HttpCode(HttpStatus.CREATED)
  ...
  createFromProduccion(
    @Body() dto: CreateMermaProduccionDto,
    @GetUser('id') userId: string
  ): Promise<Merma> {
    return this.mermaService.createFromProduccion(dto, userId);
  }
```

#### Impacto

- **Técnico**: Duplicación de reglas.
- **Negocio**: KPIs sesgados.
- **UX**: Comportamientos distintos según flujo.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Extraer validadores compartidos (cantidades, motivos, permisos de lote) y tabla de matriz de casos cubierta por tests.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [MERMA-002] Consultas agregadas sensibles a índices

#### Severidad
Media

#### Categoría
Performance

#### Descripción
Endpoints de KPIs y estadísticas con filtros temporales pueden degradar la base de datos sin índices adecuados sobre columnas de fecha y FKs.

#### Riesgo real
Timeouts en dashboards de mermas en centros con alto volumen.

#### Evidencia

```106:115:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\merma\controller\merma.controller.ts
  @Get('kpis')
  @RequirePermissions(PERMISSIONS.merma.stats)
  @ApiOperation({
    summary:
      'Obtener KPIs de merma (cantidad perdida, referencia y porcentaje) con filtros temporales',
  })
  @ApiResponse({ status: 200 })
  getKpis(@Query() query: MermaKpiQueryDto): Promise<MermaKpiResponse> {
    validateDateRange(query.startDate, query.endDate, 365, 'Mermas');
    return this.mermaService.getKpis(query);
  }
```

#### Impacto

- **Técnico**: Consultas lentas.
- **Negocio**: Indisponibilidad parcial.
- **UX**: Spinners largos.
- **Escalabilidad**: Limitada.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Revisar planes de consulta y migraciones de índices; materialized views si el volumen crece.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

En el repositorio existen `merma.service.ts` y `merma.types.ts` en el frontend en evolución; **se recomienda** validación cruzada tras cada cambio de DTO (`MermaQueryDto`, stats) — no ejecutada en esta auditoría puntual.

## Riesgos Potenciales Futuros

- Nuevos `MotivoMerma` sin propagación a i18n y frontend.

## Deuda Técnica

- **Crítica**: Ninguna en controlador.
- **Importante**: Unificación de reglas entre rutas de creación.
- **Tolerable**: Ampliar límites de `validateDateRange` documentados en API.

## Recomendaciones Estratégicas

- Exportar métricas de merma a data warehouse para analítica sin golpear OLTP.

## Conclusión Final

El módulo **merma** está bien encapsulado en API y permisos; el foco de mejora es **consistencia entre flujos de alta** y **rendimiento de agregaciones**.
