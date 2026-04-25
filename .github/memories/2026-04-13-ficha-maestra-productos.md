# Memoria Técnica: Evolución de la Ficha Maestra de Productos
**Fecha:** 13 de Abril, 2026
**Contexto:** Optimización de la elasticidad del catálogo y rediseño UX/UI del módulo de productos.

## 🏁 Objetivos Alcanzados
- Lograr que el catálogo permita registrar productos sin proveedores inmediatos (elasticidad).
- Unificar la gestión de costes mediante un "Precio de Referencia Maestro".
- Rediseñar el formulario de producto para una estética premium y responsiva.

## 🧠 Decisiones de Diseño y Arquitectura

### 1. Sincronización de Costes (Backend)
Se ha implementado una lógica de "Coste Único de Verdad":
- El campo `pmp` (Precio Medio Ponderado) es el dato real derivado de compras.
- El campo `precioReferencia` es el dato maestro para escandallos.
- **Regla**: Al recalcular el `pmp`, si el resultado es `> 0`, el sistema sincroniza automáticamente el `precioReferencia`. Esto asegura que los costes de producción siempre usen el precio real más reciente sin intervención manual.

### 2. Layout Lateral Responsivo (Frontend)
Para mejorar la usabilidad en pantallas medianas/grandes, se ha abandonado el layout puramente vertical:
- **Distribución 25/75 (Imagen/Campos)**: La imagen ahora se sitúa a la izquierda (Grid md:3) y los campos comerciales a la derecha (Grid md:9).
- **Alineación Vertical**: Se aplica `alignItems: center` para que la imagen se mantenga centrada frente al bloque de Nombre/Descripción, evitando espacios vacíos asimétricos.
- **Micro-diseño Técnico**: Los datos técnicos se han consolidado en una fila de 4 campos (25% cada uno) para aumentar la densidad de información sin sacrificar legibilidad.
- **EAN Maestro**: Se ha aislado en una línea independiente de ancho completo para facilitar la interacción y el escaneo.

### 3. Estrategia de Visibilidad (UX)
- **Hiding de Redundancia**: Si existe un `pmp > 0`, la UI oculta el campo "Precio de Referencia" en las vistas de lectura (tarjetas y detalles) para evitar confusión. Solo se muestra como fallback (etiquetado como `(Ref.)`) si no hay historial de compras.
- **Avisos de Suministro**: Se introdujo el chip "Sin Prov." para alertar visualmente sobre productos que aún no tienen cadena de suministro vinculada.

## 🛠️ Notas Técnicas
- Componente clave modificado: `DynamicFormModal.tsx` (ahora soporta layouts laterales responsivos y grids en filas 'bottom').
- Servicio afectado: `ProductoService.recalcularPmpProducto`.

---
*Esta memoria sirve como base para futuros ajustes en el módulo de producción y compras.*
