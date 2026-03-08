import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para el recurso ABAC
 */
export const RESOURCE_KEY = 'resource';

/**
 * Decorador para especificar el recurso en un contexto ABAC (Attribute-Based Access Control).
 * Este decorador es opcional y está diseñado para futuras implementaciones de ABAC.
 *
 * Permite especificar el tipo de recurso sobre el que se está operando,
 * lo que puede usarse para validaciones más complejas basadas en atributos.
 *
 * @param resource - Nombre del recurso (ej: 'usuario', 'producto', 'pedido')
 *
 * @example
 * ```typescript
 * @Patch(':id')
 * @Resource('usuario')
 * @RequirePermissions('usuarios:editar')
 * update(@Param('id') id: string) {
 *   // En el futuro, se podría validar si el usuario puede editar
 *   // este recurso específico basado en atributos adicionales
 *   // (ej: propietario, departamento, etc.)
 * }
 * ```
 */
export const Resource = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);
