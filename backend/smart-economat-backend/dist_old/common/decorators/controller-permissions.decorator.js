'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ControllerPermissions', {
  enumerable: true,
  get: function () {
    return ControllerPermissions;
  },
});
const _common = require('@nestjs/common');
const _requirepermissionsdecorator = require('./require-permissions.decorator');
const ControllerPermissions = (...permissions) => {
  return (target) => {
    (0, _common.SetMetadata)(
      _requirepermissionsdecorator.PERMISSIONS_KEY,
      permissions
    )(target);
    (0, _common.SetMetadata)(
      _requirepermissionsdecorator.PERMISSIONS_MODE_KEY,
      'all'
    )(target);
  };
};
