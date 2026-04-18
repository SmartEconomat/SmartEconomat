# Accesibilidad y Navegación Operativa

SmartEconomat está diseñado para ser accesible universalmente y altamente eficiente para usuarios avanzados. Esta guía detalla las características de accesibilidad y los sistemas de navegación rápida implementados.

## Estándares Seguidos
La aplicación sigue las pautas **WCAG 2.1 (Web Content Accessibility Guidelines)**, asegurando:
- **Perceptibilidad**: Contraste adecuado y soporte para lectores de pantalla.
- **Operabilidad**: Navegación completa mediante teclado.
- **Comprensibilidad**: Feedback visual claro para cada acción.
- **Robustez**: Compatibilidad con tecnologías asistivas modernas.

---

## Sistema de Atajos de Teclado (F-Keys)

Para acelerar la operativa diaria, se han implementado atajos globales que permiten saltar entre las secciones principales de cualquier página:

| Tecla | Acción | Destino |
| :--- | :--- | :--- |
| **F1** | Saltar al Contenido | Inicio del área principal de la página. |
| **F2** | Navegar al Menú | Menú lateral de navegación global. |
| **F3** | Ir a Filtros | Área de búsqueda y filtrado de datos. |
| **F4** | Ver Resultados | Tabla de datos o cuadrícula de resultados. |

> [!NOTE]
> Estos atajos anulan las funciones nativas del navegador (como ayuda o búsqueda) para dar prioridad a la eficiencia del sistema SmartEconomat.

---

## Navegación del Tutorial Interactivo

Cuando el **Tutorial de Página** está activo, el sistema activa capturadores de eventos dedicados para facilitar la navegación sin ratón:

| Tecla | Acción |
| :--- | :--- |
| **ArrowRight** | Avanzar al siguiente paso del tour. |
| **ArrowLeft** | Volver al paso anterior. |
| **Escape** | Salir/Cerrar el tutorial en cualquier momento. |

### Responsividad de la Ayuda
El sistema de ayuda es **Mobile-Friendly** y se adapta dinámicamente:
- **Modo Compacto**: En pantallas con poca altura, el tour oculta elementos decorativos (como el icono grande) para dar prioridad a la visibilidad de los botones de navegación y el texto descriptivo.
- **Scroll Inteligente**: Si el texto de un paso es muy extenso, el diálogo genera un scroll interno para no desbordar la pantalla del usuario.

---

## Saltos Rápidos (Skip Links)

Al cargar la página por primera vez o refrescarla, la primera pulsación de la tecla `Tab` activará el menú de **Saltos Rápidos** en la parte superior central:
1. **Saltar al contenido principal**: Evita navegar por todo el menú lateral.
2. **Saltar al menú de navegación**: Útil para cambiar de módulo rápidamente.

---

## Gestión de Foco y Resaltado Visual

Cada salto (ya sea por atajo o skip link) activa un sistema de **Focus Management**:
- **Resaltado Visual**: La sección destino se marca con un borde de color primario (`#dc004e`) y una sombra suave para confirmar visualmente la ubicación.
- **Toasts de Confirmación**: Se muestra una notificación centrada en la parte superior indicando la sección a la que se ha navegado, acompañada de un icono de dirección.
- **Scroll Inteligente**: El sistema realiza un desplazamiento suave si el elemento no es visible, asegurando que la cabecera fija de la aplicación no tape el contenido importante.

---

## Optimización para Lectores de Pantalla (Screen Readers)

### Lectura de Códigos de Barras
Para facilitar la auditoría de productos, los códigos de barras de 13 dígitos (EAN-13) se formatean internamente para ser leídos **cifra por cifra**.
- **Visualmente**: Se ve el número completo (ej: `8412345678901`).
- **Auditivamente**: El lector dirá "ocho, cuatro, uno, dos..." en lugar de "ocho billones...".

### Landmarks Semánticos
La estructura del sitio utiliza etiquetas HTML5 estándar:
- `<header>`: Cabecera superior (AppBar).
- `<nav>`: Barra lateral (Sidebar).
- `<main>`: Espacio de trabajo principal.
