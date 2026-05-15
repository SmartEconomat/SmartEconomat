# Auditoría Técnica Completa — Recepción

## Resumen Ejecutivo

- **Estado general**: Módulo crítico de recepciones bajo `/recepciones` con procesamiento de stock, PDFs y etiquetas i18n de estado; transacciones extensas en `RecepcionStockService`.
- **Nivel de riesgo**: Muy alto (inventario, pedidos, albaranes, incidencias).
- **Principales problemas**: El campo `usuarioId` del DTO puede **suplantar al operador** registrado en la recepción; el controlador solo rellena si viene vacío, pero no fuerza al usuario del token.
- **Principales fortalezas**: Uso de `QueryRunner` con transacciones en `procesarRecepcionMasiva` y `procesarRecepcion`; validación de líneas contra pedidos permitidos.
- **Criticidad general**: Máxima.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable (con hallazgo de auditoría)
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Aceptable

## Hallazgos

### [RECEPCION-001] `usuarioId` del cuerpo prevalece sobre el usuario autenticado

#### Severidad
Alta

#### Categoría
Seguridad / Auditoría

#### Descripción
El controlador hace `dto.usuarioId = dto.usuarioId || userId`, por lo que un cliente puede fijar `usuarioId` arbitrario si pasa validación de string. El servicio `procesarRecepcion` carga el usuario por `dto.usuarioId` y construye la recepción con ese id.

#### Riesgo real
Un usuario con permiso de crear recepciones puede **atribuir la operación a otro usuario**, corrompiendo auditoría y reportes de responsabilidad, aunque la lógica de stock siga ejecutándose.

#### Evidencia

```74:83:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\recepcion\controller\recepcion.controller.ts
  @Post()
  @RequirePermissions(PERMISSIONS.recepciones.crear)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecepcionDto,
    @Req() req: { user: { id: string } }
  ): Promise<RecepcionResultadoDto> {
    const userId = req.user.id;
    dto.usuarioId = dto.usuarioId || userId;
    return this.recepcionStockService.procesarRecepcion(dto);
  }
```

```308:315:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\recepcion\dto\create-recepcion.dto.ts
  @ApiProperty({
    description: 'docs.ID_DEL_USUARIO_OPERARIO_USUALMENTE_SACAD',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  @Validate(NotDraftConstraint)
  usuarioId?: string;
```

```502:507:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\recepcion\service\recepcion-stock.service.ts
  async procesarRecepcion(
    dto: CreateRecepcionDto
  ): Promise<RecepcionResultadoDto> {
    const usuario = await this.dataSource.manager.findOne(Usuario, {
      where: { id: dto.usuarioId },
    });
```

#### Impacto

- **Técnico**: Auditoría no fiable.
- **Negocio**: Responsabilidad legal y operativa.
- **UX**: Confianza rota si se detecta.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Forzar `dto.usuarioId = userId` salvo rol elevado con permiso explícito «impersonar»; o validar igualdad con el token y rechazar discrepancias.

#### Prioridad recomendada
Inmediata

#### Riesgo de regresión
Medio

### [RECEPCION-002] Complejidad y tamaño del servicio de stock

#### Severidad
Media

#### Categoría
Mantenibilidad

#### Descripción
`recepcion-stock.service.ts` concentra lógica de negocio de gran tamaño (múltiples flujos), elevando el coste de revisión y riesgo de regresión.

#### Riesgo real
Bugs sutiles en ramas menos usadas (productos nuevos, incidencias, historial de precios).

#### Evidencia

Archivo `recepcion-stock.service.ts` supera ampliamente las ~160 líneas iniciales y contiene múltiples transacciones (patrón `queryRunner` repetido).

#### Impacto

- **Técnico**: Complejidad ciclomática alta.
- **Negocio**: Tiempo de corrección de incidencias.
- **UX**: Errores intermitentes.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Dividir en servicios de aplicación por caso de uso (`RecepcionMasivaService`, `RecepcionPedidoCerradoService`, …) con interfaces claras.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Alto

## Inconsistencias Frontend/Backend

El DTO expone `usuarioId` opcional mientras el frontend podría asumir siempre el usuario de sesión; **alinear** eliminando el campo del contrato público o documentando impersonación.

## Riesgos Potenciales Futuros

- Doble recepción concurrente del mismo pedido sin idempotencia a nivel HTTP.

## Deuda Técnica

- **Crítica**: Suplantación de `usuarioId` en recepción estándar.
- **Importante**: Modularización de `RecepcionStockService`.
- **Tolerable**: Reducir DTO gigante `CreateRecepcionDto` en sub-DTOs versionados.

## Recomendaciones Estratégicas

- Idempotency-Key por recepción y trazas correlacionadas (`X-Request-Id`).

## Conclusión Final

El módulo **recepción** tiene **transacciones serias** y buen aislamiento de permisos, pero el hallazgo **RECEPCION-001** es un **defecto de auditoría/autoría** explícito en código y debe tratarse como prioridad.
