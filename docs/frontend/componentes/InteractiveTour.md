# Documentación de Componente: InteractiveTour

**Tipo:** Organismo / Motor de UI  
**Ubicación:** `src/components/common/Tutorial/InteractiveTour.tsx`

## Descripción General
El **InteractiveTour** es el motor central encargado de renderizar los recorridos guiados por la aplicación. Es un componente global que escucha el estado del tutorial y gestiona el resaltado de elementos del DOM junto con diálogos informativos.

---

## Funcionalidades Clave

### 1. Resaltado (Spotlight)
Utiliza un sistema de posicionamiento absoluto para crear un foco sobre el elemento objetivo (`target`). 
- **Efecto de Sombra**: Genera una capa de `box-shadow` infinita para oscurecer el resto de la interfaz.
- **Transiciones Suaves**: Los movimientos entre elementos están animados para evitar saltos bruscos en la experiencia del usuario.

### 2. Posicionamiento Inteligente
Basado en [MUI Popper](https://mui.com/material-ui/react-popper/), el diálogo se ancla automáticamente al elemento resaltado.
- **Placement**: Soporta todas las posiciones estándar (top, bottom, left, right).
- **Center Mode**: Opción especial para elementos muy grandes o layouts complejos donde el diálogo se centra en el Viewport (`placement: 'center'`).
- **Prevent Overflow**: Reglas integradas para asegurar que el diálogo no se salga de los límites de la pantalla.

### 3. Responsividad y Adaptabilidad (Mobile-First)
- **Modo Compacto**: Detecta automáticamente pantallas con altura reducida (`< 520px`). En este modo, oculta iconos y reduce fuentes para evitar bloqueos de navegación.
- **Dynamic Resize**: Escucha cambios en el tamaño de ventana y eventos de scroll para recalcular la posición del spotlight y mantener la precisión visual.
- **Clamping de Altura**: Limita la altura del diálogo al 90% del viewport con scroll interno si el texto es demasiado largo.

### 4. Accesibilidad por Teclado
El motor incluye soporte nativo para navegación rápida:
- `ArrowRight` / `ArrowLeft`: Avanzar o retroceder entre pasos.
- `Escape`: Cerrar el tour inmediatamente.

---

## Estructura de Datos (Step)
El componente consume objetos tipo `TutorialStep` definidos en `tutorialData.tsx`:

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `target` | `string` | Selector CSS (ej: `#btn-nuevo`). Opcional para pasos centrales. |
| `placement`| `string` | Posición del mensaje (`top`, `center`, etc.). |
| `title` | `string` | Título del paso. |
| `description`| `string` | Explicación detallada (UX Writing). |
| `icon` | `Node` | Icono representativo de la funcionalidad. |

---

## Uso Técnico
Este componente se monta una sola vez en el `MainLayout.tsx` o `App.tsx` para estar disponible en toda la aplicación. No requiere props de entrada ya que lee su estado directamente desde el Store de Redux/Zustand mediante el hook `useTutorial`.

---

## Documentos Relacionados
- [TutorialHelper.md](file:///Users/alexisruiz/SmartEconomat/docs/frontend/componentes/TutorialHelper.md) (El botón disparador)
- [tutorialData.tsx](file:///Users/alexisruiz/SmartEconomat/frontend/smart-economat-frontend/src/utils/config/tutorialData.tsx) (Configuración de pasos)
