# Reference: Pipes, Guards, Interceptors y Filters globales

## Configuración global en `main.ts`

### Pipes
| Componente | Función | Configuración clave |
|---|---|---|
| `I18nValidationPipe` | Valida DTOs y traduce mensajes | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, `enableImplicitConversion: true` |

### Filters
| Componente | Función | Casos relevantes |
|---|---|---|
| `GlobalExceptionFilter` | Formato uniforme de error | `QueryFailedError` (`23503`, `23505`), `HttpException`, errores no controlados |

### Interceptors
| Componente | Función |
|---|---|
| `ClassSerializerInterceptor` | Respeta decoradores de serialización (`@Exclude`, etc.) |
| `TransformInterceptor` | Homogeneiza estructura de respuesta API |

## Configuración global en `AppModule`

### Guards
| Componente | Tipo | Objetivo |
|---|---|---|
| `SmartAuthThrottlerGuard` | `APP_GUARD` | Rate limit con perfiles (`auth`, `write`, `read`) y estrategia inteligente de tracker |

### Interceptor APP
| Componente | Tipo | Objetivo |
|---|---|---|
| `HighTrafficAlertInterceptor` | `APP_INTERCEPTOR` | Instrumentación para alertas de tráfico alto |

## Guards por endpoint/controlador más usados
| Guard | Función |
|---|---|
| `JwtAuthGuard` | Requiere token JWT salvo endpoints `@Public()` |
| `RolesGuard` | Valida roles declarados con `@Roles(...)` |
| `PermisosGuard` | Valida permisos con `@RequirePermissions('modulo:accion')` |

## Decoradores relacionados
| Decorador | Uso |
|---|---|
| `@Public()` | Excluir endpoint de auth JWT |
| `@GetUser(...)` | Inyectar datos del usuario autenticado |
| `@RequirePermissions(...)` | Autorizar por permiso granular |
| `@Roles(...)` | Autorizar por rol |
| `@SortableFields(...)` | Validar/normalizar criterios de ordenación |
