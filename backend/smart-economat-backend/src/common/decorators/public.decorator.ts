import { SetMetadata } from '@nestjs/common';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Ejecuta la lógica de public dentro del flujo de la aplicación.
 */
/**
 * Expone "Public" en smart-economat-backend (Nest).
 * @undefined {import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@nestjs/common/index").CustomDecorator<string>} Datos efectivos después de ejecutar la operación.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
