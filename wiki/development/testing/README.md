# Sistema de Testing de Alto Rendimiento

Sistema de testing optimizado para **SmartEconomat Backend** usando **pg-mem**, **snapshots** y **singleton patterns**.

## Rendimiento

### Antes de la optimización

- Setup por test: **2-5 segundos**
- Tests lentos debido a:
  - Conexión a PostgreSQL real
  - Ejecución de migraciones
  - Ejecución de seeders repetidamente
  - Bootstrap de NestJS en cada test
  - bcrypt con 10 rounds (~100ms por hash)

### Después de la optimización

- Setup por test: **~0 milisegundos**
- Tests ultrarrápidos gracias a:
  - PostgreSQL en memoria (pg-mem)
  - DataSource singleton
  - Seeders ejecutados una sola vez
  - Snapshots y restore instantáneos
  - App NestJS singleton
  - bcrypt con 1 round (<1ms por hash)

### Resultados típicos

- Suite completa de E2E: **reducción de 80-90% en tiempo**
- Tests individuales: **< 100ms** (mayoría < 50ms)
- Ejecución E2E principal: **un solo proceso** para evitar re-seeding por fichero

---

## Arquitectura

## Suites documentadas

- [Tests E2E de contratos frontend-backend](frontend-backend-contracts-e2e.md): regresión específica para los contratos corregidos entre el frontend y la API NestJS.
- [Pedidos desde recetas](../../modules/pedido/pedidos-desde-recetas.md): cobertura unitaria y E2E del flujo de consolidación de ingredientes en pedidos.

### Componentes principales

```
test/
├── e2e/
│   ├── all.e2e-spec.ts        # Runner agregado de la suite E2E
│   └── *.e2e-spec.ts          # Suites E2E por módulo
├── setup/
│   ├── pg-mem.ts              # Base de datos en memoria
│   ├── seed-test-database.ts  # Sistema de seeders optimizado
│   ├── test-app.ts            # App NestJS singleton
│   ├── jest.setup.ts          # Setup global de Jest
│   └── bcrypt-mock.ts         # Optimización de bcrypt
├── utils/
│   └── test-helpers.ts        # Utilidades comunes
├── globalSetup.ts             # Setup del proceso principal
├── globalTeardown.ts          # Teardown del proceso principal
└── jest-e2e.json              # Configuración de Jest E2E
```

---

## Flujo de ejecución

### 1. Inicio de Jest (Proceso principal)

```
globalSetup.ts
└── Configura variables de entorno
```

### 2. Inicio de Jest para E2E

```
jest.setup.ts (setupFilesAfterEnv)
├── Carga variables de entorno
├── Mockea bcrypt (1 round)
├── Inicializa pg-mem
├── Patchea TypeORM para usar pg-mem
└── beforeAll global
    ├── Ejecuta seeders (primera vez)
    ├── Crea SEED_SNAPSHOT
    └── Inicializa app NestJS
```

### 3. Ejecución de suites E2E

````
test/e2e/all.e2e-spec.ts
└── importa todas las suites top-level
  └── cada suite restaura el estado seed antes de su beforeAll

