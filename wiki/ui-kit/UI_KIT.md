# UI Kit - SmartEconomat

Documento de referencia para el sistema de diseño y la biblioteca de componentes atómicos.

## Principios del Sistema

- **Carga Progresiva (Skeletons)**: No usar spinners globales en el Dashboard. Cada componente debe manejar su propio estado `isLoading` e implementar esqueletos que imiten su forma final.
- **Accesibilidad (WCAG AA)**: Todo componente interactivo debe ser navegable por teclado, manejar focos y tener etiquetas ARIA descriptivas.
  - **Botones de Icono**: Deben incluir `aria-label` descriptivo.
  - **Estructura Semántica**: Solo un `h1` por página; las secciones internas deben usar `h2`, `h3`, etc., sin saltar niveles.
  - **Contraste**: Ratio mínimo de 4.5:1 (AA). En modo oscuro, se ha ajustado `text.secondary` a **0.85 opacity** sobre fondo Slate Deep para cumplimiento estricto.
  - **Fuentes**: No utilizar tamaños inferiores a **0.8rem (12.8px)** en textos informativos o interactivos para evitar alertas de WAVE.
  - **Inputs sin Label**: Usar el patrón `slotProps.htmlInput={{ 'aria-label': 'Nombre' }}` para que los lectores de pantalla detecten la etiqueta incluso si el diseño visual no la incluye.
  - **Decoración**: Los iconos decorativos llevan `aria-hidden="true"`.
- **Rendimiento (Lazy Loading)**: Los componentes de alto coste (modales pesados, gráficas, páginas) se cargan de forma diferida mediante `React.lazy`.
- **Estética Premium (Slate Modern)**:
  - **Glassmorphism**: Uso de fondos traslúcidos con `backdrop-filter: blur()` para elementos flotantes de alta elevación (Tooltips, Popovers).
  - **Animaciones Secuenciales**: Las transiciones de layout deben ser fluidas y nativas de CSS, evitando superposiciones de contenido mediante `transition-delay`.

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

### Tooltip
Componente con estética Glassmorphism basado en `MuiTooltip`.
- **Estilo**: Fondo `alpha(theme.palette.background.paper, 0.8)`, desenfoque de 10px y borde sutil de 1px.
- **Comportamiento**: `enterDelay: 400ms` para evitar ruido visual, transiciones de opacidad suaves.

### LearningModeToggle
Indicador visual del estado de aprendizaje en la barra lateral.
- **Diseño**: Sustituye texto plano por un `Badge` estilizado (ON/OFF) con colores de estado.
- **Uso**: Control global para mostrar/ocultar ayudas visuales en el sistema.

### LinearLoader
Indicador de progreso lineal premium para partes superiores.
- **Lógica**: Utiliza un avance determinado simulado (finto progreso) que avanza de forma orgánica hasta el 94%, deteniéndose ahí hasta que la carga finaliza.
- **Uso**: Obligatorio en `AppRouter` (transiciones de chunk) y recomendado en el tope de páginas durante el `fetch` inicial junto a Skeletons.

### DynamicFormModal
Motor dinámico para la generación de formularios complejos y reutilizables.
- **Blindaje de Datos**: Incluye motor de validación interna con soporte para Regex (`pattern`), límites físicos de escritura (`maxLength`) y validación de nulidad (`required`).
- **Arquitectura de Layout (Grid v2)**: Implementa la grilla proporcional de MUI (ej: proporción **4/8** para Ficha de Producto) asegurando alineación pixel-perfect entre activos visuales y campos de datos.
- **Seguridad de Interfaz**: Implementa `e.preventDefault()` nativo para blindar la estabilidad de los modales padres durante el envío de datos.
- **Tipos de Campo**: Soporte para `text`, `number` (blindaje de negativos), `email`, `date`, `select`, `allergens`, `image` y `barcode`.

## Componentes de Autenticación (`src/features/auth/components`)

### AuthLogo
Encapsula la marca con tamaños responsivos definidos mediante `clamp`.
- **Props**: `condensed` (bool) - Ajusta el tamaño para flujos densos como el registro.

### SecondaryActionButton
Botón con estilo `outlined` suavizado y `text-transform: none` para evitar competencia visual con el botón primario.
- **Ubicación**: `src/features/auth/components/SecondaryActionButton.tsx`
- **Uso**: Enlaces de navegación entre Login y Registro.

### SmartFilterAutocomplete
Filtro de búsqueda avanzada con experiencia de usuario fluida (SaaS Premium).
- **Características**
---

## Estándares de Accesibilidad y Foco ♿

SmartEconomat adopta un estándar de "Accesibilidad Primero" para asegurar una experiencia inclusiva y eficiente.

### Estados de Foco (Focus Ring)
Toda interacción mediante teclado debe proporcionar un feedback visual inmediato y distinguible.
- **Color de Foco**: `#dc004e` (Primary Pink) con una transparencia del 15% para el resalte exterior.
- **Estilo**: Borde sólido de 2px con un `outline-offset` de 2px para no obstruir el contenido del elemento.
- **Implementación**: Centralizada en `index.css` mediante selectores de ID para landmarks.

### Navegación Operativa (shortcuts)
Se reserva el rango de teclas **F1 a F4** para la navegación estructural global. Ningún componente local debe sobrescribir estos atajos.

### Notificaciones de Navegación
Las confirmaciones de salto de sección deben:
- Aparecer **centradas en la parte superior**.
- Utilizar el icono `NearMeOutlined` (Brújula) para indicar movimiento/navegación.
- Tener una duración breve (2000ms a 3000ms) para no obstruir la vista permanentemente.

### Lectura de Datos Críticos
- Los identificadores numéricos largos (códigos de barras, UUIDs) deben tener un `aria-label` que facilite su lectura cifra a cifra si el contexto de auditoria lo requiere.
    - Scroll horizontal automático para chips (altura fija).
    - Degradado dinámico inteligente (`mask-image`) reactivo al scroll.
    - Orden "Búsqueda-Primero" para flujo natural.
- **Uso**: Obligatorio para todos los componentes de filtrado múltiple en barras de herramientas.

### PageToolbar (v3)
Barra de herramientas unificada con layout de tres filas y control de densidad.
- **Características**:
    - Disposición 50/50 simétrica para Buscador y SmartFilters.
    - Botón de colapso minimalista para reducir altura visual.
    - Responsividad adaptativa: los campos ocupan el 100% en móviles.
    - Integración de conteo total (Badge) en la fila de cabecera.
- **Ubicación**: `src/components/ui/PageToolbar.tsx`

## Componentes de Dashboard (`src/features/dashboard/components`)

