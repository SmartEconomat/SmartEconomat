# Contrato Global de la API

Este documento describe las reglas que aplican a toda la API, independientemente del dominio funcional.

## Base URL y exposición

- Prefijo global del backend: `/api/v1`.
- URL local habitual: `http://localhost:3000/api/v1`.
- Swagger local: `http://localhost:3000/docs`.
- En producción, el proxy actual publica `/api/`; Swagger no queda expuesto al exterior salvo que se añada una regla específica.

## Autenticación y sesión

### Modelo soportado

- El backend acepta JWT autenticado por `JwtAuthGuard`.
- El login web recomendado es cookie-first: `POST /auth/login` establece la cookie `access_token` mediante interceptor.
- El backend también mantiene compatibilidad con `Authorization: Bearer <token>`.
- El frontend debe enviar `credentials: 'include'` cuando dependa de la cookie de sesión.

### Flujo canónico de sesión

1. `POST /auth/login` recibe credenciales y abre sesión.
2. `GET /usuarios/perfil` hidrata el usuario real, sus roles y permisos efectivos.
3. La UI toma decisiones de acceso a partir de `/usuarios/perfil`, no del JWT bruto.
4. `POST /auth/logout` limpia la cookie y cierra la sesión lógica.

### Endpoints públicos frente a protegidos

- Públicos: endpoints marcados con `@Public()`, sobre todo registro, login, recuperación de contraseña y consultas de alta educativa.
- Protegidos por rol: controladores con `RolesGuard` y `@Roles(...)`.
- Protegidos por permiso: controladores con `PermisosGuard` y `@RequirePermissions(...)`.
- Mixtos: varios módulos usan `JwtAuthGuard + RolesGuard + PermisosGuard` al mismo tiempo.

## Envelope estándar de respuesta

Salvo streams binarios o respuestas que ya salen formateadas, el `TransformInterceptor` envuelve el resultado en esta forma:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {},
  "meta": {
    "app": "SmartEconomat",
    "version": "x.y.z",
    "timestamp": "2026-04-05T10:00:00.000Z",
    "environment": "development",
    "requestId": "uuid"
  }
}
```

### Qué significa cada parte

- `success`: indica si la operación terminó correctamente.
- `message`: mensaje funcional o técnico breve.
- `data`: entidad, listado, resultado agregado o `null`.
- `meta`: metadatos comunes para trazabilidad y soporte.

### Casos que no usan envelope completo

- Descargas de PDF y XLSX.
- `sendFile` para documentos y contenidos binarios.
- Algunas respuestas ya preparadas con `data` y `meta`, que el interceptor respeta sin reenvolver.

## Headers y trazabilidad

- `x-request-id`: si el cliente lo manda, el backend lo conserva; si no, lo genera.
- `Content-Type`: debe ser coherente con el body enviado (`application/json`, `multipart/form-data`, etc.).
- En descargas, el backend añade `Content-Disposition` para forzar nombre de fichero.

## Convenciones de datos

- Identificadores: UUID v7.
- Fechas: ISO 8601.
- Enums: strings definidos por el backend.
- DTOs: validación estricta (`whitelist`, `forbidNonWhitelisted`, `transform`).

Esto implica dos reglas prácticas:

1. No enviar campos extra “por si acaso”; el backend los rechazará.
2. No asumir enums o filtros no publicados por el controlador y su DTO.

## Paginación, orden y filtros

Muchos listados comparten el patrón de query:

- `page` y `limit` para paginación.
- `sortBy` o variantes equivalentes para elegir campo de orden.
- `order` o `sortOrder` para dirección `ASC` o `DESC`.
- Filtros específicos por módulo según el DTO del endpoint.

Cuando un endpoint admite `SortableFields`, la documentación de dominio indica los campos de negocio más relevantes, pero la fuente de verdad sigue siendo el DTO del propio módulo.

## Patrones de request habituales

### Alta (`POST`)

- Enviar un DTO de creación con los campos obligatorios del agregado.
- Esperar entidad creada, DTO resultado o mensaje con `data`.

### Edición (`PATCH`)

- Enviar el identificador por path.
- Enviar body parcial o DTO específico de transición.
- Esperar entidad actualizada o confirmación funcional.

### Operaciones de transición

Rutas como `aceptar`, `cancelar`, `restaurar`, `resolver`, `confirmar` o `tramitar` no son simples updates genéricos. Existen para proteger invariantes de negocio y normalmente exigen:

- `id` por path.
- usuario actor autenticado.
- motivo o payload adicional cuando la transición lo necesita.

### Uploads

- Usar `multipart/form-data`.
- Enviar el binario en el campo `file`.
- Añadir los campos de negocio necesarios en el mismo formulario.

## Códigos de error habituales

| Código | Cuándo aparece | Qué suele significar |
| --- | --- | --- |
| `400` | DTO inválido, enum incorrecto, body incompleto, query mal formada | El cliente envió un payload fuera de contrato |
| `401` | Sin sesión o token inválido | Falta autenticación o la sesión expiró |
| `403` | Rol o permiso insuficiente | El usuario está autenticado pero no autorizado |
| `404` | Recurso inexistente | El `id` no existe o no es visible para ese flujo |
| `409` | Conflicto de negocio | Duplicados, stock negativo, estados incompatibles, etc. |

## Relación con las entidades de negocio

Para entender la forma de `data`, esta referencia asume como complemento la página [../entidades.md](../entidades.md). Allí están resumidos los agregados principales, sus campos y relaciones.

En esta documentación, cada bloque de endpoints indica además qué entidad o agregado devuelve de forma habitual.