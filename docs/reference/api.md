# API

Documento de referencia Diátaxis generado exclusivamente desde el código real del backend NestJS.

## Metadatos del documento

- Tipo de documento: Referencia
- Audiencia objetivo: desarrolladores backend, frontend, QA e integradores internos
- Objetivo del usuario: localizar y consumir cualquier endpoint real publicado por el backend
- Alcance: controladores NestJS del backend bajo `backend/smart-economat-backend/src`
- Fecha de generación: 2026-04-05T12:41:50.559Z

## Contrato global detectado

- Prefijo global: /api/v1
- Guards globales: SmartAuthThrottlerGuard
- Interceptors globales: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares globales: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe
- Autenticación JWT soportada por cabecera Bearer y cookie `access_token` (JwtStrategy)
- Envelope JSON global: `success`, `message`, `data`, `meta` salvo streams/binarios
- Trazabilidad global: `x-request-id` soportado y generado si falta
- Validación global: `whitelist`, `forbidNonWhitelisted`, `transform`

## Validación final

- Controllers detectados: 35
- Endpoints detectados: 243
- Endpoints documentados: 243

## Módulo: admin

### Controller: AdminController

- Ruta base: /api/v1/admin
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Endpoints: 6

### [GET] /api/v1/admin/permissions

Descripción: AdminController.getPermissions

