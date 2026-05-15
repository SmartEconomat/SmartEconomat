# Auditoría Técnica Completa — Export

## Resumen Ejecutivo

- **Estado general**: Módulo transversal de exportación (`/export/*`) a Excel/PDF con permisos por dominio y validación de rangos de fechas en endpoints sensibles.
- **Nivel de riesgo**: Medio (exfiltración de datos masivos, consumo de CPU/memoria).
- **Principales problemas**: Uso de `Response<any, ...>` en firmas Swagger; la carga real depende de `streamQueryToExcel` (streaming parcialmente implementado).
- **Principales fortalezas**: Separación por recurso, `validateDateRange` en exportaciones temporales, guards estándar.
- **Criticidad general**: Media-alta por naturaleza de los datos exportados.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Aceptable
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [EXPORT-001] Tipos laxos en respuestas Express (`Response<any, ...>`)

#### Severidad
Baja

#### Categoría
Tipado / Calidad

#### Descripción
Los métodos de exportación usan `Response` genérico con `any`, lo que debilita el contrato interno y dificulta refactors.

#### Riesgo real
Errores de cabeceras o cuerpo no detectados en compilación.

#### Evidencia

```46:57:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\export\controller\export.controller.ts
  @Get('productos/xlsx')
  @RequirePermissions(PERMISSIONS.productos.listar)
  async exportProductos(
    @Query() query: ExportProductoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="productos.xlsx"'
    );
    await this.exportService.streamProductosToExcel(query, res);
  }
```

*(El tipo importado `Response` desde `express` suele ser `Response<any, Record<string, any>>` en el código base.)*

#### Impacto

- **Técnico**: Menor rigurosidad.
- **Negocio**: Ninguno directo.
- **UX**: Ninguno.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Usar `Response` sin genéricos o alias `type ExpressRes = Response;` y documentar que no hay JSON envelope en estas rutas.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Bajo

### [EXPORT-002] Superficie de exfiltración acumulada

#### Severidad
Media

#### Categoría
Seguridad / Gobierno de datos

#### Descripción
Múltiples endpoints permiten descargar datasets completos con solo el permiso de «listar» del recurso correspondiente, sin cuotas por usuario visibles en el controlador.

#### Riesgo real
Un usuario comprometido con permisos de listado puede extraer grandes volúmenes rápidamente.

#### Evidencia

```28:33:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\export\controller\export.controller.ts
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('export')
export class ExportController {
  /**
   * Construye la instancia configurada.
   * @undefined {ExportService} exportService - Entrada efectiva esperada por el contrato.
   */
```

#### Impacto

- **Técnico**: Picos de CPU/IO.
- **Negocio**: Exposición de datos.
- **UX**: Lentitud global.
- **Escalabilidad**: Limitada sin colas.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Permisos dedicados `*.exportar`, cuotas diarias, o jobs asíncronos con enlace firmado temporal.

#### Prioridad recomendada
Alta (enterprise)

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (el cliente debe usar `blob`/`arrayBuffer` en lugar del envelope JSON estándar).

## Riesgos Potenciales Futuros

- Exportaciones PDF grandes sin límites de tiempo en worker dedicado.

## Deuda Técnica

- **Crítica**: Ninguna en controlador.
- **Importante**: Permisos/cuotas específicas de exportación.
- **Tolerable**: Tipado de `Response`.

## Recomendaciones Estratégicas

- Registrar auditoría de exportaciones (quién, cuándo, filtros) en tabla o log estructurado.

## Conclusión Final

El módulo **export** está bien encapsulado y usa **streaming** en servicio; el siguiente escalón enterprise es **gobierno de permisos y cuotas** más allá del simple «listar».
