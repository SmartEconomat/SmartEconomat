# Alta Compleja de Producto (Maestro + Proveedores)

## Objetivo

Permitir el alta de un `Producto` genérico y, opcionalmente, registrar en el mismo flujo sus relaciones con `ProductoAlergeno` y `ProductoProveedor`.

Este caso de uso cubre dos modos operativos:

1. **Transacción única**: creación del producto maestro con alérgenos y proveedores en un solo `POST /productos`.
2. **Flujo conectado**: creación del producto base y enriquecimiento posterior con `PATCH /productos/:id`.

---

## Entidades implicadas

| Entidad | Papel en el flujo |
| :--- | :--- |
| `Producto` | Ficha técnica base del catálogo. |
| `ProductoAlergeno` | Tabla puente para declarar alérgenos del producto. |
| `ProductoProveedor` | Relación comercial entre producto y proveedor. |
| `Proveedor` | Maestro comercial validado antes de vincular relaciones. |

---

## DTOs y validaciones

### `CreateProductoDto`

Campos principales:

| Campo | Tipo | Obligatorio | Validación |
| :--- | :--- | :---: | :--- |
| `nombre` | `string` | Sí | `@IsNotEmpty`, `@IsString`, `@MaxLength(100)` |
| `marca` | `string` | No | `@IsString`, `@MaxLength(100)` |
| `descripcion` | `string` | No | `@IsString`, `@MaxLength(1000)` |
| `unidad` | `UnidadMedida` | Sí | `@IsNotEmpty`, `@IsEnum(UnidadMedida)` |
| `fechaCaducidad` | `Date` | No | `@IsDate` |
| `pathImg` | `string` | No | `@IsString`, `@MaxLength(200)` |
| `tipo` | `TipoProducto` | No | `@IsEnum(TipoProducto)` |
| `codigoBarras` | `string` | No | `@Matches(/^\d{13}$/)` |
| `contenido` | `number` | Sí | `@IsNumber`, `@Min(0)` |
| `alergenos` | `Alergeno[]` | No | `@IsArray`, `@IsEnum(Alergeno, { each: true })` |
| `proveedores` | `AddProveedorToProductoDto[]` | No | `@IsArray`, `@ValidateNested({ each: true })` |

### `AddProveedorToProductoDto`

| Campo | Tipo | Obligatorio | Validación |
| :--- | :--- | :---: | :--- |
| `proveedorId` | `string` | Sí | `@IsUUID('7')`, `@IsNotEmpty` |
| `codigoBarras` | `string` | No | `@Matches(/^\d{13}$/)` |
| `precioUnitario` | `number` | Condicional* | `@IsNumber`, `@Min(0)` |
| `marcaEspecifica` | `string` | No | `@IsString`, `@MaxLength(100)` |

> *En el alta compleja dentro de `POST /productos`, `precioUnitario` se exige como regla de negocio para cada proveedor enviado.

---

## Enums compartidos

### `UnidadMedida`

- `KG`
- `G`
- `L`
- `ML`
- `UNIDAD`
- `PAQ`

### `Alergeno`

- `GLUTEN`
- `CRUSTACEOS`
- `HUEVOS`
- `PESCADO`
- `CACAHUETES`
- `SOJA`
- `LACTEOS`
- `FRUTOS_CON_CASCARA`
- `APIO`
- `MOSTAZA`
- `SESAMO`
- `SULFITO`
- `ALTRAMUCES`
- `MOLUSCOS`

---

## Flujo funcional

### Escenario principal

1. Un administrador crea un producto genérico, por ejemplo `Leche`.
2. Añade alérgenos, por ejemplo `LACTEOS`.
3. Vincula uno o varios proveedores, por ejemplo `Pascual`, indicando precio y datos específicos.
4. El sistema devuelve la ficha completa con relaciones cargadas.

### Flujo conectado

1. Se crea el producto maestro sin relaciones.
2. Posteriormente se actualiza con `PATCH /productos/:id`.
3. La operación reemplaza el conjunto de alérgenos y sincroniza el conjunto de proveedores recibido.

