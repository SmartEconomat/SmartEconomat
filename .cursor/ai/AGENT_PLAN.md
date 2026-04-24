# Plan del Agente

## Auditoría

- revisar la arquitectura vigente antes de tocar código o contratos;
- inventariar endpoints, payloads, hooks, servicios y DTOs afectados;
- detectar desalineaciones entre frontend y backend, especialmente en filtros, enums y campos legacy.

## Refactor

- centralizar lógica compartida en servicios y cliente API;
- eliminar duplicaciones de serialización, auth y normalización de respuestas;
- mantener los cambios acotados, coherentes con la estructura existente y sin romper la UI.

## Validación

- confirmar que cada cambio respeta `ARCHITECTURE.md` y `PROJECT_RULES.md`;
- alinear tipos, DTOs, enums y schemas con el backend como fuente de verdad;
- revisar que no se introducen `any`, atajos de validación ni contratos paralelos.

## Testing

- ejecutar build, lint y pruebas relevantes al alcance del cambio;
- priorizar pruebas de contratos frontend-backend cuando se tocan requests o payloads;
- añadir o actualizar pruebas si cambia el comportamiento observable.

## Verificación final

- comprobar que no hay conflictos Git ni archivos fuera de alcance modificados;
- revisar el flujo principal afectado para evitar regresiones de runtime;
- cerrar la tarea solo cuando estructura, contratos y validaciones queden consistentes.