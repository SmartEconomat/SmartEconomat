# Reference: Interceptors, Helpers, Pipes, Decorators, Filters, Transformers y Middlewares

Documento canónico de componentes transversales del backend NestJS.

## Registro global (fuente de verdad)

### En `main.ts`

| Componente | Tipo | Alcance | Configuración / efecto |
| --- | --- | --- | --- |
| `cookieParser()` | Middleware Express | Global | Parsea cookies entrantes para auth basada en cookie. |
| `helmet()` | Middleware Express | Global | Endurece cabeceras HTTP de seguridad. |
| `I18nValidationPipe` | Pipe global | Global | `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`. |
| `GlobalExceptionFilter` | Exception filter global | Global | Envelope uniforme de error + i18n + `x-request-id`. |
| `ClassSerializerInterceptor` | Interceptor global | Global | Respeta serialización con decoradores de clase (`@Exclude`, etc.). |
| `TransformInterceptor` | Interceptor global | Global | Envelope uniforme de respuesta exitosa + metadatos. |

Referencia de código:
- `backend/smart-economat-backend/src/main.ts`

### En `AppModule`

| Componente | Token Nest | Alcance | Objetivo |
| --- | --- | --- | --- |
| `SmartAuthThrottlerGuard` | `APP_GUARD` | Global | Limita tráfico con perfiles `auth`, `write`, `read`. |
| `HighTrafficAlertInterceptor` | `APP_INTERCEPTOR` | Global | Detecta ráfagas por usuario y emite alerta de tráfico alto. |

Referencia de código:
- `backend/smart-economat-backend/src/app.module.ts`

## Interceptors

| Interceptor | Ubicación | Alcance | Qué hace |
| --- | --- | --- | --- |
| `TransformInterceptor` | `src/common/interceptors/transform.interceptor.ts` | Global | Normaliza respuestas exitosas a `{ success, message, data, meta }`, propaga/crea `x-request-id`, omite envoltorio en respuestas ya serializadas o binarias (PDF/spreadsheet). |
| `HighTrafficAlertInterceptor` | `src/common/interceptors/high-traffic-alert.interceptor.ts` | Global (`APP_INTERCEPTOR`) | Cuenta peticiones por usuario en ventana de 10s y registra alerta al alcanzar umbral (100). |
| `CookieInterceptor` | `src/common/interceptors/cookie.interceptor.ts` | Endpoint (`@UseInterceptors`) | Si la respuesta contiene `access_token`, lo persiste como cookie `httpOnly` (`sameSite: strict`, `secure` en producción). |

Uso destacado:
- `CookieInterceptor` se aplica en login de auth (`src/modules/auth/controller/auth.controller.ts`).

## Helpers y util helpers

| Helper | Ubicación | Tipo | Responsabilidad |
| --- | --- | --- | --- |
| `I18nHelper` | `src/common/helpers/i18n.helper.ts` | Helper estático | Traducción de errores/success/validación en runtime, con fallback a archivos JSON cuando no hay contexto i18n de Nest. |
| `SeederI18nHelper` | `src/common/helpers/seeder-i18n.helper.ts` | Helper estático | Traducción en seeders/CLI fuera del ciclo HTTP (`SEEDER_LANG`, carga lazy de `translation.json`). |
| `MovimientoHelper` | `src/common/helpers/movimiento.helper.ts` | Servicio `@Injectable()` | Capa común para registrar movimientos (`MovimientoPort`) desde servicios de dominio. |
| `APP_VERSION` | `src/common/helpers/app-version.helper.ts` | Constante derivada | Resuelve versión desde `package.json`/`npm_package_version` para metadata de respuestas. |
| `buildFindManyOptions` | `src/common/utils/typeorm-query.helper.ts` | Util helper | Estandariza paginación/orden (`skip`, `take`, `order`) con límite máximo de página. |

Nota:
- `src/seeders/seed-domain.helper.ts` existe como placeholder (`export {}`) y actualmente no aporta lógica funcional.

## Pipes

| Pipe | Ubicación | Alcance | Qué valida/transforma |
| --- | --- | --- | --- |
| `I18nValidationPipe` | Configurado en `main.ts` | Global | Validación estricta de DTOs + transformación implícita + mensajes i18n. |
| `ParseUUIDv7Pipe` | `src/common/pipes/parse-uuid-v7.pipe.ts` | Parámetros de ruta | Exige UUID v7 válido (`isUUID(..., '7')` + regex v7). |
| `NormalizeDataPipe` | `src/common/pipes/normalize-data.pipe.ts` | Uso explícito por endpoint | `plainToInstance`, validación, normalización recursiva de objetos/arrays/strings. |
| `NormalizeStringPipe` | `src/common/pipes/normalize-string.pipe.ts` | Uso con `@Transform` | Trim y normalización de mayúsculas/minúsculas con conflicto controlado por i18n. |

Exports de conveniencia:
- `src/common/pipes/index.ts`

## Decorators

### Decoradores de seguridad y contexto

