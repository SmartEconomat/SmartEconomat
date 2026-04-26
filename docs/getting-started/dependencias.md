# Gestión de paquetes y dependencias

Esta página resume las dependencias runtime principales del proyecto y enlaza a la referencia exhaustiva por librería.

## Documento principal

- [Referencia detallada de dependencias frontend y backend](../reference/dependencias-frontend-backend.md)

## Resumen rápido

| Área | Dependencias clave |
| --- | --- |
| Frontend | `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`, `@reduxjs/toolkit`, `react-redux`, `dayjs`, `@sentry/react`, `@zxing/browser`, `@zxing/library`, `wicg-inert`, `web-vitals` |
| Backend | `@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/platform-express`, `typeorm`, `@nestjs/typeorm`, `pg`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `nestjs-i18n`, `@nestjs/swagger`, `swagger-ui-express`, `@nestjs/cache-manager`, `cache-manager`, `ioredis`, `@nestjs/event-emitter`, `@sentry/nestjs`, `nodemailer`, `exceljs`, `pdfkit`, `jimp`, `@jsquash/webp` |

## Cómo usar esta documentación

- Si necesitas entender el stack real y el motivo de cada librería, usa la referencia detallada.
- Si estás buscando tooling de build, lint, testing o CI/CD, consulta la documentación de desarrollo y operación; ese alcance queda fuera de esta página.
- Si quieres revisar la capa de persistencia o la configuración del entorno, usa también [reference/typeorm-y-datasource.md](../reference/typeorm-y-datasource.md) y [environment-variables.md](../environment-variables.md).

## Alcance de este resumen

- Incluye dependencias de runtime con uso o configuración activa.
- Excluye devDependencies, infraestructura externa y paquetes declarados sin evidencia de uso runtime principal.

