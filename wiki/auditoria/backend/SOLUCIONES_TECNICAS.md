# 📋 Soluciones Técnicas - Implementación Detallada

Este documento acompaña a la Auditoría Técnica y proporciona código de ejemplo para cada recomendación.

---

## 1. Password Policy + Throttler

### Paso 1: Instalar dependencias

```bash
npm install @nestjs/throttler
```

### Paso 2: Crear validador custom de password

**src/common/validators/strong-password.validator.ts**

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    if (typeof password !== 'string') return false;

    // Requisitos OWASP:
    // - Mínimo 12 caracteres
    // - Al menos una mayúscula
    // - Al menos una minúscula
    // - Al menos un número
    // - Al menos un símbolo especial
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

    return regex.test(password);
  }

  defaultMessage(args: ValidationArguments) {
    return 'La contraseña debe tener mínimo 12 caracteres, incluir mayúscula, minúscula, número y símbolo (@$!%*?&)';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
```

### Paso 3: Aplicar a DTOs

**src/modules/auth/dto/register-user.dto.ts**

```typescript
import { IsString, IsEmail, MaxLength, IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password!: string;
}
```

### Paso 4: Configurar Throttler en AppModule

**src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
// ... otras importaciones

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 segundos
        limit: 10, // 10 requests máximo
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 5, // 5 intentos por minuto
      },
      {
        name: 'register',
        ttl: 3600000, // 1 hora
        limit: 3, // 3 registros por hora
      },
    ]),
    TypeOrmModule.forRoot(typeOrmConfig),
    // ... otros módulos
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Paso 5: Aplicar decoradores en AuthController

**src/modules/auth/controller/auth.controller.ts**

```typescript
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from '../service/service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const, // ✓ Homogeneizado
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle('register', [3, 3600]) // 3 intentos por hora
  async register(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokenData = await this.authService.register(dto);
    res.cookie('access_token', tokenData.access_token, COOKIE_OPTIONS);
    return tokenData;
  }

  @Post('login')
  @Throttle('auth', [5, 60]) // 5 intentos por minuto
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokenData = await this.authService.login(dto);
    res.cookie('access_token', tokenData.access_token, COOKIE_OPTIONS);
    return tokenData;
  }

  @Post('refresh')
  @Throttle('auth', [5, 60])
  async refresh(@Res({ passthrough: true }) res: Response) {
    // ... implementar refresh token
  }
}
```

---

## 2. Homogeneizar SameSite + CSRF Protection

### Cookie Constants

**src/common/constants/security.constants.ts**

```typescript
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const, // ✓ SIEMPRE strict
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
};

export const CORS_OPTIONS = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600, // Preflight cache
};

export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
};
```

### CSRF Guard

**src/common/guards/csrf.guard.ts**

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip GET requests (no CSRF risk)
    if (request.method === 'GET' || request.method === 'HEAD') {
      return true;
    }

    // Verificar CSRF token en headers
    const csrfToken = request.headers['x-csrf-token'] as string;
    const sessionToken = request.cookies?.['csrf-token'];

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
```

### Middleware para inyectar CSRF token

**src/common/middleware/csrf.middleware.ts**

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Solo para GET requests, generar/validar CSRF token
    if (!req.cookies['csrf-token']) {
      const token = randomUUID();
      res.cookie('csrf-token', token, {
        httpOnly: false, // ✓ Accesible desde JS para headers
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hora
      });
    }

    next();
  }
}
```

### Aplicar en AppModule

**src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import cookieParser from 'cookie-parser';
import {
  CORS_OPTIONS,
  SECURITY_HEADERS,
} from './common/constants/security.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors(CORS_OPTIONS);

  // Security headers
  app.use((req, res, next) => {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      res.set(key, value);
    });
    next();
  });

  // Middleware
  app.use(cookieParser());
  app.use(CsrfMiddleware);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Global filters & interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
    new TransformInterceptor()
  );

  await app.listen(process.env.BACKEND_PORT ?? 3000);
  console.log(
    `Application running on port ${process.env.BACKEND_PORT ?? 3000}`
  );
}

void bootstrap();
```

