# Dependencias frontend y backend

## Metadatos

- Tipo de documento: Referencia
- Audiencia objetivo: desarrolladores del equipo
- Objetivo del usuario: identificar qué librerías runtime forman el stack real de SmartEconomat, dónde intervienen y por qué se usan
- Alcance: dependencias de runtime con uso o configuración activa en el frontend y el backend

## Fuentes de verdad

- [frontend/smart-economat-frontend/package.json](../../frontend/smart-economat-frontend/package.json)
- [backend/smart-economat-backend/package.json](../../backend/smart-economat-backend/package.json)
- Código real bajo `frontend/smart-economat-frontend/src` y `backend/smart-economat-backend/src`

## Criterios de inclusión

- Se documentan dependencias de runtime, no herramientas de build, lint, testing o CI/CD.
- Cada librería incluida tiene evidencia de uso directo o de configuración activa en el código actual.
- Cuando una librería actúa como soporte técnico de otra pieza principal, se explica esa relación explícitamente.

## Frontend

### Resumen

El frontend es una SPA en React 19 con React Router 7, MUI 7 como sistema visual, Redux Toolkit para el estado global mínimo actual, `fetch` nativo como cliente HTTP centralizado y varias utilidades de observabilidad, fechas y escaneo.

No se usa un cliente HTTP externo como Axios ni una capa de cacheado tipo TanStack Query. La integración con la API se concentra en [frontend/smart-economat-frontend/src/services/api.service.ts](../../frontend/smart-economat-frontend/src/services/api.service.ts).

### Núcleo de aplicación

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `react` | `^19.2.0` | Base de todos los componentes, hooks, contextos y composición de la SPA. | Es el framework UI principal del proyecto y sostiene toda la capa de presentación y estado local. | [frontend/smart-economat-frontend/src/App.tsx](../../frontend/smart-economat-frontend/src/App.tsx) |
| `react-dom` | `^19.2.0` | Monta la aplicación en el DOM del navegador mediante `createRoot`. | Es el renderer oficial de React para web y permite el arranque de la SPA en navegador. | [frontend/smart-economat-frontend/src/index.tsx](../../frontend/smart-economat-frontend/src/index.tsx) |
| `react-router-dom` | `^7.13.0` | Define rutas, guards, navegación y sincronización de ciertos filtros con URL. | Proporciona routing declarativo para una SPA con áreas protegidas y navegación profunda por módulos. | [frontend/smart-economat-frontend/src/routes/AppRouter.tsx](../../frontend/smart-economat-frontend/src/routes/AppRouter.tsx) |

### UI y sistema visual

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `@mui/material` | `^7.3.7` | Componentes base de layout, formularios, tablas, diálogos, feedback visual y theming global. | Encaja bien con una aplicación de backoffice densa, ofrece accesibilidad razonable de base y reduce la necesidad de construir un design system desde cero. | [frontend/smart-economat-frontend/src/layouts/MainLayout.tsx](../../frontend/smart-economat-frontend/src/layouts/MainLayout.tsx) |
| `@mui/icons-material` | `^7.3.7` | Iconografía para navegación, estados, acciones CRUD y feedback de módulos. | Mantiene coherencia visual con MUI y evita gestionar un set de iconos externo separado. | [frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx](../../frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx) |
| `@mui/x-date-pickers` | `^8.27.2` | `LocalizationProvider`, `DatePicker` y adaptación de inputs de fecha al resto del sistema MUI. | Resuelve selección de fechas con una integración nativa con MUI, coherente con formularios y filtros existentes. | [frontend/smart-economat-frontend/src/App.tsx](../../frontend/smart-economat-frontend/src/App.tsx), [frontend/smart-economat-frontend/src/components/ui/DatePicker.tsx](../../frontend/smart-economat-frontend/src/components/ui/DatePicker.tsx) |
| `@emotion/react` | `^11.14.0` | Motor de estilos requerido por el stack MUI activo en runtime. | MUI 7 se apoya en Emotion para resolver estilos dinámicos, tema y composición visual en tiempo de ejecución. | [frontend/smart-economat-frontend/src/App.tsx](../../frontend/smart-economat-frontend/src/App.tsx) |
| `@emotion/styled` | `^11.14.1` | Soporte de `styled` dentro del ecosistema de estilos usado por MUI. | Completa el motor CSS-in-JS del frontend y permite composición de componentes tematizados del stack visual actual. | [frontend/smart-economat-frontend/src/App.tsx](../../frontend/smart-economat-frontend/src/App.tsx) |

