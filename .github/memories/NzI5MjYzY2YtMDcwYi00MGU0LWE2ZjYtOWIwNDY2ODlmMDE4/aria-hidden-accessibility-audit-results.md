# Accessibility Audit: aria-hidden Focus Issues

**Search Date**: 1 de abril, 2026  
**Scope**: `/frontend/smart-economat-frontend/src`  
**Focus**: Patterns that could trigger "Blocked aria-hidden on an element because its descendant retained focus" warnings

## CRITICAL FINDINGS

### 1. Known Issue - Documented but Not Fixed

**File**: [src/pages/Recepcion.tsx](src/pages/Recepcion.tsx#L246)
- **Line**: 246-251
- **Type**: Focus blur workaround
- **Code**:
  ```typescript
  // Liberar foco del elemento activo para evitar el warning
  // "Blocked aria-hidden on an element because its descendant retained focus"
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  ```
- **Context**: Used in a recovery dialog handler, but the underlying cause is not fixed
- **Issue**: This is a band-aid fix. The real issue likely stems from focus management in nested modals or during state restoration.

---

## CATEGORY 1: MUI Components with Backdrop/Overlay (aria-hidden risk)

### Dialog Components (23 instances across project)
**Components affected by MUI internal aria-hidden:**

1. **Standard Dialog Usage** - Most instances use default MUI Dialog behavior which handles aria-hidden internally:
   - [InventoryDetailModal.tsx](InventoryDetailModal.tsx#L147)
   - [UbicacionesModal.tsx](UbicacionesModal.tsx#L80-L143)
   - [MetricsCustomizer.tsx](MetricsCustomizer.tsx#L48-L104)
   - [UserModal.tsx](UserModal.tsx#L339-L581)
   - [Inventario.tsx](Inventario.tsx#L1103-L1245, L1318-L1340)
   - [Recetas.tsx](Recetas.tsx#L1205-L1233, L1265-L1611)
   - [Preparaciones.tsx](Preparaciones.tsx#L463-L553)
   - [Perfil.tsx](Perfil.tsx#L376-L422)
   - [DetailModal.tsx](DetailModal.tsx#L145-L310)
   - [NewProductModal.tsx](NewProductModal.tsx#L42-L138)
   - [RecepcionDetailModal.tsx](RecepcionDetailModal.tsx#L157-L159)
   - [WeightScaleModal.tsx](WeightScaleModal.tsx#L42-L99)
   - [SummaryModal.tsx](SummaryModal.tsx#L586-L655)
   - [Modal.tsx (custom wrapper)](Modal.tsx#L31-L99)
   - [BarcodeScanner.tsx](BarcodeScanner.tsx#L520-L560)

---

## CATEGORY 2: Focus Management Props - DIRECT RISK FACTORS

### keepMounted (Maintains DOM, affects aria-hidden)

**Files with keepMounted:**

1. **[MainLayout.tsx](MainLayout.tsx#L353, L391)** - TWO instances
   - **Line 353**: Menu dropd menu (User menu)
     ```typescript
     <Menu
       keepMounted
       id="menu-appbar"
       anchorEl={userMenuAnchor}
       ...
     >
     ```
   - **Line 391**: MobileDrawer with ModalProps
     ```typescript
     <MuiDrawer
       ...
       ModalProps={{
         keepMounted: true, // Better open performance on mobile.
       }}
     >
     ```
   - **Risk**: `keepMounted: true` means the DOM element stays mounted even when closed, so MUI's backdrop still applies aria-hidden="true" to it, but focus management can still occur on the kept-mounted elements.

---

### disablePortal (Keeps menu/select in document flow instead of portal)

**Files using disablePortal:**

1. **[PasoRevision.tsx](PasoRevision.tsx#L214, L367)** - TWO instances
   - **Line 214**: 
     ```typescript
     <FormControl size="small" fullWidth>
       <Select
         value={l.estadoVisual}
         MenuProps={{ disableScrollLock: true, disablePortal: true }}
         ...
       >
     ```
   - **Line 367**: Same pattern (different row in table)
   - **Risk**: `disablePortal: true` means the Select's MenuItem dropdown renders in the DOM tree near the Select itself, NOT in a portal. Combined with aria-hidden on parent, this can cause issues if focus moves to the menu items.

2. **[PasoEscaneo.tsx](PasoEscaneo.tsx#L546, L781)** - TWO instances
   - **Line 546**: SelectMenuProps with disablePortal
   - **Line 781**: Same pattern in different row
   - **Risk**: Same as above - keeps dropdown in document flow

3. **[BarcodeScanner.tsx](BarcodeScanner.tsx#L527)** - ONE instance
   - **Line 527**:
     ```typescript
     <Dialog
       open={open}
       onClose={handleClose}
       disablePortal
       ...
     >
     ```
   - **Risk**: Dialog itself rendered without portal - unusual for modals. Could be intentional for scanning UI, but risky for aria-hidden.

---

## CATEGORY 3: Custom Modals & Wrappers

### Modal.tsx (Custom wrapper around MUI Dialog)

**File**: [src/components/ui/Modal.tsx](Modal.tsx#L31-L99)
- **Line 46-47**: Comment indicates awareness of aria-hidden issue
  ```typescript
  // Dialog de MUI gestiona el focus trap ANTES de aplicar
  // aria-hidden al resto del DOM, evitando el warning de accesibilidad.
  ```
- **Current handling**: Relies on MUI Dialog's built-in focus trap system
- **Risk Level**: LOW - but only if nested modals are avoided

### DynamicFormModal.tsx

**File**: [src/components/ui/DynamicFormModal.tsx](DynamicFormModal.tsx#L1-L120)
- **Type**: Form modal with conditional field rendering
- **Risk**: Can contain sub-components (Autocomplete, Select, etc.) that may have focus issues
- **Contains nested**: BarcodeScanner, Autocomplete, Select components

### ConfirmDialog.tsx

**File**: [src/components/ui/ConfirmDialog.tsx](ConfirmDialog.tsx#L41-L90)
- **Focus management**: Manually blurs active element before closing
  ```typescript
  const releaseFocusedElement = () => {
    if (typeof document === 'undefined') return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  };
  ```
- **Risk Level**: MEDIUM - This is again a band-aid fix, not addressing root cause

---

## CATEGORY 4: Select/Menu Components with Focus Risk

### Autocomplete Components (Multiple instances)

1. **[ProductFilters.tsx](ProductFilters.tsx#L92)** - Line 92
   - Standard Autocomplete, no aria-hidden issues documented
   
2. **[RecetaIngredientesSelector.tsx](RecetaIngredientesSelector.tsx#L521)** - Line 521
   - **Has**: `openOnFocus` prop
   - Risk: Auto-opens dropdown on focus, potential for cascading focus events

3. **[ProveedorSelector.tsx](ProveedorSelector.tsx#L81)** - Line 81
   - Standard pattern

4. **[PedidoLineasSelector.tsx](PedidoLineasSelector.tsx#L574)** - Line 574
   - Standard pattern
   - **Note**: Also tracks `focusedQuantityKey` state for focus management

5. **[AlbaranFilters.tsx](AlbaranFilters.tsx#L48)** - Line 48
   - Standard pattern

6. **[IncidenciaFilters.tsx](IncidenciaFilters.tsx#L48)** - Line 48
   - Standard pattern

7. **[Inventario.tsx](Inventario.tsx#L1106)** - Line 1106
   - Remote autocomplete (no full catalog loaded)

8. **[InventarioFilters.tsx](InventarioFilters.tsx#L80, L161)** - Two instances
   - Standard pattern

9. **[MovimientoFilters.tsx](MovimientoFilters.tsx#L44)** - Line 44
   - Standard pattern

---

## CATEGORY 5: Transition Components (Collapse, Fade, etc.)

### Fade Components

1. **[Administracion.tsx](Administracion.tsx#L48, L63-L65)**
   - Used with conditional rendering: `<Fade in={isActive} timeout={400}>`
   - **Risk**: LOW - Only if content inside is interactive and focus-capable

2. **[BarcodeScanner.tsx](BarcodeScanner.tsx#L622-L641)** - Lines 622-641
   - Success message with Fade
   ```typescript
   <Fade in={showSuccess} timeout={200}>
     {/* Success content */}
   </Fade>
   ```
   - **Risk**: LOW - Static content

### Collapse Components

1. **[PageToolbar.tsx](PageToolbar.tsx#L248)** - Line 248
   - `<Collapse in={isExpanded}>` for expandable filters
   - **Risk**: MEDIUM if filters contain focusable elements

2. **[SummaryModal.tsx](SummaryModal.tsx#L488)** - Line 488
   - `<Collapse in={isExpanded} timeout="auto" unmountOnExit>`
   - **Risk**: MEDIUM - Inside modal, expandable content

---

## CATEGORY 6: Focus Management Code Patterns

### Manual Focus Handling

1. **[Recepcion.tsx](Recepcion.tsx#L256, L639)** - Lines 256, 639
   - Manually focuses search input:
   ```typescript
   if (activeStep === 1 && searchInputRef.current) {
     searchInputRef.current.focus();
   }
   ```
   - **Risk**: Manual focus can conflict with aria-hidden

2. **[DataTable.tsx](DataTable.tsx#L453)** - Line 453
   - tabIndex conditional management:
   ```typescript
   tabIndex={onRowClick ? 0 : -1}
   ```
   - Combined with hidden state logic

### Focus-related State Tracking

1. **[PedidoLineasSelector.tsx](PedidoLineasSelector.tsx#L130, L701-L703)** - Lines 130-703
   - Tracks `focusedQuantityKey` for quantity fields
   - Uses `onFocus` handler to track which field has focus
   - May interact badly with modal aria-hidden

2. **[ConfirmDialog.tsx](ConfirmDialog.tsx#L46-L60)** - Lines 46-60
   - `releaseFocusedElement()` function calls blur()

---

## CATEGORY 7: Menu/Popover Components

### MUI Menu (User Menu)

**File**: [MainLayout.tsx](MainLayout.tsx#L345-L379)
- **Line 345-379**: User menu in AppBar header
- **Props**: 
  ```typescript
  <Menu
    id="menu-appbar"
    anchorEl={userMenuAnchor}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    keepMounted
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    open={Boolean(userMenuAnchor)}
    onClose={handleUserMenuClose}
  >
  ```
- **Risk**: `keepMounted` is here - DOM stays mounted with aria-hidden applied

### Popover Components (Drawers use Popover under the hood)

1. **[TutorialHelper.tsx](TutorialHelper.tsx#L214-L232, L258-L276)** - Two instances
   - **Line 214-232**: Popover for tutorial (listitem mode)
   - **Line 258-276**: Popover for tutorial (icon mode)
   - **Risk**: LOW - Content is static, not interactive focus-wise

---

## CATEGORY 8: Drawer Components (with internal aria-hidden)

### MainLayout Drawer

**File**: [MainLayout.tsx](MainLayout.tsx#L386-L407)
- **Desktop Drawer**: `variant="permanent"` - always visible, no aria-hidden issues
- **Mobile Drawer**: 
  ```typescript
  <MuiDrawer
    variant="temporary"
    open={open}
    onClose={handleDrawerClose}
    ModalProps={{
      keepMounted: true, // Better open performance on mobile.
    }}
  >
  ```
- **Risk**: MEDIUM - `keepMounted: true` in ModalProps means backdrop stays in DOM with aria-hidden even when drawer is visually closed

---

## CATEGORY 9: tabIndex with Hidden Elements

### Usage Pattern

Found in: [DataTable.tsx](DataTable.tsx#L453)
```typescript
<TableRow>
  <TableCell
    onClick={() => onRowClick?.(row)}
    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
    tabIndex={onRowClick ? 0 : -1}  // Conditional focusability
    role="button"
  >
```
**Risk**: if row is conditionally hidden while tabIndex is 0, focus could be retained on hidden element

---

## CATEGORY 10: Global Theme Configuration

### Theme Setup

**Files**: 
- [App.tsx](App.tsx#L1, L33)
- [ThemeContext.tsx](ThemeContext.tsx#L1-L50)

**Current approach**:
- Uses `ThemeProvider` from `@mui/material/styles`
- Provides custom theme via context
- **NO custom MuiDialog, MuiModal, or MuiDrawer theme overrides found**

**Impact**: Using all default MUI modal focus management behavior (which normally handles aria-hidden correctly, BUT can conflict if:
- Multiple modals are opened in quick succession
- Focus is manually managed outside MUI's system
- `disableEnforceFocus` or similar props are used)

---

## SUMMARY OF RISK FACTORS

| Component Type | Count | Risk Level | Main Issue |
|---|---|---|---|
| Dialog (standard) | 14 | LOW | Default MUI handling OK |
| keepMounted usage | 2 | MEDIUM | DOM element stays mounted with aria-hidden |
| disablePortal usage | 3 | HIGH | Menu items rendered in-flow, not in portal |
| Manual focus() calls | 2 | MEDIUM | Can conflict with aria-hidden trap |
| Autocomplete | 9 | LOW-MEDIUM | openOnFocus can cascade events |
| Popover | 2 | LOW | Static content mostly |
| Collapse/Fade | 3 | MEDIUM | If wrapping focusable content |
| Custom blur() workarounds | 2 | MEDIUM | Band-aid fixes, not root cause |
| Drawer with keepMounted | 1 | MEDIUM | Backdrop stays mounted |

---

## RECOMMENDED ACTIONS

1. **Remove `keepMounted: true`** from [MainLayout.tsx](MainLayout.tsx#L391) mobile drawer
2. **Evaluate `disablePortal: true`** in [PasoRevision.tsx](PasoRevision.tsx#L214, L367) and [PasoEscaneo.tsx](PasoEscaneo.tsx#L546, L781) - likely needed for scroll-lock but check if causing issues
3. **Remove `disablePortal`** from [BarcodeScanner.tsx](BarcodeScanner.tsx#L527) Dialog if possible
4. **Replace blur() workarounds** with proper focus-trap library integration
5. **Test modal nesting scenarios** - create test case with DynamicFormModal containing Select with disablePortal
6. **Add MUI defaults config** if needed for DialogProps global settings
7. **Document and track** focus issues in [Recepcion.tsx](Recepcion.tsx#L246) recovery logic

