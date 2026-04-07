# Módulo de Albaranes

## Propósito

El módulo de albaranes gestiona el documento que acompaña a una entrega o recepción y permite conservar tanto la metadata del albarán como su documento adjunto cuando existe.

Su función no es sustituir a `recepcion` ni a `pedido`, sino aportar la capa documental que vincula una entrega física o digital con el flujo operativo de compras.

## Responsabilidad funcional

Este módulo cubre:

- creación y edición de albaranes;
- subida y recuperación del documento binario asociado;
- relación entre albarán, recepción y referencias operativas;
- trazabilidad documental del proceso de entrega.

## Relación con otros módulos

- `recepcion`: un albarán puede asociarse a una recepción o a su contexto operativo.
- `pedido`: el documento sirve como soporte del flujo de compra y entrega.
- `archivo`: comparten la idea de binario gestionado, pero `albaran` pertenece a un flujo de negocio específico.

## Controller principal

- `albaran.controller.ts`

## Operaciones principales

- crear un albarán con su referencia y datos básicos;
- subir un PDF o imagen del documento;
- listar albaranes por filtros operativos;
- consultar detalle y descargar el binario asociado;
- corregir o eliminar registros cuando proceda.

## Contrato HTTP relacionado

La referencia detallada de endpoints está en `wiki/reference/api/compras-recepciones-e-incidencias.md`.

Rutas principales:

- `POST /albaranes`
- `POST /albaranes/upload-documento`
- `GET /albaranes/documento/:filename`
- `GET /albaranes`
- `GET /albaranes/:id`
- `PATCH /albaranes/:id`
- `DELETE /albaranes/:id`

## Consideraciones de diseño

- El documento binario forma parte del flujo de negocio del albarán y no debe tratarse como un archivo genérico sin contexto.
- La metadata del albarán y el documento adjunto deben mantenerse sincronizados desde la perspectiva operativa.
- La consulta del binario no usa el mismo patrón de respuesta JSON que los endpoints de metadata.

## Cuándo consultar esta documentación

Usa este documento cuando necesites entender para qué existe el módulo de albaranes y cuándo debe intervenir dentro del flujo de recepción o entrega. Para payloads, DTOs y respuestas concretas, salta a la referencia API.

## Documentos relacionados

- `wiki/reference/api/compras-recepciones-e-incidencias.md`
- `wiki/modules/recepcion/README.md`
- `wiki/modules/recepcion/recepcion-masiva.md`
