# Plan de Pruebas: Módulo de Recetas y Producción

Este documento detalla los escenarios de prueba para el ciclo de vida de las recetas, desde el diseño y cálculo de costes (escandallo) hasta la ejecución de producción con descuento automático de inventario.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Gestión de Recetas (CRUD /api/v1/recetas)

1. **E2E-REC-01-CRE**: Creación existosa de una receta con sus ingredientes y unidades.
2. **E2E-REC-02-DUP**: Duplicar una receta existente con un nuevo nombre (Verificar copia de ingredientes).
3. **E2E-REC-03-UPD**: Actualizar ingredientes (añadir, quitar, cambiar cantidades) y verificar persistencia.
4. **E2E-REC-04-DEL**: Eliminar una receta.

### B. Análisis de Costes y Detalle (Escandallo)

5. **E2E-REC-05-COST**: Calcular el escandallo de una receta (`GET /costes`). Verificar que el `precioUnitario` se calcula promediando los precios de todos los proveedores del producto.
6. **E2E-REC-06-COST-HIST**: Verificar que si un producto no tiene precio actual, el escandallo usa el último precio registrado en el historial.
7. **E2E-REC-07-DET-STK**: Consultar detalle de receta (`GET /detalle`). Verificar que muestra el `stockActual` consolidado de todos los lotes de inventario y calcula la `cantidadFaltante`.
8. **E2E-REC-08-ALE**: Verificar que el detalle de receta consolida correctamente la lista de alérgenos de todos sus productos.

### C. Proceso de Cocinado y Producción (POST /cocinar)

9. **E2E-REC-09-COOK-OK**: Ejecutar el "cocinado" de una receta. Verificar que se descuenta el stock del inventario siguiendo el criterio **FIFO** (vence antes primero).
10. **E2E-REC-10-COOK-STK-ERR**: Error 400 al intentar cocinar una receta si no hay suficiente stock consolidado para uno de los ingredientes.
11. **E2E-REC-11-COOK-MOV**: Verificar que el cocinado genera registros de **Movimiento** de tipo `SALIDA_ELABORACION` para cada lote de inventario afectado.
12. **E2E-REC-12-COOK-MULT**: Cocinar múltiples unidades de una misma receta (ej: 10 raciones). Verificar descuento proporcional.
13. **E2E-REC-13-COOK-TRX**: Verificación de **Atomicidad**: Si falla el descuento del cuarto ingrediente, los tres primeros no deben ser descontados (Rollback).

### D. Seguridad y RBAC

14. **E2E-REC-14-SEC-401**: Error 401 si no hay token.
15. **E2E-REC-15-SEC-ROL**: Solo `PROFESOR` o `ADMINISTRADOR` pueden ejecutar la acción de `cocinar`. Alumnos pueden tener acceso de "solo lectura" a las recetas.

---

## 2. Reglas de Negocio Críticas

- **Lógica FIFO Inventario**: El sistema siempre debe prioridad a descontar de los lotes de inventario que tengan la fecha de caducidad más próxima (o entrada más antigua si no hay caducidad).
- **Cálculo de Escandallo**: Es una estimación económica. Si un producto no tiene precio en ningún proveedor ni historial, su coste aporta 0 pero no debe bloquear el cálculo.
- **Rendimiento**: El coste unitario de la receta se calcula dividiendo el coste total de ingredientes entre el `rendimiento` (número de unidades resultantes).

---

## 3. Stress y Edge Cases

- **Ingrediente Duplicado**: Receta que usa el mismo producto dos veces (ej: para dos pasos distintos). Validar descuento consolidado.
- **Stock Justo**: Cocinar una receta que consume exactamente todo el stock existente de un lote (debe quedar a 0 y no eliminarse).
- **Recalculo Masivo**: Forzar el recálculo de costes de todo el recetario tras una subida de precios de proveedor.
- **Recetas sin Ingredientes**: Validar que el sistema maneja correctamente recetas que aún no han sido configuradas (evitar divisiones por cero).
