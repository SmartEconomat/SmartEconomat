# Sistema de Testing - Arquitectura Técnica

## Objetivo

Crear un sistema de testing extremadamente rápido que permita ejecutar cientos o miles de tests en segundos, sin usar base de datos real, manteniendo aislamiento completo entre tests.

---

## Componentes del Sistema

### 1. pg-mem (PostgreSQL en Memoria)

**Ubicación:** `test/setup/pg-mem.ts`

**Responsabilidades:**
- Crear instancia de PostgreSQL en memoria
- Registrar funciones PostgreSQL necesarias (uuid_generate_v7, uuid_generate_v4, etc.)
- Crear adaptador pg para TypeORM
- Gestionar snapshots (backup/restore)

**Ventajas:**
- 1000x más rápido que PostgreSQL real
- No requiere Docker o PostgreSQL instalado
- Soporta la mayoría de features de PostgreSQL
- Snapshots instantáneos (<1ms)

**Limitaciones conocidas:**
- No soporta algunas funciones avanzadas de PostgreSQL
- Cada worker tiene su propia instancia (no compartida)

---

### 2. Sistema de Seeders

**Ubicación:** `test/setup/seed-test-database.ts`

**Responsabilidades:**
- Ejecutar seeders UNA SOLA VEZ por worker
- Crear snapshot después de ejecutar seeders
- Proporcionar función de restore a estado seed

**Flujo de ejecución:**
```
Worker inicia
  └─> ¿Ya hay snapshot de seeders?
      ├─> SÍ: Restaurar snapshot (0ms)
      └─> NO: Ejecutar seeders (2-5s)
           └─> Crear snapshot
```

**Optimizaciones:**
- Los seeders se ejecutan en paralelo cuando es posible
- El snapshot captura TODO el estado de la base de datos
- Restore es instantáneo porque es en memoria

---

### 3. App NestJS Singleton

**Ubicación:** `test/setup/test-app.ts`

**Responsabilidades:**
- Crear aplicación NestJS UNA SOLA VEZ por worker
- Configurar pipes, filters, interceptors
- Reutilizar la misma app en todos los tests

**Configuración aplicada:**
- ValidationPipe con whitelist y transform
- ClassSerializerInterceptor
- TransformInterceptor
- GlobalExceptionFilter
- Prefijo de API: `/api/v1`

**Tiempo de bootstrap:**
- Primera vez: ~1-2s
- Tests subsecuentes: ~0ms (reutiliza la misma instancia)

---

### 4. Sistema de Snapshots de Dos Niveles

**Ubicación:** `test/setup/jest.setup.ts`

#### Nivel 1: SEED_SNAPSHOT
- Estado de la base de datos después de ejecutar seeders
- Contiene todos los datos iniciales (usuarios, roles, permisos, etc.)
- Se restaura en `beforeAll` de cada archivo de test
- Garantiza que cada archivo empieza con estado limpio

#### Nivel 2: FILE_SNAPSHOT
- Estado de la base de datos después del `beforeAll` del archivo
- Incluye datos específicos del archivo (login, recursos creados en beforeAll)
- Se captura en el PRIMER `beforeEach` del archivo
- Se restaura en CADA `beforeEach` subsecuente
- Garantiza que cada test individual empieza con el mismo estado

**Ventajas:**
- Aislamiento completo entre tests
- Cada test ve el mismo estado inicial
- No necesita transacciones manuales
- Funciona con transacciones internas de servicios
- Rollback instantáneo (<1ms)

**Comparación con transacciones:**
```
Transacciones:
   No pueden rollback transacciones internas
   Requiere SAVEPOINTs complejos
   No funciona con QueryRunners independientes
   Requiere código adicional en cada test

Snapshots:
   Rollback de TODO el estado
   Sin configuración adicional
   Funciona con cualquier patrón de acceso a datos
   Más simple y más rápido
```

---

### 5. Optimización de bcrypt

**Ubicación:** `test/setup/bcrypt-mock.ts`

**Problema:**
- bcrypt con 10 rounds (default): ~100ms por hash
- Seeders con 10 usuarios: ~1 segundo solo en bcrypt
- Tests que crean usuarios: muy lentos

**Solución:**
- Mockear bcrypt para usar 1 round en tests
- 1 round: <1ms por hash
- Reducción de tiempo: ~100x

