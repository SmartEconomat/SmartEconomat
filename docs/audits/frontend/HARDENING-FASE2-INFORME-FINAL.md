# Informe final — Hardening Fase 2 (Frontend)

**Proyecto:** SmartEconomat (SPA React + Vite, no Next.js)  
**Fecha:** 14 de mayo de 2026  
**Ámbito:** Correcciones dirigidas por auditorías en `docs/audits/frontend/` + cobertura de tests.

---

## Resumen ejecutivo

Se aplicaron los **hallazgos críticos** documentados en la auditoría global (`AUDITORIA-GLOBAL-FRONTEND.md`) y en los informes por módulo, con **tests unitarios / de componente** que reproducen el comportamiento esperado y previenen regresiones. La suite **Vitest** queda en **316 tests pasando** (tras alinear mocks con la nueva forma paginada del inventario y con `fetchAllInventarioForExport` en notificaciones). El **build de producción** (`tsc -b && vite build`) **compila correctamente**.

### Alcance honesto respecto al prompt original

- **No** se han cerrado los ~161 hallazgos de auditoría ni los listados “por dominio backend” del orden propuesto (admin, albaran, alumno, …): ese backlog supera el alcance de una única iteración y parte depende del backend.
- **Sí** se cerraron los **bloqueadores críticos** identificados en la auditoría global y se **validaron con tests** donde aplicaba.
- **E2E Playwright** (`npm run test:e2e`): no se ha ejecutado en esta sesión automatizada completa (requiere servidor y tiempo); el proyecto ya incluye specs en `test/e2e/` — recomendación: ejecutar `npm run qa:gate` en CI o local antes de producción.
- **Tests visuales**: ya existen snapshots Playwright en rutas concretas (p. ej. inventario, productos); no se amplió cobertura visual a todos los flujos.

---

## Bugs eliminados (críticos / alta prioridad)

| Tema | Cambio principal | Evidencia de tests |
|------|------------------|---------------------|
| Contraseña `Temp1234!` en bundle | Eliminada; creación sin password no envía campo (backend genera provisional) | `test/services/usuarioService.test.ts` |
| `Math.random()` en reset password | Sustituido por `crypto.getRandomValues()` + barajado Fisher-Yates | `usuarioService.test.ts` |
| Logout sin limpiar usuario | `setUser(null)` + `resetPermissions()` inmediatos; servidor best-effort | `test/store/AuthContext.test.tsx` |
| RBAC pedidos (`canCancel = canEdit`) | `buildPedidoPermissions` con 5 flags independientes + permisos en página | `test/features/pedidos/utils/pedidoPermissions.test.ts`, callers actualizados |
| `usePermission(undefined)` fail-open | Devuelve `false` si permiso ausente/vacío | `test/hooks/usePermission.test.ts` |
| Estados incidencias (casing) | Normalización `toUpperCase()` + casos alineados con backend | `test/services/incidencia.service.test.ts` |
| `proveedorId` como nombre | Uso de `proveedor.id` (+ fallback documentado) | Tests en `incidencia.service.test.ts` |
| `window.prompt` cancelación distribución | Tratar `null` como cancelación explícita (no ejecutar API) | Cubierto en cambio de `Distribucion.tsx` + revisión manual |
| `RecipeCarousel` datos ficticios | Props `items` opcional; vacío sin datos demo | `test/components/ui/RecipeCarousel.test.tsx` |
| Borrador pedido optimista roto | Rollback en `discardDraft` + `saveError` en autosave | `test/hooks/usePedidoDraft.test.ts` |
| `mermaAplicada` en selector recetas | Campo editable en UI | `test/components/ui/RecetaIngredientesSelector.test.tsx` |
| i18n `{count}` vs `{{count}}` | Paridad / interpolaciones | `test/i18n/i18nParity.test.ts` |
| Inventario: descarga masiva en cliente | `fetchInventario` una petición paginada; export masivo aislado en `fetchAllInventarioForExport` | `test/services/inventario.pagination.test.ts`, `inventario.service.test.ts` |

---

## Regresiones corregidas en esta sesión

1. **`test/pages/Inventario.test.tsx`**: el mock de `fetchInventario` devolvía `[]` en lugar de `PaginatedData`; rompía `paginated.data` → estado inconsistente. **Fix:** mock `{ data: [], total, page, limit, totalPages }`.
2. **`Inventario.tsx`**: coacción defensiva `Array.isArray(paginated.data) ? paginated.data : []`.
3. **`merge-ubicaciones-filtro.ts`**: `inferidasPorLotesFirma` tolera entrada no iterable + test de regresión.
4. **`test/services/notifications.service.test.ts`**: el servicio usa **`fetchAllInventarioForExport`**, no `fetchInventario`; mocks actualizados.

---

## Tests añadidos o extendidos (no exhaustivo)

- Seguridad usuario / logout: `usuarioService.test.ts`, `AuthContext.test.tsx`
- RBAC pedidos / permisos: `pedidoPermissions.test.ts`, `usePermission.test.ts`
- Incidencias / carousel / draft / recetas / i18n / inventario: archivos citados arriba
- Paginación inventario y notificaciones: `inventario.pagination.test.ts`, `notifications.service.test.ts`

**Total Vitest (última ejecución completa):** 316 tests, 68 ficheros, 0 fallos.

---

## Build y calidad

| Comando | Resultado |
|---------|-----------|
| `npm run test -- --run` | OK |
| `npm run build` | OK (`tsc -b` + `vite build`) |

---

## Riesgos remanentes (auditoría no cerrada al 100 %)

- Hallazgos **Altos / Medios** de cada `.md` en `docs/audits/frontend/` (export PDF proveedor, N+1 recepción, filtros albaranes solo cliente, `Promise.all` sin concurrencia en pedidos, duplicación `ApiResponse`, modales sin focus trap, etc.).
- **Aprobación de pedidos:** si el backend no expone `pedidos:aprobar`, el frontend puede seguir usando un permiso existente como puente — revisar contrato RBAC real en NestJS.
- **Playwright E2E** y cobertura visual global no ejecutados aquí.

---

## Nivel de producción (1–10)

**7/10** para el frontend tras esta fase: críticos de seguridad y datos más graves están mitigados y cubiertos por tests unitarios; falta cerrar el backlog alto/medio y validar E2E en CI.

---

## Recomendaciones críticas finales

1. Ejecutar **`npm run qa:gate`** (build + lint + vitest + playwright) en pipeline estable.
2. Priorizar hallazgos **Altos** del informe global en el siguiente sprint (sin “refactors gratuitos”).
3. Alinear permiso **`pedido:aprobar`** en backend y frontend si el negocio lo exige.
4. Mantener **fuente de verdad** en DTOs backend; cualquier nuevo campo (p. ej. password provisional devuelta una vez) debe documentarse en OpenAPI/Swagger.

---

## Referencias

- Auditoría consolidada: [AUDITORIA-GLOBAL-FRONTEND.md](./AUDITORIA-GLOBAL-FRONTEND.md)
- Informes por área: `auditoria-*.md` en esta carpeta.
