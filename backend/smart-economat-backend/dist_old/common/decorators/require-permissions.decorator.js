"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get PERMISSIONS_KEY () {
        return PERMISSIONS_KEY;
    },
    get PERMISSIONS_MODE_KEY () {
        return PERMISSIONS_MODE_KEY;
    },
    get RequirePermissions () {
        return RequirePermissions;
    }
});
const _common = require("@nestjs/common");
const PERMISSIONS_KEY = 'permissions';
const PERMISSIONS_MODE_KEY = 'permissions_mode';
const RequirePermissions = (...permissions)=>{
    return (target, propertyKey, descriptor)=>{
        if (propertyKey) {
            (0, _common.SetMetadata)(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
            (0, _common.SetMetadata)(PERMISSIONS_MODE_KEY, 'all')(target, propertyKey, descriptor);
        } else {
            (0, _common.SetMetadata)(PERMISSIONS_KEY, permissions)(target);
            (0, _common.SetMetadata)(PERMISSIONS_MODE_KEY, 'all')(target);
        }
    };
};

//# sourceMappingURL=require-permissions.decorator.js.map