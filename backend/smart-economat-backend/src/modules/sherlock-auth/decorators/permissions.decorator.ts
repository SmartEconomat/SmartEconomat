import { SetMetadata, applyDecorators } from '@nestjs/common';

/** Constantes públicas (PERMISSIONS_KEY) expuestas en smart-economat-backend (Nest). */
export const PERMISSIONS_KEY = 'permissions';
/** Constantes públicas (PERMISSIONS_MODE_KEY) expuestas en smart-economat-backend (Nest). */
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

/**
 * Ejecuta la lógica de require permissions dentro del flujo de la aplicación.
 *
 * @param permissions Parámetro de entrada para la operación.
 */
/**
 * Expone "RequirePermissions" en smart-economat-backend (Nest).
 * @undefined {string[]} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {<TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void} Datos efectivos después de ejecutar la operación.
 */
export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'all')
  );

/**
 * Ejecuta la lógica de require any permission dentro del flujo de la aplicación.
 *
 * @param permissions Parámetro de entrada para la operación.
 */
/**
 * Expone "RequireAnyPermission" en smart-economat-backend (Nest).
 * @undefined {string[]} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {<TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void} Datos efectivos después de ejecutar la operación.
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'any')
  );

/**
 * Ejecuta la lógica de controller permissions dentro del flujo de la aplicación.
 *
 * @param permissions Parámetro de entrada para la operación.
 */
/**
 * Expone "ControllerPermissions" en smart-economat-backend (Nest).
 * @undefined {string[]} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {<TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void} Datos efectivos después de ejecutar la operación.
 */
export const ControllerPermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'all')
  );
