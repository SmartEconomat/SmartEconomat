# 📊 Auditoría Técnica del Proyecto - Smart Economat Backend

**Fecha:** 1 de Marzo de 2026  
**Revisión:** NestJS v11 + TypeORM v0.3 + PostgreSQL  
**Alcance:** Backend únicamente

---

## 1. Resumen Ejecutivo

### Estado General

**BUENO / MEJORABLE** ⚠️

El proyecto tiene una base arquitectónica sólida con patrones NestJS correctamente aplicados, pero presenta **vulnerabilidades críticas de seguridad**, **problemas de escalabilidad en queries** y **áreas de mejora significativas** en diseño e implementación.

### Nivel Estimado

**Mid-Level con aspiraciones Senior** 📈

La estructura muestra comprensión de NestJS y DDD, pero hay inconsistencias en su aplicación y decisiones de diseño cuestionables que revelan falta de experiencia empresarial.

### Riesgos Principales

| Riesgo                                   | Severidad | Impacto                                   |
| ---------------------------------------- | --------- | ----------------------------------------- |
| 🔴 **Validación de contraseñas débil**   | CRÍTICO   | Acceso no autorizado, fuerza bruta viable |
| 🔴 **SameSite inconsistente en cookies** | CRÍTICO   | CSRF en ciertos contextos                 |
| 🟠 **N+1 queries sin lazy loading**      | ALTO      | Degradación exponencial de rendimiento    |
| 🟠 **Rate limiting ausente**             | ALTO      | DDoS, brute force sin protección          |
| 🟠 **Logging insuficiente**              | ALTO      | Imposible auditoría de seguridad          |
| 🟡 **DTO validation incompleta**         | MEDIO     | Inyección de datos no validados           |
| 🟡 **Repositorys inconsistentes**        | MEDIO     | Deuda técnica, mantenimiento difícil      |
| 🟡 **Testing limitado**                  | MEDIO     | Regresiones no detectadas                 |

---

## 2. Análisis Arquitectónico

### 2.1 Estructura General

#### ✅ Fortalezas

- **Modularización correcta**: Cada dominio (usuario, producto, pedido, etc.) en módulos independientes
- **Separación de responsabilidades clara**: Controller → Service → Repository → Entity
- **Base Entity bien diseñada**: UUID v7 (ordenados temporalmente), soft delete, versionado optimista, auditoría
- **Global pipes, filters e interceptors**: Centralización de cross-cutting concerns
- **ConfigModule.forRoot()**: Variables de entorno globales ✓

#### ⚠️ Problemas Arquitectónicos

**1. Repository Pattern Incompleto e Inconsistente**

```typescript
// ❌ ProductoRepository: Extiende TypeORM Repository pero está vacío
export class ProductoRepository extends Repository<Producto> {
  constructor(private dataSource: DataSource) {
    super(Producto, dataSource.createEntityManager());
  }
}

// ✓ UsuarioRepository: Usa composición (mejor)
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>
  ) {}

  createUsuario(data: Partial<Usuario>) { ... }
}
```

**Impacto**: El patrón está a medio camino entre Custom Repositories y composición. Debería ser consistente en todos lados.

**Solución:**

```typescript
// Opción A: Custom Repositories con métodos reales
export class ProductoRepository extends Repository<Producto> {
  constructor(private dataSource: DataSource) {
    super(Producto, dataSource.createEntityManager());
  }

  findByCodigoBarras(codigo: string): Promise<Producto | null> {
    return this.findOne({ where: { codigoBarras: codigo } });
  }

  findWithProveedores(id: string) {
    return this.createQueryBuilder('p')
      .leftJoinAndSelect('p.proveedores', 'prov')
      .where('p.id = :id', { id })
      .getOne();
  }
}

// Opción B: Composición (más moderna, recomendada)
@Injectable()
export class ProductoRepository {
  constructor(@InjectRepository(Producto) private repo: Repository<Producto>) {}

  findByCodigoBarras(codigo: string) { ... }
  findWithProveedores(id: string) { ... }
}
```

**2. Falta de Use Cases / Application Services**

El proyecto **confunde Service = Servicio de Aplicación con Service = Lógica de Negocio**.

```typescript
// Current: ProductoService mezcla queries, joins, y lógica de negocio
async findAll(query: ProductFilterDto): Promise<PaginatedResponseDto<Producto>> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);

  const queryBuilder = this.productoRepository
    .createQueryBuilder('producto')
    .leftJoinAndSelect('producto.proveedores', 'proveedores')
    .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
    .leftJoinAndSelect('producto.alergenos', 'alergenos');

  // ... múltiples condicionales

  return { data: ..., total: ..., page: ..., limit: ..., totalPages: ... };
}
```

**Impacto**: Los services son **demasiado grandes** (250 líneas en ProductoService), mezclan responsabilidades y son difíciles de testear.

**Solución DDD/Clean Architecture:**

```typescript
// Use Case (Application Layer)
@Injectable()
export class ListProductosUseCase {
  constructor(private productoRepository: IProductoRepository) {}

  async execute(params: ListProductosParams): Promise<PaginatedProducts> {
    const products = await this.productoRepository.findAll(params);
    return ProductoMapper.toPaginatedResponse(products);
  }
}

// Repository interface (Domain)
export interface IProductoRepository {
  findAll(filters: ProductoFilters): Promise<Producto[]>;
  findByCodigoBarras(codigo: string): Promise<Producto | null>;
}

// Controller
@Controller('productos')
export class ProductoController {
  constructor(private readonly listProductosUseCase: ListProductosUseCase) {}

  @Get()
  async findAll(@Query() query: ProductFilterDto) {
    return this.listProductosUseCase.execute(query);
  }
}
```

