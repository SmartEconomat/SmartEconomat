# Página Recetas

## Ubicación real

`src/pages/Recetas.tsx`

## Propósito

La pantalla de recetas cubre el ciclo operativo de definición, visualización y preparación de recetas, además de varias acciones de lote ligadas a producción y compras.

## Composición actual

- `PageToolbar` para búsqueda y acciones globales
- `DataTable` para listado y selección múltiple
- `RecetaFormModal` para alta y edición
- `DetailModal` para detalle funcional
- `ConfirmDialog` para borrado
- `RecipeCarousel` como apoyo visual en la cabecera de la vista
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía paso a paso por el flujo de cocina.

## Ayuda e Inspiración Culinaria ✅

La página de Recetas integra un sistema de asistencia para optimizar el trabajo en cocina:

### Tour de Recetario (5 pasos)
1. **Inspiración Culinaria**: Uso del carrusel visual superior.
2. **Buscador**: Localización por ingredientes o elaboración.
3. **Ordenado**: Gestión por dificultad o tiempo.
4. **Creación**: Registro de nuevas recetas y escandallos.
5. **¡A Cocinar!**: Lanzamiento de producciones y ficha técnica.

## Funcionalidades principales

## Gestión básica

- listar recetas con paginación
- buscar por texto
- crear, editar y eliminar
- abrir detalle con ingredientes y metadatos

## Selección múltiple y acciones de lote

La vista mantiene `selectedIds` y habilita varias operaciones sobre la selección:

- `Preparar`
- `Exportar PDF`
- `Crear pedido`

Si no hay selección, las acciones permanecen visibles pero deshabilitadas.

## Preparación y validación de stock

Antes de producir, la pantalla puede:

- validar stock disponible
- proponer la creación de un lote de compra para faltantes
- ejecutar producción real cuando hay disponibilidad o la operación queda confirmada

## Exportación

La exportación a PDF permite incluir o excluir imagen por receta antes de generar el documento.

## Integración con pedidos

La pantalla puede derivar recetas seleccionadas a un pedido o batch de compra cuando faltan ingredientes o se quiere planificar aprovisionamiento.

## Permisos habituales

- `recetas:crear`
- `recetas:editar`
- `recetas:eliminar`
- permisos de producción y pedidos según la acción lanzada

## Relacionado

- [Módulo de pedidos desde recetas](../../modules/pedido/pedidos-desde-recetas.md)
- [Referencia de API](../../reference/api/README.md)
- [RecetaIngredientesSelector](../componentes/RecetaIngredientesSelector.md)