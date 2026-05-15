# Auditoría Técnica Completa — Profesor

## Resumen Ejecutivo

- **Estado general**: API bajo `/profesores` con registro público y operaciones autenticadas para slots y administración educativa.
- **Nivel de riesgo**: Medio (similar a alumno en registro público; operaciones de slots con permisos).
- **Principales problemas**: `ProfesorController` aplica `@UseGuards` a nivel de clase y usa `@Public()` en `register` — patrón correcto, pero el registro público sigue siendo superficie sensible.
- **Principales fortalezas**: Separación de endpoints `admin-slots` con permiso `usuarios.listar` en lugar de mezclar con rol string suelto.
- **Criticidad general**: Media en el módulo educativo.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [PROFESOR-001] Registro público de profesor

#### Severidad
Alta

#### Categoría
Seguridad / Gobierno de identidades

#### Descripción
`POST /profesores/register` es `@Public()` y crea credenciales/relación docente sin autenticación previa en el controlador.

#### Riesgo real
Abuso de creación de cuentas y enumeración si no hay CAPTCHA, invitación firmada o rate limit específico en servicio.

#### Evidencia

```28:48:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\profesor\controller\profesor.controller.ts
@Controller('profesores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProfesorController {
...
  @Post('register')
  @Public()
  async register(@Body() dto: CreateProfesorDto) {
    return this.profesorService.register(dto);
  }
```

#### Impacto

- **Técnico**: Spam de registros.
- **Negocio**: Incumplimiento de políticas IAM.
- **UX**: Degradación.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Token de invitación del centro, aprobación admin, o deshabilitar en producción con feature flag.

#### Prioridad recomendada
Inmediata (según política del despliegue)

#### Riesgo de regresión
Medio

### [PROFESOR-002] Permiso genérico para creación administrativa de slots

#### Severidad
Media

#### Categoría
Autorización

#### Descripción
`adminCreateSlot` usa `PERMISSIONS.usuarios.listar`, que puede ser más amplio de lo deseado semánticamente frente a `profesor.gestionar_slots`.

#### Riesgo real
Usuarios con permiso de listar usuarios pero sin competencia pedagógica podrían crear slots.

#### Evidencia

```74:77:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\profesor\controller\profesor.controller.ts
  @Post('admin-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminCreateSlot(@Body() dto: AdminCreateSlotDto) {
    return this.profesorService.adminCreateSlot(dto);
  }
```

#### Impacto

- **Técnico**: Modelo RBAC menos expresivo.
- **Negocio**: Separación de funciones débil.
- **UX**: Ninguno directo.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Permiso dedicado `profesor.administrar_slots` o reutilizar `PERMISSIONS.profesor.*` con matriz clara.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado.

## Riesgos Potenciales Futuros

- Cambios en `AlumnoSlot` que requieran migración de datos y endpoints admin.

## Deuda Técnica

- **Crítica**: Depende de política de registro público.
- **Importante**: Revisión de permisos de slots admin.
- **Tolerable**: Ampliar Swagger en rutas secundarias.

## Recomendaciones Estratégicas

- Alinear flujo de alta de profesores con flujo de alta de usuarios administrativos si el producto converge.

## Conclusión Final

El módulo **profesor** aplica **mejor patrón de guards** que `alumno`, pero mantiene **riesgo de seguridad en el registro público** y un posible **desajuste semántico de permisos** en slots administrativos.
