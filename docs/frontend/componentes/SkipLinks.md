# SkipLinks (Enlaces de Salto)

El componente `SkipLinks` proporciona una forma rápida para que los usuarios de teclado y lectores de pantalla salten secciones repetitivas de la interfaz, como el menú lateral o el encabezado.

## Propósito
Implementar el patrón de accesibilidad "Skip to Content" de manera elegante y funcional, permitiendo que un usuario de teclado llegue a su destino con una sola pulsación tras la carga inicial.

## Comportamiento Visual
- **Estado Oculto**: El componente es invisible por defecto y no ocupa espacio en el flujo del documento.
- **Estado Activo**: Cuando el componente o uno de sus enlaces recibe el foco (`Tab`), aparece centrado en la parte superior de la pantalla con un estilo "glassmorphism" y bordes definidos.

## Destinos de Salto
Actualmente soporta dos destinos críticos:
1.  **Contenido Principal (`#main-content`)**: Salta directamente al área de trabajo.
2.  **Menú de Navegación (`#sidebar-nav`)**: Salta al menú lateral para cambiar de módulo.

## Implementación Técnica
El componente utiliza la utilidad `navigateToElement` para asegurar que:
- Se aplique foco programático al contenedor de destino.
- El destino reciba un `tabIndex={-1}` si no lo tiene, permitiendo que la navegación continúe desde allí.
- No se produzcan desplazamientos bruscos si la sección ya es visible.

### Ejemplo de Uso en Layout
Se integra directamente en el nivel raíz del layout para ser el primer elemento en el orden de tabulación.

```tsx
<Box component="div">
  <SkipLinks />
  <AppBar />
  <Sidebar />
  <MainContent />
</Box>
```
