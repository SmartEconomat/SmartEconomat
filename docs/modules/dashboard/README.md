# Módulo de Dashboard

## Propósito

El módulo `dashboard` expone KPIs y agregados pensados para el panel principal de la aplicación. Su papel es ofrecer una vista resumida del estado operativo del sistema sin convertirse en fuente de verdad de cada dominio.

## Responsabilidad funcional

Este módulo cubre:

- agregación de métricas clave para el panel principal;
- lectura consolidada de datos provenientes de otros módulos;
- exposición de un contrato optimizado para consumo de UI.

## Principio clave

El dashboard resume, pero no reemplaza, los módulos de origen. Si una métrica del panel entra en conflicto con un detalle operativo, la fuente de verdad sigue estando en el módulo de negocio correspondiente.

## Controller principal

- `dashboard.controller.ts`

## Contrato HTTP relacionado

La referencia detallada está en `wiki/reference/api/usuarios-admin-y-seguridad.md`.

Ruta principal:

- `GET /dashboard/stats`

## Dependencias funcionales habituales

Aunque el dashboard tenga un endpoint compacto, su semántica depende del estado de otros módulos como:

- `pedido`
- `recepcion`
- `inventario`
- `incidencia`
- `usuario`

## Consideraciones de diseño

- El contrato está orientado a lectura y agregación.
- Los KPIs deben entenderse como resumen operativo, no como modelo de dominio independiente.
- Si cambian definiciones de negocio en módulos fuente, el dashboard debe revisarse para mantener coherencia.

## Documentos relacionados

- `wiki/reference/api/usuarios-admin-y-seguridad.md`
- `wiki/architecture/backend.md`
