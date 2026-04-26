# Índice de arquitectura

Este índice reúne los documentos canónicos de arquitectura del proyecto. La navegación parte de aquí cuando se necesita entender cómo está organizado SmartEconomat y por qué se tomaron ciertas decisiones técnicas.

## Vista general

- [Backend](backend.md): visión arquitectónica del servidor NestJS.
- [Frontend](frontend.md): organización del cliente React y su modelo de sesión.
- [Modelo de datos](data-model.md): entidades, relaciones y agregados principales.

## Estructura y componentes

- [Estructura del backend](backend-structure.md): mapa de carpetas del backend.
- [NestJS + TypeORM](backend-nestjs-typeorm.md): stack y patrones de la capa servidor.
- [UI de inventario](ui-inventario.md): particularidades de la interfaz del módulo de inventario.
- [Referencia backend](reference/backend.md): resumen estructurado del backend para consulta rápida.

## Decisiones técnicas

- [Patrones y trade-offs](patrones-y-tradeoffs.md): decisiones de diseño, acoplamientos y costes asumidos.
- [UUID v7](uuid-v7.md): motivo y alcance del uso de UUID v7.
- [Soft delete](soft-delete.md): política de borrado lógico y efectos en dominio y operación.

## Diagramas y apoyo visual

- [Diagrama de arquitectura backend](../diagrams/arquitectura-backend.md)
- [Visión general del proyecto](../overview.md)

## Relacionado

- [Referencia de API](../reference/api/README.md)
- [Variables de entorno](../environment-variables.md)
- [Guia de despliegue](../deployment.md)
