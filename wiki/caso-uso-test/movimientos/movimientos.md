# Plan de Pruebas: Módulo de Movimientos

Este documento detalla los escenarios de prueba para el módulo de Movimientos, que actúa como el registro de auditoría (Audit Trail) de toda la actividad de inventario en el sistema.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Registro Automático (Integración)

1. **E2E-MOV-01-AUTO**: Verificar que la creación de un Pedido genera un movimiento de log.
2. **E2E-MOV-02-AUTO**: Verificar que una Recepción genera tantos movimientos como lotes de stock creados.
3. **E2E-MOV-03-AUTO**: Verificar que un ajuste manual de Inventario genera un movimiento con la diferencia exacta.
4. **E2E-MOV-04-AUTO**: Verificar que la eliminación de un lote de stock genera un movimiento de `SALIDA`.

### B. Creación Manual (POST /api/v1/movimientos)

5. **E2E-MOV-05-CRE**: Crear un movimiento manual (tipo `AJUSTE`, `MERMA`, etc.) vinculado a un item de inventario.
6. **E2E-MOV-06-CRE-ERR**: Error 400 si falta el campo `tipo` o `cantidad`.
7. **E2E-MOV-07-CRE-VAL**: Verificar que el `userId` se asigna automáticamente al creador del movimiento.

### C. Consulta e Historial (GET /api/v1/movimientos)

8. **E2E-MOV-08-GET**: Listado paginado de todos los movimientos del sistema.
9. **E2E-MOV-09-GET-FILT**: Filtrar por `tipo` (ENTRADA, SALIDA, AJUSTE).
10. **E2E-MOV-10-GET-HIST-PROD**: Consultar `GET /api/v1/movimientos/historial` enviando `entityId` y verificar que solo devuelve movimientos de ese producto.
11. **E2E-MOV-11-GET-HIST-USR**: Consultar historial enviando `userId` para ver la actividad de un operario específico.
12. **E2E-MOV-12-GET-HIST-DATE**: Consultar historial con rango `startDate` y `endDate`.
13. **E2E-MOV-13-GET-HIST-ERR**: Error 400 si se intenta consultar historial sin `entityId` ni `userId`.

### D. Seguridad y RBAC

14. **E2E-MOV-14-SEC-401**: Error 401 sin token.
15. **E2E-MOV-15-SEC-ROL**: Verificar que los alumnos tienen acceso de "solo lectura" a sus propios movimientos (si aplica) o directamente 403.
16. **E2E-MOV-16-SEC-ADMIN**: El administrador tiene acceso a todos los filtros de historial.

---

## 2. Reglas de Negocio Críticas

- **Inmutabilidad**: Los movimientos son registros históricos. Una vez creados, no deberían ser editados ni eliminados (salvo por el administrador en casos de error administrativo extremo, aunque lo ideal es realizar un movimiento de compensación).
- **Consistencia Temporal**: No se permiten movimientos con fecha futura ni historial donde `startDate > endDate`.
- **Vínculo con Inventario**: Todo movimiento técnico (ajuste/merma) debe reflejar quién lo hizo y sobre qué lote de inventario.

---

## 3. Stress y Edge Cases

- **Volumen de Historial**: Consultar historial de un producto con +1000 movimientos.
- **Fechas Extremas**: Rango de fechas de hace 5 años o fechas exactas (mismo día).
- **Búsqueda Global**: Realizar búsquedas sin filtros en una tabla con millones de registros (validar rendimiento de paginación).