### Estado y observabilidad

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `@reduxjs/toolkit` | `^2.11.2` | Crea la store y el slice de permisos globales. | Aporta una forma tipada y mínima de mantener estado global compartido sin introducir demasiada complejidad. | [frontend/smart-economat-frontend/src/store/index.ts](../../frontend/smart-economat-frontend/src/store/index.ts) |
| `react-redux` | `^9.2.0` | `Provider`, `useDispatch` y `useSelector` tipados para conectar React con la store. | Es la integración estándar entre React y Redux Toolkit para exponer estado global a la UI. | [frontend/smart-economat-frontend/src/App.tsx](../../frontend/smart-economat-frontend/src/App.tsx), [frontend/smart-economat-frontend/src/store/hooks.ts](../../frontend/smart-economat-frontend/src/store/hooks.ts) |
| `@sentry/react` | `^10.43.0` | Inicializa captura de errores, tracing y session replay en producción. | Da trazabilidad a fallos reales de cliente sin construir una capa propia de observabilidad del navegador. | [frontend/smart-economat-frontend/src/index.tsx](../../frontend/smart-economat-frontend/src/index.tsx) |
| `web-vitals` | `^2.1.4` | Recoge métricas de experiencia como CLS, FCP, LCP y TTFB. | Permite medir salud de rendimiento del frontend con una utilidad ligera y alineada con Core Web Vitals. | [frontend/smart-economat-frontend/src/reportWebVitals.js](../../frontend/smart-economat-frontend/src/reportWebVitals.js) |

### Fechas, accesibilidad y escaneo

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `dayjs` | `^1.11.19` | Formatea fechas, calcula ventanas temporales y actúa como adapter de `@mui/x-date-pickers`. | Ofrece una API pequeña y suficiente para el dominio sin introducir una librería más pesada. | [frontend/smart-economat-frontend/src/App.tsx](../../frontend/smart-economat-frontend/src/App.tsx), [frontend/smart-economat-frontend/src/pages/Pedidos.tsx](../../frontend/smart-economat-frontend/src/pages/Pedidos.tsx) |
| `wicg-inert` | `^3.1.3` | Polyfill del atributo `inert` cargado al arrancar el frontend. | Refuerza accesibilidad y control de foco en navegadores que no implementan completamente `inert`. | [frontend/smart-economat-frontend/src/index.tsx](../../frontend/smart-economat-frontend/src/index.tsx) |
| `@zxing/browser` | `^0.1.5` | Controla el lector en navegador, ciclo de vida de cámara y escaneo continuo. | Resuelve acceso a cámara y decodificación de códigos sin desarrollar un lector propio. | [frontend/smart-economat-frontend/src/components/ui/BarcodeScanner.tsx](../../frontend/smart-economat-frontend/src/components/ui/BarcodeScanner.tsx) |
| `@zxing/library` | `^0.21.3` | Aporta formatos soportados, hints y excepciones usados por el scanner. | Complementa el lector de navegador con la capa de decodificación y tipos de ZXing. | [frontend/smart-economat-frontend/src/components/ui/BarcodeScanner.tsx](../../frontend/smart-economat-frontend/src/components/ui/BarcodeScanner.tsx) |

### Dependencias intencionadamente fuera de este inventario

| Librería declarada | Motivo de exclusión |
| --- | --- |
| `@testing-library/*`, `jest-dom`, `user-event` | Se usan para tests, no para runtime de la aplicación. |
| `@nestjs/common` | Está declarada en el manifiesto del frontend, pero no aparece en el código runtime del cliente. |

## Backend

### Resumen

El backend se apoya en NestJS 11 como framework principal, TypeORM 0.3 como capa de persistencia, PostgreSQL como base de datos, JWT en cookie para autenticación, validación tipada vía DTOs y utilidades adicionales para cacheado, documentación OpenAPI, observabilidad, correo, exportación y transformación de imágenes.

