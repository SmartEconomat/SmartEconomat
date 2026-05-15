# Auditoría Técnica Completa — Usuario

## Resumen Ejecutivo

- **Estado general**: Módulo extenso de gestión de usuarios bajo `/usuarios` con perfiles, preferencias, administración, permisos efectivos y operaciones sensibles (password, status).
- **Nivel de riesgo**: Muy alto (identidad y RBAC efectivo).
- **Principales problemas**: Superficie amplia de endpoints → mayor probabilidad de regresión; algunas rutas combinan `Roles` y `RequirePermissions` y deben revisarse caso a caso en servicio.
- **Principales fortalezas**: Guards consistentes a nivel de clase, uso de `GetUser` canónico desde `auth`, permisos granulares por operación.
- **Criticidad general**: Máxima.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Buena
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Buena

## Hallazgos

### [USUARIO-001] Composición de perfil con datos sensibles

#### Severidad
Media

#### Categoría
Privacidad / Seguridad

#### Descripción
`GET /usuarios/perfil` compone el usuario con la lista de permisos efectivos; es útil, pero incrementa la superficie de datos devueltos a cualquier usuario autenticado.

#### Riesgo real
Cliente o extensiones del navegado pueden almacenar más datos de los necesarios; debe alinearse con política de minimización.

#### Evidencia

```77:84:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\usuario\controller\usuario.controller.ts
  @Get('perfil')
  async getPerfil(@GetUser('id') id: string) {
    const usuario = await this.usuarioService.findOne(id);
    const permisos = await this.usuarioService.getUserPermissions(id);
    return {
      ...usuario,
      permisos,
    };
  }
```

#### Impacto

- **Técnico**: Payload grande.
- **Negocio**: Cumplimiento RGPD según campos del usuario.
- **UX**: Mejor funcionalidad de cliente.
- **Escalabilidad**: Bajo.
- **Mantenibilidad**: Medio.

#### Solución recomendada
DTO `PerfilUsuarioDto` con campos explícitos y opción de omitir permisos detallados si el cliente solo necesita códigos.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

### [USUARIO-002] Riesgo de regresión por tamaño del controlador

#### Severidad
Baja

#### Categoría
Mantenibilidad

#### Descripción
`usuario.controller.ts` supera con creces las ~120 líneas iniciales leídas y concentra muchos endpoints; incrementa coste de revisión y riesgo de olvidar `@RequirePermissions` en nuevas rutas si se pierde el patrón de clase.

#### Riesgo real
Endpoint nuevo sin permiso o con permiso incorrecto.

#### Evidencia

```40:47:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\usuario\controller\usuario.controller.ts
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Controller('usuarios')
export class UsuarioController {
  /**
   * Crea una instancia de UsuarioController.
   * @param usuarioService Servicio para la gestión lógica de usuarios.
   */
  constructor(private readonly usuarioService: UsuarioService) {}
```

*(El archivo continúa con múltiples rutas administrativas y de perfil.)*

#### Impacto

- **Técnico**: Complejidad.
- **Negocio**: Vulnerabilidades por omisión.
- **UX**: Ninguno.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Alto.

#### Solución recomendada
Partir en `UsuarioPerfilController`, `UsuarioAdminController` con prefijos `@Controller('usuarios/perfil')` etc., manteniendo guards.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Alto

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (el cliente debe alinear enums de `UserStatus` y roles con backend — revisión recomendada al cambiar enums).

## Riesgos Potenciales Futuros

- Sincronización de `mustChangePassword` y flujos de login en cliente educativo vs economato.

## Deuda Técnica

- **Crítica**: Ninguna aislada en el fragmento leído.
- **Importante**: Modularizar controlador y endurecer DTOs de perfil.
- **Tolerable**: Reducir JSDoc ruidoso similar a otros módulos.

## Recomendaciones Estratégicas

- Auditoría de eventos de seguridad (cambio de rol, reset password) hacia SIEM.

## Conclusión Final

El módulo **usuario** está **bien protegido por guards y permisos**, pero acumula **complejidad** típica de módulos centrales; la prioridad es **modularizar** y **acotar DTOs de salida** sin perder funcionalidad.
