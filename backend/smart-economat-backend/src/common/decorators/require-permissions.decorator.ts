/**
 * @module RequirePermissionsDecorator
 * Re-exports permission-related symbols from the Sherlock Auth module so that
 * feature modules can import `@RequirePermissions` from the common decorators
 * barrel without depending directly on the auth module path.
 *
 * Exported symbols:
 * - `PERMISSIONS_KEY`      – metadata key used to store required permissions
 * - `PERMISSIONS_MODE_KEY` – metadata key used to store the permission evaluation mode
 * - `RequirePermissions`   – decorator that grants access only when the user holds *all*
 *   of the listed permissions (AND logic)
 * - `RequireAnyPermission` – decorator that grants access when the user holds *any* of
 *   the listed permissions (OR logic)
 */

export {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
  RequirePermissions,
  RequireAnyPermission,
} from '../../modules/sherlock-auth/decorators/permissions.decorator';
