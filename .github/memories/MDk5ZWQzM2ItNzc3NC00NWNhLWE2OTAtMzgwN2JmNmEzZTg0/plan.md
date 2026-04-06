## Plan: Alinear contratos HTTP frontend

Corregir los 400 originados por desalineación de contratos entre frontend y backend sin tocar el backend. La estrategia recomendada es: usar el backend como fuente de verdad, endurecer la capa compartida de API del frontend, y luego barrer por dominios todos los servicios exportados y los builders de payload/query que hoy están repartidos entre servicios, páginas y modales. Alcance acordado: toda la capa frontend (UI actual + todas las funciones exportadas en `src/services`), validación contra entorno local del repo y mantenimiento de la arquitectura actual sin migrar a react-query.

**Steps**
1. Fase 1 — Matriz de contratos y focos de riesgo. Inventariar las 90 funciones exportadas de `frontend/smart-economat-frontend/src/services` y todos los payload builders fuera de servicios. Para cada request: método, ruta, params, query, headers, shape de body, respuesta esperada y DTO/controlador backend asociado. Marcar como críticos los casos ya detectados: `PaginationQueryDto` con `limit <= 50`, `whitelist + forbidNonWhitelisted`, ids UUID, enums, fechas ISO, y fields legacy como `pedidoProductos`, `tiempoPreparacion` o metadatos de entidad.
2. Fase 2 — Endurecer cliente API compartido. Depende de 1. Consolidar en `api.service.ts` y `api.utils.ts` las reglas que hoy están dispersas: validación de ids/path/query/body, normalización de query params, clamping de `page/limit`, serialización consistente de fechas, headers y parseo uniforme de errores con `parseApiResponse`. Mantener `openfoodfacts.service.ts` como excepción externa y evitar llamadas internas fuera de `baseFetch`.
3. Fase 3 — Barrido de catálogo, proveedores, inventario y movimientos. Depende de 2. Corregir `producto.service.ts`, `proveedor.service.ts`, `productoProveedor.service.ts`, `inventario.service.ts`, `movimiento.service.ts`, `merma.service.ts`, `ubicacion.service.ts`, `albaran.service.ts` y sus formularios asociados para que envíen solo DTOs válidos: limpiar payloads, tipar request/response, respetar límites de paginación, normalizar enums, números y fechas, y eliminar campos generados por UI o BaseEntity.
4. Fase 4 — Barrido de pedidos y lotes de compra. Depende de 2. Corregir `pedido.service.ts`, `pedidoDraft.service.ts`, `features/pedidos/utils/pedidoPayloads.ts` y `pages/Pedidos.tsx` para que toda la UI siga usando `pedidoProductos` solo como shape interno, pero envíe siempre `lineas` al backend. Unificar normalización de cantidades, proveedor por línea, cancelaciones, consolidaciones y PDFs sin duplicar lógica entre pedido individual, `pedido_usuario` y `purchase_batch`.
5. Fase 5 — Barrido de recepciones e incidencias. Depende de 2. Corregir `recepcion.service.ts`, `recepcion.types.ts`, `features/recepcion/utils/recepcionMapping.utils.ts`, `pages/Recepcion.tsx` y `incidencia.service.ts` para separar claramente shape interno del wizard y shape wire del backend. El envío debe construir `CreateRecepcionDto` válido, evitar campos legacy en `productosNuevos`, serializar fechas en formato aceptado, validar cantidades y observaciones antes de la request, y mapear solo los campos permitidos por los DTOs.
6. Fase 6 — Barrido de recetas, producción, auth, usuarios y educativo. Depende de 2. Corregir `receta.service.ts`, `receta.types.ts`, `features/recetas/RecetaFormModal.tsx`, `produccion.service.ts`, `auth.service.ts`, `usuarioService.ts` y `profesor.service.ts`. Prioridades: bajar límites fuera de contrato como `fetchRecetas(limit=100)`, impedir que `tiempoPreparacion` o cualquier campo UI viaje al backend, limpiar payloads de usuarios con whitelist estricta, y mantener consistencia entre rutas `/auth`, `/usuarios`, `/admin` y `/profesores`.
7. Fase 7 — Unificación de builders y validación previa en formularios. Depende de 3, 4, 5 y 6. Extraer builders de payload desde páginas/modales a helpers tipados junto a la capa de servicios, dejando en los componentes solo estado y validación visual. Reutilizar la validación previa para evitar requests inválidas por ids vacíos, números no finitos, enums no normalizados, fechas mal serializadas, arrays vacíos obligatorios y campos extra no admitidos por DTO.
8. Fase 8 — Ajuste de hooks propios y cachés locales. Depende de 2, 3, 4, 5 y 6. Como no existe react-query en este proyecto, corregir la capa equivalente: hooks propios, drafts y cachés manuales. Asegurar que `useRecepcionDraft`, `usePedidoDraft`, caché corta de productos y mutaciones disparadas desde páginas consumen solo los nuevos helpers tipados y no reconstruyen payloads por su cuenta.
9. Fase 9 — Verificación exhaustiva. Depende de 2 a 8. Ejecutar `npm run lint`, `npm run build` y `npm test -- --run` en frontend; si la validación global queda bloqueada por el fallo conocido de import en `test/store/AuthContext.test.tsx`, corregir ese test solo como habilitador de verificación. Después ejecutar la suite de contratos existente del backend `npm run test:e2e:file -- test/e2e/frontend-integration-contracts.e2e-spec.ts` sin tocar backend, y completar con smoke manual de flujos de alta criticidad: login/perfil, productos, proveedores, pedidos, lotes, recepción, incidencias, inventario, recetas, producción, usuarios y profesor/admin.
10. Criterio de cierre. Depende de 9. Considerar resuelto cuando no queden 400 provocados por desalineación de contrato en ninguna llamada del frontend auditada, todas las requests salgan por la capa centralizada, los formularios bloqueen datos inválidos antes del envío y la verificación automatizada/local no muestre regresiones.

