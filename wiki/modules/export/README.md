# Módulo de Exportación

## Propósito

El módulo `export` centraliza la generación de salidas documentales en formatos como XLSX y PDF para distintas áreas del sistema.

## Responsabilidad funcional

Este módulo cubre:

- exportaciones tabulares a XLSX;
- exportaciones documentales a PDF;
- aplicación de filtros por query sobre recursos de negocio;
- entrega directa de binarios listos para descarga.

## Controller principal

- `export.controller.ts`

## Contrato HTTP relacionado

La referencia detallada está en `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md`.

Áreas exportables documentadas actualmente:

- productos
- pedidos
- proveedores
- albaranes
- incidencias
- inventario
- movimientos
- recepciones
- recetas
- ubicaciones
- usuarios

## Comportamiento relevante

- Los endpoints de exportación devuelven binarios y no usan el envelope JSON habitual.
- El módulo actúa como capa de salida sobre datos que siguen perteneciendo a otros dominios.
- Los filtros de exportación deben permanecer alineados con los filtros válidos del módulo fuente.

## Cuándo usar esta documentación

Usa este documento para entender el rol del módulo y su relación con el resto del backend. Para la lista exacta de endpoints y filtros, consulta la referencia API.

## Documentos relacionados

- `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md`
- `wiki/reference/endpoints.md`