**Seguridad:**
- Solo afecta entorno de test
- Los tests siguen validando la lógica correctamente
- En producción se usa el valor real (10+ rounds)

---

### 6. Helpers de Testing

**Ubicación:** `test/utils/test-helpers.ts`

**Funciones principales:**

#### Autenticación:
- `loginAndGetToken()`: Login y obtener token
- `createAuthenticatedClient()`: Cliente pre-autenticado

#### Datos de test:
- `generateUniqueName()`: Nombres únicos basados en timestamp
- `generateUniqueEmail()`: Emails únicos

#### Assertions:
- `expectStandardResponse()`: Valida formato estándar de API
- `expectPaginatedResponse()`: Valida respuestas paginadas
- `expectErrorResponse()`: Valida respuestas de error

#### Setup:
- `setupTest()`: Setup completo (app + token)
- `setupTestWithTokens()`: Setup con múltiples tokens

---

## Flujo Completo de Ejecución

### Inicio de Jest

```
1. Jest inicia (proceso principal)
   └─> globalSetup.ts
       └─> Configura variables de entorno

2. Jest crea workers (procesos fork)
   └─> Por cada worker:
       └─> jest.setup.ts (setupFilesAfterEnv)
           ├─> Carga variables de entorno
           ├─> Mockea bcrypt
           ├─> Inicializa pg-mem
           ├─> Patchea TypeORM
           └─> beforeAll global
               ├─> Ejecuta seeders (primera vez)
               ├─> Crea SEED_SNAPSHOT
               └─> Inicializa app NestJS
```

### Ejecución de Test File

```
3. Archivo de test (ej: productos.e2e-spec.ts)
   
   beforeAll del archivo
   ├─> Obtiene app (await getTestApp())
   ├─> Login (await loginAndGetToken())
   └─> Setup adicional específico del archivo
   
   beforeEach (primer test)
   └─> Captura FILE_SNAPSHOT
   
   test 1 ejecuta
   
   beforeEach (tests subsecuentes)
   └─> Restaura FILE_SNAPSHOT (~0ms)
   
   test 2 ejecuta
   
   beforeEach
   └─> Restaura FILE_SNAPSHOT (~0ms)
   
   test N ejecuta
```

### Multi-worker

```
Worker 1                    Worker 2
├─ pg-mem instancia 1      ├─ pg-mem instancia 2
├─ seeders ejecutados      ├─ seeders ejecutados
├─ app NestJS 1            ├─ app NestJS 2
└─ Ejecuta tests A, B, C   └─ Ejecuta tests D, E, F

No hay estado compartido.
Paralelización segura.
```

---

## Métricas de Rendimiento

### Tiempos típicos

| Operación | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| Inicialización de worker | ~10s | ~5s | 2x |
| Primer test del worker | ~5s | ~2s | 2.5x |
| Tests subsecuentes | ~2s | ~50ms | 40x |
| Restore de base de datos | ~1s | <1ms | 1000x |
| Hash de bcrypt | ~100ms | <1ms | 100x |
| Suite completa | ~10min | ~1min | 10x |

### Ejemplos reales

```
Suite de 100 tests:
Antes:  ~200 segundos (3.3 minutos)
Después: ~20 segundos
Mejora: 10x

Suite de 500 tests:
Antes:  ~1000 segundos (16.7 minutos)
Después: ~100 segundos (1.7 minutos)
Mejora: 10x
```

---

## Debugging

### Ver logs detallados

```bash
# Ver inicialización de workers
npm run test:e2e -- --verbose

# Ver snapshot operations
# Los logs están en jest.setup.ts y pg-mem.ts
```

### Verificar estado de snapshots

```typescript
// En cualquier test
it('debug snapshot', () => {
  const g = global as any;
  console.log('SEED_SNAPSHOT:', !!g.__SEED_SNAPSHOT__);
  console.log('FILE_SNAPSHOT:', !!g.__FILE_SNAPSHOT__);
  console.log('PG_MEM_DB:', !!g.__PG_MEM_DB__);
  console.log('TEST_APP:', !!g.__TEST_APP__);
  console.log('SEEDED:', g.__SEEDED__);
});
```

### Modo debug

```bash
# Debug con Inspector de Node
npm run test:e2e:debug

# En Chrome: chrome://inspect
```