**Relevant files**
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/api.service.ts` — cliente HTTP central, `baseFetch`, `parseApiResponse`, `unwrapList`, uploads y errores.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/api.utils.ts` — limpieza de payloads y futura normalización compartida.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/producto.service.ts` — paginación protegida, `buildProductosQueryString`, payloads de producto.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/productos/ProductoFormModal.tsx` — `buildProductoPayload` hoy vive en UI y debe reutilizar reglas de contrato.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/proveedor.service.ts` — consultas y mutaciones de proveedor, límites y ordenación.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/pedido.service.ts` — núcleo de pedidos, `pedido_usuario` y `purchase_batch`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/utils/pedidoPayloads.ts` — conversión desde shape UI `pedidoProductos` a shape backend `lineas`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Pedidos.tsx` — formularios, drafts y mutaciones donde aún se mezclan shapes UI/backend.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/recepcion.service.ts` — endpoints de recepción y reportes.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/recepcion.types.ts` — shape wire y shape interno del wizard hoy demasiado acoplados.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/recepcion/utils/recepcionMapping.utils.ts` — mapeo de pedidos/lotes a draft de recepción.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Recepcion.tsx` — payload inline de `createRecepcion`, validación y serialización de fechas/estados.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/inventario.service.ts` — creación/edición de inventario, fechas ISO y números.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/incidencia.service.ts` — filtros query y `resolveIncidencia`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/receta.service.ts` — límite inválido actual y mutaciones que deben recibir payload limpio.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/receta.types.ts` — tipos UI con campos no wire como `tiempoPreparacion`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/recetas/RecetaFormModal.tsx` — builder y normalización de receta.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/produccion.service.ts` — requests de producción/validación/consumo.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/auth.service.ts` — auth, perfil y cambio de contraseña.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/usuarioService.ts` — mapeos manuales frontend-backend y whitelist estricta.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/profesor.service.ts` — endpoints educativos/admin a incluir en el barrido total.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/main.ts` — validación global `whitelist`, `forbidNonWhitelisted`, `transform`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/pagination-query.dto.ts` — límites y nombres de query params comunes.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/producto/dto/create-producto.dto.ts` — referencia de contrato de producto.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/proveedor/dto/create-proveedor.dto.ts` — referencia de contrato de proveedor.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/dto/create-purchase-batch.dto.ts` — referencia de `lineas`, consolidación y cancelación.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/dto/create-pedido-line.dto.ts` — validación exacta de líneas y cantidades.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/recepcion/dto/create-recepcion.dto.ts` — shape permitido de recepción y `productosNuevos`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/incidencia/dto/incidencia-query.dto.ts` — filtros query válidos para incidencias.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/receta/dto/create-receta.dto.ts` — contrato wire de receta.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts` — rutas activas de auth/password.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/controller/usuario.controller.ts` — rutas activas de perfil/usuarios/password.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/test/e2e/frontend-integration-contracts.e2e-spec.ts` — oráculo de verificación ya existente para contratos frontend-backend.

**Verification**
1. Ejecutar búsqueda estática sobre `frontend/smart-economat-frontend/src` para asegurar que no quedan llamadas HTTP internas fuera de `baseFetch` y que los payloads no se construyen inline en páginas/modales salvo wrappers triviales.
2. Ejecutar `npm run lint` en `frontend/smart-economat-frontend` y corregir todos los errores introducidos o expuestos por el refactor.
3. Ejecutar `npm run build` en `frontend/smart-economat-frontend`; si falla por el test conocido de `AuthContext`, resolverlo solo para habilitar la validación global.
4. Ejecutar `npm test -- --run` en `frontend/smart-economat-frontend` y ampliar o ajustar tests de servicios/builders donde el refactor cambie contrato o validación previa.
5. Ejecutar `npm run test:e2e:file -- test/e2e/frontend-integration-contracts.e2e-spec.ts` en `backend/smart-economat-backend` contra el entorno local del repo.
6. Hacer smoke manual de flujos reales con credenciales/seed local: login, perfil, productos, proveedores, pedidos, lotes, recepción, incidencias, inventario, recetas, producción, usuarios y profesor/admin; confirmar que las requests que antes caían en 400 ahora salen con payload/query/headers válidos.
7. Repetir búsquedas de control para verificar que no quedan `limit > 50` en servicios que dependen de `PaginationQueryDto`, ni fields legacy enviados al backend como `pedidoProductos`, `tiempoPreparacion` o metadatos de entidad.

**Decisions**
- Alcance incluido: toda la capa frontend React, tanto flujos navegables como todas las funciones exportadas en `src/services`.
- Fuente de verdad: backend sin modificaciones; controladores, DTOs, pipes y tests E2E existentes mandan sobre cualquier tipo o shape del frontend.
- Arquitectura: no se introduce react-query en esta pasada. Se corrige la capa actual basada en servicios, hooks propios, estado local y drafts.
- Criterio funcional: el objetivo es eliminar 400 causados por desalineación de contrato. Rechazos legítimos de negocio del backend seguirán existiendo si la operación es inválida por reglas de dominio ajenas al contrato.
- Verificación: se usará entorno local del repo y la suite E2E de contratos ya existente como base, complementada con tests/frontend y smoke manual.
- Riesgo conocido de verificación: `frontend-build-test-authservice-path-note.md` documenta un fallo previo de build/test por import roto en `test/store/AuthContext.test.tsx`; si sigue presente al ejecutar la verificación, se corrige solo como habilitador de calidad.

---

## Exploración Medium — Hallazgos (1 de abril 2026)

**Mismatches confirmados de 400 Bad Request:**

1. ✅ **`fetchRecetas()` default limit=100 vs backend @Max(50)**
   - Archivo: receta.service.ts line 15
   - Causa: PaginationQueryDto rechaza limit > 50 con 400
   - Estado: Crítico — se dispara automáticamente en cualquier listado de recetas
   - Solución: usar limit: 50 o normalizar como en proveedor.service.ts

2. ✅ **`precioUnitario` puede ser NaN en alta de producto**
   - Archivo: ProductoFormModal.tsx line ~190
   - Causa: ProveedorSelector produce NaN al vaciar precio; buildProductoPayload no valida
   - Estado: Crítico — bloquea creación desde Inventario→Productos
   - Ref: inventario-scan-create-product-note.md

3. ⚠️ **`MovimientoHistoryDto` backend @Max(100) sin validación frontend**
   - Archivo: movimiento.service.ts y backend MovimientoHistoryDto line ~94
   - Causa: frontend no limita limit, backend acepta hasta 100 pero inconsistencia con otros DTOs
   - Estado: Advertencia — inconsistencia entre DTOs

4. ⚠️ **Lógica defensiva en `incidencia.service.ts` indica inconsistencia**
   - Archivo: incidencia.service.ts line ~40
   - Causa: checks Array.isArray(body.data) sugieren contrato confuso
   - Estado: Advertencia — no es 400 pero es frágil

**Endpoints/payloads ya alineados (NO TOCAR):**
- ✅ proveedor.service.ts: normaliza limit a máximo 50 (línea 25-27)
- ✅ usuarioService.ts: valida limit <= 50 (línea 146)
- ✅ producto.service.ts: normaliza limit a máximo 50 (línea 44)
- ✅ buildProductoPayload: maneja codigoBarras, alergenos, imagen correctamente
- ✅ recepcion.service.ts: payloads válidos
- ✅ pedido.service.ts: parámetros consistentes

**Cambios incompletos (dirección correcta):**
- api.utils.ts tiene cleanPayload() pero no se usa sistémáticamente
- Normalización de limit existe en algunos servicios, falta en receta/movimiento
- pedido.service.ts usa pedidoProductos solo internamente (correcto)

**Patrones peligrosos:**
- ❌ receta.service.ts line 20: limit.toString() sin normalización
- ❌ produccion.service.ts line 43: limit.toString() sin normalización
- ⚠️ movimiento.service.ts: no aplica cleanPayload()
- ⚠️ merma.service.ts: no normaliza limit

**Usos limit > 50:**
- receta.service.ts line 15: limit: 100 ← CRÍTICO

**Summary:**
Dos fallos críticos confirmados (receta limit=100, precioUnitario=NaN) + dos advertencias medianas (MovimientoHistoryDto inconsistencia, incidencias response handling). El resto de servicios está razonablemente alineado pero le falta sistematización en la normalización de límites y uso de cleanPayload()