| Decorador | Ubicación | Uso |
| --- | --- | --- |
| `@Public()` | `src/common/decorators/public.decorator.ts` | Marca rutas sin auth/autorización obligatoria. |
| `@RequirePermissions(...)` | `src/modules/sherlock-auth/decorators/permissions.decorator.ts` | Requiere que el usuario tenga todos los permisos listados (`mode: all`). |
| `@RequireAnyPermission(...)` | `src/modules/sherlock-auth/decorators/permissions.decorator.ts` | Requiere al menos uno de los permisos (`mode: any`). |
| `@ControllerPermissions(...)` | `src/modules/sherlock-auth/decorators/permissions.decorator.ts` | Permisos por clase/controlador completo. |
| `@Roles(...)` | `src/modules/sherlock-auth/decorators/roles.decorator.ts` | Control de acceso por rol (`rolUsuario`). |
| `@GetUser(...)` | `src/modules/sherlock-auth/decorators/get-user.decorator.ts` | Inyecta usuario completo o campo específico de `request.user`. |

### Decoradores comunes de datos y validación

| Decorador | Ubicación | Uso |
| --- | --- | --- |
| `@IsUnique(...)` | `src/common/decorators/is-unique.decorator.ts` | Validador asíncrono en BD para unicidad de campo. |
| `@SortableFields(...)` | `src/common/decorators/sortable-fields.decorator.ts` | Valida/transforma query de paginación y restringe campos de ordenación. |
| `@Resource(...)` | `src/common/decorators/resource.decorator.ts` | Metadata de recurso para escenarios ABAC. |
| `@NormalizeString(...)`, `@Trim()`, `@ToUppercase()`, `@ToLowercase()`, `@NormalizeNumber()`, `@NormalizeBoolean()`, `@NormalizeDate()`, `@NormalizeArray()` | `src/common/decorators/normalize.decorator.ts` | Capa declarativa de transformaciones para DTOs. |

Barrel de decoradores comunes:
- `src/common/decorators/index.ts`

Compatibilidad de imports:
- `src/modules/auth/decorators/*` reexporta desde `sherlock-auth`.
- `src/common/decorators/require-permissions.decorator.ts` y `require-any-permission.decorator.ts` también reexportan desde `sherlock-auth`.

## Filters

| Filter | Ubicación | Alcance | Comportamiento |
| --- | --- | --- | --- |
| `GlobalExceptionFilter` | `src/common/filters/global-exception.filter.ts` | Global | Unifica errores a `{ success: false, message, data: null, error, meta }`, traduce mensajes i18n, maneja `QueryFailedError` (incluyendo códigos `23503`, `23505`), setea `x-request-id` y reporta a Sentry con `@SentryExceptionCaptured()`. |

## Transformers

| Transformer | Ubicación | Entrada típica | Salida / regla |
| --- | --- | --- | --- |
| `TrimStringTransformer` | `src/common/transformers/trim-string.transformer.ts` | string | `trim()` seguro para `null/undefined`. |
| `UppercaseStringTransformer` | `src/common/transformers/uppercase-string.transformer.ts` | string | `trim().toUpperCase()`. |
| `LowercaseStringTransformer` | `src/common/transformers/lowercase-string.transformer.ts` | string | `trim().toLowerCase()`. |
| `StringToNumberTransformer` | `src/common/transformers/string-to-number.transformer.ts` | string/number | Normaliza y convierte a número, error i18n si no es convertible. |
| `StringToBooleanTransformer` | `src/common/transformers/string-to-boolean.transformer.ts` | string/number/boolean | Soporta `true/false`, `1/0`, `yes/no`, `sí/si`. |
| `StringToDateTransformer` | `src/common/transformers/string-to-date.transformer.ts` | string/number/Date | Convierte a `Date`, lanza error en formatos inválidos. |
| `NormalizeArrayTransformer` | `src/common/transformers/normalize-array.transformer.ts` | array/string/escalar | Normaliza arrays, soporta string CSV y filtra vacíos. |
| `ColumnNumericTransformer` | `src/common/transformers/column-numeric.transformer.ts` | `numeric` de TypeORM | Conversión robusta BD ↔ number con fallback `0`. |

Barrel de transformers:
- `src/common/transformers/index.ts`

## Middlewares

Estado actual del backend:

| Middleware | Registro | Tipo | Función |
| --- | --- | --- | --- |
| `cookieParser()` | `main.ts` (`app.use`) | Express | Habilita lectura/escritura de cookies para auth y sesión. |
| `helmet()` | `main.ts` (`app.use`) | Express | Aplica cabeceras de seguridad HTTP por defecto. |

Observaciones:
- No hay clases `NestMiddleware` propias (`*.middleware.ts`) en `src/` en este momento.
- También se establece `trust proxy` en Express (`expressApp.set('trust proxy', 1)`), relevante para despliegues detrás de proxy reverso.

## Relación con guards (contexto operativo)

Aunque esta referencia se centra en interceptors/helpers/pipes/decorators/filters/transformers/middlewares, el flujo real de seguridad también depende de guards:

| Guard | Alcance | Objetivo |
| --- | --- | --- |
| `JwtAuthGuard` | Endpoint/controlador | Requiere JWT salvo `@Public()`. |
| `RolesGuard` | Endpoint/controlador | Evalúa metadata `@Roles(...)`. |
| `PermisosGuard` | Endpoint/controlador | Evalúa metadata de permisos (`RequirePermissions`/`RequireAnyPermission`). |
| `SmartAuthThrottlerGuard` | Global (`APP_GUARD`) | Control de tasa por perfil de uso. |