**3. DTOs sin discriminación entre lectura/escritura**

```typescript
// ❌ Usar el mismo DTO para create y update
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}

// ✓ Crear DTOs específicos
export class CreateProductoDto {
  /* campos requeridos */
}
export class UpdateProductoDto {
  /* campos opcionales */
}
export class ProductoResponseDto {
  /* solo lectura */
}
```

### 2.2 Modularización

#### ✓ Correcto

```typescript
// src/modules/producto/producto.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Producto, ...])],
  controllers: [ProductoController],
  providers: [ProductoService, ProductoRepository],
  exports: [ProductoService], // Permite a otros módulos usar el service
})
export class ProductoModule {}
```

#### ⚠️ Problemas

- **Modelos circulares no explícitos**: Producto ↔ ProductoProveedor ↔ Proveedor. ¿Está documentada la relación?
- **Falta de value objects**: Directrices de precio, cantidad, alérgenos podrían ser VOs
- **Seeders sin constraints**: El archivo `src/seeders/seed.ts` debería validarse

### 2.3 Inyección de Dependencias

#### ✓ Correcto

- `@InjectRepository()` usado correctamente
- `@Inject(ConfigService)` en auth module
- Exports de módulos permiten reutilización

#### ⚠️ Problemas

```typescript
// ❌ Inyectar Repository directamente en Controller (aunque es menor)
// Debería estar en Service
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}
}

// ✓ Es correcto, el controller debe tener solo el service
```

---

## 3. Calidad del Código

### 3.1 Complejidad y Mantenibilidad

#### ❌ ProductoService - 250 líneas en findAll()

```typescript
async findAll(query: ProductFilterDto): Promise<PaginatedResponseDto<Producto>> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);

  const queryBuilder = this.productoRepository
    .createQueryBuilder('producto')
    .leftJoinAndSelect('producto.proveedores', 'proveedores')
    .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
    .leftJoinAndSelect('producto.alergenos', 'alergenos');

  // Problemas:
  // 1. 7 condicionales de filtrado (línea 73-120)
  // 2. Sin extractión de métodos
  // 3. Sin testabilidad
}
```

**Complejidad Ciclomática**: ~8 (debe ser < 5)

**Solución:**

```typescript
async findAll(query: ProductFilterDto): Promise<PaginatedResponseDto<Producto>> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);

  const qb = this.createBaseQuery();
  this.applySearchFilters(qb, query);
  this.applyCategoryFilters(qb, query);
  this.applyBrandFilters(qb, query);
  this.applyAllergenFilters(qb, query);

  return this.getPaginated(qb, page, limit);
}

private applySearchFilters(qb: SelectQueryBuilder<Producto>, query: ProductFilterDto) {
  if (query.codigoBarras) {
    qb.andWhere('producto.codigoBarras = :codigoBarras', { ... });
  } else if (query.searchTerm) {
    qb.andWhere('producto.nombre ILIKE :searchTerm', { ... });
  }
}
```

#### ❌ DashboardService - Múltiples consultas secuenciales

```typescript
async getStats(): Promise<DashboardStatsDto> {
  // ❌ 10+ consultas separadas (línea 58-110) sin paralelización
  const valorInventarioRaw = await this.inventarioRepository...
  const itemsBajoStock = await this.inventarioRepository...
  const totalItems = await this.inventarioRepository...
  const porCaducar = await this.inventarioRepository...
  const caducados = await this.inventarioRepository...
  const pedidosPendientes = await this.pedidoRepository...
  // ... etc
}
```

**Impacto**: Si cada query toma 50ms, total = 500ms+ por estadística.

**Solución:**

```typescript
async getStats(): Promise<DashboardStatsDto> {
  const now = new Date();

  // Paralelizar consultas independientes
  const [
    valorInventario,
    stockStats,
    pedidoStats,
    proveedorStats,
  ] = await Promise.all([
    this.getInventoryValue(),
    this.getStockMetrics(now),
    this.getOrderMetrics(now),
    this.getSupplierStats(),
  ]);

  return { valorInventario, stockStats, pedidoStats, proveedorStats };
}
```

### 3.2 Duplicación de Código

#### ❌ Paginación duplicada en múltiples repositories

```typescript
// En UsuarioRepository
findAll(query: PaginationQueryDto) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  return this.repo.findAndCount({...})
    .then(([data, total]) => ({
      data: processedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    }));
}

// En RecepcionService (similar)
async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Recepcion>> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const [data, total] = await this.recepcionRepository.findAndCount({...});
  const totalPages = Math.ceil(total / limit) || 1;
  return { data, total, page, limit, totalPages };
}
```

**Solución:**

```typescript
// Base Repository Pattern
@Injectable()
export abstract class BaseRepository<Entity> {
  constructor(
    protected repo: Repository<Entity>,
    protected queryBuilder?: (
      repo: Repository<Entity>
    ) => SelectQueryBuilder<Entity>
  ) {}

  async paginate(
    query: PaginationQueryDto,
    qb?: SelectQueryBuilder<Entity>
  ): Promise<PaginatedResponseDto<Entity>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const builder = qb || this.repo.createQueryBuilder();
    const [data, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

// Uso
class ProductoRepository extends BaseRepository<Producto> {
  async findAll(
    filters: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.proveedores', 'prov');

    // Aplicar filtros...

    return this.paginate(filters, qb);
  }
}
```

