# 📦 Gestión de Paquetes y Dependencias

Este documento detalla las librerías principales utilizadas en **SmartEconomat**, justificando su elección según los requisitos de rendimiento, seguridad y arquitectura del proyecto.

---

## 🚀 Núcleo de Rendimiento

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`@swc/core` / `@swc/cli`** | **Compilación Ultra Rápida**: Sustituye a `tsc` en desarrollo. Reduce el tiempo de compilación de segundos a milisegundos, permitiendo un ciclo de feedback instantáneo (`nest start -b swc`). |
| **`@nestjs/cache-manager`** | **Optimización de Consultas**: Integración con `cache-manager` para almacenar en memoria (o Redis) datos de alta lectura y baja escritura (configuraciones, perfiles, catálogos estáticos). |
| **`rxjs`** | **Programación Reactiva**: Requisito de NestJS para manejar flujos de datos asíncronos y eventos de forma eficiente. |

---

## 🛠️ Base de Datos y Persistencia

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`typeorm` / `@nestjs/typeorm`** | **ORM de grado industrial**: Manejo de relaciones complejas, migraciones y soporte para el patrón Repository. |
| **`pg`** | **Driver PostgreSQL**: Librería necesaria para que Node.js se comunique con nuestra base de datos relacional. |
| **`pg-mem`** | **Tests E2E Ultra Rápidos**: Base de datos PostgreSQL en memoria utilizada exclusivamente para tests unitarios y de integración para no depender de una instancia física. |

---

## 🔐 Seguridad y Autenticación

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`@nestjs/jwt` / `passport-jwt`** | **Protocolo Estándar**: Implementación de JSON Web Tokens para una sesión `stateless`, escalable y segura. |
| **`bcrypt`** | **Hashing de Contraseñas**: Algoritmo de hashing con sal (salt) para asegurar que las contraseñas nunca se almacenen en texto plano. |
| **`cookie-parser`** | **Seguridad de Sesión**: Permite leer y establecer cookies `httpOnly`, protegiendo los tokens contra ataques XSS. |

---

## 📐 Validación y Estándares

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`class-validator` / `class-transformer`** | **Contratos de Datos**: Valida los DTOs en tiempo de ejecución. Asegura que los datos que entran a la API cumplen con los tipos y restricciones esperadas (ej: `@IsEmail`, `@Min`). |
| **`nestjs-i18n`** | **Internacionalización**: Centraliza todos los mensajes de error y etiquetas en ficheros JSON para soportar múltiples idiomas (es/en). |
| **`uuid`** | **Identificadores Únicos**: Generación de UUIDs, crucial para nuestra arquitectura basada en **UUID v7**. |

---

## 📝 Documentación y Utilidades

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`@nestjs/swagger` / `swagger-ui-express`** | **Documentación Viva**: Genera automáticamente el portal de OpenAPI (Swagger) a partir de los decoradores en los controladores, facilitando la integración con el frontend. |
| **`@faker-js/faker`** | **Generación de Datos**: Utilizado en seeders para poblar la base de datos con miles de productos y usuarios realistas para pruebas de carga. |
| **`erdia`** | **Diagramas ERD**: Genera diagramas de Entidad-Relación directamente desde las clases de TypeORM. |

---

## 🧪 Calidad de Código (Dev)

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`eslint` / `typescript-eslint`** | **Análisis Estático**: Asegura que el código sigue las reglas de estilo y buenas prácticas definidas para el proyecto. |
| **`prettier`** | **Formateo Automático**: Mantiene la consistencia visual del código en todo el equipo. |
| **`husky` / `lint-staged`** | **Pre-commit Hooks**: Garantiza que ningún código se suba al repositorio si no pasa el linting o los tests básicos. |
| **`jest` / `supertest`** | **Testing Framework**: Suite completa para unit testing y simulación de peticiones HTTP en tests E2E. |

---

## 🎓 Módulos Educativos

| Paquete | Propósito / Razón |
| :--- | :--- |
| **`ts-node` / `tsconfig-paths`** | **Ejecución Directa**: Permite ejecutar scripts de TypeScript (como los seeders) directamente sin necesidad de compilación previa a JS. |
