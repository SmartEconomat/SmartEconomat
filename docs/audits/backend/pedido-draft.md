# Auditoría Técnica Completa — Pedido draft

## Resumen Ejecutivo

- **Estado general**: Módulo de borradores seguros bajo `POST/GET/DELETE /pedido/draft` vinculado al usuario autenticado y permiso `pedidos.crear`.
- **Nivel de riesgo**: Bajo-medio (datos temporales sensibles de negocio en borrador).
- **Principales problemas**: La persistencia (Redis/DB) y TTL deben revisarse en `PedidoDraftService` para evitar fugas entre entornos; no auditado aquí en profundidad.
- **Principales fortalezas**: Uso consistente de `req.user.id` en todas las operaciones; no expone borradores cruzados entre usuarios en el controlador.
- **Criticidad general**: Media para UX de creación de pedido.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Buena
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [PEDIDO-DRAFT-001] Permiso de creación de pedido también autoriza borrador

#### Severidad
Baja

#### Categoría
Autorización / Modelo mental

#### Descripción
Todas las rutas usan `PERMISSIONS.pedidos.crear`, incluida la lectura del borrador; si el negocio desea que solo ciertos roles lean borradores ajenos en futuras extensiones, el permiso actual es amplio.

#### Riesgo real
Bajo hoy porque el servicio filtra por `req.user.id`; riesgo futuro si se añaden endpoints administrativos sin revisión.

#### Evidencia

```40:69:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\pedido-draft\controller\pedido-draft.controller.ts
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.OK)
  ...
  saveDraft(
    @Body() dto: UpsertPedidoDraftDto,
    @Request() req: { user: { id: string } }
  ): Promise<PedidoDraftRecord> {
    return this.pedidoDraftService.upsertDraft(req.user.id, dto);
  }
...
  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
```

#### Impacto

- **Técnico**: Permiso reutilizado.
- **Negocio**: Bajo.
- **UX**: Ninguno.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Medio a largo plazo.

#### Solución recomendada
Si el modelo RBAC crece, introducir `pedidos.borrador` explícito.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Bajo

### [PEDIDO-DRAFT-002] Ausencia de límites de tamaño visibles en el controlador

#### Severidad
Media

#### Categoría
Resiliencia / Abuso

#### Descripción
El DTO de borrador puede crecer (líneas, notas); el controlador no impone límites; deben estar en DTO (`MaxLength`, `ArrayMaxSize`) o en servicio.

#### Riesgo real
Payloads grandes que degraden Redis/DB o serialización.

#### Evidencia

El controlador solo recibe `@Body() dto: UpsertPedidoDraftDto` sin `@UseInterceptors` de tamaño; validación debe estar en DTO/servicio (revisar `upsert-pedido-draft.dto.ts`).

#### Impacto

- **Técnico**: Memoria y CPU.
- **Negocio**: Bajo.
- **UX**: Timeouts.
- **Escalabilidad**: Limitada.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Validar tamaño máximo del JSON en `ValidationPipe` global + límites específicos en DTO.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

El frontend incluye `pedidoDraft.service.ts`; la ruta base debe coincidir con `pedido/draft` — no se detectaron discrepancias en el alcance revisado.

## Riesgos Potenciales Futuros

- Migración de almacenamiento de borrador entre Redis y PostgreSQL sin migración de datos.

## Deuda Técnica

- **Crítica**: Ninguna en controlador.
- **Importante**: Límites de payload del borrador.
- **Tolerable**: Documentar semántica de `clearDraft`.

## Recomendaciones Estratégicas

- Encriptación at-rest si los borradores pueden contener PII sensible.

## Conclusión Final

El módulo **pedido-draft** es **acotado y seguro en el controlador** al anclar siempre el borrador al `userId` del token; el endurecimiento pendiente es principalmente de **cuotas y tamaño de payload**.
