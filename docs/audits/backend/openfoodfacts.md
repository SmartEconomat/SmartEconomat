# Auditoría Técnica Completa — OpenFoodFacts

## Resumen Ejecutivo

- **Estado general**: Módulo de integración externa bajo `/openfoodfacts` con validación de código de barras y permisos alternativos (`RequireAnyPermission`).
- **Nivel de riesgo**: Medio (dependencia de red, disponibilidad y posible filtrado de datos de terceros).
- **Principales problemas**: Latencia y fallos en cadena si la API externa degrada; posible abuso como proxy HTTP si no hay timeout/caché en servicio.
- **Principales fortalezas**: Validación explícita con `isValidBarcode` y `BadRequestException` traducida vía i18n.
- **Criticidad general**: Baja respecto al núcleo contable, media para UX de recepción/alta de producto.

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

### [OPENFOODFACTS-001] Dependencia de servicio externo sin contrato de SLA en el controlador

#### Severidad
Media

#### Categoría
Resiliencia / Disponibilidad

#### Descripción
El controlador delega en `OpenFoodFactsService`; no hay evidencia en el controlador de circuit breaker, colas o fallback local.

#### Riesgo real
Degradación de flujos de recepción/alta de producto si OpenFoodFacts está lento o bloquea IPs.

#### Evidencia

```66:79:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\openfoodfacts\controller\openfoodfacts.controller.ts
  async searchByBarcode(
    @Param('codigoBarras') codigoBarras: string
  ): Promise<OffProductResponseDto | null> {
    const trimmedBarcode = codigoBarras.trim();

    if (!trimmedBarcode) {
      return null;
    }

    if (!isValidBarcode(trimmedBarcode)) {
      throw new BadRequestException(I18nHelper.getError('BARCODE_INVALID'));
    }

    return this.openFoodFactsService.searchByBarcode(trimmedBarcode);
  }
```

#### Impacto

- **Técnico**: Timeouts en cadena de Nest.
- **Negocio**: Parada parcial de recepción asistida.
- **UX**: Errores intermitentes.
- **Escalabilidad**: Límite de salidas HTTP concurrentes.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Timeouts agresivos, caché Redis por EAN, y degradación controlada (mensaje i18n claro).

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

### [OPENFOODFACTS-002] Permisos «any» amplían superficie de llamadas

#### Severidad
Baja

#### Categoría
Seguridad / Gobierno

#### Descripción
`RequireAnyPermission` une permisos de productos, inventario y recepciones; es razonable para UX pero incrementa quién puede actuar como cliente HTTP hacia el exterior.

#### Riesgo real
Mayor volumen de tráfico saliente automatizable.

#### Evidencia

```46:53:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\openfoodfacts\controller\openfoodfacts.controller.ts
  @Get('producto/:codigoBarras')
  @RequireAnyPermission(
    PERMISSIONS.productos.listar,
    PERMISSIONS.productos.ver,
    PERMISSIONS.inventario.listar,
    PERMISSIONS.recepciones.listar,
    PERMISSIONS.recepciones.crear
  )
```

#### Impacto

- **Técnico**: Coste de red.
- **Negocio**: Bajo.
- **UX**: Ninguno.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Métricas por usuario y throttling específico del módulo.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado.

## Riesgos Potenciales Futuros

- Cambios en el esquema JSON de OpenFoodFacts que rompan el mapper del DTO de respuesta.

## Deuda Técnica

- **Crítica**: Ninguna en controlador.
- **Importante**: Resiliencia/timeouts en servicio.
- **Tolerable**: Tests con HTTP mock.

## Recomendaciones Estratégicas

- Cache local de productos frecuentes por centro.

## Conclusión Final

El módulo **openfoodfacts** está **bien acotado** y valida entrada; el riesgo dominante es **operacional (red externa)**, no de permisos en el controlador.
