'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RequireAnyPermission', {
  enumerable: true,
  get: function () {
    return RequireAnyPermission;
  },
});
const _common = require('@nestjs/common');
const _requirepermissionsdecorator = require('./require-permissions.decorator');
const RequireAnyPermission = (...permissions) => {
  return (target, propertyKey, descriptor) => {
    if (propertyKey) {
      (0, _common.SetMetadata)(
        _requirepermissionsdecorator.PERMISSIONS_KEY,
        permissions
      )(target, propertyKey, descriptor);
      (0, _common.SetMetadata)(
        _requirepermissionsdecorator.PERMISSIONS_MODE_KEY,
        'any'
      )(target, propertyKey, descriptor);
    } else {
      (0, _common.SetMetadata)(
        _requirepermissionsdecorator.PERMISSIONS_KEY,
        permissions
      )(target);
      (0, _common.SetMetadata)(
        _requirepermissionsdecorator.PERMISSIONS_MODE_KEY,
        'any'
      )(target);
    }
  };
};
