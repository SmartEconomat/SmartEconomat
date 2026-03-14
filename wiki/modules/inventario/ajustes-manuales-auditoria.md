# Ajustes manuales de inventario con auditoría

> Fecha: 14 de marzo de 2026  
> Estado: Implementado en backend y cubierto con tests unitarios y e2e.

---

## 1. Objetivo

Permitir regularizaciones manuales de stock para cubrir roturas internas, mermas, errores operativos o correcciones de inventario, garantizando:

- validación estricta del payload;
- prohibición de stock negativo lógico;
- consistencia transaccional entre `Inventario` y `Movimiento`;
- trazabilidad del usuario autenticado;
- documentación OpenAPI y referencia técnica estable.

---

## 2. Endpoint

- Método: `POST`
- Ruta: `/api/v1/inventario/ajustes-manuales`
- Permiso: `inventario:ajustar_stock`

### Request body

```json
{
  "inventarioId": "01954a87-0778-74d4-bb32-55b12044579f",
  "tipo": "salida_ajuste",
  "ajuste": -3,
  "motivo": "Rotura interna",
  "observaciones": "Envase dañado en almacén"
}
```

### Respuesta exitosa

- Código: `201 Created`
- Retorna el `Inventario` actualizado.

---

## 3. DTO y validaciones

Archivo: [backend/smart-economat-backend/src/modules/inventario/dto/create-movimiento-manual.dto.ts](backend/smart-economat-backend/src/modules/inventario/dto/create-movimiento-manual.dto.ts)

### Campos

| Campo | Tipo | Requerido | Validaciones |
|---|---|---:|---|
| `inventarioId` | `string` | Sí | `IsUUID('7')`, `IsNotEmpty()` |
| `tipo` | `TipoMovimientoManual` | Sí | `IsEnum()` |
| `ajuste` | `number` | Sí | `Type(() => Number)`, `IsNumber()`, `NotEquals(0)` |
| `motivo` | `string` | Sí | `IsString()`, `IsNotEmpty()`, `MaxLength(150)` |
| `observaciones` | `string` | No | `IsOptional()`, `IsString()`, `MaxLength(500)` |

### Enum utilizado

Archivo: [backend/smart-economat-backend/src/modules/movimiento/enums/movimiento.enums.ts](backend/smart-economat-backend/src/modules/movimiento/enums/movimiento.enums.ts)

```ts
TipoMovimientoManual = {
  ENTRADA,
  AJUSTE,
  SALIDA_AJUSTE,
}
```

---

## 4. Reglas de negocio

Implementadas en [backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts](backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts).

### Reglas funcionales

1. El ajuste no puede ser `0`.
2. Si `tipo = entrada`, el valor de `ajuste` debe ser positivo.
3. Si `tipo = salida_ajuste`, el valor de `ajuste` debe ser negativo.
4. El stock resultante no puede quedar por debajo de `0`.
5. La operación debe ser atómica: actualizar stock y registrar el movimiento en una sola transacción.

### Regla matemática

$$
cantidadActual + ajuste \ge 0
$$

Si la condición no se cumple, se devuelve `409 Conflict`.

---

## 5. Flujo transaccional

La operación usa `DataSource.transaction(...)` y lock pesimista sobre el registro de inventario.

### Secuencia backend

1. Validar el DTO.
2. Abrir transacción.
3. Buscar `Inventario` por `inventarioId` con `pessimistic_write`.
4. Calcular el nuevo stock con `Inventario.ajustarCantidad(delta)`.
5. Persistir `Inventario` actualizado.
6. Crear `Movimiento` con:
   - `tipo`
   - `cantidad = abs(ajuste)`
   - `usuario`
   - `inventario`
   - `productoProveedor`
   - `entidad = 'AjusteManualInventario'`
   - `descripcion` con motivo y observaciones
7. Confirmar transacción.

### Resultado esperado

- Si todo va bien: stock actualizado y traza persistida.
- Si falla cualquier paso: rollback automático.

---

## 6. Auditoría

La auditoría queda persistida en la entidad `Movimiento`.

Campos relevantes:

