# Página: Recetas

> **Ubicación:** `src/pages/Recetas.tsx`

## Propósito

La página de Recetas es el núcleo de la gestión de producción. Permite definir la composición de platos, calcular escandallos y gestionar la elaboración. Utiliza un diseño híbrido con soporte para vista de cuadrícula (mosaico) para una visualización rápida de los platos con sus imágenes.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Gestiona el título, búsqueda por nombre de receta y categorías. Incluye el selector de modo de vista (Lista/Grid).
- **[DataTable](../componentes/DataTable.md)**: Muestra las recetas de forma tabular o en cuadrícula según la selección del usuario.
- **[DynamicFormModal](../componentes/DynamicFormModal.md)**: Formulario especializado para la creación y edición de escandallos de recetas.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Confirmación para la eliminación de recetas.

## Funcionalidades Clave

- **Sincronización de Vista**: El modo de vista (Lista/Grid) se sincroniza entre la cabecera y la tabla.
- **Gestión de Escandallos**: Definición de ingredientes por receta con cálculo de costes.
- **Resumen Visual**: En modo cuadrícula, cada receta se muestra con su imagen y datos clave de producción.

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| Nombre | `nombre` | Texto | Nombre del plato o elaboración. |
| Categoría | `categoria` | Chip | Clasificación culinaria. |
| Coste | `coste` | Numérico | Cálculo del escandallos (oculto en móvil). |
| Tiempo | `tiempo` | Numérico | Tiempo estimado de preparación (oculto en móvil). |
