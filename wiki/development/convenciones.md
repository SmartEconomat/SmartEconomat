# Convenciones de Código

Convenciones, patrones y estilo de código adoptados en SmartEconomat.

---

## Nomenclatura

### Archivos y Carpetas

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | kebab-case con sufijo de tipo | `producto.controller.ts`, `create-producto.dto.ts` |
| Carpetas de módulo | singular, kebab-case | `modules/producto/`, `modules/pedido/` |
| Carpetas de utilidad | plural o descriptivo | `common/dto/`, `common/pipes/` |

### Código TypeScript

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Clases | PascalCase | `ProductoController`, `CreateProductoDto` |
| Propiedades | camelCase | `fechaCaducidad`, `codigoBarras` |
| Variables y parámetros | camelCase | `productoService`, `userId` |
| Enums (miembros) | UPPER_SNAKE_CASE | `TipoProducto.PERECEDERO` |
| Constantes globales | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

### Base de Datos

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas | singular, snake_case | `producto`, `pedido_producto` |
| Columnas | snake_case | `fecha_caducidad`, `codigo_barras` |
| Claves primarias | `id` (UUID v7) | — |
| Claves foráneas | `<entidad>_id` en BD | `proveedor_id` |

### Rutas de API

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Recursos | plural, kebab-case | `/api/v1/productos`, `/api/v1/proveedores` |
| Acciones especiales | kebab-case | `/api/v1/productos/generar-ean13` |

---

## Estructura de Módulos

Cada módulo de negocio sigue esta estructura de carpetas:

```
modules/<nombre>/
├── controller/
│   └── <nombre>.controller.ts
├── service/
│   └── <nombre>.service.ts
├── repository/           # (si aplica)
│   └── <nombre>.repository.ts
├── entity/
│   └── <nombre>.entity.ts
├── dto/
│   ├── create-<nombre>.dto.ts
│   └── update-<nombre>.dto.ts
└── <nombre>.module.ts
```

---

## Entidades (TypeORM)

Todas las entidades extienden `BaseEntity` de `common/entities/`:

```typescript
@Entity({ name: 'producto' })
@Index(['nombre'])
export class Producto extends BaseEntity {

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  precioUnitario!: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_caducidad' })
  fechaCaducidad?: Date;

  @OneToMany(() => ProductoAlergeno, (pa) => pa.producto, { cascade: true })
  alergenos?: Relation<ProductoAlergeno[]>;
}
```

**Convenciones:**
- Propiedades obligatorias usan `!:` (non-null assertion)
- Propiedades opcionales usan `?:` junto con `nullable: true`
- Columnas con nombre diferente al de la propiedad usan `name: 'snake_case'`
- Relaciones importan `Relation` como type: `import type { Relation } from 'typeorm'`

---

## DTOs (Data Transfer Objects)

### Create DTO

```typescript
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductoDto {

  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @MaxLength(100, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  nombre!: string;

  @IsOptional()
  @IsEnum(UnidadMedida, { message: i18nValidationMessage('validation.IS_ENUM') })
  unidadMedida?: UnidadMedida;
}
```

**Convenciones:**
- Los mensajes de validación siempre usan `i18nValidationMessage()` para internacionalización
- Los strings se normalizan con `TrimStringTransformer` u otros transformadores
- Orden de decoradores: Transform → IsType → IsNotEmpty → MaxLength/Min/Max → IsOptional

### Update DTO

```typescript
import { PartialType } from '@nestjs/mapped-types';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {}
```

Todas las propiedades pasan a ser opcionales automáticamente.

---

## Controladores

```typescript
@ApiTags('Productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductoController {

  constructor(private readonly productoService: ProductoService) {}

  @Get()
  @RequirePermissions('productos:leer')
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponseDto<Producto>> {
    return this.productoService.findAll(query);
  }

  @Post()
  @RequirePermissions('productos:crear')
  @ApiOperation({ summary: 'Crear producto' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductoDto, @Request() req: any): Promise<Producto> {
    return this.productoService.create(dto, req.user);
  }
}
```

**Convenciones:**
- Orden de decoradores de clase: `@ApiTags` → `@UseGuards` → `@Controller`
- Orden de decoradores de método: `@Get/Post/...` → `@RequirePermissions` → `@ApiOperation` → `@ApiResponse/ApiQuery`
- Todos los métodos son `async` y retornan `Promise<T>`
- Guards globales: `JwtAuthGuard` + `PermisosGuard`

---

## Servicios

```typescript
@Injectable()
export class ProductoService {

  constructor(
    private readonly productoRepository: ProductoRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepo: Repository<ProductoProveedor>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductoDto, user: any): Promise<Producto> {
    return this.dataSource.transaction(async (manager) => {
      const producto = manager.create(Producto, dto);
      return manager.save(producto);
    });
  }
}
```

**Convenciones:**
- Inyección de dependencias en el constructor con `private readonly`
- Errores de negocio con excepciones de NestJS: `NotFoundException`, `BadRequestException`
- Mensajes de error localizados: `I18nHelper.getError('KEY')`
- Operaciones que modifican múltiples entidades usan transacciones

---

## Imports

Orden de imports recomendado:

```typescript
// 1. NestJS core
import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// 2. Librerías externas
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

// 3. Type imports
import type { Relation } from 'typeorm';

// 4. Módulos internos (common)
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// 5. Módulos locales
import { ProductoService } from '../service/producto.service';
import { CreateProductoDto } from '../dto/create-producto.dto';
```

---

## Paginación

Todos los endpoints de listado usan paginación estándar:

- **Query:** `?page=1&limit=20`
- **Límite máximo:** 100 registros por página
- **Respuesta:** `PaginatedResponseDto<T>` con `data`, `meta` (total, page, limit, totalPages)

---

## Internacionalización (i18n)

- Idiomas soportados: **Español (es)**, **Inglés (en)**
- Idioma por defecto: Español
- Resolución: query param `?lang=`, header `Accept-Language`, header `x-custom-lang`
- Archivos de traducción: `src/i18n/{es,en}/`
- Todas las validaciones de DTOs usan `i18nValidationMessage()`
- Errores de servicio usan `I18nHelper.getError('KEY')`

---

## Permisos

Formato de permiso: `<módulo>:<acción>`

Ejemplos: `productos:leer`, `productos:crear`, `pedidos:actualizar`, `inventario:eliminar`

Decoradores disponibles:
- `@RequirePermissions('permiso1', 'permiso2')` — Requiere TODOS los permisos (AND)
- `@RequireAnyPermission('permiso1', 'permiso2')` — Requiere AL MENOS UNO (OR)
- `@Public()` — Sin autenticación requerida

---

## Herramientas de Calidad

| Herramienta | Configuración | Comando |
|-------------|--------------|---------|
| **ESLint** | `eslint.config.mjs` | `npm run lint` |
| **Prettier** | Integrado en ESLint | `npm run format` |
| **Husky** | Pre-commit hooks | Automático al hacer commit |
| **lint-staged** | Formatea archivos staged | Automático con Husky |

---

## Commits (Conventional Commits)

```
<tipo>[ámbito opcional]: <descripción en imperativo>
```

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato (no afecta lógica) |
| `refactor` | Refactorización sin cambio funcional |
| `perf` | Mejoras de rendimiento |
| `test` | Tests nuevos o modificados |
| `build` | Cambios en build o dependencias |
| `chore` | Tareas menores |

Ejemplos:
- `feat: add allergen matrix to product creation`
- `fix(inventario): resolve stock count on partial reception`
- `docs: update API reference for reception module`