- Módulo: admin
- Controller: AdminController
- Handler: getPermissions
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Permiso[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Permiso[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en adminService.getPermissions()

### [POST] /api/v1/admin/profesores

Descripción: AdminController.createProfesor

- Módulo: admin
- Controller: AdminController
- Handler: createProfesor
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateProfesorDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| email | string | sí | IsEmail, IsNotEmpty | n/a | n/a |
| cial | string | sí | Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : String(value)), IsString, IsNotEmpty | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { id: string; user_id: string; username: string; cial: string; status: UserStatus; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateProfesorDto
- Response: { id: string; user_id: string; username: string; cial: string; status: UserStatus; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| email | string | sí | IsEmail, IsNotEmpty | n/a | n/a |
| cial | string | sí | Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : String(value)), IsString, IsNotEmpty | n/a | n/a |

#### Side effects

- Delega en adminService.createProfesor()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/admin/roles

Descripción: AdminController.getRoles

- Módulo: admin
- Controller: AdminController
- Handler: getRoles
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Rol[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Rol[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en adminService.getRoles()

### [PATCH] /api/v1/admin/users/:id/activate

Descripción: AdminController.activateUser

- Módulo: admin
- Controller: AdminController
- Handler: activateUser
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:activar_desactivar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateAdminUserActivationDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| active | boolean | no | IsBoolean, IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; id: string; status: UserStatus.INACTIVE | UserStatus.ACTIVE; activo: boolean; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: UpdateAdminUserActivationDto
- Response: { message: string; id: string; status: UserStatus.INACTIVE | UserStatus.ACTIVE; activo: boolean; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| active | boolean | no | IsBoolean, IsOptional | n/a | n/a |

#### Side effects

- Delega en adminService.activateUser()
- Operación de actualización o transición de estado

### [POST] /api/v1/admin/users/:id/force-reset

Descripción: AdminController.forcePasswordReset

- Módulo: admin
- Controller: AdminController
- Handler: forcePasswordReset
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:resetear_password
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { message: string; provisionalPassword: string; mustChangePassword: boolean; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { message: string; provisionalPassword: string; mustChangePassword: boolean; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en adminService.forcePasswordReset()
- Operación de alta/acción de negocio con persistencia probable

### [PATCH] /api/v1/admin/users/:id/role

Descripción: AdminController.updateUserRole

- Módulo: admin
- Controller: AdminController
- Handler: updateUserRole
- Fuente: backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateAdminUserRoleDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| roleId | string | sí | IsUUID, IsNotEmpty | n/a | n/a |
| permisosAdicionalesIds | string[] | no | IsArray, IsOptional, IsUUID(all, {"each":true}) | n/a | n/a |
| permisosExcluidosIds | string[] | no | IsArray, IsOptional, IsUUID(all, {"each":true}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateAdminUserRoleDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| roleId | string | sí | IsUUID, IsNotEmpty | n/a | n/a |
| permisosAdicionalesIds | string[] | no | IsArray, IsOptional, IsUUID(all, {"each":true}) | n/a | n/a |
| permisosExcluidosIds | string[] | no | IsArray, IsOptional, IsUUID(all, {"each":true}) | n/a | n/a |

#### Side effects

- Delega en adminService.updateUserRole()
- Operación de actualización o transición de estado

## Módulo: albaran

### Controller: AlbaranController

- Ruta base: /api/v1/albaranes
- Tags Swagger: Albaranes
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Endpoints: 7

### [GET] /api/v1/albaranes

Descripción: AlbaranController.findAll

- Módulo: albaran
- Controller: AlbaranController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Albaran>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Albaran>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en albaranService.findAll()

### [POST] /api/v1/albaranes

Descripción: AlbaranController.create

- Módulo: albaran
- Controller: AlbaranController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateAlbaranDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nAlbaran | string | sí | IsString, IsNotEmpty | n/a | n/a |
| concordancia | boolean | no | IsOptional, IsBoolean | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Albaran
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateAlbaranDto
- Response: Albaran

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nAlbaran | string | sí | IsString, IsNotEmpty | n/a | n/a |
| concordancia | boolean | no | IsOptional, IsBoolean | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional | n/a | n/a |

#### Side effects

- Delega en albaranService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/albaranes/:id

Descripción: AlbaranController.remove

- Módulo: albaran
- Controller: AlbaranController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en albaranService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/albaranes/:id

Descripción: AlbaranController.findOne

- Módulo: albaran
- Controller: AlbaranController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Albaran
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Albaran

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en albaranService.findOne()

### [PATCH] /api/v1/albaranes/:id

Descripción: AlbaranController.update

- Módulo: albaran
- Controller: AlbaranController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateAlbaranDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nAlbaran | string | no | IsString, IsNotEmpty | n/a | n/a |
| concordancia | boolean | no | IsOptional, IsBoolean | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Albaran
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateAlbaranDto
- Response: Albaran

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nAlbaran | string | no | IsString, IsNotEmpty | n/a | n/a |
| concordancia | boolean | no | IsOptional, IsBoolean | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional | n/a | n/a |

#### Side effects

- Delega en albaranService.update()
- Operación de actualización o transición de estado

### [GET] /api/v1/albaranes/documento/:filename

Descripción: Obtener documento de albarán

- Módulo: albaran
- Controller: AlbaranController
- Handler: serveDocumento
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/octet-stream | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| filename | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/octet-stream
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en albaranService.getDocumentoPath()
- Devuelve stream/binario (application/octet-stream)
- Interactúa con almacenamiento de archivos

### [POST] /api/v1/albaranes/upload-documento

Descripción: Subir documento de albarán

- Módulo: albaran
- Controller: AlbaranController
- Handler: uploadDocumento
- Fuente: backend/smart-economat-backend/src/modules/albaran/controller/albaran.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: albaranes:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor, FileInterceptor('file')
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | multipart/form-data | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: inline-schema
- Content-Type: multipart/form-data

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| file | binary | sí | n/a | n/a | n/a |
| numeroReferencia | string | sí | n/a | n/a | n/a |
| recepcionId | string | no | n/a | n/a | n/a |
| observaciones | string | no | n/a | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { message: string; data: Albaran; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Datos inválidos, archivo no proporcionado o tipo no soportado
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: Recepción no encontrada
- 409: El albarán ya tiene un documento adjunto
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: inline-schema
- Response: { message: string; data: Albaran; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| file | binary | sí | n/a | n/a | n/a |
| numeroReferencia | string | sí | n/a | n/a | n/a |
| recepcionId | string | no | n/a | n/a | n/a |
| observaciones | string | no | n/a | n/a | n/a |

#### Side effects

- Delega en albaranService.uploadDocumento()
- Operación de alta/acción de negocio con persistencia probable
- Procesa subida de binarios multipart
- Interactúa con almacenamiento de archivos

## Módulo: alumno

### Controller: AlumnoController

- Ruta base: /api/v1/alumnos
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Endpoints: 6

### [GET] /api/v1/alumnos/aulas

Descripción: AlumnoController.getAulas

- Módulo: alumno
- Controller: AlumnoController
- Handler: getAulas
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: string[]
- Envelope global: success, message, data, meta

#### Response error

- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 500

#### DTOs

- Request: n/a
- Response: string[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en alumnoService.getAulas()

### [GET] /api/v1/alumnos/aulas/:aula/clases

Descripción: AlumnoController.getClasesByAula

- Módulo: alumno
- Controller: AlumnoController
- Handler: getClasesByAula
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| aula | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: number[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 500

#### DTOs

- Request: n/a
- Response: number[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en alumnoService.getClasesByAula()

### [GET] /api/v1/alumnos/aulas/:aula/clases/:clase/profesores

Descripción: AlumnoController.getProfesoresBySlot

- Módulo: alumno
- Controller: AlumnoController
- Handler: getProfesoresBySlot
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| aula | string | sí | n/a | n/a | n/a |
| clase | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { cial: string; nombre: string; codigoSlot: string; }[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 500

#### DTOs

- Request: n/a
- Response: { cial: string; nombre: string; codigoSlot: string; }[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en alumnoService.getProfesoresBySlot()

### [PATCH] /api/v1/alumnos/change-profesor

Descripción: AlumnoController.changeProfesor

- Módulo: alumno
- Controller: AlumnoController
- Handler: changeProfesor
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: alumno:cambiar_profesor
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ChangeProfesorDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| cialNuevoProfesor | string | sí | Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : String(value)), IsString, IsNotEmpty | n/a | n/a |
| nuevaAula | string | sí | IsString, IsNotEmpty | n/a | n/a |
| nuevoNumeroClase | number | sí | IsInt, Min(1) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: ChangeProfesorDto
- Response: { message: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| cialNuevoProfesor | string | sí | Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : String(value)), IsString, IsNotEmpty | n/a | n/a |
| nuevaAula | string | sí | IsString, IsNotEmpty | n/a | n/a |
| nuevoNumeroClase | number | sí | IsInt, Min(1) | n/a | n/a |

#### Side effects

- Delega en alumnoService.changeProfesor()
- Operación de actualización o transición de estado

### [POST] /api/v1/alumnos/register

Descripción: AlumnoController.register

- Módulo: alumno
- Controller: AlumnoController
- Handler: register
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: RegisterAlumnoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | Transform(({ value }): string => typeof value === 'string' ? value.trim() : ''), IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| codigoClase | string | sí | Transform(({ value }): string => typeof value === 'string' ? value.trim() : ''), Transform(({ value }): string => typeof value === 'string' ? value.toUpperCase() : ''), IsString, IsNotEmpty | n/a | n/a |
| aula | string | no | Transform(({ value }): string => typeof value === 'string' ? value.trim() : ''), IsString, IsNotEmpty | n/a | n/a |
| numeroClase | number | no | Type(() => Number), Transform(({ value }): number | string => value === '' || value === null || value === undefined ? '' : Number(value)), IsInt, Min(1) | n/a | n/a |
| cialProfesor | string | no | Transform(({ value }): string => typeof value === 'string' ? value.trim().toUpperCase() : ''), IsString, IsNotEmpty | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { id: string; username: string; status: UserStatus; message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 500

#### DTOs

- Request: RegisterAlumnoDto
- Response: { id: string; username: string; status: UserStatus; message: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | Transform(({ value }): string => typeof value === 'string' ? value.trim() : ''), IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| codigoClase | string | sí | Transform(({ value }): string => typeof value === 'string' ? value.trim() : ''), Transform(({ value }): string => typeof value === 'string' ? value.toUpperCase() : ''), IsString, IsNotEmpty | n/a | n/a |
| aula | string | no | Transform(({ value }): string => typeof value === 'string' ? value.trim() : ''), IsString, IsNotEmpty | n/a | n/a |
| numeroClase | number | no | Type(() => Number), Transform(({ value }): number | string => value === '' || value === null || value === undefined ? '' : Number(value)), IsInt, Min(1) | n/a | n/a |
| cialProfesor | string | no | Transform(({ value }): string => typeof value === 'string' ? value.trim().toUpperCase() : ''), IsString, IsNotEmpty | n/a | n/a |

#### Side effects

- Delega en alumnoService.register()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/alumnos/slots/:codigoClase

Descripción: AlumnoController.getSlotByCode

- Módulo: alumno
- Controller: AlumnoController
- Handler: getSlotByCode
- Fuente: backend/smart-economat-backend/src/modules/alumno/controller/alumno.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| codigoClase | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { codigoClase: string; aula: string; numeroClase: number; profesor: string; cialProfesor: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 500

#### DTOs

- Request: n/a
- Response: { codigoClase: string; aula: string; numeroClase: number; profesor: string; cialProfesor: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en alumnoService.getSlotByCode()

## Módulo: archivo

### Controller: ArchivoController

- Ruta base: /api/v1/archivos
- Tags Swagger: Archivos
- Fuente: backend/smart-economat-backend/src/modules/archivo/controller/archivo.controller.ts
- Endpoints: 5

### [GET] /api/v1/archivos

Descripción: Listar archivos

- Módulo: archivo
- Controller: ArchivoController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/archivo/controller/archivo.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: archivos:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| usuarioId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| mimeType | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { data: FileResponseDto[]; total: number; page: number; limit: number; totalPages: number; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { data: FileResponseDto[]; total: number; page: number; limit: number; totalPages: number; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en archivoService.findAll()

### [DELETE] /api/v1/archivos/:id

Descripción: Eliminar un archivo (soft-delete)

- Módulo: archivo
- Controller: ArchivoController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/archivo/controller/archivo.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: archivos:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/octet-stream | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/octet-stream
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en archivoService.remove()
- Operación de eliminación o baja lógica
- Devuelve stream/binario (application/octet-stream)

### [GET] /api/v1/archivos/:id

Descripción: Obtener metadata de un archivo por ID

- Módulo: archivo
- Controller: ArchivoController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/archivo/controller/archivo.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: archivos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: FileResponseDto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: FileResponseDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en archivoService.findOne()

### [GET] /api/v1/archivos/content/:filename

Descripción: Servir el contenido de un archivo subido

- Módulo: archivo
- Controller: ArchivoController
- Handler: getFileContent
- Fuente: backend/smart-economat-backend/src/modules/archivo/controller/archivo.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/octet-stream | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| filename | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/octet-stream
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en archivoService.getFileContent()
- Devuelve stream/binario (application/octet-stream)

### [POST] /api/v1/archivos/upload

Descripción: Subir un nuevo archivo

- Módulo: archivo
- Controller: ArchivoController
- Handler: uploadFile
- Fuente: backend/smart-economat-backend/src/modules/archivo/controller/archivo.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: archivos:subir
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor, FileInterceptor('file')
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | multipart/form-data | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: inline-schema
- Content-Type: multipart/form-data

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| file | binary | sí | n/a | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: any
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: inline-schema
- Response: any

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| file | binary | sí | n/a | n/a | n/a |

#### Side effects

- Delega en archivoService.uploadFile()
- Operación de alta/acción de negocio con persistencia probable
- Procesa subida de binarios multipart
- Interactúa con almacenamiento de archivos

## Módulo: auth

### Controller: AuthController

- Ruta base: /api/v1/auth
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Endpoints: 7

### [PATCH] /api/v1/auth/change-password

Descripción: AuthController.changePassword

- Módulo: auth
- Controller: AuthController
- Handler: changePassword
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ChangePasswordDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| currentPassword | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_ACTUAL_ES_REQUERIDA' )"}), IsString | n/a | n/a |
| newPassword | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.LA_NUEVA_CONTRASE_A_ES_REQUERIDA' )"}), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 500

#### DTOs

- Request: ChangePasswordDto
- Response: { message: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| currentPassword | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_ACTUAL_ES_REQUERIDA' )"}), IsString | n/a | n/a |
| newPassword | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.LA_NUEVA_CONTRASE_A_ES_REQUERIDA' )"}), IsString | n/a | n/a |

#### Side effects

- Delega en authService.changePassword()
- Acción de sesión, identidad o credenciales
- Operación de actualización o transición de estado

### [POST] /api/v1/auth/forgot-password

Descripción: AuthController.forgotPassword

- Módulo: auth
- Controller: AuthController
- Handler: forgotPassword
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ForgotPasswordDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| email | string | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.EL_EMAIL_ES_REQUERIDO')"}), IsEmail({}, {"message":"i18nValidationMessage('validation.DEBE_SER_UN_EMAIL_V_LIDO')"}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { success: boolean; message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 500

#### DTOs

- Request: ForgotPasswordDto
- Response: { success: boolean; message: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| email | string | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.EL_EMAIL_ES_REQUERIDO')"}), IsEmail({}, {"message":"i18nValidationMessage('validation.DEBE_SER_UN_EMAIL_V_LIDO')"}) | n/a | n/a |

#### Side effects

- Delega en authService.forgotPassword()
- Acción de sesión, identidad o credenciales

### [POST] /api/v1/auth/login

Descripción: AuthController.login

- Módulo: auth
- Controller: AuthController
- Handler: login
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor, CookieInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: LoginUserDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| email | string | sí | IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString, IsNotEmpty | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { requirePasswordChange: boolean; access_token: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 500

#### DTOs

- Request: LoginUserDto
- Response: { requirePasswordChange: boolean; access_token: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| email | string | sí | IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString, IsNotEmpty | n/a | n/a |

#### Side effects

- Delega en authService.login()
- Acción de sesión, identidad o credenciales
- Modifica cookies HTTP de sesión

### [POST] /api/v1/auth/logout

Descripción: AuthController.logout

- Módulo: auth
- Controller: AuthController
- Handler: logout
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| message | string | sí | n/a | n/a | I18nHelper.getSuccess('LOGOUT_SUCCESS') |

#### Response error

- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 500

#### DTOs

- Request: n/a
- Response: { message: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Acción de sesión, identidad o credenciales

### [GET] /api/v1/auth/profile

Descripción: AuthController.getProfile

- Módulo: auth
- Controller: AuthController
- Handler: getProfile
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { id: string; username: string; rol: string; }
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 500

#### DTOs

- Request: n/a
- Response: { id: string; username: string; rol: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Acción de sesión, identidad o credenciales

### [POST] /api/v1/auth/register

Descripción: AuthController.register

- Módulo: auth
- Controller: AuthController
- Handler: register
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: RegisterUserDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| email | string | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { access_token: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 500

#### DTOs

- Request: RegisterUserDto
- Response: { access_token: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| email | string | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |

#### Side effects

- Delega en authService.register()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/auth/reset-password

Descripción: AuthController.resetPassword

- Módulo: auth
- Controller: AuthController
- Handler: resetPassword
- Fuente: backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ResetPasswordDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| token | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_TOKEN_DE_RECUPERACI_N_ES_REQUERIDO' )"}), IsString | n/a | n/a |
| newPassword | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.LA_NUEVA_CONTRASE_A_ES_REQUERIDA' )"}), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 500

#### DTOs

- Request: ResetPasswordDto
- Response: { message: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| token | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_TOKEN_DE_RECUPERACI_N_ES_REQUERIDO' )"}), IsString | n/a | n/a |
| newPassword | string | sí | IsNotEmpty({"message":"i18nValidationMessage( 'validation.LA_NUEVA_CONTRASE_A_ES_REQUERIDA' )"}), IsString | n/a | n/a |

#### Side effects

- Delega en authService.resetPassword()
- Acción de sesión, identidad o credenciales

## Módulo: core

### Controller: AppController

- Ruta base: /api/v1
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/app.controller.ts
- Endpoints: 1

### [GET] /api/v1

Descripción: AppController.getHello

- Módulo: core
- Controller: AppController
- Handler: getHello
- Fuente: backend/smart-economat-backend/src/app.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: string
- Envelope global: success, message, data, meta

#### Response error

- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 500

#### DTOs

- Request: n/a
- Response: string

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en appService.getHello()

## Módulo: dashboard

### Controller: DashboardController

- Ruta base: /api/v1/dashboard
- Tags Swagger: Dashboard
- Fuente: backend/smart-economat-backend/src/modules/dashboard/controller/dashboard.controller.ts
- Endpoints: 1

### [GET] /api/v1/dashboard/stats

Descripción: Get dashboard statistics (KPIs)

- Módulo: dashboard
- Controller: DashboardController
- Handler: getStats
- Fuente: backend/smart-economat-backend/src/modules/dashboard/controller/dashboard.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: dashboard:ver_estadisticas
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor, CacheInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: DashboardStatsDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| totalProductos | number | sí | IsNumber | n/a | n/a |
| productosEsteMes | number | sí | IsNumber | n/a | n/a |
| totalProveedores | number | sí | IsNumber | n/a | n/a |
| inventario | { valorTotal: number; totalItems: number; itemsBajoStock: number; } | sí | IsObject | n/a | n/a |
| pedidos | { pendientes: number; completadosHoy: number; costeTotalPendiente: number; incidencias: number; } | sí | IsObject | n/a | n/a |
| alertas | { porCaducar: number; caducados: number; } | sí | IsObject | n/a | n/a |
| movimientosRecientes | any[] | sí | n/a | n/a | n/a |

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: DashboardStatsDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en dashboardService.getStats()

## Módulo: distribucion

### Controller: DistribucionController

- Ruta base: /api/v1/distribuciones
- Tags Swagger: Distribuciones
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Endpoints: 6

### [GET] /api/v1/distribuciones

Descripción: Listar distribuciones

- Módulo: distribucion
- Controller: DistribucionController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: distribuciones:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Distribucion>
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Distribucion>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en distribucionService.findAll()

### [POST] /api/v1/distribuciones

Descripción: Preparar una distribución

- Módulo: distribucion
- Controller: DistribucionController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: distribuciones:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateDistribucionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoUsuarioId | string | sí | IsUUID | n/a | n/a |
| ubicacionOrigenId | string | no | IsOptional, IsUUID | n/a | n/a |
| ubicacionDestinoId | string | no | IsOptional, IsUUID | n/a | n/a |
| alumnoSlotId | string | no | IsOptional, IsUUID | n/a | n/a |
| observaciones | string | no | IsOptional, IsString | n/a | n/a |
| lineas | CreateDistribucionLineaDto[] | sí | IsArray, ArrayMinSize(1), ValidateNested({"each":true}), Type(() => CreateDistribucionLineaDto) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Distribucion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateDistribucionDto
- Response: Distribucion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoUsuarioId | string | sí | IsUUID | n/a | n/a |
| ubicacionOrigenId | string | no | IsOptional, IsUUID | n/a | n/a |
| ubicacionDestinoId | string | no | IsOptional, IsUUID | n/a | n/a |
| alumnoSlotId | string | no | IsOptional, IsUUID | n/a | n/a |
| observaciones | string | no | IsOptional, IsString | n/a | n/a |
| lineas | CreateDistribucionLineaDto[] | sí | IsArray, ArrayMinSize(1), ValidateNested({"each":true}), Type(() => CreateDistribucionLineaDto) | n/a | n/a |

#### Side effects

- Delega en distribucionService.create()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/distribuciones/:id

Descripción: Ver detalle de distribución

- Módulo: distribucion
- Controller: DistribucionController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: distribuciones:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Distribucion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Distribucion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en distribucionService.findOne()

### [PATCH] /api/v1/distribuciones/:id/cancelar

Descripción: Cancelar una distribución no confirmada

- Módulo: distribucion
- Controller: DistribucionController
- Handler: cancelar
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: distribuciones:cancelar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: CancelDistribucionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | no | IsOptional, IsString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Distribucion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CancelDistribucionDto
- Response: Distribucion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | no | IsOptional, IsString | n/a | n/a |

#### Side effects

- Delega en distribucionService.cancelar()
- Operación de actualización o transición de estado
- Cancela un flujo o agregado de negocio

### [PATCH] /api/v1/distribuciones/:id/confirmar

Descripción: Confirmar una distribución y mover stock

- Módulo: distribucion
- Controller: DistribucionController
- Handler: confirmar
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: distribuciones:confirmar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Distribucion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: Distribucion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en distribucionService.confirmar()
- Operación de actualización o transición de estado
- Ejecuta una transición explícita de negocio

### [GET] /api/v1/distribuciones/disponibles

Descripción: Listar pedidos de usuario distribuibles

- Módulo: distribucion
- Controller: DistribucionController
- Handler: findDisponibles
- Fuente: backend/smart-economat-backend/src/modules/distribucion/controller/distribucion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: distribuciones:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: DistribucionDisponibleDto[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: DistribucionDisponibleDto[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en distribucionService.findDisponibles()

## Módulo: export

### Controller: ExportController

- Ruta base: /api/v1/export
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Endpoints: 18

### [GET] /api/v1/export/albaranes/pdf

Descripción: ExportController.exportAlbaranesPdf

- Módulo: export
- Controller: ExportController
- Handler: exportAlbaranesPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamAlbaranesToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/albaranes/xlsx

Descripción: ExportController.exportAlbaranes

- Módulo: export
- Controller: ExportController
- Handler: exportAlbaranes
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamAlbaranesToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/incidencias/pdf

Descripción: ExportController.exportIncidenciasPdf

- Módulo: export
- Controller: ExportController
- Handler: exportIncidenciasPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| resuelta | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| soloNoResueltas | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| startDate | string | no | IsOptional, IsDateString | n/a | n/a |
| endDate | string | no | IsOptional, IsDateString | n/a | n/a |
| proveedorId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamIncidenciasToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/incidencias/xlsx

Descripción: ExportController.exportIncidencias

- Módulo: export
- Controller: ExportController
- Handler: exportIncidencias
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| resuelta | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| soloNoResueltas | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| startDate | string | no | IsOptional, IsDateString | n/a | n/a |
| endDate | string | no | IsOptional, IsDateString | n/a | n/a |
| proveedorId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamIncidenciasToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/inventario/pdf

Descripción: ExportController.exportInventarioPdf

- Módulo: export
- Controller: ExportController
- Handler: exportInventarioPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| bajoStock | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamInventarioToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/inventario/xlsx

Descripción: ExportController.exportInventario

- Módulo: export
- Controller: ExportController
- Handler: exportInventario
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| bajoStock | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamInventarioToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/movimientos/xlsx

Descripción: ExportController.exportMovimientos

- Módulo: export
- Controller: ExportController
- Handler: exportMovimientos
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoMovimiento | no | IsOptional, IsEnum(TipoMovimiento) | entrada, salida, ajuste, pedido, entrada_compra, salida_distribucion, entrada_distribucion, salida_elaboracion, produccion_consumo, produccion_resultado, salida_ajuste, merma | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamMovimientosToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/pedidos/pdf

Descripción: ExportController.exportPedidosPdf

- Módulo: export
- Controller: ExportController
- Handler: exportPedidosPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| estado | EstadoPedido | no | IsOptional, IsEnum(EstadoPedido) | pendiente_de_aprobacion, por_recepcionar, recepcionado, incidencia, parcial, cancelado | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamPedidosToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/pedidos/xlsx

Descripción: ExportController.exportPedidos

- Módulo: export
- Controller: ExportController
- Handler: exportPedidos
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| estado | EstadoPedido | no | IsOptional, IsEnum(EstadoPedido) | pendiente_de_aprobacion, por_recepcionar, recepcionado, incidencia, parcial, cancelado | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamPedidosToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/productos/pdf

Descripción: ExportController.exportProductosPdf

- Módulo: export
- Controller: ExportController
- Handler: exportProductosPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |
| minStock | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| alergenos | Alergeno[] | no | IsOptional, IsArray, IsEnum(Alergeno, {"each":true}), Transform(({ value }) => Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? value.split(',') : []) | n/a | n/a |
| categorias | TipoProducto[] | no | IsOptional, IsArray, IsEnum(TipoProducto, {"each":true}), Transform(({ value }) => Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? value.split(',') : []) | n/a | n/a |
| marcas | string[] | no | IsOptional, IsArray, IsString({"each":true}), Transform(({ value }) => Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? value.split(',') : []) | n/a | n/a |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamProductosToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/productos/xlsx

Descripción: ExportController.exportProductos

- Módulo: export
- Controller: ExportController
- Handler: exportProductos
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |
| minStock | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| alergenos | Alergeno[] | no | IsOptional, IsArray, IsEnum(Alergeno, {"each":true}), Transform(({ value }) => Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? value.split(',') : []) | n/a | n/a |
| categorias | TipoProducto[] | no | IsOptional, IsArray, IsEnum(TipoProducto, {"each":true}), Transform(({ value }) => Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? value.split(',') : []) | n/a | n/a |
| marcas | string[] | no | IsOptional, IsArray, IsString({"each":true}), Transform(({ value }) => Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? value.split(',') : []) | n/a | n/a |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamProductosToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/proveedores/pdf

Descripción: ExportController.exportProveedoresPdf

- Módulo: export
- Controller: ExportController
- Handler: exportProveedoresPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamProveedoresToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/proveedores/xlsx

Descripción: ExportController.exportProveedores

- Módulo: export
- Controller: ExportController
- Handler: exportProveedores
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamProveedoresToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/recepciones/xlsx

Descripción: ExportController.exportRecepciones

- Módulo: export
- Controller: ExportController
- Handler: exportRecepciones
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| estado | EstadoRecepcion | no | IsOptional, IsEnum(EstadoRecepcion) | COMPLETADA, CON_INCIDENCIAS | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamRecepcionesToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/recetas/pdf

Descripción: ExportController.exportRecetasPdf

- Módulo: export
- Controller: ExportController
- Handler: exportRecetasPdf
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| dificultad | DificultadReceta | no | IsOptional, IsEnum(DificultadReceta) | Fácil, Media, Difícil | n/a |
| maxTiempoMinutos | number | no | IsOptional, Type(() => Number), IsInt, Min(0) | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamRecetasToPdf()
- Devuelve stream/binario (application/pdf)

### [GET] /api/v1/export/recetas/xlsx

Descripción: ExportController.exportRecetas

- Módulo: export
- Controller: ExportController
- Handler: exportRecetas
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| dificultad | DificultadReceta | no | IsOptional, IsEnum(DificultadReceta) | Fácil, Media, Difícil | n/a |
| maxTiempoMinutos | number | no | IsOptional, Type(() => Number), IsInt, Min(0) | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamRecetasToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/ubicaciones/xlsx

Descripción: ExportController.exportUbicaciones

- Módulo: export
- Controller: ExportController
- Handler: exportUbicaciones
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamUbicacionesToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### [GET] /api/v1/export/usuarios/xlsx

Descripción: ExportController.exportUsuarios

- Módulo: export
- Controller: ExportController
- Handler: exportUsuarios
- Fuente: backend/smart-economat-backend/src/modules/export/controller/export.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| searchTerm | string | no | IsOptional, IsString | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| activo | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true') return true; if (value === 'false') return false; return value as boolean | undefined; }) | n/a | n/a |
| maxRows | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(10000) | n/a | 5000 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en exportService.streamUsuariosToExcel()
- Devuelve stream/binario (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

## Módulo: incidencia

### Controller: IncidenciaController

- Ruta base: /api/v1/incidencias
- Tags Swagger: incidencias
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Endpoints: 8

### [GET] /api/v1/incidencias

Descripción: IncidenciaController.findAll

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Incidencia>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Incidencia>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en incidenciaService.findAll()

### [POST] /api/v1/incidencias

Descripción: IncidenciaController.create

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateIncidenciaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recepcionId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V' )"}) | n/a | n/a |
| pedidoId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| observacionesRecepcion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Incidencia
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateIncidenciaDto
- Response: Incidencia

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recepcionId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V' )"}) | n/a | n/a |
| pedidoId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| observacionesRecepcion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Side effects

- Delega en incidenciaService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/incidencias/:id

Descripción: IncidenciaController.remove

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en incidenciaService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/incidencias/:id

Descripción: IncidenciaController.findOne

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Incidencia
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Incidencia

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en incidenciaService.findOne()

### [PATCH] /api/v1/incidencias/:id

Descripción: IncidenciaController.update

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateIncidenciaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observacionesRecepcion | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| recepcionId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V' )"}) | n/a | n/a |
| pedidoId | string | no | IsOptional, IsUUID(all) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Incidencia
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateIncidenciaDto
- Response: Incidencia

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observacionesRecepcion | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| recepcionId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V' )"}) | n/a | n/a |
| pedidoId | string | no | IsOptional, IsUUID(all) | n/a | n/a |

#### Side effects

- Delega en incidenciaService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/incidencias/:id/resolver

Descripción: IncidenciaController.resolver

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: resolver
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:resolver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: ResolverIncidenciaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| usuarioId | string | no | IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}) | n/a | n/a |
| observacionesResolucion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| marcarComoResuelta | boolean | no | IsOptional, Transform(({ value }) => toOptionalBoolean(value)) | n/a | n/a |
| lineas | ResolverIncidenciaLineaDto[] | no | IsOptional, IsArray, ValidateNested({"each":true}), Type(() => ResolverIncidenciaLineaDto) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Incidencia
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: ResolverIncidenciaDto
- Response: Incidencia

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| usuarioId | string | no | IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}) | n/a | n/a |
| observacionesResolucion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| marcarComoResuelta | boolean | no | IsOptional, Transform(({ value }) => toOptionalBoolean(value)) | n/a | n/a |
| lineas | ResolverIncidenciaLineaDto[] | no | IsOptional, IsArray, ValidateNested({"each":true}), Type(() => ResolverIncidenciaLineaDto) | n/a | n/a |

#### Side effects

- Delega en incidenciaService.resolverIncidencia()
- Operación de actualización o transición de estado
- Ejecuta una transición explícita de negocio

### [POST] /api/v1/incidencias/:id/resolver

Descripción: Resuelve una incidencia de forma transaccional

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: resolverTransaccional
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:resolver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: ResolveIncidenciaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| accion | TipoResolucion | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.REQUIRED')"}), IsEnum(TipoResolucion, {"message":"i18nValidationMessage('validation.INVALID_ENUM')"}) | aceptada, rechazada, parcial, devolucion, abono, cambio | n/a |
| observaciones | string | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.MUST_BE_STRING')"}) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Incidencia
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: ResolveIncidenciaDto
- Response: Incidencia

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| accion | TipoResolucion | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.REQUIRED')"}), IsEnum(TipoResolucion, {"message":"i18nValidationMessage('validation.INVALID_ENUM')"}) | aceptada, rechazada, parcial, devolucion, abono, cambio | n/a |
| observaciones | string | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.MUST_BE_STRING')"}) | n/a | n/a |

#### Side effects

- Delega en incidenciaService.resolverIncidenciaTransaccional()
- Operación de alta/acción de negocio con persistencia probable
- Ejecuta una transición explícita de negocio

### [POST] /api/v1/incidencias/reportar

Descripción: Reporta una nueva incidencia vinculada a una recepción

- Módulo: incidencia
- Controller: IncidenciaController
- Handler: reportar
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ReportIncidenciaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recepcionId | string | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.REQUIRED')"}), IsUUID(all, {"message":"i18nValidationMessage('validation.INVALID_UUID')"}) | n/a | n/a |
| tipo | TipoIncidencia | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.REQUIRED')"}), IsEnum(TipoIncidencia, {"message":"i18nValidationMessage('validation.INVALID_ENUM')"}) | rotura, caducado, falta_producto, exceso_producto, otro | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Incidencia
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: ReportIncidenciaDto
- Response: Incidencia

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recepcionId | string | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.REQUIRED')"}), IsUUID(all, {"message":"i18nValidationMessage('validation.INVALID_UUID')"}) | n/a | n/a |
| tipo | TipoIncidencia | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.REQUIRED')"}), IsEnum(TipoIncidencia, {"message":"i18nValidationMessage('validation.INVALID_ENUM')"}) | rotura, caducado, falta_producto, exceso_producto, otro | n/a |

#### Side effects

- Delega en incidenciaService.reportarIncidencia()
- Operación de alta/acción de negocio con persistencia probable

### Controller: IncidenciaResuelaController

- Ruta base: /api/v1/incidencias-resueltas
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia-resuelta.controller.ts
- Endpoints: 5

### [GET] /api/v1/incidencias-resueltas

Descripción: IncidenciaResuelaController.findAll

- Módulo: incidencia
- Controller: IncidenciaResuelaController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia-resuelta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<IncidenciaResuelta>
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<IncidenciaResuelta>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en incidenciaResuelaService.findAll()

### [POST] /api/v1/incidencias-resueltas

Descripción: IncidenciaResuelaController.create

- Módulo: incidencia
- Controller: IncidenciaResuelaController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia-resuelta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateIncidenciaResuelaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idIncidencia | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID' )"}) | n/a | n/a |
| idUsuarioResolutor | string | sí | IsUUID(all) | n/a | n/a |
| tipoResolucion | TipoResolucion | sí | IsEnum(TipoResolucion) | aceptada, rechazada, parcial, devolucion, abono, cambio | n/a |
| observaciones | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: IncidenciaResuelta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateIncidenciaResuelaDto
- Response: IncidenciaResuelta

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idIncidencia | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID' )"}) | n/a | n/a |
| idUsuarioResolutor | string | sí | IsUUID(all) | n/a | n/a |
| tipoResolucion | TipoResolucion | sí | IsEnum(TipoResolucion) | aceptada, rechazada, parcial, devolucion, abono, cambio | n/a |
| observaciones | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Side effects

- Delega en incidenciaResuelaService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/incidencias-resueltas/:id

Descripción: IncidenciaResuelaController.remove

- Módulo: incidencia
- Controller: IncidenciaResuelaController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia-resuelta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en incidenciaResuelaService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/incidencias-resueltas/:id

Descripción: IncidenciaResuelaController.findOne

- Módulo: incidencia
- Controller: IncidenciaResuelaController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia-resuelta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: IncidenciaResuelta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: IncidenciaResuelta

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en incidenciaResuelaService.findOne()

### [PATCH] /api/v1/incidencias-resueltas/:id

Descripción: IncidenciaResuelaController.update

- Módulo: incidencia
- Controller: IncidenciaResuelaController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/incidencia/controller/incidencia-resuelta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: incidencias:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateIncidenciaResuelaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observaciones | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| idIncidencia | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID' )"}) | n/a | n/a |
| idUsuarioResolutor | string | no | IsUUID(all) | n/a | n/a |
| tipoResolucion | TipoResolucion | no | IsEnum(TipoResolucion) | aceptada, rechazada, parcial, devolucion, abono, cambio | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: IncidenciaResuelta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateIncidenciaResuelaDto
- Response: IncidenciaResuelta

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observaciones | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| idIncidencia | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID' )"}) | n/a | n/a |
| idUsuarioResolutor | string | no | IsUUID(all) | n/a | n/a |
| tipoResolucion | TipoResolucion | no | IsEnum(TipoResolucion) | aceptada, rechazada, parcial, devolucion, abono, cambio | n/a |

#### Side effects

- Delega en incidenciaResuelaService.update()
- Operación de actualización o transición de estado

## Módulo: inventario

### Controller: AlertaController

- Ruta base: /api/v1/alertas
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/alerta.controller.ts
- Endpoints: 2

### [GET] /api/v1/alertas/caducidad

Descripción: AlertaController.alertasCaducidad

- Módulo: inventario
- Controller: AlertaController
- Handler: alertasCaducidad
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/alerta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: AlertaCaducidadDTO[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: AlertaCaducidadDTO[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en inventarioService.obtenerAlertasCaducidad()

### [GET] /api/v1/alertas/stock

Descripción: AlertaController.alertasStock

- Módulo: inventario
- Controller: AlertaController
- Handler: alertasStock
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/alerta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: AlertaStockDTO[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: AlertaStockDTO[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en inventarioService.obtenerAlertasStock()

### Controller: InventarioController

- Ruta base: /api/v1/inventario
- Tags Swagger: Inventario
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Endpoints: 7

### [GET] /api/v1/inventario

Descripción: InventarioController.findAll

- Módulo: inventario
- Controller: InventarioController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Inventario>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Inventario>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en inventarioService.findAll()

### [POST] /api/v1/inventario

Descripción: InventarioController.create

- Módulo: inventario
- Controller: InventarioController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateInventarioItemDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_ES_OBLIGATO' )"}) | n/a | n/a |
| cantidadActual | number | sí | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMinima | number | sí | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMaxima | number | no | IsOptional, Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| ubicacionId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_DEBE_SER_UN_UUID_V' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_ES_OBLIGATORIO' )"}) | n/a | n/a |
| fechaCaducidad | string | no | IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Inventario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateInventarioItemDto
- Response: Inventario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_ES_OBLIGATO' )"}) | n/a | n/a |
| cantidadActual | number | sí | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMinima | number | sí | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMaxima | number | no | IsOptional, Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| ubicacionId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_DEBE_SER_UN_UUID_V' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_ES_OBLIGATORIO' )"}) | n/a | n/a |
| fechaCaducidad | string | no | IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |

#### Side effects

- Delega en inventarioService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/inventario/:id

Descripción: InventarioController.remove

- Módulo: inventario
- Controller: InventarioController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en inventarioService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/inventario/:id

Descripción: InventarioController.findOne

- Módulo: inventario
- Controller: InventarioController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Inventario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Inventario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en inventarioService.findOne()

### [PATCH] /api/v1/inventario/:id

Descripción: InventarioController.update

- Módulo: inventario
- Controller: InventarioController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateInventarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_ES_OBLIGATO' )"}) | n/a | n/a |
| cantidadActual | number | no | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMinima | number | no | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMaxima | number | no | IsOptional, Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| ubicacionId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_DEBE_SER_UN_UUID_V' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_ES_OBLIGATORIO' )"}) | n/a | n/a |
| fechaCaducidad | string | no | IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Inventario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateInventarioDto
- Response: Inventario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_ES_OBLIGATO' )"}) | n/a | n/a |
| cantidadActual | number | no | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMinima | number | no | Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| cantidadMaxima | number | no | IsOptional, Type(() => Number), IsNumber({}, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_M_XIMA_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| ubicacionId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_DEBE_SER_UN_UUID_V' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_UBICACI_N_ES_OBLIGATORIO' )"}) | n/a | n/a |
| fechaCaducidad | string | no | IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |

#### Side effects

- Delega en inventarioService.update()
- Operación de actualización o transición de estado

### [POST] /api/v1/inventario/ajustes-manuales

Descripción: Registrar un ajuste manual de stock con auditoría

- Módulo: inventario
- Controller: InventarioController
- Handler: ajustarManual
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:ajustar_stock
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateMovimientoManualDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| inventarioId | string | sí | IsUUID(all), IsNotEmpty | n/a | n/a |
| tipo | TipoMovimientoManual | sí | IsEnum(TipoMovimientoManual) | entrada, ajuste, salida_ajuste | n/a |
| ajuste | number | sí | Type(() => Number), IsNumber | n/a | n/a |
| motivo | string | sí | IsString, IsNotEmpty, MaxLength(150) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString, MaxLength(500) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Inventario
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | sí | n/a | n/a | n/a |
| ubicacionId | string | sí | n/a | n/a | n/a |
| productoProveedor | ProductoProveedor | sí | n/a | n/a | n/a |
| cantidadActual | number | sí | n/a | n/a | n/a |
| cantidadMinima | number | sí | n/a | n/a | n/a |
| cantidadMaxima | number | null | no | n/a | n/a | n/a |
| ubicacion | Ubicacion | sí | n/a | n/a | n/a |
| fechaEntrada | Date (date-time) | sí | n/a | n/a | n/a |
| fechaCaducidad | Date | null (date-time) | no | n/a | n/a | n/a |
| ajustarCantidad | (delta: number) => void | sí | n/a | n/a | n/a |
| esBajoStock | () => boolean | sí | n/a | n/a | n/a |
| proximoACaducar | (diasUmbral?: number) => boolean | sí | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Datos inválidos para el ajuste
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: Inventario no encontrado
- 409: El ajuste deja el stock en negativo
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: CreateMovimientoManualDto
- Response: Inventario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| inventarioId | string | sí | IsUUID(all), IsNotEmpty | n/a | n/a |
| tipo | TipoMovimientoManual | sí | IsEnum(TipoMovimientoManual) | entrada, ajuste, salida_ajuste | n/a |
| ajuste | number | sí | Type(() => Number), IsNumber | n/a | n/a |
| motivo | string | sí | IsString, IsNotEmpty, MaxLength(150) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString, MaxLength(500) | n/a | n/a |

#### Side effects

- Delega en inventarioService.ajustarManual()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/inventario/stock

Descripción: InventarioController.queryStock

- Módulo: inventario
- Controller: InventarioController
- Handler: queryStock
- Fuente: backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: inventario:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | no | IsOptional, IsUUID(all, {"message":"i18nValidationMessage('validation.PRODUCTO_ID_UUIDV7_INVALIDO')"}) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID(all, {"message":"i18nValidationMessage('validation.UBICACION_ID_UUIDV7_INVALIDO')"}) | n/a | n/a |
| onlyLowStock | boolean | no | IsOptional, Transform(({ value }) => value === 'true' || value === true), IsBoolean({"message":"i18nValidationMessage('validation.ONLYLOWSTOCK_BOOLEAN')"}) | n/a | n/a |
| consolidado | boolean | no | IsOptional, Transform(({ value }) => value === 'true' || value === true), IsBoolean({"message":"i18nValidationMessage('validation.CONSOLIDADO_BOOLEAN')"}) | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: StockPorUbicacionDto[] | StockConsolidadoDto[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: StockPorUbicacionDto[] | StockConsolidadoDto[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en inventarioService.queryStock()

## Módulo: merma

### Controller: MermaController

- Ruta base: /api/v1/merma
- Tags Swagger: Merma
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Endpoints: 6

### [GET] /api/v1/merma

Descripción: Listar todas las mermas con paginación

- Módulo: merma
- Controller: MermaController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: merma:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Merma[]
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| cantidad | number | sí | n/a | n/a | n/a |
| motivo | MotivoMerma | sí | n/a | rotura, deterioro, hurto, error_preparacion, otros | n/a |
| tipo | TipoMerma | sí | n/a | recepcion, produccion, caducidad, rotura, inventario | n/a |
| notas | string | no | n/a | n/a | n/a |
| origenEntidad | string | no | n/a | n/a | n/a |
| origenId | string | no | n/a | n/a | n/a |
| referenciaId | string | no | n/a | n/a | n/a |
| idempotencyKey | string | no | n/a | n/a | n/a |
| producto | Producto | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Merma[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en mermaService.findAll()

### [POST] /api/v1/merma

Descripción: Registrar una merma y descontar stock del inventario

- Módulo: merma
- Controller: MermaController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: merma:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateMermaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | IsUUID(all) | n/a | n/a |
| cantidad | number | sí | Type(() => Number), IsNumber, Min(0.001) | n/a | n/a |
| motivo | MotivoMerma | sí | IsEnum(MotivoMerma) | rotura, deterioro, hurto, error_preparacion, otros | n/a |
| notas | string | no | optional (swagger), IsOptional, IsString, MaxLength(500) | n/a | n/a |
| tipo | TipoMerma | no | optional (swagger), IsOptional, IsEnum(TipoMerma) | recepcion, produccion, caducidad, rotura, inventario | n/a |
| origenEntidad | string | no | optional (swagger), IsOptional, IsString, MaxLength(50), Matches(/^[A-Za-z][A-Za-z0-9_]*$/, {"message":"origenEntidad must be alphanumeric snake-style"}) | n/a | n/a |
| origenId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| referenciaId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| idempotencyKey | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Merma
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| cantidad | number | sí | n/a | n/a | n/a |
| motivo | MotivoMerma | sí | n/a | rotura, deterioro, hurto, error_preparacion, otros | n/a |
| tipo | TipoMerma | sí | n/a | recepcion, produccion, caducidad, rotura, inventario | n/a |
| notas | string | no | n/a | n/a | n/a |
| origenEntidad | string | no | n/a | n/a | n/a |
| origenId | string | no | n/a | n/a | n/a |
| referenciaId | string | no | n/a | n/a | n/a |
| idempotencyKey | string | no | n/a | n/a | n/a |
| producto | Producto | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Stock insuficiente o datos inválidos
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: Producto no encontrado
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: CreateMermaDto
- Response: Merma

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | IsUUID(all) | n/a | n/a |
| cantidad | number | sí | Type(() => Number), IsNumber, Min(0.001) | n/a | n/a |
| motivo | MotivoMerma | sí | IsEnum(MotivoMerma) | rotura, deterioro, hurto, error_preparacion, otros | n/a |
| notas | string | no | optional (swagger), IsOptional, IsString, MaxLength(500) | n/a | n/a |
| tipo | TipoMerma | no | optional (swagger), IsOptional, IsEnum(TipoMerma) | recepcion, produccion, caducidad, rotura, inventario | n/a |
| origenEntidad | string | no | optional (swagger), IsOptional, IsString, MaxLength(50), Matches(/^[A-Za-z][A-Za-z0-9_]*$/, {"message":"origenEntidad must be alphanumeric snake-style"}) | n/a | n/a |
| origenId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| referenciaId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| idempotencyKey | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Side effects

- Delega en mermaService.create()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/merma/:id

Descripción: Obtener una merma por ID

- Módulo: merma
- Controller: MermaController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: merma:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Merma
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| cantidad | number | sí | n/a | n/a | n/a |
| motivo | MotivoMerma | sí | n/a | rotura, deterioro, hurto, error_preparacion, otros | n/a |
| tipo | TipoMerma | sí | n/a | recepcion, produccion, caducidad, rotura, inventario | n/a |
| notas | string | no | n/a | n/a | n/a |
| origenEntidad | string | no | n/a | n/a | n/a |
| origenId | string | no | n/a | n/a | n/a |
| referenciaId | string | no | n/a | n/a | n/a |
| idempotencyKey | string | no | n/a | n/a | n/a |
| producto | Producto | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: Merma no encontrada
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 500

#### DTOs

- Request: n/a
- Response: Merma

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en mermaService.findOne()

### [GET] /api/v1/merma/kpis

Descripción: Obtener KPIs de merma (cantidad perdida, referencia y porcentaje) con filtros temporales

- Módulo: merma
- Controller: MermaController
- Handler: getKpis
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: merma:stats
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| startDate | string | no | optional (swagger), IsOptional, IsDateString | n/a | n/a |
| endDate | string | no | optional (swagger), IsOptional, IsDateString | n/a | n/a |
| productoId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: MermaKpiResponse
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: MermaKpiResponse

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en mermaService.getKpis()

### [POST] /api/v1/merma/produccion/reportar

Descripción: Registrar merma de ingrediente desde un lote de producción sin modificar estados históricos

- Módulo: merma
- Controller: MermaController
- Handler: createFromProduccion
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: merma:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateMermaProduccionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| produccionLoteId | string | sí | IsUUID(all) | n/a | n/a |
| productoId | string | sí | IsUUID(all) | n/a | n/a |
| cantidad | number | sí | Type(() => Number), IsNumber, Min(0.001) | n/a | n/a |
| motivo | MotivoMerma | no | optional (swagger), IsOptional, IsEnum(MotivoMerma) | rotura, deterioro, hurto, error_preparacion, otros | error_preparacion |
| notas | string | no | optional (swagger), IsOptional, IsString, MaxLength(500) | n/a | n/a |
| idempotencyKey | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Merma
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| cantidad | number | sí | n/a | n/a | n/a |
| motivo | MotivoMerma | sí | n/a | rotura, deterioro, hurto, error_preparacion, otros | n/a |
| tipo | TipoMerma | sí | n/a | recepcion, produccion, caducidad, rotura, inventario | n/a |
| notas | string | no | n/a | n/a | n/a |
| origenEntidad | string | no | n/a | n/a | n/a |
| origenId | string | no | n/a | n/a | n/a |
| referenciaId | string | no | n/a | n/a | n/a |
| idempotencyKey | string | no | n/a | n/a | n/a |
| producto | Producto | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Ingrediente inválido para el lote
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: Lote de producción no encontrado
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: CreateMermaProduccionDto
- Response: Merma

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| produccionLoteId | string | sí | IsUUID(all) | n/a | n/a |
| productoId | string | sí | IsUUID(all) | n/a | n/a |
| cantidad | number | sí | Type(() => Number), IsNumber, Min(0.001) | n/a | n/a |
| motivo | MotivoMerma | no | optional (swagger), IsOptional, IsEnum(MotivoMerma) | rotura, deterioro, hurto, error_preparacion, otros | error_preparacion |
| notas | string | no | optional (swagger), IsOptional, IsString, MaxLength(500) | n/a | n/a |
| idempotencyKey | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Side effects

- Delega en mermaService.createFromProduccion()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/merma/stats

Descripción: Obtener estadísticas de merma por motivo y producto

- Módulo: merma
- Controller: MermaController
- Handler: getStats
- Fuente: backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: merma:stats
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { porMotivo: unknown[]; porProducto: unknown[]; }
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { porMotivo: unknown[]; porProducto: unknown[]; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en mermaService.getStats()

## Módulo: movimiento

### Controller: MovimientoController

- Ruta base: /api/v1/movimientos
- Tags Swagger: movimientos
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Endpoints: 6

### [GET] /api/v1/movimientos

Descripción: Listar todos los movimientos

- Módulo: movimiento
- Controller: MovimientoController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR, ALUMNO
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<any>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<any>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en movimientoService.findAll()

### [POST] /api/v1/movimientos

Descripción: Crear un nuevo movimiento

- Módulo: movimiento
- Controller: MovimientoController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateMovimientoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoMovimiento | sí | IsEnum(TipoMovimiento, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO' )"}) | entrada, salida, ajuste, pedido, entrada_compra, salida_distribucion, entrada_distribucion, salida_elaboracion, produccion_consumo, produccion_resultado, salida_ajuste, merma | n/a |
| cantidad | number | sí | IsInt({"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO_ENTERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| entidadTipo | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D' )"}) | n/a | n/a |
| entidadId | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE' )"}) | n/a | n/a |
| descripcion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| inventario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V' )"}), IsOptional | n/a | n/a |
| productoProveedor | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L' )"}), IsOptional | n/a | n/a |
| usuario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}), IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Movimiento
- Envelope global: success, message, data, meta

#### Response error

- 400: docs.DATOS_INV_LIDOS
- 401: Autenticación JWT requerida
- 403: docs.ACCESO_DENEGADO_ROL_INSUFICIENTE
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateMovimientoDto
- Response: Movimiento

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoMovimiento | sí | IsEnum(TipoMovimiento, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO' )"}) | entrada, salida, ajuste, pedido, entrada_compra, salida_distribucion, entrada_distribucion, salida_elaboracion, produccion_consumo, produccion_resultado, salida_ajuste, merma | n/a |
| cantidad | number | sí | IsInt({"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO_ENTERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| entidadTipo | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D' )"}) | n/a | n/a |
| entidadId | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE' )"}) | n/a | n/a |
| descripcion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| inventario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V' )"}), IsOptional | n/a | n/a |
| productoProveedor | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L' )"}), IsOptional | n/a | n/a |
| usuario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}), IsOptional | n/a | n/a |

#### Side effects

- Delega en movimientoService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/movimientos/:id

Descripción: Eliminar un movimiento (soft delete)

- Módulo: movimiento
- Controller: MovimientoController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: docs.ACCESO_DENEGADO_SOLO_ADMIN
- 404: docs.MOVIMIENTO_NO_ENCONTRADO
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en movimientoService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/movimientos/:id

Descripción: Obtener un movimiento por ID

- Módulo: movimiento
- Controller: MovimientoController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR, ALUMNO
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Movimiento
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: docs.MOVIMIENTO_NO_ENCONTRADO
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 500

#### DTOs

- Request: n/a
- Response: Movimiento

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en movimientoService.findOne()

### [PATCH] /api/v1/movimientos/:id

Descripción: Actualizar un movimiento

- Módulo: movimiento
- Controller: MovimientoController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateMovimientoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoMovimiento | no | IsEnum(TipoMovimiento, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO' )"}) | entrada, salida, ajuste, pedido, entrada_compra, salida_distribucion, entrada_distribucion, salida_elaboracion, produccion_consumo, produccion_resultado, salida_ajuste, merma | n/a |
| cantidad | number | no | IsInt({"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO_ENTERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| entidadTipo | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D' )"}) | n/a | n/a |
| entidadId | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE' )"}) | n/a | n/a |
| descripcion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| inventario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V' )"}), IsOptional | n/a | n/a |
| productoProveedor | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L' )"}), IsOptional | n/a | n/a |
| usuario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}), IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: UpdateResult
- Envelope global: success, message, data, meta

#### Response error

- 400: docs.DATOS_INV_LIDOS
- 401: Autenticación JWT requerida
- 403: docs.ACCESO_DENEGADO_SOLO_ADMIN
- 404: docs.MOVIMIENTO_NO_ENCONTRADO
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: UpdateMovimientoDto
- Response: UpdateResult

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoMovimiento | no | IsEnum(TipoMovimiento, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO' )"}) | entrada, salida, ajuste, pedido, entrada_compra, salida_distribucion, entrada_distribucion, salida_elaboracion, produccion_consumo, produccion_resultado, salida_ajuste, merma | n/a |
| cantidad | number | no | IsInt({"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO_ENTERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA' )"}) | n/a | n/a |
| entidadTipo | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D' )"}) | n/a | n/a |
| entidadId | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE' )"}) | n/a | n/a |
| descripcion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| inventario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V' )"}), IsOptional | n/a | n/a |
| productoProveedor | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L' )"}), IsOptional | n/a | n/a |
| usuario | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}), IsOptional | n/a | n/a |

#### Side effects

- Delega en movimientoService.update()
- Operación de actualización o transición de estado

### [GET] /api/v1/movimientos/historial

Descripción: Obtener historial de movimientos (Trazabilidad)

- Módulo: movimiento
- Controller: MovimientoController
- Handler: getMovimientoHistory
- Fuente: backend/smart-economat-backend/src/modules/movimiento/controller/movimiento.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| entityId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L' )"}), IsOptional | n/a | n/a |
| userId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID' )"}), IsOptional | n/a | n/a |
| type | TipoMovimiento | no | IsOptional, IsEnum(TipoMovimiento, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO' )"}) | entrada, salida, ajuste, pedido, entrada_compra, salida_distribucion, entrada_distribucion, salida_elaboracion, produccion_consumo, produccion_resultado, salida_ajuste, merma | n/a |
| startDate | string | no | IsOptional, IsDateString({}, {"message":"i18nValidationMessage( 'validation.LA_FECHA_DE_INICIO_DEBE_SER_UNA_FECHA_V' )"}) | n/a | n/a |
| endDate | string | no | IsOptional, IsDateString({}, {"message":"i18nValidationMessage( 'validation.LA_FECHA_DE_FIN_DEBE_SER_UNA_FECHA_V_LID' )"}) | n/a | n/a |
| sortBy | "createdAt" | "cantidad" | no | IsOptional, IsString({"message":"i18nValidationMessage( 'validation.EL_SORTEO_DEBE_SER_UNA_CADENA_V_LIDA' )"}) | createdAt, cantidad | n/a |
| sortOrder | "ASC" | "DESC" | no | IsOptional, IsEnum(["ASC","DESC"], {"message":"i18nValidationMessage('validation.EL_ORDEN_DEBE_SER_ASC_O_DESC')"}) | ASC, DESC | n/a |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(100) | n/a | 20 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Movimiento>
- Envelope global: success, message, data, meta

#### Response error

- 400: docs.PAR_METROS_INV_LIDOS_O_NO_PROPORCIONA_EN
- 401: Autenticación JWT requerida
- 403: docs.ACCESO_DENEGADO_ROL_INSUFICIENTE
- 404: docs.NO_SE_ENCONTRARON_MOVIMIENTOS_QUE_COINCI
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Movimiento>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en movimientoService.getMovimientoHistory()

## Módulo: openfoodfacts

### Controller: OpenFoodFactsController

- Ruta base: /api/v1/openfoodfacts
- Tags Swagger: OpenFoodFacts
- Fuente: backend/smart-economat-backend/src/modules/openfoodfacts/controller/openfoodfacts.controller.ts
- Endpoints: 2

### [GET] /api/v1/openfoodfacts/buscar

Descripción: Buscar productos en OpenFoodFacts por nombre

- Módulo: openfoodfacts
- Controller: OpenFoodFactsController
- Handler: searchByName
- Fuente: backend/smart-economat-backend/src/modules/openfoodfacts/controller/openfoodfacts.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ANY: productos:listar, productos:ver, inventario:listar, recepciones:listar, recepciones:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | n/a | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: OffProductResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| name | string | sí | n/a | n/a | n/a |
| brand | string | no | optional (swagger) | n/a | n/a |
| description | string | no | optional (swagger) | n/a | n/a |
| uom | string | no | optional (swagger) | n/a | n/a |
| quantity | number | no | optional (swagger) | n/a | n/a |
| allergens | string[] | no | optional (swagger) | n/a | n/a |
| imageUrl | string | no | optional (swagger) | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: OffProductResponseDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en openFoodFactsService.searchByName()

### [GET] /api/v1/openfoodfacts/producto/:codigoBarras

Descripción: Buscar un producto en OpenFoodFacts por código de barras

- Módulo: openfoodfacts
- Controller: OpenFoodFactsController
- Handler: searchByBarcode
- Fuente: backend/smart-economat-backend/src/modules/openfoodfacts/controller/openfoodfacts.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ANY: productos:listar, productos:ver, inventario:listar, recepciones:listar, recepciones:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| codigoBarras | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: OffProductResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| name | string | sí | n/a | n/a | n/a |
| brand | string | no | optional (swagger) | n/a | n/a |
| description | string | no | optional (swagger) | n/a | n/a |
| uom | string | no | optional (swagger) | n/a | n/a |
| quantity | number | no | optional (swagger) | n/a | n/a |
| allergens | string[] | no | optional (swagger) | n/a | n/a |
| imageUrl | string | no | optional (swagger) | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: OffProductResponseDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en openFoodFactsService.searchByBarcode()

## Módulo: pedido

### Controller: PedidoController

- Ruta base: /api/v1/pedidos
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Endpoints: 10

### [GET] /api/v1/pedidos

Descripción: PedidoController.findAll

- Módulo: pedido
- Controller: PedidoController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Pedido>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Pedido>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoService.findAll()

### [POST] /api/v1/pedidos

Descripción: PedidoController.create

- Módulo: pedido
- Controller: PedidoController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreatePedidoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | sí | IsNotEmpty, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(500, {"message":"i18nValidationMessage( 'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500' )"}) | n/a | n/a |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreatePedidoDto
- Response: Pedido

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | sí | IsNotEmpty, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(500, {"message":"i18nValidationMessage( 'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500' )"}) | n/a | n/a |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |

#### Side effects

- Delega en pedidoService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/pedidos/:id

Descripción: PedidoController.remove

- Módulo: pedido
- Controller: PedidoController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/pedidos/:id

Descripción: PedidoController.findOne

- Módulo: pedido
- Controller: PedidoController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Pedido

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoService.findOne()

### [PATCH] /api/v1/pedidos/:id

Descripción: PedidoController.update

- Módulo: pedido
- Controller: PedidoController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePedidoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(500, {"message":"i18nValidationMessage( 'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500' )"}) | n/a | n/a |
| lineas | CreatePedidoLineDto[] | no | optional (swagger), IsOptional, IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePedidoDto
- Response: Pedido

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(500, {"message":"i18nValidationMessage( 'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500' )"}) | n/a | n/a |
| lineas | CreatePedidoLineDto[] | no | optional (swagger), IsOptional, IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |

#### Side effects

- Delega en pedidoService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/pedidos/:id/aceptar

Descripción: PedidoController.aceptarPedido

- Módulo: pedido
- Controller: PedidoController
- Handler: aceptarPedido
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: Pedido

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoService.aceptarPedido()
- Operación de actualización o transición de estado
- Ejecuta una transición explícita de negocio

### [PATCH] /api/v1/pedidos/:id/cancelar

Descripción: PedidoController.cancelarPedido

- Módulo: pedido
- Controller: PedidoController
- Handler: cancelarPedido
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:cancelar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: CancelPedidoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | sí | IsString({"message":"i18nValidationMessage( 'validation.EL_MOTIVO_DE_CANCELACI_N_DEBE_SER_UNA_CA' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_MOTIVO_DE_CANCELACI_N_ES_OBLIGATORIO' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.EL_MOTIVO_DE_CANCELACI_N_NO_PUEDE_EXCEDE' )"}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CancelPedidoDto
- Response: Pedido

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | sí | IsString({"message":"i18nValidationMessage( 'validation.EL_MOTIVO_DE_CANCELACI_N_DEBE_SER_UNA_CA' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_MOTIVO_DE_CANCELACI_N_ES_OBLIGATORIO' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.EL_MOTIVO_DE_CANCELACI_N_NO_PUEDE_EXCEDE' )"}) | n/a | n/a |

#### Side effects

- Delega en pedidoService.cancelarPedido()
- Operación de actualización o transición de estado
- Cancela un flujo o agregado de negocio

### [PATCH] /api/v1/pedidos/:id/fecha-entrega

Descripción: PedidoController.updateFechaEntrega

- Módulo: pedido
- Controller: PedidoController
- Handler: updateFechaEntrega
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePedidoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(500, {"message":"i18nValidationMessage( 'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500' )"}) | n/a | n/a |
| lineas | CreatePedidoLineDto[] | no | optional (swagger), IsOptional, IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePedidoDto
- Response: Pedido

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(500, {"message":"i18nValidationMessage( 'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500' )"}) | n/a | n/a |
| lineas | CreatePedidoLineDto[] | no | optional (swagger), IsOptional, IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |

#### Side effects

- Delega en pedidoService.updateFechaEntrega()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/pedidos/:id/restaurar

Descripción: PedidoController.restaurarPedido

- Módulo: pedido
- Controller: PedidoController
- Handler: restaurarPedido
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:restaurar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Pedido

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoService.restaurarPedido()
- Operación de actualización o transición de estado

### [POST] /api/v1/pedidos/from-recipes

Descripción: PedidoController.createFromRecipes

- Módulo: pedido
- Controller: PedidoController
- Handler: createFromRecipes
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: GeneratePedidoFromRecetasDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA' )"}), IsUUID(all, {"each":true,"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO' )"}) | n/a | n/a |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Pedido
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: GeneratePedidoFromRecetasDto
- Response: Pedido

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA' )"}), IsUUID(all, {"each":true,"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO' )"}) | n/a | n/a |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Side effects

- Delega en recetaToPedidoService.generateFromRecetas()
- Operación de alta/acción de negocio con persistencia probable

### Controller: PedidoUsuarioController

- Ruta base: /api/v1/pedido-usuarios
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Endpoints: 11

### [GET] /api/v1/pedido-usuarios

Descripción: PedidoUsuarioController.findAll

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<PedidoUsuario>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<PedidoUsuario>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoUsuarioService.findAll()

### [POST] /api/v1/pedido-usuarios

Descripción: PedidoUsuarioController.create

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreatePedidoUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreatePedidoUsuarioDto
- Response: PedidoUsuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Side effects

- Delega en pedidoDraftService.saveAndFinalize()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/pedido-usuarios/:id

Descripción: PedidoUsuarioController.remove

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ANY: pedidos:eliminar, pedidos:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoUsuarioService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/pedido-usuarios/:id

Descripción: PedidoUsuarioController.findOne

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PedidoUsuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoUsuarioService.findOne()

### [PATCH] /api/v1/pedido-usuarios/:id

Descripción: PedidoUsuarioController.update

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePedidoUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePedidoUsuarioDto
- Response: PedidoUsuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Side effects

- Delega en pedidoUsuarioService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/pedido-usuarios/:id/aceptar

Descripción: PedidoUsuarioController.accept

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: accept
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: PedidoUsuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoUsuarioService.accept()
- Operación de actualización o transición de estado
- Ejecuta una transición explícita de negocio

### [PATCH] /api/v1/pedido-usuarios/:id/cancelar

Descripción: PedidoUsuarioController.cancel

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: cancel
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:cancelar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: CancelPedidoUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CancelPedidoUsuarioDto
- Response: PedidoUsuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Side effects

- Delega en pedidoUsuarioService.cancel()
- Operación de actualización o transición de estado
- Cancela un flujo o agregado de negocio

### [GET] /api/v1/pedido-usuarios/:id/pdf

Descripción: PedidoUsuarioController.generatePdf

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: generatePdf
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| incluirCancelados | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| paginaPorProveedor | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pdfReportService.generateReport()
- Devuelve stream/binario (application/pdf)

### [PATCH] /api/v1/pedido-usuarios/:id/restaurar

Descripción: PedidoUsuarioController.restore

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: restore
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:restaurar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: PedidoUsuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoUsuarioService.restore()
- Operación de actualización o transición de estado

### [POST] /api/v1/pedido-usuarios/from-missing-stock

Descripción: PedidoUsuarioController.createFromMissingStock

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: createFromMissingStock
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateMissingStockBatchDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| items | ValidarItemDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => ValidarItemDto) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateMissingStockBatchDto
- Response: PedidoUsuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| items | ValidarItemDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => ValidarItemDto) | n/a | n/a |

#### Side effects

- Delega en purchaseBatchService.buildPedidoUsuarioDtoFromMissingStock(), pedidoUsuarioService.create()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/pedido-usuarios/from-recipes

Descripción: PedidoUsuarioController.createFromRecipes

- Módulo: pedido
- Controller: PedidoUsuarioController
- Handler: createFromRecipes
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: GeneratePedidoFromRecetasDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA' )"}), IsUUID(all, {"each":true,"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO' )"}) | n/a | n/a |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: GeneratePedidoFromRecetasDto
- Response: PedidoUsuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA' )"}), IsUUID(all, {"each":true,"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO' )"}) | n/a | n/a |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Side effects

- Delega en recetaToPedidoService.buildBatchOrderFromRecetas(), pedidoUsuarioService.create()
- Operación de alta/acción de negocio con persistencia probable

### Controller: PurchaseBatchController

- Ruta base: /api/v1/purchase-batches
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Endpoints: 12

### [GET] /api/v1/purchase-batches

Descripción: PurchaseBatchController.findAll

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PurchaseBatch[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en batchService.findAll()

### [POST] /api/v1/purchase-batches

Descripción: PurchaseBatchController.create

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreatePurchaseBatchDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreatePurchaseBatchDto
- Response: PurchaseBatch

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Side effects

- Delega en batchService.createBatchOrder()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/purchase-batches/:id

Descripción: PurchaseBatchController.findOne

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PurchaseBatch

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en batchService.findOne()

### [PATCH] /api/v1/purchase-batches/:id

Descripción: PurchaseBatchController.update

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePurchaseBatchDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePurchaseBatchDto
- Response: PurchaseBatch

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| lineas | CreatePedidoLineDto[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA' )"}), ValidateNested({"each":true}), Type(() => CreatePedidoLineDto) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Side effects

- Delega en batchService.updateBatchOrder()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/purchase-batches/:id/aceptar

Descripción: PurchaseBatchController.accept

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: accept
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: PurchaseBatch

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en batchService.approveBatchOrder()
- Operación de actualización o transición de estado
- Ejecuta una transición explícita de negocio

### [PATCH] /api/v1/purchase-batches/:id/cancelar

Descripción: PurchaseBatchController.cancel

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: cancel
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:cancelar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: CancelPurchaseBatchDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CancelPurchaseBatchDto
- Response: PurchaseBatch

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| motivoCancelacion | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Side effects

- Delega en batchService.cancelBatchOrder()
- Operación de actualización o transición de estado
- Cancela un flujo o agregado de negocio

### [GET] /api/v1/purchase-batches/:id/pdf

Descripción: PurchaseBatchController.generatePdf

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: generatePdf
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoReportePdf | no | IsOptional, IsEnum(TipoReportePdf) | pedido, incidencias, recepcion | n/a |
| pedidoId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| startDate | string | no | IsOptional, IsDateString | n/a | n/a |
| endDate | string | no | IsOptional, IsDateString | n/a | n/a |
| proveedorId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| soloNoResueltas | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => value === 'true' || value === true) | n/a | n/a |
| tipoDiferencia | TipoDiferencia | no | IsOptional, IsEnum(TipoDiferencia) | FALTANTE, EXCESO, DEFECTUOSO | n/a |
| batchId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| pedidoUsuarioId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| incluirCancelados | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true' || value === true || value === '1') return true; return false; }) | n/a | n/a |
| paginaPorProveedor | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true' || value === true || value === '1') return true; return false; }) | n/a | n/a |
| recepcionId | string | no | IsOptional, IsUUID(all) | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pdfReportService.generateReport()
- Devuelve stream/binario (application/pdf)

### [PATCH] /api/v1/purchase-batches/:id/restaurar

Descripción: PurchaseBatchController.restore

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: restore
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:restaurar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: PurchaseBatch

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en batchService.restoreBatchOrder()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/purchase-batches/:id/tramitar

Descripción: PurchaseBatchController.markAsProcessed

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: markAsProcessed
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: PurchaseBatch

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en batchService.acceptBatchOrder()
- Operación de actualización o transición de estado
- Ejecuta una transición explícita de negocio

### [POST] /api/v1/purchase-batches/consolidate

Descripción: PurchaseBatchController.consolidate

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: consolidate
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ConsolidatePurchaseBatchDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoUsuarioIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEBES_SELECCIONAR_AL_MENOS_UN_PEDIDO' )"}), IsUUID(all, {"each":true}), Type(() => String) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 500

#### DTOs

- Request: ConsolidatePurchaseBatchDto
- Response: PurchaseBatch

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoUsuarioIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEBES_SELECCIONAR_AL_MENOS_UN_PEDIDO' )"}), IsUUID(all, {"each":true}), Type(() => String) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| ubicacionEntregaSugeridaId | string | no | optional (swagger), IsOptional, IsUUID(7) | n/a | n/a |

#### Side effects

- Delega en batchService.consolidateExistingOrders()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/purchase-batches/from-missing-stock

Descripción: PurchaseBatchController.createFromMissingStock

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: createFromMissingStock
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateMissingStockBatchDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| items | ValidarItemDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => ValidarItemDto) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateMissingStockBatchDto
- Response: PurchaseBatch

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |
| items | ValidarItemDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => ValidarItemDto) | n/a | n/a |

#### Side effects

- Delega en batchService.createBatchOrderFromMissingStock()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/purchase-batches/from-recipes

Descripción: PurchaseBatchController.createFromRecipes

- Módulo: pedido
- Controller: PurchaseBatchController
- Handler: createFromRecipes
- Fuente: backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: pedidos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: GeneratePedidoFromRecetasDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA' )"}), IsUUID(all, {"each":true,"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO' )"}) | n/a | n/a |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PurchaseBatch
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: GeneratePedidoFromRecetasDto
- Response: PurchaseBatch

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaIds | string[] | sí | IsArray, ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA' )"}), IsUUID(all, {"each":true,"message":"i18nValidationMessage( 'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO' )"}) | n/a | n/a |
| proveedorId | string | no | optional (swagger), IsOptional, IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L' )"}) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |

#### Side effects

- Delega en recetaToPedidoService.buildBatchOrderFromRecetas(), batchService.createBatchOrder()
- Operación de alta/acción de negocio con persistencia probable

## Módulo: pedido-draft

### Controller: PedidoDraftController

- Ruta base: /api/v1/pedido/draft
- Tags Swagger: Pedido Draft
- Fuente: backend/smart-economat-backend/src/modules/pedido-draft/controller/pedido-draft.controller.ts
- Endpoints: 4

### [DELETE] /api/v1/pedido/draft

Descripción: Eliminar el borrador activo de creación de pedido

- Módulo: pedido-draft
- Controller: PedidoDraftController
- Handler: clearDraft
- Fuente: backend/smart-economat-backend/src/modules/pedido-draft/controller/pedido-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 401
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoDraftService.clearDraft()
- Operación de eliminación o baja lógica

### [GET] /api/v1/pedido/draft

Descripción: Recuperar el borrador de creación de pedido más reciente

- Módulo: pedido-draft
- Controller: PedidoDraftController
- Handler: getLatestDraft
- Fuente: backend/smart-economat-backend/src/modules/pedido-draft/controller/pedido-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoDraftResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | no | optional (swagger) | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |
| source | "redis" | "database" | sí | n/a | redis, database | n/a |
| createdAt | string | sí | n/a | n/a | n/a |
| updatedAt | string | sí | n/a | n/a | n/a |
| expiresAt | string | null | no | optional (swagger) | n/a | n/a |
| payload | Record<string, unknown> | sí | n/a | n/a | n/a |

#### Response error

- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 500

#### DTOs

- Request: n/a
- Response: PedidoDraftResponseDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoDraftService.getLatestDraft()

### [POST] /api/v1/pedido/draft

Descripción: Crear o actualizar el borrador seguro de creación de pedido

- Módulo: pedido-draft
- Controller: PedidoDraftController
- Handler: saveDraft
- Fuente: backend/smart-economat-backend/src/modules/pedido-draft/controller/pedido-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: UpsertPedidoDraftDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| payload | Record<string, unknown> | sí | IsObject | n/a | n/a |
| version | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PedidoDraftResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | no | optional (swagger) | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |
| source | "redis" | "database" | sí | n/a | redis, database | n/a |
| createdAt | string | sí | n/a | n/a | n/a |
| updatedAt | string | sí | n/a | n/a | n/a |
| expiresAt | string | null | no | optional (swagger) | n/a | n/a |
| payload | Record<string, unknown> | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 500

#### DTOs

- Request: UpsertPedidoDraftDto
- Response: PedidoDraftResponseDto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| payload | Record<string, unknown> | sí | IsObject | n/a | n/a |
| version | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |

#### Side effects

- Delega en pedidoDraftService.upsertDraft()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/pedido/draft/finalize

Descripción: Finalizar la creación del pedido a partir del borrador persistido

- Módulo: pedido-draft
- Controller: PedidoDraftController
- Handler: finalizeOrder
- Fuente: backend/smart-economat-backend/src/modules/pedido-draft/controller/pedido-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PedidoUsuario
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| usuarioId | string | no | n/a | n/a | n/a |
| numeroGlobal | string | sí | n/a | n/a | n/a |
| fechaPedido | Date (date-time) | sí | n/a | n/a | n/a |
| fechaEntrega | Date (date-time) | no | n/a | n/a | n/a |
| observaciones | string | no | n/a | n/a | n/a |
| costeTotal | number | sí | n/a | n/a | n/a |
| estado | EstadoPedidoUsuario | sí | n/a | borrador, pendiente, aprobado, cancelado, consolidado | n/a |
| ubicacionEntregaSugeridaId | string | no | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| ubicacionEntregaSugerida | Ubicacion | no | n/a | n/a | n/a |
| lineas | PedidoUsuarioLinea[] | sí | n/a | n/a | n/a |
| pedidos | Pedido[] | sí | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 401: Autenticación JWT requerida
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 201
- 401
- 409
- 500

#### DTOs

- Request: n/a
- Response: PedidoUsuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pedidoDraftService.finalizeOrder()
- Operación de alta/acción de negocio con persistencia probable

## Módulo: plantillas-roles

### Controller: PlantillasRolesController

- Ruta base: /api/v1/plantillas-roles
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Endpoints: 8

### [GET] /api/v1/plantillas-roles

Descripción: PlantillasRolesController.findAll

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PlantillaRol[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PlantillaRol[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en plantillasRolesService.findAll()

### [POST] /api/v1/plantillas-roles

Descripción: PlantillasRolesController.create

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreatePlantillaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | IsString, IsNotEmpty, MaxLength(100) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsString, IsOptional | n/a | n/a |
| esEditable | boolean | no | optional (swagger), IsBoolean, IsOptional | n/a | true |
| plantillaPadreId | string | no | optional (swagger), IsUUID(7), IsOptional | n/a | n/a |
| permisoIds | string[] | no | optional (swagger), IsArray, IsUUID(7, {"each":true}), IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: PlantillaRol
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreatePlantillaDto
- Response: PlantillaRol

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | IsString, IsNotEmpty, MaxLength(100) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsString, IsOptional | n/a | n/a |
| esEditable | boolean | no | optional (swagger), IsBoolean, IsOptional | n/a | true |
| plantillaPadreId | string | no | optional (swagger), IsUUID(7), IsOptional | n/a | n/a |
| permisoIds | string[] | no | optional (swagger), IsArray, IsUUID(7, {"each":true}), IsOptional | n/a | n/a |

#### Side effects

- Delega en plantillasRolesService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/plantillas-roles/:id

Descripción: PlantillasRolesController.remove

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: { message: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en plantillasRolesService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/plantillas-roles/:id

Descripción: PlantillasRolesController.findOne

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PlantillaRol
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PlantillaRol

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en plantillasRolesService.findOne()

### [PATCH] /api/v1/plantillas-roles/:id

Descripción: PlantillasRolesController.update

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePlantillaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | IsString, IsNotEmpty, MaxLength(100) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsString, IsOptional | n/a | n/a |
| esEditable | boolean | no | optional (swagger), IsBoolean, IsOptional | n/a | true |
| plantillaPadreId | string | no | optional (swagger), IsUUID(7), IsOptional | n/a | n/a |
| permisoIds | string[] | no | optional (swagger), IsArray, IsUUID(7, {"each":true}), IsOptional | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PlantillaRol
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePlantillaDto
- Response: PlantillaRol

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | IsString, IsNotEmpty, MaxLength(100) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsString, IsOptional | n/a | n/a |
| esEditable | boolean | no | optional (swagger), IsBoolean, IsOptional | n/a | true |
| plantillaPadreId | string | no | optional (swagger), IsUUID(7), IsOptional | n/a | n/a |
| permisoIds | string[] | no | optional (swagger), IsArray, IsUUID(7, {"each":true}), IsOptional | n/a | n/a |

#### Side effects

- Delega en plantillasRolesService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/plantillas-roles/:id/activo

Descripción: PlantillasRolesController.setActivo

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: setActivo
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePlantillaActivoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| activo | boolean | sí | IsBoolean | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: unknown
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: UpdatePlantillaActivoDto
- Response: unknown

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| activo | boolean | sí | IsBoolean | n/a | n/a |

#### Side effects

- Operación de actualización o transición de estado

### [POST] /api/v1/plantillas-roles/:id/duplicar

Descripción: PlantillasRolesController.duplicate

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: duplicate
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: DuplicatePlantillaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | optional (swagger), IsOptional, IsString, MaxLength(100) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: unknown
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: DuplicatePlantillaDto
- Response: unknown

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | optional (swagger), IsOptional, IsString, MaxLength(100) | n/a | n/a |

#### Side effects

- Operación de alta/acción de negocio con persistencia probable

### [PATCH] /api/v1/plantillas-roles/:id/permisos

Descripción: PlantillasRolesController.updatePermisos

- Módulo: plantillas-roles
- Controller: PlantillasRolesController
- Handler: updatePermisos
- Fuente: backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePlantillaPermisosDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| permisoIds | string[] | sí | IsArray, IsUUID(7, {"each":true}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PlantillaRol
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePlantillaPermisosDto
- Response: PlantillaRol

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| permisoIds | string[] | sí | IsArray, IsUUID(7, {"each":true}) | n/a | n/a |

#### Side effects

- Delega en plantillasRolesService.updatePermisos()
- Operación de actualización o transición de estado

## Módulo: preparacion

### Controller: PreparacionController

- Ruta base: /api/v1/preparaciones
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Endpoints: 7

### [GET] /api/v1/preparaciones

Descripción: PreparacionController.findAll

- Módulo: preparacion
- Controller: PreparacionController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Preparacion>
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Preparacion>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en preparacionService.findAll()

### [POST] /api/v1/preparaciones

Descripción: PreparacionController.create

- Módulo: preparacion
- Controller: PreparacionController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreatePreparacionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | IsUUID | n/a | n/a |
| cantidadAProducir | number | sí | IsNumber({"maxDecimalPlaces":3}), Min(0.001) | n/a | n/a |
| fechaProgramada | string | no | optional (swagger), IsOptional, IsDateString | n/a | n/a |
| ubicacionDestinoId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Preparacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 409
- 500

#### DTOs

- Request: CreatePreparacionDto
- Response: Preparacion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | IsUUID | n/a | n/a |
| cantidadAProducir | number | sí | IsNumber({"maxDecimalPlaces":3}), Min(0.001) | n/a | n/a |
| fechaProgramada | string | no | optional (swagger), IsOptional, IsDateString | n/a | n/a |
| ubicacionDestinoId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, IsString | n/a | n/a |

#### Side effects

- Delega en preparacionService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/preparaciones/:id

Descripción: PreparacionController.remove

- Módulo: preparacion
- Controller: PreparacionController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en preparacionService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/preparaciones/:id

Descripción: PreparacionController.findOne

- Módulo: preparacion
- Controller: PreparacionController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Preparacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 500

#### DTOs

- Request: n/a
- Response: Preparacion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en preparacionService.findOne()

### [PATCH] /api/v1/preparaciones/:id/cancelar

Descripción: PreparacionController.cancelar

- Módulo: preparacion
- Controller: PreparacionController
- Handler: cancelar
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Preparacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 409
- 500

#### DTOs

- Request: n/a
- Response: Preparacion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en preparacionService.cancelarPreparacion()
- Operación de actualización o transición de estado
- Cancela un flujo o agregado de negocio

### [PATCH] /api/v1/preparaciones/:id/finalizar

Descripción: PreparacionController.finalizar

- Módulo: preparacion
- Controller: PreparacionController
- Handler: finalizar
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: inline-body
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| ubicacionDestinoId | string | no | n/a | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Preparacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 409
- 500

#### DTOs

- Request: inline-body
- Response: Preparacion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| ubicacionDestinoId | string | no | n/a | n/a | n/a |

#### Side effects

- Delega en preparacionService.finalizarPreparacion()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/preparaciones/:id/iniciar

Descripción: PreparacionController.iniciar

- Módulo: preparacion
- Controller: PreparacionController
- Handler: iniciar
- Fuente: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Preparacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 500

#### DTOs

- Request: n/a
- Response: Preparacion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en preparacionService.iniciarPreparacion()
- Operación de actualización o transición de estado

## Módulo: producto

### Controller: HistorialPrecioController

- Ruta base: /api/v1/historial-precio
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/historial-precio.controller.ts
- Endpoints: 5

### [GET] /api/v1/historial-precio

Descripción: HistorialPrecioController.findAll

- Módulo: producto
- Controller: HistorialPrecioController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/historial-precio.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| order | "ASC" | "DESC" | sí | n/a | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: HistorialPrecio[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: HistorialPrecio[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en historialPrecioService.findAll()

### [POST] /api/v1/historial-precio

Descripción: HistorialPrecioController.create

- Módulo: producto
- Controller: HistorialPrecioController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/historial-precio.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateHistorialPrecioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN_1' )"}) | n/a | n/a |
| precio | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0.01, {"message":"i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0')"}) | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional, Type(() => Date) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: HistorialPrecio
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateHistorialPrecioDto
- Response: HistorialPrecio

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN_1' )"}) | n/a | n/a |
| precio | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0.01, {"message":"i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0')"}) | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional, Type(() => Date) | n/a | n/a |

#### Side effects

- Delega en historialPrecioService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/historial-precio/:id

Descripción: HistorialPrecioController.remove

- Módulo: producto
- Controller: HistorialPrecioController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/historial-precio.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en historialPrecioService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/historial-precio/:id

Descripción: HistorialPrecioController.findOne

- Módulo: producto
- Controller: HistorialPrecioController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/historial-precio.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: HistorialPrecio
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: HistorialPrecio

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en historialPrecioService.findOne()

### [PATCH] /api/v1/historial-precio/:id

Descripción: HistorialPrecioController.update

- Módulo: producto
- Controller: HistorialPrecioController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/historial-precio.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateHistorialPrecioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN_1' )"}) | n/a | n/a |
| precio | number | no | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0.01, {"message":"i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0')"}) | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional, Type(() => Date) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: HistorialPrecio
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateHistorialPrecioDto
- Response: HistorialPrecio

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | no | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN_1' )"}) | n/a | n/a |
| precio | number | no | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0.01, {"message":"i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0')"}) | n/a | n/a |
| fecha | Date (date-time) | no | IsOptional, Type(() => Date) | n/a | n/a |

#### Side effects

- Delega en historialPrecioService.update()
- Operación de actualización o transición de estado

### Controller: ProductoAlergenoController

- Ruta base: /api/v1/producto-alergenos
- Tags Swagger: Producto Alérgenos
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-alergeno.controller.ts
- Endpoints: 5

### [GET] /api/v1/producto-alergenos

Descripción: Listar asociaciones producto-alérgeno

- Módulo: producto
- Controller: ProductoAlergenoController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-alergeno.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idProducto | string | no | n/a | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProductoAlergeno[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: ProductoAlergeno[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoAlergenoService.findAll()

### [POST] /api/v1/producto-alergenos

Descripción: Crear una asociación entre producto y alérgeno

- Módulo: producto
- Controller: ProductoAlergenoController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-alergeno.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateProductoAlergenoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idProducto | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_DEBE_SER_UN_UUID_V_LI' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_ES_OBLIGATORIO' )"}) | n/a | n/a |
| alergeno | Alergeno | sí | IsEnum(Alergeno, {"message":"i18nValidationMessage( 'validation.EL_AL_RGENO_INDICADO_NO_ES_V_LIDO' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_AL_RGENO_ES_OBLIGATORIO')"}) | GLUTEN, CRUSTACEOS, HUEVOS, PESCADO, CACAHUETES, SOJA, LACTEOS, FRUTOS_CON_CASCARA, APIO, MOSTAZA, SESAMO, SULFITO, ALTRAMUCES, MOLUSCOS | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: ProductoAlergeno
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateProductoAlergenoDto
- Response: ProductoAlergeno

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idProducto | string | sí | IsUUID(all, {"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_DEBE_SER_UN_UUID_V_LI' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_ID_DEL_PRODUCTO_ES_OBLIGATORIO' )"}) | n/a | n/a |
| alergeno | Alergeno | sí | IsEnum(Alergeno, {"message":"i18nValidationMessage( 'validation.EL_AL_RGENO_INDICADO_NO_ES_V_LIDO' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_AL_RGENO_ES_OBLIGATORIO')"}) | GLUTEN, CRUSTACEOS, HUEVOS, PESCADO, CACAHUETES, SOJA, LACTEOS, FRUTOS_CON_CASCARA, APIO, MOSTAZA, SESAMO, SULFITO, ALTRAMUCES, MOLUSCOS | n/a |

#### Side effects

- Delega en productoAlergenoService.create()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/producto-alergenos/:id

Descripción: Obtener los alérgenos de un producto

- Módulo: producto
- Controller: ProductoAlergenoController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-alergeno.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProductoAlergeno[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: ProductoAlergeno[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoAlergenoService.findOne()

### [PATCH] /api/v1/producto-alergenos/:id

Descripción: Reemplazar completamente los alérgenos de un producto

- Módulo: producto
- Controller: ProductoAlergenoController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-alergeno.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateProductoAlergenoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| alergenos | Alergeno[] | sí | IsArray({"message":"i18nValidationMessage( 'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY' )"}), ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.LA_LISTA_DE_AL_RGENOS_NO_PUEDE_ESTAR_VAC' )"}), IsEnum(Alergeno, {"each":true,"message":"i18nValidationMessage( 'validation.UNO_O_M_S_AL_RGENOS_INDICADOS_NO_SON_V_L' )"}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProductoAlergeno[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateProductoAlergenoDto
- Response: ProductoAlergeno[]

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| alergenos | Alergeno[] | sí | IsArray({"message":"i18nValidationMessage( 'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY' )"}), ArrayNotEmpty({"message":"i18nValidationMessage( 'validation.LA_LISTA_DE_AL_RGENOS_NO_PUEDE_ESTAR_VAC' )"}), IsEnum(Alergeno, {"each":true,"message":"i18nValidationMessage( 'validation.UNO_O_M_S_AL_RGENOS_INDICADOS_NO_SON_V_L' )"}) | n/a | n/a |

#### Side effects

- Delega en productoAlergenoService.update()
- Operación de actualización o transición de estado

### [DELETE] /api/v1/producto-alergenos/:idProducto/:alergeno

Descripción: Eliminar una asociación concreta entre producto y alérgeno

- Módulo: producto
- Controller: ProductoAlergenoController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-alergeno.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idProducto | string | sí | ParseUUIDv7Pipe | n/a | n/a |
| alergeno | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoAlergenoService.remove()
- Operación de eliminación o baja lógica

### Controller: ProductoController

- Ruta base: /api/v1/productos
- Tags Swagger: Productos
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Endpoints: 8

### [GET] /api/v1/productos

Descripción: Listar productos con filtros y paginación

- Módulo: producto
- Controller: ProductoController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Producto>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Producto>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoService.findAll()

### [POST] /api/v1/productos

Descripción: Alta compleja de producto maestro con alérgenos y proveedores en una sola operación

- Módulo: producto
- Controller: ProductoController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateProductoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_NOMBRE_ES_OBLIGATORIO')"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC' )"}) | n/a | n/a |
| marca | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.LA_MARCA_NO_PUEDE_EXCEDER_LOS_100_CARACT' )"}) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| unidad | UnidadMedida | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.LA_UNIDAD_DEL_PRODUCTO_ES_OBL')"}), IsEnum(UnidadMedida, {"message":"i18nValidationMessage( 'validation.LA_UNIDAD_DEL_PRODUCTO_NO_ES_V_LIDA' )"}) | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | optional (swagger), IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |
| pathImg | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_DEBE_SER_UNA_CADENA' )"}), MaxLength(200, {"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| tipo | TipoProducto | no | optional (swagger), IsOptional, IsEnum(TipoProducto, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_PRODUCTO_NO_ES_V_LIDO' )"}) | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | optional (swagger), IsOptional, Transform((params) => UppercaseStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA' )"}), MaxLength(130, {"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS' )"}) | n/a | n/a |
| contenido | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_NO_PUEDE_SER_NEGATIVO' )"}) | n/a | n/a |
| alergenos | Alergeno[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY' )"}), IsEnum(Alergeno, {"each":true,"message":"i18nValidationMessage('validation.AL_RGENO_NO_V_LIDO')"}) | n/a | n/a |
| proveedores | AddProveedorToProductoDto[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_PROVEEDORES_DEBEN_SER_UN_ARRAY' )"}), ValidateNested({"each":true}), Type(() => AddProveedorToProductoDto) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Producto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | n/a | n/a | n/a |
| marca | string | no | n/a | n/a | n/a |
| descripcion | string | no | n/a | n/a | n/a |
| unidad | UnidadMedida | no | n/a | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | n/a | n/a | n/a |
| pathImg | string | no | n/a | n/a | n/a |
| tipo | TipoProducto | no | n/a | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | n/a | n/a | n/a |
| contenido | number | sí | n/a | n/a | n/a |
| pmp | number | sí | n/a | n/a | n/a |
| alergenos | ProductoAlergeno[] | no | n/a | n/a | n/a |
| proveedores | ProductoProveedor[] | sí | n/a | n/a | n/a |
| mermas | Merma[] | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: docs.DATOS_INV_LIDOS_O_C_DIGO_DE_BARRAS_DUPLI
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: docs.PROVEEDOR_NO_ENCONTRADO
- 409: docs.CONFLICTO_DE_PRODUCTO_O_RELACIONES_DUPLICADAS
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: CreateProductoDto
- Response: Producto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_NOMBRE_ES_OBLIGATORIO')"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC' )"}) | n/a | n/a |
| marca | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.LA_MARCA_NO_PUEDE_EXCEDER_LOS_100_CARACT' )"}) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| unidad | UnidadMedida | sí | IsNotEmpty({"message":"i18nValidationMessage('validation.LA_UNIDAD_DEL_PRODUCTO_ES_OBL')"}), IsEnum(UnidadMedida, {"message":"i18nValidationMessage( 'validation.LA_UNIDAD_DEL_PRODUCTO_NO_ES_V_LIDA' )"}) | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | optional (swagger), IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |
| pathImg | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_DEBE_SER_UNA_CADENA' )"}), MaxLength(200, {"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| tipo | TipoProducto | no | optional (swagger), IsOptional, IsEnum(TipoProducto, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_PRODUCTO_NO_ES_V_LIDO' )"}) | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | optional (swagger), IsOptional, Transform((params) => UppercaseStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA' )"}), MaxLength(130, {"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS' )"}) | n/a | n/a |
| contenido | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_NO_PUEDE_SER_NEGATIVO' )"}) | n/a | n/a |
| alergenos | Alergeno[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY' )"}), IsEnum(Alergeno, {"each":true,"message":"i18nValidationMessage('validation.AL_RGENO_NO_V_LIDO')"}) | n/a | n/a |
| proveedores | AddProveedorToProductoDto[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_PROVEEDORES_DEBEN_SER_UN_ARRAY' )"}), ValidateNested({"each":true}), Type(() => AddProveedorToProductoDto) | n/a | n/a |

#### Side effects

- Delega en productoService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/productos/:id

Descripción: Eliminar un producto

- Módulo: producto
- Controller: ProductoController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/productos/:id

Descripción: Obtener un producto por ID

- Módulo: producto
- Controller: ProductoController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Producto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | n/a | n/a | n/a |
| marca | string | no | n/a | n/a | n/a |
| descripcion | string | no | n/a | n/a | n/a |
| unidad | UnidadMedida | no | n/a | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | n/a | n/a | n/a |
| pathImg | string | no | n/a | n/a | n/a |
| tipo | TipoProducto | no | n/a | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | n/a | n/a | n/a |
| contenido | number | sí | n/a | n/a | n/a |
| pmp | number | sí | n/a | n/a | n/a |
| alergenos | ProductoAlergeno[] | no | n/a | n/a | n/a |
| proveedores | ProductoProveedor[] | sí | n/a | n/a | n/a |
| mermas | Merma[] | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: docs.PRODUCTO_NO_ENCONTRADO
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 500

#### DTOs

- Request: n/a
- Response: Producto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoService.findOne()

### [PATCH] /api/v1/productos/:id

Descripción: Actualizar un producto

- Módulo: producto
- Controller: ProductoController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateProductoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_NOMBRE_ES_OBLIGATORIO')"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC' )"}) | n/a | n/a |
| marca | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.LA_MARCA_NO_PUEDE_EXCEDER_LOS_100_CARACT' )"}) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| unidad | UnidadMedida | no | IsNotEmpty({"message":"i18nValidationMessage('validation.LA_UNIDAD_DEL_PRODUCTO_ES_OBL')"}), IsEnum(UnidadMedida, {"message":"i18nValidationMessage( 'validation.LA_UNIDAD_DEL_PRODUCTO_NO_ES_V_LIDA' )"}) | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | optional (swagger), IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |
| pathImg | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_DEBE_SER_UNA_CADENA' )"}), MaxLength(200, {"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| tipo | TipoProducto | no | optional (swagger), IsOptional, IsEnum(TipoProducto, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_PRODUCTO_NO_ES_V_LIDO' )"}) | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | optional (swagger), IsOptional, Transform((params) => UppercaseStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA' )"}), MaxLength(130, {"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS' )"}) | n/a | n/a |
| contenido | number | no | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_NO_PUEDE_SER_NEGATIVO' )"}) | n/a | n/a |
| alergenos | Alergeno[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY' )"}), IsEnum(Alergeno, {"each":true,"message":"i18nValidationMessage('validation.AL_RGENO_NO_V_LIDO')"}) | n/a | n/a |
| proveedores | AddProveedorToProductoDto[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_PROVEEDORES_DEBEN_SER_UN_ARRAY' )"}), ValidateNested({"each":true}), Type(() => AddProveedorToProductoDto) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Producto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | n/a | n/a | n/a |
| marca | string | no | n/a | n/a | n/a |
| descripcion | string | no | n/a | n/a | n/a |
| unidad | UnidadMedida | no | n/a | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | n/a | n/a | n/a |
| pathImg | string | no | n/a | n/a | n/a |
| tipo | TipoProducto | no | n/a | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | n/a | n/a | n/a |
| contenido | number | sí | n/a | n/a | n/a |
| pmp | number | sí | n/a | n/a | n/a |
| alergenos | ProductoAlergeno[] | no | n/a | n/a | n/a |
| proveedores | ProductoProveedor[] | sí | n/a | n/a | n/a |
| mermas | Merma[] | no | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateProductoDto
- Response: Producto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_NOMBRE_ES_OBLIGATORIO')"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC' )"}) | n/a | n/a |
| marca | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.LA_MARCA_NO_PUEDE_EXCEDER_LOS_100_CARACT' )"}) | n/a | n/a |
| descripcion | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(1000, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000' )"}) | n/a | n/a |
| unidad | UnidadMedida | no | IsNotEmpty({"message":"i18nValidationMessage('validation.LA_UNIDAD_DEL_PRODUCTO_ES_OBL')"}), IsEnum(UnidadMedida, {"message":"i18nValidationMessage( 'validation.LA_UNIDAD_DEL_PRODUCTO_NO_ES_V_LIDA' )"}) | KG, G, L, ML, UNIDAD, PAQ | n/a |
| fechaCaducidad | Date (date-time) | no | optional (swagger), IsOptional, Transform((params) => StringToDateTransformer.transform(params)), Type(() => Date) | n/a | n/a |
| pathImg | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_DEBE_SER_UNA_CADENA' )"}), MaxLength(200, {"message":"i18nValidationMessage( 'validation.LA_RUTA_DE_LA_IMAGEN_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| tipo | TipoProducto | no | optional (swagger), IsOptional, IsEnum(TipoProducto, {"message":"i18nValidationMessage( 'validation.EL_TIPO_DE_PRODUCTO_NO_ES_V_LIDO' )"}) | verdura, fruta, carne, pescado, marisco, lacteo, huevo, cereal, legumbre, fruto_seco, condimento, aceite, azucar, bebida, elaborado, otro | n/a |
| codigoBarras | string | no | optional (swagger), IsOptional, Transform((params) => UppercaseStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA' )"}), MaxLength(130, {"message":"i18nValidationMessage( 'validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS' )"}) | n/a | n/a |
| contenido | number | no | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_DEBE_SER_UN_N_MERO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_CONTENIDO_NO_PUEDE_SER_NEGATIVO' )"}) | n/a | n/a |
| alergenos | Alergeno[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY' )"}), IsEnum(Alergeno, {"each":true,"message":"i18nValidationMessage('validation.AL_RGENO_NO_V_LIDO')"}) | n/a | n/a |
| proveedores | AddProveedorToProductoDto[] | no | optional (swagger), IsOptional, IsArray({"message":"i18nValidationMessage( 'validation.LOS_PROVEEDORES_DEBEN_SER_UN_ARRAY' )"}), ValidateNested({"each":true}), Type(() => AddProveedorToProductoDto) | n/a | n/a |

#### Side effects

- Delega en productoService.update()
- Operación de actualización o transición de estado

### [GET] /api/v1/productos/:id/historial-precios

Descripción: Obtener el historial de precios de un producto

- Módulo: producto
- Controller: ProductoController
- Handler: getHistorialPrecios
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| proveedorId | string | no | n/a | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: HistorialPrecio[]
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoProveedorId | string | sí | n/a | n/a | n/a |
| productoProveedor | ProductoProveedor | sí | n/a | n/a | n/a |
| precio | number | sí | n/a | n/a | n/a |
| cantidad | number | no | n/a | n/a | n/a |
| documentoOrigen | string | no | n/a | n/a | n/a |
| recepcionId | string | no | n/a | n/a | n/a |
| fecha | Date (date-time) | sí | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: HistorialPrecio[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoService.getHistorialPrecios()

### [GET] /api/v1/productos/:id/pmp

Descripción: Obtener el PMP actual de un producto, desglosado por proveedor

- Módulo: producto
- Controller: ProductoController
- Handler: getPmp
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { pmp: number; porProveedor: { productoProveedorId: string; proveedorId: string; pmp: number; }[]; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { pmp: number; porProveedor: { productoProveedorId: string; proveedorId: string; pmp: number; }[]; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoService.findOne()

### [GET] /api/v1/productos/generar-ean13

Descripción: Generar un código EAN-13 único

- Módulo: producto
- Controller: ProductoController
- Handler: generarEan13
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: productos:generar_ean13
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { codigo_barras: string; }
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { codigo_barras: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoService.generateUniqueEan13()

### Controller: ProductoProveedorController

- Ruta base: /api/v1/producto-proveedor
- Tags Swagger: Producto Proveedor
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts
- Endpoints: 5

### [GET] /api/v1/producto-proveedor/:id/historial

Descripción: Obtener el historial de precios de un producto proveedor

- Módulo: producto
- Controller: ProductoProveedorController
- Handler: getHistorial
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<HistorialPrecio>
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<HistorialPrecio>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoProveedorService.getHistorial()

### [PATCH] /api/v1/producto-proveedor/:id/merma

Descripción: Actualizar la merma esperada de un producto-proveedor

- Módulo: producto
- Controller: ProductoProveedorController
- Handler: updateMerma
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateMermaProveedorDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nuevaMerma | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_NO_PUEDE_SER_NEGATIVO' )"}), Max(99.99, {"message":"i18nValidationMessage( 'validation.MERMA_ESPERADA_NO_DEFAULT_SUPERAR' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.MERMA_ESPERADA_OBLIGATORIA')"}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProductoProveedor
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateMermaProveedorDto
- Response: ProductoProveedor

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nuevaMerma | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_NO_PUEDE_SER_NEGATIVO' )"}), Max(99.99, {"message":"i18nValidationMessage( 'validation.MERMA_ESPERADA_NO_DEFAULT_SUPERAR' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.MERMA_ESPERADA_OBLIGATORIA')"}) | n/a | n/a |

#### Side effects

- Delega en productoProveedorService.updateMerma()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/producto-proveedor/:id/precio

Descripción: Actualizar el precio de un producto de un proveedor y registrar histórico

- Módulo: producto
- Controller: ProductoProveedorController
- Handler: updatePrecio
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdatePrecioProductoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nuevoPrecio | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0.01, {"message":"i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0')"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_PRECIO_ES_OBLIGATORIO')"}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProductoProveedor
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdatePrecioProductoDto
- Response: ProductoProveedor

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nuevoPrecio | number | sí | IsNumber({}, {"message":"i18nValidationMessage( 'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO' )"}), Min(0.01, {"message":"i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0')"}), IsNotEmpty({"message":"i18nValidationMessage('validation.EL_PRECIO_ES_OBLIGATORIO')"}) | n/a | n/a |

#### Side effects

- Delega en productoProveedorService.updatePrecio()
- Operación de actualización o transición de estado

### [GET] /api/v1/producto-proveedor/comparar/:productoId

Descripción: Comparar proveedores de un producto por coste efectivo (precio + merma esperada)

- Módulo: producto
- Controller: ProductoProveedorController
- Handler: compararProveedores
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| productoId | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ComparacionProveedoresResponse
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: ComparacionProveedoresResponse

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoProveedorService.compararProveedores()

### [GET] /api/v1/producto-proveedor/search

Descripción: Buscar relaciones producto-proveedor (autocomplete)

- Módulo: producto
- Controller: ProductoProveedorController
- Handler: search
- Fuente: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| q | string | no | IsOptional, IsString({"message":"i18nValidationMessage( 'validation.EL_T_RMINO_DE_B_SQUEDA_DEBE_SER_UNA_CADE' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_T_RMINO_DE_B_SQUEDA_NO_PUEDE_EXCEDER' )"}) | n/a | n/a |
| offset | number | no | IsOptional, Type(() => Number), IsInt({"message":"i18nValidationMessage('validation.EL_OFFSET_DEBE_SER_UN_ENTERO')"}), Min(0, {"message":"i18nValidationMessage( 'validation.EL_OFFSET_NO_PUEDE_SER_NEGATIVO' )"}) | n/a | 0 |
| limit | number | no | IsOptional, Type(() => Number), IsInt({"message":"i18nValidationMessage('validation.EL_L_MITE_DEBE_SER_UN_ENTERO')"}), Min(1, {"message":"i18nValidationMessage('validation.EL_L_MITE_DEBE_SER_AL_MENOS_1')"}), Max(50, {"message":"i18nValidationMessage('validation.EL_L_MITE_NO_PUEDE_EXCEDER_50')"}) | n/a | 20 |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { id: string; productoId: string; productoNombre: string; unidad?: string; contenido?: number; proveedorId: string; proveedorNombre: string; marcaEspecifica?: string; codigoBarras?: string; precioUnitario?: number; }[]
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { id: string; productoId: string; productoNombre: string; unidad?: string; contenido?: number; proveedorId: string; proveedorNombre: string; marcaEspecifica?: string; codigoBarras?: string; precioUnitario?: number; }[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en productoProveedorService.search()

## Módulo: profesor

### Controller: ProfesorController

- Ruta base: /api/v1/profesores
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Endpoints: 13

### [POST] /api/v1/profesores/admin-slots

Descripción: ProfesorController.adminCreateSlot

- Módulo: profesor
- Controller: ProfesorController
- Handler: adminCreateSlot
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: AdminCreateSlotDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| profesorId | string | sí | IsUUID, IsNotEmpty | n/a | n/a |
| aula | string | sí | IsString, IsNotEmpty | n/a | n/a |
| numeroClase | number | sí | IsInt, Min(1) | n/a | n/a |
| capacidad | number | no | IsOptional, IsInt, Min(1) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: AlumnoSlot
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: AdminCreateSlotDto
- Response: AlumnoSlot

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| profesorId | string | sí | IsUUID, IsNotEmpty | n/a | n/a |
| aula | string | sí | IsString, IsNotEmpty | n/a | n/a |
| numeroClase | number | sí | IsInt, Min(1) | n/a | n/a |
| capacidad | number | no | IsOptional, IsInt, Min(1) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Side effects

- Delega en profesorService.adminCreateSlot()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/profesores/admin-slots/:id

Descripción: ProfesorController.adminDeleteSlot

- Módulo: profesor
- Controller: ProfesorController
- Handler: adminDeleteSlot
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: { message: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.adminDeleteSlot()
- Operación de eliminación o baja lógica

### [PATCH] /api/v1/profesores/admin-slots/:id

Descripción: ProfesorController.adminUpdateSlot

- Módulo: profesor
- Controller: ProfesorController
- Handler: adminUpdateSlot
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: AdminUpdateSlotDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| profesorId | string | no | IsOptional, IsUUID | n/a | n/a |
| aula | string | no | IsString, IsOptional | n/a | n/a |
| numeroClase | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| capacidad | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: AlumnoSlot
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: AdminUpdateSlotDto
- Response: AlumnoSlot

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| profesorId | string | no | IsOptional, IsUUID | n/a | n/a |
| aula | string | no | IsString, IsOptional | n/a | n/a |
| numeroClase | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| capacidad | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Side effects

- Delega en profesorService.adminUpdateSlot()
- Operación de actualización o transición de estado

### [GET] /api/v1/profesores/all-profesores

Descripción: ProfesorController.getAllProfesores

- Módulo: profesor
- Controller: ProfesorController
- Handler: getAllProfesores
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { id: string; userId: string; username: string; nombre: string | null; email: string | null; }[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { id: string; userId: string; username: string; nombre: string | null; email: string | null; }[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.getAllProfesores()

### [GET] /api/v1/profesores/all-slots

Descripción: ProfesorController.getAllSlots

- Módulo: profesor
- Controller: ProfesorController
- Handler: getAllSlots
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: AlumnoSlot[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: AlumnoSlot[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.getAllSlots()

### [GET] /api/v1/profesores/alumnos

Descripción: ProfesorController.getAlumnos

- Módulo: profesor
- Controller: ProfesorController
- Handler: getAlumnos
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:ver_alumnos
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { id: string; username: string; status: UserStatus; aula: string; numeroClase: number; }[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { id: string; username: string; status: UserStatus; aula: string; numeroClase: number; }[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.getAlumnos()

### [PATCH] /api/v1/profesores/alumnos/:id/activate

Descripción: ProfesorController.activateAlumno

- Módulo: profesor
- Controller: ProfesorController
- Handler: activateAlumno
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:gestionar_alumnos
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { status: UserStatus.ACTIVE; message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { status: UserStatus.ACTIVE; message: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.activateAlumno()
- Operación de actualización o transición de estado

### [POST] /api/v1/profesores/alumnos/:id/force-reset

Descripción: ProfesorController.forcePasswordReset

- Módulo: profesor
- Controller: ProfesorController
- Handler: forcePasswordReset
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:gestionar_alumnos
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { message: string; provisionalPassword: string; mustChangePassword: boolean; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { message: string; provisionalPassword: string; mustChangePassword: boolean; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.forcePasswordReset()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/profesores/register

Descripción: ProfesorController.register

- Módulo: profesor
- Controller: ProfesorController
- Handler: register
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: no
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateProfesorDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| email | string | sí | IsEmail, IsNotEmpty | n/a | n/a |
| cial | string | sí | Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : String(value)), IsString, IsNotEmpty | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: { message: string; id: string; username: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 500

#### DTOs

- Request: CreateProfesorDto
- Response: { message: string; id: string; username: string; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| username | string | sí | IsString, IsNotEmpty | n/a | n/a |
| password | string | sí | IsString | n/a | n/a |
| email | string | sí | IsEmail, IsNotEmpty | n/a | n/a |
| cial | string | sí | Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : String(value)), IsString, IsNotEmpty | n/a | n/a |

#### Side effects

- Delega en profesorService.register()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/profesores/slots

Descripción: ProfesorController.getSlots

- Módulo: profesor
- Controller: ProfesorController
- Handler: getSlots
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:gestionar_slots
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: AlumnoSlot[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: AlumnoSlot[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.getSlots()

### [POST] /api/v1/profesores/slots

Descripción: ProfesorController.createSlot

- Módulo: profesor
- Controller: ProfesorController
- Handler: createSlot
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:gestionar_slots
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateSlotDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| aula | string | sí | IsString, IsNotEmpty | n/a | n/a |
| numeroClase | number | sí | IsInt, Min(1) | n/a | n/a |
| capacidad | number | no | IsOptional, IsInt, Min(1) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: AlumnoSlot
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateSlotDto
- Response: AlumnoSlot

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| aula | string | sí | IsString, IsNotEmpty | n/a | n/a |
| numeroClase | number | sí | IsInt, Min(1) | n/a | n/a |
| capacidad | number | no | IsOptional, IsInt, Min(1) | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Side effects

- Delega en profesorService.createSlot()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/profesores/slots/:id

Descripción: ProfesorController.deleteSlot

- Módulo: profesor
- Controller: ProfesorController
- Handler: deleteSlot
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:gestionar_slots
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { message: string; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: { message: string; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en profesorService.deleteSlot()
- Operación de eliminación o baja lógica

### [PATCH] /api/v1/profesores/slots/:id

Descripción: ProfesorController.updateSlot

- Módulo: profesor
- Controller: ProfesorController
- Handler: updateSlot
- Fuente: backend/smart-economat-backend/src/modules/profesor/controller/profesor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: profesor:gestionar_slots
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | n/a | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateSlotDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| aula | string | no | IsString, IsOptional | n/a | n/a |
| numeroClase | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| capacidad | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: AlumnoSlot
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateSlotDto
- Response: AlumnoSlot

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| aula | string | no | IsString, IsOptional | n/a | n/a |
| numeroClase | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| capacidad | number | no | IsInt, Min(1), IsOptional | n/a | n/a |
| ubicacionId | string | no | IsOptional, IsUUID | n/a | n/a |

#### Side effects

- Delega en profesorService.updateSlot()
- Operación de actualización o transición de estado

## Módulo: proveedor

### Controller: ProveedorController

- Ruta base: /api/v1/proveedor
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Endpoints: 6

### [GET] /api/v1/proveedor

Descripción: ProveedorController.findAll

- Módulo: proveedor
- Controller: ProveedorController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: proveedores:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Proveedor>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Proveedor>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en proveedorService.findAll()

### [POST] /api/v1/proveedor

Descripción: ProveedorController.create

- Módulo: proveedor
- Controller: ProveedorController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateProveedorDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty, MaxLength(100) | n/a | n/a |
| contacto | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(100) | n/a | n/a |
| telefono | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(50) | n/a | n/a |
| email | string | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsString, MaxLength(255) | n/a | n/a |
| direccion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| nif | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(20) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Proveedor
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateProveedorDto
- Response: Proveedor

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty, MaxLength(100) | n/a | n/a |
| contacto | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(100) | n/a | n/a |
| telefono | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(50) | n/a | n/a |
| email | string | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsString, MaxLength(255) | n/a | n/a |
| direccion | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| nif | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString, MaxLength(20) | n/a | n/a |

#### Side effects

- Delega en proveedorService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/proveedor/:id

Descripción: ProveedorController.remove

- Módulo: proveedor
- Controller: ProveedorController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en proveedorService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/proveedor/:id

Descripción: ProveedorController.findOne

- Módulo: proveedor
- Controller: ProveedorController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Proveedor
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Proveedor

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en proveedorService.findOne()

### [PATCH] /api/v1/proveedor/:id

Descripción: ProveedorController.update

- Módulo: proveedor
- Controller: ProveedorController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateProveedorDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| contacto | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| telefono | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| email | string | no | Transform((params) => LowercaseStringTransformer.transform(params)) | n/a | n/a |
| direccion | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| nif | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Proveedor
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateProveedorDto
- Response: Proveedor

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| contacto | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| telefono | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| email | string | no | Transform((params) => LowercaseStringTransformer.transform(params)) | n/a | n/a |
| direccion | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| nif | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |

#### Side effects

- Delega en proveedorService.update()
- Operación de actualización o transición de estado

### [GET] /api/v1/proveedor/con-pedidos

Descripción: ProveedorController.findWithOrders

- Módulo: proveedor
- Controller: ProveedorController
- Handler: findWithOrders
- Fuente: backend/smart-economat-backend/src/modules/proveedor/controller/proveedor.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: proveedores:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Proveedor[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Proveedor[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en proveedorService.findWithOrders()

## Módulo: recepcion

### Controller: RecepcionController

- Ruta base: /api/v1/recepciones
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Endpoints: 6

### [GET] /api/v1/recepciones

Descripción: RecepcionController.findAll

- Módulo: recepcion
- Controller: RecepcionController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Recepcion>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Recepcion>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionService.findAll()

### [POST] /api/v1/recepciones

Descripción: RecepcionController.create

- Módulo: recepcion
- Controller: RecepcionController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateRecepcionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoIds | string[] | no | optional (swagger), IsOptional, IsArray, IsString({"each":true}) | n/a | n/a |
| pedidos | PedidoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => PedidoRecepcionDto) | n/a | n/a |
| nAlbaran | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| fechaRecepcion | Date (date-time) | no | optional (swagger), IsOptional, Type(() => Date), Transform((params) => StringToDateTransformer.transform(params)) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| productos | RecepcionLineDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => RecepcionLineDto) | n/a | n/a |
| productosNuevos | ProductoNuevoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => ProductoNuevoRecepcionDto) | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: RecepcionResultadoDto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateRecepcionDto
- Response: RecepcionResultadoDto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoIds | string[] | no | optional (swagger), IsOptional, IsArray, IsString({"each":true}) | n/a | n/a |
| pedidos | PedidoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => PedidoRecepcionDto) | n/a | n/a |
| nAlbaran | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| fechaRecepcion | Date (date-time) | no | optional (swagger), IsOptional, Type(() => Date), Transform((params) => StringToDateTransformer.transform(params)) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| productos | RecepcionLineDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => RecepcionLineDto) | n/a | n/a |
| productosNuevos | ProductoNuevoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => ProductoNuevoRecepcionDto) | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |

#### Side effects

- Delega en recepcionStockService.procesarRecepcion()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/recepciones/:id

Descripción: RecepcionController.remove

- Módulo: recepcion
- Controller: RecepcionController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/recepciones/:id

Descripción: RecepcionController.findOne

- Módulo: recepcion
- Controller: RecepcionController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Recepcion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Recepcion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionService.findOne()

### [PATCH] /api/v1/recepciones/:id

Descripción: RecepcionController.update

- Módulo: recepcion
- Controller: RecepcionController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateRecepcionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoIds | string[] | no | optional (swagger), IsOptional, IsArray, IsString({"each":true}) | n/a | n/a |
| pedidos | PedidoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => PedidoRecepcionDto) | n/a | n/a |
| nAlbaran | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| fechaRecepcion | Date (date-time) | no | optional (swagger), IsOptional, Type(() => Date), Transform((params) => StringToDateTransformer.transform(params)) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| productos | RecepcionLineDto[] | no | IsArray, ValidateNested({"each":true}), Type(() => RecepcionLineDto) | n/a | n/a |
| productosNuevos | ProductoNuevoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => ProductoNuevoRecepcionDto) | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Recepcion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateRecepcionDto
- Response: Recepcion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| pedidoIds | string[] | no | optional (swagger), IsOptional, IsArray, IsString({"each":true}) | n/a | n/a |
| pedidos | PedidoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => PedidoRecepcionDto) | n/a | n/a |
| nAlbaran | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| fechaRecepcion | Date (date-time) | no | optional (swagger), IsOptional, Type(() => Date), Transform((params) => StringToDateTransformer.transform(params)) | n/a | n/a |
| observaciones | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString | n/a | n/a |
| productos | RecepcionLineDto[] | no | IsArray, ValidateNested({"each":true}), Type(() => RecepcionLineDto) | n/a | n/a |
| productosNuevos | ProductoNuevoRecepcionDto[] | no | optional (swagger), IsOptional, IsArray, ValidateNested({"each":true}), Type(() => ProductoNuevoRecepcionDto) | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |

#### Side effects

- Delega en recepcionService.update()
- Operación de actualización o transición de estado

### [GET] /api/v1/recepciones/reporte-pdf

Descripción: RecepcionController.reportePdf

- Módulo: recepcion
- Controller: RecepcionController
- Handler: reportePdf
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/octet-stream | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoReportePdf | no | IsOptional, IsEnum(TipoReportePdf) | pedido, incidencias, recepcion | n/a |
| pedidoId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| startDate | string | no | IsOptional, IsDateString | n/a | n/a |
| endDate | string | no | IsOptional, IsDateString | n/a | n/a |
| proveedorId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| soloNoResueltas | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => value === 'true' || value === true) | n/a | n/a |
| tipoDiferencia | TipoDiferencia | no | IsOptional, IsEnum(TipoDiferencia) | FALTANTE, EXCESO, DEFECTUOSO | n/a |
| batchId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| pedidoUsuarioId | string | no | IsOptional, IsUUID(all) | n/a | n/a |
| incluirCancelados | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true' || value === true || value === '1') return true; return false; }) | n/a | n/a |
| paginaPorProveedor | boolean | no | IsOptional, IsBoolean, Transform(({ value }) => { if (value === 'true' || value === true || value === '1') return true; return false; }) | n/a | n/a |
| recepcionId | string | no | IsOptional, IsUUID(all) | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/octet-stream
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en pdfReportService.generateReport()
- Devuelve stream/binario (application/octet-stream)

### Controller: RecepcionProductoController

- Ruta base: /api/v1/recepcion-productos
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion-producto.controller.ts
- Endpoints: 5

### [GET] /api/v1/recepcion-productos

Descripción: RecepcionProductoController.findAll

- Módulo: recepcion
- Controller: RecepcionProductoController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion-producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<RecepcionProducto>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<RecepcionProducto>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionProductoService.findAll()

### [POST] /api/v1/recepcion-productos

Descripción: RecepcionProductoController.create

- Módulo: recepcion
- Controller: RecepcionProductoController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion-producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateRecepcionProductoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idRecepcion | string | sí | IsNotEmpty, IsUUID(all) | n/a | n/a |
| idPedidoProducto | string | sí | IsNotEmpty, IsUUID(all) | n/a | n/a |
| cantidadRecibida | number | sí | IsNumber, Min(0) | n/a | n/a |
| observaciones | string | no | IsOptional, IsString | n/a | n/a |
| estadoProducto | EstadoProductoRecepcion | no | IsOptional, IsEnum(EstadoProductoRecepcion) | PERFECTO, ROTO, FALTA_TOTAL, EXCEDE | n/a |
| fechaRecepcion | string | no | IsOptional, IsDateString | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: RecepcionProducto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateRecepcionProductoDto
- Response: RecepcionProducto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idRecepcion | string | sí | IsNotEmpty, IsUUID(all) | n/a | n/a |
| idPedidoProducto | string | sí | IsNotEmpty, IsUUID(all) | n/a | n/a |
| cantidadRecibida | number | sí | IsNumber, Min(0) | n/a | n/a |
| observaciones | string | no | IsOptional, IsString | n/a | n/a |
| estadoProducto | EstadoProductoRecepcion | no | IsOptional, IsEnum(EstadoProductoRecepcion) | PERFECTO, ROTO, FALTA_TOTAL, EXCEDE | n/a |
| fechaRecepcion | string | no | IsOptional, IsDateString | n/a | n/a |

#### Side effects

- Delega en recepcionProductoService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/recepcion-productos/:id

Descripción: RecepcionProductoController.remove

- Módulo: recepcion
- Controller: RecepcionProductoController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion-producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionProductoService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/recepcion-productos/:id

Descripción: RecepcionProductoController.findOne

- Módulo: recepcion
- Controller: RecepcionProductoController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion-producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: RecepcionProducto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: RecepcionProducto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionProductoService.findOne()

### [PATCH] /api/v1/recepcion-productos/:id

Descripción: RecepcionProductoController.update

- Módulo: recepcion
- Controller: RecepcionProductoController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/recepcion/controller/recepcion-producto.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recepciones:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateRecepcionProductoDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idRecepcion | string | no | IsNotEmpty, IsUUID(all) | n/a | n/a |
| idPedidoProducto | string | no | IsNotEmpty, IsUUID(all) | n/a | n/a |
| cantidadRecibida | number | no | IsNumber, Min(0) | n/a | n/a |
| observaciones | string | no | IsOptional, IsString | n/a | n/a |
| estadoProducto | EstadoProductoRecepcion | no | IsOptional, IsEnum(EstadoProductoRecepcion) | PERFECTO, ROTO, FALTA_TOTAL, EXCEDE | n/a |
| fechaRecepcion | string | no | IsOptional, IsDateString | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: RecepcionProducto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateRecepcionProductoDto
- Response: RecepcionProducto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| idRecepcion | string | no | IsNotEmpty, IsUUID(all) | n/a | n/a |
| idPedidoProducto | string | no | IsNotEmpty, IsUUID(all) | n/a | n/a |
| cantidadRecibida | number | no | IsNumber, Min(0) | n/a | n/a |
| observaciones | string | no | IsOptional, IsString | n/a | n/a |
| estadoProducto | EstadoProductoRecepcion | no | IsOptional, IsEnum(EstadoProductoRecepcion) | PERFECTO, ROTO, FALTA_TOTAL, EXCEDE | n/a |
| fechaRecepcion | string | no | IsOptional, IsDateString | n/a | n/a |

#### Side effects

- Delega en recepcionProductoService.update()
- Operación de actualización o transición de estado

## Módulo: recepcion-draft

### Controller: RecepcionDraftController

- Ruta base: /api/v1/recepcion/draft
- Tags Swagger: Recepcion Draft
- Fuente: backend/smart-economat-backend/src/modules/recepcion-draft/controller/recepcion-draft.controller.ts
- Endpoints: 3

### [DELETE] /api/v1/recepcion/draft

Descripción: Eliminar el borrador activo de recepción

- Módulo: recepcion-draft
- Controller: RecepcionDraftController
- Handler: clearDraft
- Fuente: backend/smart-economat-backend/src/modules/recepcion-draft/controller/recepcion-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 401
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionDraftService.clearDraft()
- Operación de eliminación o baja lógica

### [GET] /api/v1/recepcion/draft

Descripción: Recuperar el borrador de recepción más reciente

- Módulo: recepcion-draft
- Controller: RecepcionDraftController
- Handler: getLatestDraft
- Fuente: backend/smart-economat-backend/src/modules/recepcion-draft/controller/recepcion-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: RecepcionDraftResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | no | optional (swagger) | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |
| source | "redis" | "database" | sí | n/a | redis, database | n/a |
| createdAt | string | sí | n/a | n/a | n/a |
| updatedAt | string | sí | n/a | n/a | n/a |
| expiresAt | string | null | no | optional (swagger) | n/a | n/a |
| payload | Record<string, unknown> | sí | n/a | n/a | n/a |

#### Response error

- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 500

#### DTOs

- Request: n/a
- Response: RecepcionDraftResponseDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recepcionDraftService.getLatestDraft()

### [POST] /api/v1/recepcion/draft

Descripción: Crear o actualizar el borrador seguro de recepción

- Módulo: recepcion-draft
- Controller: RecepcionDraftController
- Handler: saveDraft
- Fuente: backend/smart-economat-backend/src/modules/recepcion-draft/controller/recepcion-draft.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: UpsertRecepcionDraftDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| payload | Record<string, unknown> | sí | IsObject | n/a | n/a |
| version | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: RecepcionDraftResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | no | optional (swagger) | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |
| source | "redis" | "database" | sí | n/a | redis, database | n/a |
| createdAt | string | sí | n/a | n/a | n/a |
| updatedAt | string | sí | n/a | n/a | n/a |
| expiresAt | string | null | no | optional (swagger) | n/a | n/a |
| payload | Record<string, unknown> | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 500

#### DTOs

- Request: UpsertRecepcionDraftDto
- Response: RecepcionDraftResponseDto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| payload | Record<string, unknown> | sí | IsObject | n/a | n/a |
| version | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |

#### Side effects

- Delega en recepcionDraftService.upsertDraft()
- Operación de alta/acción de negocio con persistencia probable

## Módulo: receta

### Controller: ProduccionController

- Ruta base: /api/v1/produccion
- Tags Swagger: Producción
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts
- Endpoints: 5

### [GET] /api/v1/produccion

Descripción: Listar todos los lotes de producción

- Módulo: receta
- Controller: ProduccionController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProduccionLote[]
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| preparacionId | string | no | n/a | n/a | n/a |
| receta | Receta | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| cantidadProducida | number | sí | n/a | n/a | n/a |
| fechaProduccion | Date (date-time) | sí | n/a | n/a | n/a |
| fechaCaducidad | Date | null (date-time) | no | n/a | n/a | n/a |
| fechaAgotado | Date | null (date-time) | no | n/a | n/a | n/a |
| costeTotalReal | number | sí | n/a | n/a | n/a |
| porcionesProducidas | number | sí | n/a | n/a | n/a |
| porcionesRestantes | number | sí | n/a | n/a | n/a |
| estado | EstadoLote | sí | n/a | disponible, agotado | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: ProduccionLote[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en produccionService.findAll()

### [GET] /api/v1/produccion/:id

Descripción: Obtener un lote de producción por ID

- Módulo: receta
- Controller: ProduccionController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProduccionLote
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| preparacionId | string | no | n/a | n/a | n/a |
| receta | Receta | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| cantidadProducida | number | sí | n/a | n/a | n/a |
| fechaProduccion | Date (date-time) | sí | n/a | n/a | n/a |
| fechaCaducidad | Date | null (date-time) | no | n/a | n/a | n/a |
| fechaAgotado | Date | null (date-time) | no | n/a | n/a | n/a |
| costeTotalReal | number | sí | n/a | n/a | n/a |
| porcionesProducidas | number | sí | n/a | n/a | n/a |
| porcionesRestantes | number | sí | n/a | n/a | n/a |
| estado | EstadoLote | sí | n/a | disponible, agotado | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: docs.LOTE_NO_ENCONTRADO
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 500

#### DTOs

- Request: n/a
- Response: ProduccionLote

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en produccionService.findOne()

### [POST] /api/v1/produccion/ejecutar

Descripción: Ejecutar la producción de una receta y registrar el lote

- Módulo: receta
- Controller: ProduccionController
- Handler: ejecutarProduccion
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:cocinar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: EjecutarProduccionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | IsUUID(all) | n/a | n/a |
| cantidadProducida | number | sí | Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| fechaCaducidadManual | string | no | optional (swagger), IsOptional, IsDateString | n/a | n/a |
| ubicacionDestinoId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: ProduccionLote
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| preparacionId | string | no | n/a | n/a | n/a |
| receta | Receta | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| cantidadProducida | number | sí | n/a | n/a | n/a |
| fechaProduccion | Date (date-time) | sí | n/a | n/a | n/a |
| fechaCaducidad | Date | null (date-time) | no | n/a | n/a | n/a |
| fechaAgotado | Date | null (date-time) | no | n/a | n/a | n/a |
| costeTotalReal | number | sí | n/a | n/a | n/a |
| porcionesProducidas | number | sí | n/a | n/a | n/a |
| porcionesRestantes | number | sí | n/a | n/a | n/a |
| estado | EstadoLote | sí | n/a | disponible, agotado | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: docs.STOCK_INSUFICIENTE_OR_RECETA_INV_LIDA
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: docs.RECETA_NO_ENCONTRADA
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 404
- 409
- 500

#### DTOs

- Request: EjecutarProduccionDto
- Response: ProduccionLote

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | IsUUID(all) | n/a | n/a |
| cantidadProducida | number | sí | Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| fechaCaducidadManual | string | no | optional (swagger), IsOptional, IsDateString | n/a | n/a |
| ubicacionDestinoId | string | no | optional (swagger), IsOptional, IsUUID(all) | n/a | n/a |

#### Side effects

- Delega en produccionService.ejecutarProduccion()
- Operación de alta/acción de negocio con persistencia probable

### [PATCH] /api/v1/produccion/lote/:id/consumir

Descripción: Consumir raciones o cantidad de un lote de producción

- Módulo: receta
- Controller: ProduccionController
- Handler: consumirPorciones
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:cocinar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: ConsumirProduccionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoConsumoProduccion | sí | IsEnum(TipoConsumoProduccion) | raciones, cantidad | n/a |
| valor | number | sí | Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, IsPositive | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: ProduccionLote
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | n/a | n/a | n/a |
| usuarioId | string | no | n/a | n/a | n/a |
| preparacionId | string | no | n/a | n/a | n/a |
| receta | Receta | sí | n/a | n/a | n/a |
| usuario | Usuario | no | n/a | n/a | n/a |
| cantidadProducida | number | sí | n/a | n/a | n/a |
| fechaProduccion | Date (date-time) | sí | n/a | n/a | n/a |
| fechaCaducidad | Date | null (date-time) | no | n/a | n/a | n/a |
| fechaAgotado | Date | null (date-time) | no | n/a | n/a | n/a |
| costeTotalReal | number | sí | n/a | n/a | n/a |
| porcionesProducidas | number | sí | n/a | n/a | n/a |
| porcionesRestantes | number | sí | n/a | n/a | n/a |
| estado | EstadoLote | sí | n/a | disponible, agotado | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: ConsumirProduccionDto
- Response: ProduccionLote

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| tipo | TipoConsumoProduccion | sí | IsEnum(TipoConsumoProduccion) | raciones, cantidad | n/a |
| valor | number | sí | Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, IsPositive | n/a | n/a |

#### Side effects

- Delega en produccionService.consumirPorciones()
- Operación de actualización o transición de estado

### [POST] /api/v1/produccion/validar

Descripción: Validar stock disponible para una o varias producciones

- Módulo: receta
- Controller: ProduccionController
- Handler: validarStock
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:cocinar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ValidarProduccionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| items | ValidarItemDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => ValidarItemDto) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { ingredients: { productoId: any; nombre: string; requerido: number; disponible: number; unidad: string; isEnough: boolean; cheapestProveedorId: string; cheapestProveedorNombre: string; cheapestProductoProveedorId: string; cheapestPrecio: number; isFavorite: boolean; }[]; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: ValidarProduccionDto
- Response: { ingredients: { productoId: any; nombre: string; requerido: number; disponible: number; unidad: string; isEnough: boolean; cheapestProveedorId: string; cheapestProveedorNombre: string; cheapestProductoProveedorId: string; cheapestPrecio: number; isFavorite: boolean; }[]; }

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| items | ValidarItemDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => ValidarItemDto) | n/a | n/a |

#### Side effects

- Delega en produccionService.validarMultiple()
- Operación de alta/acción de negocio con persistencia probable

### Controller: RecetaController

- Ruta base: /api/v1/recetas
- Tags Swagger: Recetas
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Endpoints: 13

### [GET] /api/v1/recetas

Descripción: RecetaController.findAll

- Módulo: receta
- Controller: RecetaController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Receta>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Receta>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaService.findAll()

### [POST] /api/v1/recetas

Descripción: RecetaController.create

- Módulo: receta
- Controller: RecetaController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateRecetaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty, MaxLength(150) | n/a | n/a |
| instrucciones | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty | n/a | n/a |
| tiempoEstimadoMinutos | number | sí | IsInt, Min(0) | n/a | n/a |
| dificultad | DificultadReceta | sí | IsEnum(DificultadReceta) | Fácil, Media, Difícil | n/a |
| rendimiento | number | no | optional (swagger), IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| unidadResultado | UnidadIngrediente | no | optional (swagger), IsOptional, IsEnum(UnidadIngrediente) | g, kg, l, ml, pieza, cda, cdta | n/a |
| diasCaducidad | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |
| pathImg | string | no | IsOptional, IsString | n/a | n/a |
| pathImgOptimized | string | no | IsOptional, IsString | n/a | n/a |
| raciones | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| tamanioRacion | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| ingredientes | AddIngredienteDto[] | sí | IsArray, ArrayMinSize(1), ValidateNested({"each":true}), Type(() => AddIngredienteDto) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Receta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateRecetaDto
- Response: Receta

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty, MaxLength(150) | n/a | n/a |
| instrucciones | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty | n/a | n/a |
| tiempoEstimadoMinutos | number | sí | IsInt, Min(0) | n/a | n/a |
| dificultad | DificultadReceta | sí | IsEnum(DificultadReceta) | Fácil, Media, Difícil | n/a |
| rendimiento | number | no | optional (swagger), IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| unidadResultado | UnidadIngrediente | no | optional (swagger), IsOptional, IsEnum(UnidadIngrediente) | g, kg, l, ml, pieza, cda, cdta | n/a |
| diasCaducidad | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |
| pathImg | string | no | IsOptional, IsString | n/a | n/a |
| pathImgOptimized | string | no | IsOptional, IsString | n/a | n/a |
| raciones | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| tamanioRacion | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| ingredientes | AddIngredienteDto[] | sí | IsArray, ArrayMinSize(1), ValidateNested({"each":true}), Type(() => AddIngredienteDto) | n/a | n/a |

#### Side effects

- Delega en recetaService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/recetas/:id

Descripción: RecetaController.remove

- Módulo: receta
- Controller: RecetaController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 204
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 204
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/recetas/:id

Descripción: RecetaController.findOne

- Módulo: receta
- Controller: RecetaController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Receta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Receta

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaService.findOne()

### [PATCH] /api/v1/recetas/:id

Descripción: RecetaController.update

- Módulo: receta
- Controller: RecetaController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateRecetaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty, MaxLength(150) | n/a | n/a |
| instrucciones | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty | n/a | n/a |
| tiempoEstimadoMinutos | number | no | IsInt, Min(0) | n/a | n/a |
| dificultad | DificultadReceta | no | IsEnum(DificultadReceta) | Fácil, Media, Difícil | n/a |
| rendimiento | number | no | optional (swagger), IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| unidadResultado | UnidadIngrediente | no | optional (swagger), IsOptional, IsEnum(UnidadIngrediente) | g, kg, l, ml, pieza, cda, cdta | n/a |
| diasCaducidad | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |
| pathImg | string | no | IsOptional, IsString | n/a | n/a |
| pathImgOptimized | string | no | IsOptional, IsString | n/a | n/a |
| raciones | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| tamanioRacion | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| ingredientes | AddIngredienteDto[] | no | IsArray, ArrayMinSize(1), ValidateNested({"each":true}), Type(() => AddIngredienteDto) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Receta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateRecetaDto
- Response: Receta

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty, MaxLength(150) | n/a | n/a |
| instrucciones | string | no | Transform((params) => TrimStringTransformer.transform(params)), IsString, IsNotEmpty | n/a | n/a |
| tiempoEstimadoMinutos | number | no | IsInt, Min(0) | n/a | n/a |
| dificultad | DificultadReceta | no | IsEnum(DificultadReceta) | Fácil, Media, Difícil | n/a |
| rendimiento | number | no | optional (swagger), IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| unidadResultado | UnidadIngrediente | no | optional (swagger), IsOptional, IsEnum(UnidadIngrediente) | g, kg, l, ml, pieza, cda, cdta | n/a |
| diasCaducidad | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | n/a |
| pathImg | string | no | IsOptional, IsString | n/a | n/a |
| pathImgOptimized | string | no | IsOptional, IsString | n/a | n/a |
| raciones | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| tamanioRacion | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |
| ingredientes | AddIngredienteDto[] | no | IsArray, ArrayMinSize(1), ValidateNested({"each":true}), Type(() => AddIngredienteDto) | n/a | n/a |

#### Side effects

- Delega en recetaService.update()
- Operación de actualización o transición de estado

### [POST] /api/v1/recetas/:id/cocinar

Descripción: RecetaController.cocinar

- Módulo: receta
- Controller: RecetaController
- Handler: cocinar
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:cocinar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: CocinarRecetaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| cantidad | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | 1 |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CocinarRecetaDto
- Response: void

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| cantidad | number | no | optional (swagger), IsOptional, IsInt, Min(1) | n/a | 1 |

#### Side effects

- Delega en recetaService.cocinar()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/recetas/:id/detalle

Descripción: RecetaController.getDetalle

- Módulo: receta
- Controller: RecetaController
- Handler: getDetalle
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: DetalleRecetaDto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: DetalleRecetaDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaService.getDetalle()

### [GET] /api/v1/recetas/:id/escandallo

Descripción: Calcular el escandallo (coste) de una receta

- Módulo: receta
- Controller: RecetaController
- Handler: calcularEscandallo
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: RecetaCostResponseDto
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| recetaId | string | sí | n/a | n/a | n/a |
| recetaNombre | string | sí | n/a | n/a | n/a |
| costoTotal | number | sí | n/a | n/a | n/a |
| costoUnitarioEstimado | number | no | n/a | n/a | n/a |
| desglosePorIngrediente | IngredienteCostoDto[] | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 404: docs.RECETA_NO_ENCONTRADA
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 404
- 500

#### DTOs

- Request: n/a
- Response: RecetaCostResponseDto

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaService.calcularEscandallo()

### [GET] /api/v1/recetas/:id/pdf

Descripción: Generar PDF de una receta

- Módulo: receta
- Controller: RecetaController
- Handler: exportSinglePdf
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| includeImage | string | sí | n/a | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaPdfService.generatePdf()
- Devuelve stream/binario (application/pdf)

### [POST] /api/v1/recetas/:id/recalcular-costes

Descripción: Recalcular y guardar el coste unitario estimado de la receta

- Módulo: receta
- Controller: RecetaController
- Handler: recalcularCostes
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN, PROFESOR
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Receta
- Envelope global: success, message, data, meta
- Campos top-level de data:

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | n/a | n/a | n/a |
| instrucciones | string | sí | n/a | n/a | n/a |
| tiempoEstimadoMinutos | number | sí | n/a | n/a | n/a |
| dificultad | DificultadReceta | sí | n/a | Fácil, Media, Difícil | n/a |
| pathImg | string | no | n/a | n/a | n/a |
| pathImgOptimized | string | no | n/a | n/a | n/a |
| rendimiento | number | null | no | n/a | n/a | n/a |
| unidadResultado | UnidadIngrediente | null | no | n/a | g, kg, l, ml, pieza, cda, cdta | n/a |
| diasCaducidad | number | null | no | n/a | n/a | n/a |
| costeUnitarioEstimado | number | null | no | n/a | n/a | n/a |
| raciones | number | null | no | n/a | n/a | n/a |
| tamanioRacion | number | null | no | n/a | n/a | n/a |
| ingredientes | RecetaIngrediente[] | sí | n/a | n/a | n/a |
| id | string | sí | n/a | n/a | n/a |
| createdAt | Date (date-time) | sí | n/a | n/a | n/a |
| updatedAt | Date (date-time) | sí | n/a | n/a | n/a |
| deletedAt | Date | null (date-time) | no | n/a | n/a | n/a |
| deletedBy | string | null | no | n/a | n/a | n/a |
| modifiedBy | string | null | no | n/a | n/a | n/a |
| version | number | sí | n/a | n/a | n/a |

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Receta

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaService.recalcularCostes()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/recetas/calculate-preview

Descripción: Vista previa del coste de una receta antes de crearla/editarla

- Módulo: receta
- Controller: RecetaController
- Handler: calculatePreviewCost
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: RecetaPreviewCostDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| ingredientes | AddIngredienteDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => AddIngredienteDto) | n/a | n/a |
| rendimiento | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: RecetaCostResponseDto
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: RecetaPreviewCostDto
- Response: RecetaCostResponseDto

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| ingredientes | AddIngredienteDto[] | sí | IsArray, ValidateNested({"each":true}), Type(() => AddIngredienteDto) | n/a | n/a |
| rendimiento | number | no | IsOptional, Transform((params) => StringToNumberTransformer.transform(params)), IsNumber, Min(0.001) | n/a | n/a |

#### Side effects

- Delega en recetaService.calculatePreviewCost()
- Operación de alta/acción de negocio con persistencia probable

### [POST] /api/v1/recetas/duplicate

Descripción: RecetaController.duplicate

- Módulo: receta
- Controller: RecetaController
- Handler: duplicate
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:duplicar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: DuplicateRecetaDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| sourceId | string | sí | IsUUID(all) | n/a | n/a |
| newName | string | sí | IsString, MinLength(3), MaxLength(150) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Receta
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: DuplicateRecetaDto
- Response: Receta

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| sourceId | string | sí | IsUUID(all) | n/a | n/a |
| newName | string | sí | IsString, MinLength(3), MaxLength(150) | n/a | n/a |

#### Side effects

- Delega en recetaService.duplicate()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/recetas/export/pdf

Descripción: Generar PDF de varias recetas

- Módulo: receta
- Controller: RecetaController
- Handler: exportMultiplePdf
- Fuente: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: recetas:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/pdf | no | Recomendado para descargas/streams |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| ids | string | string[] | sí | n/a | n/a | n/a |
| includeImage | string | sí | n/a | n/a | n/a |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/pdf
- DTO/Tipo response: void

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en recetaPdfService.generatePdf()
- Devuelve stream/binario (application/pdf)

## Módulo: ubicacion

### Controller: UbicacionController

- Ruta base: /api/v1/ubicacion
- Tags Swagger: Ubicaciones
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Endpoints: 6

### [GET] /api/v1/ubicacion

Descripción: Obtener todas las ubicaciones

- Módulo: ubicacion
- Controller: UbicacionController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: ubicaciones:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| page | number | no | IsOptional, Type(() => Number), IsInt, Min(1) | n/a | 1 |
| limit | number | no | IsOptional, Type(() => Number), IsInt, Min(1), Max(50) | n/a | 20 |
| searchTerm | string | no | IsOptional | n/a | n/a |
| codigoBarras | string | no | IsOptional | n/a | n/a |
| sortBy | string | no | IsOptional, IsString | n/a | n/a |
| rol | string | no | IsOptional, IsString | n/a | n/a |
| estado | string | no | IsOptional, IsString | n/a | n/a |
| usuarioId | string | no | IsOptional, IsString | n/a | n/a |
| fechaDesde | string | no | IsOptional, IsDateString | n/a | n/a |
| fechaHasta | string | no | IsOptional, IsDateString | n/a | n/a |
| sinLote | boolean | no | IsOptional, Type(() => Boolean), IsBoolean | n/a | n/a |
| order | "ASC" | "DESC" | no | IsOptional, IsIn(["ASC","DESC"]) | ASC, DESC | ASC |

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Ubicacion>
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Ubicacion>

#### Validaciones y enums detectados

n/a

#### Side effects

- n/a

### [POST] /api/v1/ubicacion

Descripción: Crear nueva ubicación

- Módulo: ubicacion
- Controller: UbicacionController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: ubicaciones:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateUbicacionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | n/a | n/a | n/a |
| descripcion | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_SUPERAR_LOS_255' )"}) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Ubicacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateUbicacionDto
- Response: Ubicacion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | n/a | n/a | n/a |
| descripcion | string | no | optional (swagger), IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE' )"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.LA_DESCRIPCI_N_NO_PUEDE_SUPERAR_LOS_255' )"}) | n/a | n/a |

#### Side effects

- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/ubicacion/:id

Descripción: Eliminar una ubicación lógica

- Módulo: ubicacion
- Controller: UbicacionController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: ubicaciones:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: void
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: void

#### Validaciones y enums detectados

n/a

#### Side effects

- Operación de eliminación o baja lógica

### [GET] /api/v1/ubicacion/:id

Descripción: Obtener ubicación por ID

- Módulo: ubicacion
- Controller: UbicacionController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: ubicaciones:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Ubicacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Ubicacion

#### Validaciones y enums detectados

n/a

#### Side effects

- n/a

### [PATCH] /api/v1/ubicacion/:id

Descripción: Actualizar una ubicación

- Módulo: ubicacion
- Controller: UbicacionController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: ubicaciones:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateUbicacionDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| descripcion | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Ubicacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateUbicacionDto
- Response: Ubicacion

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |
| descripcion | string | no | Transform((params) => TrimStringTransformer.transform(params)) | n/a | n/a |

#### Side effects

- Operación de actualización o transición de estado

### [POST] /api/v1/ubicacion/:id/restore

Descripción: Restaurar una ubicación eliminada

- Módulo: ubicacion
- Controller: UbicacionController
- Handler: restore
- Fuente: backend/smart-economat-backend/src/modules/ubicacion/controller/ubicacion.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: ubicaciones:restaurar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDv7Pipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Ubicacion
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: Ubicacion

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en service.restore()
- Operación de alta/acción de negocio con persistencia probable
- Restaura un recurso previamente eliminado o cancelado

## Módulo: usuario

### Controller: UsuarioController

- Ruta base: /api/v1/usuarios
- Tags Swagger: n/a
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Endpoints: 18

### [GET] /api/v1/usuarios

Descripción: UsuarioController.findAll

- Módulo: usuario
- Controller: UsuarioController
- Handler: findAll
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: PaginatedResponseDto<Usuario>
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: PaginatedResponseDto<Usuario>

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.findAll()

### [POST] /api/v1/usuarios

Descripción: UsuarioController.create

- Módulo: usuario
- Controller: UsuarioController
- Handler: create
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: CreateUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | null | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA')"}), MaxLength(150) | n/a | n/a |
| username | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_ES_OBLIGATORIO' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| password | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX' )"}) | n/a | n/a |
| email | string | null | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail({}, {"message":"i18nValidationMessage('validation.INVALID_EMAIL')"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L' )"}) | n/a | n/a |
| rol | rolUsuario | sí | IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| status | UserStatus | sí | IsEnum(UserStatus, {"message":"i18nValidationMessage('validation.EL_ESTADO_NO_ES_V_LIDO')"}) | INACTIVE, ACTIVE, BLOCKED | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Usuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: CreateUsuarioDto
- Response: Usuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | null | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA')"}), MaxLength(150) | n/a | n/a |
| username | string | sí | Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA' )"}), IsNotEmpty({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_ES_OBLIGATORIO' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| password | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX' )"}) | n/a | n/a |
| email | string | null | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail({}, {"message":"i18nValidationMessage('validation.INVALID_EMAIL')"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L' )"}) | n/a | n/a |
| rol | rolUsuario | sí | IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| status | UserStatus | sí | IsEnum(UserStatus, {"message":"i18nValidationMessage('validation.EL_ESTADO_NO_ES_V_LIDO')"}) | INACTIVE, ACTIVE, BLOCKED | n/a |

#### Side effects

- Delega en usuarioService.create()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/usuarios/:id

Descripción: UsuarioController.remove

- Módulo: usuario
- Controller: UsuarioController
- Handler: remove
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:eliminar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { id: string; deleted: boolean; } | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: { id: string; deleted: boolean; } | null

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.remove()
- Operación de eliminación o baja lógica

### [GET] /api/v1/usuarios/:id

Descripción: UsuarioController.findOne

- Módulo: usuario
- Controller: UsuarioController
- Handler: findOne
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:ver
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Usuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.findOne()

### [PATCH] /api/v1/usuarios/:id

Descripción: UsuarioController.update

- Módulo: usuario
- Controller: UsuarioController
- Handler: update
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | null | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA')"}), MaxLength(150) | n/a | n/a |
| username | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| email | string | null | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail({}, {"message":"i18nValidationMessage('validation.INVALID_EMAIL')"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L' )"}) | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| status | UserStatus | no | IsOptional, IsEnum(UserStatus) | INACTIVE, ACTIVE, BLOCKED | n/a |
| cialProfesor | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_CIAL_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100) | n/a | n/a |
| numeroClase | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_N_MERO_DE_CLASE_DEBE_SER_UNA_CADENA_D' )"}), MaxLength(10) | n/a | n/a |
| aula | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_AULA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(50) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateUsuarioDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | null | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA')"}), MaxLength(150) | n/a | n/a |
| username | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| email | string | null | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail({}, {"message":"i18nValidationMessage('validation.INVALID_EMAIL')"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L' )"}) | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| status | UserStatus | no | IsOptional, IsEnum(UserStatus) | INACTIVE, ACTIVE, BLOCKED | n/a |
| cialProfesor | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_CIAL_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100) | n/a | n/a |
| numeroClase | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_N_MERO_DE_CLASE_DEBE_SER_UNA_CADENA_D' )"}), MaxLength(10) | n/a | n/a |
| aula | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_AULA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(50) | n/a | n/a |

#### Side effects

- Delega en usuarioService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/usuarios/:id/activar

Descripción: UsuarioController.updateStatus

- Módulo: usuario
- Controller: UsuarioController
- Handler: updateStatus
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateUsuarioStatusDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| status | UserStatus | sí | IsEnum(UserStatus, {"message":"i18nValidationMessage('validation.EL_ESTADO_NO_ES_V_LIDO')"}) | INACTIVE, ACTIVE, BLOCKED | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateUsuarioStatusDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| status | UserStatus | sí | IsEnum(UserStatus, {"message":"i18nValidationMessage('validation.EL_ESTADO_NO_ES_V_LIDO')"}) | INACTIVE, ACTIVE, BLOCKED | n/a |

#### Side effects

- Delega en usuarioService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/usuarios/:id/admin

Descripción: UsuarioController.updateAdmin

- Módulo: usuario
- Controller: UsuarioController
- Handler: updateAdmin
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: AdminUpdateUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| activo | boolean | no | IsOptional, IsBoolean({"message":"i18nValidationMessage( 'validation.ESTADO_ACTIVO_DEBE_SER_BOOLEANO' )"}) | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.ROL_USUARIO_NO_VALIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: AdminUpdateUsuarioDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| activo | boolean | no | IsOptional, IsBoolean({"message":"i18nValidationMessage( 'validation.ESTADO_ACTIVO_DEBE_SER_BOOLEANO' )"}) | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.ROL_USUARIO_NO_VALIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |

#### Side effects

- Delega en usuarioService.updateAdmin()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/usuarios/:id/password

Descripción: UsuarioController.updatePassword

- Módulo: usuario
- Controller: UsuarioController
- Handler: updatePassword
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: ResetPasswordDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| password | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.LA_CONTRASE_A_ES_OBLIGATORIA')"}) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: ResetPasswordDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| password | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.LA_CONTRASE_A_ES_OBLIGATORIA')"}) | n/a | n/a |

#### Side effects

- Delega en usuarioService.resetPassword()
- Operación de actualización o transición de estado

### [DELETE] /api/v1/usuarios/:id/permisos-adicionales/:permisoId

Descripción: UsuarioController.removeAdditionalPermission

- Módulo: usuario
- Controller: UsuarioController
- Handler: removeAdditionalPermission
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |
| permisoId | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: Usuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.removeAdditionalPermission()
- Operación de eliminación o baja lógica

### [POST] /api/v1/usuarios/:id/permisos-adicionales/:permisoId

Descripción: UsuarioController.addAdditionalPermission

- Módulo: usuario
- Controller: UsuarioController
- Handler: addAdditionalPermission
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |
| permisoId | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Usuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Usuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.addAdditionalPermission()
- Operación de alta/acción de negocio con persistencia probable

### [DELETE] /api/v1/usuarios/:id/permisos-excluidos/:permisoId

Descripción: UsuarioController.removeExcludedPermission

- Módulo: usuario
- Controller: UsuarioController
- Handler: removeExcludedPermission
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |
| permisoId | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { success: boolean; }
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: n/a
- Response: { success: boolean; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.removeExcludedPermission()
- Operación de eliminación o baja lógica

### [POST] /api/v1/usuarios/:id/permisos-excluidos/:permisoId

Descripción: UsuarioController.addExcludedPermission

- Módulo: usuario
- Controller: UsuarioController
- Handler: addExcludedPermission
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |
| permisoId | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Usuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Usuario

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.addExcludedPermission()
- Operación de alta/acción de negocio con persistencia probable

### [PATCH] /api/v1/usuarios/:id/rol

Descripción: UsuarioController.updateRol

- Módulo: usuario
- Controller: UsuarioController
- Handler: updateRol
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:editar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| id | string | sí | ParseUUIDPipe | n/a | n/a |

#### Query params

n/a

#### Request Body

- DTO request: UpdateUsuarioRolDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| rol | rolUsuario | sí | IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateUsuarioRolDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| rol | rolUsuario | sí | IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |

#### Side effects

- Delega en usuarioService.update()
- Operación de actualización o transición de estado

### [POST] /api/v1/usuarios/admin

Descripción: UsuarioController.createAdmin

- Módulo: usuario
- Controller: UsuarioController
- Handler: createAdmin
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: ADMIN
- Permisos requeridos: ALL: usuarios:crear
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: AdminCreateUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | IsString({"message":"i18nValidationMessage( 'validation.NOMBRE_COMPLETO_DEBE_SER_CADENA' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.NOMBRE_COMPLETO_OBLIGATORIO')"}), MaxLength(150, {"message":"i18nValidationMessage('validation.NOMBRE_COMPLETO_MAX_LENGTH')"}) | n/a | n/a |
| username | string | sí | IsString({"message":"i18nValidationMessage('validation.NOMBRE_USUARIO_DEBE_SER_CADENA')"}), IsNotEmpty({"message":"i18nValidationMessage('validation.NOMBRE_USUARIO_OBLIGATORIO')"}), MaxLength(100, {"message":"i18nValidationMessage('validation.NOMBRE_USUARIO_MAX_LENGTH')"}) | n/a | n/a |
| password | string | sí | IsString({"message":"i18nValidationMessage('validation.CONTRASEÑA_DEBE_SER_CADENA')"}) | n/a | n/a |
| email | string | null | no | IsOptional, IsEmail({}, {"message":"i18nValidationMessage('validation.CORREO_ELECTRONICO_NO_VALIDO')"}), MaxLength(255, {"message":"i18nValidationMessage('validation.CORREO_ELECTRONICO_MAX_LENGTH')"}) | n/a | n/a |
| rol | rolUsuario | sí | IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.ROL_USUARIO_NO_VALIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| aula | string | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.AULA_CLASE_DEBE_SER_CADENA')"}) | n/a | n/a |
| cial | string | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.CIAL_DEBE_SER_CADENA')"}) | n/a | n/a |

#### Response OK

- Status OK principal: 201
- MIME: application/json
- DTO/Tipo response: Usuario
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 201
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: AdminCreateUsuarioDto
- Response: Usuario

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | sí | IsString({"message":"i18nValidationMessage( 'validation.NOMBRE_COMPLETO_DEBE_SER_CADENA' )"}), IsNotEmpty({"message":"i18nValidationMessage('validation.NOMBRE_COMPLETO_OBLIGATORIO')"}), MaxLength(150, {"message":"i18nValidationMessage('validation.NOMBRE_COMPLETO_MAX_LENGTH')"}) | n/a | n/a |
| username | string | sí | IsString({"message":"i18nValidationMessage('validation.NOMBRE_USUARIO_DEBE_SER_CADENA')"}), IsNotEmpty({"message":"i18nValidationMessage('validation.NOMBRE_USUARIO_OBLIGATORIO')"}), MaxLength(100, {"message":"i18nValidationMessage('validation.NOMBRE_USUARIO_MAX_LENGTH')"}) | n/a | n/a |
| password | string | sí | IsString({"message":"i18nValidationMessage('validation.CONTRASEÑA_DEBE_SER_CADENA')"}) | n/a | n/a |
| email | string | null | no | IsOptional, IsEmail({}, {"message":"i18nValidationMessage('validation.CORREO_ELECTRONICO_NO_VALIDO')"}), MaxLength(255, {"message":"i18nValidationMessage('validation.CORREO_ELECTRONICO_MAX_LENGTH')"}) | n/a | n/a |
| rol | rolUsuario | sí | IsEnum(rolUsuario, {"message":"i18nValidationMessage('validation.ROL_USUARIO_NO_VALIDO')"}) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| aula | string | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.AULA_CLASE_DEBE_SER_CADENA')"}) | n/a | n/a |
| cial | string | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.CIAL_DEBE_SER_CADENA')"}) | n/a | n/a |

#### Side effects

- Delega en usuarioService.createAdmin()
- Operación de alta/acción de negocio con persistencia probable

### [GET] /api/v1/usuarios/minimos

Descripción: UsuarioController.findAllMinimal

- Módulo: usuario
- Controller: UsuarioController
- Handler: findAllMinimal
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: ALL: usuarios:listar
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario[]
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: Usuario[]

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.findAllMinimal()

### [GET] /api/v1/usuarios/perfil

Descripción: UsuarioController.getPerfil

- Módulo: usuario
- Controller: UsuarioController
- Handler: getPerfil
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: n/a
- Content-Type: n/a

n/a

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: { permisos: string[]; nombre?: string | null; username: string; password: string; email?: string | null; rol: rolUsuario; status: UserStatus; resetPasswordOtp?: string | null; resetPasswordOtpExpires?: Date | null; mustChangePassword: boolean; pedidos: Relation<Pedido[]>; recepciones: Relation<Recepcion[]>; movimientos: Relation<Movimiento[]>; incidenciasResueltas: Relation<Incidencia[]>; archivos: Relation<Archivo[]>; profesor?: Relation<Profesor>; alumno?: Relation<Alumno>; roles: Rol[]; permisosAdicionales: Permiso[]; permisosExcluidos: Permiso[]; activo: boolean; id: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null; deletedBy?: string | null; modifiedBy?: string | null; version: number; }
- Envelope global: success, message, data, meta

#### Response error

- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 401
- 403
- 500

#### DTOs

- Request: n/a
- Response: { permisos: string[]; nombre?: string | null; username: string; password: string; email?: string | null; rol: rolUsuario; status: UserStatus; resetPasswordOtp?: string | null; resetPasswordOtpExpires?: Date | null; mustChangePassword: boolean; pedidos: Relation<Pedido[]>; recepciones: Relation<Recepcion[]>; movimientos: Relation<Movimiento[]>; incidenciasResueltas: Relation<Incidencia[]>; archivos: Relation<Archivo[]>; profesor?: Relation<Profesor>; alumno?: Relation<Alumno>; roles: Rol[]; permisosAdicionales: Permiso[]; permisosExcluidos: Permiso[]; activo: boolean; id: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null; deletedBy?: string | null; modifiedBy?: string | null; version: number; }

#### Validaciones y enums detectados

n/a

#### Side effects

- Delega en usuarioService.findOne(), usuarioService.getUserPermissions()

### [PATCH] /api/v1/usuarios/perfil

Descripción: UsuarioController.updatePerfil

- Módulo: usuario
- Controller: UsuarioController
- Handler: updatePerfil
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: UpdateUsuarioDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | null | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA')"}), MaxLength(150) | n/a | n/a |
| username | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| email | string | null | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail({}, {"message":"i18nValidationMessage('validation.INVALID_EMAIL')"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L' )"}) | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| status | UserStatus | no | IsOptional, IsEnum(UserStatus) | INACTIVE, ACTIVE, BLOCKED | n/a |
| cialProfesor | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_CIAL_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100) | n/a | n/a |
| numeroClase | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_N_MERO_DE_CLASE_DEBE_SER_UNA_CADENA_D' )"}), MaxLength(10) | n/a | n/a |
| aula | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_AULA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(50) | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 409: Conflicto de persistencia posible por GlobalExceptionFilter/QueryFailedError
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 409
- 500

#### DTOs

- Request: UpdateUsuarioDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| nombre | string | null | no | IsOptional, IsString({"message":"i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA')"}), MaxLength(150) | n/a | n/a |
| username | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA' )"}), MaxLength(100, {"message":"i18nValidationMessage( 'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO' )"}) | n/a | n/a |
| email | string | null | no | IsOptional, Transform((params) => LowercaseStringTransformer.transform(params)), IsEmail({}, {"message":"i18nValidationMessage('validation.INVALID_EMAIL')"}), MaxLength(255, {"message":"i18nValidationMessage( 'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L' )"}) | n/a | n/a |
| rol | rolUsuario | no | IsOptional, IsEnum(rolUsuario) | SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO | n/a |
| status | UserStatus | no | IsOptional, IsEnum(UserStatus) | INACTIVE, ACTIVE, BLOCKED | n/a |
| cialProfesor | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_CIAL_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(100) | n/a | n/a |
| numeroClase | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_N_MERO_DE_CLASE_DEBE_SER_UNA_CADENA_D' )"}), MaxLength(10) | n/a | n/a |
| aula | string | no | IsOptional, Transform((params) => TrimStringTransformer.transform(params)), IsString({"message":"i18nValidationMessage( 'validation.EL_AULA_DEBE_SER_UNA_CADENA_DE_TEXTO' )"}), MaxLength(50) | n/a | n/a |

#### Side effects

- Delega en usuarioService.update()
- Operación de actualización o transición de estado

### [PATCH] /api/v1/usuarios/perfil/password

Descripción: UsuarioController.changePassword

- Módulo: usuario
- Controller: UsuarioController
- Handler: changePassword
- Fuente: backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts
- Auth requerida: sí
- Roles permitidos: n/a
- Permisos requeridos: n/a
- Guards: SmartAuthThrottlerGuard, JwtAuthGuard, RolesGuard, PermisosGuard
- Interceptors: HighTrafficAlertInterceptor, ClassSerializerInterceptor, TransformInterceptor
- Middlewares: cookieParser, helmet
- Pipes globales: NormalizeDataPipe, I18nValidationPipe

#### Headers

| Header | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| Authorization | Bearer <JWT> | no | Alternativa soportada: cookie access_token |
| Content-Type | application/json | sí | n/a |
| Accept | application/json | no | Por defecto JSON |
| x-request-id | string | no | Si no se envía, TransformInterceptor/GlobalExceptionFilter lo generan |

#### Path params

n/a

#### Query params

n/a

#### Request Body

- DTO request: ChangePasswordDto
- Content-Type: application/json

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| oldPassword | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_ACTUAL_ES_OBLIGATORIA' )"}), IsNotEmpty | n/a | n/a |
| newPassword | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_NUEVA_CONTRASE_A_DEBE_SER_UNA_CADENA' )"}), IsNotEmpty | n/a | n/a |

#### Response OK

- Status OK principal: 200
- MIME: application/json
- DTO/Tipo response: Usuario | null
- Envelope global: success, message, data, meta

#### Response error

- 400: Validación/pipes globales (NormalizeDataPipe + I18nValidationPipe)
- 401: Autenticación JWT requerida
- 403: Control de acceso por rol o permisos
- 500: Error inesperado normalizado por GlobalExceptionFilter

#### Status codes

- 200
- 400
- 401
- 403
- 500

#### DTOs

- Request: ChangePasswordDto
- Response: Usuario | null

#### Validaciones y enums detectados

| Campo | Tipo | Requerido | Validaciones | Enum | Default |
| --- | --- | --- | --- | --- | --- |
| oldPassword | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_CONTRASE_A_ACTUAL_ES_OBLIGATORIA' )"}), IsNotEmpty | n/a | n/a |
| newPassword | string | sí | IsString({"message":"i18nValidationMessage( 'validation.LA_NUEVA_CONTRASE_A_DEBE_SER_UNA_CADENA' )"}), IsNotEmpty | n/a | n/a |

#### Side effects

- Delega en usuarioService.changePassword()
- Operación de actualización o transición de estado