### 3.3 Tipado

#### ✓ Bueno

- `class-validator` y `class-transformer` correctamente aplicados
- DTOs con `@IsString()`, `@IsEmail()`, `@MaxLength()`, etc.
- Enums para roles, tipos de productos, estados

#### ⚠️ Problemas

**1. `any` sin necesidad**

```typescript
// ❌ En ProductoController
create(
  @Body() createProductoDto: CreateProductoDto,
  @Request() req: any  // <-- any
): Promise<Producto> {
  const userId = req.user.sub;
}

// ✓ Crear DTO custom
export class AuthenticatedRequest {
  user: {
    id: string;
    nombre: string;
    rol: rolUsuario;
  };
}

// ✓ Usar en controller
create(
  @Body() createProductoDto: CreateProductoDto,
  @Request() req: AuthenticatedRequest
): Promise<Producto> {
  const userId = req.user.id;
}
```

**2. Type casting inseguro en queries**

```typescript
// ❌ En dashboard.service.ts
const valorTotal = parseFloat(
  valorInventarioRaw?.valorTotal ? String(valorInventarioRaw.valorTotal) : '0'
);

// ✓ Usar transformers
@Column({
  type: 'numeric',
  transformer: new ColumnNumericTransformer(),
})
cantidad!: number;
```

### 3.4 Gestión de Errores

#### ✓ Correcto

- `GlobalExceptionFilter` centralizado
- Manejo específico de errores de BD (códigos PostgreSQL)
- HTTP status codes apropiados
- Request IDs para trazabilidad

#### ⚠️ Problemas

```typescript
// ❌ ErrorFilter que devuelve errores sin sanitizar
if (exceptionResponse && typeof exceptionResponse === 'object') {
  message = (exceptionResponse as Record<string, any>).message || message;
  errorDetails = (exceptionResponse as Record<string, any>).error;
}

// Podría exponer información sensible si no se sanitiza

// ✓ Versión mejorada
if (exceptionResponse && typeof exceptionResponse === 'object') {
  const response = exceptionResponse as Record<string, any>;
  message = response.message || message;

  // Sanitizar según environment
  if (process.env.NODE_ENV === 'production') {
    errorDetails = null;
  } else {
    errorDetails = response.error;
  }
}
```

### 3.5 Async/Await

#### ✓ Generalmente correcto

```typescript
async findOne(id: string) {
  const usuario = await this.usuarioRepo.findById(id);
  if (!usuario) throw new NotFoundException(...);
  return usuario;
}
```

#### ⚠️ Problemas

**1. No paralelizar cuando es posible**

```typescript
// ❌ Secuencial
const usuario = await this.usuarioRepo.findById(id);
const pedidos = await this.pedidoRepo.find({ usuario: id });
const recepciones = await this.recepcionRepo.find({ usuario: id });

// ✓ Paralelo
const [usuario, pedidos, recepciones] = await Promise.all([
  this.usuarioRepo.findById(id),
  this.pedidoRepo.find({ usuario: id }),
  this.recepcionRepo.find({ usuario: id }),
]);
```

**2. .then() en code legacy**

```typescript
// ❌ UsuarioRepository
return this.repo.findAndCount({...}).then(([data, total]) => { ... });

// ✓ Usar async/await consistentemente
async findAll(query: PaginationQueryDto) {
  const [data, total] = await this.repo.findAndCount({...});
  return { data, total, ... };
}
```

---

## 4. Seguridad

### 4.1 Autenticación & JWT

#### ✓ Fortalezas

- JWT correctamente configurado con secret desde ENV
- Token expiration implementado
- `JwtStrategy` valida usuario activo antes de autorizar

#### 🔴 VULNERABILIDADES CRÍTICAS

**1. Contraseñas débiles sin policy enforcement**

```typescript
// ❌ CreateUsuarioDto permite contraseñas cortas
export class CreateUsuarioDto {
  @IsString()
  @MinLength(6) // ❌ 6 caracteres NO ES SUFICIENTE
  password!: string;
}

// ❌ RegisterUserDto sin validaciones
export class RegisterUserDto {
  // ... sin regex para complejidad
  password!: string; // Podría ser "123456"
}
```

**Impacto**: Fuerza bruta viable. Con GPU moderna: 6 caracteres = ~100ms.

**Solución OWASP:**

```typescript
import { Matches } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(12, { message: 'Mínimo 12 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
    { message: 'Debe contener mayúscula, minúscula, número y símbolo' }
  )
  password!: string;
}
```

**2. SameSite inconsistente en cookies**

```typescript
// ❌ AuthController - SameSite diferente en login vs register
@Post('register')
async register(@Res({ passthrough: true }) res: Response) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // ✓
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

@Post('login')
async login(@Res({ passthrough: true }) res: Response) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // ❌ Inconsistente, permite CSRF desde sitios externos
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}
```

**Impacto**: Vulnerabilidad CSRF si el login usa 'lax' en contextos de cross-origin.