---

## 3. Repository Base Pattern

### Abstract Base Repository

**src/common/repositories/base.repository.ts**

```typescript
import { Repository, SelectQueryBuilder, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

@Injectable()
export abstract class BaseRepository<Entity> {
  protected limit = 100;

  constructor(protected repo: Repository<Entity>) {}

  async paginate(
    query: PaginationQueryDto,
    queryBuilder?: SelectQueryBuilder<Entity>
  ): Promise<PaginatedResponseDto<Entity>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, this.limit);

    const qb = queryBuilder || this.repo.createQueryBuilder();

    const [data, total] = await qb
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

  async findOneById(id: string): Promise<Entity | null> {
    return this.repo.findOne({
      where: { id } as unknown as FindOptionsWhere<Entity>,
    });
  }

  async findAll(): Promise<Entity[]> {
    return this.repo.find();
  }

  async create(data: Partial<Entity>): Promise<Entity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Entity>): Promise<Entity> {
    await this.repo.update(id, data);
    return this.findOneById(id) as Promise<Entity>;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
```

### Producto Repository (ejemplo)

**src/modules/producto/repository/producto.repository.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';

@Injectable()
export class ProductoRepository extends BaseRepository<Producto> {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>
  ) {
    super(productoRepo);
  }

  async findByCodigoBarras(codigo: string): Promise<Producto | null> {
    return this.productoRepo.findOne({
      where: { codigoBarras: codigo },
    });
  }

  async findWithProveedores(id: string): Promise<Producto | null> {
    return this.productoRepo.findOne({
      where: { id },
      relations: ['proveedores', 'proveedores.proveedor'],
    });
  }

  async findWithAlelergenos(id: string): Promise<Producto | null> {
    return this.productoRepo.findOne({
      where: { id },
      relations: ['alergenos'],
    });
  }

  async findFiltered(
    filters: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    const qb = this.createFilteredQueryBuilder(filters);
    return this.paginate(filters, qb);
  }

  private createFilteredQueryBuilder(
    filters: ProductFilterDto
  ): SelectQueryBuilder<Producto> {
    let qb = this.productoRepo.createQueryBuilder('producto');

    // Eager load relations
    qb = qb
      .leftJoinAndSelect('producto.proveedores', 'proveedores')
      .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
      .leftJoinAndSelect('producto.alergenos', 'alergenos');

    // Búsqueda
    if (filters.codigoBarras) {
      qb = qb.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: filters.codigoBarras,
      });
    } else if (filters.searchTerm) {
      qb = qb.andWhere('producto.nombre ILIKE :searchTerm', {
        searchTerm: `%${filters.searchTerm}%`,
      });
    }

    // Filtros
    if (filters.categorias?.length) {
      qb = qb.andWhere('producto.tipo IN (:...categorias)', {
        categorias: filters.categorias,
      });
    }

    if (filters.marcas?.length) {
      qb = qb.andWhere('producto.marca IN (:...marcas)', {
        marcas: filters.marcas,
      });
    }

    // Ordenamiento
    qb = qb.orderBy('producto.nombre', 'ASC');

    return qb;
  }
}
```

---

## 4. Optimizar N+1 Queries

### Versión mejorada de ProductoService.findAll()

**src/modules/producto/service/producto.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductoRepository } from '../repository/producto.repository';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Producto } from '../producto.entity/producto.entity';

@Injectable()
export class ProductoService {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async findAll(
    filters: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    // ✓ La query ya está optimizada en el repository
    return this.productoRepository.findFiltered(filters);
  }

  async findOne(id: string): Promise<Producto> {
    // ✓ Usar método específico que eager loads relaciones
    const producto = await this.productoRepository.findWithProveedores(id);

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }
}
```

### Uso en Controller

**src/modules/producto/controller/producto.controller.ts**

```typescript
@Controller('productos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  async findAll(
    @Query() query: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    return this.productoService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productoService.findOne(id);
  }
}
```

