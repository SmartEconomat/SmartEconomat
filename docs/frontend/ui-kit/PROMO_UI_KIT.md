# SmartEconomat UI Kit: The Engineering Showcase

En SmartEconomat, el diseño no es una capa superficial; es el resultado de una arquitectura técnica rigurosa. Este documento presenta un **collage técnico** de los componentes y estándares que dan vida a nuestra plataforma.

---

## UI Architecture Collage

Explora las diferentes capas de nuestro sistema a través de fragmentos reales de su implementación.

````carousel
```typescript
// [Layer 01] Design Tokens & Themes
// `frontend/smart-economat-frontend/src/utils/theme/themes.ts`

const lightPalette = {
  mode: 'light',
  primary: { main: '#dc004e' },   // Deep Pink
  secondary: { main: '#0a6151' }, // Emerald Green
  background: { default: '#f5f5f5' }
};

const typography = {
  fontFamily: 'Inter, Roboto, sans-serif',
  fontSize: 14,
  h3: { fontWeight: 800, fontSize: '1.8rem' }
};
```
<!-- slide -->
```typescript
// [Layer 02] Intelligent Status Mapping
// `frontend/smart-economat-frontend/src/components/ui/StatusChip.tsx`

export const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'success':
    case 'delivered':
    case 'en_almacen': return 'success';
    case 'error':
    case 'rejected': return 'error';
    case 'pending':
    case 'preparada': return 'warning';
    default: return 'info';
  }
};
```
<!-- slide -->
```typescript
// [Layer 03] Universal Accessibility (a11y)
// `frontend/smart-economat-frontend/src/utils/a11y-format.ts`

/**
 * Heurística para lectores de pantalla:
 * Inserta espacios en códigos largos (EAN-13, IDs) 
 * para forzar la lectura dígito a dígito.
 */
export const formatDigitsForSR = (text: string): string => {
  if (/^\d{6,}$/.test(text.trim())) {
    return text.split('').join(' ');
  }
  return text;
};
```
<!-- slide -->
```tsx
// [Layer 04] Domain Physics (Weight & Validation)
// `frontend/smart-economat-frontend/src/components/recepcion/PasoEscaneo.tsx`

const getValidationColor = (recibida: number, pedida: number) => {
  if (recibida === pedida) return 'success.main';
  if (recibida < pedida) return 'warning.main';
  return 'info.main'; // Exceso sobre albarán
};

// IoT Capture integration
const handleWeightCapture = (weight: number) => {
  onUpdateLinea(pIdx, lIdx, 'cantidadRecibida', weight);
};
```
````

---

## 🛠️ Principios de Ingeniería del UI Kit

El "estilo" de SmartEconomat se define por tres pilares fundamentales que puedes observar en el collage superior:

### 1. Semántica Visual Rigurosa
No usamos colores de forma arbitraria. Cada tonalidad en el `StatusChip` o en las validaciones de `PasoEscaneo` está vinculada directamente al estado del negocio en el backend (PostgreSQL) y el modelo de datos TypeORM.

### 2. Accesibilidad Proactiva
Nuestras utilidades de `a11y` no son solo etiquetas estáticas. Implementamos transformadores heurísticos como `formatDigitsForSR` para asegurar que un operario de almacén usando un lector de pantalla pueda entender un código de barras de 13 dígitos sin ambigüedades.

### 3. Integración con el Mundo Físico
El UI Kit está diseñado para interactuar con hardware. La lógica de pesaje captura datos mediante la **Web Serial API**, integrándolos en el estado de React de forma síncrona, proporcionando feedback visual inmediato (Verde/Ámbar/Azul) basado en la precarga del pedido.

---

> [!NOTE]
> Este kit ha sido diseñado para ser **Extensible**. Cada componente utiliza `sx props` de MUI v7 para personalizaciones granulares sin romper el sistema de diseño centralizado en `themes.ts`.

---

**SmartEconomat** - *Engineering excellence in every pixel.*
