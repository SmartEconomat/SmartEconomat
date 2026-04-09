# Tests E2E de Contratos Frontend-Backend

Documenta la suite de regresión creada para verificar que el frontend use el contrato real de la API del backend sin provocar errores `400 Bad Request` por desalineación de DTOs, enums o filtros.

## Objetivo

Esta suite valida los supuestos de integración corregidos entre:

- frontend React/Vite
- backend NestJS
- validación global con `whitelist`, `forbidNonWhitelisted` y `transform`

El foco no es probar todo el dominio, sino asegurar que los payloads y query params que el frontend envía están alineados con los controladores y DTOs reales del backend.

## Archivo principal

- [backend/smart-economat-backend/test/e2e/frontend-integration-contracts.e2e-spec.ts](../../../backend/smart-economat-backend/test/e2e/frontend-integration-contracts.e2e-spec.ts)

## Cobertura actual

La suite comprueba estos contratos de integración:

### 1. Usuarios

- listado con `page`, `limit`, `searchTerm`, `sortBy`, `order`
- rechazo de contraseña débil en `PATCH /usuarios/perfil/password`
- rechazo del payload legado con `nombre` en `PATCH /usuarios/perfil`

### 2. Productos

- aceptación de enums normalizados del frontend
- aceptación de alérgenos uppercase como `LACTEOS` y `GLUTEN`
- aceptación de `marcaEspecifica` en proveedores asociados

### 3. Pedidos

- aceptación del payload correcto con `lineas`
- rechazo del payload legado con `pedidoProductos`

### 4. Recepción

- aceptación de `productosNuevos` con el shape corregido
- rechazo de campos legacy no permitidos como `estadoVisual` y `fechaCaducidad` dentro de `productosNuevos`

### 5. Inventario

- aceptación de `fechaCaducidad` en formato ISO en creación de inventario

### 6. Recetas

- rechazo de `tiempoPreparacion` no normalizado como `30 min`
- obligación de enviar el formato esperado por backend, por ejemplo `30 minutos`

### 7. Incidencias

- aceptación de filtros `resuelta`, `startDate`, `endDate`, `searchTerm`

## Orden recomendado de la suite

La suite está ordenada por flujo de integración, no por módulo interno del backend:

1. Usuarios
2. Productos
3. Pedidos
4. Recepción
5. Inventario
6. Recetas
7. Incidencias

Ese orden facilita entender cómo se encadenan los datos necesarios para probar los contratos reales del frontend.

## Ejecución

Desde [backend/smart-economat-backend](../../../backend/smart-economat-backend):

- suite específica:
  - `npm run test:e2e:file -- test/e2e/frontend-integration-contracts.e2e-spec.ts`
- suite E2E agregada:
  - `npm run test:e2e`

## Relación con la infraestructura de tests

Esta suite depende de la infraestructura E2E documentada en:

- [README de testing](README.md)
- [Análisis de rendimiento de tests](../testing-performance-analysis.md)

Además, los tests E2E usan la misma validación global que producción en:

- [backend/smart-economat-backend/test/setup/test-app.ts](../../../backend/smart-economat-backend/test/setup/test-app.ts)

Esto es importante porque evita falsos positivos: si producción rechaza propiedades extra o usa conversión implícita, la suite E2E debe comportarse igual.

## Cuándo ampliar esta suite

Debe ampliarse cuando el frontend cambie cualquiera de estos puntos:

- nombres de campos enviados al backend
- enums serializados por formularios
- filtros de listados
- payloads batch de recepción
- DTOs de perfil, auth, pedidos, recetas o incidencias

También debe ampliarse cuando el backend endurezca validaciones o cambie DTOs públicos.

## Estado actual

- Suite específica creada
- Integrada en `test/e2e/all.e2e-spec.ts`
- Validada dentro de la suite E2E completa del backend