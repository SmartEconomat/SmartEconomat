---
description: "Use when working on React, Vite, frontend hooks, forms, payloads, DTO alignment, API client centralization, backend contract fixes, schema validation, and 400 Bad Request issues."
name: "Frontend Integration Rules"
applyTo: "frontend/smart-economat-frontend/src/**/*.ts, frontend/smart-economat-frontend/src/**/*.tsx"
---

# Instrucciones Frontend

- leer `ARCHITECTURE.md`, `PROJECT_RULES.md`, `TASKS.md` y `TESTING_RULES.md` antes de cambios amplios;
- tomar el backend como fuente de verdad para DTOs, enums, filtros y respuestas;
- centralizar el transporte HTTP en `src/services/api.service.ts` y en los servicios por módulo; no hacer `fetch` directo desde componentes;
- no duplicar lógica de auth, serialización de payloads o normalización de respuestas en hooks y componentes;
- preferir corregir el cliente antes que pedir cambios de backend cuando el problema sea una desalineación contractual;
- usar tipado estricto y no usar `any`;
- si aparece un `400 Bad Request`, revisar nombres de campos legacy, query params, enums serializados y shape de objetos o arrays antes de tocar la API;
- mantener la UI estable y consistente mientras se corrigen contratos.