mi-suite.e2e-spec.ts
├── beforeAll del archivo
│   └── Setup específico (login, crear datos)
├── beforeEach global (primer test)
│   └── Captura FILE_SNAPSHOT
├── test 1
├── beforeEach global (tests subsecuentes)
│   └── Restaura FILE_SNAPSHOT
├── test 2
├── beforeEach global
│   └── Restaura FILE_SNAPSHOT
└── test N
```bash
# Ejecutar toda la suite e2e agregada
npm run test:e2e

# Ejecutar un archivo e2e concreto
npm run test:e2e:file -- test/e2e/productos.e2e-spec.ts
````

- Garantiza aislamiento entre tests

---

## Cómo escribir tests

### Patrón básico

```typescript
import { getTestApp } from '../setup/test-app';
import { loginAndGetToken } from '../utils/test-helpers';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('MiModulo (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    // Obtener app singleton (ya inicializada)
    app = await getTestApp();

    // Login una sola vez para todo el archivo
    adminToken = await loginAndGetToken(app);
  });

  // NO necesitas afterAll, el sistema maneja la limpieza

  describe('Feature 1', () => {
    it('debe hacer algo', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/mi-recurso')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});
```

### Usando helpers avanzados

```typescript
import { setupTest, generateUniqueName } from '../utils/test-helpers';

describe('MiModulo (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    // Setup simplificado
    ({ app, adminToken } = await setupTest());
  });

  it('crear recurso', async () => {
    const nombre = generateUniqueName('Recurso');

    const response = await request(app.getHttpServer())
      .post('/api/v1/recursos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre });

    expect(response.status).toBe(201);
  });
});
```

### Pattern: Cliente autenticado

```typescript
import { createAuthenticatedClient } from '../utils/test-helpers';

describe('MiModulo (e2e)', () => {
  let client: any;

  beforeAll(async () => {
    const app = await getTestApp();
    client = await createAuthenticatedClient(app);
  });

  it('listar recursos', async () => {
    const response = await client.get('/api/v1/recursos');
    expect(response.status).toBe(200);
  });
});
```

---

## Mejores prácticas

### DO (Hacer)

1. **Usar getTestApp()** en lugar de crear TestingModule

   ```typescript
   const app = await getTestApp();
   ```

2. **Setup en beforeAll del archivo**, no en beforeEach

   ```typescript
   beforeAll(async () => {
     app = await getTestApp();
     adminToken = await loginAndGetToken(app);
   });
   ```

3. **Confiar en los snapshots** para aislamiento de tests
   - No necesitas transacciones manuales
   - No necesitas limpiar datos manualmente

4. **Usar helpers** para reducir código duplicado

   ```typescript
   const nombre = generateUniqueName('Test');
   const email = generateUniqueEmail('user');
   ```

5. **Nombres únicos** para evitar colisiones en tests paralelos
   ```typescript
   const nombre = `Producto ${Date.now()}`;
   ```

### DON'T (No hacer)

1. **No crear TestingModule manualmente**

   ```typescript
  // Incorrecto
   const module = await Test.createTestingModule({
     imports: [AppModule],
   }).compile();
   ```

2. **No ejecutar seeders manualmente**

   ```typescript
  // Incorrecto: los seeders ya se ejecutaron automáticamente
   await runAllSeeders();
   ```

3. **No limpiar datos en afterEach**

   ```typescript
  // Incorrecto: el snapshot restore lo hace automáticamente
   afterEach(async () => {
     await repository.clear();
   });
   ```

4. **No usar transacciones manuales**

   ```typescript
  // Incorrecto: los snapshots son superiores
   beforeEach(async () => {
     await dataSource.transaction(async () => {...});
   });
   ```

5. **No cerrar la app en afterAll**
   ```typescript
  // Incorrecto: la app es singleton, no debe cerrarse
   afterAll(async () => {
     await app.close();
   });
   ```

---

## Configuración

### Jest E2E (test/jest-e2e.json)

```json
{
  "setupFilesAfterEnv": ["<rootDir>/test/setup/jest.setup.ts"],
  "globalSetup": "<rootDir>/test/globalSetup.ts",
  "globalTeardown": "<rootDir>/test/globalTeardown.ts",
  "maxWorkers": "50%",
  "testTimeout": 30000
}
```

### Scripts de NPM

```bash
# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests E2E en watch mode
npm run test:e2e:watch

# Ejecutar tests E2E en debug mode
npm run test:e2e:debug

# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov
```

---

## Troubleshooting

### Problema: Tests fallan con "DataSource no inicializado"

**Solución:** Verifica que estés usando `getTestApp()` en lugar de crear el módulo manualmente.

### Problema: Tests lentos

**Solución:**

- Verifica que `maxWorkers` esté configurado en jest-e2e.json
- Asegúrate de no estar creando la app en cada test
- Verifica que no estés ejecutando seeders manualmente

### Problema: Datos de test interfieren entre sí

**Solución:**

- Usa nombres únicos: `generateUniqueName()` o `Date.now()`
- Verifica que el snapshot restore esté funcionando
- Los tests deben ser independientes del orden de ejecución

### Problema: Worker se queda colgado

**Solución:**

- Verifica que no haya `app.close()` en tests individuales
- Aumenta el timeout si los seeders son muy grandes
- Usa `--forceExit` solo si es absolutamente necesario

---

## Métricas y monitoreo

### Verificar rendimiento

```bash
# Ver tiempo de cada test
npm run test:e2e -- --verbose

# Ver solo tests lentos (> 5000ms)
npm run test:e2e -- --verbose 2>&1 | grep -A 1 "PASS"
```

### Benchmarks esperados

- **Primer test del worker:** ~2-5s (incluye seeders + app init)
- **Tests subsecuentes:** < 100ms (mayoría < 50ms)
- **Suite completa:** Depende del número de tests, pero reducción de 80-90%

---

## Seguridad

### bcrypt en tests

El sistema reduce bcrypt a 1 round **solo en tests**.

**¿Es seguro?**

- Sí, porque solo afecta el entorno de test
- La lógica de negocio sigue siendo la misma
- Los tests validan el comportamiento, no la seguridad del hash
- En producción se usa el valor configurado (10+ rounds)

---

## Migración de tests existentes

### Paso 1: Actualizar imports

```typescript
// Antes
import { Test } from '@nestjs/testing';

// Después
import { getTestApp } from './setup/test-app';
import { loginAndGetToken } from './utils/test-helpers';
```

### Paso 2: Simplificar beforeAll

```typescript
// Antes
beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleFixture.createNestApplication();
  // ... configuración ...
  await app.init();
});

// Después
beforeAll(async () => {
  app = await getTestApp();
  adminToken = await loginAndGetToken(app);
});
```

### Paso 3: Remover código innecesario

```typescript
// Remover
afterAll(async () => {
  await app.close();
});

// Remover
afterEach(async () => {
  await repository.clear();
});
```

---

## Referencias

- [pg-mem Documentation](https://github.com/oguimbal/pg-mem)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/#/testing)

---

## Soporte

Para preguntas o issues relacionados con el sistema de testing:

1. Revisa este README
2. Revisa los comentarios en el código fuente
3. Consulta con el equipo de desarrollo

---

**Última actualización:** Marzo 2026  
**Versión:** 2.0.0  
**Autor:** SmartEconomat Team
