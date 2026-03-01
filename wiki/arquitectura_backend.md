# Documentación de Arquitectura Backend (SmartEconomat)

Este documento detalla la arquitectura del servidor de `SmartEconomat`, construido con **NestJS**, siguiendo un enfoque modular y orientado a capas.

## Estructura del Proyecto

El backend se organiza en módulos funcionales dentro de `src/modules/`:

```text
src/
├── common/             # Helpers, DTOs y utilidades compartidas.
│   ├── dto/            # PaginatedResponseDto, PaginationQueryDto.
│   └── helpers/        # I18nHelper, MovimientoHelper.
├── config/             # Configuraciones de TypeORM, i18n y variables de entorno.
├── database/           # Archivos relacionados con la base de datos.
├── i18n/               # Diccionarios de internacionalización (es, en).
├── migrations/         # Control de versiones de la base de datos (TypeORM).
├── modules/            # Módulos de negocio (Auth, Usuario, Producto, etc.).
│   └── [module_name]/
│       ├── controller/ # Manejo de peticiones HTTP y Swagger.
│       ├── service/    # Lógica de negocio y orquestación.
│       ├── repository/ # Consultas específicas y acceso a datos (TypeORM).
│       ├── dto/        # Objetos de transferencia de datos y validaciones.
│       ├── entity/     # Definición de tablas y relaciones (TypeORM).
│       └── [name].module.ts
├── seeders/            # Scripts para poblar la base de datos inicial.
├── main.ts             # Punto de entrada (Configuración de pipes, guards, Swagger).
└── app.module.ts       # Módulo raíz que importa todos los submódulos.
```

## Arquitectura de Capas

Seguimos una estructura de responsabilidades clara:

1.  **Controllers (Controladores):**
    *   Gestionan las rutas de la API.
    *   Validan los parámetros de entrada mediante DTOs y `ValidationPipe`.
    *   Documentan los endpoints con Swagger (`@ApiTags`, `@ApiOperation`).
    *   Aplican seguridad mediante `@UseGuards`.

2.  **Services (Servicios):**
    *   Contienen la lógica de negocio pura.
    *   Orquestan llamadas a múltiples repositorios o helpers.
    *   Lanzan excepciones controladas de NestJS (ej. `NotFoundException`).

3.  **Repositories (Repositorios):**
    *   Abstraen la interacción con la base de datos.
    *   Utilizan el patrón Repository de TypeORM para desacoplar la lógica de las consultas SQL.

4.  **Entities (Entidades):**
    *   Representan el esquema de la base de datos.
    *   Definen relaciones (ManyToMany, ManyToOne, OneToMany) y restricciones.

## Patrones Comunes

### Gestión de Stock y Movimientos
Contamos con un `MovimientoHelper` centralizado que asegura que cada acción que afecte al stock (compras, ajustes, consumos) genere un registro en la tabla de `Movimientos` para garantizar la trazabilidad total.

### Paginación Global
Utilizamos los DTOs `PaginationQueryDto` y `PaginatedResponseDto` de forma estandarizada en todos los listados (`findAll`) para mantener una interfaz API consistente.

### Internacionalización (i18n)
La mayoría de los mensajes de error y respuestas están centralizados en `i18n`, facilitando el cambio de idioma (actualmente configurado en Español como principal).

## Seguridad

*   **Autenticación:** Basada en **JWT (JSON Web Tokens)**.
*   **Autorización:** Guardias personalizados (`RolesGuard`) que verifican el rol del usuario (`ADMINISTRADOR`, `PROFESOR`, `ALUMNO`) contra los decoradores `@Roles` definidos en los controladores.

---
*Este documento refleja la estructura técnica del backend y debe actualizarse ante cambios estructurales significativos.*
