# Plan: Pedidos deterministas con fechas distribuidas y tests robustos

## Objetivo
Modificar los seeders de pedidos para que:
1. Usen fechas distribuidas por semanas (base fija: 2026-01-05)
2. Tengan estados variados y realistas por proveedor cuando el lote está aprobado
3. Eliminen toda dependencia de faker sustituida por catálogos fijos
4. Los tests sean 100% deterministas con valores concretos

## Archivos a modificar
- `backend/smart-economat-backend/src/seeders/massive.helpers.body.orders.ts` — builder principal
- `backend/smart-economat-backend/src/seeders/massive.helpers.body.orders.spec.ts` — tests

## Cambios detallados

### massive.helpers.body.orders.ts

#### 1. Añadir constantes deterministas al inicio del archivo

```
SEED_BASE_FECHA = new Date('2026-01-05T08:00:00.000Z')  // lunes semana 1

function seedDate(daysOffset: number): string
  — devuelve ISO string de SEED_BASE_FECHA + daysOffset días

function seedWeekOffset(iteration: number): number
  — Math.floor(iteration / 5) * 7  — cada 5 pedidos = nueva semana

CANCELACION_MOTIVOS: string[] — array de 5 motivos reales fijos
RECEPCION_OBSERVACIONES: string[] — array de 5 textos fijos
RECEPCION_INCIDENCIA_DESCRIPCIONES: string[] — array de 3 textos fijos
ALBARAN_NOTAS: string[] — array de 5 textos fijos
PRODUCTO_NUEVO_NOMBRES: string[] — array de 5 nombres fijos
PRODUCTO_NUEVO_MARCAS: string[] — array de 5 marcas fijas

CANTIDADES_RECIBIDAS: number[] = [2, 3, 5, 8, 4, 6, 1, 5]
CADUCIDAD_DIAS_OFFSET: number[] = [60, 75, 45, 90, 120, 50, 80, 100]
```

#### 2. Eliminar faker — mapa de sustituciones

| Línea | Uso actual de faker | Sustitución |
|---|---|---|
| L199 draft nota | faker.lorem.sentence() | 'Borrador de pedido en progreso' |
| L220 draft recepcion nota | faker.lorem.sentence() | 'Borrador de recepcion en progreso' |
| L347 consolidate obs (rama forced) | faker.lorem.sentence() | 'Consolidacion de lotes pendientes de usuario para el periodo.' |
| L391 cancelar motivoCancelacion | faker.lorem.sentence() | CANCELACION_MOTIVOS[iteration % CANCELACION_MOTIVOS.length] |
| L434 recepciones nAlbaran (inner) | faker.string.alphanumeric(8) | `S${weekNum}-${padded iteration}` pattern |
| L438 recepciones nAlbaran (outer) | faker.string.alphanumeric(8) | igual, mismo patrón |
| L439 recepciones fechaRecepcion | faker.date.recent({ days: 3 }) | seedDate(weekDaysOffset) |
| L440 recepciones observaciones | faker.lorem.sentence() | RECEPCION_OBSERVACIONES[iteration % 5] |
| L450 fechaCaducidad | faker.date.soon({ days: 45 }) | seedDate(weekDaysOffset + caducidadExtra) |
| L451 producto observaciones | faker.lorem.sentence() | RECEPCION_OBSERVACIONES[(iteration+1) % 5] |
| L453 incidenciaDescripcion | faker.lorem.sentence() | RECEPCION_INCIDENCIA_DESCRIPCIONES[iteration % 3] |
| L459 recepcion-productos cantidadRecibida | faker.number.float(...) | CANTIDADES_RECIBIDAS[iteration % 8] |
| L463 nombre producto nuevo | faker.commerce.productName() | PRODUCTO_NUEVO_NOMBRES[iteration % 5] |
| L464 marca producto nuevo | faker.company.name() | PRODUCTO_NUEVO_MARCAS[iteration % 5] |
| L472 producto nuevo observaciones | faker.lorem.sentence() | RECEPCION_OBSERVACIONES[(iteration+2) % 5] |
| L559 recepcion-productos obs | faker.lorem.sentence() | RECEPCION_OBSERVACIONES[iteration % 5] |

