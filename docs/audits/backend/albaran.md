# Auditoría Técnica Completa — Albarán

## Resumen Ejecutivo

- **Estado general**: Módulo REST estándar (`/albaranes`) con permisos granulares, integración con subida de documentos y acoplamiento con recepciones vía dominio de compras.
- **Nivel de riesgo**: Medio (documentos y numeración de albaranes son sensibles a fraude y errores de consistencia).
- **Principales problemas**: Superficie de archivos (upload) requiere revisión conjunta con `archivo` para límites MIME/tamaño; la coherencia transaccional con recepciones depende de otros servicios.
- **Principales fortalezas**: Uso consistente de `JwtAuthGuard` + `PermisosGuard`, Swagger en endpoints clave, `ParseUUIDv7Pipe` en rutas por ID donde aplica.
- **Criticidad general**: Media-alta en el flujo logístico global.

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

### [ALBARAN-001] Dependencia cruzada con recepciones y stock

#### Severidad
Media

#### Categoría
Coherencia de dominio / Transacciones

#### Descripción
Los albaranes se crean y enlazan en flujos de recepción masiva dentro de `RecepcionStockService`; el módulo `albaran` por sí solo no garantiza el cierre del ciclo pedido–recepción–inventario.

#### Riesgo real
Regresiones en recepción pueden dejar números de albarán generados o enlaces inconsistentes si no se mantiene la disciplina transaccional en el servicio de stock.

#### Evidencia

```197:215:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\recepcion\service\recepcion-stock.service.ts
      const nAlbaranFinal = await this.getOrGenerateAlbaranNumber(
        dto.nAlbaran,
        queryRunner.manager
      );

      let albaran = await queryRunner.manager.findOne(Albaran, {
        where: { nAlbaran: nAlbaranFinal },
      });

      if (!albaran) {
        albaran = queryRunner.manager.create(Albaran, {
          nAlbaran: nAlbaranFinal,
          fecha: savedRecepcion.fechaRecepcion,
```

#### Impacto

- **Técnico**: Acoplamiento fuerte entre módulos.
- **Negocio**: Riesgo de discrepancias documentales.
- **UX**: Errores difíciles de explicar al usuario final.
- **Escalabilidad**: Moderado.
- **Mantenibilidad**: Cambios requieren revisión en dos módulos.

#### Solución recomendada
Documentar el flujo canónico (recepción como dueño de la transacción) y mantener pruebas e2e que cubran creación de albarán + enlace `AlbaranPedidoRecepcion`; valorar extracción de un servicio de aplicación si el acoplamiento crece.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [ALBARAN-002] Subida de documento como superficie de abuso

#### Severidad
Media

#### Categoría
Seguridad

#### Descripción
El controlador expone subida de documentos protegida por permisos, pero la robustez frente a tipo MIME, tamaño y almacenamiento depende de `FileInterceptor` y del servicio (revisar en conjunto con `archivo`).

#### Riesgo real
Abuso de almacenamiento o uploads maliciosos si los límites no están reforzados a nivel de interceptor/red.

#### Evidencia

```69:74:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\albaran\controller\albaran.controller.ts
  @Post()
  @RequirePermissions(PERMISSIONS.albaranes.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAlbaranDto): Promise<Albaran> {
    return this.albaranService.create(dto);
  }
```

*(La ruta de upload aparece más abajo en el mismo controlador; auditar límites en `AlbaranService` + configuración Multer.)*

#### Impacto

- **Técnico**: Coste de almacenamiento y CPU.
- **Negocio**: Posible interrupción del servicio.
- **UX**: Lentitud o errores opacos.
- **Escalabilidad**: Cuellos de botella en I/O.
- **Mantenibilidad**: Baja.

#### Solución recomendada
Centralizar políticas de tamaño/MIME y escaneo en un solo lugar compartido con `archivo`, con rechazo explícito y métricas.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (`albaran.service.ts` / tipos frontend no contrastados línea a línea).

## Riesgos Potenciales Futuros

- Concurrencia en numeración de albarán bajo alta carga si la generación no está blindada a nivel de base de datos.

## Deuda Técnica

- **Crítica**: Ninguna en el propio listado de controlador revisado.
- **Importante**: Política de uploads compartida y probada.
- **Tolerable**: Ampliar Swagger en todas las rutas secundarias.

## Recomendaciones Estratégicas

- Mantener invariantes de numeración en transacción con bloqueo o restricción única en BD.
- Tests de integración que cubran upload + descarga firmada (si aplica).

## Conclusión Final

El módulo **albaran** cumple el patrón Nest del proyecto y se integra correctamente en la historia de recepción. El riesgo principal no está en el CRUD aislado sino en **consistencia transaccional y seguridad de ficheros** compartida con otros módulos.
