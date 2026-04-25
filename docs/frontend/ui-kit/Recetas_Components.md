# Componentes de Recetas

Biblioteca de componentes orientados a la gestión gastronómica, permitiendo la definición detallada de platos, ingredientes y seguridad alimentaria.

---

## RecipeCarousel (Galería Destacada)

Elemento visual de alto impacto utilizado para promocionar o destacar elaboraciones clave en la cabecera del módulo.

- **Ubicación**: `src/components/ui/RecipeCarousel.tsx`
- **Características**:
    - **Navegación Fluida**: Implementa transiciones suaves de opacidad y desplazamiento vertical para el texto.
    - **Información Rápida**: Integra overlays con el tiempo de preparación, dificultad (vía iconos) y categoría del plato.
- **Diseño**: Utiliza un degradado lineal (`linear-gradient`) en la base de la imagen para garantizar la legibilidad del texto blanco sobre cualquier fondo.

## RecetaIngredientesSelector

Componente interactivo para la construcción de la lista de ingredientes de una receta.

- **Ubicación**: `src/features/recetas/RecetaIngredientesSelector.tsx`
- **Funcionalidad**:
    - **Búsqueda Integrada**: Permite buscar productos del catálogo e añadirlos con un solo clic.
    - **Gestión de Cantidades**: Campos numéricos específicos con selector de unidad de medida (vía `UnidadIngrediente`).
    - **Trazabilidad**: Permite definir un "Proveedor Favorito" para automatizar la generación de pedidos de compra basados en la receta.
- **Diseño**: Organizado en filas compactas con acciones de borrado rápido, optimizando el espacio en formularios complejos.

## RecetaAlergenos (Visualizador de Seguridad)

Componente crítico para la comunicación de riesgos alimentarios.

- **Ubicación**: `src/components/ui/RecetaAlergenos.tsx`
- **Representación**:
    - **Símbolos Estándar**: Mapea la lista de alérgenos de la receta con los iconos oficiales de la UE.
    - **Tooltip Informativo**: Cada icono muestra el nombre del alérgeno al pasar el cursor para evitar ambigüedades.
- **Diseño**: Orientación horizontal con espaciado uniforme, adaptándose automáticamente al ancho del contenedor padre (tarjeta o modal de detalle).

## RecetaFormModal

Formulario integral para la creación de elaboraciones.

- **Ubicación**: `src/features/recetas/RecetaFormModal.tsx`
- **Estructura de Datos**:
    - **General**: Nombre, Instrucciones, Dificultad, Tiempo.
    - **Rendimiento**: Define raciones y tamaño de ración para cálculos de costes automáticos.
    - **Multimedia**: Gestión de carga de imagen del plato.
- **Lógica de Ayuda**: Provee explicaciones sobre cómo el "Rendimiento" afecta al cálculo de ingredientes necesario durante la producción.