### Framework y bootstrap

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `@nestjs/common` | `^11.0.1` | Decoradores, excepciones, guards, interceptores e inyección base del framework. | Es la capa fundacional de NestJS y estructura la aplicación por módulos, controladores y servicios. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts) |
| `@nestjs/core` | `^11.0.1` | Crea la aplicación Nest, resuelve el contenedor y gestiona el ciclo de arranque. | Es el núcleo de ejecución del framework en runtime. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts) |
| `@nestjs/config` | `^4.0.3` | Expone variables de entorno vía `ConfigModule` y `ConfigService`. | Centraliza configuración y evita leer `process.env` de forma dispersa en módulos de dominio. | [backend/smart-economat-backend/src/app.module.ts](../../backend/smart-economat-backend/src/app.module.ts), [backend/smart-economat-backend/src/modules/pedido-draft/pedido-draft.module.ts](../../backend/smart-economat-backend/src/modules/pedido-draft/pedido-draft.module.ts) |
| `@nestjs/platform-express` | `^11.0.1` | Sostiene el adapter HTTP sobre Express, incluyendo cookies, CORS y respuestas binarias. | El backend está montado sobre Express y necesita este adapter para el transporte web actual. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts) |
| `reflect-metadata` | `^0.2.2` | Habilita metadata de decoradores usada por Nest, DTOs y seeders. | Es necesaria para que funcionen decoradores e inyección en el stack TypeScript/Nest actual. | [backend/smart-economat-backend/src/seeders/seed.cli.ts](../../backend/smart-economat-backend/src/seeders/seed.cli.ts) |
| `rxjs` | `^7.8.1` | Tipa y soporta flujos de interceptores y guards basados en `Observable`. | Forma parte del modelo de ejecución de NestJS y se usa en interceptores globales y guards. | [backend/smart-economat-backend/src/common/interceptors/transform.interceptor.ts](../../backend/smart-economat-backend/src/common/interceptors/transform.interceptor.ts) |

### Persistencia y datos

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `typeorm` | `^0.3.27` | Modela entidades, repositorios, migraciones, transacciones y query builders del dominio. | Encaja con un modelo relacional amplio y con mucha lógica transaccional entre módulos. | [backend/smart-economat-backend/src/config/database.config.ts](../../backend/smart-economat-backend/src/config/database.config.ts) |
| `@nestjs/typeorm` | `^11.0.0` | Integra TypeORM con el contenedor Nest, `forRootAsync`, `InjectRepository` e `InjectDataSource`. | Evita cableado manual y unifica acceso a persistencia dentro del ecosistema NestJS. | [backend/smart-economat-backend/src/app.module.ts](../../backend/smart-economat-backend/src/app.module.ts) |
| `pg` | `^8.16.3` | Driver PostgreSQL consumido por TypeORM para conectarse a la base de datos real. | Es la implementación efectiva del transporte con PostgreSQL en runtime. | [backend/smart-economat-backend/src/config/database.config.ts](../../backend/smart-economat-backend/src/config/database.config.ts) |
| `dotenv` | `^16.3.0` | Carga configuración de entorno en el arranque de la capa de base de datos. | Permite que el DataSource funcione en CLI, seeders y arranques fuera del bootstrap HTTP principal. | [backend/smart-economat-backend/src/config/database.config.ts](../../backend/smart-economat-backend/src/config/database.config.ts) |
| `uuid` | `^9.0.1` | Soporte de identificadores UUID en partes del dominio y utilidades asociadas. | Complementa la estrategia general de IDs UUID del sistema cuando la aplicación necesita manipularlos fuera de la base de datos. | [backend/smart-economat-backend/src/common/entities/base.entity.ts](../../backend/smart-economat-backend/src/common/entities/base.entity.ts) |

### Seguridad, autenticación y control de tráfico

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `@nestjs/jwt` | `^11.0.2` | Registra el módulo JWT y gestiona emisión y validación de tokens. | Resuelve autenticación stateless reutilizando el stack oficial de Nest. | [backend/smart-economat-backend/src/modules/sherlock-auth/module/sherlock-auth.module.ts](../../backend/smart-economat-backend/src/modules/sherlock-auth/module/sherlock-auth.module.ts) |
| `@nestjs/passport` | `^11.0.5` | Integra strategies y guards de Passport dentro de Nest. | Simplifica la autenticación por estrategia sin construir guards de autenticación desde cero. | [backend/smart-economat-backend/src/modules/sherlock-auth/guards/jwt-auth.guard.ts](../../backend/smart-economat-backend/src/modules/sherlock-auth/guards/jwt-auth.guard.ts) |
| `passport` | `^0.7.0` | Base del sistema de estrategias de autenticación. | Es la dependencia subyacente del modelo de auth implementado por NestJS. | [backend/smart-economat-backend/src/modules/sherlock-auth/module/sherlock-auth.module.ts](../../backend/smart-economat-backend/src/modules/sherlock-auth/module/sherlock-auth.module.ts) |
| `passport-jwt` | `^4.0.1` | Strategy JWT usada por guards de autenticación. | Permite validar tokens y extraer identidad en el flujo HTTP actual. | [backend/smart-economat-backend/src/modules/sherlock-auth/module/sherlock-auth.module.ts](../../backend/smart-economat-backend/src/modules/sherlock-auth/module/sherlock-auth.module.ts) |
| `bcrypt` | `^6.0.0` | Hash y comparación de contraseñas de usuarios. | Sigue siendo una opción madura y conocida para proteger contraseñas almacenadas. | [backend/smart-economat-backend/src/modules/usuario/service/usuario.service.ts](../../backend/smart-economat-backend/src/modules/usuario/service/usuario.service.ts) |
| `cookie-parser` | `^1.4.7` | Lee y normaliza cookies entrantes en el bootstrap HTTP. | El backend trabaja con autenticación basada en cookie `httpOnly` y necesita parseo fiable de cabeceras `Cookie`. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts) |
| `helmet` | `^8.1.0` | Aplica cabeceras de seguridad HTTP en todas las respuestas. | Añade una base de hardening web sin implementar manualmente cada header defensivo. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts) |
| `@nestjs/throttler` | `^6.5.0` | Define límites por buckets de lectura, escritura y autenticación. | Añade defensa básica frente a abuso de endpoints sin depender de infraestructura externa. | [backend/smart-economat-backend/src/app.module.ts](../../backend/smart-economat-backend/src/app.module.ts) |

