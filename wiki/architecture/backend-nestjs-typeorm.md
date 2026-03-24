# Arquitectura Backend NestJS + TypeORM

## Contexto
El backend está diseñado para gestionar inventario, compras, recepción, producción y control de acceso en un entorno con múltiples perfiles (administración, profesorado, alumnado).

## Principios de diseño
- Modularidad por dominio
- Validación temprana en borde (DTO + pipes)
- Reglas de negocio en servicios
- Persistencia explícita con TypeORM
- Cross-cutting concerns centralizados en `common/`

## Capas lógicas

### 1. Entrada HTTP
- Controllers por módulo
- Decoradores de ruta de NestJS
- DTOs para body/query/params

### 2. Aplicación
- Services por caso de uso
- Orquestación de transacciones
- Transformación de resultados de persistencia

### 3. Persistencia
- Entidades TypeORM
- Repositorios inyectados con `@InjectRepository`
- Consultas con QueryBuilder cuando se requiere control fino

### 4. Infraestructura transversal
- Seguridad: JWT, roles, permisos, rate-limit
- Robustez: filtros globales de excepciones
- Observabilidad: logger + Sentry
- Internacionalización: i18n en validación y errores

## Módulos cargados en AppModule
- Usuario
- Pedido / PedidoDraft
- Producto
- Recepcion / RecepcionDraft
- Inventario
- Movimiento
- Merma
- Proveedor
- Receta / Produccion
- Albaran
- Incidencia
- Archivo
- Profesor
- Alumno
- Admin
- Roles
- Permisos
- PlantillasRoles
- SherlockAuth
- Dashboard
- Export
- Preparacion
- Ubicacion

## Integración TypeORM
- Configuración global en `src/config/database.config.ts`
- `TypeOrmModule.forRoot(typeOrmConfig)` en `AppModule`
- `autoLoadEntities` habilitado
- Sincronización condicionada por entorno (`DB_SYNC` y `NODE_ENV`)

## Request lifecycle en este proyecto
1. `main.ts` aplica prefijo global `/api/v1`.
2. Se ejecutan guards (globales y por controlador/método).
3. Se aplican pipes de validación/transformación.
4. El controlador delega al service.
5. El service persiste/consulta con TypeORM.
6. Interceptors serializan y homogeneizan la respuesta.
7. Exception filter global captura y normaliza errores.

## Justificación de la estructura por carpetas
- `src/common/`: evita duplicidad, concentra contratos reutilizables.
- `src/modules/*`: encapsula cada bounded context funcional.
- `src/config/`: centraliza bootstrap y configuración de infra.
- `src/seeders/`: permite dataset reproducible para dev/e2e.
- `test/`: separa claramente validación funcional fuera de `src/`.

## Riesgos y mitigaciones arquitectónicas
- Riesgo: crecimiento de complejidad en servicios muy grandes.
  Mitigación: extraer casos de uso a servicios auxiliares por agregado.
- Riesgo: dependencia de `synchronize` en desarrollo.
  Mitigación: introducir migraciones versionadas para cambios críticos.
- Riesgo: sobrecarga por validaciones complejas en endpoints de alta frecuencia.
  Mitigación: cachear lecturas y segmentar DTOs por operación.
