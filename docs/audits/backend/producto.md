# Auditoría Técnica Completa — Producto

## Resumen Ejecutivo

- **Estado general**: Módulo amplio del catálogo (`/productos` y subcontroladores de alérgenos/proveedor) con Swagger extensivo, filtros y operaciones de precio/historial.
- **Nivel de riesgo**: Medio-alto (datos maestros que afectan compras, inventario y producción).
- **Principales problemas**: Superficie API grande → mayor superficie de regresión; validación de EAN y reglas de negocio repartidas entre servicios.
- **Principales fortalezas**: Guards estándar, permisos granulares (incl. `generar_ean13`), uso de `SortableFields` y DTOs específicos por operación.
- **Criticidad general**: Máxima para el dominio catálogo.

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

### [PRODUCTO-001] Generación de EAN-13 como recurso sensible a abuso

#### Severidad
Media

#### Categoría
Seguridad / Abuso

#### Descripción
El endpoint de generación de EAN-13 está protegido por permiso dedicado, pero un cliente automatizado con ese permiso puede forzar muchas consultas de unicidad a base de datos.

#### Riesgo real
Carga en tabla de productos y posible agotamiento de espacio de códigos si no hay política de rate limit por usuario.

#### Evidencia

```62:71:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\producto\controller\producto.controller.ts
  @Get('generar-ean13')
  @RequirePermissions(PERMISSIONS.productos.generar_ean13)
  @ApiOperation({ summary: 'Generar un código EAN-13 único' })
  @ApiResponse({
    status: 200,
    description: 'docs.C_DIGO_GENERADO_CORRECTAMENTE',
  })
  async generarEan13(): Promise<{ codigo_barras: string }> {
    const codigo_barras = await this.productoService.generateUniqueEan13();
    return { codigo_barras };
  }
```

#### Impacto

- **Técnico**: Consultas repetidas.
- **Negocio**: Bajo directo.
- **UX**: Lentitud.
- **Escalabilidad**: Limitada sin throttling.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Throttling específico y/o batch de generación con cuota diaria.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

### [PRODUCTO-002] Múltiples controladores y dependencias circulares potenciales

#### Severidad
Media

#### Categoría
Mantenibilidad / Arquitectura

#### Descripción
El módulo concentra `ProductoController`, `ProductoProveedorController`, `ProductoAlergenoController` y servicios cruzados (`HistorialPrecio`); ya existe `forwardRef` en otros módulos hacia `ProductoService`, señal de acoplamiento.

#### Riesgo real
Regresiones en cascada y mayor coste de refactor.

#### Evidencia

Patrón observado en recepción:

```114:116:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\recepcion\service\recepcion-stock.service.ts
    @Inject(forwardRef(() => ProductoService))
    private readonly productoService: ProductoService,
```

#### Impacto

- **Técnico**: Ciclos de dependencias.
- **Negocio**: Tiempo de entrega de features.
- **UX**: Indirecto.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Extraer casos de uso (application services) delgados y reducir `forwardRef` mediante interfaces y eventos de dominio.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Alto

## Inconsistencias Frontend/Backend

El frontend mantiene `producto.types.ts` y endpoints de historial de precios en evolución; **se requiere** validación cruzada tras cambios de DTO — no ejecutada en profundidad en esta auditoría.

## Riesgos Potenciales Futuros

- Sincronización de enums (`TipoProducto`, `UnidadMedida`) con i18n del cliente.

## Deuda Técnica

- **Crítica**: Ninguna en un único archivo.
- **Importante**: Reducir acoplamiento circular.
- **Tolerable**: Consolidar rutas relacionadas bajo prefijos versionados si el API crece.

## Recomendaciones Estratégicas

- Pruebas de contrato OpenAPI generadas vs cliente TypeScript.

## Conclusión Final

El módulo **producto** es **robusto en permisos y documentación**, pero arrastra **complejidad y acoplamiento** típicos de un catálogo maestro central; conviene planificar modularización antes de que crezca más.
