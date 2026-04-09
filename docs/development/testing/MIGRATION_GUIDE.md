# Guía de Migración de Tests

Esta guía te ayudará a migrar tests existentes al nuevo sistema de testing optimizado.

## Checklist de migración

- [ ] Actualizar imports
- [ ] Simplificar beforeAll
- [ ] Usar helpers de autenticación
- [ ] Usar helpers de datos únicos
- [ ] Remover código innecesario
- [ ] Probar el test migrado

---

## 1. Actualizar imports

### Antes

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
```

### Después

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { 
  getTestApp, 
  loginAndGetToken, 
  generateUniqueName 
} from './setup';
```

---

## 2. Simplificar beforeAll

### Antes

```typescript
let app: INestApplication;
let adminToken: string;

beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor()
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api/v1');
  await app.init();

  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@smarteconomat.com',
      password: 'SmartEconomat2026!',
    });
  adminToken = response.body.data.access_token;
});
```

### Después

```typescript
let app: INestApplication;
let adminToken: string;

beforeAll(async () => {
  app = await getTestApp();
  adminToken = await loginAndGetToken(app);
});
```

**Beneficios:**
- 20+ líneas → 2 líneas
- La app ya está configurada correctamente
- El login es más simple y reutilizable

---

## 3. Usar helpers de datos únicos

### Antes

```typescript
it('crear usuario', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/usuarios')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: `Usuario ${Date.now()}`,
      email: `user${Date.now()}@test.com`,
    });

  expect(response.status).toBe(201);
});
```

### Después

```typescript
import { generateUniqueName, generateUniqueEmail } from './setup';

it('crear usuario', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/usuarios')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: generateUniqueName('Usuario'),
      email: generateUniqueEmail('user'),
    });

  expect(response.status).toBe(201);
});
```

**Beneficios:**
- Código más legible
- Generación de IDs más robusta
- Evita colisiones en tests paralelos

---

## 4. Remover código innecesario

### Cosas que ya no necesitas

```typescript
// 1. NO cerrar la app en afterAll
afterAll(async () => {
  await app.close(); // Remover: la app es singleton
});

// 2. NO limpiar datos en afterEach
afterEach(async () => {
  await repository.clear(); // Remover: los snapshots lo manejan
});

// 3. NO crear transacciones manuales
beforeEach(async () => {
  queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
});

afterEach(async () => {
  await queryRunner.rollbackTransaction(); // Remover: los snapshots son mejores
  await queryRunner.release();
});

// 4. NO configurar timeout individual
jest.setTimeout(30000); // Remover: ya está configurado globalmente
```

### Tu test solo necesita

```typescript
describe('MiModulo (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    adminToken = await loginAndGetToken(app);
  });

  // Tests aquí...
});
```

---

## 5. Refactorizar helpers del test

### Antes

```typescript
async function createProducto(nombre?: string) {
  const productoNombre = nombre || `Producto ${Date.now()}`;
  
  const res = await request(app.getHttpServer())
    .post('/api/v1/productos')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: productoNombre, tipo: 'lacteo' });
  
  return res.body.data;
}
```

### Después

```typescript
import { generateUniqueName } from './setup';

async function createProducto(nombre?: string) {
  const productoNombre = nombre || generateUniqueName('Producto');
  
  const res = await request(app.getHttpServer())
    .post('/api/v1/productos')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: productoNombre, tipo: 'lacteo' });
  
  return res.body.data;
}
```

---

## 6. Usar helpers de assertions

### Antes

```typescript
it('listar productos', async () => {
  const response = await request(app.getHttpServer())
    .get('/api/v1/productos')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('meta');
  expect(Array.isArray(response.body.data.data)).toBe(true);
});
```

### Después

```typescript
import { expectPaginatedResponse } from './setup';

it('listar productos', async () => {
  const response = await request(app.getHttpServer())
    .get('/api/v1/productos')
    .set('Authorization', `Bearer ${adminToken}`);

  expectPaginatedResponse(response);
});
```

---

## 7. Ejemplo completo de migración

### ANTES: Test antiguo (50+ líneas)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Productos (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    
    adminToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('crear producto', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Producto ${Date.now()}`,
        tipo: 'lacteo',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### DESPUÉS: Test optimizado (25 líneas)

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { 
  getTestApp, 
  loginAndGetToken, 
  generateUniqueName,
  expectStandardResponse 
} from './setup';

describe('Productos (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    adminToken = await loginAndGetToken(app);
  });

  it('crear producto', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: generateUniqueName('Producto'),
        tipo: 'lacteo',
      });

    expectStandardResponse(response, 201);
  });
});
```

**Mejoras:**
- 50% menos código
- Más legible
- Más rápido (~100x)
- Más mantenible
- Patrones consistentes

---

## Verificar la migración

Después de migrar un test, verifica:

1. **El test pasa**
   ```bash
   npm run test:e2e -- productos.e2e-spec.ts
   ```

2. **El test es rápido**
   - Primer test: ~2-5s (include seeders)
   - Tests subsecuentes: < 100ms

3. **El test es aislado**
   - Ejecutar múltiples veces da mismo resultado
   - Ejecutar en paralelo funciona correctamente

4. **No hay warnings**
   - No hay memory leaks
   - No hay conexiones abiertas

---

## Prioridad de migración

### Alta prioridad (migrar primero)
1. Tests que se ejecutan frecuentemente
2. Tests lentos (> 5s por test)
3. Tests con mucho boilerplate

### Media prioridad
1. Tests de módulos críticos
2. Tests con lógica compleja

### Baja prioridad
1. Tests unitarios simples
2. Tests que ya son rápidos

---

## Tips adicionales

1. **Migar un archivo a la vez**
   - No intentes migrar todo de golpe
   - Prueba cada archivo después de migrarlo

2. **Reutilizar helpers**
   - Si varios tests necesitan la misma función, agrégala a test-helpers.ts

3. **Mantener simplicidad**
   - Los tests deben ser fáciles de leer
   - Evita abstracciones innecesarias

4. **Documentar casos especiales**
   - Si un test requiere algo especial, documéntalo

---

## FAQ

**P: ¿Necesito migrar todos los tests?**  
R: No es obligatorio, pero recomendado. Los tests antiguos seguirán funcionando.

**P: ¿Cuánto tiempo toma migrar un test?**  
R: Típicamente 5-10 minutos por archivo de test.

**P: ¿Qué hago si un test falla después de migrar?**  
R: Verifica que estés usando `getTestApp()` y no `app.close()`. Los snapshots deberían manejar el aislamiento.

**P: ¿Puedo mezclar tests antiguos y nuevos?**  
R: Sí, pero no es recomendado. Mejor migrar un archivo completo.

---

Buena suerte con la migración.
