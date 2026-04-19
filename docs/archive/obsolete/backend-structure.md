# Descripción General de la Estructura del Backend de SmartEconomat

## Ubicación del Proyecto
```
/home/psych/projects/SmartEconomat/backend/smart-economat-backend/
```

## 1. Estructura del DirectorIO Raíz

```
src/
├── main.ts                 # Punto de entrada de la aplicación
├── app.module.ts          # Módulo raíz con todas las importaciones
├── app.controller.ts      # Controlador raíz
├── app.service.ts         # Servicio raíz
├── common/                # Utilidades e infraestructura compartida (~2,472 LOC)
├── config/                # Archivos de configuración
├── modules/               # Módulos de funcionalidades (20 módulos)
├── i18n/                  # Internacionalización (Español/Inglés)
├── migrations/            # Migraciones de base de datos
└── seeders/              # Semillas de base de datos
```

---

## 2. Estructura de la Carpeta Common (/src/common)

**La Capa de Infraestructura** - ~2,472 líneas de código compartido

### 2.1 Componentes Clave

| Componente | Archivos | Propósito |
|------------|----------|-----------|
| **decorators/** | 7 archivos | RBAC, normalización, rutas públicas |
| **dto/** | 3 archivos | DTO base, respuesta de paginación |
| **entities/** | 1 archivo | BaseEntity con campos de auditoría |
| **enums/** | Múltiples | Constantes, claves de error, idiomas |
| **filters/** | 1 archivo | Manejador de excepciones global |
| **helpers/** | 4 archivos | i18n, movimientos, versionado |
| **interceptors/** | 1 archivo | Transformación de respuestas |
| **interfaces/** | 1 archivo | Contrato de respuesta de la API |
| **pipes/** | 4 archivos | Validación (UUID v7, normalización) |
| **transformers/** | 8 archivos | Conversiones de tipos de datos |
| **utils/** | 1 archivo | Validación EAN-13 |

### 2.2 Características de BaseEntity

Cada entidad extiende `BaseEntity`:
- **id**: UUID v7 (ordenado por tiempo, generado por la base de datos)
- **createdAt**: Marca de tiempo automática
- **updatedAt**: Marca de tiempo automática
- **deletedAt**: Soporte para borrado lógico (soft delete)
- **deletedBy**: Rastreo de quién eliminó el registro
- **version**: Bloqueo optimista para control de concurrencia

---

## 3. Directorio de Módulos (/src/modules)

**20 Módulos de Funcionalidades** - Cada uno sigue un patrón consistente y escalable

### 3.1 Estructura Estándar de Módulo

```
nombre-del-modulo/
├── [nombre].module.ts                # Declaración del módulo NestJS
├── controller/
│   ├── [entidad].controller.ts      # Endpoints HTTP
│   └── [sub-entidad].controller.ts  # Sub-recursos (si hay)
├── service/
│   ├── [entidad].service.ts         # Lógica de negocio
│   └── [helper].service.ts         # Servicios de apoyo
├── entity/
│   ├── [entidad].entity.ts          # Entidad TypeORM
│   └── [sub-entidad].entity.ts      # Entidades relacionadas
├── repository/
│   ├── [entidad].repository.ts      # Repositorio personalizado
│   └── [sub-entidad].repository.ts  # Sub-repositorios
├── dto/
│   ├── create-[entidad].dto.ts
│   ├── update-[entidad].dto.ts
│   ├── [entidad]-filter.dto.ts
│   └── [sub-carpeta]/               # Sub-DTOs
├── interfaces/
│   └── [entidad].interface.ts
├── enums/
│   └── [modulo].enums.ts
└── constants/
    └── es/
        └── [modulo]-messages.ts
```

---

## 4. Patrones de Servicio (Mejores Prácticas)

### 4.1 Patrón de ProductoService (Complejo)
```typescript
// Características:
- Soporte de transacciones (dataSource.transaction)
- Validación (código de barras EAN-13)
- Verificación de duplicados
- Integración de helpers (MovimientoHelper)
- Soporte de paginación
- Manejo de errores con i18n
- Métodos de repositorio personalizados
```

---

## 5. Infraestructura y Configuración

### 5.1 Base de Datos (TypeORM + PostgreSQL)

**Características:**
- Borrado lógico (DeleteDateColumn)
- Bloqueo optimista (VersionColumn)
- UUID v7 (claves primarias ordenadas por tiempo)
- Marcas de tiempo automáticas
- Soporte de migraciones
- Seeders para datos de prueba

---

## 7. Lo que ya existe

- 20 módulos de funcionalidades completos
- Infraestructura común integral
- Manejo global de errores con i18n
- Capa de transformación de respuestas
- Soporte de paginación
- Implementación de borrado lógico
- Bloqueo optimista
- Decoradores RBAC
- Validación y normalización de datos
- Validación de código de barras EAN-13
- Integración con Sentry
- Documentación Swagger
- Más de 30 especificaciones de pruebas E2E
- Semillas de base de datos
- Soporte i18n (ES/EN)

---

## 12. Resumen

**El Backend de SmartEconomat es una aplicación NestJS lista para producción que cuenta con:**

- **Bien estructurado** - Clara separación de responsabilidades, diseño modular
- **Escalable** - 20 módulos de funciones que siguen patrones consistentes
- **Seguro** - Decoradores RBAC, validación de permisos
- **Confiable** - Manejo global de errores, soporte de transacciones
- **Observable** - Integración con Sentry, rastreo de requestId
- **Internacionalizado** - Soporte en español e inglés
- **Documentado** - Documentación de la API Swagger, comentarios de código
- **Probado** - Más de 30 especificaciones de pruebas E2E
- **Basado en base de datos** - TypeORM con PostgreSQL, borrado lógico, bloqueo optimista
- **Cumple con las mejores prácticas** - Convenciones de NestJS, arquitectura limpia
