import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

export const RequirePermissions = (...permissions: string[]) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>
  ) => {
    if (propertyKey) {
      SetMetadata(PERMISSIONS_KEY, permissions)(
        target,
        propertyKey,
        descriptor!
      );
      SetMetadata(PERMISSIONS_MODE_KEY, 'all')(
        target,
        propertyKey,
        descriptor!
      );
      return;
    }

    SetMetadata(
      PERMISSIONS_KEY,
      permissions
    )(target as (...args: unknown[]) => unknown);
    SetMetadata(
      PERMISSIONS_MODE_KEY,
      'all'
    )(target as (...args: unknown[]) => unknown);
  };
};

export const RequireAnyPermission = (...permissions: string[]) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>
  ) => {
    if (propertyKey) {
      SetMetadata(PERMISSIONS_KEY, permissions)(
        target,
        propertyKey,
        descriptor!
      );
      SetMetadata(PERMISSIONS_MODE_KEY, 'any')(
        target,
        propertyKey,
        descriptor!
      );
      return;
    }

    SetMetadata(
      PERMISSIONS_KEY,
      permissions
    )(target as (...args: unknown[]) => unknown);
    SetMetadata(
      PERMISSIONS_MODE_KEY,
      'any'
    )(target as (...args: unknown[]) => unknown);
  };
};

export const ControllerPermissions = (...permissions: string[]) => {
  return (target: object) => {
    SetMetadata(
      PERMISSIONS_KEY,
      permissions
    )(target as (...args: unknown[]) => unknown);
    SetMetadata(
      PERMISSIONS_MODE_KEY,
      'all'
    )(target as (...args: unknown[]) => unknown);
  };
};
