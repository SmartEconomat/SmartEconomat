# Módulo de Archivos

## Propósito

El módulo `archivo` gestiona ficheros genéricos del sistema cuando estos no pertenecen exclusivamente a un flujo documental específico como el de albaranes.

## Responsabilidad funcional

Este módulo cubre:

- subida de archivos al sistema;
- persistencia de metadata asociada;
- listado y consulta de archivos existentes;
- entrega del contenido binario por nombre de fichero;
- borrado lógico de registros documentales cuando aplica.

## Controller principal

- `archivo.controller.ts`

## Contrato HTTP relacionado

La referencia detallada está en `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md`.

Rutas principales:

- `POST /archivos/upload`
- `GET /archivos`
- `GET /archivos/:id`
- `GET /archivos/content/:filename`
- `DELETE /archivos/:id`

## Diferencia frente a `albaran`

- `archivo` sirve para gestión genérica de ficheros del sistema.
- `albaran` gestiona un documento adjunto que forma parte de un flujo de compras y recepción.

Cuando el binario tenga semántica propia de negocio, conviene documentarlo desde su módulo principal y no tratarlo solo como archivo genérico.

## Consideraciones de diseño

- La subida devuelve metadata normalizada, no solo confirmación binaria.
- La consulta del contenido usa una ruta de archivo y no el envelope JSON estándar.
- La metadata y el binario deben mantenerse trazables desde el backend.

## Documentos relacionados

- `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md`
- `wiki/modules/albaran/README.md`
