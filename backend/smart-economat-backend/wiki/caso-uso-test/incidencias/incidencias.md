# Plan de Pruebas: Módulo de Incidencias

Este documento detalla los escenarios de prueba para el módulo de Incidencias, encargado de gestionar las discrepancias detectadas durante la recepción de mercancía y su posterior resolución técnica.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Reporte Automático y Manual

1. **E2E-INC-01-AUTO**: Verificar que una recepción con discrepancias genera automáticamente una cabecera de `Incidencia` vinculada.
2. **E2E-INC-02-MAN**: Crear una incidencia manual vinculada a una recepción existente (POST /api/v1/incidencia).
3. **E2E-INC-03-ERR**: Error 404 al intentar reportar una incidencia para una recepción inexistente.
4. **E2E-INC-04-VAL**: Verificar que el campo `observacionesRecepcion` almacena correctamente el detalle del problema.

### B. Listado y Consulta (GET /api/v1/incidencia)

5. **E2E-INC-05-GET**: Listado completo de incidencias pendientes con carga de relaciones (`recepcion`, `pedido`).
6. **E2E-INC-06-GET-ID**: Obtener el detalle de una incidencia específica con sus líneas de productos afectados.
7. **E2E-INC-07-GET-RES**: Listado de incidencias ya resueltas (Historial de resolución).

### C. Edición y Mantenimiento

8. **E2E-INC-08-UPD**: Actualizar observaciones de una incidencia pendiente.
9. **E2E-INC-09-UPD-ERR**: Error 400 al intentar editar una incidencia que ya está marcada como `RESUELTA`.
10. **E2E-INC-10-DEL**: Eliminar una incidencia pendiente (Verificar que se limpia la marca de incidencia en la `Recepcion` vinculada).
11. **E2E-INC-11-DEL-ERR**: Error 400 al intentar borrar una incidencia ya resuelta por auditoría.

### D. Flujo de Resolución (POST /api/v1/incidencia/resolver)

12. **E2E-INC-12-RES-BAS**: Resolución básica agregando observaciones de cierre.
13. **E2E-INC-13-RES-TRX**: Resolución transaccional con acción de `DEVOLUCION`.
14. **E2E-INC-14-RES-MOV**: Verificar que si la resolución es `DEVOLUCION`, se genera un movimiento de `SALIDA_AJUSTE` en el inventario.
15. **E2E-INC-15-RES-AUD**: Verificar que se crea un registro en `IncidenciaResuelta` con el `usuarioResolutorId` y la fecha actual.
16. **E2E-INC-16-RES-ERR**: Error 400 al intentar resolver una incidencia que ya tiene una resolución previa.

### E. Seguridad y RBAC

17. **E2E-INC-17-SEC-401**: Error 401 si no hay token.
18. **E2E-INC-18-SEC-ROL**: Validar que solo Perfiles de Almacén o Administración pueden gestionar incidencias.
19. **E2E-INC-19-SEC-RES**: Solo el `ADMINISTRADOR` o `PROFESOR` pueden ejecutar el endpoint de resolución transaccional.

---

## 2. Reglas de Negocio Críticas

- **Inmutabilidad Post-Resolución**: Una incidencia resuelta es sagrada por auditoría. No puede ser borrada ni modificada.
- **Vínculo Transaccional**: Si la resolución implica cambio físico (devolución), el stock debe ajustarse en la misma transacción que el cierre de la incidencia.
- **Trazabilidad de la Recepción**: Una recepción marcada con incidencia no debería poder ser eliminada sin antes gestionar dicha incidencia.

---

## 3. Stress y Edge Cases

- **Incidencias Masivas**: Recepción con 50 productos todos con incidencia de distinto tipo.
- **Resolución sin Observaciones**: Validar que el campo motivo es obligatorio según la política de calidad.
- **Colisión de Datos**: Borrar la recepción mientras se está resolviendo la incidencia (Manejo de estados y FK).