También:
- `cantidadRecibida` en `/recepciones` (L447): sustituir faker.number.float por CANTIDADES_RECIBIDAS
- `cantidadAlbaran` derivar de cantidadRecibida sin faker

#### 3. Añadir fechaEntrega real al PATCH /pedidos/:id/fecha-entrega
Body actual: `{ observaciones: "No-op seed..." }`
Body nuevo: `{ fechaEntrega: seedDate(weekDaysOffset + 5) }`
(si el endpoint acepta el campo; de lo contrario mantener como no-op sin faker)

#### 4. Añadir observaciones contextuales de estado

Definir `ESTADO_OBSERVACIONES_POR_PROVEEDOR`:
```
const ESTADO_OBSERVACIONES = [
  'Pedido recepcionado correctamente en almacen.',
  'Cancelado por retraso del proveedor superior a 5 dias.',
  'Recepcion con incidencia: faltante de 2 unidades en referencia principal.',
  'Recepcion parcial: pendiente de completar segunda entrega.',
  'Pedido pendiente de aprobacion de compras.',
]
```
Usar `iteration % ESTADO_OBSERVACIONES.length` en los cuerpos de POST /pedidos y POST /pedido-usuarios en lugar del string fijo actual, para que cada pedido en el catálogo lleve una "intención" legible.

### massive.helpers.body.orders.spec.ts

#### Cambios en tests existentes
- `uses canonical pedido-usuario ids for consolidate`: OK, ya es determinista
- `falls back to pending pedido-usuario ids`: OK
- `prefers freshly precreated consolidate`: OK
- `builds canonical payloads for pedido-usuarios/from-missing-stock`: fijar cantidad esperada concreta (1500) en lugar de `expect.any(Number)`
- `builds canonical payloads for pedido-usuarios/from-recipes`: OK ya fija recetaIds exactos
- `builds pedidos with several lines from the same provider`: OK estructura está bien
- `builds grouped pedidos with multiple providers and several product lines`: OK

#### Nuevos tests a añadir
1. **cancelar body**: espera `motivoCancelacion` igual al primer elemento del catálogo fijo (iteration 0)
2. **recepciones body**: espera `nAlbaran` con patrón `ALB-S1-000`, `fechaRecepcion` igual a fecha base ISO, `cantidadRecibida` igual a CANTIDADES_RECIBIDAS[0]=2
3. **fecha-entrega body** (si se cambia de no-op): espera `fechaEntrega` igual a seedDate fija
4. **observaciones de pedido por iteration**: espera que iteration 0 y iteration 1 produzcan `observaciones` distintas (usando ESTADO_OBSERVACIONES)

## Restricciones y decisiones

- No modificar el ORDEN de llamadas HTTP del catálogo (usuario pide no cambiar el flujo).
- No crear nuevos archivos.
- `fechaPedido` no acepta la API directamente — no se puede distribuir en DB. Alternativa: `fechaEntrega` y `fechaRecepcion` sí son controlables.
- El patrón de estados por proveedor (recepcionado/cancelado/incidencia) lo controla el catálogo de endpoints, no el builder. El builder solo añade observaciones semánticas por iteration.
- Mantener importación de `faker` hasta cero usos: si queda algún caso sin catálogo alternativo viable, documentarlo explícitamente.

## Verificación
1. `npm run build` sin errores en backend.
2. `npx jest src/seeders/massive.helpers.body.orders.spec.ts --runInBand` — todos los tests pasan.
3. Revisión manual: ningún uso de faker en el archivo tras los cambios.
4. `npm run seed` avanza por sección de pedidos sin regresiones.
