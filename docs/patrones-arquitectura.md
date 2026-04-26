# Patrones de arquitectura y diseño

Este documento describe los patrones usados realmente en el codigo de SmartEconomat, con ejemplos en backend y frontend.

## Objetivo

- Identificar patrones implementados (no teoricos).
- Explicar en que parte del codigo se aplican.
- Servir como referencia para mantener consistencia al desarrollar.

## Backend (NestJS + TypeORM)

### Factory (construccion de agregados)

Se aplica en la construccion de pedidos dentro de `backend/smart-economat-backend/src/application/pedido/pedido.factory.ts`.

- Funcion principal: `buildPedidoAggregate(...)`.
- Responsabilidad:
  - valida lineas y referencias de `ProductoProveedor`;
  - calcula `costeTotal`;
  - construye el agregado (`Pedido` + lineas `PedidoProducto`) sin persistir todavia.

Beneficio: separa la logica de construccion/validacion del agregado de la capa de servicio y facilita testeo aislado.

### Repository base (abstraccion de persistencia)

Se aplica con `BaseRepository<T>` en `backend/smart-economat-backend/src/common/base/base.repository.ts`.

- Encapsula transacciones con `transactional(...)`.
- Normaliza manejo de errores transaccionales.

Beneficio: reduce duplicacion de codigo de persistencia y da un punto comun para politicas de acceso a datos.

### Service base (template de CRUD)

Se aplica con `BaseService<T, CreateDto, UpdateDto>` en `backend/smart-economat-backend/src/common/base/base.service.ts`.

- Define flujo comun (`findOne`, `findAll`, `create`, `update`, `remove`, `transactional`).
- Obliga a implementar `getNotFoundMessage()` en servicios concretos.

Beneficio: estandariza comportamiento CRUD y disminuye variabilidad entre modulos.

### Adapter (puerto entre capas)

Se aplica en `backend/smart-economat-backend/src/modules/movimiento/adapter/movimiento.adapter.ts`.

- `MovimientoAdapter` implementa `MovimientoPort`.
- Delega en `MovimientoService`.

Beneficio: desacopla consumidor y proveedor del comportamiento, facilitando evolucion por puertos/adaptadores.

### Strategy (autenticacion con Passport)

Se aplica en `backend/smart-economat-backend/src/modules/auth/strategies/jwt.strategy.ts`.

- `JwtStrategy` extiende `PassportStrategy(Strategy)`.
- Define extraccion de token por cabecera Bearer y cookie `access_token`.
- Encapsula validacion de identidad y estado de usuario.

Beneficio: encapsula la estrategia de autenticacion y permite cambiar mecanismo sin tocar controladores.

### Pipeline global (Cross-cutting concerns)

Se configura en `backend/smart-economat-backend/src/main.ts`.

- Pipes globales: normalizacion y validacion (`NormalizeDataPipe`, `I18nValidationPipe`).
- Filtro global de excepciones.
- Interceptores globales para serializacion y formato de respuesta.

Beneficio: centraliza seguridad y consistencia de respuestas en toda la API.

## Frontend (React + Router + Context)

### Arquitectura frontend (capas)

Arquitectura en capas para separar UI, reglas de presentacion y acceso HTTP:

1. **Presentacion** (`pages/`, `components/`, `features/`): pantallas y componentes.
2. **Navegacion y control de acceso** (`routes/`): `AppRouter`, `ProtectedRoute`, `PublicRoute`.
3. **Estado transversal** (`store/`, `sherlock-auth/`): autenticacion, permisos, tema, toasts.
4. **Integracion API** (`services/`): cliente HTTP comun + servicios por dominio.
5. **Utilidades compartidas** (`utils/`, `hooks/`, `types/`): helpers, hooks reutilizables, tipado.

### Service Layer / API Gateway

Se aplica en `frontend/smart-economat-frontend/src/services/api.service.ts` y servicios por modulo.

- `baseFetch(...)` centraliza:
  - `credentials: "include"`;
  - proteccion CSRF;
  - validaciones de contrato antes del request;
  - manejo estandar de errores (`ApiError`).

Beneficio: evita duplicar reglas HTTP en componentes y mantiene alineacion contractual frontend-backend.

### Route Guard

Se aplica en `frontend/smart-economat-frontend/src/routes/ProtectedRoute.tsx`.

- Valida sesion resuelta, autenticacion y permisos.
- Redirige segun contexto de autorizacion.

Beneficio: control de acceso declarativo y consistente en toda la navegacion.

### Lazy Loading + Suspense

Se aplica en `frontend/smart-economat-frontend/src/routes/AppRouter.tsx`.

- Paginas pesadas de autenticacion se cargan con `React.lazy`.
- `Suspense` muestra fallback de carga.

Beneficio: reduce bundle inicial y mejora tiempo de arranque percibido.

### Context Provider

Se aplica en `frontend/smart-economat-frontend/src/sherlock-auth/provider.tsx`.

- `AuthProvider` concentra ciclo de sesion:
  - bootstrap de usuario;
  - refresh periodico;
  - reaccion a eventos globales (`AUTH_UNAUTHORIZED`, `AUTH_EVENTS.REFRESH_USER`).

Beneficio: centraliza estado de autenticacion y evita logica repetida en multiples vistas.

### Higher-Order Component (HOC)

Se aplica en `frontend/smart-economat-frontend/src/components/common/Auth/withPermission.tsx`.

- `withPermission(...)` envuelve componentes con una regla de permisos.
- Permite fallback configurable.

Beneficio: reutiliza control fino de autorizacion en componentes sin duplicar condicionales.

## Recomendaciones de uso

- Mantener la creacion de agregados complejos en factories de aplicacion.
- Evitar requests directos desde componentes; usar siempre `services/`.
- Mantener reglas de acceso en rutas/HOC/hooks, no embebidas en JSX disperso.
- Si se introduce un nuevo patron, documentarlo en este archivo y enlazarlo desde `docs/README.md`.
