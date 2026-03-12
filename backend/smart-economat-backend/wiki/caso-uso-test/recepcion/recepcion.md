# Plan de Pruebas: Módulo de Recepción

Este documento detalla los escenarios de prueba técnicos y funcionales para el módulo de Recepción, garantizando la integridad del stock, la trazabilidad de pedidos, la gestión de incidencias y la creación masiva de entradas.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Creación de Recepción Estándar (POST /api/v1/recepcion)

1. **E2E-REC-01-CRE**: Recepción exitosa de un pedido completo (cantidades coinciden 100%).
2. **E2E-REC-02-CRE**: Recepción parcial (cantidad recibida < cantidad pedida). Verificar que el pedido queda en estado `PARCIAL` o `EN_PROCESO`.
3. **E2E-REC-03-CRE**: Recepción con exceso (cantidad recibida > cantidad pedida). Verificar generación automática de **Incidencia tipo EXCESO**.
4. **E2E-REC-04-CRE**: Recepción de múltiples pedidos en un solo ticket.
5. **E2E-REC-05-CRE**: Recepción con **Creación de Productos Nuevos**: Verificar que se crea el `Producto` y el `ProductoProveedor` automáticamente y se añade al stock.
6. **E2E-REC-06-CRE-ERR**: Error 400 por body vacío o sin productos.
7. **E2E-REC-07-CRE-ERR**: Error 404 si el `pedidoProductoId` no corresponde a los pedidos seleccionados.
8. **E2E-REC-08-CRE-STK**: Verificación de **Actualización de Stock**: Tras la recepción, el `Inventario` debe aumentar el stock en la cantidad exacta recibida.
9. **E2E-REC-09-CRE-TRX**: Verificación de **Rollback**: Si falla la creación de un lote de inventario, no se debe guardar la cabecera de la recepción.

### B. Recepción Masiva (Lógica Especial en RecepcionStockService)

10. **E2E-REC-10-MAS**: Ejecución de `procesarRecepcionMasiva` con un lote de productos.
11. **E2E-REC-11-MAS-INC**: Verificación de **Auto-Incidencia**: Detectar discrepancias en bloque y generar la `Incidencia` con el detalle de todos los productos afectados.
12. **E2E-REC-12-MAS-UBI**: Verificar que si no existe "Almacén Principal", el sistema lo crea automáticamente como ubicación por defecto.
13. **E2E-REC-13-MAS-BAT**: Verificación de procesamiento en batch para `RecepcionProducto` y `Inventario`.

### C. Gestión de Estados e Incidencias

14. **E2E-REC-14-INC-TYP**: Validar tipos de incidencia automáticos: `NO_ENTREGADO`, `FALTA`, `EXCESO`, `DEFECTUOSO`.
15. **E2E-REC-15-INC-VIS**: Verificar que productos con `EstadoVisualProducto !== OPTIMO` generan automáticamente una incidencia tipo `DEFECTUOSO`.
16. **E2E-REC-16-EST-PED**: Verificar la transición automática del Pedido:
    - Todas las líneas completas -> Pedido `RECIBIDO`.
    - Algunas líneas incompletas -> Pedido `PARCIAL`.
    - Discrepancias -> Pedido `CON_INCIDENCIAS` (si aplica).

### D. Consulta y Mantenimiento

17. **E2E-REC-17-GET**: Listado paginado con carga de relaciones (`usuario`, `recepcionesPedidos`).
18. **E2E-REC-18-GET-DET**: Obtener detalle de recepción con nombres de productos y lotes de inventario vinculados.
19. **E2E-REC-19-UPD**: Actualizar observaciones generales o el número de albarán vinculado.
20. **E2E-REC-20-DEL-STK**: Verificación de **Reversado de Stock**: Al eliminar una recepción, el sistema debe restar del inventario las cantidades recibidas originales.
21. **E2E-REC-21-DEL-ERR**: Error 400 al intentar eliminar una recepción que tiene relaciones activas (verificando `softDelete` y lógica de protección).

### E. Integración con Albaranes

22. **E2E-REC-22-ALB**: Vincular número de albarán y verificar que se genera el registro en `albaran_pedido_recepcion`.
23. **E2E-REC-23-ALB-DUP**: Intentar vincular un albarán ya existente a una nueva recepción (reutilización de entidad albarán).

### F. Seguridad (RBAC)

24. **E2E-REC-24-SEC**: Error 401 si no hay token.
25. **E2E-REC-25-SEC-ROL**: Validar que solo `ADMINISTRADOR` o `PROFESOR` pueden ejecutar el procesamiento de stock.
26. **E2E-REC-26-SEC-DEL**: Validar que solo `ADMINISTRADOR` puede ejecutar el borrado (DELETE) de una recepción.

---

## 2. Puntos Críticos de Lógica de Negocio

- **Ubicación Automática**: El sistema garantiza una ubicación por defecto ("Almacén Principal") para el stock recibido.
- **Trazabilidad de Movimientos**: Cada recepción debe generar N registros en la tabla de `movimientos` (uno por cada lote de stock creado).
- **Consistencia de Precios**: (Si aplica) La recepción debería registrar el precio de entrada para el cálculo del valor del inventario.
- **Detección de Mermas**: El sistema diferencia entre cantidad para stock y cantidad reportada como defectuosa/dañada mediante el estado visual.

---

## 3. Stress y Edge Cases

- **Recepción de +100 líneas**: Validar estabilidad de la transacción larga.
- **UUIDs Inválidos**: Intentar vincular pedidos borrados o inexistentes.
- **Colisión de EAN**: Crear producto nuevo con código de barras duplicado para verificar manejo de excepciones de BD.
- **Caducidad Próxima**: Recibir productos con fechas de caducidad en el pasado (Verificar validación).
