# Auditoría Técnica Completa — Pedido

## Resumen Ejecutivo

- **Estado general**: Módulo grande del dominio de compras: pedidos a proveedor, pedidos de usuario, lotes de compra y generación desde recetas; controladores con `ParseUUIDv7Pipe`, validación de fechas y etiquetas i18n de estado.
- **Nivel de riesgo**: Alto (dinero, stock comprometido, fechas de entrega, cancelaciones).
- **Principales problemas**: Complejidad inherente y múltiples controladores; riesgo de regresión en máquina de estados y consolidación de líneas.
- **Principales fortalezas**: Uso explícito de `QueryRunner` con transacciones en `PedidoService` para creación/actualización crítica.
- **Criticidad general**: Máxima para el economato.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Aceptable

## Hallazgos

### [PEDIDO-001] Altas mutables sin idempotencia en capa HTTP

#### Severidad
Media

#### Categoría
Resiliencia / Concurrencia

#### Descripción
Los endpoints `POST /pedidos` y `POST /pedidos/from-recipes` delegan en servicios sin evidencia en el controlador de clave de idempotencia ni deduplicación; reintentos de red pueden duplicar pedidos si el cliente no implementa protección.

#### Riesgo real
Doble pedido a proveedor en escenarios de timeout con retry agresivo.

#### Evidencia

```72:118:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\pedido\controller\pedido.controller.ts
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  create(
    @Body() dto: CreatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.pedidoService
      .create(dto, userId)
      .then((pedido) => this.withPedidoLabels(pedido));
  }
...
  @Post('from-recipes')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  createFromRecipes(
    @Body() dto: GeneratePedidoFromRecetasDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.recetaToPedidoService
      .generateFromRecetas(dto, userId)
      .then((pedido) => this.withPedidoLabels(pedido));
  }
```

#### Impacto

- **Técnico**: Duplicados o estados divergentes.
- **Negocio**: Sobrepedido y coste.
- **UX**: Confusión y cancelaciones manuales.
- **Escalabilidad**: Mayor carga correctiva.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Cabecera `Idempotency-Key` persistida con ventana temporal, o campo opcional en DTO validado contra tabla única por usuario.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Medio

### [PEDIDO-002] Complejidad y múltiples fuentes de verdad de estado

#### Severidad
Media

#### Categoría
Mantenibilidad / Negocio

#### Descripción
Conviven `EstadoPedido`, triggers, posible máquina de estados en archivos nuevos (`pedido.state-machine.ts` en el árbol de trabajo) y servicios de consolidación; el riesgo es divergencia si no hay pruebas de tabla de transición única.

#### Riesgo real
Estados imposibles o transiciones no cubiertas en UI.

#### Evidencia

El controlador añade claves de etiqueta i18n en cliente:

```42:54:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\pedido\controller\pedido.controller.ts
  private withPedidoLabels<T extends { estado?: string | null }>(
    pedido: T
  ): T & {
    estadoLabelKey?: string;
  } {
    if (!pedido?.estado) {
      return pedido;
    }

    return {
      ...pedido,
      estadoLabelKey: `enum.pedidoEstado.${String(pedido.estado).toUpperCase()}`,
    };
  }
```

*(La lógica de estado principal reside en servicios/repositorio; requiere auditoría continua.)*

#### Impacto

- **Técnico**: Regresiones difíciles de rastrear.
- **Negocio**: Pedidos bloqueados o mal facturados.
- **UX**: Estados confusos.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Centralizar transiciones en un solo módulo de dominio con tests de propiedades y trazas en logs estructurados.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Alto

## Inconsistencias Frontend/Backend

El frontend mantiene `pedido.types.ts` y `pedido.service.ts` en evolución; **cualquier** cambio en `UpdatePedidoDto` o enums debe sincronizarse — no verificado exhaustivamente en esta pasada.

## Riesgos Potenciales Futuros

- Idempotencia en `POST /pedidos` y generación desde recetas bajo reintentos de red.

## Deuda Técnica

- **Crítica**: Ninguna aislada en un único archivo.
- **Importante**: Consolidar documentación de estados y transiciones.
- **Tolerable**: Reducir duplicación de helpers de etiquetas entre módulos similares (recepción, incidencia).

## Recomendaciones Estratégicas

- Pruebas e2e de pedido completo: creación → recepción → cierre de estado.

## Conclusión Final

El módulo **pedido** muestra **madurez transaccional** en el código revisado; el principal riesgo futuro es la **complejidad del modelo de estados**, que debe seguir bajo disciplina de tests y una sola fuente de verdad.
