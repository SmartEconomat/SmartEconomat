import { SetMetadata } from '@nestjs/common';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export const RESOURCE_KEY = 'resource';

/**
 * Ejecuta la lógica de resource dentro del flujo de la aplicación.
 *
 * @param resource Parámetro de entrada para la operación.
 */
/**
 * Expone "Resource" en smart-economat-backend (Nest).
 * @undefined {string} resource - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@nestjs/common/index").CustomDecorator<string>} Datos efectivos después de ejecutar la operación.
 */
export const Resource = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);
