# Auditoría Técnica Completa — Sherlock Auth

## Resumen Ejecutivo

- **Estado general**: Módulo **global** que reexporta `AuthController`, estrategia JWT, guards (`SherlockJwtAuthGuard`, `SherlockRolesGuard`, `SherlockPermissionsGuard`) y servicios de permisos; `JwtAuthGuard` del resto del código apunta aquí.
- **Nivel de riesgo**: Muy alto (base de autenticación y autorización de toda la API).
- **Principales problemas**: `SherlockPermissionsGuard` permite acceso total a roles «elevados» sin comprobar permisos declarados; caché en `SherlockAuthModule` (TTL 300 s, max 1000) puede retener decisiones de permisos si no se invalida correctamente en cambios RBAC.
- **Principales fortalezas**: `SherlockJwtAuthGuard` respeta `@Public()`; permisos con modo `all`/`any` explícito y logging en denegaciones.
- **Criticidad general**: Máxima.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable (con matices de bypass)
- **Performance**: Buena
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Buena
- **Claridad del código**: Buena

## Hallazgos

### [SHERLOCK-AUTH-001] Bypass de permisos para roles elevados

#### Severidad
Alta

#### Categoría
Seguridad / Modelo de amenazas

#### Descripción
Si `isSherlockElevatedRole(user.rol)` es verdadero, el guard devuelve `true` sin evaluar `requiredPermissions`, anulando `@RequirePermissions` en esos roles.

#### Riesgo real
Cualquier endpoint protegido solo por permisos (sin `RolesGuard` adicional) queda accesible a roles elevados aunque no tengan el permiso fino en base de datos — puede ser intencional, pero debe estar gobernado y auditado.

#### Evidencia

```82:84:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\sherlock-auth\guards\permissions.guard.ts
    if (isSherlockElevatedRole(user.rol)) {
      return true;
    }
```

#### Impacto

- **Técnico**: Modelo RBAC híbrido rol+permiso.
- **Negocio**: Separación de funciones débil para admins si se asume lo contrario.
- **UX**: Ninguno directo.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Alto riesgo de malentendidos.

#### Solución recomendada
Documentar explícitamente el modelo de amenazas; opcionalmente exigir `RolesGuard` en endpoints sensibles o eliminar bypass salvo `SUPER_ADMIN` con flag.

#### Prioridad recomendada
Alta (gobernanza)

#### Riesgo de regresión
Alto

### [SHERLOCK-AUTH-002] Módulo global duplica `AuthController` y configuración JWT

#### Severidad
Media

#### Categoría
Arquitectura

#### Descripción
`SherlockAuthModule` declara `controllers: [AuthController]` y registra JWT/Passport globalmente; el `app.module` no importa un `AuthModule` separado listado en el snippet revisado, centralizando auth aquí.

#### Riesgo real
Acoplamiento fuerte: cambios en auth impactan todo el runtime; tests deben cargar este módulo global.

#### Evidencia

```24:44:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\sherlock-auth\module\sherlock-auth.module.ts
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Permiso, Rol, PlantillaRol]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRATION') as StringValue,
        },
      }),
    }),
    CacheModule.register({
      ttl: 300,
      max: 1000,
    }),
  ],
  controllers: [AuthController],
```

#### Impacto

- **Técnico**: Menor modularidad.
- **Negocio**: Bajo.
- **UX**: Ninguno.
- **Escalabilidad**: Medio.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Evaluar separar `AuthHttpModule` no global para workers; documentar límites de caché de permisos.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

El alias `export { SherlockPermissionsGuard as PermisosGuard }` en `auth-permissions.guard.ts` unifica nombres; el frontend no necesita conocer «Sherlock» — coherente.

## Riesgos Potenciales Futuros

- Invalidación de caché de permisos tras cambios en roles sin reinicio de sesión.

## Deuda Técnica

- **Crítica**: Clarificar y documentar bypass de permisos para roles elevados.
- **Importante**: Estrategia de invalidación de caché RBAC.
- **Tolerable**: Unificar decoradores duplicados (`GetUser`) señalados en auditoría de `roles`.

## Recomendaciones Estratégicas

- Tabla de decisión publicada internamente: qué guard usar en endpoints nuevos (`RolesGuard` vs solo permisos).

## Conclusión Final

**Sherlock-auth** es el **corazón de seguridad** del backend: sólido en JWT y modo de permisos, pero el **bypass para roles elevados** debe ser una **decisión explícita de modelo de amenazas**, no un comportamiento accidental en despliegues enterprise.
