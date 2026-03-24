# Explicación: Por qué estos patrones y sus trade-offs

## Decisión 1: Arquitectura modular por dominio
### Por qué
Permite que cada contexto (pedidos, inventario, auth, etc.) evolucione de forma relativamente independiente.

### Trade-off
Incrementa el número de piezas de configuración y la coordinación entre módulos.

## Decisión 2: DTO + validación fuerte en borde
### Por qué
Evita propagar datos inválidos hacia el dominio y la base de datos.

### Trade-off
Más mantenimiento cuando cambian contratos de API.

## Decisión 3: RBAC con permisos granulares
### Por qué
Permite controlar acciones de forma fina (`modulo:accion`) y delegar administración sin hardcode.

### Trade-off
Matriz de permisos más grande y necesidad de auditoría frecuente.

## Decisión 4: Soft-delete por defecto
### Por qué
Conserva trazabilidad histórica y mejora recuperación operativa.

### Trade-off
Consultas más complejas cuando se incluyen eliminados lógicos.

## Decisión 5: Transacciones explícitas en casos críticos
### Por qué
Garantiza integridad de operaciones multi-entidad.

### Trade-off
Mayor complejidad técnica y cuidado extra en manejo de errores.

## Decisión 6: i18n en validaciones y errores
### Por qué
Permite mensajes coherentes y localizados para equipos y usuarios.

### Trade-off
Dependencia de catálogos de traducciones alineados con DTO y filtros.
