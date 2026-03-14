# Pedidos desde múltiples recetas

## Objetivo

Permitir seleccionar $N$ recetas y generar un único pedido consolidado para compra.

El flujo aplana los ingredientes de todas las recetas seleccionadas, agrupa productos repetidos y crea un `Pedido` único contra un proveedor común válido.

---

## Endpoint

- `POST /api/v1/pedidos/from-recipes`

### Payload

```json
{
  "recetaIds": ["uuid-v7-1", "uuid-v7-2"],
  "observaciones": "Pedido generado para producción semanal"
}
```

### Respuesta esperada

- `201 Created`
- Devuelve el `Pedido` creado con sus líneas consolidadas.

---

## Reglas de negocio

### 1. Existencia de recetas

Todas las recetas enviadas deben existir.

- Si falta alguna, la API responde `404 Not Found`.

### 2. Producto activo/disponible

Cada ingrediente debe referenciar un producto disponible.

- Si un ingrediente apunta a un producto inactivo o no disponible, la operación falla con `400 Bad Request`.

### 3. Consolidación de ingredientes

Se utiliza un `Map` indexado por `productoId`.

Ejemplo:

- Receta A: `Harina = 2kg`
- Receta B: `Harina = 1kg`
- Resultado: una única línea consolidada con `Harina = 3kg`

Si existe `mermaAplicada`, la cantidad consolidada se calcula como:

$$
\text{cantidad efectiva} = \text{cantidad base} \times \left(1 + \frac{\text{merma}}{100}\right)
$$

### 4. Compatibilidad de unidades

Si el mismo producto aparece en varias recetas con unidades incompatibles, la operación se rechaza.

### 5. Proveedor común

Todos los ingredientes consolidados deben poder comprarse a un proveedor común con precio vigente.

- Si no existe proveedor común, la API responde `400 Bad Request`.
- Si existen varios proveedores comunes, se selecciona el de menor coste total estimado.

### 6. Creación del pedido

Una vez consolidado el conjunto de líneas:

- Se llama internamente a `PedidoService.create()`.
- El pedido queda vinculado al usuario autenticado extraído del JWT.
- El estado inicial es `PENDIENTE`.

### 7. Trazabilidad del origen

El origen del pedido se registra en logs del backend, incluyendo:

- `pedido.id`
- `recetaIds`
- `userId`
- `proveedorId`
- `observaciones` si existen

---

## Componentes implicados

### DTO

- [backend/smart-economat-backend/src/modules/pedido/dto/generate-pedido-from-recetas.dto.ts](backend/smart-economat-backend/src/modules/pedido/dto/generate-pedido-from-recetas.dto.ts)

### Servicio principal

- [backend/smart-economat-backend/src/modules/pedido/service/receta-to-pedido.service.ts](backend/smart-economat-backend/src/modules/pedido/service/receta-to-pedido.service.ts)

### Controlador

- [backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts](backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts)

### Módulo

- [backend/smart-economat-backend/src/modules/pedido/pedido.module.ts](backend/smart-economat-backend/src/modules/pedido/pedido.module.ts)

---

## Estrategia de pruebas

### Unitarias

Cubren:

- consolidación de ingredientes repetidos
- `404` por receta inexistente
- rechazo por producto sin proveedor
- rechazo por proveedor común inexistente
- rechazo por producto inactivo
- rechazo por unidades incompatibles
- aplicación de merma
- selección del proveedor común más barato
- registro en logs del origen del pedido

Archivo:

- [backend/smart-economat-backend/test/modules/pedido/receta-to-pedido.service.spec.ts](backend/smart-economat-backend/test/modules/pedido/receta-to-pedido.service.spec.ts)

### E2E

Cubren:

- creación real del pedido consolidado vía HTTP
- `404` si alguna receta no existe
- `400` si no existe proveedor común

Archivo:

- [backend/smart-economat-backend/test/e2e/pedidos.e2e-spec.ts](backend/smart-economat-backend/test/e2e/pedidos.e2e-spec.ts)

---

## Casos cubiertos

| Código | Tipo | Descripción |
|---|---|---|
| `U-PED-FRR-01` | Unit | Consolida cantidades repetidas |
| `U-PED-FRR-02` | Unit | Falla si falta una receta |
| `U-PED-FRR-03` | Unit | Falla sin proveedor asignado |
| `U-PED-FRR-04` | Unit | Falla sin proveedor común |
| `U-PED-FRR-05` | Unit | Falla con producto inactivo |
| `U-PED-FRR-06` | Unit | Falla con unidades incompatibles |
| `U-PED-FRR-07` | Unit | Aplica merma y elige proveedor más barato |
| `U-PED-FRR-08` | Unit | Registra el origen en logs |
| `E2E-PED-18` | E2E | Genera pedido consolidado |
| `E2E-PED-19` | E2E | Devuelve `404` por receta inexistente |
| `E2E-PED-20` | E2E | Devuelve `400` sin proveedor común |

---

## Consideraciones

- Actualmente el flujo fija `fechaEntrega` con la fecha actual al delegar en `PedidoService.create()`.
- La trazabilidad del origen está implementada vía logs, no mediante metadatos persistidos en la entidad `Pedido`.
- Si en una evolución futura se requiere auditoría persistente, se recomienda añadir un campo estructurado de origen en la entidad o una tabla de eventos de dominio.
