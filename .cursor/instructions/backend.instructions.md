---
description: "Use when working on NestJS, TypeORM, DTOs, controllers, guards, services, transactions, API contracts, validation pipes, enums, backend tests, and schema-related changes."
name: "Backend Contract Rules"
applyTo: "backend/smart-economat-backend/src/**/*.ts, backend/smart-economat-backend/test/**/*.ts"
---

# Instrucciones Backend

- leer `ARCHITECTURE.md`, `PROJECT_RULES.md`, `TASKS.md` y `TESTING_RULES.md` antes de modificar contratos o validaciones;
- mantener DTOs, enums, filtros y respuestas como contratos canónicos del sistema;
- no relajar validaciones del backend para encubrir bugs del frontend sin una razón funcional documentada;
- respetar `ValidationPipe` estricto, los DTOs por operación y la separación controller → service → repository;
- usar tipado estricto y no usar `any`;
- mantener lógica de negocio en servicios y transacciones cuando se tocan varias entidades relacionadas;
- si cambia un contrato público, actualizar pruebas y documentación asociadas en la misma intervención;
- evitar duplicar serialización, mapeos o reglas de permisos fuera de las capas ya establecidas.