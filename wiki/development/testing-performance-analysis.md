# Infraestructura de testing y rendimiento

Este documento resume la infraestructura actual de tests del backend y los puntos que más impactan en el tiempo de ejecución. Sustituye informes anteriores basados en una topología de setup ya retirada.

## Configuración vigente

## Jest E2E

Archivo principal: [backend/smart-economat-backend/test/jest-e2e.json](../../backend/smart-economat-backend/test/jest-e2e.json)

Características relevantes:

- `rootDir` apuntando al backend
- `@swc/jest` como transformador
- `setupFilesAfterEnv` en `test/setup/jest.setup.ts`
- `globalSetup` y `globalTeardown` dedicados
- `testTimeout` de 30 segundos

## Setup global y por worker

### Global setup

Archivo: [backend/smart-economat-backend/test/globalSetup.ts](../../backend/smart-economat-backend/test/globalSetup.ts)

Su responsabilidad actual es mínima y correcta:

- fijar `NODE_ENV=test`
- desactivar integración externa con `OFF_API_ENABLED=false`
- preparar variables base de JWT y almacenamiento temporal

No intenta compartir memoria entre workers, lo cual evita falsas expectativas con Jest.

### Setup por worker

Archivo: [backend/smart-economat-backend/test/setup/jest.setup.ts](../../backend/smart-economat-backend/test/setup/jest.setup.ts)

Es el núcleo real de rendimiento de la suite. Cada worker:

1. carga variables de entorno
2. inicializa `pg-mem`
3. aplica mock de bcrypt para tests
4. prepara el `DataSource`
5. ejecuta seeders de test
6. inicializa la app NestJS
7. usa snapshots de `pg-mem` para restaurar estado entre tests

## App de test compartida

Helper principal: [backend/smart-economat-backend/test/test-app.helper.ts](../../backend/smart-economat-backend/test/test-app.helper.ts)

La app Nest se crea una sola vez por worker y luego se reutiliza. Esto evita recompilar módulos para cada archivo o cada caso de test.

## Estrategia de aislamiento

La suite actual no depende de una base PostgreSQL real para E2E internos. En su lugar:

- usa `pg-mem`
- ejecuta seeders una vez por worker
- toma snapshot del estado sembrado
- restaura snapshot antes de cada test o suite según corresponda

Esta estrategia reduce mucho el coste frente a recrear esquema y datos en cada caso.

## Factores que más afectan al tiempo total

## Coste fijo por worker

El mayor coste no está en cada test individual, sino en el bootstrap del worker:

- inicialización de NestJS
- inicialización de TypeORM sobre `pg-mem`
- ejecución de seeders

Cuantos más workers lance Jest, más veces se paga ese coste fijo.

## Seeders y datos de prueba

El volumen y complejidad de seeders sigue siendo el factor más sensible. Cualquier seeder con lógica externa, generación masiva o dependencias pesadas impactará directamente en el arranque del worker.

## Recomendaciones vigentes

- Mantener `OFF_API_ENABLED=false` en tests para evitar dependencias externas.
- Evitar seeders con I/O de red o generación innecesariamente costosa.
- Reutilizar la app compartida por worker en lugar de crear una app por archivo.
- Medir por separado tiempo de bootstrap y tiempo de ejecución de tests para no optimizar la parte equivocada.

## Señales de degradación

Revisar esta infraestructura cuando aparezca alguno de estos síntomas:

- E2E cada vez más lentos aunque el número de asserts no crezca
- workers que tardan demasiado en arrancar
- seeders que empiezan a depender de servicios externos
- flakes por estado compartido mal restaurado

## Documentos relacionados

- [README de testing](testing/README.md)
- [Tests E2E de contratos frontend-backend](testing/frontend-backend-contracts-e2e.md)
- [Inicio rápido](../getting-started/inicio-rapido.md)