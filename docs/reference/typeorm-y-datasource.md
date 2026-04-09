# Reference: TypeORM, DataSource, migraciones y seeders

## Archivo de configuración principal
- `backend/smart-economat-backend/src/config/database.config.ts`

## Parámetros relevantes de DataSource
| Parámetro | Valor/estrategia |
|---|---|
| `type` | `postgres` |
| `host` | `DB_HOST` (fallback según entorno) |
| `port` | `DB_PORT` (default 5432) |
| `username` | `DB_USERNAME` o `POSTGRES_USER` |
| `password` | `DB_PASSWORD` o `POSTGRES_PASSWORD` |
| `database` | `DB_DATABASE` o `POSTGRES_DB` |
| `synchronize` | `DB_SYNC=true` o no-prod/no-test |
| `entities` | `src/**/*.entity.{ts,js}` |
| `migrations` | `src/migrations/*.{ts,js}` |
| `autoLoadEntities` | `true` |

## Scripts npm de base de datos
| Script | Descripción |
|---|---|
| `npm run migration:run` | Ejecuta migraciones TypeORM con DataSource del proyecto |
| `npm run schema:drop` | Elimina esquema actual |
| `npm run schema:sync` | Sincroniza esquema desde entidades |
| `npm run seed` | Ejecuta `src/seeders/seed.ts` |
| `npm run seed:massive` | Carga masiva de datos |
| `npm run db:reset` | Drop + sync + seed |

## Migraciones
Actualmente la ruta de migraciones está configurada, pero el flujo habitual de desarrollo usa sincronización de esquema. Para entornos productivos, se recomienda reforzar una política de migraciones versionadas.

## Seeders
Los seeders están organizados por dominio (`src/seeders/*`) y orquestados por `seed.ts`.

### Seeders principales
- `roles-permisos.seeder.ts`
- `usuario.seeder.ts`
- `producto.seeder.ts`
- `proveedor.seeder.ts`
- `pedido.seeder.ts`
- `recepcion.seeder.ts`
- `inventario.seeder.ts`
- `movimiento.seeder.ts`
- `merma.seeder.ts`
- `receta.seeder.ts`
- `incidencia.seeder.ts`
- `albaran.seeder.ts`
- `historial-precio.seeder.ts`

## Transacciones
- Patrón simplificado: `dataSource.transaction(...)`
- Patrón avanzado: `QueryRunner` para commit/rollback explícito
