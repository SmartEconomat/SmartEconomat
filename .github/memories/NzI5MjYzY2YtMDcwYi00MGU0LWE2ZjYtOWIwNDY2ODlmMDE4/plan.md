# Plan: Auditoría y Refactorización WAI-ARIA Frontend

## TL;DR
Eliminar todos los warnings "Blocked aria-hidden on an element because its descendant retained focus" del frontend React+MUI. El problema raíz son: (1) modales anidados sin coordinación de focus, (2) uso de `disablePortal` que rompe la jerarquía aria-hidden, (3) `keepMounted` que deja DOM focusable oculto, y (4) workarounds `.blur()` que enmascaran el problema. La estrategia es centralizar la gestión de modales en el tema MUI global + refactorizar componentes base + eliminar hacks.

---

## Fase 1: Centralizar defaults de accesibilidad en el tema MUI

**Paso 1** — Añadir overrides de componentes MUI en el tema global (`src/utils/theme/themes.ts`)
- Agregar `MuiDialog.defaultProps` con defaults correctos
- Agregar `MuiMenu.defaultProps` sin `keepMounted`
- Agregar `MuiDrawer.defaultProps` sin `keepMounted`
- Esto cubre todos los Dialog/Menu/Drawer del proyecto de una sola vez

**Archivos:**
- `frontend/smart-economat-frontend/src/utils/theme/themes.ts`

---

## Fase 2: Refactorizar componentes base de modal (Modal, ConfirmDialog)

**Paso 2** — Refactorizar `Modal.tsx` (*bloquea Paso 5-8*)
- Añadir `closeAfterTransition` al Dialog para que la limpieza de focus ocurra después de la transición
- Verificar que el focus trap funcione correctamente con modales anidados
- Eliminar comentarios obsoletos sobre aria-hidden

**Paso 3** — Refactorizar `ConfirmDialog.tsx` (*parallel con Paso 2*)
- Eliminar la función `releaseFocusedElement()` completamente
- Eliminar las llamadas a `releaseFocusedElement()` en `handleCancel` y `handleConfirm`
- El Dialog de MUI ya gestiona el focus trap correctamente cuando se cierra

**Archivos:**
- `frontend/smart-economat-frontend/src/components/ui/Modal.tsx`
- `frontend/smart-economat-frontend/src/components/ui/ConfirmDialog.tsx`

---

## Fase 3: Eliminar `disablePortal` de todos los componentes

**Paso 4** — Eliminar `disablePortal` de Select MenuProps (*parallel*)
- `src/components/recepcion/PasoRevision.tsx` → líneas 214, 367: quitar `disablePortal: true` de MenuProps
- `src/components/recepcion/PasoEscaneo.tsx` → líneas 546, 781: quitar `disablePortal: true` de MenuProps
- Mantener `disableScrollLock: true` (no causa problemas de aria-hidden)

**Paso 5** — Eliminar `disablePortal` de BarcodeScanner Dialog
- `src/components/ui/BarcodeScanner.tsx` → línea 527: quitar `disablePortal`
- Verificar que el escáner de cámara y Select de cámaras funcionen en portal

**Archivos:**
- `frontend/smart-economat-frontend/src/components/recepcion/PasoRevision.tsx`
- `frontend/smart-economat-frontend/src/components/recepcion/PasoEscaneo.tsx`
- `frontend/smart-economat-frontend/src/components/ui/BarcodeScanner.tsx`

---

## Fase 4: Eliminar `keepMounted` del layout

**Paso 6** — Refactorizar MainLayout.tsx (*parallel con Fase 3*)
- Línea 353: quitar `keepMounted` del Menu del usuario
- Línea 391: quitar `keepMounted: true` del ModalProps del Drawer móvil

**Archivos:**
- `frontend/smart-economat-frontend/src/layouts/MainLayout.tsx`

---

## Fase 5: Eliminar todos los workarounds `.blur()` de páginas

**Paso 7** — Eliminar workarounds `.blur()` en páginas (*depende de Pasos 2-3*)
Los `.blur()` se dividen en dos categorías:

**A) `document.activeElement.blur()` — Workarounds de aria-hidden (ELIMINAR):**
- `src/pages/Recepcion.tsx` → línea 248: eliminar bloque completo del useEffect
- `src/pages/Inventario.tsx` → línea 299: eliminar
- `src/components/ui/PageToolbar.tsx` → líneas 125, 130: eliminar

**B) `e.currentTarget.blur()` — Blur de botones tras acción (MANTENER/EVALUAR):**
- `src/pages/Incidencias.tsx` → línea 196: `e.currentTarget.blur()` tras click → OK si es intencional para UX
- `src/pages/Preparaciones.tsx` → líneas 320, 334: mismo patrón
- `src/pages/Productos.tsx` → línea 404: mismo patrón
- `src/pages/Albaran.tsx` → línea 383: mismo patrón

Los de categoría B no causan el warning de aria-hidden (desfocan el botón propio, no `document.activeElement`). Se pueden mantener si la intención es evitar un outline visual tras click. 

