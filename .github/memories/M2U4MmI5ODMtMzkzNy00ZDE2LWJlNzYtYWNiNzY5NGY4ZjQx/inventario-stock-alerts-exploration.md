# Exploración: Tests de Inventario (Stock Bajo, Iconos, Alertas)

**Fecha:** 2 de abril 2026 | **Modo:** Quick Read-Only Exploration

## 📋 ARCHIVOS DE TEST RELEVANTES

### Backend (4 spec files + 1 e2e)

**Stock Bajo & Alertas:**
- [inventario.service.spec.ts](backend/smart-economat-backend/test/modules/inventario/inventario.service.spec.ts#L150-L190)
  - ✅ `obtenerAlertasCaducidad()` - mapea fechas serializadas
  - ✅ `obtenerAlertasStock()` - mapea cantidad actual/mínima + metadatos (producto, unidad, proveedor, ubicación)
  - ✅ `ajustarManual()` - transacciones de stock

- [inventario.e2e-spec.ts](backend/smart-economat-backend/test/e2e/inventario.e2e-spec.ts#L389-L405)
  - ✅ GET `/api/v1/alertas/caducidad` - status 200
  - ✅ GET `/api/v1/alertas/stock` - status 200
  - ⚠️ Solo valida status, NO contenido de alertas (huecos de cobertura)

- [dashboard.service.spec.ts](backend/smart-economat-backend/test/modules/dashboard/dashboard.service.spec.ts)
  - ✅ Calcula `itemsBajoStock` count en `getStats()`
  - ✅ QueryBuilder para bajo stock con `lowStockQb.where().getCount()`

- [inventario.controller.spec.ts](backend/smart-economat-backend/test/modules/inventario/inventario.controller.spec.ts)
  - ✅ Valida `ajustarManual()` delega al servicio
  - ⚠️ No prueba endpoints de alertas

- [recepcion-stock.service.spec.ts](backend/smart-economat-backend/test/modules/recepcion/recepcion-stock.service.spec.ts)
  - ✅ Tests para manejo de stock en recepciones masivas
  - ✅ Validación de pesos y discrepancias

### Frontend (❌ CERO tests)

- NO hay `.spec.ts` en frontend
- [inventario.types.ts](frontend/smart-economat-frontend/src/services/inventario.types.ts#L1-L50)
  - ✅ `AlertaStock` interface definida
  - ✅ `fetchAlertasStock()` en inventario.service.ts
- [notifications.service.ts](frontend/smart-economat-frontend/src/services/notifications.service.ts)
  - ✅ `getInventoryNotifications()` - calcula expiración
  - ⚠️ **CONSUMO INEFICIENTE**: USA `fetchInventario()` en lugar de `fetchAlertasStock()`

---

## 🔍 ESTADO DE COBERTURA

### Cobertura ACTUAL

| Aspecto | Backend | Frontend | Nota |
|---------|---------|----------|------|
| **Bajo stock (lógica)** | ✅ 80% | ❌ 0% | Service layer cubierta, UI sin tests |
| **Iconos/Chips visuales** | ❌ N/A | ❌ 0% | No hay tests de componentes |
| **Alertas endpoints** | ✅ 50% | ❌ 0% | E2E solo valida status, no datos |
| **Notificaciones** | ⚠️ 30% | ✅ 70% | Frontend expira por edad, no API-driven |
| **Dashboard widget** | ✅ 60% | ❌ 0% | Count sí, detalles no |

### Gaps Críticos Identificados

#### 1️⃣ **Backend: Alertas incompletas**
- [findCaducidadProxima()](backend/smart-economat-backend/src/modules/inventario/repository/inventario.repository.ts#L39-L47)
  - ⚠️ NO carga relaciones (`producto`, `ubicacion`)
  - ⚠️ Solo retorna `id` + `fechaCaducidad` (incompleto vs AlertaCaducidadDTO esperado)
  - **Impacto:** Frontend no puede mostrar detalles del producto

#### 2️⃣ **Frontend: Consumo redundante**
- [notifications.service.ts](frontend/smart-economat-frontend/src/services/notifications.service.ts#L90-L130)
  - ⚠️ `getInventoryNotifications()` llama `fetchInventario()` (TODOS los items)
  - Debería usar `fetchAlertasStock()` (solo bajo stock)
  - **Impacto:** Performance innecesaria, lógica duplicada

#### 3️⃣ **Sin UI tests para:**
- Iconos de "⚠️ Bajo Stock" en tabla de inventario
- Chips de color rojo/amarillo por estado de stock
- Notificaciones toast al crear/actualizar inventario
- Badges de count en dashboard

#### 4️⃣ **E2E: Validación superficial**
- Solo valida `status: 200`, no estructura de datos
- No prueba:
  - `cantidadActual < cantidadMinima`
  - `nombreProducto`, `unidad`, `proveedor`
  - Órden de alertas (más críticas primero)

---

## 🎯 RUTAS DE API IDENTIFICADAS

```
GET /api/v1/alertas/caducidad   → AlertaCaducidadDTO[]
  {
    id: UUID,
    fechaCaducidad: ISO8601,
    nombreProducto?: string (MISSING from findCaducidadProxima)
  }

GET /api/v1/alertas/stock       → AlertaStockDTO[]
  {
    id: UUID,
    cantidadActual: number,
    cantidadMinima: number,
    nombreProducto: string,
    unidad?: string,
    proveedorNombre?: string,
    ubicacionNombre?: string
  }
```

---

## 📊 RESUMEN EJECUTIVO

### Tests Backend ✅ / 🟡
- Service layer: 80% (obtenerAlertas bien, ajustes cubiertos)
- Controller: 20% (solo ajustarManual, no alertas)
- E2E: 50% (endpoints respond pero no valida datos)
- Query layer: ⚠️ INCOMPLETA (findCaducidad sin joins)

### Tests Frontend ❌ 0%
- Service: Contratos definidos pero sin tests
- Components: Sin suite de tests
- Integration: Sin e2e de alertas UI

## 🚀 RECOMENDACIONES PARA VALIDAR FIX

1. **Backend E2E ampliado:**
   - Crear inventario con `cantidadActual < cantidadMinima`
   - GET `/alertas/stock` → validar estructura completa
   - Verificar relaciones cargadas

2. **Frontend tests (new):**
   - Test `fetchAlertasStock()` consumed
   - Test icon render when `cantidadActual < cantidadMinima`
   - Test notifications.service uses API endpoint (not raw inventory)

3. **Integration test:**
   - Create low-stock item → Check dashboard count increments
   - Check notification badges match alert count

4. **Repository fix:**
   - [Cargar relaciones en findCaducidadProxima()](backend/smart-economat-backend/src/modules/inventario/repository/inventario.repository.ts#L39)
