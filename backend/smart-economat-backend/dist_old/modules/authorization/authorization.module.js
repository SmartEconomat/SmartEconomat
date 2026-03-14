"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthorizationModule", {
    enumerable: true,
    get: function() {
        return AuthorizationModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _cachemanager = require("@nestjs/cache-manager");
const _authorizationservice = require("./services/authorization.service");
const _permisosguard = require("./guards/permisos.guard");
const _usuarioentity = require("../usuario/usuario.entity/usuario.entity");
const _permisoentity = require("../permisos/entities/permiso.entity");
const _permisosmodule = require("../permisos/permisos.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthorizationModule = class AuthorizationModule {
};
AuthorizationModule = _ts_decorate([
    (0, _common.Global)(),
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _usuarioentity.Usuario,
                _permisoentity.Permiso
            ]),
            _cachemanager.CacheModule.register({
                ttl: 300,
                max: 1000
            }),
            (0, _common.forwardRef)(()=>_permisosmodule.PermisosModule)
        ],
        providers: [
            _authorizationservice.AuthorizationService,
            _permisosguard.PermisosGuard
        ],
        exports: [
            _authorizationservice.AuthorizationService,
            _permisosguard.PermisosGuard
        ]
    })
], AuthorizationModule);

//# sourceMappingURL=authorization.module.js.map