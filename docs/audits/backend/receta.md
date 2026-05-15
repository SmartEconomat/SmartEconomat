# Auditoría Técnica Completa — Receta

## Resumen Ejecutivo

- **Estado general**: Módulo amplio de recetas y operaciones asociadas (PDF, costes, duplicados) bajo `/recetas` con `JwtAuthGuard`, `RolesGuard` y `PermisosGuard`.
- **Nivel de riesgo**: Medio-alto (producción, costes y escandallos que alimentan pedidos).
- **Principales problemos**: Exportaciones PDF con límites (`MAX_RECIPES_PDF_EXPORT`) deben mantenerse alineadas con el cliente para evitar timeouts; lógica de negocio repartida entre `RecetaService`, `RecetaPdfService` y `ProduccionService`.
- **Principales fortalezas**: Triple guard en controlador principal, DTOs específicos por operación, uso de `ParseUUIDv7Pipe` en rutas por id.
- **Criticidad general**: Alta para cocina y compras indirectas.

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

### [RECETA-001] Superficie PDF/Export con riesgo de DoS interno

#### Severidad
Media

#### Categoría
Performance / Seguridad

#### Descripción
Las exportaciones masivas de PDFs deben acotarse; existe constante `MAX_RECIPES_PDF_EXPORT` en el controlador, lo cual es positivo, pero cualquier endpoint adicional sin límite análogo sería riesgo.

#### Riesgo real
Picos de CPU/memoria al generar PDFs concurrentes.

#### Evidencia

```46:46:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\receta\controller\receta.controller.ts
const MAX_RECIPES_PDF_EXPORT = 50;
```

*(El resto del método debe validar el tamaño de la lista respecto a esta constante — mantener tests de regresión.)*

#### Impacto

- **Técnico**: Uso de CPU.
- **Negocio**: Indisponibilidad transitoria.
- **UX**: Timeouts en descarga.
- **Escalabilidad**: Limitada sin colas.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Jobs asíncronos con enlace de descarga temporal para lotes grandes.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [RECETA-002] RolesGuard adicional incrementa rigidez de despliegue

#### Severidad
Baja

#### Categoría
Autorización / Operación

#### Descripción
`RecetaController` aplica `RolesGuard` además de permisos; si se añaden roles personalizados sin mapeo en guards, puede bloquear acceso aunque el permiso exista.

#### Riesgo real
Tickets de acceso denegado en despliegues con RBAC avanzado.

#### Evidencia

```51:53:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\receta\controller\receta.controller.ts
@ApiTags('docs.TAG_RECETAS')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Controller('recetas')
```

#### Impacto

- **Técnico**: Doble verificación rol+permiso.
- **Negocio**: Rigidez operativa.
- **UX**: 403 inesperados.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Documentar matriz rol↔permiso para recetas y tests que cubran roles no-ADMIN con permisos delegados.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

El frontend mantiene `receta.types.ts` y helpers de formulario; los enums deben seguir la fuente de verdad del backend — revisión puntual recomendada tras cambios en `receta.enums.ts`.

## Riesgos Potenciales Futuros

- Divergencia entre coste estimado en receta y PMP real de productos.

## Deuda Técnica

- **Crítica**: Ninguna en el fragmento auditado.
- **Importante**: Estrategia de generación PDF bajo carga.
- **Tolerable**: Consolidar tags Swagger (`docs.TAG_RECETAS`) con claves i18n reales.

## Recomendaciones Estratégicas

- Versionar API de recetas si se introduce breaking change en ingredientes.

## Conclusión Final

El módulo **receta** combina **seguridad en capas** y **operaciones pesadas** (PDF); el equilibrio entre `RolesGuard` y permisos finos debe vigilarse para no bloquear escenarios legítimos de delegación.
