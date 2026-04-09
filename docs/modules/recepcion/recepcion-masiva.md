# Recepción masiva y garantía transaccional

Este documento detalla la arquitectura técnica y el flujo de trabajo del sistema de recepción masiva del SmartEconomat, diseñado para gestionar volúmenes de datos de gran escala (cientos o miles de productos) con total integridad.

## 1. Arquitectura del backend

La lógica reside en el `RecepcionStockService` y utiliza un patrón de transacción única para garantizar que la base de datos nunca quede en un estado inconsistente.

### Flujo Transaccional
1. **Inicio**: Se crea un `QueryRunner` dedicado.
2. **Validación**: Se verifica la existencia del Pedido y se mapean los productos esperados.
3. **Batching (Optimización)**:
   - En lugar de realizar inserciones `INSERT` individuales en un bucle (lo cual causaría miles de peticiones a la DB), el sistema recolecta todas las entidades en arrays:
     - `batchRecepcionProductos`
     - `batchInventarios`
     - `batchMovimientos`
   - Al finalizar el procesamiento lógico, se ejecutan operaciones `save()` sobre los arrays completos. Esto reduce el overhead de red y tiempo de CPU drásticamente.
4. **Multi-Pedido**: El sistema puede vincular una sola recepción a múltiples pedidos de compra (`pedidoId` en el array de pedidos).
5. **Alta Directa**: Si se detecta un producto no catalogado mediante su código de barras durante la recepción, el sistema permite crearlo on-the-fly (`productosNuevos`).
6. **Cálculo de Incidencias**: Se comparan las cantidades recibidas totales vs. las pedidas para generar automáticamente mermas o avisos.
7. **Commit**: Si todas las operaciones tienen éxito, se hace persistente el cambio.
8. **Rollback**: Si ocurre CUALQUIER error (fallo de red, dato corrupto, error de base de datos) durante el procesamiento de los miles de productos, la transacción se revierte al punto inicial como si nada hubiera pasado.

## 2. Frontend: resiliencia y experiencia de usuario

El wizard de recepción en React ha sido blindado para evitar la pérdida de trabajo del operario.

### Características de Seguridad e Integridad
- **Persistencia de Borrador (Server-side)**: Los datos escaneados se sincronizan automáticamente con el servidor. Esto permite que el operario pueda cambiar de dispositivo o recargar la página sin perder el progreso, garantizando la resiliencia del trabajo.
- **Bloqueo de Interfaz (Backdrop)**: Durante el envío final, se muestra un bloqueo visual que impide al usuario realizar más acciones, informando sobre la integridad de la transacción en curso.
- **Políticas de Sincronización**: El borrador en el servidor solo se elimina tras recibir una confirmación `HTTP 200/201` exitosa del procesamiento final. Si ocurre un error de red o de base de datos, los datos permanecen seguros para un reintento inmediato.

## 3. Guía de Operación para Desarrolladores

### Endpoint
- **URL**: `POST /api/v1/recepcion`
- **Payload**: `CreateRecepcionMaestraDto`
  - `pedidos`: Array de `{ pedidoId, nAlbaran, observaciones }`.
  - `productos`: Array de `{ pedidoProductoId, cantidadRecibida, estadoVisual, fechaCaducidad }`.
  - `productosNuevos`: Array de productos técnicos para creación directa.

### Enums Disponibles
- **EstadoVisualProducto**: 
  - `OPTIMO`: El stock se suma al inventario físico.
  - `ROTO` / `DEFECTUOSO`: No se suma al stock disponible, pero genera automáticamente una `Incidencia` para reclamación al proveedor.

