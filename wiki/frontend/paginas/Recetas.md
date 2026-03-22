# Página: Recetas

> **Ubicación:** `src/pages/Recetas.tsx`

## Propósito

La página de Recetas es el núcleo de la gestión de producción. Permite definir la composición de platos, calcular escandallos y gestionar la elaboración. Utiliza un diseño híbrido con soporte para vista de cuadrícula (mosaico) para una visualización rápida de los platos con sus imágenes.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Incluye el buscador de recetas, el Chip de total de recetas, el botón para crear nuevas preparaciones y las acciones visibles de lote para `Preparar` y `Exportar PDF`. Incluye el selector de modo de vista (Lista/Grid).
- **[DataTable](../componentes/DataTable.md)**: Muestra las recetas de forma tabular o en cuadrícula según la selección del usuario.
- **[DynamicFormModal](../componentes/DynamicFormModal.md)**: Formulario especializado para la creación y edición de escandallos de recetas.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Confirmación para la eliminación de recetas.
- **[RecetaIngredientesSelector](../componentes/RecetaIngredientesSelector.md)**: Selector avanzado de ingredientes con carga paginada completa de productos y proveedores favoritos.

## Funcionalidades Clave

- **Sincronización de Vista**: El modo de vista (Lista/Grid) se sincroniza entre la cabecera y la tabla.
- **Gestión de Escandallos**: Definición de ingredientes por receta con cálculo de costes.
- **Resumen Visual**: En modo cuadrícula, cada receta se muestra con su imagen y datos clave de producción.
- **Acciones visibles por selección**: Cuando el usuario selecciona una o varias recetas, la barra superior mantiene visibles y juntas las acciones `Preparar` y `Exportar PDF`.
- **Soporte decimal**: Los campos `rendimiento`, `raciones` y `tamanioRacion` aceptan decimales, incluyendo entrada con coma (`2,5`).

## Acciones de Lote

- **Preparar varias recetas**: El botón `Preparar` aparece en la cabecera, al lado de `Exportar PDF`, y se habilita cuando hay recetas seleccionadas.
- **Exportación masiva**: `Exportar PDF` reutiliza la misma selección activa de recetas.
- **Comportamiento esperado**:
	- sin selección: ambos botones permanecen visibles pero deshabilitados;
	- con selección: ambos muestran el número de recetas seleccionadas.

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| Nombre | `nombre` | Texto | Nombre del plato o elaboración. |
| Categoría | `categoria` | Chip | Clasificación culinaria. |
| Coste | `coste` | Numérico | Cálculo del escandallos (oculto en móvil). |
| Tiempo | `tiempo` | Numérico | Tiempo estimado de preparación (oculto en móvil). |
