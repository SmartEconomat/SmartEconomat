# Reglas de Testing

## Validaciones obligatorias

- validar requests reales contra los DTOs, enums y filtros del backend;
- no permitir regresiones que provoquen `400 Bad Request` en flujos soportados;
- validar tipos serializados por el frontend y conversiones de datos antes de enviar payloads;
- validar schemas, envelopes y shapes de respuesta esperados por el cliente.

## Prioridades

- priorizar pruebas de contratos frontend-backend cuando se tocan servicios, formularios o payloads;
- reutilizar la suite E2E de contratos existente cuando el cambio afecte integración;
- acompañar cualquier cambio de contrato con pruebas y documentación actualizadas.

## Cierre técnico

- ejecutar build, lint y tests relevantes al alcance del cambio;
- revisar que los fallos de validación esperados sigan siendo explícitos y no oculten bugs de integración.