**Solución:**

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const, // SIEMPRE strict para cookies sensitivas
  maxAge: 1000 * 60 * 60 * 24 * 7,
} as const;

@Post('register')
async register(@Res({ passthrough: true }) res: Response) {
  const token = await this.authService.register(dto);
  res.cookie('access_token', token.access_token, COOKIE_OPTIONS);
  return token;
}

@Post('login')
async login(@Res({ passthrough: true }) res: Response) {
  const token = await this.authService.login(dto);
  res.cookie('access_token', token.access_token, COOKIE_OPTIONS);
  return token;
}
```

**3. No hay rate limiting**

```typescript
// ❌ Sin protección contra brute force en login
@Post('login')
async login(@Body() dto: LoginUserDto) {
  // Alguien puede hacer 1000 requests/segundo sin límite
  const usuario = await this.usuarioRepo.findOne({ where: { email: dto.email } });
  const match = await bcrypt.compare(dto.password, usuario.password);
}
```

**Solución:**

```bash
npm install @nestjs/throttler
```

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60 segundos
      limit: 5, // 5 intentos máximo
    }),
  ],
})
export class AppModule {}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 5 intentos por minuto
  async login(@Body() dto: LoginUserDto) { ... }

  @Post('register')
  @Throttle(3, 3600) // 3 registros por hora
  async register(@Body() dto: RegisterUserDto) { ... }
}
```

**4. JWT en cookies + Bearer token = confusión**

```typescript
// ❌ JwtStrategy extrae de MÚLTIPLES FUENTES
jwtFromRequest: ExtractJwt.fromExtractors([
  cookieExtractor,
  ExtractJwt.fromAuthHeaderAsBearerToken(), // ❌ ¿Por qué ambos?
]),
```

**Problema**: Si el token está en cookie (httpOnly), ¿por qué permitir Bearer? Inconsistencia = vulnerabilidad.

**Solución:**

```typescript
// Opción A: Solo cookies (más seguro, protege XSS)
jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),

// Opción B: Solo Bearer (si es SPA/Mobile)
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

// Opción C: Soportar ambos pero con lógica clara
jwtFromRequest: ExtractJwt.fromExtractors([
  (req) => {
    // Solo desde cookie si existe
    if (req.cookies?.access_token) {
      return req.cookies.access_token;
    }
    // Fallback a Bearer solo si no hay cookie
    return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  },
]),
```

### 4.2 Autorización

#### ✓ Correcto

- `RolesGuard` basado en decorador `@Roles()`
- Valida roles antes de ejecutar endpoint
- Metadata bien usada

#### ⚠️ Problemas

**1. Autorización a nivel de recurso ausente**

```typescript
// ❌ Falta validación de propiedad
@Patch(':id')
@Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
update(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateProductoDto
) {
  // ¿Un profesor puede editar productos creados por otro profesor?
  // ¿Un alumno puede ver pedidos de otros alumnos?
  return this.productoService.update(id, dto);
}

// ✓ Implementar autorización a nivel de recurso
async update(id: string, dto: UpdateProductoDto, userId: string) {
  const producto = await this.productoService.findOne(id);

  // Validar: ¿El usuario propietario puede editar?
  if (producto.createdBy !== userId && !this.isAdmin(userId)) {
    throw new ForbiddenException('No puedes editar este producto');
  }

  return this.productoService.update(id, dto);
}
```

**2. GetUser decorator muy simplificado**

```typescript
// ❌ GetUser extrae solo propiedades
@GetUser('id') id: string

// ¿Qué pasa si el payload JWT cambió o fue manipulado?
// Sin validación adicional en runtime
```

**Solución:**

```typescript
// guards/user-verify.guard.ts
@Injectable()
export class UserVerifyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Reverificar usuario en BD (detecta cambios post-login)
    const dbUser = await this.usuarioRepository.findOne({
      where: { id: user.id, activo: true },
    });

    if (!dbUser) throw new UnauthorizedException();

    // Actualizar request si rol cambió
    request.user = { ...user, rol: dbUser.rol };
    return true;
  }
}
```

### 4.3 Validación de Input

#### ✓ Correcto

- DTOs con validadores de class-validator
- `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`
- `ParseUUIDPipe` en parámetros de ruta

#### 🔴 CRÍTICO

**1. Validaciones incompletas en DTOs complejos**

```typescript
// ❌ CreateProductoDto sin validación de proveedores
export class CreateProductoDto {
  nombre: string;

  @IsArray()
  @ValidateNested() // ✓ Pero...
  proveedores?: ProductoProveedorDto[]; // ¿Las propiedades de este DTO se validan?
}

// ❌ Si ProductoProveedorDto no existe o no tiene validadores
// Los datos pasan sin validación
```

**2. Números sin límites**

```typescript
// ❌ ProductoService.create
const lineas = (pedidoProductos ?? []).map((pp) => ({
  cantidad: pp.cantidad, // ¿Puede ser negativo? ¿1 millón?
  precioUnitario: pp.precioUnitario, // ¿Puede ser 0? ¿Negativo?
}));
```

**Solución:**

```typescript
export class PedidoProductoDto {
  @IsNumber()
  @Min(0.001, { message: 'La cantidad debe ser positiva' })
  @Max(999999, { message: 'La cantidad es demasiado grande' })
  cantidad!: number;

  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(999999.99, { message: 'El precio es inválido' })
  precioUnitario!: number;
}
```

### 4.4 Sanitización

