# Tareas Operativas

## Checklist activa

1. Auditar requests del frontend y su uso real del contrato `/api/v1`.
2. Corregir payloads y query params que no coincidan con los DTOs o filtros del backend.
3. Alinear DTOs, tipos, enums y schemas del cliente con los contratos públicos del backend.
4. Refactorizar hooks y servicios para reutilizar el cliente API central y evitar duplicaciones.
5. Eliminar `400 Bad Request` causados por campos legacy, enums mal serializados o shapes incorrectos.

## Criterio de cierre

- sin requests fuera de contrato en el flujo afectado;
- sin lógica API duplicada en componentes;
- con verificación de testing y validación contractual completada.