- `usuarioId`
- `inventarioId`
- `productoProveedorId`
- `tipo`
- `cantidad`
- `entidad`
- `entidadId`
- `descripcion`
- `createdAt`

La descripción del movimiento sigue este patrón:

```text
Ajuste manual de inventario: <producto> (<stock_anterior> -> <stock_actual>) | Motivo: <motivo> | Observaciones: <observaciones>
```

---

## 7. Errores HTTP

| Código | Excepción | Caso |
|---|---|---|
| `400` | `BadRequestException` | DTO inválido, ajuste `0`, signo inconsistente |
| `404` | `NotFoundException` | `Inventario` inexistente |
| `409` | `ConflictException` | El ajuste dejaría el stock en negativo |

---

## 8. Cobertura de tests

### Unitarios

#### Servicio

Archivo: [backend/smart-economat-backend/test/modules/inventario/inventario.service.spec.ts](backend/smart-economat-backend/test/modules/inventario/inventario.service.spec.ts)

Casos cubiertos:

- ajuste manual exitoso;
- movimiento auditado con usuario;
- descripción con motivo;
- rechazo de stock negativo;
- rechazo de ajuste `0`;
- rechazo de signo inconsistente para `entrada`;
- rechazo de signo inconsistente para `salida_ajuste`;
- inventario inexistente.

#### Controlador

Archivo: [backend/smart-economat-backend/test/modules/inventario/inventario.controller.spec.ts](backend/smart-economat-backend/test/modules/inventario/inventario.controller.spec.ts)

Casos cubiertos:

- resolución del controlador;
- delegación de `ajustarManual()` al servicio con el `userId` autenticado.

#### DTO

Archivo: [backend/smart-economat-backend/test/modules/inventario/create-movimiento-manual.dto.spec.ts](backend/smart-economat-backend/test/modules/inventario/create-movimiento-manual.dto.spec.ts)

Casos cubiertos:

- payload válido;
- UUID inválido;
- enum inválido;
- ajuste `0`;
- motivo vacío;
- observaciones demasiado largas.

### E2E

Archivo: [backend/smart-economat-backend/test/e2e/inventario.e2e-spec.ts](backend/smart-economat-backend/test/e2e/inventario.e2e-spec.ts)

Casos cubiertos:

- ajuste manual exitoso vía HTTP;
- persistencia real de `Movimiento` auditado;
- `400` por signo inconsistente;
- `400` por ajuste `0`;
- `404` por inventario inexistente;
- `409` por stock negativo.

---

## 9. Archivos modificados

- [backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts](backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts)
- [backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts](backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts)
- [backend/smart-economat-backend/src/modules/inventario/dto/create-movimiento-manual.dto.ts](backend/smart-economat-backend/src/modules/inventario/dto/create-movimiento-manual.dto.ts)
- [backend/smart-economat-backend/src/modules/movimiento/enums/movimiento.enums.ts](backend/smart-economat-backend/src/modules/movimiento/enums/movimiento.enums.ts)
- [backend/smart-economat-backend/test/modules/inventario/inventario.service.spec.ts](backend/smart-economat-backend/test/modules/inventario/inventario.service.spec.ts)
- [backend/smart-economat-backend/test/modules/inventario/inventario.controller.spec.ts](backend/smart-economat-backend/test/modules/inventario/inventario.controller.spec.ts)
- [backend/smart-economat-backend/test/modules/inventario/create-movimiento-manual.dto.spec.ts](backend/smart-economat-backend/test/modules/inventario/create-movimiento-manual.dto.spec.ts)
- [backend/smart-economat-backend/test/e2e/inventario.e2e-spec.ts](backend/smart-economat-backend/test/e2e/inventario.e2e-spec.ts)

---

## 10. Riesgos conocidos

1. El sistema bloquea stock negativo de forma lógica y a nivel de entidad; no existe de momento una configuración para permitir excepciones.
2. La auditoría usa `Movimiento` como bitácora transversal; no existe una entidad independiente `AjusteManual`.
3. La ejecución local de tests requiere dependencias instaladas en `backend/smart-economat-backend`.
