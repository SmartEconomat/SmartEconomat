# Módulo de Producción y Gestión de Raciones

## Introducción

El módulo de producción permite transformar ingredientes (materias primas) en productos elaborados (preparaciones) a través de la ejecución de recetas. Una de las innovaciones clave es la gestión de **Raciones**, que permite llevar un control exacto de cuántas porciones individuales se han producido y cuántas quedan disponibles para su consumo.

---

## Flujo de Producción (Receta a Lote)

Cuando una receta se ejecuta, el sistema realiza las siguientes operaciones transaccionales:

1.  **Cálculo de Consumos**: Se calcula la cantidad necesaria de cada ingrediente basándose en el rendimiento de la receta y la cantidad total a producir.
2.  **Descuento de Inventario (FIFO)**: Se descuentan las cantidades del inventario, priorizando aquellos lotes de materia prima con fecha de caducidad más cercana.
3.  **Cálculo de Coste Real**: El sistema suma el coste exacto de los ingredientes utilizados (basado en el precio de compra de los lotes consumidos) para determinar el `coste_total_real`.
4.  **Generación de Lote de Producción**: Se crea un registro en `ProduccionLote` con el estado `DISPONIBLE`.
5.  **Entrada en Inventario**: El producto resultante de la receta se añade automáticamente al inventario.
6.  **Sincronización de Alérgenos**: Los alérgenos de todos los ingredientes utilizados se heredan automáticamente en el producto final si no estaban ya presentes.

---

## Gestión de Raciones

El sistema permite definir cómo se divide la producción en porciones:

-   **Tamaño de ración**: Si la receta define un `tamanioRacion`, el número de raciones se calcula dividiendo la cantidad producida entre dicho tamaño.
-   **Número de raciones fijo**: Si no hay tamaño definido, se utiliza el campo `raciones` de la receta como base proporcional al rendimiento.
-   **Decimales permitidos**: Tanto `raciones` como `tamanioRacion` aceptan valores decimales, incluido formato con coma decimal (`1,5`).

### Estados del Lote
-   **Disponible**: El lote tiene raciones restantes (`porciones_restantes > 0`).
-   **Agotado**: Todas las raciones han sido marcadas como consumidas.

### Endpoint de Consumo
El sistema expone un endpoint `PATCH /produccion/lote/:id/consumir` para decrementar las raciones restantes a medida que se sirven o utilizan, sin necesidad de realizar movimientos manuales de inventario complejos.

### Reglas de consumo en UI

- La bolsa de preparaciones permite consumir por `raciones` o por `cantidad/peso`.
- Las raciones restantes se gestionan con precisión de 3 decimales.
- Si el usuario intenta consumir más cantidad de la disponible:
	- el formulario no permite confirmar la operación;
	- se lanza un `toast` de advertencia;
	- el valor se ajusta al máximo disponible.

---

## Componentes Técnicos

### Backend
-   **Entidad**: `ProduccionLote`
-   **Servicio**: `ProduccionService`
-   **Controlador**: `ProduccionController`
-   **Enum**: `EstadoLote` (`disponible`, `agotado`)

### Frontend
-   **Página**: `Preparaciones.tsx` (Bolsa de Preparaciones)
-   **Servicio**: `produccion.service.ts`
-   **Componente de Selección**: `ProductoResultadoSelector` (para vincular recetas con productos del catálogo)

---

## Auditoría y Trazabilidad

Cada ejecución de producción genera dos tipos de movimientos en el historial:
1.  `PRODUCCION_CONSUMO`: Para cada ingrediente retirado del inventario.
2.  `PRODUCCION_RESULTADO`: Para la entrada de la preparación final en el inventario.

Ambos movimientos quedan vinculados al ID del lote de producción para una trazabilidad completa (Quién, Cuándo y Con Qué).
