# Auditoría Técnica Completa — Incidencia

## Resumen Ejecutivo

- **Estado general**: Controlador rico bajo `/incidencias` con etiquetas i18n de estado, filtros de fecha y propagación de rol a servicio para vistas filtradas.
- **Nivel de riesgo**: Medio (resolución de incidencias impacta pedidos, recepciones y reclamaciones).
- **Principales problemas**: Complejidad de DTOs duplicados/similares (`ResolverIncidenciaDto` vs `ResolveIncidenciaDto`) puede inducir errores de cliente; máquina de estados debe vivir en servicio.
- **Principales fortalezas**: `validateDateRange` en listados, `ParseUUIDv7Pipe`, permisos granulares por acción.
- **Criticidad general**: Media-alta en la cadena de compras.

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

### [INCIDENCIA-001] Sobrecarga de DTOs de resolución con nombres parecidos

#### Severidad
Media

#### Categoría
Mantenibilidad / Contratos

#### Descripción
El controlador importa `ResolverIncidenciaDto` y `ResolveIncidenciaDto`, nombres casi idénticos, lo que incrementa el riesgo de uso incorrecto en Swagger o en el cliente.

#### Riesgo real
Payload enviado al endpoint equivocado con validación silenciosa o errores 400 poco claros.

#### Evidencia

```18:23:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\incidencia\controller\incidencia.controller.ts
import { IncidenciaService } from '../service/incidencia.service';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import { ResolverIncidenciaDto } from '../dto/resolver-incidencia.dto';
import { ReportIncidenciaDto } from '../dto/report-incidencia.dto';
import { ResolveIncidenciaDto } from '../dto/resolve-incidencia.dto';
```

#### Impacto

- **Técnico**: Confusión en integraciones.
- **Negocio**: Retraso en resolución por errores de API.
- **UX**: Mensajes de validación opacos.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Renombrar a convención explícita (`IncidenciaResolverDesdeRecepcionDto`, `IncidenciaCierreAdministrativoDto`) y documentar en OpenAPI el flujo de cada uno.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [INCIDENCIA-002] Dependencia del rol en string para filtros de listado

#### Severidad
Baja

#### Categoría
Autorización

#### Descripción
`findAll` pasa `req.user?.rol` al servicio, patrón consistente con otros módulos pero sensible a cambios en el shape del usuario en request.

#### Riesgo real
Listados demasiado amplios si `rol` es `undefined`.

#### Evidencia

```89:98:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\incidencia\controller\incidencia.controller.ts
  @Get()
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.incidencias, IncidenciaQueryDto)
    query: IncidenciaQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Incidencia>> {
    validateDateRange(query.startDate, query.endDate, 365, 'Incidencias');
    const userRole = req.user?.rol;
    return this.incidenciaService.findAll(query, userRole).then((result) => ({
```

#### Impacto

- **Técnico**: Posible filtro incorrecto.
- **Negocio**: Confidencialidad.
- **UX**: Listados inesperados.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Tipar `req.user` con interfaz común del JWT y test de servicio con roles conocidos.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (`incidencia.types.ts` no diff completo).

## Riesgos Potenciales Futuros

- Estados de incidencia no cubiertos en migraciones concurrentes con recepciones.

## Deuda Técnica

- **Crítica**: Ninguna en controlador.
- **Importante**: Renombrado/clarificación de DTOs homónimos.
- **Tolerable**: Más `@ApiResponse` en rutas PATCH avanzadas.

## Recomendaciones Estratégicas

- Tabla de transición de estados documentada y probada con propiedades.

## Conclusión Final

El módulo **incidencia** está alineado con el patrón de API del monolito; el mayor riesgo auditado aquí es **deuda de naming en DTOs**, no un fallo de seguridad obvio en el controlador.
