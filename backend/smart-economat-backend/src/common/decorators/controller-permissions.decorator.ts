/**
 * @module ControllerPermissionsDecorator
 * Re-exports the `@ControllerPermissions` decorator from the Sherlock Auth module
 * so that feature controllers can import it from the common decorators barrel
 * without depending directly on the auth module path.
 */

export { ControllerPermissions } from '../../modules/sherlock-auth/decorators/permissions.decorator';