### Validación, transformación y contratos

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `class-validator` | `^0.14.3` | Valida DTOs, pipes y decoradores personalizados. | Hace explícitos los contratos de entrada del backend y evita aceptar payloads fuera de forma. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts), [backend/smart-economat-backend/src/modules/usuario/dto/create-usuario.dto.ts](../../backend/smart-economat-backend/src/modules/usuario/dto/create-usuario.dto.ts) |
| `class-transformer` | `^0.5.1` | Normaliza DTOs, castea tipos y ejecuta transformaciones de entrada. | Permite adaptar datos HTTP al modelo tipado del backend antes de entrar en servicios y repositorios. | [backend/smart-economat-backend/src/common/pipes/normalize-data.pipe.ts](../../backend/smart-economat-backend/src/common/pipes/normalize-data.pipe.ts) |
| `nestjs-i18n` | `^10.6.0` | Traduce mensajes de validación y acceso a contexto i18n. | Evita hardcodear mensajes de error y mantiene consistencia multilenguaje en validaciones y respuestas. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts), [backend/smart-economat-backend/src/config/i18n.module.ts](../../backend/smart-economat-backend/src/config/i18n.module.ts) |
| `@nestjs/swagger` | `^11.2.6` | Genera OpenAPI a partir de controladores y DTOs anotados. | Da una referencia viva de la API sin mantener documentación de endpoints totalmente manual. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts), [backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts](../../backend/smart-economat-backend/src/modules/incidencia/controller/incidencia.controller.ts) |
| `swagger-ui-express` | `^5.0.1` | Publica la interfaz navegable de Swagger. | Expone la documentación OpenAPI generada para consumo interno y validación manual. | [backend/smart-economat-backend/src/main.ts](../../backend/smart-economat-backend/src/main.ts) |
| `@nestjs/mapped-types` | `^2.1.0` | Construye DTOs derivados como `UpdateDto` a partir de `CreateDto`. | Reduce duplicación en contratos manteniendo tipado y validaciones consistentes. | [backend/smart-economat-backend/src/modules/producto/dto/update-producto.dto.ts](../../backend/smart-economat-backend/src/modules/producto/dto/update-producto.dto.ts) |

### Cache, eventos y estado efímero

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `@nestjs/cache-manager` | `^3.1.0` | Registra caché global para servicios que consumen `CACHE_MANAGER`. | Ofrece una abstracción simple de caché dentro del propio ecosistema Nest. | [backend/smart-economat-backend/src/app.module.ts](../../backend/smart-economat-backend/src/app.module.ts) |
| `cache-manager` | `^7.2.8` | Implementa el backend de caché consumido por los servicios. | Sostiene el almacenamiento temporal sin crear una capa casera de memoria compartida. | [backend/smart-economat-backend/src/modules/auth/service/auth-permissions.service.ts](../../backend/smart-economat-backend/src/modules/auth/service/auth-permissions.service.ts) |
| `ioredis` | `^5.7.0` | Gestiona almacenamiento efímero y recuperación de drafts en Redis. | Proporciona un cliente Redis robusto para TTL, reconexión y uso concurrente en módulos de borradores. | [backend/smart-economat-backend/src/modules/pedido-draft/pedido-draft.module.ts](../../backend/smart-economat-backend/src/modules/pedido-draft/pedido-draft.module.ts) |
| `@nestjs/event-emitter` | `^3.0.1` | Publica y escucha eventos internos entre módulos. | Desacopla flujos secundarios del dominio sin convertir todo en llamadas directas entre servicios. | [backend/smart-economat-backend/src/app.module.ts](../../backend/smart-economat-backend/src/app.module.ts), [backend/smart-economat-backend/src/modules/albaran/listeners/albaran-recepcion.listener.ts](../../backend/smart-economat-backend/src/modules/albaran/listeners/albaran-recepcion.listener.ts) |