**Archivos:**
- `frontend/smart-economat-frontend/src/pages/Recepcion.tsx`
- `frontend/smart-economat-frontend/src/pages/Inventario.tsx`
- `frontend/smart-economat-frontend/src/components/ui/PageToolbar.tsx`
- (opcionalmente) `src/pages/Incidencias.tsx`, `src/pages/Preparaciones.tsx`, `src/pages/Productos.tsx`, `src/pages/Albaran.tsx`

---

## Fase 6: Gestión de focus en pasos de Recepcion

**Paso 8** — Refactorizar focus management en Recepcion.tsx (*depende de Paso 7*)
- Línea ~253-257: el `useEffect` que hace `searchInputRef.current.focus()` tras cambio de paso
- Envolver en `requestAnimationFrame` o usar `autoFocus` en el TextField del paso correspondiente para que el focus ocurra después del render completo del Dialog

**Archivos:**
- `frontend/smart-economat-frontend/src/pages/Recepcion.tsx`

---

## Fase 7: SummaryModal y DetailModal — mejoras menores

**Paso 9** — Revisar SummaryModal Collapse (*parallel*)
- `src/components/ui/SummaryModal.tsx` → línea 488: evaluar si `unmountOnExit` en Collapse puede causar focus loss
- Si hay elementos focusables dentro del Collapse, quitar `unmountOnExit`

**Paso 10** — Revisar DetailModal nested edit (*parallel con Paso 9*)
- `src/components/ui/DetailModal.tsx`: verificar que la apertura de DynamicFormModal en modo edición no cause cascada aria-hidden doble
- Si el DetailModal abre DynamicFormModal como modal anidado, el focus trap de MUI debería gestionar ambos correctamente cuando están en portales separados (que es el default sin disablePortal)

**Archivos:**
- `frontend/smart-economat-frontend/src/components/ui/SummaryModal.tsx`
- `frontend/smart-economat-frontend/src/components/ui/DetailModal.tsx`

---

## Resumen de archivos afectados (por orden de cambio)

| Archivo | Cambio principal |
|---------|-----------------|
| `src/utils/theme/themes.ts` | Defaults MUI globales |
| `src/components/ui/Modal.tsx` | Añadir `closeAfterTransition` |
| `src/components/ui/ConfirmDialog.tsx` | Eliminar `releaseFocusedElement` |
| `src/components/recepcion/PasoRevision.tsx` | Quitar `disablePortal` ×2 |
| `src/components/recepcion/PasoEscaneo.tsx` | Quitar `disablePortal` ×2 |
| `src/components/ui/BarcodeScanner.tsx` | Quitar `disablePortal` |
| `src/layouts/MainLayout.tsx` | Quitar `keepMounted` ×2 |
| `src/pages/Recepcion.tsx` | Eliminar `.blur()`, mejorar focus |
| `src/pages/Inventario.tsx` | Eliminar `.blur()` |
| `src/components/ui/PageToolbar.tsx` | Eliminar `.blur()` |
| `src/components/ui/SummaryModal.tsx` | Revisar Collapse |
| `src/components/ui/DetailModal.tsx` | Verificar modales anidados |

---

## Verificación

1. `npm run build` — compilación sin errores
2. `npx eslint src/ --ext .ts,.tsx` — sin nuevos errores de lint
3. **Test manual**: Abrir cada modal/dialog que fue modificado, verificar:
   - No aparece "Blocked aria-hidden" en consola del navegador
   - Focus se mueve correctamente al modal al abrirlo
   - Focus vuelve al elemento que abrió el modal al cerrarlo
   - Tab cycling funciona dentro del modal (focus trap)
   - Modales anidados (ej: DetailModal → DynamicFormModal → ConfirmDialog) no producen warnings
4. **Test de BarcodeScanner**: Verificar que el diálogo del escáner funciona sin `disablePortal`
5. **Test de Selects**: Verificar que los dropdown de PasoRevision y PasoEscaneo se posicionan correctamente sin `disablePortal`
6. **Test de MainLayout**: Verificar que el drawer y el menu del usuario abren/cierran correctamente sin `keepMounted`

---

## Decisiones

- Los `.blur()` de tipo `e.currentTarget.blur()` en botones de acción se MANTIENEN: son un patrón UX para quitar el outline del botón tras click, no causan aria-hidden warnings.
- NO se implementa un "FocusManager" singleton — MUI Dialog con defaults correctos y sin `disablePortal` ya gestiona focus trap + aria-hidden correctamente, incluso con modales anidados (cada Dialog se renderiza en su propio portal).
- Se prefiere la corrección global via tema MUI sobre correcciones individuales por componente.

## Scope excluido
- No se añaden tests automáticos de accesibilidad (axe-core, jest-axe) — eso sería una tarea separada.
- No se refactorizan Tooltips ni Snackbars — no causan el warning específico de aria-hidden.
- No se toca la lógica de negocio de ningún componente.