---

## Lógica transaccional

La lógica vive en `ProductoService` y se ejecuta con `dataSource.transaction(...)`.

Garantías principales:

- Si falla una validación de proveedor, no se persiste el `Producto`.
- Si hay conflicto en alérgenos o proveedores duplicados, se aborta toda la operación.
- Si se envían alérgenos, se recrea la colección completa en `ProductoAlergeno` dentro de la misma transacción.
- Si se envían proveedores, se sincronizan altas, actualizaciones y bajas en `ProductoProveedor` dentro de la misma transacción.

### Reglas de negocio aplicadas

- Generación automática de EAN-13 si `codigoBarras` no se envía.
- Rechazo de EAN-13 inválido.
- Rechazo de `codigoBarras` duplicado del producto con `409 Conflict`.
- Rechazo de alérgenos repetidos en la misma solicitud.
- Rechazo de proveedores repetidos en la misma solicitud.
- Validación de existencia real del `Proveedor` antes de crear la relación.
- Exigencia de `precioUnitario` en alta compleja cuando se envían proveedores.

---

## Endpoints implicados

### `POST /api/v1/productos`

Alta compleja del producto maestro.

#### Ejemplo de payload

```json
{
  "nombre": "Leche",
  "marca": "Genérica",
  "tipo": "lacteo",
  "unidad": "L",
  "contenido": 1,
  "alergenos": ["LACTEOS"],
  "proveedores": [
    {
      "proveedorId": "01954a87-0778-74d4-bb32-55b12044579f",
      "precioUnitario": 1.45,
      "marcaEspecifica": "Pascual",
      "codigoBarras": "5901234123457"
    }
  ]
}
```

#### Respuestas esperadas

| Código | Significado |
| :--- | :--- |
| `201` | Producto creado correctamente con relaciones opcionales. |
| `400` | Datos inválidos, EAN-13 inválido o ausencia de precio unitario requerido. |
| `404` | Algún `proveedorId` no existe. |
| `409` | Código de barras duplicado, alérgenos duplicados o proveedores duplicados. |

### `PATCH /api/v1/productos/:id`

Permite completar o sustituir las relaciones del producto ya existente.

- Si `alergenos` está presente, sustituye el conjunto actual.
- Si `proveedores` está presente, sincroniza el conjunto actual.

---

## Swagger / OpenAPI

El endpoint principal está documentado en Swagger con:

- `@ApiBody` para el payload del alta compleja.
- `@ApiResponse` para respuestas `201`, `400`, `404` y `409`.
- Propiedades del DTO decoradas con `@ApiProperty` y `@ApiPropertyOptional`.

La especificación viva puede consultarse en `/docs` con la aplicación levantada.

---

## Errores HTTP esperados

| Excepción | Caso |
| :--- | :--- |
| `BadRequestException` | Formato inválido, EAN-13 inválido, precio unitario ausente en alta compleja. |
| `NotFoundException` | Proveedor inexistente o producto inexistente al actualizar. |
| `ConflictException` | Duplicidad de código de barras, proveedores o alérgenos. |

---

## Pruebas implementadas

### Unitarias

- Validación de DTOs del alta compleja.
- Creación transaccional correcta.
- Rechazo por alérgenos duplicados.
- Rechazo por proveedores duplicados.
- Rechazo por proveedor inexistente.
- Rechazo por precio unitario ausente.
- Actualización del flujo conectado con sincronización de relaciones.

### E2E

- Alta completa con producto + alérgenos + proveedor.
- Rechazo con rollback cuando el proveedor no existe.
- Rechazo con rollback por proveedores duplicados.
- Rechazo con rollback por alérgenos duplicados.
- Flujo conectado mediante actualización posterior del producto base.

---

## Referencias relacionadas

- [Referencia API](../../reference/api.md)
- [Modelo de datos](../../architecture/data-model.md)
- [Página de Productos](../../frontend/paginas/Productos.md)
- [Casos de uso](../../planning/use-cases/use-cases.md)