# Reglas del Proyecto

## Reglas obligatorias

- no romper la UI existente sin una razón clara y validación posterior;
- no cambiar el backend ni sus contratos públicos como atajo para corregir desalineaciones del frontend;
- usar tipado estricto en TypeScript;
- no usar `any`;
- centralizar el cliente API en `frontend/smart-economat-frontend/src/services/api.service.ts` y en los servicios por módulo;
- no duplicar lógica de requests, auth, mapeo de payloads o normalización de respuestas en componentes y hooks;
- tratar el backend como fuente de verdad para DTOs, enums, filtros, schemas y envelopes de respuesta;
- **UX/Rendimiento**: evitar bloqueos globales con Spinners de pantalla completa; priorizar el uso de **Skeletons** contextuales;
- **Code Splitting**: implementar `React.lazy` y `Suspense` en componentes pesados (modales, páginas) para optimizar el bundle inicial;
- **Accesibilidad**: mantener una jerarquía semántica rigurosa (un solo `h1` por página, sin saltos de nivel en `h2-h6`) y asegurar que todo `IconButton` tenga un `aria-label` descriptivo.

## Criterios de implementación

- mantener los cambios pequeños y enfocados;
- respetar convenciones de nombres, DTOs y módulos ya definidas en el repositorio;
- actualizar documentación e instrucciones cuando cambie una regla operativa relevante.