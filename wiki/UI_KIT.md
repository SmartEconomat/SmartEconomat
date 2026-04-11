# UI Kit - SmartEconomat

Documento de referencia para el sistema de diseño y la biblioteca de componentes atómicos.

## Design Tokens

### Colores (Theme Palette)
| Token | Valor (Light) | Valor (Dark) | Uso |
| :--- | :--- | :--- | :--- |
| `primary.main` | `#dc004e` | `#ff4081` | Acciones principales, botones base. |
| `secondary.main` | `#0a6151` | `#4db6ac` | Acciones secundarias, login flows. |
| `background.default` | `#f5f5f5` | `#0B0E14` | Fondo principal (Slate Modern Deep). |
| `background.paper` | `#ffffff` | `#161B22` | Tarjetas y formularios (Slate Elevated). |

### Tipografía
| Token | Font Family | Pesos | Uso |
| :--- | :--- | :--- | :--- |
| `h3`, `h4` | Roboto, sans-serif | 700 (Bold) | Títulos de sección y Hero. |
| `body1`, `body2` | Roboto, sans-serif | 400 (Regular) | Párrafos y textos informativos. |
| `button` | Roboto, sans-serif | 500 (Medium) | Texto en botones. |

## Componentes Atómicos (`src/components/ui`)

### Button
Componente envolvente de `MuiButton` con estados de carga integrados.
- **Props**: `isLoading`, `loadingText`, `variant`, `color`, `fullWidth`.
- **Uso**: Toda acción de envío o navegación principal.

### Input
Componente envolvente de `MuiTextField` estandarizado.
- **Props**: `label`, `name`, `type`, `error`, `helperText`.
- **Uso**: Entradas de texto estándar en formularios.

### Checkbox
Wrapper de `FormControlLabel` optimizado para accesibilidad táctil.
- **Mejora**: Se ha incrementado el `padding` a `1` y ajustado el margen izquierdo a `-1` para alineación visual con inputs.
- **Uso**: Opciones binarias (ej: "Recordarme").

## Componentes de Autenticación (`src/features/auth/components`)

### AuthLogo
Encapsula la marca con tamaños responsivos definidos mediante `clamp`.
- **Props**: `condensed` (bool) - Ajusta el tamaño para flujos densos como el registro.

### SecondaryActionButton
Botón con estilo `outlined` suavizado y `text-transform: none` para evitar competencia visual con el botón primario.
- **Uso**: Enlaces de navegación entre Login y Registro.