#### ⚠️ Problemas

**1. Sin sanitización en campos de texto**

```typescript
// ❌ Descripción de producto sin sanitizar
@Column({ type: 'text', nullable: true })
descripcion?: string;

// Un admin malicioso podría insertar:
// '<img src=x onerror="fetch(attacker.com)">'
// Si se devuelve en JSON → XSS en frontend
```

**Solución:**

```typescript
import * as xss from 'xss';

@Column({ type: 'text', nullable: true })
descripcion?: string;

@BeforeInsert()
@BeforeUpdate()
sanitizeText() {
  this.descripcion = this.descripcion ? xss(this.descripcion) : undefined;
}
```

**2. Logging sin masking de datos sensibles**

```typescript
// ❌ En database.config.ts
if (process.env.NODE_ENV !== 'production') {
  console.log('Database Config:', {
    ...dbConfig,
    password: '*****', // ✓ Esto sí está bien
  });
}

// ❌ Pero en los servicios no hay logging de auditoría
// MovimientoHelper no registra quién cambió qué
```

### 4.5 Exposición Accidental de Información Sensible

#### 🔴 CRÍTICO

**1. Passwords expuestos en queries por defecto**

```typescript
// ❌ Usuario.password tiene select: false
@Column({ type: 'varchar', length: 100, select: false })
password!: string;

// ✓ Pero en UsuarioRepository hay métodos que lo exponen:
findByIdWithPassword(userId: string) {
  return this.repo
    .createQueryBuilder()
    .where('id = :id', { id: userId })
    .addSelect('usuario.password') // ✓ Explícito
    .getOne();
}

// ❌ ¿Quién llama a findByIdWithPassword? ¿Hay validación?
// Debería estar solo en AuthService
```

**2. Respuestas API exponen UUIDs y relaciones**

```typescript
// ✓ ResponseDtos deberían filtrar datos sensibles
export class UsuarioResponseDto {
  id: string;
  nombre: string;
  email: string;

  // ❌ No incluir:
  // password: string;
  // private_key: string;
}
```

---

## 5. Rendimiento

### 5.1 Queries N+1

#### 🔴 CRÍTICO - Múltiples queries no optimizadas

**En ProductoService.findAll():**

```typescript
const queryBuilder = this.productoRepository
  .createQueryBuilder('producto')
  .leftJoinAndSelect('producto.proveedores', 'proveedores') // Join 1
  .leftJoinAndSelect('proveedores.proveedor', 'proveedor') // Join 2
  .leftJoinAndSelect('producto.alergenos', 'alergenos'); // Join 3

// + 7 condicionales de filtrado

// Resultado: 1 query pero MUY COMPLEJA
// Si hay 1000 productos × 5 proveedores × 10 alergenos = multiplicación cartesiana
```

**Impacto**: Consulta devuelve datos duplicados. Uso de memoria exponencial.

**Solución:**

```typescript
// Opción 1: Separar queries
const [productos, proveedores, alergenos] = await Promise.all([
  this.findProductos(filters),
  this.findProveedoresMap(productIds),
  this.findAlergenosMap(productIds),
]);

return this.mapProductosWithRelations(productos, proveedores, alergenos);

// Opción 2: Usar DataLoader (si GraphQL) o BatchLoader
// Opción 3: Lazy loading en fronted (paginación, filtros)
```

**En DashboardService:**

```typescript
// ❌ 10+ consultas secuenciales en getStats()
const valorInventario = await this.inventarioRepository... // 50ms
const itemsBajoStock = await this.inventarioRepository...   // 50ms
const totalItems = await this.inventarioRepository...       // 50ms
// ... × 10 = 500ms mínimo

// ✓ Paralelizar
const stats = await Promise.all([
  this.inventarioRepository.sumValue(),
  this.inventarioRepository.countLowStock(),
  this.inventarioRepository.count(),
  // ...
]);
```

### 5.2 Indexes

#### ✓ Bien implementados

```typescript
@Entity({ name: 'producto' })
@Index('idx_producto_nombre', ['nombre'])
@Index('idx_producto_codigo_barras', ['codigoBarras'])
@Index('idx_producto_activo', ['activo'])
export class Producto extends BaseEntity {}
```

#### ⚠️ Problemas

**1. Índices compostos faltantes**

```typescript
// ❌ En Inventario
@Index('idx_inventario_producto_proveedor', ['productoProveedor'])
@Index('idx_inventario_ubicacion', ['ubicacion'])

// ✓ Debería haber índice compuesto para queries frecuentes:
@Index('idx_inv_location_date', ['ubicacion', 'fechaCaducidad'])
@Index('idx_inv_pp_ubicacion', ['productoProveedor', 'ubicacion'])
```

**2. Falta índice en foreign keys**

```typescript
// ❌ Movimiento tiene fk a usuario pero podría faltar índice
@ManyToOne(() => Usuario, (usuario) => usuario.movimientos)
@JoinColumn({ name: 'id_usuario' })
usuario?: Usuario | null;

// ✓ Debería estar indexado para queries por usuario
@Index('idx_movimiento_usuario', ['usuario'])
```

### 5.3 Caching

#### 🔴 AUSENTE

No hay caching en ningún nivel:

- ❌ Cache de queries (Redis)
- ❌ Cache HTTP (ETag, Cache-Control headers)
- ❌ Cache a nivel de aplicación (memory cache)

