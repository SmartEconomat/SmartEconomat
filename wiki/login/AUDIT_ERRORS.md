# Auditoría UX/UI - Errores Detectados

Este documento registra los fallos de diseño, accesibilidad y experiencia de usuario identificados en la página de Login y Registro de SmartEconomat.

## 1. Responsividad y Layout

### Altura Excesiva del Hero (Móvil/Tablet)
- **Hallazgo**: El panel informativo superior (Hero) ocupaba demasiado espacio vertical, desplazando el formulario de login fuera de la vista inicial ("below the fold").
- **Impacto**: El usuario debía hacer scroll solo para ver el botón de acción principal.
- **Severidad**: Media-Alta.

### Desalineación del Checkbox
- **Hallazgo**: El control "Recordarme" no estaba alineado con el borde izquierdo de los campos de texto, rompiendo la cuadrícula visual del formulario.
- **Severidad**: Baja.

## 2. Accesibilidad (WCAG)

### Contraste Insuficiente en Botones Deshabilitados
- **Hallazgo**: El botón "Acceder" deshabilitado utilizaba un ratio de contraste de ~2.7:1 (gris claro sobre fondo gris). El estándar WCAG requiere al menos 4.5:1 para legibilidad.
- **Severidad**: Alta.

### Falta de Focus-Trap
- **Hallazgo**: La navegación mediante la tecla TAB permitía al foco salir del formulario y "perderse" en elementos decorativos del carrusel, dificultando la navegación para usuarios de lectores de pantalla o teclado.
- **Severidad**: Media.

## 3. Interfaz y Experiencia (UI/UX)

### Competencia en Jerarquía Visual
- **Hallazgo**: El botón de registro ("¿No tienes cuenta?") utilizaba bordes gruesos y colores vibrantes que competían en peso visual con el botón primario de inicio de sesión.
- **Severidad**: Media.

### Área de Interacción Reducida (Ley de Fitts)
- **Hallazgo**: El área de clic del checkbox era demasiado pequeña para dispositivos táctiles, provocando errores de interacción en móviles.
- **Severidad**: Media.

## 4. Rendimiento (Lighthouse)

- **TBT (Total Blocking Time)**: Elevado en entorno de desarrollo debido a la carga de módulos pesados (`react-dom`, `sentry`).
- **LCP (Largest Contentful Paint)**: Retraso en la visualización del contenido principal debido a las animaciones iniciales del layout ("Wall Peel").
