"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlantillasRolesModule", {
    enumerable: true,
    get: function() {
        return PlantillasRolesModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _plantillarolentity = require("./entities/plantilla-rol.entity");
const _plantillarolpermisoentity = require("./entities/plantilla-rol-permiso.entity");
const _plantillasrolesservice = require("./service/plantillas-roles.service");
const _permisosmodule = require("../permisos/permisos.module");
const _rolesmodule = require("../roles/roles.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PlantillasRolesModule = class PlantillasRolesModule {
};
PlantillasRolesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _plantillarolentity.PlantillaRol,
                _plantillarolpermisoentity.PlantillaRolPermiso
            ]),
            _permisosmodule.PermisosModule,
            _rolesmodule.RolesModule
        ],
        providers: [
            _plantillasrolesservice.PlantillasRolesService
        ],
        exports: [
            _plantillasrolesservice.PlantillasRolesService,
            _typeorm.TypeOrmModule
        ]
    })
], PlantillasRolesModule);

//# sourceMappingURL=plantillas-roles.module.js.map