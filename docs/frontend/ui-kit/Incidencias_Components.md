# Componentes de Incidencias

Biblioteca de componentes para la gestión de discrepancias, errores de entrega y control de calidad en las recepciones de productos.

---

## IncidenciasStatusTabs

Separación lógica del flujo de trabajo de resolución de problemas.

- **Ubicación**: `src/features/incidencias/IncidenciasStatusTabs.tsx`
- **Etapas**:
    - **Pendientes**: Incidencias abiertas detectadas durante la recepción que requieren acción administrativa.
    - **Resueltas**: Historial de problemas ya solventados (abonos, reposiciones, aceptaciones).
- **Diseño**: Utiliza el patrón de pestañas segmentadas con iconos de estado (`Warning`, `CheckCircle`) para una identificación visual rápida de la carga de trabajo pendiente.

## ResolveIncidenciaModal

El componente crítico para la conciliación técnica de cantidades entre el pedido y la recepción real.

- **Ubicación**: `src/features/incidencias/ResolveIncidenciaModal.tsx`
- **Características**:
    - **Ajuste de Líneas**: Permite introducir incrementos o decrementos sobre lo recibido originalmente para corregir errores de conteo detectados a posteriori.
    - **Cálculo en Tiempo Real**: Muestra dinámicamente la "Cantidad Pendiente" resultante tras el ajuste, usando chips de colores (Verde/Ámbar).
    - **Validación Epsilon**: Implementa una tolerancia de precisión (`0.0005`) para evitar discrepancias por redondeo en productos pesables.
- **Microcopy**: Provee instrucciones claras como "Ajusta solo las líneas con discrepancia..." para guiar al usuario en un proceso técnicamente complejo.

## IncidenciaFilters

Sistema de localización de discrepancias por origen o temporalidad.

- **Ubicación**: `src/features/incidencias/IncidenciaFilters.tsx`
- **Capacidades**:
    - **Filtrado por Proveedor**: Aísla problemas de una fuente específica para negociaciones o reclamos masivos.
    - **Búsqueda por Tipo de Diferencia**: Permite segmentar por "Falta de mercancía", "Producto Roto" o "Producto Incorrecto".

## Visualización de Línea de Incidencia

Representación compacta de cada problema individual.

- **Diseño**: Basado en `Box` con bordes suavizados y espaciado generoso. Separa claramente la información del producto de los controles de ajuste, garantizando que el usuario siempre vea la "Cantidad Pedida" como referencia inamovible.
- **Accesibilidad**: Todos los campos de entrada tienen `labels` descriptivos que incluyen la unidad de medida (ej: "Ajuste (kg)").