---

## Configuración Avanzada

### Ajustar número de workers

```json
// test/jest-e2e.json
{
  "maxWorkers": "50%"  // Usa 50% de CPUs
  // "maxWorkers": 4    // Usa 4 workers fijos
  // "maxWorkers": 1    // Un solo worker (para debugging)
}
```

### Ajustar timeout

```json
{
  "testTimeout": 30000  // 30 segundos por test
}
```

### Deshabilitar paralelización

```bash
npm run test:e2e -- --runInBand
```

---

## Variables de Entorno de Test

```env
NODE_ENV=test
DB_SYNC=false                          # TypeORM no debe sync
LOCAL_STORAGE_PATH=./uploads_test     # Path de uploads
JWT_SECRET=test-secret-key-mock       # Secret para JWT
JWT_EXPIRATION=1h                     # Expiración de tokens
OFF_API_ENABLED=false                 # Deshabilitar APIs externas
```

---

## Comparación con Alternativas

### pg-mem vs PostgreSQL real

| Feature | pg-mem | PostgreSQL Real |
|---------|--------|-----------------|
| Velocidad | 1000x más rápido | Baseline |
| Setup | 0 (en memoria) | Requiere Docker/instalación |
| Snapshots | <1ms | No disponible |
| Paralelización | Perfecto | Difícil (conflictos) |
| Features PostgreSQL | ~95% | 100% |

### Snapshots vs Transacciones

| Feature | Snapshots | Transacciones |
|---------|-----------|---------------|
| Rollback completo | TODO | Solo TX actual |
| Transacciones internas | Funciona | No rollback |
| Velocidad | <1ms | ~10-50ms |
| Complejidad | Simple | Complejo (SAVEPOINTs) |
| Código adicional | No | Sí (beforeEach/afterEach) |

---

## Principios del Diseño

1. **Singleton Pattern**: Una instancia compartida reduce overhead
2. **Lazy Initialization**: Solo crear cuando se necesita
3. **Snapshot Restore**: Más rápido que rebuild
4. **Mocking Strategies**: Reducir operaciones costosas
5. **Parallel Execution**: Aprovechar multi-core
6. **Immutable State**: Snapshots permiten tiempo-travel
7. **Fail Fast**: Detectar problemas temprano

---

## 📈 Escalabilidad

### Con 1000 tests

```
Workers: 8 (50% de 16 CPUs)
Tests por worker: ~125
Tiempo por test: ~50ms
Tiempo total: ~125 * 50ms = 6.25s por worker
Tiempo real: ~7-10s (incluyendo overhead)
```

### Con 10000 tests

```
Workers: 8
Tests por worker: ~1250
Tiempo por test: ~50ms
Tiempo total: ~1250 * 50ms = 62.5s por worker
Tiempo real: ~70-90s
```

---

## 🚨 Limitaciones Conocidas

1. **Funciones PostgreSQL avanzadas**
   - Algunas funciones específicas de PostgreSQL pueden no estar soportadas
   - Solución: Implementar mock en pg-mem.ts

2. **Estado compartido entre workers**
   - Cada worker tiene su propia instancia de pg-mem
   - No hay comunicación entre workers
   - Esto es por diseño y es correcto

3. **Tamaño de seeders**
   - Seeders muy grandes (~1GB de datos) pueden ser lentos
   - Solución: Reducir datos de test o usar snapshots pre-generados

4. **Memory leaks**
   - Si tests no se limpian correctamente, puede haber leaks
   - Solución: Usar snapshots en lugar de limpiar manualmente

---

## Mejoras Futuras

1. **Snapshots pre-generados**
   - Generar snapshot una vez y reutilizarlo en todos los runs
   - Reduciría tiempo de primer test a ~0ms

2. **Test fixtures**
   - Sistema de fixtures reutilizables
   - Diferentes snapshots para diferentes escenarios

3. **Parallel seeders**
   - Ejecutar seeders en paralelo cuando sea posible
   - Reducir tiempo de inicialización

4. **Metrics dashboard**
   - Dashboard para ver métricas de tests
   - Identificar tests lentos
   - Tracking de mejoras de rendimiento

---

**Documentación técnica - SmartEconomat Team**  
**Última actualización:** Marzo 2026
