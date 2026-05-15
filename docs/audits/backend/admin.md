# Auditoría Técnica Completa — Admin

## Resumen Ejecutivo

- **Estado general**: Módulo acotado a operaciones de administración (roles, permisos, alta de profesores, gestión de usuarios) con guards JWT + Roles + Permisos coherentes con el resto del stack.
- **Nivel de riesgo**: Medio (superficie sensible: roles, reset de contraseña, activación).
- **Principales problemas**: Documentación JSDoc duplicada y ruidosa; dependencias `@Optional()` en repositorios de catálogo pueden devolver listas vacías sin señalizar fallo de wiring.
- **Principales fortalezas**: `AdminService` incluye reglas explícitas (`ensureNotDemotingAdmin`, último admin activo) y uso de transacciones en flujos de creación.
- **Criticidad general**: Alta por el impacto en seguridad del dominio, mitigada por capas de guardas y validaciones de negocio en servicio.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Buena
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Aceptable

## Hallazgos

### [ADMIN-001] Documentación duplicada y ruidosa en el controlador

#### Severidad
Baja

#### Categoría
Mantenibilidad / DX

#### Descripción
El controlador repite bloques JSDoc genéricos con `@undefined` y rutas absolutas de máquina, lo que dificulta la lectura y el mantenimiento sin aportar contrato API.

#### Riesgo real
Confusión en revisiones de código y posible desalineación entre comentarios y firmas reales.

#### Evidencia

```36:44:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\admin\controller\admin.controller.ts
  /**
   * Obtiene roles.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('roles')
```

#### Impacto

- **Técnico**: Peor legibilidad y búsqueda en el código.
- **Negocio**: Bajo.
- **UX**: Ninguno.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Tiempo extra en onboarding.

#### Solución recomendada
Unificar a un único bloque Swagger/`@ApiOperation` por endpoint y eliminar metadatos `@undefined` autogenerados; alinear con el estilo del resto de controladores limpios.

#### Prioridad recomendada
Baja

#### Riesgo de regresión
Bajo

### [ADMIN-002] Repositorios opcionales que devuelven colecciones vacías

#### Severidad
Media

#### Categoría
Resiliencia / Operación

#### Descripción
`getRoles` y `getPermissions` devuelven `[]` si los repositorios no están inyectados, enmascarando un fallo de configuración del módulo.

#### Riesgo real
En un despliegue mal configurado la UI de administración podría mostrar catálogos vacíos sin error explícito, dificultando el diagnóstico.

#### Evidencia

```159:167:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\admin\service\admin.service.ts
  async getRoles() {
    if (!this.rolRepo) {
      return [];
    }

    return this.rolRepo.find({
      where: { activo: true },
      relations: ['permisos'],
      order: { nombre: 'ASC' },
    });
```

#### Impacto

- **Técnico**: Fallos silenciosos.
- **Negocio**: Bloqueo operativo confuso.
- **UX**: Pantallas vacías.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Debugging más lento.

#### Solución recomendada
En entornos no test, lanzar error de arranque si faltan providers, o registrar `error` en logs y responder 503 con mensaje claro.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (el frontend suele consumir `/admin/*` vía flujos de administración; no se encontró desajuste de contrato en servicios inspeccionados).

## Riesgos Potenciales Futuros

- Crecimiento de endpoints administrativos sin rate limiting específico (depende del guard global Throttler).
- Evolución del modelo Rol/Permiso que requiera versionado de API.

## Deuda Técnica

- **Crítica**: Ninguna identificada en este módulo.
- **Importante**: Manejo silencioso de repositorios opcionales.
- **Tolerable**: JSDoc redundante.

## Recomendaciones Estratégicas

- Mantener la lógica de elevación / último admin en servicio y cubrirla con pruebas e2e de regresión ante cambios en RBAC.
- Sustituir respuestas vacías silenciosas por fallos explícitos en producción.

## Conclusión Final

El módulo **admin** está razonablemente alineado con el modelo de seguridad del proyecto (JWT + rol ADMIN + permisos). Los riesgos principales son operativos (configuración) y de mantenibilidad (ruido documental), no fallos de autorización evidentes en el código auditado.
