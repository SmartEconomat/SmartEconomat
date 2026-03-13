# Arquitectura UI: Módulo de Recepción (React)

Este documento detalla la estructura y organización de componentes en el Frontend para el flujo de Recepción de Pedidos (`Recepcion.tsx`).

## 1. Problema Original
Inicialmente, el archivo `Recepcion.tsx` centralizaba toda la lógica de negocio, manejo de estado (Drafts), y la declaración visual (UI) de los 4 pasos del "Wizard" de recepción, además de todos los modales adyacentes. Esto provocó que el archivo superara las 1,400 líneas de código, dificultando su legibilidad, mantenimiento y escalabilidad.

## 2. Nueva Arquitectura Basada en Componentes
Para adherirse al principio de *Single Responsibility* (Responsabilidad Única) y mejorar la separación de conceptos, el monolito visual fue dividido en múltiples submódulos puramente presentacionales y de flujo, ubicados en `src/components/recepcion/`.

### 2.1 Archivo Principal: `Recepcion.tsx` (Contenedor de Estado)
Ubicación: `src/pages/Recepcion.tsx`
- **Responsabilidad**: Actuar como el *Smart Component* (Componente Inteligente) o controlador general.
- **Funcionalidad**: 
  - Mantiene el estado global del proceso (`RecepcionDraft`), el cual se sincroniza con `localStorage`.
  - Gestiona los flujos de comunicación con los servicios del backend (`recepcion.service.ts`, `producto.service.ts`, `pedido.service.ts`).
  - Orquesta qué paso del Wizard mostrar (`activeStep`).
  - Provee las funciones de *callbacks* (ej. `handleUpdateLinea`, `handleSearch`) a sus componentes hijos.

### 2.2 Componentes de Flujo (Wizard Steps)
Ubicación: `src/components/recepcion/`

1. **`PasoSeleccionPedidos.tsx` (Paso 1)**
   - Pinta la lista de pedidos pendientes (`EstadoPedido.PENDIENTE`, `EN_PROCESO`, `PARCIAL`).
   - Permite expandir los detalles de un pedido y seleccionarlo total o parcialmente mediante checkboxes.

2. **`PasoEscaneo.tsx` (Paso 2)**
   - Representa la interfaz de lectura de códigos de barras (EAN-13 / ID).
   - Administra visualmente el control de la *Báscula* (`isScaleConnected`) y pinta las tablas cruzadas interactivas.
   - **Novedad**: Implementa parseo estricto de inputs numéricos, bloqueando letras (como 'e') y eliminando ceros a la izquierda para prevenir errores de digitación en las cantidades albarán/recibidas, sumado a *feedbacks* de color inmediatos (exceso, carencia o exactitud).

3. **`PasoRevision.tsx` (Paso 3)**
   - Componente de solo lectura/confirmación. Presenta un resumen total de la mercancía procesada, agrupada por proveedor.
   - **Novedad**: Evalúa activamente posibles discrepancias (diferencias de cantidad albarán vs pedida vs recibida, o estados no óptimos). Si detecta una discrepancia, **exige obligatoriamente** rellenar el campo de Notas/Discrepancias para poder avanzar.
   - Proporciona un campo ancho al final del formulario para capturar "Firma / Observaciones generales" de forma centralizada.

4. **`PasoResultado.tsx` (Paso 4)**
   - Es el componente de éxito u "Hoja de Impacto". Sólo se renderiza tras almacenar exitosamente la operación.
   - **Novedad**: Pinta atractivas tarjetas numéricas interactivas (StatCards) para exponer el impacto total de *Movimientos Generados*, *Lotes FEFO creados*, y *Nuevos Productos*.
   - Se apoya en una ventana contextual dinámica (`DetailModal.tsx`) con enlaces integrados (React Router) hacia los módulos de Inventario (`/inventario` y `/inventario/movimientos`) para facilitar el rastreo del inventario inyectado.

### 2.3 Componentes Auxiliares y Modales
Ubicación: `src/components/recepcion/`

- **`WeightScaleModal.tsx`**: Diálogo centrado que se comunica con el hardware de la báscula de piso/mostrador. Maneja visualmente su propio estado de *"Comunicando..."* y captura de peso en tiempo real.
- **`NewProductModal.tsx`**: Invocado desde `PasoEscaneo` al detectar un código de barras que no existe en la base de datos de SmartEconomat ni en los pedidos seleccionados. Pide obligatoriamente "Nombre", "Unidad", "Categoría" y "Marca".
- **`StatusChip.tsx`**: Pequeño componente visual reutilizable que mapea `EstadoPedido` y `EstadoLínea` a un chip de Material-UI con colores institucionales (verde, naranja, gris, rojo) de manera responsiva.

## 3. Beneficios Obtenidos
1. **Reducción de Deuda Técnica**: `Recepcion.tsx` pasó de ±1,460 líneas a ~850 líneas dedicadas de forma exclusiva al enrutamiento de datos.
2. **Reusabilidad**: Modales genéricos como `WeightScaleModal` o `StatusChip` ahora pueden ser consumidos por otras páginas (Ej. *Inventario Ciego* o *Punto de Venta*).
3. **Optimización de Renderizado**: Al separar cada paso en su propio componente React, se acotan los ciclos de renderizado. Los cambios locales en el Paso 2 de entrada de texto ya no provocarán reevaluaciones profundas en el Paso 1 o Paso 4.

---
*SmartEconomat Wiki - Marzo 2026*
