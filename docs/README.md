# Documentación SmartEconomat

Centro de documentación técnica del monorepo: economato educativo (catálogo, compras, recepción, inventario, producción, RBAC, módulo educativo) y **ElectronInstaller** para despliegue asistido.

**Principio de veracidad:** si un documento contradice el código o la configuración real, prevalece el repositorio. Esta carpeta se mantiene alineada con esa regla.

---

## Mapa mental

| Necesidad | Documento o carpeta |
| --- | --- |
| Incorporación rápida | [onboarding/README.md](./onboarding/README.md) |
| Instalar y levantar stack | [installation.md](./installation.md) |
| Entorno, puertos, dominios, TLS | [configuration.md](./configuration.md) |
| Variables de entorno (inventario) | [environment-variables.md](./environment-variables.md) |
| Visión full-stack | [architecture.md](./architecture.md) |
| Detalle por capa y decisiones | [architecture/index.md](./architecture/index.md) |
| Patrones reutilizables | [patrones-arquitectura.md](./patrones-arquitectura.md) |
| Reglas de negocio | [business-rules.md](./business-rules.md) |
| Día a día de desarrollo | [development.md](./development.md) |
| Pruebas (Jest, Vitest, Playwright, E2E) | [testing.md](./testing.md) |
| CI/CD y producción | [deployment.md](./deployment.md) |
| Fallos habituales | [troubleshooting.md](./troubleshooting.md) y [operations/troubleshooting/](./operations/troubleshooting/README.md) |
| Preguntas frecuentes | [faq.md](./faq.md) |
| Historial documental | [changelog.md](./changelog.md) |
| Última auditoría documental | [documentation-audit-report.md](./documentation-audit-report.md) |

---

## Estructura de `docs/`

Las carpetas siguientes tienen **propósito estable**. El detalle (cientos de ficheros en subárboles) se explora desde el README de cada bloque.

| Carpeta | Contenido |
| --- | --- |
| [onboarding/](./onboarding/) | Ruta de lectura para nuevos desarrolladores. |
| [architecture/](./architecture/) | Profundización: backend, frontend, modelo de datos, UUID v7, soft delete, trade-offs. |
| [reference/](./reference/) | API, endpoints, pipes/guards, dependencias, máquinas de estado. |
| [security/](./security/) | Autenticación, RBAC, CSRF, TLS, flujos educativos. |
| [operations/](./operations/) | HTTPS local, runbooks, troubleshooting operativo. |
| [development/](./development/) | Guías de testing, rendimiento, trabajo en equipo, quick references. |
| [how-to/](./how-to/) | Recetas técnicas (migraciones, transacciones, entidades, logging). |
| [explanation/](./explanation/) | Contexto y trade-offs de diseño. |
| [diagrams/](./diagrams/) | Diagramas Mermaid y apoyo visual. |
| [frontend/](./frontend/README.md) | Cliente React: componentes, páginas, UI kit, accesibilidad. |
| [modules/](./modules/) | Dominio por módulo (pedido, inventario, recepción, etc.). |
| [installer/](./installer/) | Documentación narrativa del instalador (además de `ElectronInstaller/docs/`). |
| [audits/](./audits/) | Informes de auditoría, hallazgos y seguimiento. |
| [planning/](./planning/) | Casos de uso, mejoras y planificación (prioridad informativa, no operativa). |
| [getting-started/](./getting-started/) | Material breve de arranque complementario a `installation.md`. |
| [tutorials/](./tutorials/) | Tutoriales puntuales (p. ej. levantar entorno desde cero). |
| [guia-usuario/](./guia-usuario/) | Guía funcional con capturas para perfiles de usuario. |
| [pantallas/](./pantallas/) | Capturas por rol (referencia visual). |
| [archive/](./archive/) | Documentación heredada u obsoleta conservada solo como contexto histórico. |
| [archive/tfg-artifacts/](./archive/tfg-artifacts/) | HTML de memoria/presentación académica; no son runbooks de producción. |
| [documents/](./documents/) | Binarios o entregables externos (p. ej. presentaciones). |

---

## Fuentes canónicas en `.github/ai/`

Normativa y mapa estructural usados por automatización y revisiones:

- [ARCHITECTURE.md](../.github/ai/ARCHITECTURE.md) — arquitectura detallada y stack versionado.
- [PROJECT_RULES.md](../.github/ai/PROJECT_RULES.md) — reglas operativas del proyecto.
- [TESTING_RULES.md](../.github/ai/TESTING_RULES.md) — criterios de pruebas y contratos.
- [TASKS.md](../.github/ai/TASKS.md) — checklist de trabajo.

Los documentos en la **raíz de `docs/`** (tabla “Mapa mental”) resumen lo mismo para humanos y enlazan aquí cuando hace falta más detalle.

---

## Stack (resumen verificable)

Versiones tomadas de `package.json` de backend y frontend (mayo 2026):

- **Backend:** NestJS 11, TypeORM 0.3.x, PostgreSQL, Redis (ioredis), Passport JWT, `nestjs-i18n`, Sentry, Throttler.
- **Frontend:** React 19, Vite 6, React Router 7, MUI 7, Redux Toolkit, Vitest, Playwright.
- **Runtime:** Node.js ≥ 22.2.0 en backend, frontend e instalador.

API REST bajo **`/api/v1`**; Swagger en **`/api/v1/docs`**.

---

## Convenciones terminológicas en esta documentación

- **Backend / API:** el servidor NestJS; “API” se usa cuando el foco es HTTP (rutas, contratos, Swagger).
- **Frontend / cliente:** la SPA en `frontend/smart-economat-frontend`.
- **Usuario:** persona humana; `usuario` en minúsculas para tablas y campos de dominio español.
- **DTO:** objeto de transferencia validado en backend (`class-validator`); no se usa “payload” como sinónimo en documentación normativa.

---

## Mantenimiento de la documentación

1. Tras cambiar scripts, Compose, variables, rutas API o flujos de despliegue, actualizar el runbook correspondiente en la raíz de `docs/` o en la subcarpeta afectada.
2. No duplicar tablas de variables: el inventario vive en [environment-variables.md](./environment-variables.md).
3. Los informes puntuales (auditorías, i18n, producto) van bajo [audits/](./audits/) con fecha en el nombre cuando aporte trazabilidad.
4. El índice de esta página debe actualizarse cuando se cree una **nueva categoría** de primer nivel en `docs/`.
5. Antes de fusionar cambios grandes en `docs/`, ejecutar en la raíz del repo: `node scripts/check-docs-internal-links.mjs` (también corre en CI en `.github/workflows/docs-internal-links.yml`).

---

## Contribución

Ver [development.md](./development.md) (flujo Git, calidad y convenciones). Las reglas de commits y hooks están en la raíz del repositorio (`.husky/`, `AGENTS.md`).
