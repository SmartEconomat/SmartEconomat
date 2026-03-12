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
    get RESOURCE_KEY () {
        return RESOURCE_KEY;
    },
    get Resource () {
        return Resource;
    }
});
const _common = require("@nestjs/common");
const RESOURCE_KEY = 'resource';
const Resource = (resource)=>(0, _common.SetMetadata)(RESOURCE_KEY, resource);

//# sourceMappingURL=resource.decorator.js.map