---

## 5. Paralelizar Queries en DashboardService

**src/modules/dashboard/service/dashboard.service.ts**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In } from 'typeorm';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../../pedido/enums/estado-pedido.enum';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    this.logger.log('Fetching dashboard statistics...');

    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() + 7);

    // ✓ PARALELIZAR todas las queries independientes
    const [inventoryValue, stockAlerts, expirationStats, orderStats] =
      await Promise.all([
        this.calculateInventoryValue(),
        this.getStockAlerts(),
        this.getExpirationStats(now, thresholdDate),
        this.getOrderStats(now),
      ]);

    return {
      ...inventoryValue,
      ...stockAlerts,
      ...expirationStats,
      ...orderStats,
    };
  }

  private async calculateInventoryValue() {
    const result = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.productoProveedor', 'pp')
      .select(
        'SUM(inventario.cantidad_actual * COALESCE(pp.precio_unitario, 0))',
        'valorTotal'
      )
      .getRawOne();

    const valorTotal = parseFloat(String(result?.valorTotal || 0));

    return {
      valorTotal,
      valorTotalFormato: `$${valorTotal.toLocaleString('es-ES')}`,
    };
  }

  private async getStockAlerts() {
    const [bajoStock, totalItems] = await Promise.all([
      this.inventarioRepository.count({
        where: {
          // quantity_actual < quantity_minima (usar query si no hay índice)
        },
      }),
      this.inventarioRepository.count(),
    ]);

    return {
      itemsBajoStock: bajoStock,
      totalItems,
      porcentajeBajoStock: totalItems > 0 ? (bajoStock / totalItems) * 100 : 0,
    };
  }

  private async getExpirationStats(now: Date, threshold: Date) {
    const [porCaducar, caducados] = await Promise.all([
      this.inventarioRepository.count({
        where: { fechaCaducidad: Between(now, threshold) },
      }),
      this.inventarioRepository.count({
        where: { fechaCaducidad: LessThan(now) },
      }),
    ]);

    return {
      itemsPorCaducar: porCaducar,
      itemsCaducados: caducados,
    };
  }

  private async getOrderStats(now: Date) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [pendientes, enProceso, entregados] = await Promise.all([
      this.pedidoRepository.count({
        where: {
          estado: In([EstadoPedido.PENDIENTE, EstadoPedido.EN_PROCESO]),
        },
      }),
      this.pedidoRepository.count({
        where: {
          estado: EstadoPedido.EN_PROCESO,
          fechaCreacion: Between(startOfMonth, endOfMonth),
        },
      }),
      this.pedidoRepository.count({
        where: {
          estado: EstadoPedido.ENTREGADO,
          fechaCreacion: Between(startOfMonth, endOfMonth),
        },
      }),
    ]);

    return {
      pedidosPendientes: pendientes,
      pedidosEnProceso: enProceso,
      pedidosEntregadosEseMes: entregados,
    };
  }
}
```

---

## 6. Extracting Methods - Reducir Complejidad

**ANTES (ProductoService - 250 líneas)**

```typescript
async findAll(query: ProductFilterDto): Promise<PaginatedResponseDto<Producto>> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);

  const queryBuilder = this.productoRepository
    .createQueryBuilder('producto')
    .leftJoinAndSelect('producto.proveedores', 'proveedores')
    // ... MÁS JOINS

  if (query.codigoBarras) {
    queryBuilder.andWhere(...)
  } else if (query.searchTerm) {
    queryBuilder.andWhere(...)
  }

  if (query.categorias && query.categorias.length > 0) {
    queryBuilder.andWhere(...)
  }

  // ... 7 more conditions
}
```

**DESPUÉS (Método pequeño y comprensible)**

```typescript
@Injectable()
export class ProductoService {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async findAll(
    filters: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    // ✓ Delegado al repository
    return this.productoRepository.findFiltered(filters);
  }

  async findOne(id: string): Promise<Producto> {
    return this.productoRepository.findWithProveedores(id);
  }