### Observabilidad y monitorización

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `@sentry/nestjs` | `^10.43.0` | Inicializa Sentry y conecta Nest con captura de excepciones. | Facilita observabilidad del backend sin construir una integración manual con el framework. | [backend/smart-economat-backend/src/instrument.ts](../../backend/smart-economat-backend/src/instrument.ts), [backend/smart-economat-backend/src/common/filters/global-exception.filter.ts](../../backend/smart-economat-backend/src/common/filters/global-exception.filter.ts) |
| `@sentry/node` | `^10.43.0` | Aporta la base del SDK Node usada por la instrumentación de backend. | Es la capa de transporte y captura del proceso Node en producción. | [backend/smart-economat-backend/src/instrument.ts](../../backend/smart-economat-backend/src/instrument.ts) |
| `@sentry/profiling-node` | `^10.43.0` | Añade profiling a la telemetría de Sentry. | Permite inspeccionar costes de ejecución además de errores puros. | [backend/smart-economat-backend/src/instrument.ts](../../backend/smart-economat-backend/src/instrument.ts) |

### Exportación, correo y tratamiento de archivos

| Librería | Versión declarada | Uso en SmartEconomat | Motivo técnico | Evidencia principal |
| --- | --- | --- | --- | --- |
| `nodemailer` | `^8.0.4` | Envía correos de recuperación de contraseña por SMTP. | Resuelve correo transaccional de forma estándar y suficiente para el alcance actual. | [backend/smart-economat-backend/src/modules/auth/mail.service.ts](../../backend/smart-economat-backend/src/modules/auth/mail.service.ts) |
| `exceljs` | `^4.4.0` | Genera exportaciones Excel para varias entidades de negocio. | Permite construir libros, hojas y estilos directamente desde Node sin depender de un servicio externo. | [backend/smart-economat-backend/src/modules/export/service/export.service.ts](../../backend/smart-economat-backend/src/modules/export/service/export.service.ts) |
| `pdfkit` | `^0.17.2` | Genera informes PDF y documentos de recetas/recepciones. | Da control programático fino sobre PDFs sin salir del proceso del backend. | [backend/smart-economat-backend/src/modules/recepcion/service/pdf-report.service.ts](../../backend/smart-economat-backend/src/modules/recepcion/service/pdf-report.service.ts) |
| `jimp` | `^1.6.0` | Lee y transforma imágenes en módulos de archivos y recetas. | Cubre operaciones de procesado de imágenes dentro del backend sin depender de servicios externos. | [backend/smart-economat-backend/src/modules/archivo/service/archivo.service.ts](../../backend/smart-economat-backend/src/modules/archivo/service/archivo.service.ts), [backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts](../../backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts) |
| `@jsquash/webp` | `^1.5.0` | Codifica y decodifica imágenes WebP mediante imports dinámicos. | Complementa a Jimp cuando el flujo requiere manejar WebP con un codec dedicado. | [backend/smart-economat-backend/src/modules/archivo/service/archivo.service.ts](../../backend/smart-economat-backend/src/modules/archivo/service/archivo.service.ts), [backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts](../../backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts) |
| `wasm-feature-detect` | `^1.8.0` | Detecta si el entorno soporta WASM para el pipeline WebP. | Permite decidir de forma segura si se puede usar la ruta acelerada basada en WASM. | [backend/smart-economat-backend/src/modules/archivo/service/archivo.service.ts](../../backend/smart-economat-backend/src/modules/archivo/service/archivo.service.ts) |

### Dependencias intencionadamente fuera de este inventario

| Librería declarada | Motivo de exclusión |
| --- | --- |
| `@faker-js/faker` | No aparece en el código runtime actual del backend; su papel, si existe, queda fuera del alcance de esta referencia centrada en runtime activo. |
| `pdfmake` | Está declarada, pero la generación PDF confirmada en runtime usa `pdfkit`. |
| `@jimp/wasm-webp` | No hay evidencia directa de uso en el código actual; el soporte WebP confirmado en runtime pasa por `@jsquash/webp`. |

## Relacionado

- [getting-started/dependencias.md](../getting-started/dependencias.md)
- [reference/typeorm-y-datasource.md](typeorm-y-datasource.md)
- [reference/variables-entorno.md](variables-entorno.md)
- [frontend/README.md](../frontend/README.md)
