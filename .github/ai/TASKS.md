# Tareas Operativas

## Checklist activa

1. Auditar requests del frontend y su uso real del contrato `/api/v1`.
2. Corregir payloads y query params que no coincidan con los DTOs o filtros del backend.
3. Alinear DTOs, tipos, enums y schemas del cliente con los contratos públicos del backend.
4. Refactorizar hooks y servicios para reutilizar el cliente API central y evitar duplicaciones.
5. Eliminar `400 Bad Request` causados por campos legacy, enums mal serializados o shapes incorrectos.
6. Estabilizar el pipeline de CI/CD resolviendo errores de linting y formato en el frontend.

## Criterio de cierre

- sin requests fuera de contrato en el flujo afectado;
- sin lógica API duplicada en componentes;
- con verificación de testing y validación contractual completada.

## Tareas completadas (Abril 2026) ✅

- [x] **Elasticidad del Catálogo**: Implementación del campo `precioReferencia` en la entidad `Producto` y DTOs para permitir productos sin proveedores inmediatos.
- [x] **Automatización de Costes**: Lógica de sincronización `PMP` -> `precioReferencia` en el backend para mantener costes maestros actualizados.
- [x] **Rediseño UX de Productos**: Nuevo layout de formulario responsivo con imagen lateral, alineación vertical centrada y fila técnica optimizada.
- [x] **Limpieza de UI**: Implementación de visibilidad condicionada de precios y avisos de suministro ("Sin Prov.") en tablas y tarjetas.
- [x] **Herencia de Códigos de Barras**: Implementación de lógica de herencia automática Producto -> Proveedor con soporte para override y visualización dinámica en el frontend.
- [x] **Estandarización UX de Interacción**: Eliminación de redundancias (ojo de visualización) y unificación del patrón de navegación (click en fila = ver detalle) en los módulos de Recetas, Proveedores e Inventario.
- [x] **Estabilidad de Entorno**: Sincronización manual de esquema de BD ante fallos de entorno.