  async create(dto: CreateProductoDto, userId: string): Promise<Producto> {
    const producto = await this.productoRepository.create(dto);
    await this.trackCreation(userId, producto.id);
    return producto;
  }

  private async trackCreation(
    userId: string,
    productoId: string
  ): Promise<void> {
    // Usar MovimientoHelper o Event
  }
}
```

---

## 7. Caching con Redis

### Instalación

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store
npm install -D @types/cache-manager
```

### Configuración

**src/cache/cache.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 300, // 5 minutos default
      max: 1000, // items máximo en cache
    }),
  ],
})
export class CacheConfigModule {}
```

### Uso en Service

**src/modules/dashboard/service/dashboard.service.ts**

```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly STATS_CACHE_KEY = 'dashboard:stats';
  private readonly STATS_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    // ✓ Intentar obtener del cache
    const cached = await this.cacheManager.get<DashboardStatsDto>(
      this.STATS_CACHE_KEY
    );

    if (cached) {
      this.logger.debug('Stats from cache');
      return cached;
    }

    // Calcular si no está en cache
    const stats = await this.calculateStats();

    // Guardar en cache
    await this.cacheManager.set(this.STATS_CACHE_KEY, stats, this.STATS_TTL);

    return stats;
  }

  // Invalidar cache al crear/editar
  async invalidateStatsCache(): Promise<void> {
    await this.cacheManager.del(this.STATS_CACHE_KEY);
    this.logger.debug('Stats cache invalidated');
  }

  private async calculateStats(): Promise<DashboardStatsDto> {
    // ... código del getStats original
  }
}
```

---

## 8. Unit Testing Example

### Service Test

**src/modules/producto/service/producto.service.spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from './producto.service';
import { ProductoRepository } from '../repository/producto.repository';
import { NotFoundException } from '@nestjs/common';

describe('ProductoService', () => {
  let service: ProductoService;
  let mockRepository: jest.Mocked<ProductoRepository>;

  beforeEach(async () => {
    mockRepository = {
      findFiltered: jest.fn(),
      findWithProveedores: jest.fn(),
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        {
          provide: ProductoRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockResponse = {
        data: [{ id: '1', nombre: 'Test' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockRepository.findFiltered.mockResolvedValue(mockResponse);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(mockResponse);
      expect(mockRepository.findFiltered).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      const filters = { searchTerm: 'Coca' };
      mockRepository.findFiltered.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.findAll(filters);

      expect(mockRepository.findFiltered).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      const mockProduct = { id: '1', nombre: 'Test' };
      mockRepository.findWithProveedores.mockResolvedValue(mockProduct as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findWithProveedores.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
```

---

## 9. Migration Example

**src/migrations/1704067200000-AddProductIndexes.ts**

```typescript
import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddProductIndexes1704067200000 implements MigrationInterface {
  name = 'AddProductIndexes1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear índices
    await queryRunner.createIndex(
      'producto',
      new TableIndex({
        columnNames: ['nombre'],
        name: 'idx_producto_nombre',
      })
    );

    await queryRunner.createIndex(
      'producto',
      new TableIndex({
        columnNames: ['codigo_barras'],
        name: 'idx_producto_codigo_barras',
      })
    );

    // Índice compuesto
    await queryRunner.createIndex(
      'inventario',
      new TableIndex({
        columnNames: ['ubicacion', 'fecha_caducidad'],
        name: 'idx_inv_location_date',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('producto', 'idx_producto_nombre');
    await queryRunner.dropIndex('producto', 'idx_producto_codigo_barras');
    await queryRunner.dropIndex('inventario', 'idx_inv_location_date');
  }
}
```

---

## 10. Environment Configuration

**.env.example**

```bash
# Server
NODE_ENV=development
BACKEND_PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=smart_economat
DB_SYNC=false

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend
FRONTEND_URL=http://localhost:3001

# Security
SESSION_SECRET=your-session-secret
```

---

**Última actualización**: 1 de Marzo de 2026
