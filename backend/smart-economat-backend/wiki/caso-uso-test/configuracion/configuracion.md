# Plan de Pruebas: Módulo de Configuración (Ubicaciones y Albaranes)

Este documento detalla los escenarios de prueba para los maestros de configuración, incluyendo la gestión de ubicaciones físicas del almacén y la trazabilidad de albaranes de entrega.

---

## 1. Ubicaciones (CRUD /api/v1/ubicaciones)

### A. Gestión de Espacios

1. **E2E-UBI-01-CRE**: Crear una nueva ubicación (ej: "Estantería A-1").
2. **E2E-UBI-02-CRE-ERR**: Error 400 por nombre de ubicación duplicado.
3. **E2E-UBI-03-GET**: Listado de todas las ubicaciones ordenadas alfabéticamente.
4. **E2E-UBI-04-UPD**: Cambiar el nombre de una ubicación existente.
5. **E2E-UBI-05-DEL**: Eliminación lógica (`softDelete`) de una ubicación.
6. **E2E-UBI-06-RES**: Restaurar una ubicación previamente eliminada.

### B. Integración con Inventario

7. **E2E-UBI-07-DEL-RESTRICT**: (Opcional) Impedir eliminación si hay items de inventario vinculados a esa ubicación.

---

## 2. Albaranes (CRUD /api/v1/albaranes)

### C. Trazabilidad de Documentos

8. **E2E-ALB-08-CRE**: Crear un albarán vinculado a un proveedor.
9. **E2E-ALB-09-LST**: Listado de albaranes con filtros por fecha y proveedor.
10. **E2E-ALB-10-GET-ID**: Obtener el detalle de un albarán y ver sus recepciones vinculadas.
11. **E2E-ALB-11-UPD**: Actualizar el número de documento o fecha del albarán.
12. **E2E-ALB-12-DEL**: Eliminar un albarán (Verificar que se desvincula de las recepciones pero no borra la recepción en sí).

---

## 3. Seguridad y RBAC

13. **E2E-CFG-13-SEC-ROL**: Validar que solo perfiles de Administración pueden crear o borrar ubicaciones.
14. **E2E-CFG-14-SEC-ALB**: Profesores pueden crear albaranes durante el proceso de recepción.

---

## 4. Reglas de Negocio Críticas

- **Ubicación por Defecto**: El sistema debe garantizar que siempre existe al menos una ubicación válida ("Almacén Principal").
- **Vinculación de Albarán**: Un albarán debe pertenecer a un único proveedor, pero puede estar asociado a múltiples recepciones parciales de un mismo pedido.
- **Limpieza de Datos**: El borrado de configuración es "soft" para no romper el historial de inventario.

---

## 5. Stress y Edge Cases

- **Jerarquía de Ubicaciones**: (Si aplica) Validar sub-ubicaciones.
- **Nombres con Símbolos**: Ubicaciones con nombres tipo "Pasillo #1 / Fila 2".
- **Albaranes Duplicados**: Intentar subir el mismo número de albarán para el mismo proveedor (Validación de duplicados opcional según política).
  stone