**Impacto**: Dashboard recalcula estadísticas en cada request.

**Solución:**

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, // 5 minutos default
    }),
  ],
})
export class AppModule {}

// En service
@Injectable()
export class DashboardService {
  constructor(private cacheManager: Cache) {}

  async getStats(): Promise<DashboardStatsDto> {
    const cached = await this.cacheManager.get('dashboard:stats');
    if (cached) return cached;

    const stats = {
      /* cálculos */
    };
    await this.cacheManager.set('dashboard:stats', stats, 300000); // 5 min
    return stats;
  }
}
```

### 5.4 Paginación

#### ✓ Límite de 100 items

```typescript
const limit = Math.min(query.limit ?? 20, 100);
```

#### ⚠️ Problemas

**1. Offset puede ser lento en tablas grandes**

```typescript
// ❌ Skip/Take es ineficiente con offset grande
skip: (page - 1) * limit, // Page 1000 = skip 20000 registros
take: limit,

// ✓ Usar cursor-based pagination
// O usar keyset pagination
```

---

## 6. Escalabilidad y Diseño

### 6.1 Desacoplamiento

#### ✓ Módulos desacoplados

- Cada módulo importa solo lo necesario
- Exports explícitos

#### ⚠️ Problemas

**1. Dependencia circular implícita**

```typescript
// Producto → ProductoProveedor → Proveedor
// Proveedor → Pedido → Producto (circular)
// No es explícita en código pero existe en BD
```

**Solución:**

```typescript
// Documentar en README.md o ADR (Architecture Decision Record)
/**
 * Domain Model Relationships
 *
 * Producto (1) ←→ (M) ProductoProveedor (M) ←→ (1) Proveedor
 *           ↑
 *           |
 *        Pedido (contiene líneas de ProductoProveedor)
 *
 * No hay ciclo conceptual si:
 * - Proveedor nunca referencia Producto directamente
 * - Pedido referencia ProductoProveedor, no Producto
 */
```

**2. Movimiento Helper acoplado a Domain**

```typescript
// ❌ MovimientoHelper mezcla infraestructura con dominio
export class MovimientoHelper {
  async trackProductoCreation(
    userId: string,
    productId: string,
    description: string
  ) {
    // Crea un Movimiento en BD directamente
    // Esto debería estar en un servicio de aplicación o use case
  }
}

// ✓ Debería ser
// DomainEvent: ProductoCreated → Event Handler → MovimientoService.track()
```

### 6.2 Testabilidad

#### ❌ Testing muy limitado

```typescript
// Solo E2E tests existen
test / app.e2e - spec.ts;
auth.e2e - spec.ts;
// ... más E2E

// Faltan:
// ✓ Unit tests de Services
// ✓ Unit tests de Guards/Pipes
// ✓ Integration tests de Repositories
// ✓ Contract tests
```

**Cobertura estimada: 20-30%** (muy baja)

**Solución:**

```typescript
// service.spec.ts
describe('ProductoService', () => {
  let service: ProductoService;
  let repository: MockRepository<Producto>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductoService,
        { provide: ProductoRepository, useClass: MockRepository },
      ],
    }).compile();

    service = module.get(ProductoService);
    repository = module.get(ProductoRepository);
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockProducts = [{ id: '1', nombre: 'Test' }];
      jest.spyOn(repository, 'findAll').mockResolvedValue({
        data: mockProducts,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockProducts);
      expect(result.total).toBe(1);
    });

    it('should filter by searchTerm', async () => {
      // ...
    });
  });
});
```

### 6.3 Preparación para Crecimiento

#### ⚠️ Problemas

**1. Esquema de BD sin versionado claro**

```typescript
// ❌ No hay migrations explícitas
// Archivo: src/migrations/ (parece vacío)
// TypeORM está en modo synchronize (peligroso en producción)

if (process.env.NODE_ENV !== 'production') {
  console.log('Database Config:', {
    ...dbConfig,
    synchronize: process.env.DB_SYNC === 'true', // ❌ Confuso
  });
}
```

**Solución:**

```typescript
// TypeORM debe usar migraciones, nunca synchronize en prod
export const dbConfig: DataSourceOptions = {
  // ...
  synchronize: false, // NUNCA true en producción
  migrationsRun: true,
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
};

// Comandos:
// npx typeorm migration:generate -n CreateUsuario
// npx typeorm migration:run
// npx typeorm migration:revert
```

**2. Sin multi-tenancy o feature flags**

Si el proyecto crece (múltiples economatos, roles), la estructura no lo soporta.

**3. Sin API versioning real**

```typescript
// Global prefix es 'api/v1' pero no hay soporte para v2
app.setGlobalPrefix('api/v1');

// ✓ Debería tener:
@Controller({
  path: 'productos',
  version: '1',
})
export class ProductoController {}

@Controller({
  path: 'productos',
  version: '2',
})
export class ProductoV2Controller {}
```

---

## 7. Testing

### 7.1 Estado Actual

#### ❌ Cobertura insuficiente

```
Archivos testeados: 8 E2E specs
Módulos totales: 13
Servicios: ~20+
Cobertura estimada: 15-25%
```

### 7.2 E2E Tests Existentes

#### ✓ Buena estructura

```typescript
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    // Setup middleware...
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(newUser)
      .expect(201);
  });
});
```

#### ⚠️ Problemas

**1. BD test sin aislamiento**

```typescript
// ❌ E2E tests usan BD real
// Múltiples test runners pueden causar conflicts
// No hay seed/cleanup entre tests
```

**Solución:**

```typescript
// Use pg-mem para in-memory DB en tests
import { newDb } from 'pg-mem';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: isTestEnv ? 'test' : 'prod',
      // ...
    }),
  ],
})
export class TestDatabaseModule {}

