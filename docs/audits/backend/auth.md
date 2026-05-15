# Auditoría Técnica Completa — Auth

## Resumen Ejecutivo

- **Estado general**: Módulo de autenticación clásico (`/auth`): registro, login con cookie, logout, perfil, cambio y recuperación de contraseña; integración con JWT y `CookieInterceptor` en login.
- **Nivel de riesgo**: Alto (superficie de ataque estándar: credenciales, tokens, recuperación).
- **Principales problemas**: Registro público que crea usuario y devuelve token; uso de `any[]` en condiciones de unicidad; dependencia de configuración de correo para forgot-password.
- **Principales fortalezas**: Uso de transacción en `register`, hash con bcrypt, flujo de login con consulta explícita a roles.
- **Criticidad general**: Máxima para la seguridad del producto.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable
- **Performance**: Buena
- **Coherencia de dominio**: Buena
- **Tipado**: Aceptable
- **Resiliencia**: Buena
- **Claridad del código**: Buena

## Hallazgos

### [AUTH-001] Registro público con emisión de token

#### Severidad
Alta

#### Categoría
Seguridad / Gobierno de identidades

#### Descripción
El endpoint `POST /auth/register` es `@Public()` y, tras crear el usuario inactivo, invoca `generateToken` devolviendo un JWT al cliente.

#### Riesgo real
En entornos enterprise puede violar políticas de aprovisionamiento (solo admins, SSO, invitaciones). Riesgo de creación masiva de cuentas si no hay CAPTCHA/rate limit específico.

#### Evidencia

```44:47:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\auth\controller\auth.controller.ts
  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
```

```51:80:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\auth\service\auth.service.ts
  async register(dto: RegisterUserDto) {
    return await this.dataSource.transaction(async (manager) => {
      const whereConditions: any[] = [{ username: dto.username }];
      if (dto.email) {
        whereConditions.push({ email: dto.email });
      }

      const existing = await manager.findOne(Usuario, {
        where: whereConditions,
      });

      if (existing) {
        throw new ConflictException(
          I18nHelper.getError('USER_OR_EMAIL_ALREADY_REGISTERED')
        );
      }

      const alumnoRole = await manager.findOne(Rol, {
        where: { nombre: rolUsuario.ALUMNO },
      });

      const usuario = manager.create(Usuario, {
        ...dto,
        status: UserStatus.INACTIVE,
        rol: rolUsuario.ALUMNO,
        roles: alumnoRole ? [alumnoRole] : [],
      });

      await manager.save(usuario);
      return this.generateToken(usuario);
    });
  }
```

#### Impacto

- **Técnico**: Superficie de abuso y tokens emitidos fuera de política.
- **Negocio**: Incumplimiento de políticas IAM.
- **UX**: Ninguno directo.
- **Escalabilidad**: Posible spam de registros.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Feature flag por entorno (`ALLOW_PUBLIC_REGISTER`), o deshabilitar en producción; sustituir `any[]` por `FindOptionsWhere<Usuario>[]` tipado; no emitir JWT hasta activación explícita si el negocio lo exige.

#### Prioridad recomendada
Inmediata (en despliegues enterprise)

#### Riesgo de regresión
Medio

### [AUTH-002] Uso de `any` en construcción de `where` de unicidad

#### Severidad
Media

#### Categoría
Tipado / Calidad

#### Descripción
`whereConditions` se declara como `any[]`, contrario a las reglas del repositorio y a la rigurosidad TypeScript deseada.

#### Riesgo real
Errores sutiles en consultas OR/AND al evolucionar el DTO o TypeORM.

#### Evidencia

```52:60:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\auth\service\auth.service.ts
    return await this.dataSource.transaction(async (manager) => {
      const whereConditions: any[] = [{ username: dto.username }];
      if (dto.email) {
        whereConditions.push({ email: dto.email });
      }

      const existing = await manager.findOne(Usuario, {
        where: whereConditions,
      });
```

#### Impacto

- **Técnico**: Menos seguridad de tipos.
- **Negocio**: Bajo.
- **UX**: Ninguno.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Usar `Array<FindOptionsWhere<Usuario>>` o `Brackets` del QueryBuilder con tipos explícitos.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (el envelope `{ message }` vs `{ success, message }` en forgot-password es intencionalmente distinto entre endpoints; el cliente debe mapear por ruta).

## Riesgos Potenciales Futuros

- Rotación de secretos JWT sin invalidación de sesiones en cookie.
- Alineación futura con OIDC/SAML si el cliente enterprise lo exige.

## Deuda Técnica

- **Crítica**: Política de registro público sin gobierno explícito por entorno.
- **Importante**: Eliminación de `any` en consultas.
- **Tolerable**: Ampliar tests de contrato en `login` para payloads mínimos.

## Recomendaciones Estratégicas

- Auditar `SmartAuthThrottlerGuard` para rutas `/auth/register` y `/auth/forgot-password` con límites más estrictos que el tráfico general de lectura.
- Documentar el modelo de cookie (`httpOnly`, `secure`, `sameSite`) en despliegue.

## Conclusión Final

El módulo **auth** está bien estructurado para un producto SaaS, pero el **registro público con token** y el **`any` en consultas** son los puntos más sensibles a corregir antes de un despliegue enterprise estricto.
