/**
 * @module DecoratorsBarrel
 * Barrel export for all custom NestJS decorators used throughout the SmartEconomat application.
 *
 * Includes:
 * - Permission decorators (`@RequirePermissions`, `@RequireAnyPermission`)
 * - Visibility decorators (`@Public`)
 * - Controller-level access helpers (`@ControllerPermissions`, `@Resource`)
 * - Data normalisation decorators (`@NormalizeString`, `@Trim`, etc.)
 * - Query sorting helpers (`@SortableFields`)
 */

export * from './require-permissions.decorator';
export * from './require-any-permission.decorator';
export * from './public.decorator';
export * from './controller-permissions.decorator';
export * from './resource.decorator';
export * from './normalize.decorator';
export * from './sortable-fields.decorator';