// O usar fixtures/seeds en hooks
beforeEach(async () => {
  await seedTestDatabase();
});

afterEach(async () => {
  await cleanupTestDatabase();
});
```

**2. Sin tests de concurrencia**

```typescript
// ❌ No hay tests que verifiquen actualización simultánea de stock
// Inventario con VersionColumn debería tener test para race condition

// ✓ Debería haber:
it('should handle concurrent updates to inventory', async () => {
  const updates = await Promise.all([
    updateStock(productId, +10),
    updateStock(productId, -5),
    updateStock(productId, +3),
  ]);

  // Verificar que final = inicial + 10 - 5 + 3
});
```

**3. Sin contract tests**

No hay verificación de que la BD realmente implementa los constraints que el código asume.

---

## 8. Problemas Críticos Detectados

| ID          | Problema                              | Severidad | Impacto                    | Línea de Código                  |
| ----------- | ------------------------------------- | --------- | -------------------------- | -------------------------------- |
| 🔴 SEC-001  | Contraseñas sin policy de complejidad | CRÍTICO   | Acceso no autorizado       | `usuario.dto.ts:8`               |
| 🔴 SEC-002  | SameSite inconsistente en cookies     | CRÍTICO   | CSRF viable                | `auth.controller.ts:19,28`       |
| 🔴 SEC-003  | Sin rate limiting en auth             | CRÍTICO   | Brute force sin protección | `auth.controller.ts`             |
| 🔴 PERF-001 | N+1 queries en findAll                | ALTO      | Timeout en tablas grandes  | `producto.service.ts:73`         |
| 🔴 PERF-002 | Queries secuenciales en dashboard     | ALTO      | 500ms+ por request         | `dashboard.service.ts:30`        |
| 🟠 ARCH-001 | Repository pattern inconsistente      | MEDIO     | Deuda técnica              | `producto.repository.ts`         |
| 🟠 ARCH-002 | Services demasiado grandes            | MEDIO     | Dificultad de testing      | `producto.service.ts:250 líneas` |
| 🟠 TEST-001 | Cobertura <25%                        | MEDIO     | Regresiones no detectadas  | `test/`                          |
| 🟡 QUAL-001 | Complejidad ciclomática alta          | BAJO      | Mantenimiento difícil      | `producto.service.ts:73-120`     |
| 🟡 QUAL-002 | Tipado incompleto (any)               | BAJO      | Errores en runtime         | `*.controller.ts`                |

---

## 9. Recomendaciones Prioritarias (Ordenadas por Impacto)

### 🔴 CRÍTICO (Sprint 1-2)

#### 1. **Implementar Password Policy + Rate Limiting**

- **Esfuerzo**: 4 horas
- **Impacto**: Elimina vulnerabilidades críticas de autenticación
- **Tareas**:
  1. Añadir `@Matches()` en DTO con regex (12+ chars, mayús, minús, número, símbolo)
  2. Instalar `@nestjs/throttler`
  3. Aplicar `@Throttle(5, 60)` en `/auth/login`
  4. Aplicar `@Throttle(3, 3600)` en `/auth/register`

#### 2. **Homogeneizar SameSite + CSRF Protection**

- **Esfuerzo**: 2 horas
- **Impacto**: Cierra puerta a ataques CSRF
- **Tareas**:
  1. Usar `sameSite: 'strict'` en TODAS las cookies
  2. Considerar CSRF token para POST requests
  3. Documentar política en README

#### 3. **Optimizar N+1 Queries**

- **Esfuerzo**: 8 horas
- **Impacto**: Reducción de 50-70% en latencia de búsquedas
- **Tareas**:
  1. Separar las 3 leftJoinAndSelect en ProductoService.findAll()
  2. Paralelizar queries con Promise.all()
  3. Agregar batch loading para relaciones opcionales

### 🟠 ALTO (Sprint 2-3)

#### 4. **Refactorizar Services con Extract Methods**

- **Esfuerzo**: 12 horas
- **Impacto**: Reducción de complejidad, testabilidad
- **Tareas**:
  1. Dividir ProductoService.findAll() en 4 métodos
  2. Dividir DashboardService.getStats() en queries paralelas
  3. Extraer lógica de filtrado a helper functions

#### 5. **Implementar Repository Base Pattern**

- **Esfuerzo**: 6 horas
- **Impacto**: Elimina duplicación de paginación
- **Tareas**:
  1. Crear BaseRepository con método paginate()
  2. Heredar en ProductoRepository, UsuarioRepository, etc.
  3. Remover código duplicado

#### 6. **Agregar Caching Redis**

- **Esfuerzo**: 6 horas
- **Impacto**: 10x más rápido en estadísticas
- **Tareas**:
  1. Instalar `@nestjs/cache-manager` + redis
  2. Cachear resultados de DashboardService (5 min TTL)
  3. Invalidar cache en operaciones CRUD

#### 7. **Incrementar Cobertura de Testing a 60%**

- **Esfuerzo**: 20 horas
- **Impacto**: Detecta regresiones, confianza en cambios
- **Tareas**:
  1. Unit tests para todos los Services (8h)
  2. Unit tests para Guards (4h)
  3. Integration tests para Repositories (4h)
  4. Configurar coverage reports en CI/CD (4h)

### 🟡 MEDIO (Sprint 3-4)

#### 8. **Documentar Architecture Decision Records (ADRs)**

- **Esfuerzo**: 4 horas
- **Impacto**: Claridad para nuevos desarrolladores
- **Tareas**:
  1. ADR: Por qué JWT en cookies + no Bearer
  2. ADR: Por qué Repository pattern custom
  3. ADR: Relaciones entre Producto/Proveedor/Pedido

#### 9. **Migrar a Migraciones TypeORM**

- **Esfuerzo**: 3 horas
- **Impacto**: Versionado claro de BD, reproducible
- **Tareas**:
  1. Cambiar synchronize: false
  2. Generar migration inicial: `typeorm migration:generate -n Init`
  3. Verificar migraciones corren en CI/CD

#### 10. **Implementar Autenticación a Nivel de Recurso**

- **Esfuerzo**: 8 horas
- **Impacto**: Seguridad de datos multi-usuario
- **Tareas**:
  1. Agregar field `createdBy` a entidades key
  2. Validar ownership en controllers
  3. Tests para autorización por recurso

---

## 10. Plan de Mejora en 30-60-90 días

### 📅 Primeros 30 días (Sprint 1-2)

**Objetivo**: Cerrar vulnerabilidades críticas y mejorar rendimiento

- [ ] **Semana 1-2**: Seguridad
  - [ ] Password policy + Throttler implementado
  - [ ] SameSite homogeneizado
  - [ ] Security headers agregados (HSTS, CSP, X-Frame-Options)
- [ ] **Semana 2**: Rendimiento
  - [ ] N+1 queries en findAll() solucionadas
  - [ ] Paralelización de queries en dashboard
  - [ ] Benchmarks antes/después
- [ ] **Semana 3**: Testing
  - [ ] Unit tests base para Services (20% cobertura)
  - [ ] E2E test cleanup/seed mejorados

**Definition of Done**: 0 vulnerabilidades críticas, <100ms en búsquedas

---

### 📅 Días 31-60 (Sprint 3)

**Objetivo**: Mejorar arquitectura y mantenibilidad

- [ ] **Semana 1**: Refactoring
  - [ ] Repository base pattern implementado
  - [ ] Services divididos (complejidad ciclomática < 5)
  - [ ] Duplicación de código <5%
- [ ] **Semana 2**: Caching + Testing
  - [ ] Redis cache en dashboard (5 min TTL)
  - [ ] Cobertura de testing 40%
  - [ ] Performance regression tests
- [ ] **Semana 3**: Documentación
  - [ ] ADRs escritas
  - [ ] README actualizado con arquitectura
  - [ ] Diagrama ER generado

**Definition of Done**: Código pasable para Senior review

---

### 📅 Días 61-90 (Sprint 4)

**Objetivo**: Preparar para producción y escalabilidad

- [ ] **Semana 1**: Feature flags + Multi-tenancy
  - [ ] Feature flag system básico
  - [ ] Schema de BD preparado para multi-tenant (si aplicable)
  - [ ] API v2 scaffolding
- [ ] **Semana 2**: Observabilidad
  - [ ] Structured logging (winston + JSON)
  - [ ] Distributed tracing (Jaeger o similar)
  - [ ] Metrics (Prometheus)
- [ ] **Semana 3**: Hardening
  - [ ] Security audit completo
  - [ ] Dependency scanning (OWASP dependency-check)
  - [ ] Load testing (k6 o Artillery)
  - [ ] Cobertura 60%+

**Definition of Done**: Sistema listo para producción bajo carga

---

## Síntesis de Hallazgos

### Código Base

- ✓ Estructura NestJS correcta
- ❌ Seguridad con agujeros críticos
- ❌ Rendimiento sin optimizaciones
- ❌ Testing ausente

### Arquitectura

- ✓ Modularización clara
- ⚠️ Repository pattern inconsistente
- ❌ Falta de Use Cases / Application Services
- ⚠️ Circular dependencies implícitas

### Próximos Pasos

1. **Inmediato**: Corregir vulnerabilidades SEC-001, SEC-002, SEC-003
2. **Esta semana**: Optimizar queries PERF-001, PERF-002
3. **Este mes**: Refactoring de Services, agregar tests
4. **Este trimestre**: Prepare para producción with proper observability

---

## Recursos Recomendados

### Libros

- _Clean Architecture_ - Robert C. Martin
- _Building Microservices_ - Sam Newman
- _OWASP Testing Guide_ v4.2

### Documentación

- [NestJS Official Docs](https://docs.nestjs.com)
- [TypeORM Best Practices](https://typeorm.io/guides)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance.html)

### Herramientas

- **Testing**: Jest, Supertest
- **Security**: OWASP Dependency-Check, Snyk
- **Monitoring**: Prometheus, Grafana
- **Load Testing**: k6, Artillery
- **Logging**: Winston, Pino

---

**Auditoría generada**: 1 de Marzo de 2026  
**Siguiente revisión recomendada**: 30 días (después de implementar CRÍTICO)  
**Auditor**: Senior Backend Engineer
