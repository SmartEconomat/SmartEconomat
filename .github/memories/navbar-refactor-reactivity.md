# Refactorización: Arreglar Pérdida de Reactividad en Navbar

**Fecha:** 16 de abril de 2026  
**Problema:** El navbar perdía reactividad en momentos específicos, dificultando la navegación.

## Causas Identificadas

### 1. **SidebarContent se recreaba en cada render**
- `SidebarContent` estaba **definida DENTRO** del componente `MainLayout`
- **Impacto:** Cada vez que `MainLayout` re-renderizaba, se creaba una nueva función para `SidebarContent`
- Esto causaba que los drawers se re-montaran completamente, perdiendo su estado

### 2. **Callbacks sin memoización**
- `handleNavigation` se recreaba en cada render
- Causaba que los `ListItemButton` recibieran nuevas referencias de función constantemente
- Los tooltips y transiciones se reiniciaban innecesariamente

### 3. **Estado acoplado**
- Una sola variable `open` intentaba manejar tres casos diferentes:
  - Mobile (drawer temporal)
  - Tablet (overlay expandible)
  - Desktop (sidebar permanente con toggle)
- Esto causaba conflictos de lógica condicional compleja

### 4. **Dependencias incompletas en useEffect**
- El `useEffect` que cerraba el drawer dependía de variables que podían no estar sincronizadas

## Solución Implementada

### 1. Extraer `SidebarContent` fuera del componente
```typescript
// ANTES: Dentro de MainLayout
const SidebarContent = ({ isExpanded, onNavigate, onClose }) => { ... }

// DESPUÉS: Fuera, memoizado
const SidebarContent = React.memo(({...}: SidebarContentProps) => { ... });
SidebarContent.displayName = 'SidebarContent';
```

**Beneficio:** Se define una sola vez, evita recreaciones en cada render del padre.

### 2. Separar estados para cada modo
```typescript
// ANTES: Un solo estado que hacía todo
const [open, setOpen] = useState(!isMobile);

// DESPUÉS: Estados separados
const [sidebarOpen, setSidebarOpen] = useState(false); // mobile & tablet overlay
const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true); // desktop toggle
```

**Beneficio:** Lógica más clara, menos conflictos de estado.

### 3. Memoizar `handleNavigation` con `useCallback`
```typescript
const handleNavigation = useCallback(
  (path: string) => {
    navigate(path);
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
  },
  [navigate, isMobile, isTablet]
);
```

**Beneficio:** La referencia de función es estable, los botones no se re-renderizan innecesariamente.

### 4. Handlers simples para otros casos
```typescript
const handleDrawerOpen = () => setSidebarOpen(true);
const handleDrawerClose = () => setSidebarOpen(false);
const handleDesktopToggle = () => setDesktopSidebarExpanded((prev) => !prev);
```

**Beneficio:** Simples, predecibles, sin lógica compleja.

### 5. Usar `renderSidebarContent` para inyectar props
```typescript
const renderSidebarContent = (isExpanded: boolean, onClose?: () => void) => (
  <SidebarContent
    isExpanded={isExpanded}
    onNavigate={handleNavigation}
    onClose={onClose}
    isTablet={isTablet}
    isLearningMode={isLearningMode}
    currentThemeName={currentThemeName}
    location={location}
    theme={theme}
    visibleMenuItems={visibleMenuItems}
  />
);
```

**Beneficio:** Inyecta los props necesarios sin recrear componentes.

## Cambios Estructurales

### Antes
```
MainLayout (rerender frecuentes)
  └─ SidebarContent (recreada cada vez)
      └─ handleNavigation (recreada cada vez)
          └─ ListItemButton (re-monta innecesariamente)
```

### Después
```
SidebarContent (definida una sola vez, memoizada)
  └─ recibe props estables
      └─ handleNavigation (memoizado con useCallback)
          └─ ListItemButton (solo re-renderiza cuando cambian props relevantes)

MainLayout
  └─ renderSidebarContent (factory function)
      └─ instancia memoizada de SidebarContent
```

## Beneficios Clave

✅ **Reactividad consistente:** Los botones responden siempre  
✅ **Sin re-mounts innecesarios:** Las transiciones son suaves  
✅ **Lógica clara:** Estados separados para cada modo  
✅ **Debugging más fácil:** SidebarContent tiene displayName  
✅ **Performance mejorado:** Menos recreaciones de componentes  

## Archivos Modificados

- `/Users/alexisruiz/SmartEconomat/frontend/smart-economat-frontend/src/layouts/MainLayout.tsx`
  - Línea 1: Agregar `useCallback` a imports
  - Línea 149-347: Extraer `SidebarContent` como componente memoizado
  - Línea 390-397: Separar estados
  - Línea 403-412: Handlers simples
  - Línea 413-424: `handleNavigation` con `useCallback`
  - Línea 474-487: `renderSidebarContent` factory
  - Línea 521-555: Condicionales de drawers con estados separados

## Testing Recomendado

1. **Mobile (< 600px):**
   - Toggle abre/cierra drawer
   - Navegar cierra el drawer
   - No aparece botón "<"

2. **Tablet (900-1199px):**
   - Sidebar mini siempre visible
   - Click en icono abre overlay
   - Botón "<" funciona para cerrar
   - Navegar cierra el overlay
   - Todos los botones responden

3. **Desktop (≥ 1200px):**
   - Sidebar expandido/colapsado con toggle
   - Botones siempre operativos
   - Transiciones suaves
   - No aparece botón "<"

## Validación

✅ Build compilado sin errores (npm run build)  
✅ TypeScript tipos correctos  
✅ React.memo aplicado correctamente  
✅ useCallback con dependencias completas  
✅ Display name para debugging  
